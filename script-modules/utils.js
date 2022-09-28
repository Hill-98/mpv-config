'use strict';

var utils = mp.utils;

function absolute_path(path) {
    if (path.indexOf('/') === 0 || path.match(/^[A-Za-z]:/) !== null) {
        return path;
    }
    return utils.join_path(mp.get_property_native('working-directory'), path);
}

function arguments2array(args) {
    return Array.prototype.slice.call(args).filter(function (v) { return v !== undefined });
}

function default_value (value, default_value) {
    return value === undefined ? default_value : value;
}

function detect_os() {
    var home = utils.getenv('USERPROFILE');
    if (typeof home === 'string' && home.match(/^[A-Za-z]:/) !== null) {
        return 'windows';
    }
    var process = mp.command_native({
        name: 'subprocess',
        capture_stdout: true,
        playback_only: false,
        args: ['uname'],
    });
    if (process.status === 0) {
        var os = process.stdout;
        if (os.indexOf('Linux') !== -1) {
            return 'linux';
        }
        if (os.indexOf('Darwin') !== -1) {
            return 'macos';
        }
    }
    return undefined;
}

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

function dir_exist(dir) {
    var info = utils.file_info(dir);
    return typeof info === 'object' && info.is_dir;
}

function file_exist(file) {
    var info = utils.file_info(file);
    return typeof info === 'object' && info.is_file;
}

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

module.exports = {
    absolute_path: absolute_path,
    arguments2array: arguments2array,
    default_value: default_value,
    detect_os: detect_os,
    empty: empty,
    dir_exist: dir_exist,
    file_exist: file_exist,
    read_file_lines: read_file_lines,
};
