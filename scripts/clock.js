/**
 * 在右上角显示当前系统时间，并在一定时间后隐藏。
 * script-binding clock
 */

'use strict';

var osd = mp.create_osd_overlay('ass-events');
/** @type {number|null} */
var timer = null;
/** @type {number|null} */
var timeoutTimer = null;
var options = {
    timeout: 5000,
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
    return zeros.concat(str);
}

/**
 * @returns {string}
 */
function getTime() {
    var date = new Date();
    return fill0(date.getHours()) + ':' + fill0(date.getMinutes()) + ':' + fill0(date.getSeconds());
}

function destroy_clock() {
    clearInterval(timer);
    osd.remove();
    timer = null;
}

function show_clock() {
    osd.data = '{\\a7}' + getTime();
    osd.update();
}

mp.add_key_binding(null, 'clock', function () {
    if (timer) {
        clearTimeout(timeoutTimer);
        destroy_clock();
        return;
    }
    show_clock();
    timer = setInterval(show_clock, 300);
    timeoutTimer = setTimeout(destroy_clock, options.timeout);
});
