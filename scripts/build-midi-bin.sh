#!/bin/bash

# buid python midi addon for linux and windows

cd src/python

pyinstaller midi.py --onefile

docker run -v "$(pwd):/src/" cdrx/pyinstaller-linux:python3
mv dist/linux dist/linux-x64

docker run -v "$(pwd):/src/" cdrx/pyinstaller-linux:python3-32bit
mv dist/linux dist/linux-ia32

docker run -v "$(pwd):/src/" cdrx/pyinstaller-windows:python3
mv dist/windows dist/windows-x64

docker run -v "$(pwd):/src/" cdrx/pyinstaller-windows:python3-32bit
mv dist/windows dist/windows-ia32

rm -rf __pycache__ build midi.spec
