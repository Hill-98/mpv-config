var commands = require('./commands');
var os = require('./DetectOS')();
var utils = mp.utils;
var windows_path_regex = /^[A-Z]:|^\\\\/i;

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
 * @param {string} path
 * @returns {string}
 */
function format_windows_path(path) {
    return path.replace(/\//g, '\\');
}

/**
 * @returns {string}
 */
function get_cache_path() {
    if (os === 'windows') {
        var localappdata = utils.getenv('LOCALAPPDATA');
        return format_windows_path(utils.join_path(localappdata, 'mpv'));
    }
    var path = commands.expand_path('~~cache/');
    return trim_path(path);
}

/**
 * @returns {string}
 */
function get_desktop_path() {
    if (os === 'linux') {
        var process = commands.subprocess('/bin/sh', '-c', 'source ~/.config/user-dirs.dirs && echo -n $XDG_DESKTOP_DIR');
        if (process.status == 0) {
            return process.stdout;
        }
    }
    var path = commands.expand_path(['darwin', 'windows'].indexOf(os) !== -1 ? '~~desktop/' : '~/Desktop');
    return trim_path(path);
}

/**
 * @returns {string}
 */
function get_state_path() {
    if (os === 'windows') {
        var localappdata = utils.getenv('LOCALAPPDATA');
        return format_windows_path(utils.join_path(localappdata, 'mpv'));
    }
    var path = commands.expand_path('~~state/');
    return trim_path(path);
}

/**
 * @param {string} path
 * @returns {string}
 */
function trim_path(path) {
    return /[\/\\]$/.test(path) ? path.substring(0, path.length - 1) : path;
}

module.exports = {
    absolute_path: absolute_path,
    format_windows_path: format_windows_path,
    get_cache_path: get_cache_path,
    get_desktop_path: get_desktop_path,
    get_state_path: get_state_path,
    trim_path: trim_path,
};
