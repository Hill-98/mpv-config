/**
 * 加载 http(s) 或 ytdl 协议时自动设置一些 HTTP HEADER
 * 用于解决部分网站无法正常播放的问题
 */

var msg = mp.msg;
var HTTP_HEADERS = [];

function append_header(header) {
    mp.command_native(['change-list', 'http-header-fields', 'append', header]);
    HTTP_HEADERS.push(header);
    msg.info('Append http header: ' + header);
}

function remove_header(header) {
    mp.command_native(['change-list', 'http-header-fields', 'remove', header]);
}

mp.add_hook('on_load', 50, function () {
    var url = mp.get_property_native('path').replace('ytdl://', '');
    if (url.match(/^https?:\/\//) === null) {
        return;
    }
    var matches = url.match(/https?:\/\/[\w\.-]+/);
    if (matches !== null) {
        append_header('origin: ' + matches[0]);
    }
    append_header('referer: ' + url);
});

mp.add_hook('on_unload', 50, function () {
    for (var i = 0; i < HTTP_HEADERS.length; i++) {
        remove_header(HTTP_HEADERS[i]);
    }
    HTTP_HEADERS = [];
});
