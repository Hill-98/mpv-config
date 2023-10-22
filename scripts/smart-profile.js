/**
 * Load the profiles or profiles.local file in the configuration directory with
 * the profiles that need to be applied by default.
 *
 * Use:
 *   script-message smart-profile <profile>: Decide whether to apply or restore profile based on internal state.
 *   script-message apply-profile <profile>: Apply profile, but do nothing if the internal state is loaded.
 *   script-message restore-profile <profile>: Restore profile, but do nothing if the internal state is unloaded.
 */

'use strict';

var msg = mp.msg;
var commands = require('../script-modules/commands');
var io = require('../script-modules/io');
var u = require('../script-modules/utils');

/** @type {Object.<string, boolean>} */
var stat = {};

/**
 * @param {string} profile
 * @returns {boolean}
 */
function get_profile_state(profile) {
    return !!stat[profile];
}

/**
 * @param {string} profile
 * @returns {boolean}
 */
function switch_profile_state(profile) {
    var state = get_profile_state(profile);
    if (state) {
        commands.restore_profile(profile);
    } else {
        commands.apply_profile(profile);
    }
    state = !state;
    stat[profile] = state;
    return state;
}

/**
 * @param {string} profile
 */
function apply_profile_handler(profile) {
    if (u.empty(profile) || get_profile_state(profile)) {
        return;
    }
    switch_profile_state(profile);
}

/**
 * @param {string} profile
 */
function restore_profile_handler(profile) {
    if (u.empty(profile) || !get_profile_state(profile)) {
        return;
    }
    switch_profile_state(profile);
}

/**
 * @param {string} profile
 * @param {string=} display_name
 * @param {string=} restored_message
 */
function smart_profile_handler(profile, display_name, restored_message) {
    if (u.empty(profile)) {
        msg.error('empty profile');
        return;
    }
    var name = restored_message === undefined ? u.default_value(display_name, profile) : profile;
    var messages = {
        loaded: restored_message === undefined ? name + ' 配置文件应用' : display_name,
        restored: u.default_value(restored_message, name + ' 配置文件已还原'),
    };
    var state = switch_profile_state(profile);
    /** @type {string} */
    var message = state ? messages.loaded : messages.restored;
    if (message.trim() !== '') {
        mp.osd_message(message);
    }
}

mp.register_script_message('apply-profile', apply_profile_handler);
mp.register_script_message('restore-profile', restore_profile_handler);
mp.register_script_message('smart-profile', smart_profile_handler);

(function () {
    var files = [
        commands.expand_path('~~/profiles.local'),
        commands.expand_path('~~/profiles'),
    ];
    for (var i = 0; i < files.length; i++) {
        var file = files[i];
        var profiles = io.read_file_lines(file);
        if (profiles === undefined) {
            continue;
        }
        profiles.forEach(apply_profile_handler);
        break;
    }
})();
