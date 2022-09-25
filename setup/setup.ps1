using namespace Microsoft.Win32
using namespace System.Diagnostics
using namespace System.IO
using namespace System.Security
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
[string]$WEBPLAY_IDENTIFIER = "$COMMON_IDENTIFIER.WebPlay"
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
[array]$PROTOCOLS = @(
    @{ Prefix = "webplay"; OpenWith = $WEBPLAY_IDENTIFIER }
)

[string]$MPV_CONFIG_DIR = [Path]::GetDirectoryName($PSScriptRoot)
[string]$mpv = ""

[Window]$topWindow = New-Object Window
$topWindow.Height = 0
$topWindow.Topmost = $true
$topWindow.Visibility = [Visibility]::Hidden
$topWindow.Width = 0
$topWindow.WindowStyle = [WindowStyle]::None
$topWindow.Show()

$Env:Path += ";$MPV_CONFIG_DIR;" + [Path]::GetDirectoryName($MPV_CONFIG_DIR)

try {
    $mpv = (Get-Command -CommandType Application mpv.exe -ErrorAction Stop).Source
    if ([MessageBox]::Show("已找到 mpv.exe: $mpv`n是否需要手动选择其他 mpv.exe？", "提示", [MessageBoxButton]::YesNo, [MessageBoxImage]::Question) -eq [MessageBoxResult]::Yes) {
        $mpv = ""
    }
}
catch {
    [MessageBox]::Show("未找到 mpv.exe，请手动选择。", "提示", [MessageBoxButton]::OK, [MessageBoxImage]::Warning) | Out-Null
}

if ([string]::IsNullOrEmpty($mpv)) {
    $selector = New-Object OpenFileDialog
    $selector.FileName = "mpv.exe"
    $selector.Filter = "mpv.exe|mpv.exe"
    $selector.Title = "选择"
    if ($selector.ShowDialog()) {
        $mpv = $selector.FileName
    }
    else {
        [MessageBox]::Show("没有选择 mpv.exe，终止配置。", "提示", [MessageBoxButton]::OK, [MessageBoxImage]::Warning) | Out-Null
        exit 2
    }
}

[string]$mpvArg = ""
if ([MessageBox]::Show("你想自定义 mpv 的命令行参数吗？（仅限高级用户）", "提示", [MessageBoxButton]::YesNo, [MessageBoxImage]::Question) -eq [MessageBoxResult]::Yes) {
    $mpvArg = [Microsoft.VisualBasic.Interaction]::InputBox("在下方输入自定义 mpv 命令行参数", "自定义 mpv 命令行参数", "", 100, 100)
}
$mpvArg = "$($mpvArg.Trim()) --config-dir=""$MPV_CONFIG_DIR""".Trim()
[string]$mpvVideoCommand = """$mpv"" $mpvArg -- ""%1"""
[string]$mpvPlaylistCommand = """$mpv"" $mpvArg --playlist=""%1"""
[string]$mpvWebVideoCommand = $mpvVideoCommand

Write-Output "mpv.exe: $mpv"
Write-Output "mpv config dir: $MPV_CONFIG_DIR"
Write-Output "mpv arg: $mpvArg"
Write-Output ""

[string]$mpvConf = [Path]::Combine($MPV_CONFIG_DIR, "mpv.conf")
[string]$localConf = [Path]::Combine($MPV_CONFIG_DIR, "local.conf")
[string]$fontsConfData = [File]::ReadAllText([Path]::Combine($MPV_CONFIG_DIR, "fonts.windows.conf"))
$fontsConfData = $fontsConfData.Replace("%CONFIG_DIR%", [SecurityElement]::Escape($MPV_CONFIG_DIR))
if (![File]::Exists($localConf)) {
    [File]::WriteAllBytes($localConf, [Encoding]::UTF8.GetBytes("# 自定义配置文件`n"))
}
[File]::WriteAllBytes([Path]::Combine($MPV_CONFIG_DIR, "fonts.conf"), [Encoding]::UTF8.GetBytes($fontsConfData))
[File]::WriteAllText($mpvConf, @'
include="~~/common.conf"
include="~~/windows.conf"
include="~~/local.conf"
'@);

[string]$mpvAppDataDir = [Environment]::ExpandEnvironmentVariables("%APPDATA%\mpv")
if ([Directory]::Exists($mpvAppDataDir)) {
    [FileInfo]$mpvAppDataDirInfo = New-Object -TypeName FileInfo -ArgumentList $mpvAppDataDir
    if ($mpvAppDataDirInfo.Attributes.HasFlag([FileAttributes]::ReparsePoint) -or (Get-ChildItem -Path $mpvAppDataDir).Count -eq 0) {
        [Directory]::Delete($mpvAppDataDir)
    }
    else {
        [string]$mpvAppDataDirBackup = $mpvAppDataDir + ".bak." + [DateTime]::Now.ToString("yyyyMMddHHmmss")
        Write-Output "Backup mpv appdata dir: $mpvAppDataDir -> $mpvAppDataDirBackup"
        [Directory]::Move($mpvAppDataDir, $mpvAppDataDirBackup)
    }
}
Write-Output "Create symbolic link: $mpvAppDataDir -> $MPV_CONFIG_DIR"
Start-Process -FilePath cmd.exe -ArgumentList @("/c", "mklink", "/D", "/J", $mpvAppDataDir, $MPV_CONFIG_DIR) -Verb runas -Wait
Write-Output ""

AddProgramID -Identifier $VIDEO_IDENTIFIER -Name $APP_NAME -Icon "$MPV_CONFIG_DIR\setup\icons\video.ico" -OpenCmd $mpvVideoCommand
AddProgramID -Identifier $PLAYLIST_IDENTIFIER -Name $APP_NAME -Icon "$MPV_CONFIG_DIR\setup\icons\playlist.ico" -OpenCmd $mpvPlaylistCommand
AddProgramID -Identifier $WEBPLAY_IDENTIFIER -Name $APP_NAME -Icon "" -OpenCmd $mpvWebVideoCommand

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


foreach ($protocol in $PROTOCOLS) {
    Write-Output "Register protocol: $($protocol.Prefix)"
    [string]$command = [Registry]::CurrentUser.OpenSubKey("Software\Classes\$($protocol.OpenWith)\shell\open\command").GetValue($null);
    [RegistryKey]$protocolReg = [Registry]::CurrentUser.CreateSubKey("Software\Classes\$($protocol.Prefix)", $true)
    $protocolReg.SetValue($null, "URL:$($protocol.Prefix)")
    $protocolReg.SetValue("URL Protocol", "")
    $protocolReg.CreateSubKey("shell\open\command").SetValue($null, $command)
    $protocolReg.Close()
    [Registry]::CurrentUser.CreateSubKey("$APP_CAP_REG_PATH\URLAssociations", $true).SetValue("$($protocol.Prefix)", $protocol.OpenWith)
}

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
[MessageBox]::Show("视频和播放列表文件已关联到 mpv", "提示", [MessageBoxButton]::OK, [MessageBoxImage]::Information) | Out-Null
$topWindow.Close()

Start-Process -FilePath ms-settings:defaultapps
