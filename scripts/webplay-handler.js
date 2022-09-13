'use strict';

var PROTOCOL_PREFIX = 'webplay:?';

var msg = mp.msg;
var commands = require('../script-modules/commands');
/** @type {Array.<string>} */
var temp_urls = [];
/** @type {number|null} */
var temp_start = null;

/**
 * @param {string} url
 * @returns {Object.<string, string>}
 */
function parse_url(url) {
    var decode = function (value) {
        return decodeURIComponent(value.replace(/\+/g, '%20'));
    }
    var results = {};
    var params = url.replace(PROTOCOL_PREFIX, '').split('&');
    for (var i = 0; i < params.length; i++) {
        var param = params[i].split('=');
        if (param.length != 2) {
            continue;
        }
        results[param[0]] = decode(param[1]);
    }
    return results;
}

mp.add_hook('on_load', 40, function () {
    /** @type {string} */
    var path = mp.get_property_native('path');
    if (path.indexOf(PROTOCOL_PREFIX) !== 0) {
        return;
    }
    mp.set_property_native('file-local-options/save-position-on-quit', false);
    var index = temp_urls.indexOf(path);
    var isTempUrl = index !== -1;
    if (isTempUrl) {
        path = temp_urls[index + 1];
        temp_urls.splice(index, 2);
    }
    var params = parse_url(path);
    var link = params.link;
    var isParse = params.parse === '1';
    var opts = {};
    if (params.start !== undefined && parseInt(params.start) > 0) {
        temp_start = parseInt(params.start);
        opts.start = temp_start;
    }
    if (isParse) {
        commands.loadfile(link, 'replace');
        return;
    }
    var referer = params.referer;
    // 保存的文件设置具有统一性
    if (referer !== null && !isTempUrl) {
        var tempUrl = 'webplay:?' + referer;
        temp_urls.push(tempUrl);
        temp_urls.push(path);
        commands.loadfile(tempUrl);
        return;
    }
    var title = params.title || referer || link;
    msg.info('Play: ' + (referer || link));
    mp.set_property_native('stream-open-filename', link);
    mp.set_property_native('file-local-options/save-position-on-quit', true);
    mp.set_property_native('file-local-options/title', title);
});

mp.register_event('file-loaded', function () {
    if (temp_start !== null) {
        mp.set_property_native('playback-time', temp_start);
        temp_start = null;
    }
});
