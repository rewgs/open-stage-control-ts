#!/bin/bash

# buid python midi addon for linux and windows

cd src/python

pyinstaller midi.py --onefile

docker run -v "$(pwd):/src/" cdrx/pyinstaller-linux:python3
mv dist/linux/midi midi-linux-x64

docker run -v "$(pwd):/src/" cdrx/pyinstaller-linux:python3-32bit
mv dist/linux/midi midi-linux-ia32

docker run -v "$(pwd):/src/" cdrx/pyinstaller-windows:python3
mv dist/windows/midi.exe midi-windows-x64.exe

docker run -v "$(pwd):/src/" cdrx/pyinstaller-windows:python3-32bit
mv dist/windows/midi.exe midi-windows-ia32.exe

rm -rf __pycache__ build midi.spec dist
