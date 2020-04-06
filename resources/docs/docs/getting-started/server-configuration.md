The **server** can be configured with many options, either from a terminal or with the help of the **launcher**. The available options are described here.

## Options

#### `send`

Defines the default osc/midi targets. These will be added to the widget's individual targets. Must be formatted as follows:

- `ip_address:port`
- `host_name:port`
- `midi:device_name`

----

#### `load`

Path to a session file. All clients connecting the server will load it.

----

#### `state`

Path to a state file. All clients connecting the server will load it.


----

#### `custom-module`

Path to a custom module file. Additional options can be passed after the path, they'll be accessible in the custom module's context.

----

#### `port`

HTTP port for the server (default: `8080`).

----

#### `osc-port`

OSC (udp) input port (default: `port`).

----

#### `tcp-port`

OSC (tcp) input port/

----

#### `tcp-targets`

TCP servers to connect to. When sending osc messages, if the target matches one of these, TCP protocol will be used instead of UDP. Must be formatted as:

- `ip_address:port`
- `host_name:port`

----

#### `midi`

[MIDI configuration](../midi/midi-configuration).

----

#### `debug`

Print sent and receiced messages in the console. This may impact performances and should not be enabled in production.


----

#### `no-gui`

Disable built-in client window.

----

#### `fullscreen`

Start the built-in client window in fullscreen.

----

#### `theme`

Theme names or paths. See [Themes](../customization/themes).

----

#### `client-options`

Default [client options](../client-options).

----

####  `--disable-vsync`

Disable built-in client window's vertical synchronization.

----

####  `--force-gpu`

Disable built-in client window's gpu blacklist (may improve rendering performance in some cases).

----

####  `--read-only`

Disable session editing, and file saving.

----

#### `remote-saving`

Disable file saving for hosts that don't match the regular expresion.

Sessions are saved and opened on the server's filesystem. It is possible to limit this feature to specific client with a regular expression. For example, `"127.0.0.1|192.168.0.10"` disables remote saving except for clients with ip addresses `127.0.0.1` (the server's local address) and `192.168.0.10`.

----

#### `remote-root`

Set file browsing root folder.

----

#### `instance-name`

Used to differenciate multiple instances in a zeroconf network.

----


## Other options

The following options can only be set from a terminal:

----

#### `disable-gpu`

Disable hardware acceleration for the launcher window and the built-in client window.

----

#### `inspect`

Enable node inspector.

----

#### `cache-dir`

Override default cache directory (contains browser cache and localStorage data).

----

#### `config-file`

Override default config file location (contains session history and launcher config). Defaults to `cache-dir/config.json`.

----

#### `help`

Show help.

----

#### `version`

Show version number.

----

## Running in a terminal

Options name must be prepended with a double dash (`--`) in a terminal.


## Running in a terminal on Windows

Windows users launching the app from a terminal need to add a double dash (`--`) and a space before their options:

```bash
open-stage-control.exe -- --port 5555 [...]

# when running from sources
npm start -- -- [options]
```
