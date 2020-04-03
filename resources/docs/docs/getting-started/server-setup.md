# Server options

Below are the available command-line options. Note that when running without any command-line switch (ie from a file browser), a launcher window will spawn to help setting them.

<div class="force-full-table"></div>
| Option | Description |
|---|---|
| --send | default targets for all widgets (ip: port / domain: port / midi: port_name pairs) |
| --load | session file to load |
| --state | state file to load |
| --custom-module | custom module file to load (custom options can be passed after the filename) |
| --port | http port of the server (default to 8080) |
| --osc-port | osc input port (default to --port) |
| --tcp-port | tcp server input port |
| --tcp-targets | tcp servers to connect to (ip: port pairs), does not susbtitute for --send |
| --midi | midi router settings |
| --debug | log received osc messages in the console |
| --no-gui | disable default gui |
| --theme | theme name or path (mutliple values allowed) |
| --client-options | client options (opt=value pairs) |
| --disable-vsync | disable gui's vertical synchronization |
| --force-gpu | ignore chrome's gpu blacklist |
| --read-only | disable session editing and session history changes |
| --remote-saving | disable remote session saving for hosts that don't match the regular expresion |
| --remote-root | set remote file browsing root folder |
| --instance-name | used to differenciate multiple instances in a zeroconf network |
| --fullscreen | launch in fullscreen mode (only affects the default client gui) |

The following options can only be set when running the app from a terminal:

<div class="force-full-table"></div>
| Option | Description |
|---|---|
| --disable-gpu | disable hardware acceleration |
| --inspect | enable node/electron inspector |
| --cache-dir | override default cache directory |
| --config-file | override default config file (defaults to cache-dir/config.json) |
| --help | Show help |
| --version | Show version number |

## Running in a terminal on Windows

Windows users launching the app from a terminal need to add a double dash (`--`) before their options:

```bash
open-stage-control.exe -- --port 5555 [...]

# when running from sources
npm start -- -- [options]
```
