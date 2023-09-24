'use strict';

var msg = mp.msg;
var utils = mp.utils;
var commands = require('../script-modules/commands');
var HttpClient = require('../script-modules/HttpClient');
var io = require('../script-modules/io');
var p = require('../script-modules/path');
var u = require('../script-modules/utils');

var options = {
    check_config_interval: 7,
    check_mpv_update: false,
    check_mpv_repo: 'shinchiro/mpv-winbuild-cmake',
    check_mpv_interval: 1,
    http_proxy: '',
};
mp.options.read_options(options, 'check_update');
var checking_state = {};
var state = {
    http_proxy: options.http_proxy || mp.get_property_native('http_proxy'),
    os: require('../script-modules/DetectOS')(),
};

if (!HttpClient.available) {
    msg.error('检查更新不可用: 未找到 curl');
    exit();
}

var http = new HttpClient({
    timeout: mp.get_property_native('network-timeout'),
    proxy: state.http_proxy,
});
var tools = {
    git: u.which('git'),
};

/**
 * @param {number} last_time
 * @param {number} interval
 * @returns {boolean}
 */
function check_interval(last_time, interval) {
    return Date.now() - last_time >= interval;
}

/**
 * @param {string} name
 * @returns {string}
 */
function cache_path(name) {
    return u.string_format(p.get_state_path() + '/check-update_%s.json', name);
}

/**
 * @param {number} interval
 * @returns {number}
 */
function parse_interval(interval) {
    return interval * 86400 * 1000;
}

/**
 * @param {string} name
 * @returns {object}
 */
function read_cache(name) {
    var path = cache_path(name);
    var result = {};
    if (io.file_exist(path)) {
        try {
            result = JSON.parse(utils.read_file(path));
        } catch (ex) {
        }
    }
    return result;
}

/**
 * @param {string} name
 * @param {object} data
 * @returns {boolean}
 */
function write_cache(name, data) {
    var path = cache_path(name);
    try {
        utils.write_file('file://' + path, JSON.stringify(data));
    } catch (ex) {
        msg.verbose(ex.message);
        msg.warn(u.string_format('缓存文件写入失败 (%s)', name));
        return false;
    }
    return true;
}

/**
 * @returns {number|null}
 */
function get_config_local_version() {
    var local_version_file = commands.expand_path('~~/.commit_time');
    var result = null;
    if (io.file_exist(local_version_file)) {
        result = parseInt(utils.read_file(local_version_file));
    } else if (tools.git) {
        var process = commands.subprocess([tools.git, '-C', commands.expand_path('~~/'), 'log', '-1', '--format=%ct']);
        if (process.status === 0) {
            result = parseInt(process.stdout) * 1000;
        }
    }
    return isNaN(result) ? null : result;
}

/**
 * @returns {string|null}
 */
function get_mpv_local_version() {
    var mpv_version = mp.get_property_native('mpv-version').trim();
    var matches = mpv_version.match(/-g([a-z0-9-]{7})/);
    return matches === null ? null : matches[1];
}

/**
 * @param {Function} cb
 */
function get_config_remote_version(cb) {
    http.get('https://api.github.com/repos/Hill-98/mpv-config/commits/main', {
        headers: {
            'Accept': 'application/vnd.github+json',
        },
    }, function (err, response) {
        if (err || response.status_code !== 200) {
            msg.verbose(err || response.status_text);
            cb('未获取到最新版本');
            return;
        }
        if (typeof response.data !== 'object') {
            cb('获取到的数据格式无效');
            return;
        }
        cb(null, Date.parse(response.data.commit.committer.date));
    });
}

/**
 * @param {string} remote_repo
 * @param {Function} cb
 */
function get_mpv_remote_version(remote_repo, cb) {
    http.get(u.string_format('https://api.github.com/repos/%s/releases/latest', remote_repo), {
        headers: {
            'Accept': 'application/vnd.github+json',
        },
    }, function (err, response) {
        if (err || response.status_code !== 200) {
            msg.verbose(err || response.status_text);
            cb('未获取到最新版本');
            return;
        }
        if (typeof response.data !== 'object') {
            cb('获取到的数据格式无效');
            return;
        }
        var json = response.data;
        for (var i = 0; i < json.assets.length; i++) {
            /** @type {string} */
            var name = json.assets[i].name;
            if (name.indexOf('mpv-x86_64-') !== 0) {
                continue;
            }
            var name_matches = name.match(/-([\w]+-git-[a-z0-9]{7})/);
            var version_matches = name.match(/-git-([a-z0-9-]{7})/);
            if (version_matches !== null) {
                cb(null, {
                    name: name_matches === null ? null : name_matches[1],
                    version: version_matches[1],
                });
                return;
            }
        }
        cb('未找到指定的远程版本');
    });
}

