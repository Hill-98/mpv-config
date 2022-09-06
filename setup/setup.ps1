using namespace Microsoft.Win32
using namespace System.IO
using namespace System.Text
using namespace System.Windows

Add-Type -AssemblyName Microsoft.VisualBasic
Add-Type -AssemblyName mscorlib
Add-Type -AssemblyName PresentationFramework

function AddProgramID([string]$Identifier, [string]$Name, [string]$Icon, [string]$OpenCmd) {
    if ([string]::IsNullOrWhiteSpace($Identifier)) {
        throw "Identifier is empty"
    }
    [string]$regPath = "Software\Classes\$Identifier"
    [Registry]::CurrentUser.DeleteSubKeyTree($regPath, $false)
    [RegistryKey]$reg = [Registry]::CurrentUser.CreateSubKey($regPath, $true)
    $reg.CreateSubKey("DefaultIcon", $true).SetValue($null, $Icon)
    $reg.CreateSubKey("shell\open", $true).SetValue("FriendlyAppName", $Name)
    $reg.CreateSubKey("shell\open\command", $true).SetValue($null, $OpenCmd)
    $reg.Close()
}

[string]$COMMON_IDENTIFIER = "MPV.Player"
[string]$VIDEO_IDENTIFIER = "$COMMON_IDENTIFIER.Video"
[string]$PLAYLIST_IDENTIFIER = "$COMMON_IDENTIFIER.Playlist"
[string]$APP_NAME = "MPV Player"
[string]$APP_REG_PATH = "Software\Clients\Media\$COMMON_IDENTIFIER"
[string]$APP_CAP_REG_PATH = "$APP_REG_PATH\Capabilities"

[array]$FILETYPES = @(
    # Video
    @{ ContentType = "video/avi"; Ext = "avi"; OpenWith = $VIDEO_IDENTIFIER; PerceivedType = "video" },
    @{ ContentType = "video/x-flv"; Ext = "flv"; OpenWith = $VIDEO_IDENTIFIER; PerceivedType = "video" },
    @{ ContentType = "video/MP2T"; Ext = "m2ts"; OpenWith = $VIDEO_IDENTIFIER; PerceivedType = "video" },
    @{ ContentType = "video/x-matroska"; Ext = "mkv"; OpenWith = $VIDEO_IDENTIFIER; PerceivedType = "video" },
    @{ ContentType = "video/quicktime"; Ext = "mov"; OpenWith = $VIDEO_IDENTIFIER; PerceivedType = "video" },
    @{ ContentType = "video/mp4"; Ext = "mp4"; OpenWith = $VIDEO_IDENTIFIER; PerceivedType = "video" },
    @{ ContentType = "video/MP2T"; Ext = "ts"; OpenWith = $VIDEO_IDENTIFIER; PerceivedType = "video" },
    @{ ContentType = "video/webm"; Ext = "webm"; OpenWith = $VIDEO_IDENTIFIER; PerceivedType = "video" },
    @{ ContentType = "video/x-ms-wmv"; Ext = "wmv"; OpenWith = $VIDEO_IDENTIFIER; PerceivedType = "video" },
    # Playlist
    @{ ContentType = "application/vnd.apple.mpegurl"; Ext = "m3u"; OpenWith = $PLAYLIST_IDENTIFIER; PerceivedType = "text" },
    @{ ContentType = "application/vnd.apple.mpegurl"; Ext = "m3u8"; OpenWith = $PLAYLIST_IDENTIFIER; PerceivedType = "text" },
    @{ ContentType = "application/vnd.apple.mpegurl"; Ext = "vlc"; OpenWith = $PLAYLIST_IDENTIFIER; PerceivedType = "text" }
)

