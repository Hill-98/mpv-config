'use strict';

var commands = require('../script-modules/commands');
var u = require('../script-modules/utils');
var utils = mp.utils;

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
    var is_bdmv = filename.lastIndexOf('.bdmv') === filename.length - 5;
    var is_mpls = filename.lastIndexOf('.mpls') === filename.length - 5;
    if (!is_bdmv && !is_mpls) {
        return;
    }

    var device = '.';
    var title = is_mpls ? 'mpls/' + mp.get_property_native('filename/no-ext') : 'first';

    var path = u.absolute_path(mp.get_property_native('path'));
    var parent_dir = utils.split_path(path)[0];
    var last_dir = '';
    do {
        last_dir = parent_dir;
        parent_dir = utils.split_path(parent_dir.substring(0, parent_dir.length - 1))[0];
        if (u.dir_exist(utils.join_path(parent_dir, 'BDMV'))) {
            device = parent_dir;
            break;
        }
    } while (last_dir !== parent_dir);

    commands.loadfile('bd://' + title + '/' + device);
});

mp.add_hook('on_load', 99, function () {
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

    var meta_dl_dir = utils.join_path(device, 'BDMV/META/DL');
    if (u.dir_exist(meta_dl_dir)) {
        /** @type {string[]} */
        var langs = mp.get_property_native('slang').filter(function (s) { return s.length === 3; });

        var filename_regex = /bdmt_([a-z]{3})\.xml/i;
        var files = utils.readdir(meta_dl_dir, 'files');
        for (var i = 0; i < files.length; i++) {
            var file = files[i];
            var matches = file.match(filename_regex);
            if (matches !== null) {
                langs.push(matches[1]);
            }
        }

        var name_regex = /<di:name>(.+)<\/di:name>/;
        for (var i = 0; i < langs.length; i++) {
            var file = utils.join_path(meta_dl_dir, u.string_format('bdmt_%s.xml', langs[i]));
            if (u.file_exist(file)) {
                var xml = utils.read_file(file);
                var matches = xml.match(name_regex);
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
