## Requirements

MIDI support requires additional software to be installed on the server's system:

- [python 3](https://www.python.org/downloads/)
- python package [python-rtmidi](https://spotlightkid.github.io/python-rtmidi/installation.html#from-pypi)

!!! info "Why an additionnal dependency ?"
    Providing cross-platform MIDI support is not trivial, as it requires OS-specific compilation that cannot be automated within Open Stage Control's current packaging workflow. Using a python addon seems to be the best compromise so far : the core app remains easy to build, and the extra dependency is easy to install.

## Configuration

When running the app, the `-m / --midi` switch must be set and accepts the following options, separated by spaces.

!!! warning ""
    If an option contains space characters, it must be enquoted.

**`list`**

Print the available MIDI ports to the console when the server starts. This action is also available in the launcher's menu.

**`device_name:input,output`**

Create a virtual MIDI device that will translate OSC messsages to MIDI messages

- `device_name` is an arbitrary identifier that can be used as a target by widgets (see [Widget setup](#widget-setup))
- `input` / `output` can be port numbers or strings (as reported by the `list` action). If a string is specified, the first port whose name contains the string will be used (comparison is case-insensitive).

**`sysex`**

Enable parsing of system exclusive messages (disabled by default).

**`mtc`**

Enable parsing of midi time code messages (disabled by default). These will be received as raw sysex messages.

**`pc_offset`**

Send program changes with a `-1` offset to match some software/hardware implementations


**`path=/path/to/python`**

Indicates where to find python binary in case open stage control doesn't (`Error: spawn python3 ENOENT`)


**`device_name:virtual`** (*Linux / Mac only*): creates a virtual midi device with one input port and one output port


**`jack`** (*Linux only*): use JACK MIDI instead of ALSA. `python-rtmidi` must be compiled with [jack support](https://spotlightkid.github.io/python-rtmidi/installation.html#linux) for this to work.


## Widget setup

In order to send MIDI messages, a widget must have at least one `target` formatted as follows:

`midi:device_name` (where `device_name` is one of the declared midi devices)

!!! warning
    Messages received from a MIDI port only affect widgets that send to this port.

## Debug

Enabling the server's `debug` options will print some extra informations (sent/received midi messages, midi setup informations, etc)