$BASE64_TEXT = @{
    A = "0GM6eQ=="; # prompt box title
    B = "8l1+YjBSIABtAHAAdgA6ACAAJQBtAHAAdgAlAAoAL2YmVACXgYlLYqhSCZDpYiAAbQBwAHYALgBlAHgAZQAgAO+NhF8f/w=="; # found mpv
    C = "Kmd+YjBSIABtAHAAdgAuAGUAeABlAAz/94tLYqhSCZDpYiAAbQBwAHYALgBlAHgAZQAgAO+NhF8CMA==" # not found mpv
    D = "YE/zYOqBmltJTiAAbQBwAHYAIACEdn1U5E5MiMJTcGUXVB//"; # ask custom mpv cmd arg
    E = "KFcLTrllk49lUeqBmltJTiAAbQBwAHYAIAB9VOROTIjCU3Bl";  # custom mpv cmd arg prompt
    F = "6oGaW0lOIABtAHAAdgAgAH1U5E5MiMJTcGU="; # custom mpv cmd arg title
    G = "oWwJZwmQ6WIgAG0AcAB2AC4AZQB4AGUADP/IfmJrTZFufwIw"; # no mpv.exe selected
    Z = "xomRmIxUrWQ+ZRdSaIiHZfZO8l1zUVSAMFIgAG0AcAB2AA=="; # done
}
$TEXT = @{}

[string]$MPV_CONFIG_DIR = [Path]::GetDirectoryName($PSScriptRoot)
[string]$mpv = ""

[Window]$topWindow = New-Object Window
$topWindow.Height = 0
$topWindow.Topmost = $true
$topWindow.Visibility = [Visibility]::Hidden
$topWindow.Width = 0
$topWindow.WindowStyle = [WindowStyle]::None
$topWindow.Show()

foreach ($key in $BASE64_TEXT.Keys) {
    $TEXT.Add($key, [Encoding]::Unicode.GetString([Convert]::FromBase64String($BASE64_TEXT.$key)))
}

if (![File]::Exists("$MPV_CONFIG_DIR\mpv.conf")) {
    Write-Output "Create symbolic link: $MPV_CONFIG_DIR\mpv.conf -> $MPV_CONFIG_DIR\windows.conf"
    Start-Process -FilePath cmd.exe -ArgumentList @("/c", "mklink", "$MPV_CONFIG_DIR\mpv.conf", "windows.conf") -Verb runas
    if (!$?) {
        exit 1
    }
}

try {
    $mpv = (Get-Command -CommandType Application mpv.exe -ErrorAction Stop).Source
    if ([MessageBox]::Show($TEXT.B.Replace("%mpv%", $mpv), $TEXT.A, [MessageBoxButton]::YesNo, [MessageBoxImage]::Question) -eq [MessageBoxResult]::Yes) {
        $mpv = ""
    }
}
catch {
    [MessageBox]::Show($TEXT.C, $TEXT.A, [MessageBoxButton]::OK, [MessageBoxImage]::Warning)
}

If ([string]::IsNullOrEmpty($mpv)) {
    $selector = New-Object OpenFileDialog
    $selector.FileName = "mpv.exe"
    $selector.Filter = "mpv.exe|mpv.exe"
    if ($selector.ShowDialog()) {
        $mpv = $selector.FileName
    }
    else {
        [MessageBox]::Show($TEXT.G, $TEXT.A, [MessageBoxButton]::OK, [MessageBoxImage]::Warning) | Out-Null
        exit 2
    }
}

[string]$mpvArg = ""
if ([MessageBox]::Show($TEXT.D, $TEXT.A, [MessageBoxButton]::YesNo, [MessageBoxImage]::Question) -eq [MessageBoxResult]::Yes) {
    $mpvArg = [Microsoft.VisualBasic.Interaction]::InputBox($TEXT.E, $TEXT.F, "", 100, 100)
}
$mpvArg = ($mpvArg.Trim() + " --config-dir=""$MPV_CONFIG_DIR""").Trim()
[string]$mpvVideoCommand = """$mpv"" $mpvArg ""%1"""
[string]$mpvPlaylistCommand = """$mpv"" $mpvArg --playlist=""%1"""
[string]$mpvWebCommand = """$mpv"" $mpvArg -- ""%1"""

Write-Output "mpv.exe: $mpv"
Write-Output "mpv config dir: $MPV_CONFIG_DIR"
Write-Output "mpv arg: $mpvArg"
Write-Output ""

