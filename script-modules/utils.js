'use strict';

var commands = require('../script-modules/commands');
var utils = mp.utils;
var windows_path_regex = new RegExp('^([A-Za-z]:)|(\\\\)');

/**
 * @param {string} path
 * @returns {string}
 */
function absolute_path(path) {
    if (path.indexOf('/') === 0 || windows_path_regex.test(path)) {
        return path;
    }
    return utils.join_path(mp.get_property_native('working-directory'), path);
}

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
 * @returns {string}
 */
function detect_os() {
    var home = utils.getenv('USERPROFILE');
    if (typeof home === 'string' && windows_path_regex.test(home)) {
        return 'windows';
    }
    var process = commands.subprocess(['uname', '-s']);
    if (process.status === 0) {
        var os = process.stdout.trim();
        if (os === 'Linux') {
            return 'linux';
        }
        if (os === 'Darwin') {
            return 'macos';
        }
    }
    return undefined;
}

var os = detect_os();

/**
 * @param {string} dir
 * @returns {boolean}
 */
function dir_exist(dir) {
    var info = utils.file_info(dir);
    return typeof info === 'object' && info.is_dir;
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
 * @param {string} file
 * @returns {boolean}
 */
function file_exist(file) {
    var info = utils.file_info(file);
    return typeof info === 'object' && info.is_file;
}

/**
 * @param {string} path
 * @returns {string}
 */
function format_windows_path(path) {
    return path.replace('/', '\\');
}

/**
 * @param {string} file
 * @param {boolean} ignore_comments
 * @returns {string[]|undefined}
 */
function read_file_lines(file, ignore_comments) {
    if (!file_exist(file)) {
        return undefined;
    }
    var ic = default_value(ignore_comments, true);
    var data = utils.read_file(file);
    if (typeof data !== 'string') {
        return undefined;
    }
    var lines = data.replace('\r', '').split('\n');
    var results = lines.filter(function (v) {
        var line = v.trim();
        return line !== '' && !(ic && line.indexOf('#') === 0);
    });
    return results;
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
        if (file_exist(executable)) {
            return absolute_path(executable);
        }
    }
    return undefined;
}

module.exports = {
    absolute_path: absolute_path,
    arguments2array: arguments2array,
    default_value: default_value,
    detect_os: detect_os,
    dir_exist: dir_exist,
    empty: empty,
    file_exist: file_exist,
    format_windows_path: format_windows_path,
    read_file_lines: read_file_lines,
    string_format: string_format,
    which: which,
};
