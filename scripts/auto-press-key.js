/**
 * 如果播放文件目录存在 mpv.keys 或 ${filename}.mpv.keys
 * 则在文件加载开始时自动按下按键，文件加载结束时再次按下按键。
 * 主要用于配合 apply-shaders 实现着色器自动加载
 */

'use strict';

var msg = mp.msg;
var utils = mp.utils;
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

/**
 * @param {string} path
 * @returns {string[]}
 */
function resolve_keys_file(path) {
    var info = utils.file_info(path);
    if (typeof info !== 'object' || !info.is_file) {
        return [];
    }
    var data = utils.read_file(path);
    if (typeof data !== 'string') {
        return [];
    }
    var results = [];
    var keys = data.split('\n');
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i].trim();
        var startChar = key.substring(0, 1);
        if (key === '' || startChar === '#') {
            continue;
        }
        results.push(key);
    }
    return results;
}

mp.register_event('start-file', function () {
    var path = mp.get_property_native('path');
    var paths = utils.split_path(path);
    var dir = paths[0];
    var filename = paths[1];
    var common_keys = resolve_keys_file(utils.join_path(dir, 'mpv.keys'));
    press_keys(common_keys);
    var specific_keys = resolve_keys_file(utils.join_path(dir, filename + '.mpv.keys'));
    press_keys(specific_keys);
});

mp.register_event('end-file', function () {
    for (var i = 0; i < pressed_keys.length; i++) {
        keypress(pressed_keys[i]);
    }
    pressed_keys = [];
});
