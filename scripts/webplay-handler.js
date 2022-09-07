var msg = mp.msg;
var protocolRegex = /^webplay:/;

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

mp.add_hook('on_load', 40, function () {
    var path = mp.get_property_native('path');
    var link = getParam(path, 'link');
    if (!protocolRegex.test(path) || !link) {
        return;
    }
    msg.info('Play: ' + link);
    mp.set_property_native('stream-open-filename', link);

    var title = getParam(path, 'title');
    if (title) {
        msg.info('Title: ' + title);
        mp.set_property_native('title', title);
    }
});
