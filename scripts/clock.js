/**
 * 在右上角显示当前系统时间，并在一定时间后隐藏。
 * script-binding clock
 */

/**
 * @typedef {Object} StateObj
 * @property {boolean} showing
 * @property {number|null} timer
 * @property {number|null} timeout_timer
 */

'use strict';

var osd = mp.create_osd_overlay('ass-events');
var options = {
    timeout: 5000,
};
/** @type {StateObj} */
var state = {
    showing: false,
    timer: null,
    timeout_timer: null,
};

mp.options.read_options(options, 'clock');

/**
 * @param {string|number} value
 * @param {number=} count
 * @returns {string}
 */
function fill0(value, count) {
    var str = value.toString().trim();
    var zeros = '';
    var total = (count === undefined ? 2 : count) - str.length;
    for (var i = 0; i < total; i++) {
        zeros += '0';
    }
    return zeros + str;
}

/**
 * @returns {string}
 */
function getTime() {
    var date = new Date();
    return fill0(date.getHours()) + ':' + fill0(date.getMinutes()) + ':' + fill0(date.getSeconds());
}

function hide_clock() {
    osd.remove();
    state.showing = false;
}

function show_clock() {
    osd.data = '{\\a7}' + getTime();
    osd.update();
    state.showing = true;
}

mp.add_key_binding(null, 'clock', function () {
    if (state.showing) {
        clearInterval(state.timer);
        clearTimeout(state.timeout_timer);
        hide_clock();
        return;
    }
    show_clock();
    state.timer = setInterval(show_clock, 300);
    state.timeout_timer = setTimeout(function () {
        clearInterval(state.timer);
        hide_clock();
    }, options.timeout);
});
