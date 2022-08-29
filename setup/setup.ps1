Add-Type -AssemblyName Microsoft.VisualBasic
Add-Type -AssemblyName System.Windows.Forms

[Windows.Forms.Application]::EnableVisualStyles()

function AddProgramID([string]$Identifier, [string]$Name, [string]$Icon, [string]$OpenCmd) {
    if ($Identifier.Trim() -eq "") {
        throw "Identifier is empty"
    }
    [string]$regPath = "HKCU:\Software\Classes\$Identifier"
    Remove-Item -Path $regPath -Force -Recurse
    New-Item -Path $regPath\DefaultIcon -Force
    New-Item -Path $regPath\shell\open\command -Force
    New-ItemProperty -Path "$regPath\DefaultIcon" -Name "(Default)" -Value $Icon
    New-ItemProperty -Path "$regPath\shell\open" -Name "FriendlyAppName" -Value $Name
    New-ItemProperty -Path "$regPath\shell\open\command" -Name "(Default)" -Value $OpenCmd
}

function AssociateFile([string]$Identifier, [string]$ExtName) {
    if ($Identifier.Trim() -eq "" -or $ExtName.Trim() -eq "") {
        throw "Identifier or ExtName is empty"
    }
    [string]$regPath = "HKCU:\Software\Classes\." + $ExtName.Trim(".")
    New-Item -Path "$regPath\OpenWithProgids" -Force
    Set-ItemProperty -Path $regPath -Name "(Default)" -Value $Identifier
    Set-ItemProperty -Path "$regPath\OpenWithProgids" -Name $Identifier -Value ""  -Force
    Set-ItemProperty -Path $CLIENT_REG_PATH\Capabilities\FileAssociations -Name ".$ext" -Value $Identifier
}

[Array]$VIDEO_EXTS = @(
    "avi",
    "flv"
    "m2ts",
    "mkv",
    "mov",
    "mp4",
    "ts",
    "webm",
    "wmv"
)

[Array]$PLAYLIST_EXTS = @(
    "m3u",
    "m3u8"
    "mpcpl",
    "pls",
    "vlc",
    "wpl"
)

$BASE64_TEXT = @{
    A = "0GM6eQ=="; # prompt box title
    B = "8l1+YjBSIABtAHAAdgA6ACAAJQBtAHAAdgAlAAoAL2YmVACXgYlLYqhSCZDpYiAAbQBwAHYALgBlAHgAZQAgAO+NhF8f/w=="; # found mpv
    C = "Kmd+YjBSIABtAHAAdgAuAGUAeABlAAz/94tLYqhSCZDpYiAAbQBwAHYALgBlAHgAZQAgAO+NhF8CMA==" # not found mpv
    D = "YE/zYOqBmltJTiAAbQBwAHYAIACEdn1U5E5MiMJTcGUXVB//"; # ask custom mpv cmd arg
    E = "KFcLTrllk49lUeqBmltJTiAAbQBwAHYAIAB9VOROTIjCU3Bl";  # custom mpv cmd arg prompt
    F = "6oGaW0lOIABtAHAAdgAgAH1U5E5MiMJTcGU="; # custom mpv cmd arg title
    Z = "xomRmIxUrWQ+ZRdSaIiHZfZO8l1zUVSAMFIgAG0AcAB2AA=="; # done
}
$TEXT = @{}

[string]$COMMON_IDENTIFIER = "Mpv.Player"
[string]$VIDEO_IDENTIFIER = "$COMMON_IDENTIFIER.Video"
[string]$PLAYLIST_IDENTIFIER = "$COMMON_IDENTIFIER.Playlist"

[string]$CLIENT_REG_PATH = "HKCU:\Software\Clients\Media\$COMMON_IDENTIFIER"

foreach ($key in $BASE64_TEXT.Keys) {
    $TEXT.Add($key, [System.Text.Encoding]::Unicode.GetString([Convert]::FromBase64String($BASE64_TEXT.$key)))
}

