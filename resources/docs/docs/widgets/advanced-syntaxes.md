# Advanced syntaxes

## Inheritance: `@{id.property}`

Widgets can use each other's properties values and update automatically when they change by using this syntax.

- `id`: the target widget's `id`
- `property`: is the target widget's property name


#### Value

The property name (and the dot) can be omitted and defaults to `value` (`@{widgetId}` => `@{widgetId.value}`). `value` always resolves to the target widget's current value, not its `value` property

#### `this` & `parent`

A widget can fetch its own properties or its direct parent's by using the keywords `this` or `parent` instead of `id`. When `this` or `parent` can be used, using the target widget's `id` instead won't work.

#### `uuid`

Each widget has a unique random identifier that can be retreived with the property name `uuid` (e.g. `@{this.uuid}`, `@{parent.uuid}`). 

#### Dynamic properties

Some properties, when changed, trigger a complete widget recreation that ends any ongoing user interaction. Also, updating these properties continuously (e.g. when linked to a slider's dynamic value) can be very cpu expensive.

Some properties have much cheaper update routines and can be considered as `dynamic`, as in performance safe. These properties are marked in the documentation with a <i class="fas fa-bolt" title="dynamic"></i>.


#### Circular references cases

- container widgets can inherit their children's properties only to define `dynamic` properties
- widgets can inherit their own `value`<i class="dynamic-prop-icon" title="dynamic"></i> property only to define `dynamic` properties

#### Object properties

If the retreived property is an object (`{}`) or an array (`[]`), a subset can be retreived directly by appending a dot and a key (array index or object key) : `@{parent.variables.key}`


#### Nesting

The inheritance syntax supports 1-level nesting : `@{fader_@{toggle_1}}`


## OSC listeners: `OSC{address, default, usePreArgs}`

This syntax allows listening on an osc address to define a property.

- `address`: osc address to listen to; if the leading slash (`/`) is omitted, the address will be prefixed with the widget's `address` property
- `default` (optional): default value returned before any message is received. Must be a primitive value, not an object or an array.
- `usePreArgs` (optional): by default, osc listeners inherit the widget's `preArgs` (these must be matched for the osc messages to be processed). Set to `false` bypass them.

Options can contain `@{}` blocks.

??? example "Array/Object default value"
    ```js
    JS{{
        return OSC{address} || {
            "key a": 1,
            "key b", 2
        }
    }}
    ```


## Javascript: `JS{{ <code> }}`

This syntax allows writing formulas in pure javascript. The code will be compiled as a function and executed in a restricted context.

- if no `return` statement is found, the formula will return an empty string
- javascript [strict mode](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Strict_mode) is always enabled
- `setTimeout` and `setInterval` functions are not available

A property cannot contain multiple `JS{{}}` blocks

#### Available variables

- `console`: javascript console
- `locals`: object for storing/reading arbitrary values. Changing its properties *does not* trigger any synchronisation even if the value is used somewhere else.
- `globals`: same as `locals` but shared between all widgets, contains a few useful variables:
    - `screen`: client screen dimensions (`{width, height}`)
    - `env`: client options (ie: url query options),
    - `ip`: client's ip address,
    - `url`: server url,
    - `platform`: operating system as seen by the client

In this context, `@{} / OSC{}` are also seen as variables (named `VAR_XXX`), not as the value they hold,

Parsing errors can be read in the DevTool console (F12).

!!! warning
    Modifying values in `locals` or `globals` **does not** trigger anything if they are used somewhere else.

## Javascript: `#{ <code> }`

This is a shorthand for the `JS{{}}` syntax, the only difference being that `<code>` is automatically prepended with a `return` statement. A property can contain multiple `#{}` blocks.

!!! note "Compilation order"
    `#{}` blocks are compiled after `JS{{}}` blocks
