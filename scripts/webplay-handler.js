var msg = mp.msg;
var protocolRegex = /^webplay:(\/\/)?/;

mp.add_hook('on_load', 50, function () {
    var path = mp.get_property_native('path');
    if (!protocolRegex.test(path)) {
        return;
    }
    mp.set_property_native('stream-open-filename', path.replace(protocolRegex, ''));
});