function check_config_update(force) {
    var idx = 'config';

    if (checking_state[idx] === true) {
        mp.osd_message('正在检查配置文件是否有新版本...');
        return;
    }
    checking_state[idx] = true;

    var cache = read_cache(idx);
    var cache_valid = typeof cache.last_check_update_time === 'number' && typeof cache.remote_commit_time === 'number';
    var check_update_interval = parse_interval(options.check_config_interval);
    var local_commit_time = get_config_local_version();

    if (local_commit_time === null) {
        msg.error('检查配置文件更新失败: 未获取到本地版本');
        checking_state[idx] = false;
        return;
    }

    var compare_version = function compare_version(a, b) {
        if (a >= b) {
            return false;
        }
        var date = new Date(b);
        var text = '检查到配置文件新版本: ' + date.toLocaleString();
        var osd = mp.create_osd_overlay('ass-events');
        osd.data = text;
        osd.update();
        msg.info(text);
        setTimeout(function () {
            osd.remove();
        }, 3000);
        return true;
    };

    if (force || !cache_valid || check_interval(cache.last_check_update_time, check_update_interval)) {
        get_config_remote_version(function (err, remote_commit_time) {
            if (err) {
                msg.error('检查配置文件更新失败: ' + err);
                checking_state[idx] = false;
                return;
            }
            var has_new = compare_version(local_commit_time, remote_commit_time);
            var cache = {
                last_check_update_time: Date.now(),
                remote_commit_time: remote_commit_time,
            };
            write_cache(idx, cache);
            if (!has_new && force) {
                msg.info('本地配置文件版本已经是最新的了');
            }
            checking_state[idx] = false;
        });
    } else {
        compare_version(local_commit_time, cache.remote_commit_time);
        checking_state[idx] = false;
    }
}

function check_mpv_update(force) {
    var idx = 'mpv';

    if (checking_state[idx] === true) {
        mp.osd_message('正在检查 mpv 是否有新版本...');
        return;
    }
    checking_state[idx] = true;

    var cache = read_cache(idx);
    var cache_valid = typeof cache.last_check_update_time === 'number' && typeof cache.local_version === 'string' && typeof cache.remote_version === 'string';
    /** @type {string} */
    var check_update_interval = parse_interval(options.check_mpv_interval);
    var local_version = get_mpv_local_version();
    var remote_repo = options.check_mpv_repo;

    if (local_version === null) {
        msg.error('检查 MPV 更新失败: 未获取到本地版本');
        checking_state[idx] = false;
        return;
    }

    var compare_version = function compare_version(a, b, s) {
        if (a === b) {
            return false;
        }
        var text = '检查到 mpv 新版本: ' + (s || b);
        var osd = mp.create_osd_overlay('ass-events');
        osd.data = text;
        osd.update();
        msg.info(text);
        setTimeout(function () {
            osd.remove();
        }, 3000);
        return true;
    };

    if (force || !cache_valid || check_interval(cache.last_check_update_time, check_update_interval) || cache.local_version !== local_version || cache.remote_repo !== remote_repo) {
        get_mpv_remote_version(remote_repo, function (err, remote) {
            if (err) {
                msg.error('检查 mpv 更新失败：' + err);
                checking_state[idx] = false;
                return;
            }
            var has_new = compare_version(local_version, remote.version, remote.name);
            var cache = {
                last_check_update_time: Date.now(),
                local_version: local_version,
                remote_repo: remote_repo,
                remote_version: remote.version,
                remote_version_name: remote.name,
            };
            write_cache(idx, cache);
            if (!has_new && force) {
                msg.info('本地 mpv 版本已经是最新的了');
            }
            checking_state[idx] = false;
        });
    } else {
        compare_version(local_version, cache.remote_version, cache.remote_version_name);
        checking_state[idx] = false;
    }
}

mp.register_script_message('check-update/config', function () {
    check_config_update(true);
});

mp.register_script_message('check-update/mpv', function () {
    check_mpv_update(true);
});

check_config_update();
if (options.check_mpv_update) {
    check_mpv_update();
}
