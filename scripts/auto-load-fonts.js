/**
 * Use fontconfig or sub-fonts-dir to load the font files in the fonts folder under the playback file path
 */

'use strict';

var FONTCONFIG_XML_TEMPLATE = '<?xml version="1.0"?><!DOCTYPE fontconfig SYSTEM "urn:fontconfig:fonts.dtd"><fontconfig>%s</fontconfig>';
var FONTCONFIG_DIR_XML_TEMPLATE = '<dir>%s</dir>';
var FONTS_SUB_DIRS = ['fonts', 'Fonts', 'FONTS', '字体'];

var msg = mp.msg;
var commands = require('../script-modules/commands');
var io = require('../script-modules/io');
var p = require('../script-modules/path');
var u = require('../script-modules/utils');

var options = {
    enable: true,
    compatible_mode: false,
    compatible_dir: '~~/.fonts',
    method: mp.get_property_native('property-list').indexOf('sub-fonts-dir') !== -1 ? 'native' : 'fontconfig', // fontconfig or native
};
var state = {
    compatible_fonts_dir: '',
    external_fonts_dir: null,
    fonts_conf: commands.expand_path('~~/.fonts.conf'),
    /** @type {string|null} */
    last_compatible_dir: null,
    /** @type {string|null} */
    last_fonts_dir: null,
    os: require('../script-modules/DetectOS')(),
    ready: false,
    set_fonts_dir: false,
};

/**
 * @returns {boolean}
 */
function check_ready() {
    return (options.method === 'fontconfig' && mp.get_property_native('sub-font-provider') === 'fontconfig')
        || (options.method === 'native' && mp.get_property_native('property-list').indexOf('sub-fonts-dir') !== -1);
}

function clear_fonts() {
    if (io.dir_exist(state.compatible_fonts_dir)) {
        io.remove_dir(state.compatible_fonts_dir);
    }
}

/**
 * @param {string} dir
 * @returns {boolean}
 */
function copy_fonts(dir) {
    return (io.dir_exist(options.compatible_dir) || io.create_dir(options.compatible_dir)) && io.copy_dir(dir, state.compatible_fonts_dir);
}

/**
 * @param {string} str
 * @returns {string}
 */
