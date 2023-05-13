/**
 * 如果 idle=no，则文件加载失败时不自动退出。
 */

'use strict';

var state = {
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

mp.add_hook('on_unload', 99, function () {
    if (state.idle_changed) {
        set_idle(state.idle);
    }
    state.idle_changed = false;
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
