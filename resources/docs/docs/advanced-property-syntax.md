# Advanced property syntax

## Inheritance: `@{id.property}`

Widgets can use each other's properties values and update automatically when they change by using this syntax.

- `id`: the target widget's `id`
- `property`: is the target widget's property name


#### Value

The property name (and the dot) can be omitted and defaults to `value` (`@{widgetId}` => `@{widgetId.value}`). `value` always resolves to the target widget's current value, not its `value` property

#### `this` & `parent`

A widget can fetch its own properties or its direct parent's by using the keywords `this` or `parent` instead of `id`. When `this` or `parent` can be used, using the target widget's `id` instead won't work.

#### Dynamic properties

Some properties, when changed, trigger a complete widget recreation that ends any ongoing user interaction. Also, updating these properties continuously (e.g. when linked to a slider's dynamic value) can be very cpu expensive.

Some properties have much cheaper update routines and can be considered as `dynamic`, as in performance safe. These properties are marked in the documentation with a <i class="dynamic-prop-icon" title="dynamic"></i>.


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
- `default` (optional): default value returned before any message is received
- `usePreArgs` (optional): by default, osc listeners inherit the widget's `preArgs` and (these must be matched for the osc messages to be processed). Set to `false` bypass them.


#### Dynamic address

The `address` can contain `@{}` blocks



## Javascript: `JS{{ <code> }}`

This syntax allows writing formulas in pure javascript. The code will be compiled as a function and executed in a restricted context.

- if no `return` statement is found, the formula will return an empty string
- javascript [strict mode](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Strict_mode) is always enabled
- `setTimeout` and `setInterval` functions are not available
- the `global` object is shared between all javascript formulas (changing its properties *does not* trigger any synchronisation even if the value is used somewhere else)

In this context, `@{} / OSC{}` are seen as variables, not as the value they hold,


## Formulas: `#{}`

!!! warning "Deprecated"
    This syntax is now deprecated and will be removed in the future, sessions using it will be working for a few more versions but users are strongly encouraged to migrate to the javascript syntax.

The following syntax allow writing mathematical formulas in widgets' properties:

```
#{FORMULA}
```

Where FORMULA is a valid [MathJS](http://mathjs.org/docs/expressions/syntax.html) expression:

- [syntax documentation](http://mathjs.org/docs/expressions/syntax.html)
- [available functions](http://mathjs.org/docs/reference/functions.html)
- [available constants](http://mathjs.org/docs/reference/constants.html)
- formulas can be [multiline](http://mathjs.org/docs/expressions/syntax.html#multiline-expressions)
- property inheritance calls (`@{...}`) are always resolved before formulas
- arrays / matrices indexes are **zero-based** (ie `["a","b"][0]` returns `"a"`)
- strings can be multiline when enclosed in backticks instead of double quotes (``` ` `  ```)

Additionnal functions:

- `indexOf(a, x)`: returns index of item `x` in array `a`
- `unpack(x)`: remove an array's brackets (`unpack([1,2])` returns `"1, 2"`)
- `pad(x, padding)`: add leading zeros if the length of the integer part of `x` is smaller than `padding` (`pad(1,2)` returns `"01"`)
- `length(x)`: returns the length of an array or string
- `keys(x)`: returns an array of a given object's property names (from [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/keys))
- `values(x)`: returns an array of a given object's own enumerable property values (from [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/values))
- `extend(x, y)`: merges two objects into one

!!! tip ""
    A single widget property can contain multiple formulas. Variables and functions declared in a formula are available to subsequent formulas in the same property definition.
