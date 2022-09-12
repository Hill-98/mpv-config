/**
 * 播放文件失败时不自动退出 mpv
 */

'use strict';

var msg = mp.msg;
/** @type {string} */
var IDLE = mp.get_property_native('idle');
var IDLE_CHANGED = false;

/**
 * @param {string} name
 * @param {string} value
 */
function observe_idle(name, value) {
    IDLE = value;
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
    if (!IDLE_CHANGED) {
        set_idle(IDLE);
    }
    IDLE_CHANGED = false;
});

mp.add_hook('on_load_fail', 50, function () {
    if (mp.get_property_native('terminal')) {
        return;
    }
    set_idle('yes');
    IDLE_CHANGED = true;
});

mp.observe_property('idle', 'native', observe_idle);

