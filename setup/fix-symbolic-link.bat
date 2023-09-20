@ECHO OFF
CD %~dp0
PowerShell -NoLogo -NoProfile -ExecutionPolicy RemoteSigned -File fix-symbolic-link.ps1
