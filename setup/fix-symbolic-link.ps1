using namespace System.IO

[array]$items = @(
    @{ Link = "scripts\uosc"; Target = "..\git-modules\uosc\src\uosc" },
    @{ Link = "shaders\ACNet"; Target = "..\git-modules\ACNetGLSL\glsl" }
)
[string]$MPV_CONFIG_DIR = [Path]::GetDirectoryName($PSScriptRoot)

foreach ($item in $items) {
    [FileInfo]$link = New-Object -TypeName FileInfo -ArgumentList @([Path]::Combine($MPV_CONFIG_DIR, $item.Link))
    [FileInfo]$target = New-Object -TypeName FileInfo -ArgumentList @([Path]::Combine($MPV_CONFIG_DIR, $item.Target))
    if ([Directory]::Exists($link.FullName)) {
        [Directory]::Delete($link.FullName, $true)
    }
    if ([File]::Exists($link.FullName)) {
        [File]::Delete($link.FullName)
    }
    if ($target.Attributes.HasFlag([FileAttributes]::Directory)) {
        Start-Process -FilePath cmd.exe -ArgumentList @("/c", "mklink", "/D", $link.FullName, $item.Target) -Verb runas -Wait
    }
    else {
        Start-Process -FilePath cmd.exe -ArgumentList @("/c", "mklink", $link.FullName, $item.Target) -Verb runas -Wait
    }
}
