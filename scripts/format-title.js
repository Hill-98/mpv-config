/**
 * 格式化文件名为清晰可读的标题
 */

'use strict';

var PROTOCOL_REGEX = /^\w+:\/\/|^\w+:\?/;

var options = {
    enable: true,
};
mp.options.read_options(options, 'format_title');

if (!options.enable) {
    exit();
}

/**
 * Examples:
 *   [VCB-Studio] Re Zero kara Hajimeru Isekai Seikatsu [01][Ma10p_1080p][x265_flac_aac]
 *   [VCB-Studio] Yama no Susume Second Season [06.5(OVA)][Ma10p_1080p][x265_flac_aac]
 *   [Nekomoe kissaten&LoliHouse] Ryza no Atelier - 01 [WebRip 1080p HEVC-10bit AAC ASSx2]
 *   [Moozzi2] Tengen Toppa Gurren Lagann - 01 (BD 1920x1080 x.265-10Bit 2Audio)
 *
 * Result:
 *   Re Zero kara Hajimeru Isekai Seikatsu [01]
 *   Yama no Susume Second Season [06.5(OVA)]
 *   Ryza no Atelier [01]
 *   Tengen Toppa Gurren Lagann [01]
 *
 * @param {string} filename
 * @returns {string|undefined}
 */
function formatter_a(filename) {
    var regex = /^\[.+?\]\[?(.+?)\]?(?:\[(\d+(\.5)?(\(OVA\))?)\]|- (\d+))\s?[\[\(]/i;
    var results = filename.match(regex);
    if (results === null) {
        return undefined;
    }
    var name = results[1];
    var episode = results[2] || results[5];
    return name.trim() + ' [' + episode + ']';
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
 * Examples:
 *   5.Centimeters.Per.Second.2007.1080p.BluRay.x264
 *   Digimon.Adventure.Last.Evolution.Kizuna.2020.JAPANESE.1080p.BluRay.x264
 *   Barbie 2023 AMZN 4K WEBRip 2160p
 *
 * Results:
 *   5 Centimeters Per Second (2007)
 *   Digimon Adventure Last Evolution Kizuna (2020)
 *   Barbie (2023)
 *
 * @param {string} filename
 * @returns {string|undefined}
 */
function formatter_c(filename) {
    var regex = /^(.*)(?:\s|\.)(\d{4})((?:\s|\.)(?:\w+))?(?:\s|\.)(4K|\d{3,4}p)/i;
    var results = filename.match(regex);
    if (results === null) {
        return undefined;
    }
    var name = results[1];
    var year = results[2];
    return name.replace(/\./g, ' ').trim() + ' (' + year + ')';
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
    var regex = /^(.*)(?:\s|\.)S(\d+)E(\d+)(?:\s|\.)?([\w\-.]+)?(?:\s|\.)\d{3,4}p/i;
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
    return title + ' [' + episode + ']';
}

/**
 * Example: Jimmy.Fallon.2022.10.13.Trevor.Noah.1080p
 *
 * Result: Jimmy Fallon: Trevor.Noah [2022.10.13]
 * @param {string} filename
 * @returns {string|undefined}
 */
function formatter_e(filename) {
    var regex = /^(.*)(?:\s|\.)(\d{4}(?:\s|\.)\d{2}(?:\s|\.)\d{2})(?:\s|\.)?([\w\-.]+)?(?:\s|\.)\d{3,4}p/i;
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
    return title + ' [' + date + ']';
}

var formatters = [
    formatter_a,
    formatter_b,
    formatter_c,
    formatter_d,
    formatter_e,
];

mp.add_hook('on_load', 99, function () {
    // 没有被强制设置标题并且文件没有标题属性
    if (mp.get_property_native('force-media-title') !== '' || mp.get_property_native('filename') !== mp.get_property_native('media-title') || PROTOCOL_REGEX.test(mp.get_property_native('path'))) {
        return;
    }

    var filename = mp.get_property_native('filename/no-ext');
    for (var i = 0; i < formatters.length; i++) {
        var formatter = formatters[i];
        var title = formatter(filename);
        if (title) {
            mp.set_property_native('file-local-options/force-media-title', title);
            mp.msg.info('Use formatter: ' + formatter.toString().match(/function (.+)\(/)[1]);
            break;
        }
    }
});
