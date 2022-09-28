'use strict';

var u = require('../script-modules/utils');

function command_native() {
    var args = u.arguments2array(arguments);
    if (args.length === 1 && typeof args[0] === 'object') {
        return mp.command_native(args[0]);
    }
    return mp.command_native(args);
}

function apply_profile(profile) {
    return command_native('apply-profile', profile);
}

function change_list(name) {
    var change_list_command = function change_list_command(name, operator) {
        var args = u.arguments2array(arguments).slice(2);
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

function loadfile(file, mode, options) {
    return command_native('loadfile', file, mode, options);
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

module.exports = {
    apply_profile: apply_profile,
    change_list: change_list,
    expand_path: expand_path,
    keypress: keypress,
    loadfile: loadfile,
    restore_profile: restore_profile,
    subprocess: subprocess,
};

