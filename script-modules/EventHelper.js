'use strict';

module.exports = {
    once: function once(event, handler) {
        var fn = function (ev) {
            handler(ev);
            mp.unregister_event(fn);
        }
        return mp.register_event(event, fn);
    },
};
