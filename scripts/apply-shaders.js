var msg = mp.msg;
var delimiter = ';';
var loaded = Object.create(null);

function apply_profile(name) {
  if (!name) {
    return
  }
  mp.command_native(['apply-profile', name]);
}

function restore_profile(name) {
  if (!name) {
    return
  }
  mp.command_native(['apply-profile', name, 'restore']);
}

function append_shader(path) {
  mp.command_native(['change-list', 'glsl-shaders', 'append', mp.command_native(['expand-path', path])]);
}

function remove_shader(path) {
  mp.command_native(['change-list', 'glsl-shaders', 'remove', mp.command_native(['expand-path', path])]);
}

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

function handle(identifier, display_name, paths, profile) {
  if (identifier === '<clear>') {
    for (var key in loaded) {
      var obj = loaded[key];
      handle(key, obj.display_name, obj.shaders.join(delimiter), obj.profile);
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

mp.register_script_message('apply-shaders', handle);
