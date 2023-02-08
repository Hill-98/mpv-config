using namespace System.IO

[array]$items = @(
    @{ Link = "scripts\uosc_shared"; Target = "..\git-modules\uosc\scripts\uosc_shared" },
    @{ Link = "shaders\ACNet"; Target = "..\git-modules\ACNetGLSL\glsl" }
)
[string]$MPV_CONFIG_DIR = [Path]::GetDirectoryName($PSScriptRoot)

foreach ($item in $items) {
    [FileInfo]$link = New-Object -TypeName FileInfo -ArgumentList @([Path]::Combine($MPV_CONFIG_DIR, $item.Link))
    if ($link.Attributes.HasFlag([FileAttributes]::Directory)) {
        if ([Directory]::Exists($link.FullName)) {
            [Directory]::Delete($link.FullName, $true)
        }
        Start-Process -FilePath cmd.exe -ArgumentList @("/c", "mklink", "/D", $link.FullName, $item.Target) -Verb runas -Wait
    }
    else {
        if ([File]::Exists($link.FullName)) {
            [File]::Delete($link.FullName)
        }
        Start-Process -FilePath cmd.exe -ArgumentList @("/c", "mklink", $link.FullName, $item.Target) -Verb runas -Wait
    }
}
