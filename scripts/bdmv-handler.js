'use strict';

var BD_NAME_REGEX = /<di:name>(.+)<\/di:name>/;
var TITLE_START_TAG = '<di:title>';
var TITLE_END_TAG = '</di:title>';

var commands = require('../script-modules/commands');
var io = require('../script-modules/io');
var p = require('../script-modules/path');
var u = require('../script-modules/utils');

/**
 * @param {string} str
 * @returns {string}
 */
function escape_xml(str) {
    return str
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&apos;/g, "'")
        .replace(/&quot;/g, '"');
}

mp.add_hook('on_load', 20, function () {
    if (mp.get_property_native('playback-abort')) {
        return;
    }

    /** @type {string} */
    var filename = mp.get_property_native('filename');
    var is_bdmv = filename.length >= 5 && filename.substring(filename.length - 5) === '.bdmv';
    var is_mpls = filename.length >= 5 && filename.substring(filename.length - 5) === '.mpls';
    if (!is_bdmv && !is_mpls) {
        return;
    }

    var device = '.';
    var title = is_mpls ? 'mpls/' + mp.get_property_native('filename/no-ext') : 'first';

    var path = p.absolute_path(mp.get_property_native('path'));
    var parent_dir = p.split_path(path)[0];
    var last_dir = '';
    do {
        last_dir = parent_dir;
        parent_dir = p.split_path(parent_dir.substring(0, parent_dir.length - 1))[0];
        if (io.dir_exist(p.join_path(parent_dir, 'BDMV'))) {
            device = parent_dir;
            break;
        }
    } while (last_dir !== parent_dir);

    commands.loadfile('bd://' + title + '/' + device);
});

mp.add_hook('on_preloaded', 99, function () {
    if (mp.get_property_native('playback-abort')) {
        return;
    }

    /** @type {string} */
    var path = mp.get_property_native('path');

    if (path.indexOf('bd://') !== 0 && path.indexOf('bluray://') !== 0) {
        return;
    }

    var device = mp.get_property_native('bluray-device');
    if (device === '') {
        var pos = path.indexOf('://');
        device = path.substring(pos + 3);
        pos = device.indexOf('mpls/');
        if (pos === -1) {
            pos = device.indexOf('/');
        } else {
            pos = device.indexOf('/', pos + 5);
        }

        device = device.substring(pos + 1);
    }

    var bd_name = '';

    var meta_dl_dir = p.join_path(device, 'BDMV/META/DL');
    if (io.dir_exist(meta_dl_dir)) {
        /** @type {string[]} */
        var langs = mp.get_property_native('slang').filter(function (s) { return s.length === 3; });
        langs.push('eng');
        var filename_regex = /bdmt_([a-z]{3})\.xml/i;
        var files = io.read_dir(meta_dl_dir, 'files');
        for (var i = 0; i < files.length; i++) {
            var file = files[i];
            var matches = file.match(filename_regex);
            if (matches !== null) {
                langs.push(matches[1]);
            }
        }

        for (var i = 0; i < langs.length; i++) {
            var file = p.join_path(meta_dl_dir, u.string_format('bdmt_%s.xml', langs[i]));
            if (io.file_exist(file)) {
                var xml = io.read_file(file);
                var i1 = xml.indexOf(TITLE_START_TAG);
                var i2 = xml.indexOf(TITLE_END_TAG, i1 + 1);
                if (i1 === -1 || i2 === -1) {
                    continue;
                }
                var title_node = xml.substring(i1 + TITLE_START_TAG.length, i2);
                var matches = title_node.match(BD_NAME_REGEX);
                if (matches !== null) {
                    bd_name = escape_xml(matches[1]);
                    break;
                }
            }
        }
    }

    if (bd_name !== '') {
        mp.set_property_native('file-local-options/force-media-title', bd_name);
    }
});
