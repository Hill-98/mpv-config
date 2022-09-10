var msg = mp.msg;
var event = require('../script-modules/EventHelper');
var LOADED_HANDLER = null;
var TEMP_URLS = [];

function getParam(url, param) {
    var str = param + '=';
    var start = url.indexOf(str);
    if (start === -1) {
        return null;
    }
    start += str.length;
    var end = url.indexOf('&', start);
    return decodeURIComponent(url.substring(start, end === -1 ? undefined : end).replace(/\+/g, '%20'));
}

function loaded(url) {
    var title = getParam(url, 'title');
    if (title) {
        msg.info('Title: ' + title);
        mp.set_property_native('file-local-options/title', title);
    }
    var start = getParam(url, 'start');
    if (start && parseFloat(start)) {
        mp.set_property_native('playback-time', start);
    }
}

mp.add_hook('on_load', 40, function () {
    var path = mp.get_property_native('path');
    if (path.indexOf('webplay:?') !== 0) {
        return;
    }
    mp.set_property_native('file-local-options/save-position-on-quit', false);
    var index = TEMP_URLS.indexOf(path);
    var isTempUrl = index !== -1;
    if (isTempUrl) {
        path = TEMP_URLS[index + 1];
        TEMP_URLS.splice(index, 2);
    }
    var link = getParam(path, 'link');
    var parse = getParam(path, 'parse');
    if (parse === '1') {
        // 解析链接需要重新执行一次加载文件流程，所以当文件结束事件发生时附加一个新的事件。
        event.once('end-file', function () {
            LOADED_HANDLER = loaded.bind(this, path);
            event.once('file-loaded', LOADED_HANDLER);
        });
        mp.command_native(['loadfile', link]);
        return;
    }
    var referer = getParam(path, 'referer');
    // 使保存的文件设置具有统一性
    if (referer !== null && !isTempUrl) {
        var tempUrl = 'webplay:?' + referer;
        TEMP_URLS.push(tempUrl);
        TEMP_URLS.push(path);
        mp.command_native(['loadfile', tempUrl]);
        return;
    }
    msg.info('Play: ' + (referer || link));
    mp.set_property_native('stream-open-filename', link);
    loaded(path);
    mp.set_property_native('file-local-options/save-position-on-quit', true);
});

mp.register_event('end-file', function () {
    if (LOADED_HANDLER !== null) {
        mp.unregister_event(LOADED_HANDLER);
        LOADED_HANDLER = null;
    }
});
