# Canvas widget

The canvas widget allows creating custom widgets with user-defined drawings and touch reactions.

It has two special properties, `touch` and `draw`, that work like the `script` property : they are used to defined scripts that will be executed when specific events occurs.

This widget requires a good understanding of the javascript [Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API) and of the javascript programming language in general.

## `touch`

This script is executed when the wigdget is touched, when it is released, and during the movement of the pointer while the widget is touched.

This script has access to the same variables and functions as the `script` property (except the event-specific ones), plus the following:

- `width`: widget width in pixels
- `height`: widget height in pixels
- `event`: object containing the following:
    - `type`: `"start"`, `"move"` or `"stop"`
    - `target`: id of the widget under the pointer, `"this"` if it's the canvas widget itself, `null` if no widget is under the pointer
    - `offsetX`, `offsetY`: touch coordinates in pixels, relative to `target`
    - `movementX`, `movementY`: movement of the pointer in pixels since the last event
    - `pointerId`: unique identifier used to differenciates fingers in multitouch situation
    - `altKey`, `ctrlKey`, `shiftKey`: keyboard modifier states


## `draw`

This script is executed when the widget should be redrawn, which is when it's touched and when it receives a value. If the `continuous` property is enabled, the widget will be redrawn at a fixed rate even if not interacted with.

This script has access to the same variables and functions as the `script` property (except the event-specific ones), plus the following:

- `width`: widget width in pixels
- `height`: widget height in pixels
- `ctx`: [canvas rendering context](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D) of the widget
- `cssVars`: object containing the computed value of some of the widget's style properties such as `colorWidget`, `alphaFill`, `padding`, etc

## Example

Let's create a simple xy pad, with a value made of two numbers between 0 and 1.

First, we use the `touch` property to store the touch coordinates in the `locals` object. We also call `set()` to store these in the widget's value?

```js
// touch property

// store normalized coordinates
if (event.type == "start") {
    locals.dx = event.offsetX / width
    locals.dy = event.offsetY / height
} else {
    // when the pointer is moving, increment coordinates
    // because offsetX and offsetY may not be relevant
    // if the pointer hovers a different widgets
    locals.dx += event.movementX / width
    locals.dy += event.movementY / height
}

// locals.dx and locals.dy may be under 0 or above 1
// but we want the widget's value and the drawing to
// stay between these limits
locals.x = Math.max(0, Math.min(1, locals.dx))
locals.y = Math.max(0, Math.min(1, locals.dy))

// update widget value and send
set("this", [locals.x, locals.y])
```

Then, we use the `draw` property to draw a circle at the touch coordinates.

```js
// draw property

// draw an arc at touch coordinates
ctx.arc(locals.x * width, locals.y * height, 6, 0, Math.PI * 2)
// use colorFill property as stroke color
ctx.strokeStyle = cssVars.colorFill
// draw stroke
ctx.stroke()
```

Finally, we use the `script` property to make the widget send it's values, and to make sure it updates properly when reveiving.

```js
// script property

// update locals.x and locals.y
// required if we want to update the drawing when receiving osc messages
if (value.length == 2) {
    locals.x = value[0]
    locals.y = value[1]
}
```
