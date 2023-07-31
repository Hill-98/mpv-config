@ECHO OFF
CD %~dp0
PowerShell -NoLogo -NoProfile -File fix-symbolic-link.ps1 -ExecutionPolicy RemoteSigned
