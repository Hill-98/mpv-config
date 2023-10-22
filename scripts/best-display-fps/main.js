/**
 * Auto set the display device refresh rate to the most appropriate refresh rate
 * within the supported range for the video frame rate.
 *
 * The default is disabled.
 */

'use strict';

var MATCH_RESULTS = Object.freeze({
    BEST: 1,
    MAYBE_BEST: 2,
    VSYNC_BEST: 3,
    MISS: 0,
});

var commands = require('../../script-modules/commands');
var u = require('../../script-modules/utils');
var msg = mp.msg;
var utils = mp.utils;

var options = {
    enable: false,
    change_display_delay: 3000,
    end_file_delay: 3000,
    pause_wait_delay: 2000,
};
var scripts = {
    // TODO: Linux 实现
    windows: utils.join_path(utils.split_path(mp.get_script_file())[0], 'refresh-rate.ps1'),
};
var state = {
    before_refresh_rate: 0,
    display: null,
    end_change_timer: null,
    os: require('../../script-modules/DetectOS')(),
    observe_change_timer: null,
    observe_display_names_first: true,
};

if (state.os !== 'windows') {
    msg.warn('Currently only Windows operating systems are supported.');
}

/**
 * @typedef {Object} RefreshRateResult
 * @property {number} current
 * @property {number[]} supported
 */

/**
 * @param {string} display
 * @param {number=} refresh_rate
 * @returns {RefreshRateResult|boolean}
 */
function call_refresh_rate(display, refresh_rate) {
    var rate = u.default_value(refresh_rate, 0);
    var process;
    if (state.os === 'windows') {
        process = commands.subprocess(['PowerShell.exe', '-NoLogo', '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'RemoteSigned', '-File', scripts.windows, display, rate.toString()]);
    }

    if (process === undefined || process.status !== 0) {
        if (typeof process === 'object') {
            msg.verbose(process.status);
            msg.verbose(process.error_string);
            msg.verbose(process.stderr);
        }
        return false;
    }

    try {
        return JSON.parse(process.stdout);
    } catch (err) {
        msg.verbose(err);
        return false;
    }
}

/**
 * @param {number} refresh_rate
 * @param {number} target
 * @returns {number}
 */
function match_refresh_rate(refresh_rate, target) {
    if (refresh_rate - target === 0) {
        return MATCH_RESULTS.BEST;
    }
    if (Math.abs(refresh_rate - target) <= 1) {
        return MATCH_RESULTS.MAYBE_BEST;
    }
    if (refresh_rate % target === 0) {
        return MATCH_RESULTS.VSYNC_BEST;
    }
    return MATCH_RESULTS.MISS;
}

/**
 * @returns {boolean}
 */
function auto_refresh_rate() {
    /** @type string[] */
    var displays = mp.get_property_native('display-names');
    var video_fps = mp.get_property_native('container-fps');
    if (!Array.isArray(displays) || displays.length <= 0 || typeof video_fps !== 'number') {
        msg.error("Unable to get 'display-names' or 'container-fps' properties.");
        return false;
    }
    var display = displays[0];
    var refresh_rate = call_refresh_rate(display);
    if (typeof refresh_rate !== 'object') {
        msg.error(u.string_format('Unable to get monitor (%s) refresh rate data.', display));
        return false;
    }
    refresh_rate.supported.sort(function (a, b) { return a - b; });

    var best_refresh_rate = 0;
    var match_result = 99;
    refresh_rate.supported.forEach(function (value) {
        var result = match_refresh_rate(value, video_fps.toFixed(3));
        if (result !== MATCH_RESULTS.MISS && result < match_result) {
            best_refresh_rate = value;
            match_result = result;
        }
        // 让 vsync match 优先使用高刷新率
        if (match_result === MATCH_RESULTS.VSYNC_BEST && value > best_refresh_rate) {
            best_refresh_rate = value;
        }
    });
    if (best_refresh_rate === refresh_rate.current) {
        return true;
    }
    if (best_refresh_rate === 0) {
        return false;
    }
    if (call_refresh_rate(display, best_refresh_rate)) {
        if (state.before_refresh_rate === 0) {
            state.display = display;
            state.before_refresh_rate = refresh_rate.current;
        }
        msg.info(u.string_format('Monitor (%s) refresh rate is set to %s.', display, best_refresh_rate));
        return true;
    } else {
        msg.error(u.string_format('Setting monitor (%s) refresh rate to %s failed.', display, best_refresh_rate));
        return false;
    }
}

function clear_end_change_timer() {
    if (state.end_change_timer !== null) {
        clearTimeout(state.end_change_timer);
        state.end_change_timer = null;
    }
}

function clear_observe_change_timer() {
    if (state.observe_change_timer !== null) {
        clearTimeout(state.observe_change_timer);
        state.observe_change_timer = null;
    }
}

/**
 * @param {Function} fn
 */
function pause_wait(fn) {
    if (mp.get_property_native('pause') === false) {
        mp.set_property_native('file-local-options/pause', true);
    }
    fn();
    setTimeout(function () {
        mp.set_property_native('file-local-options/pause', false);
    }, options.pause_wait_delay);
}

function restore_refresh_rate() {
    if (state.display !== null && state.before_refresh_rate !== 0 && !call_refresh_rate(state.display, state.before_refresh_rate)) {
        msg.error(u.string_format('Restore monitor (%s) refresh rate to %s failed.', state.display, state.before_refresh_rate));
        return;
    }
    state.display = null;
    state.before_refresh_rate = 0;
}

function observe_display_names() {
    if (state.observe_display_names_first === true || mp.get_property_native('stream-open-filename') === undefined) {
        state.observe_display_names_first = false;
        return;
    }
    clear_observe_change_timer();
    state.observe_change_timer = setTimeout(function () {
        pause_wait(function () {
            restore_refresh_rate();
            auto_refresh_rate();
        });
    }, options.change_display_delay);
}

function on_end_file() {
    clear_end_change_timer();
    state.end_change_timer = setTimeout(function () {
        restore_refresh_rate();
    }, options.end_file_delay);
}

function on_file_loaded() {
    clear_end_change_timer();
    clear_observe_change_timer();
    pause_wait(function () {
        if (!auto_refresh_rate()) {
            restore_refresh_rate();
        }
    });
}

function on_update_options() {
    if (options.enable) {
        mp.observe_property('display-names', 'native', observe_display_names);
        mp.register_event('end-file', on_end_file);
        mp.register_event('file-loaded', on_file_loaded);
    } else {
        mp.unobserve_property(observe_display_names);
        mp.unregister_event(on_end_file);
        mp.unregister_event(on_file_loaded);
        clear_end_change_timer();
        clear_observe_change_timer();
        restore_refresh_rate();
        state.observe_display_names_first = true;
    }
}

mp.register_event('shutdown', function () {
    restore_refresh_rate();
});

mp.options.read_options(options, 'best_display_fps', on_update_options);
on_update_options();
