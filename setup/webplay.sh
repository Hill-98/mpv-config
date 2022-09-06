#!/bin/bash

APPLICATIONS_DIR=${XDG_DATA_HOME:-$HOME/.local/share}/applications

DESKTOP_DIRS=(
    "$APPLICATIONS_DIR"
    /usr/local/share/applications
    /usr/share/applications
)

if [[ $# -gt 0 ]]; then
    mpv="mpv"
    for dir in "${DESKTOP_DIRS[@]}"; do
        if [[ -f "$dir/mpv.desktop" ]]; then
            if exec=$(grep -E "^Exec=(.+)" "$dir/mpv.desktop"); then
                exec=${exec/Exec=/}
                exec=${exec/\%U/}
                exec=${exec/ -- /}
                mpv=$exec
                break
            fi
        fi
    done
    if ! $mpv --player-operation-mode=cplayer -- "$1"; then
        read -r
    fi
    exit
fi

self=$(realpath "$0")
desktop_file="$APPLICATIONS_DIR/webplay-handler.desktop"

cat <<EOF > "$desktop_file"
[Desktop Entry]
Type=Application
Version=1.5
Name=WebPlay
NoDisplay=true
Exec="$self" %u
Terminal=true
MimeType=x-scheme-handler/webplay;
PrefersNonDefaultGPU=true
EOF

update-desktop-database "$APPLICATIONS_DIR"
