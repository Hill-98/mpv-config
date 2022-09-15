/**
 * 加载文件失败时不自动退出 mpv
 */

/**
 * @typedef {Object} StateObj
 * @property {string} idle
 * @property {boolean} idle_changed
 */

'use strict';

/** @type {StateObj} */
var state = {
    idle: mp.get_property_native('idle'),
    idle_changed: false,
};

/**
 * @param {string} name
 * @param {string} value
 */
function observe_idle(name, value) {
    state.idle = value;
}

/**
 * @param {string} value
 */
function set_idle(value) {
    mp.unobserve_property(observe_idle);
    mp.set_property_native('idle', value);
    setTimeout(function () {
        mp.observe_property('idle', 'native', observe_idle);
    }, 100);
}

mp.add_hook('on_unload', 50, function () {
    if (!state.idle_changed) {
        set_idle(state.idle);
    }
    state.idle_changed = false;
});

mp.add_hook('on_load_fail', 50, function () {
    if (mp.get_property_native('terminal')) {
        return;
    }
    set_idle('yes');
    state.idle_changed = true;
});

mp.observe_property('idle', 'native', observe_idle);
