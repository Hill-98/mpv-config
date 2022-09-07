module.exports = {
    once: function (event, handler) {
        var fn = function () {
            handler.call(this, arguments);
            mp.unregister_event(fn);
        }
        return mp.register_event(event, fn);
    },
};
