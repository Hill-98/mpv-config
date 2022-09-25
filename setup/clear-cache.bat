@ECHO OFF
SET MPV_CACHE_DIR=%USERPROFILE%\.cache\mpv
ECHO Clear fonts cache...
IF EXIST %MPV_CACHE_DIR%\fonts ( RMDIR /S /Q %MPV_CACHE_DIR%\fonts )
ECHO Clear gpu shader cache...
IF EXIST %MPV_CACHE_DIR%\gpu-shader ( RMDIR /S /Q %MPV_CACHE_DIR%\gpu-shader )
ECHO Clear icc cache...
IF EXIST %MPV_CACHE_DIR%\icc ( RMDIR /S /Q %MPV_CACHE_DIR%\icc )
ECHO Done!
PAUSE > NUL
