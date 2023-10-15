'use strict';

function know_platform(platform) {
    return ['darwin', 'linux', 'windows'].indexOf(platform) !== -1;
}

/**
 * @returns {string|undefined}
 */
function detect_os() {
    /** @type {string} */
    var platform = mp.get_property_native('platform');
    if (know_platform(platform)) {
        return platform;
    }
    var home = mp.utils.getenv('USERPROFILE') || '';
    if (/^[A-Z]:\\/i.test(home)) {
        return 'windows';
    }
    var process = mp.command_native({
        name: 'subprocess',
        args: ['uname', '-s'],
        capture_stdout: true,
        capture_stderr: true,
        playback_only: false,
    });
    if (process.status === 0) {
        var os = process.stdout.trim().toLowerCase();
        if (know_platform(os)) {
            return os;
        }
    }
    return undefined;
}


module.exports = detect_os;
