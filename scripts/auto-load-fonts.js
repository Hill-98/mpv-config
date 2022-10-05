/**
 * 自动设置 fontconfig 以加载播放文件路径下 fonts 文件夹内的字体文件
 *
 * 需要 sub-font-provider=fontconfig 和
 * fonts.conf 添加 <include ignore_missing="yes">%CONFIG_DIR%/.fonts.conf</include> 行 (%CONFIG_DIR% 替换为 mpv 配置目录)。
 *
 * compatible_mode (兼容模式) 主要用于解决一些性能问题和 Windows 某些分区上的错误
 */

'use strict';

var FONTCONFIG_XML = '<?xml version="1.0"?><!DOCTYPE fontconfig SYSTEM "urn:fontconfig:fonts.dtd"><fontconfig>%s</fontconfig>';
var FONTCONFIG_DIR_XML = '<dir>%s</dir>';

var msg = mp.msg;
var utils = mp.utils;
var commands = require('../script-modules/commands');
var u = require('../script-modules/utils');
var options = {
    enable: true,
    compatible_mode: false,
    compatible_dir: '~~/.fonts',
};
var state = {
    compatible_fonts_dir: '',
    fontconfig_enabled: false,
    fonts_conf: commands.expand_path('~~/.fonts.conf'),
    is_windows: u.detect_os() === 'windows',
    /** @type {string|null} */
    last_fonts_dir: null,
    set_fonts_dir: false,
};

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

function clear_fonts() {
    if (!u.dir_exist(state.compatible_fonts_dir)) {
        return;
    }
    var args = [];
    if (state.is_windows) {
        args = ['cmd.exe', '/c', 'rmdir', '/S', '/Q', state.compatible_fonts_dir];
    } else {
        args = ['rm', '-r', state.compatible_fonts_dir];
    }
    commands.subprocess(args);
}

/**
 * @param {string} dir
 * @returns {boolean}
 */
function copy_fonts(dir) {
    var args = [];
    var process = null;
    if (!u.dir_exist(options.compatible_dir)) {
        if (state.is_windows) {
            args = ['cmd.exe', '/c', 'mkdir', options.compatible_dir];
        } else {
            args = ['mkdir', '-p', options.compatible_dir];
        }
        process = commands.subprocess(args);
        if (process.status !== 0) {
            return false;
        }
    }
    if (state.is_windows) {
        args = ['Robocopy.exe', dir, state.compatible_fonts_dir, '/S', '/R:1'];
        process = commands.subprocess(args);
        return process.status < 8;
    } else {
        args = ['cp', '-p', '-r', dir, state.compatible_fonts_dir];
        process = commands.subprocess(args);
        return process.status === 0;
    }
}

function update_options() {
    if (options.compatible_mode && !state.is_windows) {
        options.compatible_mode = false;
        msg.warn('Unknown OS detected, compatibility mode disabled.');
    }
    options.compatible_dir = u.format_windows_path(commands.expand_path(options.compatible_dir), state.is_windows);
    var compatible_fonts_dir = utils.join_path(options.compatible_dir, mp.get_script_name() + '-' + mp.get_property_native('pid'));
    compatible_fonts_dir = u.format_windows_path(compatible_fonts_dir, state.is_windows);
    if (state.compatible_fonts_dir && state.compatible_fonts_dir !== compatible_fonts_dir) {
        clear_fonts();
    }
    state.compatible_fonts_dir = compatible_fonts_dir;
    state.last_fonts_dir = null;
}

/**
 * @param {string} dir
 * @param {boolean} require_exist
 */
function write_fonts_conf(dir, require_exist) {
    var exist = u.file_exist(state.fonts_conf);
    var xml = dir === '' ? '' : u.string_format(FONTCONFIG_DIR_XML, escape_xml(dir));
    var data = u.string_format(FONTCONFIG_XML, xml);
    // 做一些检查，避免无用的重复写入。
    if (require_exist && !exist) {
        return;
    }
    if (exist && utils.read_file(state.fonts_conf) === data) {
        return;
    }
    utils.write_file('file://' + state.fonts_conf, data);
}

mp.options.read_options(options, 'auto-load-fonts', function () {
    if (!options.enable) {
        state.set_fonts_dir = false;
        clear_fonts();
        write_fonts_conf('', true);
    }
    update_options();
});
update_options();

mp.observe_property('sub-font-provider', 'native', function (name, value) {
    state.fontconfig_enabled = value === 'fontconfig';
});

(function () {
    mp.add_hook('on_load', 50, function () {
        if (mp.get_property_native('playback-abort')) {
            return;
        }

        var path = mp.get_property_native('path');
        var spaths = utils.split_path(path);
        var fonts_dir = u.format_windows_path(u.absolute_path(utils.join_path(spaths[0], 'fonts')), state.is_windows);
        var source_font_dir = fonts_dir;
        var font_dir_exist = u.dir_exist(fonts_dir);
        if (font_dir_exist && (!options.enable || !state.fontconfig_enabled)) {
            msg.warn('The font directory exists, but the script is not enabled.');
            return;
        }
        // 如果没有字体目录并且之前设置了字体目录，那么写入清空配置文件。
        if (!font_dir_exist) {
            if (state.set_fonts_dir) {
                write_fonts_conf('', true);
                state.set_fonts_dir = false;
            }
            return;
        }
        var reset = state.last_fonts_dir !== source_font_dir;
        if (!reset) {
            return;
        }

        if (options.compatible_mode) {
            clear_fonts();
            if (copy_fonts(source_font_dir)) {
                fonts_dir = state.compatible_fonts_dir;
                state.last_fonts_dir = source_font_dir;
            } else {
                msg.error(u.string_format("copy fonts dir failed: '%s' -> '%s'", source_font_dir, state.compatible_fonts_dir));
            }
        } else {
            state.last_fonts_dir = source_font_dir;
        }

        write_fonts_conf(fonts_dir);
        state.set_fonts_dir = true;

        if (fonts_dir === source_font_dir) {
            msg.info('Set fonts dir: ' + fonts_dir);
        } else {
            msg.info(u.string_format('Set fonts dir (compatible_mode): %s (%s)', fonts_dir, source_font_dir));
        }
    });

    mp.register_event('shutdown', function () {
        write_fonts_conf('', true);
        clear_fonts();
    });
})();
