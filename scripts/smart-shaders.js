/**
 * If the identifiers are the same, the shaders with the same identifier will be unloaded before loading the shaders.
 *
 * Use: script-message smart-shaders <identifier> <display_name> <shaders> [apply_profile]
 */
'use strict';

/**
 * @typedef {Object} StatObj
 * @property {string} display_name
 * @property {string[]} shaders
 * @property {profile=} profile
 */

var msg = mp.msg;
var commands = require('../script-modules/commands');
var u = require('../script-modules/utils');

var glsl_shaders = commands.change_list('glsl-shaders');
var osd = mp.create_osd_overlay('ass-events');
/** @type {number|null} */
var osd_timer = null;
/** @type {Object.<string, StatObj>} */
var stat = {};

function osd_message(message, timeout) {
    if (osd_timer !== null) {
        clearTimeout(osd_timer);
    }
    osd.data = '{\\a7}' + message;
    osd.update();
    osd_timer = setTimeout(function () {
        osd_timer = null;
        osd.remove();
    }, timeout * 1000);
}

/**
 * @param {string} profile
 */
function apply_profile(profile) {
    if (!profile) {
        return;
    }
    commands.apply_profile(profile);
}

/**
 * @param {string} profile
 */
function restore_profile(profile) {
    if (!profile) {
        return;
    }
    commands.restore_profile(profile);
}

/**
 * @param {string} paths
 * @returns {string[]}
 */
function paths2shaders(paths) {
    return paths.split(';').filter(function (v) { return v.trim() !== ''; });
}

function chroma_shader_to_end() {
    var added_shaders = [];
    var shaders = mp.get_property_native('glsl-shaders');

    Object.keys(stat).forEach(function (k) { stat[k].shaders.forEach(function (v) { added_shaders.push(v); }); });
    shaders.forEach(function (shader) {
        if (added_shaders.indexOf(shader) !== -1) {
            return;
        }
        var shader_path = commands.expand_path(shader);
        try {
            if (mp.utils.read_file(shader_path).match(/^\/\/!HOOK CHROMA$/m) !== null) {
                msg.warn(u.string_format("move '%s' shader glsl-shaders to end", shader));
                glsl_shaders.remove(shader);
                glsl_shaders.append(shader);
            }
        } catch (ex) {
        }
    });
}

function install_shaders(identifier, display_name, shaders, profile) {
    shaders.forEach(function (v) {
        glsl_shaders.append(v);
    });
    apply_profile(profile);
    stat[identifier] = {
        'shaders': shaders,
        'profile': profile,
        'display_name': display_name,
    };
}

/**
 * @param {string} identifier
 */
function uninstall_shaders(identifier) {
    var obj = stat[identifier];
    if (u.empty(obj)) {
        return;
    }
    var loaded_shaders = obj.shaders;
    loaded_shaders.forEach(function (v) {
        glsl_shaders.remove(v);
    });
    restore_profile(obj.profile);
    delete stat[identifier];
}

/**
 * @param {string} identifier
 * @param {string} display_name
 * @param {string} paths
 * @param {string=} profile
 */
function smart_shaders_handler(identifier, display_name, paths, profile) {
    if (identifier === '<clear>') {
        Object.keys(stat).forEach(function (v) { uninstall_shaders(v); });
        osd_message('已卸载所有已加载的着色器', 2);
        return;
    }

    if (identifier === '<show>') {
        var keys = Object.keys(stat);
        var text = u.string_format('当前已加载的着色器 : %s\n', keys.length);
        keys.forEach(function (key) {
            var obj = stat[key];
            text += obj.display_name + u.string_format(' <%s> \n', key);
        });
        text += '(不包括配置文件预加载的着色器)\n';
        text += '查看着色器详细信息: 打开统计信息然后按数字键 2';
        osd_message(text, 5);
        return;
    }

    if (u.empty(identifier)) {
        msg.error('empty identifier');
        return;
    }
    if (u.empty(display_name)) {
        msg.error('empty display name');
        return;
    }

    if (u.empty(paths)) {
        msg.error('empty shaders');
        return;
    }

    var shaders = paths2shaders(paths).sort();

    if (shaders.length === 0) {
        msg.error('empty shaders');
        return;
    }

    var loaded_obj = stat[identifier];
    if (loaded_obj) {
        uninstall_shaders(identifier);
        osd_message(loaded_obj.display_name + ' 着色器已卸载', 2);
        var equal = shaders.join('|') === loaded_obj.shaders.join('|');
        if (equal) {
            return;
        }
    }

    install_shaders(identifier, display_name, shaders, profile);
    chroma_shader_to_end();
    osd_message(display_name + ' 着色器已加载', 2);
}

mp.register_script_message('smart-shaders', smart_shaders_handler);
