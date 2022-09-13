/**
 * 如果播放文件目录存在 mpv.keys 或 ${filename}.mpv.keys
 * 则在文件加载开始时自动按下按键，文件加载结束时再次按下按键。
 * 主要用于配合 apply-shaders 实现着色器自动加载
 */

'use strict';

var msg = mp.msg;
var utils = mp.utils;
var u = require('../script-modules/utils');
var pressed_keys = [];

/**
 * @param {string} key
 */
function keypress(key) {
    mp.command_native(['keypress', key]);
}

/**
 * @param {string[]} keys
 */
function press_keys(keys) {
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        if (key.substring(0, 1) === '!') {
            key = key.substring(1);
        } else {
            pressed_keys.push(key);
        }
        keypress(key);
    }
}

mp.register_event('start-file', function () {
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
    for (var i = 0; i < pressed_keys.length; i++) {
        keypress(pressed_keys[i]);
    }
    pressed_keys = [];
});
