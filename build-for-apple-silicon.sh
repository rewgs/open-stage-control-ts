#!/bin/bash

export PLATFORM="darwin"
export ARCH="arm64"

npm install --arch="$ARCH"

npm run build

npm run package
