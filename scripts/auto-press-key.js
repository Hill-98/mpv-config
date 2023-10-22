/**
 * If mpv.keys or ${filename}.mpv.keys exists in the playback file directory, the
 * keys in the keys file will be pressed automatically after the file is loaded, and
 * will be pressed again after the file ends.
 */

'use strict';

var utils = mp.utils;
var commands = require('../script-modules/commands');
var io = require('../script-modules/io');
/** @type {Array.<string>} */
var pressed_keys = [];

/**
 * @param {string[]} keys
 */
function press_keys(keys) {
    keys.forEach(function (key) {
        if (key.indexOf('!') === 0) {
            key = key.substring(1);
        } else {
            pressed_keys.push(key);
        }
        commands.keypress(key);
    });
}

mp.register_event('file-loaded', function () {
    if (mp.get_property_native('demuxer-via-network')) {
        return;
    }
    var path = mp.get_property_native('path');
    var paths = utils.split_path(path);
    var dir = paths[0];
    var filename = paths[1];
    var files = [
        utils.join_path(dir, filename + '.mpv.keys'),
        utils.join_path(dir, 'mpv.keys'),
    ];
    for (var i = 0; i < files.length; i++) {
        var keys = io.read_file_lines(files[i]);
        if (keys === undefined || keys.length === 0) {
            continue;
        }
        press_keys(keys);
        break;
    }
});

mp.register_event('end-file', function () {
    pressed_keys.forEach(commands.keypress);
    pressed_keys = [];
});
