/**
 * 加载文件失败时不自动退出 mpv
 */

/**
 * @typedef {Object} StatObj
 * @property {string} idle
 * @property {boolean} idle_changed
 */

'use strict';

/** @type {StatObj} */
var stat = {
    idle: mp.get_property_native('idle'),
    idle_changed: false,
};

/**
 * @param {string} name
 * @param {string} value
 */
function observe_idle(name, value) {
    stat.idle = value;
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
    if (!stat.idle_changed) {
        set_idle(stat.idle);
    }
    stat.idle_changed = false;
});

mp.add_hook('on_load_fail', 50, function () {
    if (mp.get_property_native('terminal')) {
        return;
    }
    set_idle('yes');
    stat.idle_changed = true;
});

mp.observe_property('idle', 'native', observe_idle);
