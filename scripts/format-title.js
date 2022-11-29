/**
 * 格式化文件名为清晰可读的标题
 */

'use strict';

var is_protocol_regex = new RegExp('^\w+:\/\/|^\w+:\?');
var options = {
    enable: true,
};
mp.options.read_options(options, 'format_title');

/**
 * Examples:
 *   [VCB-Studio] Re Zero kara Hajimeru Isekai Seikatsu [01][Ma10p_1080p][x265_flac_aac]
 *   [VCB-Studio] Yama no Susume Second Season [06.5(OVA)][Ma10p_1080p][x265_flac]
 *
 * Result: Yama no Susume Second Season [06.5(OVA)]
 *
 * @param {string} filename
 * @returns {string|undefined}
 */
function formatter_a(filename) {
    var regex = /^\[.+?\]\[?(.+?)\]?(\[\d+(\.5)?(\(OVA\))?\])/;
    var results = filename.match(regex);
    if (results === null) {
        return undefined;
    }
    var name = results[1];
    var episode = results[2];
    return name.trim() + ' ' + episode;
}

/**
 * Example: [VCB-Studio] Re Zero kara Hajimeru Isekai Seikatsu Hyouketsu no Kizuna [Ma10p_1080p][x265_flac]
 *
 * Result: Re Zero kara Hajimeru Isekai Seikatsu Hyouketsu no Kizuna
 *
 * @param {string} filename
 * @returns {string|undefined}
 */
function formatter_b(filename) {
    var regex = /^\[.+?\]\[?(.+?)\]?\[/;
    var results = filename.match(regex);
    if (results === null) {
        return undefined;
    }
    var name = results[1];
    return name.trim();
}

/**
 * Example: 5.Centimeters.Per.Second.2007.1080p.BluRay.x264
 *
 * Result: 5 Centimeters Per Second
 *
 * @param {string} filename
 * @returns {string|undefined}
 */
function formatter_c(filename) {
    var regex = /^([\w\-.]+)\.\d{4}\.\d{3,4}p/;
    var results = filename.match(regex);
    if (results === null) {
        return undefined;
    }
    var name = results[1];
    return name.replace(/\./g, ' ').trim();
}

/**
 * Example: Cyberpunk.Edgerunners.S01E10.My.Moon.My.Man.1080p
 *
 * Result: Cyberpunk Edgerunners: My Moon My Man [10]
 *
 * @param {string} filename
 * @returns {string|undefined}
 */
function formatter_d(filename) {
    var regex = /^([\w\-.]+)\.S(\d+)E(\d+)\.?([\w\-.]+)?\.\d{3,4}p/;
    var results = filename.match(regex);
    if (results === null) {
        return undefined;
    }
    var name = results[1];
    var season = results[2];
    var episode = results[3];
    var subtitle = results[4];
    var title = name.replace(/\./g, ' ').trim();
    if (parseInt(season) > 1) {
        title += ' ' + season;
    }
    if (subtitle) {
        title += ': ' + subtitle.replace(/\./g, ' ').trim();
    }
    title += ' [' + episode + ']';
    return title;
}

/**
 * Example: Jimmy.Fallon.2022.10.13.Trevor.Noah.1080p
 *
 * Result: Jimmy Fallon: Trevor.Noah [2022.10.13]
 * @param {string} filename
 * @returns {string|undefined}
 */
function formatter_e(filename) {
    var regex = /^([\w\-.]+)\.(\d{4}\.\d{2}\.\d{2})\.?([\w\-.]+)?\.\d{3,4}p/;
    var results = filename.match(regex);
    if (results === null) {
        return undefined;
    }
    var name = results[1];
    var date = results[2];
    var subtitle = results[3];
    var title = name.replace(/\./g, ' ').trim();
    if (subtitle) {
        title += ': ' + subtitle.replace(/\./g, ' ').trim();
    }
    title += ' [' + date + ']';
    return title;
}

var formatters = [
    formatter_a,
    formatter_b,
    formatter_c,
    formatter_d,
    formatter_e,
];

mp.add_hook('on_load', 99, function () {
    if (!options.enable) {
        return;
    }

    var filename = mp.get_property_native('filename/no-ext');
    if (mp.get_property_native('force-media-title') !== '' || mp.get_property_native('filename') !== mp.get_property_native('media-title') || is_protocol_regex.test(mp.get_property_native('path'))) {
        return;
    }

    for (var i = 0; i < formatters.length; i++) {
        var formatter = formatters[i];
        var title = formatter(filename);
        if (title) {
            mp.set_property_native('file-local-options/force-media-title', title);
            break;
        }
    }
});