function escape_xml(str) {
    return str
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/&/g, '&amp;')
        .replace(/'/g, '&apos;')
        .replace(/"/g, '&quot;');
}

/**
 * @param {string} path
 * @returns {string}
 */
function format_path(path) {
    return state.os === 'windows' ? p.format_windows_path(path) : path;
}

/**
 * @param {string} path
 * @returns {string|null}
 */
function get_available_fonts_dir(path) {
    var fonts_dir = null;
    for (var i = 0; i < FONTS_SUB_DIRS.length; i++) {
        var dir = p.absolute_path(p.join_path(path, FONTS_SUB_DIRS[i]));
        if (io.dir_exist(dir)) {
            fonts_dir = format_path(dir);
            break;
        }
    }
    return fonts_dir;
}

/**
 * @returns {string}
 */
function get_compatible_fonts_dir() {
    var base = p.join_path(options.compatible_dir, mp.get_script_name() + '$');
    for (var i = 1; ; i++) {
        var path = base + i;
        if (!io.dir_exist(path)) {
            return path;
        }
    }
}

/**
 * @param {string} dir
 */
function load_fonts_dir(dir) {
    if (options.method === 'fontconfig') {
        write_fonts_conf(dir, false);
    }
    if (options.method === 'native') {
        mp.set_property_native('sub-fonts-dir', dir);
    }
}

/**
 * @param {?string} dir
 */
function set_fonts_dir(dir) {
    var fonts_dir = dir;

    // 如果没有字体目录并且之前设置了字体目录，那么清空配置文件。
    if (typeof fonts_dir !== 'string' || fonts_dir.trim() === '') {
        if (state.set_fonts_dir) {
            load_fonts_dir(null);
            state.set_fonts_dir = false;
        }
        return;
    }
    if (fonts_dir && (!options.enable || !state.ready)) {
        msg.warn('The fonts directory exists, but the script is not enabled.');
        return;
    }

    var source_fonts_dir = fonts_dir;
    if (state.last_fonts_dir === source_fonts_dir) {
        return;
    }

    if (options.compatible_mode) {
        clear_fonts();
        state.compatible_fonts_dir = get_compatible_fonts_dir();
        if (copy_fonts(source_fonts_dir)) {
            fonts_dir = state.compatible_fonts_dir;
        } else {
            msg.error(u.string_format("Copy fonts directory failed: '%s' -> '%s'", source_fonts_dir, state.compatible_fonts_dir));
        }
    }

    state.last_fonts_dir = source_fonts_dir;
    state.set_fonts_dir = true;
    load_fonts_dir(fonts_dir);

    if (fonts_dir === source_fonts_dir) {
        msg.info(u.string_format('Use %s to set the font directory: %s', options.method, fonts_dir));
    } else {
        msg.info(u.string_format('Use %s to set the font directory (compatible_mode): %s (%s)', options.method, fonts_dir, source_fonts_dir));
    }
}

function unload_fonts_dir() {
    if (options.method === 'fontconfig') {
        write_fonts_conf('', true);
    }
    if (options.method === 'native') {
        mp.set_property_native('sub-fonts-dir', '');
    }
}

function update_options() {
    if (options.compatible_mode && !state.os) {
        options.compatible_mode = false;
        msg.warn('Unknown OS detected, compatibility mode disabled.');
    }
    options.compatible_dir = format_path(commands.expand_path(options.compatible_dir));
    // 如果兼容目录已更改则清理旧目录
    if (state.last_compatible_dir !== options.compatible_dir) {
        clear_fonts();
    }
    state.last_compatible_dir = options.compatible_dir;
    state.last_fonts_dir = null;
    state.ready = check_ready();
}

/**
 * @param {string} fonts_dir
 * @param {boolean} require_exist
 */
function write_fonts_conf(fonts_dir, require_exist) {
    var exist = io.file_exist(state.fonts_conf);
    // 做一些检查，避免无用的重复写入。
    if (require_exist && !exist) {
        return;
    }
    var xml = fonts_dir === '' ? '' : u.string_format(FONTCONFIG_DIR_XML_TEMPLATE, escape_xml(fonts_dir));
    var data = u.string_format(FONTCONFIG_XML_TEMPLATE, xml);
    if (exist & io.read_file(state.fonts_conf) === data) {
        return;
    }
    io.write_file(state.fonts_conf, data);
}

mp.options.read_options(options, 'auto_load_fonts', function () {
    if (!options.enable) {
        state.set_fonts_dir = false;
        mp.set_property_native('sub-fonts-dir', '');
        write_fonts_conf('', true);
        clear_fonts();
    }
    update_options();
});
update_options();

mp.observe_property('sub-font-provider', 'native', function () {
    state.ready = check_ready();
});

mp.add_hook('on_load', 50, function () {
    if (mp.get_property_native('playback-abort')) {
        return;
    }

    var fonts_dir = null;
    var path = mp.get_property_native('path');
    var spaths = p.split_path(path);
    var current_dir = spaths[0];
    var sub_paths = mp.get_property_native('sub-file-paths') || [];
    sub_paths.unshift('');

    for (var i = 0; !fonts_dir && i < sub_paths.length; i++) {
        fonts_dir = get_available_fonts_dir(p.join_path(current_dir, sub_paths[i]));
    }

    if (state.external_fonts_dir) {
        fonts_dir = state.external_fonts_dir;
        state.external_fonts_dir = null;
    }

    set_fonts_dir(fonts_dir);
});

mp.register_event('shutdown', function () {
    unload_fonts_dir();
    clear_fonts();
});
