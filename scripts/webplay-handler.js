var msg = mp.msg;
var TEMP_URLS = [];
var PROTOCOL_PREFIX = 'webplay:?';
var START = null;

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
    var path = mp.get_property_native('path');
    if (path.indexOf(PROTOCOL_PREFIX) !== 0) {
        return;
    }
    mp.set_property_native('file-local-options/save-position-on-quit', false);
    var index = TEMP_URLS.indexOf(path);
    var isTempUrl = index !== -1;
    if (isTempUrl) {
        path = TEMP_URLS[index + 1];
        TEMP_URLS.splice(index, 2);
    }
    var params = parse_url(path);
    var link = params.link;
    var isParse = params.parse === '1';
    var opts = {};
    if (params.start !== undefined && parseInt(params.start) > 0) {
        START = parseInt(params.start);
        opts.start = START;
    }
    if (isParse) {
        mp.command_native(['loadfile', link, 'replace', ]);
        return;
    }
    var referer = params.referer;
    // 保存的文件设置具有统一性
    if (referer !== null && !isTempUrl) {
        var tempUrl = 'webplay:?' + referer;
        TEMP_URLS.push(tempUrl);
        TEMP_URLS.push(path);
        mp.command_native(['loadfile', tempUrl]);
        return;
    }
    var title = params.title || referer || link;
    msg.info('Play: ' + (referer || link));
    mp.set_property_native('stream-open-filename', link);
    mp.set_property_native('file-local-options/save-position-on-quit', true);
    mp.set_property_native('file-local-options/title', title);
});

mp.add_hook('on_unload', 50, function () {
    START = null;
});

mp.register_event('file-loaded', function () {
    if (START !== null) {
        mp.set_property_native('playback-time', START);
    }
});