[string]$mpvConfigDir = (Get-Item $PSScriptRoot).Parent.FullName
[string]$mpvPath = ""

if (!(Test-Path "$mpvConfigDir\mpv.conf")) {
    Start-Process -FilePath cmd.exe -ArgumentList @("/c", "mklink", "$mpvConfigDir\mpv.conf", "windows.conf") -Verb runas
}
try {
    $mpvPath = (Get-Command -CommandType Application mpv.exe -ErrorAction Stop).Source
    if ([Windows.Forms.MessageBox]::Show($TEXT.B.Replace("%mpv%", $mpvPath), $TEXT.A, [Windows.Forms.MessageBoxButtons]::YesNo, [Windows.Forms.MessageBoxIcon]::Question) -eq [Windows.Forms.DialogResult]::Yes) {
        $mpvPath = ""
    }
}
catch {
    [Windows.Forms.MessageBox]::Show($TEXT.C, $TEXT.A, [Windows.Forms.MessageBoxButtons]::OK, [Windows.Forms.MessageBoxIcon]::Warning)
}

If ($mpvPath -eq "") {
    $selector = New-Object Windows.Forms.OpenFileDialog
    $selector.FileName = "mpv.exe"
    $selector.Filter = "mpv.exe|mpv.exe"
    if ($selector.ShowDialog() -eq [Windows.Forms.DialogResult]::OK) {
        $mpvPath = $selector.FileName
    }
    else {
        Exit
    }
}

[string]$mpvCmdArg = ""
if ([Windows.Forms.MessageBox]::Show($TEXT.D, $TEXT.A, [Windows.Forms.MessageBoxButtons]::YesNo, [Windows.Forms.MessageBoxIcon]::Question) -eq [Windows.Forms.DialogResult]::Yes) {
    $mpvCmdArg = [Microsoft.VisualBasic.Interaction]::InputBox($TEXT.E, $TEXT.F, "", 100, 100)
}
$mpvCmdArg = "--config-dir=""$mpvConfigDir"" " + $mpvCmdArg.Trim()

AddProgramID -Identifier $VIDEO_IDENTIFIER -Name "MPV Player" -Icon "@%SystemRoot%\System32\shell32.dll,313" -OpenCmd """$mpvPath"" $mpvCmdArg ""%1"""
AddProgramID -Identifier $PLAYLIST_IDENTIFIER -Name "MPV Player" -Icon "@%SystemRoot%\System32\shell32.dll,299" -OpenCmd """$mpvPath"" $mpvCmdArg --playlist=""%1"""

Remove-Item -Path $CLIENT_REG_PATH -Force -Recurse
New-Item -Path $CLIENT_REG_PATH\Capabilities\FileAssociations -Force
Set-ItemProperty -Path $CLIENT_REG_PATH\Capabilities -Name "ApplicationName" -Value "MPV Player"
Set-ItemProperty -Path $CLIENT_REG_PATH\Capabilities -Name "ApplicationIcon" -Value """$mpvPath, 0"""
Set-ItemProperty -Path HKCU:\Software\RegisteredApplications -Name $COMMON_IDENTIFIER -Value Software\Clients\Media\$COMMON_IDENTIFIER\Capabilities

foreach ($ext in $VIDEO_EXTS) {
    AssociateFile -Identifier $VIDEO_IDENTIFIER -ExtName $ext
}

foreach ($ext in $PLAYLIST_EXTS) {
    AssociateFile -Identifier $PLAYLIST_IDENTIFIER -ExtName $ext
}

$code = @'
  [System.Runtime.InteropServices.DllImport("Shell32.dll")]
  private static extern int SHChangeNotify(int eventId, int flags, IntPtr item1, IntPtr item2);
  public static void Refresh() { SHChangeNotify(0x8000000, 0x1000, IntPtr.Zero, IntPtr.Zero); }
'@
Add-Type -MemberDefinition $code -Namespace WinAPI -Name Explorer
[WinAPI.Explorer]::Refresh()

[Windows.Forms.MessageBox]::Show($TEXT.Z, $TEXT.A)
