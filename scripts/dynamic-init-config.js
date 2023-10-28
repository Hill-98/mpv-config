'use strict';

var path = require('../script-modules/path');
var utils = mp.utils;

var property_list = mp.get_property_native('property-list');

/**
 * @param {string} option
 * @param {*} value
 * @param {*} default_values
 */
function set_default_option(option, value, default_values) {
    var dvs = Array.isArray(default_values) ? default_values : (default_values === undefined ? [mp.get_property_native('option-info/' + option + '/default-value')] : [default_values]);
    if (dvs.indexOf(mp.get_property_native(option)) !== -1) {
        mp.set_property_native(option, value);
        mp.msg.verbose('set ' + option + ' to ' + value);
    }
}

set_default_option('icc-cache-dir', utils.join_path(path.get_cache_path(), 'icc'), '');
set_default_option('gpu-shader-cache-dir', utils.join_path(path.get_cache_path(), 'gpu-shader'), '');
set_default_option(property_list.indexOf('watch-later-dir') !== -1 ? 'watch-later-dir' : 'watch-later-directory', utils.join_path(path.get_state_path(), 'watch-later'), '');
set_default_option(property_list.indexOf('screenshot-dir') !== -1 ? 'screenshot-dir' : 'screenshot-directory', path.get_desktop_path(), ['', '~~desktop/']);

exit();
