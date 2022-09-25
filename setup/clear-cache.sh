#!/bin/sh
MPV_CACHE_DIR="$HOME/.cache/mpv"
echo "Clear fonts cache..."
[ -d "$MPV_CACHE_DIR/fonts" ] && rm -r "$MPV_CACHE_DIR/fonts"
echo "Clear gpu shader cache..."
[ -d "$MPV_CACHE_DIR/gpu-shader" ] && rm -r "$MPV_CACHE_DIR/gpu-shader"
echo "Clear icc cache..."
[ -d "$MPV_CACHE_DIR/icc" ] && rm -r "$MPV_CACHE_DIR/icc"
echo "Done!"
