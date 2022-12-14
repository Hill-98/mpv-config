/**
 * 加载 http(s) 或 ytdl 协议时自动设置一些 HTTP HEADER
 * 用于解决部分网站无法正常播放的问题
 */

'use strict';

var msg = mp.msg;
var HttpHeaders = require('../script-modules/HttpHeaders');

var http_prefix_regex = /^https?:\/\//;
var protocols = [
    'ytdl',
].map(function (v) { return new RegExp('^' + v + ':(\/\/)?'); });
var url_regex = /https?:\/\/[\w\.-]+/;

mp.add_hook('on_load', 99, function () {
    if (mp.get_property_native('playback-abort')) {
        return;
    }

    /** @type {string} */
    var url = mp.get_property_native('path');
    protocols.forEach(function (regex) { return url = url.replace(regex, ''); });
    if (!http_prefix_regex.test(url)) {
        return;
    }
    var http_headers = new HttpHeaders();
    var headers = [];
    var matches = url.match(url_regex);
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
