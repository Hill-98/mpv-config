'use strict';

var msg = mp.msg;
var utils = mp.utils;
var commands = require('../script-modules/commands');
var HttpClient = require('../script-modules/HttpClient');
var u = require('../script-modules/utils');
var options = {
    check_config_interval: 7,
    check_mpv_update: false,
    check_mpv_repo: 'shinchiro/mpv-winbuild-cmake',
    check_mpv_interval: 1,
    http_proxy: '',
};
mp.options.read_options(options, 'check_update');
var state = {
    http_proxy: options.http_proxy || mp.get_property_native('http_proxy') || utils.getenv('http_proxy'),
    os: u.detect_os(),
};

if (!HttpClient.available) {
    msg.error('检查更新不可用: 未找到 curl');
    exit();
}

var http = new HttpClient({
    timeout: 5,
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
    var path = commands.expand_path(u.string_format('~/.cache/mpv/check-update_%s.json', name));
    var result = {};
    if (u.file_exist(path)) {
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
    var path = commands.expand_path(u.string_format('~/.cache/mpv/check-update_%s.json', name));
    try {
        utils.write_file('file://' + path, JSON.stringify(data));
    } catch (ex) {
        msg.verbose(ex.message);
        msg.warn(u.string_format('缓存文件写入失败 (%s)', name));
        return false;
    }
    return true;
}

function check_config_update() {
    var local_version_file = commands.expand_path('~~/.commit_time');
    var cache = read_cache('config');
    var cache_valid = typeof cache.last_check_update_time === 'number' && typeof cache.remote_commit_time === 'number';
    var check_update_interval = parse_interval(options.check_config_interval);
    var local_commit_time = undefined;

    if (u.file_exist(local_version_file)) {
        local_commit_time = parseInt(utils.read_file(local_version_file));
    } else if (tools.git) {
        var process = commands.subprocess([tools.git, '-C', commands.expand_path('~~/'), 'log', '-1', '--format=%ct']);
        if (process.status === 0) {
            var t = parseInt(process.stdout);
            local_commit_time = t ? t * 1000 : undefined;
        }
    }
    if (!local_commit_time) {
        msg.warn('检查配置文件更新失败: 未获取到本地版本');
        return;
    }

    var compare_version = function compare_version(a, b) {
        if (a >= b) {
            return;
        }
        var date = new Date(b);
        var osd = mp.create_osd_overlay('ass-events');
        osd.data = '检查到配置文件新版本: ' + date.toLocaleString();
        osd.update();
        setTimeout(function () {
            osd.remove();
        }, 3000);
    };

    if (!cache_valid || check_interval(cache.last_check_update_time, check_update_interval)) {
        http.get('https://api.github.com/repos/Hill-98/mpv-config/commits/main', {
            headers: {
                'Accept': 'application/vnd.github+json',
            },
        }, function (err, response) {
            if (err || response.status_code !== 200) {
                msg.verbose(err || response.status_text);
                msg.error('检查配置文件更新失败: 未获取到最新版本');
                return;
            }
            if (typeof response.data !== 'object') {
                msg.error('检查配置文件更新失败: 数据解析错误');
                return;
            }
            var json = response.data;
            var remote_commit_time = Date.parse(json.commit.committer.date);
            compare_version(local_commit_time, remote_commit_time);
            var cache = {
                last_check_update_time: Date.now(),
                remote_commit_time: remote_commit_time,
            };
            write_cache('config', cache);
        });
    } else {
        compare_version(local_commit_time, cache.remote_commit_time);
    }
}

function check_mpv_update() {
    var cache = read_cache('mpv');
    var cache_valid = typeof cache.last_check_update_time === 'number' && typeof cache.local_version === 'string' && typeof cache.remote_version === 'string';
    /** @type {string} */
    var mpv_version = mp.get_property_native('mpv-version').trim();
    var check_update_interval = parse_interval(options.check_mpv_interval);
    var remote_repo = options.check_mpv_repo;
    var matches = mpv_version.match(/-g([a-z0-9-]{7})/);

    if (matches === null) {
        msg.warn('检查 MPV 更新失败: 未获取到本地 mpv 版本');
        return;
    }

    var compare_version = function compare_version(a, b, s) {
        if (a === b) {
            return;
        }
        var osd = mp.create_osd_overlay('ass-events');
        osd.data = '检查到 mpv 新版本: ' + (s || b);
        osd.update();
        setTimeout(function () {
            osd.remove();
        }, 3000);
    };
    var local_version = matches[1];

    if (!cache_valid || check_interval(cache.last_check_update_time, check_update_interval) || cache.local_version !== local_version || cache.remote_repo !== remote_repo) {
        http.get(u.string_format('https://api.github.com/repos/%s/releases/latest', remote_repo), {
            headers: {
                'Accept': 'application/vnd.github+json',
            },
        }, function (err, response) {
            if (err || response.status_code !== 200) {
                msg.verbose(err || response.status_text);
                msg.error('检查 mpv 更新失败: 未获取到最新版本');
                return;
            }
            if (typeof response.data !== 'object') {
                msg.error('检查 mpv 更新失败: 数据解析错误');
                return;
            }
            var json = response.data;
            var not_found = true;
            var assets_prefix = 'mpv-x86_64-';
            for (var i = 0; i < json.assets.length; i++) {
                /** @type {string} */
                var name = json.assets[i].name;
                if (name.indexOf(assets_prefix) !== 0) {
                    continue;
                }
                var matches = name.match(/-git-([a-z0-9-]{7})/);
                if (matches !== null) {
                    var remote_version = matches[1];
                    matches = name.match(/-([\w]+-git-[a-z0-9]{7})/);
                    var remote_version_name = matches === null ? null : matches[1];
                    compare_version(local_version, remote_version, remote_version_name);
                    var cache = {
                        last_check_update_time: Date.now(),
                        local_version: local_version,
                        remote_repo: remote_repo,
                        remote_version: remote_version,
                        remote_version_name: remote_version_name,
                    };
                    write_cache('mpv', cache);
                    var not_found = false;
                    break;
                }
            }
            if (not_found) {
                msg.error('检查 mpv 更新失败: 未找到对应的远程版本');
            }
        });
    } else {
        compare_version(local_version, cache.remote_version, cache.remote_version_name);
    }
}

check_config_update();
if (options.check_mpv_update) {
    check_mpv_update();
}
