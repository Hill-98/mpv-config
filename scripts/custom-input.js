'use strict';

var utils = mp.utils;
var commands = require('../script-modules/commands');
var io = require('../script-modules/io');
var custom_input_conf = commands.expand_path('~~/input.local.conf');

var options = {
    enable: false,
};
mp.options.read_options(options, 'custom_input');

/**
 * @param {string} line
 * @returns {string}
 */
function handle_input_line(line) {
    var str = line.trim();
    if (str.indexOf('#@') === 0) {
        var path = commands.expand_path(str.substring(2).trim());
        if (io.file_exist(path)) {
            str = utils.read_file(path);
        }
    }
    return str;
}

if (options.enable && io.file_exist(custom_input_conf)) {
    var lines = io.read_file_lines(custom_input_conf, false);
    var path = commands.expand_path('~~/.input.conf');
    var str = lines.map(handle_input_line).join('\n');
    if (!io.file_exist(path) || utils.read_file(path) !== str) {
        utils.write_file('file://' + path, str);
        mp.osd_message('输入文件已更改，请重启。');
    }
}
