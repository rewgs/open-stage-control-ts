## Requirements

MIDI support requires additional software to be installed on the server's system:

- python (2 or 3)
- python package [python-rtmidi](https://spotlightkid.github.io/python-rtmidi/installation.html)

To install `python-rtmidi`, run `pip install python-rtmidi` (python 2) in a terminal or `pip3 install python-rtmidi` (python 3).

!!! info "Why an additionnal dependency ?"
    Providing cross-platform MIDI support is not trivial, as it requires OS-specific compilation that cannot be automated within Open Stage Control's current packaging workflow. Using a python addon seems to be the best compromise so far : the core app remains easy to build, and the extra dependency is easy to install.

## Configuration

When running the app, the `-m / --midi` switch must be set; it accepts the following options (separated by spaces):

- `list`: prints the available MIDI ports to the console; numbers in the first column may be used for `input`/`output` definition below
- `device_name:input,output`: connect to midi ports `input` and `output`; osc messages sent to target `midi:device_name` will be processed as midi events; Multiple devices can be declared. If the `device_name` contains white spaces, the declaration must be enquoted (ie `"spaced name:input,output"`). `device_name` doesn't need to match the actual midi device name, it is just an identifier (see [Widget settings](#widget-settings)).
- `sysex`: parse incomming system exclusive messages (disabled by default)
- `pc_offset`: send program changes with a `-1` offset to match some software/hardware implementations
- `path=/path/to/python`: indicates where to find python or python3 binary in case open stage control doesn't (`Error: spawn python3 ENOENT`)

*Linux / Mac only:*

- `device_name:virtual`: creates a virtual midi device with one input port and one output port

*Linux only:*

- `jack`: use JACK MIDI instead of ALSA. `rtmidi` must be compiled with `--jack-midi` flag for this to work.


## Widget setup

In order to send MIDI messages, a widget must have at least one `target` formatted as follows:

`midi:device_name` (where `device_name` is one of the declared midi devices)

!!! warning
    Messages received from a MIDI port only affect widgets that send to this port.
