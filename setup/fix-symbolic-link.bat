@ECHO OFF
CD %~dp0
PowerShell -NoLogo -NoProfile -ExecutionPolicy RemoteSigned -Command .\fix-symbolic-link.ps1
