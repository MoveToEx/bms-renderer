@echo off

cd %~dp0

node render.js %1 output.wav

pause