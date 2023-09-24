'use strict';

var commands = require('./commands');
var os = require('./DetectOS')();
var p = require('./path');
var utils = mp.utils;

/**
 * @param {IArguments} args
 * @returns {Array}
 */
function arguments2array(args) {
    return Array.prototype.slice.call(args).filter(function (v) { return v !== undefined; });
}

function default_value(value, default_value) {
    return value === undefined ? default_value : value;
}

/**
 * @param {*} value
 * @returns {boolean}
 */
function empty(value) {
    if (value === undefined || value === null) {
        return true;
    }
    if (typeof value === 'string' && value === '') {
        return true;
    }
    if (Array.isArray(value) && value.length === 0) {
        return true;
    }
    return false;
}

/**
 * @returns {string}
 */
function string_format(str) {
    var args = arguments2array(arguments).slice(1);
    var result = '';
    var is_symbol = false;
    for (var i = 0; i < str.length; i++) {
        var char = str[i];
        if (is_symbol) {
            if (char === '%') {
                result += '%';
            } else {
                var s = char === 's' ? args.shift() : undefined;
                result += s === undefined ? '%' + char : s;
            }
            is_symbol = false;
        } else {
            if (char === '%') {
                is_symbol = true;
            } else {
                result += char;
            }
        }
    }
    return result;
}

/**
 * @param {string} name
 * @param {boolean} auto_append_exe
 * @returns {string|undefined}
 */
function which(name, auto_append_exe) {
    var _name = default_value(name, '');
    if (_name.trim() === '') {
        return undefined;
    }
    var path = utils.getenv('PATH') || utils.getenv('Path') || utils.getenv('path');
    if (path === undefined) {
        return undefined;
    }
    var append_exe = default_value(auto_append_exe, true);
    if (append_exe && os === 'windows' && _name.indexOf('.exe') === -1) {
        _name += '.exe';
    }
    var paths = path.split(os === 'windows' ? ';' : ':');
    for (var i = 0; i < paths.length; i++) {
        var executable = utils.join_path(paths[i], _name);
        var info = utils.file_info(executable);
        if (info && info.is_file) {
            return p.absolute_path(executable);
        }
    }
    return undefined;
}

module.exports = {
    arguments2array: arguments2array,
    default_value: default_value,
    empty: empty,
    string_format: string_format,
    which: which,
};
