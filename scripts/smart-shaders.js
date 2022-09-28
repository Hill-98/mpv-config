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
var commands = require('../script-modules/commands');
var u = require('../script-modules/utils');
/** @type {Object.<string, StatObj>} */
var stat = {};
var glsl_shaders = commands.change_list('glsl-shaders');

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
  return paths.split(';').filter(function (v) { return v.trim() !== '' });
}

function install_shaders(identifier, display_name, shaders, profile) {
  shaders.forEach(glsl_shaders.append);
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
  loaded_shaders.forEach(glsl_shaders.remove);
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
    Object.keys(stat).forEach(uninstall_shaders);
    mp.osd_message('所有着色器已卸载', 2);
    return;
  }

  if (identifier === '<show>') {
    var keys = Object.keys(stat).filter(function (key) { return !u.empty(stat[key]); });
    var text = u.string_format('当前已加载的着色器 : %s\n', keys.length);
    keys.forEach(function (key) {
      var obj = stat[key];
      text += obj.display_name + u.string_format(' <%s> \n', key);
    });
    text += '(不包括配置文件预加载的着色器)\n';
    text += '查看着色器详细信息: 打开统计信息然后按数字键 2';
    mp.osd_message(text, 5);
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
    mp.osd_message(loaded_obj.display_name + ' 着色器已卸载', 2);
    var equal = shaders.join('|') === loaded_obj.shaders.join('|');
    if (equal) {
      return;
    }
  }

  install_shaders(identifier, display_name, shaders, profile)
  mp.osd_message(display_name + ' 着色器已加载', 2);
}

mp.register_script_message('smart-shaders', smart_shaders_handler);
