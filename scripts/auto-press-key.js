/**
 * 如果播放文件目录存在 mpv.keys 或 ${filename}.mpv.keys
 * 则在文件加载后自动按下按键，文件结束时再次按下按键。
 * 主要用于配合 smart-shaders 实现着色器自动加载
 */

'use strict';

var utils = mp.utils;
var commands = require('../script-modules/commands');
var u = require('../script-modules/utils');
/** @type {Array.<string>} */
var pressed_keys = [];

/**
 * @param {string[]} keys
 */
function press_keys(keys) {
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        if (key.indexOf('!') === 0) {
            key = key.substring(1);
        } else {
            pressed_keys.push(key);
        }
        commands.keypress(key);
    }
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
        var keys = u.read_file_lines(files[i]);
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
