# Custom module

## Writing a custom module

Using the `-c / --custom-module` command-line switch, users can load a javascript file to tune the way Open Stage Control behaves regarding osc.

```js

// Do whatever you want, initialize some variables, declare some functions, ...

module.exports = {

    init: function(){
        // this will be executed once when the osc server starts
    },

    oscInFilter:function(data){
        // Filter incomming osc messages

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
    }

}

```

## Available globals

The module is executed in a restricted context, only a few globals are available :

#### `app`: [`Event Emitter`](https://nodejs.org/api/events.html#events_class_eventemitter)
 Useful for monitoring the events sent by the different clients. Event names can be found in [callbacks.js](https://github.com/jean-emmanuel/open-stage-control/blob/master/src/server/callbacks.js), callbacks are called with 2 arguments: `data` (object) and `client` (object: `{address, id}`)

#### `receive`: `function(host, port, address, ...args, options)`

Send osc/midi message to connected clients. `host` and `port` can be specified to simulate a specific origin for the message.

- `host` (optional): `string` ip address, valid hostname or `"midi"`
- `port` (optional): `integer` port number or `string` midi device name
- `address`: osc address
- `args`: value or `{type: "OSC_TYPE_LETTER", value: VALUE}` `object`
- `options` (optional): set to `{clientId: id}` to define which client receives the message (where `id` is the client's id as retreived from `app` events or `oscOutFilter`) 

#### `send`: `function(host, port, address, ...args)`

Send osc/midi to a target.


#### `settings.read`: `function(name)`

Returns specified server option. `name` must be the option's long name without the leading dashes (ie: `"send"`, not `"s"`)

#### `options`: `array`

Contains the extra options passed to `--custom-module` after the filename

#### `loadJSON`: `function(path)`

Loads a json file (path is relative to the custom module location)

#### `saveJSON`: `function(path, object)`

Saves an object/array to a json file (path is relative to the custom module location)

#### Other javascript globals
- `console`
- `setTimeout`
- `clearTimeout`
- `setInterval`
- `clearInterval`

## Managing big modules

Custom modules don't let you use node's `require` function at runtime, but you can manage your sources in multiple files and bundle them into a single file before loading it in Open Stage Control.

The common pattern for this is using the [browserify](http://browserify.org/) library:

**1**. define some variable in `number.js`

```javascript
module.exports = 42
```

**2**. retreive it in your main module file (`main.js`):

```javascript
var num = require('./number.js')

module.exports = {
    init: function(){
        console.log(num) // 42
    },
    oscInFilter: function(data){
        // etc
    }
}
```


**3**. bundle your sources into `custom-module.js`:

`browserify main.js -o custom-module.js --standalone module.exports`
