# Scripting

The `script` property allows widgets to run javascript code when their value update. It differs from the javascript property syntax in the following ways:
- no `JS{{}}` wrapper, only `code`
- `@{}`, `OSC{}`, `JS{{}}` and `#{}` blocks are replaced with their value before the script's compilation

## Available variables

#### `get`: `function(id)`

Returns the value of the first widget whose id is `"id"`.

#### `set`: `function(id, value)`

Sets the value of the first widget whose id is `"id"`.
If the event that triggered the script's execution was initiated by a user interaction, this will make the widget send its value as well.

#### `send`: `function(target, address, ...args)`
- `target` (optional): `"ip:port"` or `"midi:device_name"` string. If omitted, the widget's target will be used.
- `address`: osc address, must start with a `/`
- `args`: value or `{type: "OSC_TYPE_LETTER", value: VALUE}` `object`

If the event that triggered the script's execution was not initiated by a user interaction, this function will have no effect.

#### `getProp`: `function(id, name)`

Returns the property called `"name"` of the first widget whose id is `"id"`.

#### `httpGet`: `function(url, callback)`

- `url`: url of the resource to fetch (local url only)
- `callback`: function executed when/if the http request succeeds, with the response text as argument

#### `stateGet`: `function(id)`

Returns a state object (`id:value`) for the widget that match `id` and all its children.

#### `stateSet`: `function(state)`

Loads a state object. If the event that triggered the script's execution was initiated by a user interaction, this will make the updated widgets send their value as well.

#### `storage`: [`localStorage`](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)

Allows storing data that persists upon refresh/relaunch.

#### [`setTimeout`](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/setTimeout) / [`setInterval`](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/setInterval): `function(id, callback, delay)`

These work like their native equivalent, with an extra (optional) `id` argument.

- `id` (optional): unique identifier. If a timeout with the same id is already running, it is cleared before the new one is created. If omitted, defaults to `undefined`. One can use `Math.random()` or `Date.now()` to force new id at each execution, though this might cause performance issues. `id`s are scoped to the widget's context: two timeouts with the same `id` in two different widgets can run concurrently
- `callback`: function to executed
- `delay`: delay before execution is ms


#### [`clearTimeout`](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/clearTimeout) / [`clearInterval`](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/clearInterval): `function(id)`

Clear timeout with matching `id`.
