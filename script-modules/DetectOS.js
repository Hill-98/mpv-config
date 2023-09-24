var commands = require('../script-modules/commands');

/**
 * @returns {string|undefined}
 */
function detect_os() {
    var home = mp.utils.getenv('USERPROFILE');
    if (typeof home === 'string' && /^[A-Z]:|^\\\\/i.test(home)) {
        return 'windows';
    }
    var process = commands.subprocess(['uname', '-s']);
    if (process.status === 0) {
        var os = process.stdout.trim();
        if (os === 'Linux') {
            return 'linux';
        }
        if (os === 'Darwin') {
            return 'macos';
        }
    }
    return undefined;
}


module.exports = detect_os;
