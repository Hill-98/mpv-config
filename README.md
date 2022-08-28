# MPV Config
MPV 配置文件

## 使用

**以下为 Windows 使用方法**

### 安装

1. 克隆存储库: `git clone --recursive https://github.com/Hill-98/mpv-config.git D:\mpv-config`
2. 执行配置脚本: `powershell D:\mpv-config\setup\setup.ps1`
3. 打开 Windows 设置或控制面板设置文件关联。

### 更新

```
git pull
git submodule init
git submodule update
```

## 说明

默认使用 UOSC 作为播放控制界面，有右键菜单。

默认启用 `gpu-hq-max` 配置文件，继承于 `gpu-hq`，但启用了最佳缩放算法，并且加载了 `KrigBilateral` 和 `SSimSuperRes` 着色器，可以使用快捷键 `~` 回退到 `gpu-hq`。

**默认启用功能：**
* 自动检测 icc 配置文件
* 帧率补偿 (使渲染帧率与显示器帧率一致)
* 退出时保存对当前文件的配置

**常用快捷键列表：**
```
BackSpace 重置播放速度
Alt+= 增加字幕字体大小
Alt+- 减小字幕字体大小
Alt+UP 字幕位置向上
Alt+DOWN 字幕位置向下
Alt+RIGHT 字幕延迟增加
Alt+LEFT 字幕延迟减少
[ 上一帧
] 下一帧
< 减少播放速度
> 增加播放速度
A 选择字幕轨道
f 切换全屏
H 开启/关闭 硬件解码
m 切换静音
o 打开文件
p 显示播放进度
r 旋转视频
S 选择音频轨道
```