[string]$mpvAppDataDir = [Environment]::ExpandEnvironmentVariables("%APPDATA%\mpv")
if ([Directory]::Exists($mpvAppDataDir)) {
    [FileInfo]$fileInfo = New-Object -TypeName FileInfo -ArgumentList $mpvAppDataDir
    if ($fileInfo.Attributes.HasFlag([FileAttributes]::ReparsePoint) -or (Get-ChildItem -Path $mpvAppDataDir).Count -eq 0) {
        [Directory]::Delete($mpvAppDataDir, $true)
    }
    else {
        Write-Output "Backup mpv appdata dir: $mpvAppDataDir -> $mpvAppDataDir.bak"
        [Directory]::Move($mpvAppDataDir, "$mpvAppDataDir.bak")
    }

}
Write-Output "Create symbolic link: $mpvAppDataDir -> $MPV_CONFIG_DIR"
Start-Process -FilePath cmd.exe -ArgumentList @("/c", "mklink", "/D", "/J", $mpvAppDataDir, $MPV_CONFIG_DIR) -Verb runas
Write-Output ""

AddProgramID -Identifier $VIDEO_IDENTIFIER -Name $APP_NAME -Icon "$MPV_CONFIG_DIR\setup\icons\video.ico" -OpenCmd $mpvVideoCommand
AddProgramID -Identifier $PLAYLIST_IDENTIFIER -Name $APP_NAME -Icon "$MPV_CONFIG_DIR\setup\icons\playlist.ico" -OpenCmd $mpvPlaylistCommand

[Registry]::CurrentUser.DeleteSubKeyTree($APP_REG_PATH, $false)
[Registry]::CurrentUser.CreateSubKey($APP_CAP_REG_PATH, $true).SetValue("ApplicationName", $APP_NAME)
[Registry]::CurrentUser.CreateSubKey($APP_CAP_REG_PATH, $true).SetValue("ApplicationIcon", "$mpv, 0")
[Registry]::CurrentUser.CreateSubKey("Software\RegisteredApplications", $true).SetValue($COMMON_IDENTIFIER, $APP_CAP_REG_PATH)

foreach ($fileType in $FILETYPES) {
    Write-Output "Register file type: $($fileType.Ext)"
    [RegistryKey]$typeReg = [Registry]::CurrentUser.CreateSubKey("Software\Classes\.$($fileType.Ext)", $true)
    $typeReg.SetValue($null, $fileType.OpenWith)
    $typeReg.SetValue("Content Type", $fileType.ContentType)
    $typeReg.SetValue("PerceivedType", $fileType.PerceivedType)
    $typeReg.CreateSubKey("OpenWithProgids").SetValue($fileType.OpenWith, "")
    $typeReg.Close()
    [Registry]::CurrentUser.CreateSubKey("$APP_CAP_REG_PATH\FileAssociations", $true).SetValue(".$($fileType.Ext)", $fileType.OpenWith)
}

[RegistryKey]$protocolReg = [Registry]::CurrentUser.CreateSubKey("$APP_CAP_REG_PATH\Protocols\webplay", $true)
$protocolReg.SetValue($null, "URL:webplay")
$protocolReg.SetValue("URL Protocol", "")
$protocolReg.CreateSubKey("shell\open\command").SetValue($null, $mpvWebCommand)
$protocolReg.Close()
Write-Output "Register protocol: webplay"

$code = @'
  [System.Runtime.InteropServices.DllImport("Shell32.dll")]
  private static extern int SHChangeNotify(int eventId, int flags, IntPtr item1, IntPtr item2);
  public static void Refresh() { SHChangeNotify(0x8000000, 0x1000, IntPtr.Zero, IntPtr.Zero); }
'@
Add-Type -MemberDefinition $code -Namespace WinAPI -Name Explorer
[WinAPI.Explorer]::Refresh()

Write-Output ""
Write-Output "Done!"

$topWindow.Activate() | Out-Null
[MessageBox]::Show($TEXT.Z, $TEXT.A, [MessageBoxButton]::OK, [MessageBoxImage]::Information) | Out-Null
$topWindow.Close()

Start-Process -FilePath ms-settings:defaultapps
