/**
 * 用法: script-message apply-shaders <identifier> <display_name> <shaders> [profile]
 * 
 * 方便切换具有相同功能的着色器集合
 *  
 * 加载/卸载 着色器集合并用标识符记录，如果标识符之前已被用于加载其他着色器，则先卸载已加载的着色器，如果着色器和已加载的一致，则卸载着色器。
 */

var msg = mp.msg;
var delimiter = ';';
var loaded = Object.create(null);

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

/**
 * @param {*} value
 * @returns {boolean}
 */
function empty(value) {
  if (value === undefined || value === null) {
    return true;
  }
  if (typeof value === 'string' && value.trim() === '') {
    return true;
  }
  if (Array.isArray(value) && value.length === 0) {
    return true;
  }
  return false;
}

/**
 * @param {string} identifier
 * @param {string} display_name
 * @param {string} paths
 * @param {string} profile
 */
function handler(identifier, display_name, paths, profile) {
  if (identifier === '<clear>') {
    for (var key in loaded) {
      var obj = loaded[key];
      handler(key, obj.display_name, obj.shaders.join(delimiter), obj.profile);
    }
    mp.osd_message('所有着色器已卸载', 2);
    return;
  }

  if (empty(identifier)) {
    msg.error('empty identifier');
    return;
  }
  if (empty(display_name)) {
    msg.error('empty display name');
    return;
  }
  if (empty(paths)) {
    msg.error('empty shaders');
    return;
  }

  var shaders = (function () {
    var results = [];
    var s = paths.split(delimiter);
    for (var i = 0; i < s.length; i++) {
      var path = s[i];
      if (!empty(path)) {
        results.push(path);
      }
    }
    return results;
  })();

  if (empty(shaders)) {
    msg.error('empty shaders');
    return;
  }

  if (loaded[identifier]) {
    var obj = loaded[identifier];
    var loaded_shaders = obj.shaders;
    var is_equal = shaders.length === loaded_shaders.length;
    for (var i = 0; i < loaded_shaders.length; i++) {
      var loaded_shader = loaded_shaders[i];
      var shader = shaders[i];
      remove_shader(loaded_shader);
      if (is_equal && shader !== loaded_shader) {
        is_equal = false;
      }
    }
    restore_profile(obj.profile);
    delete loaded[identifier];
    mp.osd_message(obj.display_name + ' 着色器已卸载', 2);
    if (is_equal) {
      return;
    }
  }

  for (var i = 0; i < shaders.length; i++) {
    append_shader(shaders[i]);
  }
  apply_profile(profile);
  loaded[identifier] = {
    'shaders': shaders,
    'profile': profile,
    'display_name': display_name,
  };
  mp.osd_message(display_name + ' 着色器已加载', 2);
}

mp.register_script_message('apply-shaders', handler);
