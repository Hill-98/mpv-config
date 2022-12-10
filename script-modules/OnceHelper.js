'use strict';

function OnceEvent(event, handler) {
    var fn = function (ev) {
        handler(ev);
        mp.unregister_event(fn);
    };
    return mp.register_event(event, fn);
}

function OnceIdle(handler) {
    var fn = function () {
        handler();
        mp.unregister_idle(fn);
    };
    return mp.register_idle(fn);
}

module.exports = {
    event: OnceEvent,
    idle: OnceIdle,
};
