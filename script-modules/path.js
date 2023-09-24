var os = require('./DetectOS')();
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
    return path.replace('/', '\\');
}

/**
 * @returns {string}
 */
function get_cache_path() {
    var path = commands.expand_path(os === 'windows' ? '~/AppData/Local/mpv/' : '~~cache/');
    return path.substring(0, path.length - 1);
}

/**
 * @returns {string}
 */
function get_state_path() {
    var path = commands.expand_path(os === 'windows' ? '~/AppData/Local/mpv/' : '~~state/');
    return path.substring(0, path.length - 1);
}

module.exports = {
    absolute_path: absolute_path,
    format_windows_path: format_windows_path,
    get_cache_path: get_cache_path,
    get_state_path: get_state_path,
};
