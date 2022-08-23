Add-Type -AssemblyName Microsoft.VisualBasic
Add-Type -AssemblyName System.Windows.Forms

[Windows.Forms.Application]::EnableVisualStyles()

function AddProgramID([string]$Identifier, [string]$Name, [string]$Icon, [string]$OpenCmd) {
    if ($Identifier.Trim() -eq "") {
        throw "Identifier is empty"
    }
    [string]$regPath = "HKCU:\Software\Classes\$Identifier"
    if (Test-Path -Path $regPath) {
        Remove-Item -Path $regPath -Force -Recurse
    }
    New-Item -Path $regPath
    New-Item -Path $regPath\DefaultIcon
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
    if (!(Test-Path -Path "$regPath")) {
        New-Item -Path $regPath
    }
    if (!(Test-Path -Path "$regPath\OpenWithProgids")) {
        New-Item -Path "$regPath\OpenWithProgids"
    }
    Set-ItemProperty -Path $regPath -Name "(Default)" -Value $Identifier
    Set-ItemProperty -Path "$regPath\OpenWithProgids" -Name $Identifier -Value ""  -Force
}

[Array]$VIDEO_EXTS = @(
    "avi",
    "flv"
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

foreach ($key in $BASE64_TEXT.Keys) {
    $TEXT.Add($key, [System.Text.Encoding]::Unicode.GetString([Convert]::FromBase64String($BASE64_TEXT.$key)))
}

[string]$mpvPath = ""

try {
    $mpvPath = (Get-Command -CommandType Application mpv.exe).Source
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
$mpvCmdArg = $mpvCmdArg.Trim()

[string]$videoIdentifier = "Mpv.Player.Video"
[string]$playlistIdentifier = "Mpv.Player.Playlist"

AddProgramID -Identifier $videoIdentifier -Name "MPV Player" -Icon "@%SystemRoot%\System32\shell32.dll,313" -OpenCmd """$mpvPath"" $mpvCmdArg ""%1"""
AddProgramID -Identifier $playlistIdentifier -Name "MPV Player" -Icon "@%SystemRoot%\System32\shell32.dll,299" -OpenCmd """$mpvPath"" $mpvCmdArg --playlist=""%1"""

foreach ($ext in $VIDEO_EXTS) {
    AssociateFile -Identifier $videoIdentifier -ExtName $ext
}

foreach ($ext in $PLAYLIST_EXTS) {
    AssociateFile -Identifier $playlistIdentifier -ExtName $ext
}

$code = @'
  [System.Runtime.InteropServices.DllImport("Shell32.dll")]
  private static extern int SHChangeNotify(int eventId, int flags, IntPtr item1, IntPtr item2);
  public static void Refresh() { SHChangeNotify(0x8000000, 0x1000, IntPtr.Zero, IntPtr.Zero); }
'@
Add-Type -MemberDefinition $code -Namespace WinAPI -Name Explorer
[WinAPI.Explorer]::Refresh()

[Windows.Forms.MessageBox]::Show($TEXT.Z, $TEXT.A)
