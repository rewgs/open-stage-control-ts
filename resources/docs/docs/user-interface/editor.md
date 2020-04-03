!!! warning "Incomplete documentation"


## Context menu

Right clicking / long touch on a widget or on a tab will also display a context menu providing useful utilities :

- `Show in tree`: show widget in project tree
- `Copy`: copy widget's data
- `Cut`: copy widget's data and delete selected widget
- `Paste`: paste copied widget in selected container
  - `Paste`: paste the widget as is
  - `ID + 1` : increments the id of the copied widget (and all its children) before pasting
  - `Clone` : create a clone widget targetting the copied widget
- `Add widget`: create a new widget in selected container
- `Add tab`: create a new tab in selected container
- `Delete`: delete selected tab or widget

## Open / Save

By default, sessions are saved and opened on the server's filesystem. When saving a session opened by mutliple clients, these will reload the session file automatically.

!!! info
    It is possible to limit this feature to specific client addresses by using the server's `--remote-saving` option. For example:

    `open-stage-control --remote-saving "127.0.0.1|192.168.0.10"`

    Will disable remote saving except for the clients with ip addresses `127.0.0.1` (the server's local address) and `192.168.0.10`.

## Import / Export

Sessions can be exported/imported on the device's filesystem, doing so has a few limitations:
- the session's name won't appear in the window's title
- the session won't be added to the session history

## Grid

By default, widget resizing / dragging snaps to a 10 pixel wide grid. Its width can be customized in the editor (when it's enabled). Setting its width to 1 will disable it. Note that the grid doesn't affect manual setting of a widget's size / position.

## Properties

Selected widget's properties are displayed and can be modified in the sidepanel. The [widgets reference](/docs/widgets-reference) section lists the available properties for each widget type. Property fields are all multiline (press `shift + enter` for new line).

Properties are written in JSON, with some flexibility brought by the [JSON5](https://github.com/json5/json5) format. For example, doubles quotes around object keys are not mandatory. All input will be converted to standard JSON.


## Widget resizing / dragging

Selected widget can be resized using its south, south-east and east handles. It can be dragged with its north-west handle. Using this feature will convert position and size values to plain number values, thus breaking previously set percent or inherited values.



!!! info ""
    \* *Multi-widgets editing*

    - selection can only contain sibling widgets (same direct parent)
    - context-menu actions and properties changes apply to all selected widgets
    - resizing / dragging will affect all selected widgets, relatively to the first selected widget
