'use strict';

module.exports = {
    default_value: function (value, default_value) {
        return value === undefined ? default_value : value;
    },
    empty: function empty(value) {
        if (value === undefined || value === null) {
            return true;
        }
        if (typeof value === 'string' && value === '') {
            return true;
        }
        if (Array.isArray(value) && value.length === 0) {
            return true;
        }
        return false;
    }
};
