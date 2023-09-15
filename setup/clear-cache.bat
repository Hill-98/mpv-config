@ECHO OFF
SET MPV_CACHE_DIR=%USERPROFILE%\AppData\Local\mpv
ECHO Clear fonts cache...
IF EXIST %LOCALAPPDATA%\fontconfig\cache ( RMDIR /S /Q %LOCALAPPDATA%\fontconfig\cache )
ECHO Clear gpu shader cache...
IF EXIST %MPV_CACHE_DIR%\gpu-shader ( RMDIR /S /Q %MPV_CACHE_DIR%\gpu-shader )
ECHO Clear icc cache...
IF EXIST %MPV_CACHE_DIR%\icc ( RMDIR /S /Q %MPV_CACHE_DIR%\icc )
ECHO Done!
PAUSE > NUL
