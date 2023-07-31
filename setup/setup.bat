@ECHO OFF
CD %~dp0
PowerShell -NoLogo -NoProfile -File setup.ps1 -ExecutionPolicy RemoteSigned
