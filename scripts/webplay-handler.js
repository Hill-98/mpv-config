var msg = mp.msg;
var HTTP_HEADERS = [];

mp.add_hook('on_load', 50, function () {
    var path = mp.get_property_native('path');
    if (path.match(/^webplay:(\/\/)?/) === null) {
        return;
    }
    mp.set_property_native('stream-open-filename', path.replace(/^webplay:(\/\/)?/, ''))
});
