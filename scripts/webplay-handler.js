'use strict';

var PROTOCOL_PREFIX = 'webplay:?';

var msg = mp.msg;
var commands = require('../script-modules/commands');
var HttpHeaders = require('../script-modules/HttpHeaders');
var state = {
    /** @type {number|null} */
    start: null,
    /** @type {string} */
    url: '',
};

/**
 * @param {string} url
 * @returns {Object.<string, string>}
 */
function parse_url(url) {
    var decode = function decode(value) {
        return decodeURIComponent(value.replace(/\+/g, '%20'));
    };
    var trim_map = function trim_map(value) {
        return value.trim();
    };
    var empty_filter = function empty_filter(value) {
        return value !== '';
    };

    var results = {};
    var params = url.replace(PROTOCOL_PREFIX, '').split('&').map(trim_map).filter(empty_filter);
    params.forEach(function (p) {
        var strs = p.split('=').map(trim_map).filter(empty_filter);
        if (strs.length != 2) {
            return;
        }
        results[strs[0]] = decode(strs[1]);
    });
    return results;
}

mp.add_hook('on_load', 10, function () {
    state.start = null;
    /** @type {string} */
    var path = mp.get_property_native('path');
    if (path.indexOf(PROTOCOL_PREFIX) !== 0 || mp.get_property_native('playback-abort')) {
        return;
    }
    var save_on_quit = mp.get_property_native('save-position-on-quit');
    mp.set_property_native('file-local-options/save-position-on-quit', false);

    var is_reload = state.url !== '';
    if (is_reload) {
        path = state.url;
        state.url = '';
    }

    var params = parse_url(path);
    var url = params.url;
    // 让其他脚本解析
    if (params.parse === '1') {
        msg.info('WebPlay: ' + url);
        commands.loadfile(url);
        return;
    }

    // 因为原始链接包含大量信息，即使从同一个页面调用，链接也可能变化，所以需要格式化链接并重新加载。
    if (!is_reload && url) {
        state.url = path;
        commands.loadfile(PROTOCOL_PREFIX + url);
        return;
    }

    var title = params.title || url;
    var start = parseInt(params.start);
    state.start = start >= 0 ? start : null;

    var http_headers = new HttpHeaders();
    http_headers.add('referer', url);

    mp.set_property_native('file-local-options/save-position-on-quit', save_on_quit);
    mp.set_property_native('file-local-options/force-media-title', title);
    mp.set_property_native('stream-open-filename', params.video);

    if (params.audio) {
        commands.audio_add(params.audio);
    }

    msg.info('WebPlay: ' + url);
});

mp.register_event('file-loaded', function () {
    if (state.start !== null) {
        mp.set_property_native('playback-time', state.start);
    }
});
