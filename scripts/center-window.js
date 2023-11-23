/**
 * Fix for some X11 window managers not center window by default after set force-window=immediate.
 * Not implemented: multi-screen compatibility
 */

'use strict';

var commands = require('../script-modules/commands');
var once = require('../script-modules/OnceHelper');
var u = require('../script-modules/utils');
var state = {
    os: require('../script-modules/DetectOS')(),
    pid: mp.get_property_native('pid'),
};

function on_file_loaded() {
    if (mp.get_property_native('fullscreen') || mp.get_property_native('geometry') || mp.get_property_native('force-window') !== 'immediate') {
        return;
    }
    var process = commands.subprocess(['/bin/sh', '-c', u.string_format('wmctrl -l -p | grep -w %s | head -1 | cut  -d " " -f 1', state.pid)]);
    if (process.status !== 0) {
        return;
    }
    var wid = process.stdout.trim();
    once.event('playback-restart', function () {
        var d_height = mp.get_property_native('display-height');
        var d_width = mp.get_property_native('display-width');
        var w_height = mp.get_property_native('osd-height');
        var w_width = mp.get_property_native('osd-width');
        if (typeof d_height === 'number' && typeof d_width === 'number' && typeof w_height === 'number' && typeof w_width === 'number') {
            var x = (d_width - w_width) / 2;
            var y = (d_height - w_height) / 2;
            commands.subprocess_async(['/bin/sh', '-c', u.string_format('wmctrl -i -r %s -e 0,%s,%s,-1,-1', wid, x, y)]);
        }
    });
}

mp.register_event('file-loaded', on_file_loaded);

if (state.os !== 'linux') {
    mp.unregister_event(on_file_loaded);
    exit();
}
