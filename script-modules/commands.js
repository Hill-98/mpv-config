'use strict';

/**
 * @param {Array} args
 * @returns {Array}
 */
var arguments2array = function arguments2array(args) {
    return Array.prototype.slice.call(args).filter(function (v) { return v !== undefined; });
};

var default_value = function default_value(value, default_value) {
    return value === undefined ? default_value : value;
};

function command_native() {
    var args = arguments2array(arguments);
    if (args.length === 1 && typeof args[0] === 'object') {
        return mp.command_native(args[0]);
    }
    return mp.command_native(args);
}

function command_native_async() {
    var args = arguments2array(arguments);
    var callback = args.pop();
    var result = undefined;
    if (args.length === 1 && typeof args[0] === 'object') {
        result = mp.command_native_async(args[0], callback);
    } else {
        result = mp.command_native_async(args, callback);
    }
    return {
        abort: mp.abort_async_command.bind(result),
    };
}

function audio_add(url) {
    return command_native('audio-add', url);
}

function apply_profile(profile) {
    return command_native('apply-profile', profile);
}

function change_list(name) {
    var change_list_command = function change_list_command(name, operator) {
        var args = arguments2array(arguments).slice(2);
        return command_native('change-list', name, operator, args[0]);
    };
    var obj = {
        add: change_list_command.bind(this, name, 'add'),
        append: change_list_command.bind(this, name, 'append'),
        clr: change_list_command.bind(this, name, 'clr', ''),
        pre: change_list_command.bind(this, name, 'pre'),
        remove: change_list_command.bind(this, name, 'remove'),
        set: change_list_command.bind(this, name, 'set'),
        toggle: change_list_command.bind(this, name, 'toggle'),
    };
    Object.defineProperty(obj, 'name', {
        enumerable: true,
        value: name,
        writable: false,
    });
    return obj;
}


function expand_path(path) {
    return command_native('expand-path', path);
}

function keypress(key) {
    return command_native('keypress', key);
}

function loadfile(file, mode) {
    return command_native('loadfile', file, mode);
}

function restore_profile(profile) {
    return command_native('apply-profile', profile, 'restore');
}

function subprocess(args, options) {
    var obj = JSON.parse(JSON.stringify(options || {
        playback_only: false,
        capture_stdout: true,
        capture_stderr: true,
    }));
    obj.name = 'subprocess';
    obj.args = args;
    return command_native(obj);
}

function subprocess_async(args, options, callback) {
    var cb = default_value(callback, typeof options === 'function' ? options : function () { });
    var opt = typeof options === 'object' ? options : undefined;
    var obj = JSON.parse(JSON.stringify(opt || {
        playback_only: false,
        capture_stdout: true,
        capture_stderr: true,
    }));
    obj.name = 'subprocess';
    obj.args = args;
    return command_native_async(obj, cb);
}

module.exports = {
    audio_add: audio_add,
    apply_profile: apply_profile,
    change_list: change_list,
    expand_path: expand_path,
    keypress: keypress,
    loadfile: loadfile,
    restore_profile: restore_profile,
    subprocess: subprocess,
    subprocess_async: subprocess_async
};

