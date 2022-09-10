var parseHeader = function parseHeader(header) {
    var index = header.indexOf(':');
    if (index === -1) {
        return null;
    }
    return {
        name: header.substring(0, index).toLowerCase().trim(),
        value: header.substring(index + 1).toLowerCase().trim(),
        original: header,
    };
};

var GlobalHttpHeaders = {
    add: function add(name, value) {
        var header = name.concat(': ', value).toLowerCase();
        return mp.command_native(['change-list', 'file-local-options/http-header-fields', 'append', header]) === null;
    },
    clear: function clear() {
        return mp.command_native(['change-list', 'file-local-options/http-header-fields', 'clr', '']) === null;
    },
    del: function del(name, value) {
        var headers = this.get(name);
        if (headers === null) {
            return;
        }
        for (var i = 0; i < headers.length; i++) {
            if (value === undefined) {
                mp.command_native(['change-list', 'file-local-options/http-header-fields', 'remove', headers[i].original]) === null;
            } else if(value === headers[i].value) {
                mp.command_native(['change-list', 'file-local-options/http-header-fields', 'remove', headers[i].original]);
                break;
            }
        }
        return;
    },
    get: function get(name) {
        var _name = name.toLowerCase();
        var headers = this.list();
        var results = [];
        for (var i = 0; i < headers.length; i++) {
            if (_name === headers[i].name) {
                results.push(headers[i]);
            }
        }
        return results.length === 0 ? null : results;
    },
    has: function has(name) {
        return this.get(name) !== null;
    },
    list: function list() {
        var headers = mp.get_property_native('file-local-options/http-header-fields');
        var results = [];
        for (var i = 0; i < headers.length; i++) {
            results.push(parseHeader(headers[i]));
        }
        return results;
    }
};

var HttpHeaders = function () {
    function HttpHeaders() {
        this.headers = [];
    };
    var _proto = HttpHeaders.prototype;

    _proto.add = function add(name, value) {
        var _name = name.toLowerCase();
        var _value = value.toLowerCase();
        if (this.has(_name) || !GlobalHttpHeaders.add(_name, _value)) {
            return false;
        }
        this.headers.push({
            name: _name,
            value: _value,
        });
        return true;
    };

    _proto.clear = function clear() {
        var headers = this.list();
        for (var i = 0; i < headers.length; i++) {
            this.del(headers[i].name);
        }
    };

    _proto.del = function del(name) {
        var header = this.get(name);
        if (header === null) {
            return false;
        }
        GlobalHttpHeaders.del(header.name, header.value);
        var index = this.list().indexOf(header);
        this.headers.splice(index, 1);
        return true;
    };

    _proto.get = function get(name) {
        var _name = name.toLowerCase();
        var headers = this.list();
        for (var i = 0; i < headers.length; i++) {
            if (_name === headers[i].name) {
                return headers[i];
            }
        }
        return null;
    };

    _proto.has = function has(name) {
        return this.get(name) !== null;
    };

    _proto.list = function list() {
        return this.headers;
    };

    return HttpHeaders;
}();

HttpHeaders.global = GlobalHttpHeaders;
HttpHeaders.parse = parseHeader;

module.exports = HttpHeaders;
