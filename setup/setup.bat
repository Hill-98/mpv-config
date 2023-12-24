@ECHO OFF
CD /D %~dp0
PowerShell -NoLogo -NoProfile -ExecutionPolicy RemoteSigned -Command .\setup.ps1
