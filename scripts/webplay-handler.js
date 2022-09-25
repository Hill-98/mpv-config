'use strict';

var PROTOCOL_PREFIX = 'webplay:?';

var msg = mp.msg;
var commands = require('../script-modules/commands');
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
    }
    var trim_map = function trim_map(value) {
        return value.trim();
    }
    var empty_filter = function empty_filter(value) {
        return value !== '';
    }

    var results = {};
    var params = url.replace(PROTOCOL_PREFIX, '').split('&').map(trim_map).filter(empty_filter);
    for (var i = 0; i < params.length; i++) {
        var strs = params[i].split('=').map(trim_map).filter(empty_filter);
        if (strs.length != 2) {
            continue;
        }
        results[strs[0]] = decode(strs[1]);
    }
    return results;
}

mp.add_hook('on_load', 40, function () {
    state.start = null;
    /** @type {string} */
    var path = mp.get_property_native('path');
    if (path.indexOf(PROTOCOL_PREFIX) !== 0) {
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
    var link = params.link;
    // 重新加载以交给对应解析程序。
    if (params.parse === '1') {
        msg.info('WebPlay: ' + link);
        commands.loadfile(link);
        return;
    }

    // 保存的设置有一致性
    var referer = params.referer;
    if (!is_reload && referer) {
        state.url = path;
        commands.loadfile('webplay:?' + referer);
        return;
    }

    var title = params.title || referer || link;
    var start = parseInt(params.start);
    state.start = start >= 0 ? start : null;
    msg.info('WebPlay: ' + (referer || link));
    mp.set_property_native('stream-open-filename', link);
    mp.set_property_native('file-local-options/save-position-on-quit', save_on_quit);
    mp.set_property_native('file-local-options/title', title);
});

mp.register_event('file-loaded', function () {
    if (state.start !== null) {
        mp.set_property_native('playback-time', state.start);
    }
});
