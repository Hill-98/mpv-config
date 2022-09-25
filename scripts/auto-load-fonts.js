/**
 * 自动设置 fontconfig 以加载播放文件路径下 fonts 文件夹内的字体文件
 *
 * 需要 sub-font-provider=fontconfig 和
 * fonts.conf 加入 <include ignore_missing="yes">%CONFIG_DIR%/.fonts.conf</include> 行。
 */

'use strict';

var FONTCONFIG_XML = '<?xml version="1.0"?><!DOCTYPE fontconfig SYSTEM "urn:fontconfig:fonts.dtd"><fontconfig>%XML%</fontconfig>';
var FONTCONFIG_DIR_XML = '<dir>%FONTS_DIR%</dir>';

var msg = mp.msg;
var utils = mp.utils;
var commands = require('../script-modules/commands');
var u = require('../script-modules/utils');
var fonts_conf = commands.expand_path('~~/.fonts.conf');
var options = {
    enable: true,
};
mp.options.read_options(options, 'auto-load-fonts');

(function () {
    if (!options.enable) {
        return;
    }
    mp.add_hook('on_load', 99, function () {
        var path = mp.get_property_native('path');
        var spaths = utils.split_path(path);
        var fonts_dir = utils.join_path(spaths[0], 'fonts');
        var xml = '';
        if (u.dir_exist(spaths[0]) && u.dir_exist(fonts_dir)) {
            xml = FONTCONFIG_DIR_XML.replace('%FONTS_DIR%', fonts_dir);
            msg.info('Set fonts dir: ' + fonts_dir);
        }
        utils.write_file('file://' + fonts_conf, FONTCONFIG_XML.replace('%XML%', xml));
    });

    mp.add_hook('on_unload', 99, function () {
        utils.write_file('file://' + fonts_conf, FONTCONFIG_XML.replace('%XML%', ''));
    });
})();
