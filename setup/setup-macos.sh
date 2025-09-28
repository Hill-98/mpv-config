#!/bin/sh

cd "$(dirname "$(realpath "$0")")" || exit 1
cd ..

MPV_XDG_CONFIG_DIR=${XDG_CONFIG_HOME:-$HOME/.config}/mpv
MPV_XDG_CONFIG_DIR_BACKUP=$MPV_XDG_CONFIG_DIR.bak.$(date +%Y%m%d%H%M%S)

if [ ! -f local.conf ]; then
    echo "# 自定义配置文件" > local.conf
fi

sed "s|%CONFIG_DIR%|$PWD|g" fonts.macos.conf > fonts.conf

cat > mpv.conf << EOF
include="~~/common.conf"
include="~~/macos.conf"
include="~~/local.conf"
EOF

if [ -d "$MPV_XDG_CONFIG_DIR" ] && [ ! -L "$MPV_XDG_CONFIG_DIR" ]; then
    echo "Backup '$MPV_XDG_CONFIG_DIR' to '$MPV_XDG_CONFIG_DIR_BACKUP'"
    mv "$MPV_XDG_CONFIG_DIR" "$MPV_XDG_CONFIG_DIR_BACKUP"
fi

echo "$MPV_XDG_CONFIG_DIR -> $PWD"
ln -F -s "$PWD" "$MPV_XDG_CONFIG_DIR"
echo "Done!"
