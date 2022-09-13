/**
 * 自动加载配置目录下 profiles 或 profiles.local 文件，文件内容为要加载的配置文件列表。
 * smart-profile 命令会使用内部状态决定对配置文件执行加载还是还原操作。
 * apply-profile 命令会加载配置文件，但如果内部状态是已加载则不进行任何操作。
 * restore-profile 命令会还原配置文件，但如果内部状态是未加载则不进行任何操作。
 */

var msg = mp.msg;
var commands = require('../script-modules/commands');
var u = require('../script-modules/utils');

/** @type {string[]} */
var FILES = [
    commands.expand_path('~~/profiles.local'),
    commands.expand_path('~~/profiles'),
];
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
    return state
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
        msg.info('empty profile');
        return;
    }
    var name = restored_message === undefined ? u.default_value(display_name, profile) : profile;
    var messages = {
        loaded: restored_message === undefined ? name + ' 配置文件已加载' : display_name,
        restored: u.default_value(restored_message, name + ' 配置文件已还原'),
    };
    var state = switch_profile_state(profile);
    mp.osd_message(state ? messages.loaded : messages.restored);
}

mp.register_script_message('apply-profile', apply_profile_handler);
mp.register_script_message('restore-profile', restore_profile_handler);
mp.register_script_message('smart-profile', smart_profile_handler);

for (var i = 0; i < FILES.length; i++) {
    var file = FILES[i];
    var profiles = u.read_file_lines(file);
    if (profiles === undefined) {
        continue;
    }
    for (var k = 0; k < profiles.length; k++) {
        apply_profile_handler(profiles[k]);
    }
    break;
}
