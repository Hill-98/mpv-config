@ECHO OFF
CD %~dp0
PowerShell -NoLogo -NoProfile -ExecutionPolicy RemoteSigned -File setup.ps1
