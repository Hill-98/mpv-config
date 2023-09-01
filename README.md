# MPV Config
带有一些优化体验的自制脚本的 MPV 配置文件 ([特色功能](#特色功能))

## 使用

**Linux 使用方法: 如果你已经在使用 Linux 了，那么这应该难不倒你。**

**以下为 Windows 使用方法**

### 安装

0. 启用 [Windows 开发人员模式](https://docs.microsoft.com/windows/apps/get-started/enable-your-device-for-development)、[Git LFS](https://git-lfs.github.com/) 和 Git 符号链接支持 (`git config --global --bool core.symlinks true`)
1. 克隆存储库: `git clone --recursive https://github.com/Hill-98/mpv-config.git mpv-config`
2. 修复 git 符号链接错误: `powershell -ExecutionPolicy RemoteSigned mpv-config\setup\fix-symbolic-link.ps1`
3. 执行配置脚本: `powershell -ExecutionPolicy RemoteSigned mpv-config\setup\setup.ps1`
4. 打开 Windows 设置或控制面板设置文件关联。

### 更新

```
git pull
git submodule init
git submodule update
powershell -ExecutionPolicy RemoteSigned setup\fix-symbolic-link.ps1
powershell -ExecutionPolicy RemoteSigned setup\setup.ps1
```

### 备用安装方法
1. 前往 GitHub Actions 下载最新打包版本: [https://github.com/Hill-98/mpv-config/actions](https://github.com/Hill-98/mpv-config/actions)
2. 执行配置脚本: `powershell -ExecutionPolicy RemoteSigned mpv-config\setup\setup.ps1`
3. 打开 Windows 设置或控制面板设置文件关联。

> 如果使用备用安装方法，更新时先执行一下 `clean.bat`，删除旧版本文件，此操作不会删除自定义的配置文件。

## 说明

**控制界面:** [UOSC](https://github.com/tomasklaen/uosc) (有右键菜单)

**默认渲染配置 (gpu-hq-max):**
* `gpu-hq`
* `scale` = `ewa_lanczos`
* 去带 (deband): 关闭
* 着色器: [`KrigBilateral`](https://gist.github.com/igv/a015fc885d5c22e6891820ad89555637), [`SSimSuperRes`](https://gist.github.com/igv/2364ffa6e81540f29cb7ab4c9bc05b6b)
* 垂直同步 (`tscale=oversample`)

> 可以使用快捷键 `~` 回退到 `gpu-hq`，然后还可以使用快捷键 ``Alt+` `` 回退到 `default`。

**默认配置:**
* 特定于文件的配置文件 (`use-filedir-conf`)
* 中文音频/字幕优先 (日文、英文其次)
* 退出时保存对当前文件的部分设置 (`save-position-on-quit`)
* 始终启用缓存 (256M)
* 模糊匹配外部音频文件 (`audio-file-auto=fuzzy`)
* 垂直同步 (`video-sync=display-resample`)
* 增强的去带参数
* 字幕字体: 文泉驿微米黑
* 字幕字体提供程序: `fontconfig` (支持自动加载当前播放文件路径下 `fonts` 文件夹的字体文件，详情见[特色功能](#auto-load-fonts)。)

**极速模式:** 卸载所有着色器、还原需要高性能的配置文件、开启硬件解码。(极速模式适合低性能设备播放 4K60FPS 等视频文件时开启)

**HDR 视频播放:**

如果你的显示设备不支持 HDR，那么播放 HDR 视频不需要做任何事，mpv 会自动进行 SDR 转换。

如果你的显示设备支持 HDR，在系统设置里启用 HDR，然后将 mpv 的视频输出驱动设置为 `gpu-next` 并启用 HDR 直通，你可以在 `local.conf` 文件添加以下配置项。`gpu-next` 与一些着色器可能存在兼容性问题（比如 Anime4K），如果遇到这类问题，可以回退到 `gpu` 视频输出驱动。

`local.conf`:（添加以下行）
```conf
vo=gpu-next
target-colorspace-hint=yes # HDR 直通
```

**HDR 视频截图:** 播放 HDR 视频并截图，mpv 会为截图文件写入色彩空间标签并使用与视频相同的位深（仅支持部分图片格式），但是目前支持色彩空间、高位深和 HDR 的图片查看器少之又少，导致 HDR 截图在大部分图片查看器并不能正确的显示。如果你有显示 HDR 截图的需求，或者想把 HDR 截图分享给他人，推荐使用 Google Chrome 或 mpv 查看图片，分享给他人务必以文件的形式发送，切勿使用 IM 或其他软件的发送图片功能，以及确保他人拥有 HDR 显示设备。

**默认保存的文件设置:**
```txt
af 音频过滤器
vf 视频过滤器
aid 音频轨道
sid 字幕轨道
vid 视频轨道
deband 去带
panscan 平移和扫描
pause 暂停状态
speed 播放速度
audio-delay 音频延迟
video-rotate 视频旋转
video-sync 垂直同步
video-zoom 视频缩放
sub-delay 字幕延迟
sub-font-size 字幕字体大小
sub-pos 字幕位置
volume 音量
```

> 可以使用快捷键 `DEL` 删除当前文件保存的设置。

**不完整快捷键列表:**
```txt
BackSpace 重置播放速度
Alt+= 增加字幕字体大小
Alt+- 减小字幕字体大小
Alt+UP   字幕位置向上
Alt+DOWN 字幕位置向下
Alt+RIGHT 字幕延迟增加
Alt+LEFT  字幕延迟减少
Alt+Shift+RIGHT 音频延迟增加
Alt+Shift+LEFT  音频延迟减少
Shift+RIGHT 快进 60 秒
Shift+LEFT  倒退 60 秒
PAGE DOWN 播放列表上一个
PAGE UP   播放列表下一个
[ 上一帧
] 下一帧
< 减少播放速度
> 增加播放速度
A 显示字幕轨道列表
C 显示章节列表
d 切换去带
f 切换全屏
H 开启/关闭 硬件解码 (默认关闭)
m 切换静音
o 打开文件
p 显示播放进度
P 显示播放列表
r 旋转视频
R 从头开始播放视频
s 截图 (默认保存至桌面)
S 显示音频轨道列表
t 显示系统时间
v 开启/关闭 垂直同步 (默认开启)
V 显示视频轨道列表
Ctrl+c 切换自动裁剪黑边
Ctrl+p 填充黑边使视频比例与当前窗口比例相同 (解决视频比例大于屏幕比例时字幕位置偏高)
```

## 自定义配置

**为了方便自定义配置，我编写了一些辅助脚本，既可以自定义配置，又不会覆盖原有的配置文件，方便后续更新。**

如果你需要自定义或覆盖默认设置，可以修改配置目录的 `local.conf` 文件。

如果你需要修改默认加载的预设配置文件 (profile)，可以在配置文件目录创建 `profiles.local`，语法参考 `profiles` 文件。

如果你需要自定义快捷键，并且需要继承原有快捷键配置，可以按以下步骤进行操作:
1. 在 `local.conf` 文件加入以下行:
```conf
input-conf="~~/.input.conf"
script-opts-append="custom_input-enable=yes"
```
2. 在配置目录创建 `input.local.conf` 文件并加入以下行:
```conf
#@ ~~/input.conf
```
3. 在 `input.local.conf` 文件设置新的快捷键
4. 每次更改文件后，启动 mpv 并退出，新的快捷键将在下次启动时生效。

如果你需要自定义脚本设置项，可以在 `local.conf` 使用 `script-opts-append` 设置:
```
script-opts-append="auto_load_fonts-compatible_mode=yes" # 启用 Auto Load Fonts 兼容模式
```

## 特色功能

### [Auto Load Fonts](scripts/auto-load-fonts.js)

使用 **fontconfig** 或 **[sub-fonts-dir](https://mpv.io/manual/master/#options-sub-fonts-dir)** (native) 加载播放文件路径下支持的子目录内的字体文件，`native` 方法需要 mpv 最新版本。

**支持的子目录:**
* fonts
* Fonts
* FONTS
* 字体

> 由于 Windows 路径名不区分大小写，所以 `fonts` 和 `Fonts` 没有区别。

**兼容模式:** 兼容模式主要用于解决一些 fontconfig 的性能问题和 Windows 某些分区上的错误，脚本在兼容模式下加载字体文件时会将 `fonts` 文件夹复制到指定位置，然后使用新位置进行加载。默认位置为配置目录的 `.fonts` 目录，如果配置目录所在分区也存在兼容性问题，你还可以自定义兼容目录位置。

> 兼容模式在 `native` 模式下也会生效，不过可能没有任何改善。

**设置项:**

兼容模式: `auto_load_fonts-compatible_mode=[yes|no] # 默认关闭`

兼容目录: `auto_load_fonts-compatible_dir=D:\fonts-cache # 设置兼容目录为 D:\fonts-cache`

加载方法：`auto_load_fonts-method=[fontconfig|native] # 默认为 fontconfig 模式，设置为 native 切换到 sub-fonts-dir 方法。`

> Auto Load Fonts 支持设置项实时更新，可以配合 `profile-cond` 按需开启兼容模式。

### [Auto Press Key](scripts/auto-press-key.js)

如果播放文件目录存在 `mpv.keys` 或 `${filename}.mpv.keys`，则在文件加载后自动按下按键，文件结束后再次按下按键。

`mpv.keys`: 每行一个按键，可以是组合键，以 `!` 开头的按键不会在文件结束后再次按下，以 `#` 开头的行会被忽略。

### [Check Update](scripts/check-update.js)

自动检查配置文件更新，还支持 mpv 新版本检查，默认检查源 : [shinchiro/mpv-winbuild-cmake](https://github.com/shinchiro/mpv-winbuild-cmake)。

配置文件默认每 7 天检查一次， mpv 默认每 1 天检查一次。

可以通过 `script-message check-update/config` 或 `script-message check-update/mpv` 命令强制检查更新。

网络请求依赖于外部工具 `curl`，如果存在 `http_proxy` 环境变量或 mpv 设置项，请求时会自动将其设置为 HTTP 代理，也可以单独为这个脚本设置 HTTP 代理。

**设置项:**

配置文件检查间隔: `check_update-check_config_interval=3 # 每 3 天检查一次配置文件更新`。

mpv 新版本检查: `check_update-check_mpv_update=[yes|no] # 默认关闭`。

mpv 检查间隔: `check_update-check_mpv_interval=3 # 每 3 天检查一次 mpv 更新`

mpv 检查源: `check_update-check_mpv_repo=shinchiro/mpv-winbuild-cmake # 设置检查源为 https://github.com/shinchiro/mpv-winbuild-cmake`

HTTP 代理: `check_update-http_proxy=http://127.0.0.1:8080 # 设置 HTTP 代理为 http://127.0.0.1:8080` 

### [Format Title](scripts/format-title.js)

提取文件名的信息并格式化，然后设置为当前文件的媒体标题。

比如文件名 `[VCB-Studio] Re Zero kara Hajimeru Isekai Seikatsu [01][Ma10p_1080p][x265_flac_aac]` 会被格式化为 `Re Zero kara Hajimeru Isekai Seikatsu [01]`。

如果文件名无法被格式化，那么什么都不会发生。

**设置项:**

禁用: `format_title-enable=no`

### [WebPlay](scripts/webplay-handler.js)

为 mpv 新增 `webplay` 协议，用于从浏览器调用 mpv 播放媒体。

可以配合油猴脚本 [WebPlay for ytdl](https://github.com/Hill-98/userscripts/raw/main/webplay-ytdl.user.js) 使用。
