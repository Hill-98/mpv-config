var msg = mp.msg;
var LOADED_HANDLER = null;
var event = require('../script-modules/EventHelper');

function getParam(url, param) {
    var str = param + '=';
    var start = url.indexOf(str);
    if (start === -1) {
        return;
    }
    start += str.length;
    var end = url.indexOf('&', start);
    return decodeURIComponent(url.substring(start, end === -1 ? undefined : end).replace(/\+/g, '%20'));
}

function loaded(url) {
    var title = getParam(url, 'title');
    if (title) {
        msg.info('Title: ' + title);
        mp.set_property_native('title', title);
    }
}

mp.add_hook('on_load', 40, function () {
    var path = mp.get_property_native('path');
    var link = getParam(path, 'link');
    if (path.indexOf('webplay:?') !== 0 || !link) {
        return;
    }
    var parse = getParam(path, 'parse');
    if (parse === '1') {
        event.once('end-file', function () {
            LOADED_HANDLER = loaded.bind(this, path);
            mp.register_event('file-loaded', LOADED_HANDLER);
        });
        mp.command_native(['loadfile', link]);
    } else {
        msg.info('Play: ' + link);
        mp.set_property_native('stream-open-filename', link);
        loaded(path);
    }
});

mp.register_event('end-file', function () {
    if (LOADED_HANDLER !== null) {
        mp.unregister_event(LOADED_HANDLER);
        LOADED_HANDLER = null;
    }
});
