Welcome to Open Stage Control documentation. Along these pages you'll learn how to setup OSC on your system and everything you need to start building your own control interface.

## Overview

Open Stage Control consists in 3 modules:

- a server
- a launcher
- a client

The **server** is the core of the software, it is responsible for sending and receiving all osc/midi messages, and act as a web server that serves the clients web application. It is written in Javascript and runs with Electron, a cross-platform framework based on Chromium. By default, the server alwyas opens a client window when it starts but it can be run in *headless* mode, without any window.

The **launcher** provides a simple way to configure and start the server. It appears whenever the server is not launched from a terminal or without being configured.

The **client** is the web application made available by the server when it starts. Any compatible browser that connects to the server by browsing to its address will create a new client instance and be able to open and modify sessions.

!!! question "Looking for v0 docs ?"
    Head over [here](https://v0.openstagecontrol.ammd.net)
