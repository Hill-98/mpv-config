/**
 * 用法: script-message smart-shaders <identifier> <display_name> <shaders> [profile]
 * 
 * 方便切换具有相同功能的着色器集合
 *  
 * 加载/卸载 着色器集合并用标识符记录，如果标识符之前已被用于加载其他着色器，则先卸载已加载的着色器，如果着色器和已加载的一致，则卸载着色器。
 */

/**
 * @typedef {Object} StatObj
 * @property {string} display_name
 * @property {string[]} shaders
 * @property {profile=} profile
 */

'use strict';

var msg = mp.msg;
var utils = require('../script-modules/utils');
var delimiter = ';';
/** @type {Object.<string, StatObj>} */
var stat = {};

/**
 * @param {string} name
 */
function apply_profile(name) {
  if (!name) {
    return;
  }
  mp.command_native(['apply-profile', name]);
}

/**
 * @param {string} name
 */
function restore_profile(name) {
  if (!name) {
    return;
  }
  mp.command_native(['apply-profile', name, 'restore']);
}

/**
 * @param {string} path
 */
function append_shader(path) {
  mp.command_native(['change-list', 'glsl-shaders', 'append', path]);
}

/**
 * @param {string} path
 */
function remove_shader(path) {
  mp.command_native(['change-list', 'glsl-shaders', 'remove', path]);
}

function install_shaders(identifier, display_name, shaders, profile) {
  for (var i = 0; i < shaders.length; i++) {
    append_shader(shaders[i]);
  }
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
  if (utils.empty(obj)) {
    return;
  }
  var loaded_shaders = obj.shaders;
  for (var i = 0; i < loaded_shaders.length; i++) {
    remove_shader(loaded_shaders[i]);
  }
  restore_profile(obj.profile);
  stat[identifier] = null;
}

/**
 * @param {string} identifier
 * @param {string} display_name
 * @param {string} paths
 * @param {string=} profile
 */
function smart_shaders_handler(identifier, display_name, paths, profile) {
  if (identifier === '<clear>') {
    for (var key in stat) {
      var obj = stat[key];
      smart_shaders_handler(key, obj.display_name, obj.shaders.join(delimiter), obj.profile);
    }
    mp.osd_message('所有着色器已卸载', 2);
    return;
  }

  if (utils.empty(identifier)) {
    msg.error('empty identifier');
    return;
  }
  if (utils.empty(display_name)) {
    msg.error('empty display name');
    return;
  }

  if (utils.empty(paths)) {
    msg.error('empty shaders');
    return;
  }

  var shaders = (function () {
    var results = [];
    var s = paths.split(delimiter);
    for (var i = 0; i < s.length; i++) {
      var path = s[i].trim();
      if (!utils.empty(path)) {
        results.push(path);
      }
    }
    return results;
  })();

  if (utils.empty(shaders)) {
    msg.error('empty shaders');
    return;
  }

  if (stat[identifier]) {
    var obj = stat[identifier];
    var loaded_shaders = obj.shaders;
    var is_equal = shaders.length === loaded_shaders.length;
    if (is_equal) {
      for (var i = 0; i < loaded_shaders.length; i++) {
        var loaded_shader = loaded_shaders[i];
        var shader = shaders[i];
        if (is_equal && shader !== loaded_shader) {
          is_equal = false;
          break;
        }
      }
    }
    uninstall_shaders(identifier);
    mp.osd_message(obj.display_name + ' 着色器已卸载', 2);
    if (is_equal) {
      return;
    }
  }

  install_shaders(identifier, display_name, shaders, profile)
  mp.osd_message(display_name + ' 着色器已加载', 2);
}

mp.register_script_message('smart-shaders', smart_shaders_handler);
