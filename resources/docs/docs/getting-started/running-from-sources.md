Running the app from the sources slightly differs from using prebuilt binaries: we'll build and launch the app with npm (node package manager).

## Requirements

- [Node.js](https://nodejs.org/en/#download)
- [git](https://git-scm.com/downloads)


## Run from sources


**Download**

```bash
git clone https://github.com/jean-emmanuel/open-stage-control
cd open-stage-control/
# uncomment next line if you want the latest release
# instead of the current development version
# git checkout $(git describe --tags `git rev-list --tags --max-count=1`)
npm install
npm run build
```

!!! info "Updating from sources"
    ```bash
    git pull
    npm install
    npm run build
    ```

**Run**

```bash
npm start [ -- options]
```

!!! info ""
    A double hyphen (`--`) is used here to tell npm that the options are to be passed to the app.


## Package from sources

```bash
git clone https://github.com/jean-emmanuel/open-stage-control
cd open-stage-control/
# uncomment next line if you want the latest release
# instead of the current development version
# git checkout $(git describe --tags `git rev-list --tags --max-count=1`)

# TARGET_PLATFORM can be linux, win32 (windows) or darwin (os x)
export PLATFORM=TARGET_PLATFORM
# TARGET_ARCH can be ia32, x64, armv7l or arm64
export ARCH=TARGET_ARCH


npm install

# run this instead if ARCH is armv7l
# npm install --arch=armv7l


npm run build

npm run package

# Do one of the following if you want a deb package for debian/ubuntu
npm run deb32
npm run deb64
npm run debarm


# The node-only package can be built with
npm run package-node

```

This will build the app in `dist/open-stage-control-PLATFORM-ARCH`.

!!! info ""
    Building the app for windows from a linux system requires wine to be installed.
