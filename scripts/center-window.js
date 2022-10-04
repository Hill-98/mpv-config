/**
 * 解决一些 X11 窗口管理器设置 force-window=immediate 后默认不居中窗口。
 * 未实现：多屏幕兼容性
 */

var commands = require('../script-modules/commands');
var event = require('../script-modules/EventHelper');
var u = require('../script-modules/utils');
var state = {
    os: u.detect_os(),
    pid: mp.get_property_native('pid'),
};

mp.register_event('file-loaded', function () {
    if (state.os !== 'linux' || mp.get_property_native('fullscreen') || mp.get_property_native('geometry') || mp.get_property_native('force-window') !== 'immediate') {
        return;
    }
    var process = commands.subprocess(['/bin/sh', '-c', u.string_format('wmctrl -l -p | grep -w %s | head -1 | cut  -d " " -f 1', state.pid)]);
    if (process.status !== 0) {
        return;
    }
    var wid = process.stdout.trim();
    event.once('playback-restart', function () {
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
});
