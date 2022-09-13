/**
 * 加载 http(s) 或 ytdl 协议时自动设置一些 HTTP HEADER
 * 用于解决部分网站无法正常播放的问题
 */

'use strict';

var PROTOCOLS = [
    'ytdl',
];

var msg = mp.msg;
var HttpHeaders = require('../script-modules/HttpHeaders');

mp.add_hook('on_load', 99, function () {
    /** @type {string} */
    var url = mp.get_property_native('path');
    if (url.indexOf('webplay:?') === 0) {
        url = mp.get_property_native('stream-open-filename');
    }
    for (var i = 0; i < PROTOCOLS.length; i++) {
        url = url.replace(new RegExp('^' + PROTOCOLS[i] + ':(\/\/)?'), '');
    }
    if (url.match(/^https?:\/\//) === null) {
        return;
    }
    var http_headers = new HttpHeaders();
    var headers = [];
    var matches = url.match(/https?:\/\/[\w\.-]+/);
    if (matches !== null) {
        headers.push('origin: ' + matches[0]);
    }
    headers.push('referer: ' + url);
    for (var i = 0; i < headers.length; i++) {
        var header = HttpHeaders.parse(headers[i]);
        if (!HttpHeaders.global.has(header.name)) {
            msg.info('Add header: ' + header.original);
            http_headers.add(header.name, header.value);
        }
    }
});
