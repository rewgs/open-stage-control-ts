!!! question "Looking for v0 documentation ?"
    Head over <a href="https://v0.openstagecontrol.ammd.net">v0.openstagecontrol.ammd.net</a>

!!! warning "Incomplete documentation"
    The documentation is currently being updated.

Welcome to Open Stage Control documentation. Along these pages you'll learn how to setup OSC on your system and everything you need to start building your own control interface.

## Overview

Open Stage Control consists in 3 modules: the server, the launcher and the client.

The **server** is the core of the software, it is responsible for sending and receiving all osc/midi messages, and act as a web server that serves the clients web application. It is written in Javascript and runs with Electron, a cross-platform framework based on Chromium. By default, the server always opens a client window when it starts but it can be run in *headless* mode, without any window.

The **launcher** provides a simple way to configure and start the server. It appears whenever the server is not launched from a terminal or without being configured.

The **client** is the web application made available by the server when it starts. Any compatible browser that connects to the server by browsing to its address will create a new client instance and be able to open and modify sessions.


## Requirements

The **server** can run on all [platforms supported by Electron](https://www.electronjs.org/docs/tutorial/support#supported-platforms). Systems that can run [Node.js](https://nodejs.org/en/) may also be able to run it in headless mode (see [Running with Node](./running-with-node.md)).

The **client** requires Chromium/Chrome `60` or later to work (Linux, MacOS, Windows, Android, etc). iOS devices must be of version `10.3` or higher.


## Installation

??? example "Linux"

    **Ubuntu / Debian**

    - [Download](/download) `open-stage-control-VERSION-ARCH.deb`
    - Install it by running this as root in a terminal:
    ```bash
    dpkg -i path/to/open-stage-control-VERSION-ARCH.deb
    ```

    **Other linux distributions**

    - [Download](/download) `open-stage-control-VERSION-linux-ARCH.zip`
    - Extract it in the location of your choice
    - The file inside it named `open-stage-control` is the app's main executable

??? example "Mac"

    - [Download](/download) `open-stage-control-VERSION-osx.zip`
    - Extract it in the location of your choice
    - Drag `open-stage-control.app` in your `Application` folder

??? example "Windows"

    - [Download](/download) `open-stage-control-VERSION-win32-ARCH.zip`
    - Extract it in the location of your choice
    - The file inside it named `open-stage-control.exe` is the app's main executable
