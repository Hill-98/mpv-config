'use strict';

var commands = require('./commands');
var os = require('./DetectOS')();
var utils = mp.utils;

/**
 * @param {string} source
 * @param {string} dest
 * @returns {boolean}
 */
function copy_dir(source, dest) {
    if (os === 'windows') {
        var args = ['Robocopy.exe', source, dest, '/S', '/R:1'];
        process = commands.subprocess(args);
        return process.status >= 0 && process.status < 8;
    }
    var args = ['cp', '-p', '-r', source, dest];
    return commands.subprocess(args).status === 0;
}

/**
 * @param {string} dir
 * @returns {boolean}
 */
function create_dir(dir) {
    var args = ['mkdir', '-p', dir];
    if (os === 'windows') {
        args = ['cmd.exe', '/c', 'mkdir', dir];
    }
    return commands.subprocess(args).status === 0;
}

/**
 * @param {string} dir
 * @returns {boolean}
 */
function dir_exist(dir) {
    var info = utils.file_info(dir);
    return typeof info === 'object' && info.is_dir;
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
 * @param {string} file
 * @param {boolean} ignore_comments
 * @returns {string[]|undefined}
 */
function read_file_lines(file, ignore_comments) {
    var ic = ignore_comments === undefined ? true : ignore_comments;
    var data;
    try {
        data = utils.read_file(file);
    } catch (err) {
    }
    if (typeof data !== 'string') {
        return undefined;
    }
    var lines = data.replace(/\r/g, '').split('\n');
    var results = lines.filter(function (v) {
        var line = v.trim();
        return line !== '' && !(ic && line.indexOf('#') === 0);
    });
    return results;
}

/**
 * @param {string} dir
 * @returns {boolean}
 */
function remove_dir(dir) {
    var args = ['rm', '-r', dir];
    if (os === 'windows') {
        args = ['cmd.exe', '/c', 'rmdir', '/S', '/Q', dir];
    }
    return commands.subprocess(args).status === 0;
}

module.exports = {
    copy_dir: copy_dir,
    create_dir: create_dir,
    dir_exist: dir_exist,
    file_exist: file_exist,
    read_file_lines: read_file_lines,
    remove_dir: remove_dir,
};
