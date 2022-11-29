# Custom module

Using the server's `custom-module` option, users can load a custom javascript module that filters incoming and outgoing OSC / MIDI messages.

## Writing a custom module


```js

// Do whatever you want
// initialize variables
// declare functions
// load modules
// etc

module.exports = {

    init: function(){
        // this will be executed once when the osc server starts
    },

    oscInFilter:function(data){
        // Filter incoming osc messages

        var {address, args, host, port} = data

        // do what you want

        // address = string
        // args = array of {value, type} objects
        // host = string
        // port = integer

        // return data if you want the message to be processed
        return {address, args, host, port}

    },

    oscOutFilter:function(data){
        // Filter outgoing osc messages

        var {address, args, host, port, clientId} = data

        // same as oscInFilter

        // return data if you want the message to be and sent
        return {address, args, host, port}
    },

    unload: function(){
        // this will be executed when the custom module is reloaded
    },

}

```

## Available globals

The module is executed in a restricted context, only a few globals are available :

----

#### `app`
[`Event Emitter`](https://nodejs.org/api/events.html#events_class_eventemitter), useful for monitoring the events sent by the different clients. Event names can be found in [callbacks.js](https://github.com/jean-emmanuel/open-stage-control/blob/master/src/server/callbacks.js), callbacks are called with 2 arguments: `data` (object) and `client` (object: `{address, id}`)

----

#### `receive(host, port, address, ...args, options)`

Send osc/midi message to connected clients. `host` and `port` can be specified to simulate a specific origin for the message.

- `host` (optional): `string` ip address, valid hostname or `"midi"`
- `port` (optional): `integer` port number or `string` midi device name
- `address`: osc address
- `args`: value or `{type: "OSC_TYPE_LETTER", value: VALUE}` `object` (objects that don't match this format will simply be turned to a JSON string).
- `options` (optional): set to `{clientId: id}` to define which client receives the message (where `id` is the client's id as retrieved from `app` events or `oscOutFilter`)

----

#### `send(host, port, address, ...args)`

Send osc/midi to a target (see `receive()`).

----

#### `settings.read(name)`

Returns specified server option. `name` must be the option's long name without the leading dashes (ie: `"send"`, not `"s"`)

----

#### `settings.appAddresses()`

Returns the server's http addresses.

----

#### `loadJSON(path)`

Loads a json file (path is relative to the custom module location)

----

#### `saveJSON(path, object)`

Saves an object/array to a json file (path is relative to the custom module location)

----

#### `require(path)`

Load another javascript module. Returns the value of `module.exports` defined in this module. If `path` is a relative path, it will be resolved against its parent module's path. See [Managing Big Modules](../managing-big-modules).

This function is different from node's native `require` function, it's merely a way to split a custom module into separate files.

----

#### `nativeRequire(moduleName)`

This function can be used to load native node modules or locally installed modules (e.g. with npm) if a `node_modules` folder is found in the custom module's location.

??? "Installing node modules: resources"
    - https://nodejs.dev/
    - https://nodejs.dev/learn/an-introduction-to-the-npm-package-manager
    - https://nodejs.dev/learn/the-package-json-guide

----

#### Other javascript globals

- `console`
- `setTimeout`
- `clearTimeout`
- `setInterval`
- `clearInterval`
- `__dirname`
- `__filename`
- `process`
- `global`

----


## Autoreload

Custom modules (including submodules loaded with `require()`) are reloaded automatically when they are modified. Upon reload, timers (`setTimeout` and `setInterval`) and event listeners (added to the  `app` object) are reset.

The `global` object persists accross reloads.

??? "Reloading native modules"

    When using modules loaded with `nativeRequire()`, you may need to tell the custom module how to unload some components to allow reloading using the `module.exports.unload` definition. For example, if a port is bound using the `http` module, you'll need to unbind it otherwise the custom module will fail to bind it again when reloading:

    ```js

    var http = nativeRequire('http'),
        server = http.createServer((req, res)=>{
        res.writeHead(200)
        res.end('Hello world')
    })

    server.listen(5555, 'localhost')


    module.exports = {

        unload: function() {

            server.close()
            // otherwise you'd get "Error: listen EADDRINUSE: address already in use 127.0.0.1:5555"

        }

    }
    ```
