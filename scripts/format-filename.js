/**
 * Extracts the filename's information about the media and, if successful, sets it as the media title.
 */

'use strict';

var PROTOCOL_REGEX = /^\w+:\/\/|^\w+:\?/;

var options = {
    enable: true,
};
mp.options.read_options(options, 'format_filename', function () { });

/**
 * Examples:
 *   [VCB-Studio] Re Zero kara Hajimeru Isekai Seikatsu [01][Ma10p_1080p][x265_flac_aac]
 *   [VCB-Studio] Yama no Susume Second Season [06.5(OVA)][Ma10p_1080p][x265_flac]
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
    var regex = /^\[.+?\]\[?(.+?)\]?(?:\[(\d+(?:\.5)?(?:\(OVA\))?)\]|- (\d+))\s?[\[\(]/i;
    var results = filename.match(regex);
    if (results === null) {
        return undefined;
    }
    var name = results[1];
    var episode = results[2] || results[3];
    return name.trim() + ' [' + episode + ']';
}

/**
 * Examples:
 *   [VCB-Studio] Re Zero kara Hajimeru Isekai Seikatsu Hyouketsu no Kizuna [Ma10p_1080p][x265_flac]
 *   [FYSub][Pocket_Monsters_Movie23-COCO][BDRip][HEVC_FLAC_PSG][1080P_Ma10P](8CE0BE78)
 *   [AI-Raws] すずめの戸締まり (UHD HEVC SDR 3840x1608 yuv420p10le FLAC 字幕)[BB52FF32]
 *
 * Results:
 *   Re Zero kara Hajimeru Isekai Seikatsu Hyouketsu no Kizuna
 *   Pocket_Monsters_Movie23-COCO
 *   すずめの戸締まり
 *
 * @param {string} filename
 * @returns {string|undefined}
 */
function formatter_b(filename) {
    var regex = /^\[.+?\]\[?(.+?)\]?[\[\(]/;
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
 * Examples:
 *   Cyberpunk.Edgerunners.S01E10.My.Moon.My.Man.1080p
 *   The.Glory.S01E01.Episodio.1.1080p
 *
 * Results:
 *   Cyberpunk Edgerunners: My Moon My Man [10]
 *   The.Glory [01]
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
        subtitle = subtitle.replace(/\./g, ' ').trim();
        if (subtitle.match(/Episodio\s\d+/i) === null) {
            title += ': ' + subtitle;
        }
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

mp.add_hook('on_preloaded', 99, function () {
    if (!options.enable || mp.get_property_native('playback-abort')) {
        return;
    }

    // 没有被强制设置标题并且文件没有标题属性
    if (mp.get_property_native('force-media-title') !== '' || mp.get_property_native('filename') !== mp.get_property_native('media-title') || PROTOCOL_REGEX.test(mp.get_property_native('path'))) {
        return;
    }

    var filename = mp.get_property_native('filename/no-ext');
    var formatter = function unknown() { };
    var media_title = '';
    for (var i = 0; i < formatters.length; i++) {
        formatter = formatters[i];
        media_title = formatter(filename) || '';
        if (media_title !== '') {
            break;
        }
    }

    if (media_title === '') {
        mp.msg.info('Do nothing');
    } else {
        mp.set_property_native('file-local-options/force-media-title', media_title);
        mp.msg.info('Use formatter: ' + formatter.toString().match(/function (.+)\(/)[1]);
    }
});
