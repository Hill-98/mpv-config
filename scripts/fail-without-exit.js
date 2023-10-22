/**
 * If idle=no, mpv will not quit when loading fails.
 */

'use strict';

var state = {
    end_reason: null,
    idle: '',
    idle_changed: false,
    no_observe_idle: false,
};

/**
 * @param {string} name
 * @param {string} value
 */
function idle_observer(name, value) {
    if (state.no_observe_idle) {
        return;
    }
    state.idle = value;
}

/**
 * @param {string} value
 * @param {boolean} no_observe
 */
function set_idle(value, no_observe) {
    if (no_observe) {
        state.no_observe_idle = true;
    }
    mp.set_property('idle', value);
    setTimeout(function () {
        state.no_observe_idle = false;
    }, 100);
}

mp.register_event('end-file', function (ev) {
    state.end_reason = ev.reason;
});

mp.add_hook('on_after_end_file', 99, function () {
    if (state.idle_changed && state.end_reason != 'error') {
        set_idle(state.idle);
        state.idle_changed = false;
    }
});

mp.add_hook('on_load_fail', 99, function () {
    if (mp.get_property_native('terminal')) {
        return;
    }
    if (mp.get_property('idle') !== 'yes') {
        set_idle('yes', true);
        setTimeout(function () {
            state.idle_changed = true;
        }, 300);
    }
});

mp.observe_property('idle', 'string', idle_observer);
