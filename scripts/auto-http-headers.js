/**
 * Auto set some http headers for http(s) and ytlp protocols
 */

'use strict';

var PREFIX_REGEX = /^https?:\/\//;
var PROTOCOLS = [
    'ytdl',
].map(function (v) { return new RegExp('^' + v + ':(\/\/)?'); });
var URL_REGEX = /https?:\/\/[\w\.-]+/;

var msg = mp.msg;
var HttpHeaders = require('../script-modules/HttpHeaders');

mp.add_hook('on_load', 99, function () {
    if (mp.get_property_native('playback-abort')) {
        return;
    }

    /** @type {string} */
    var url = mp.get_property_native('path');
    PROTOCOLS.forEach(function (regex) { return url = url.replace(regex, ''); });
    if (!PREFIX_REGEX.test(url)) {
        return;
    }
    var http_headers = new HttpHeaders();
    var headers = [];
    var matches = url.match(URL_REGEX);
    if (matches !== null) {
        headers.push('origin: ' + matches[0]);
    }
    headers.push('referer: ' + url);
    headers.forEach(function (h) {
        var header = HttpHeaders.parse(h);
        if (!HttpHeaders.global.has(header.name)) {
            msg.info('Add header: ' + header.original);
            http_headers.add(header.name, header.value);
        }
    });
});
