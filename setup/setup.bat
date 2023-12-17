@ECHO OFF
CD %~dp0
PowerShell -NoLogo -NoProfile -ExecutionPolicy RemoteSigned -Command .\setup.ps1
