# Canvas widget

The canvas widget allows creating custom widgets with user-defined drawings and touch reactions.

It has two special properties, `touch` and `draw`, that work like the `script` property : they are used to defined scripts that will be executed when specific events occurs.

This widget requires a good understanding of the javascript [Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API) and of the javascript programming language in general.

## `touch`

This script is executed when the widget is touched, when it is released, and during the movement of the pointer while the widget is touched.

This script has access to the same variables and functions as the `script` property (except the event-specific ones), plus the following:

- `value`: widget value
- `width`: widget width in pixels
- `height`: widget height in pixels
- `event`: object containing the following:
    - `type`: `"start"`, `"move"` or `"stop"`
    - `target`: id of the widget under the pointer, `"this"` if it's the canvas widget itself, `null` if no widget is under the pointer
    - `offsetX`, `offsetY`: touch coordinates in pixels, relative to `target`
    - `movementX`, `movementY`: movement of the pointer in pixels since the last event
    - `pointerId`: unique identifier used to differenciate fingers in multitouch situation
    - `altKey`, `ctrlKey`, `shiftKey`: keyboard modifier states


## `draw`

This script is executed when the widget should be redrawn, which is when it's touched and when it receives a value. If the `continuous` property is enabled, the widget will be redrawn at a fixed rate even if not interacted with.

This script has access to the same variables and functions as the `script` property (except the event-specific ones), plus the following:

- `value`: widget value
- `width`: widget width in pixels
- `height`: widget height in pixels
- `ctx`: [canvas rendering context](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D) of the widget
- `cssVars`: object containing the computed value of some of the widget's style properties such as `colorWidget`, `alphaFill`, `padding`, etc

## Example: XY pad

Let's create a simple xy pad, with a value made of two numbers between 0 and 1. We set `valueLength` to `2` to make sure the widget only accepts incoming messages with two values (x and y).

First, we use the `touch` property to store the touch coordinates in the `locals` object. We also call `set()` to store these in the widget's value (this way, the widget can send messages and sync with other widgets).

```js
// touch property

// store normalized coordinates
if (event.type == "start") {
    locals.x = event.offsetX / width
    locals.y = event.offsetY / height
} else {
    // when the pointer is moving, increment coordinates
    // because offsetX and offsetY may not be relevant
    // if the pointer hovers a different widgets
    locals.x += event.movementX / width
    locals.y += event.movementY / height
}

// update widget value and send
set("this", [locals.x, locals.y])
```

Then, we use the `draw` property to draw a circle at the touch coordinates.

```js
// draw property

// draw circle at touch coordinates
ctx.arc(value[0] * width, value[1] * height, 6, 0, Math.PI * 2)
// use colorFill property as stroke color
ctx.strokeStyle = cssVars.colorFill
// draw stroke
ctx.stroke()
```

Finally, we use the `script` property to apply limits to the values.

```js
// script property

// apply limits
var x = Math.max(0, Math.min(1, value[0])),
    y = Math.max(0, Math.min(1, value[1]))

// re-update widget value without retriggering script or sending message
set("this", [x, y], {sync: false, send: false})

// the widget will automatically send its value if
// this script was triggered by a user interaction
// no need to call send() here but we could, for example
// if we want to split the value in to multiple messages
```

## Example: multi slider

Let's build a row of 20-sliders with a single widget. We first set `valueLength` to... 20 !

```js
// touch property

// store normalized coordinates
if (event.type == "start") {
    locals.x = event.offsetX / width
    locals.y = event.offsetY / height
} else {
    // when the pointer is moving, increment coordinates
    // because offsetX and offsetY may not be relevant
    // if the pointer hovers a different widgets
    locals.x += event.movementX / width
    locals.y += event.movementY / height
}


// which slider are we touching ?
var n = parseInt(locals.x * value.length)
n = Math.max(0, Math.min(n, value.length-1))

// update widget at slider's index
// 1 - locals.y because y axis is from top to bottom in js canvas
value[n] = 1 - locals.y

// update widget value and send
set("this", value)
```

```js
// draw property

ctx.fillStyle = cssVars.colorFill
ctx.globalAlpha = cssVars.alphaFill

var sliderWidth = width / value.length - 1
for (var i in value){
    ctx.beginPath()
    ctx.rect(i * width / value.length, height, sliderWidth, - value[i] * height)
    ctx.fill()
}
```

```js
// script property

// apply limits
for (var i in value) {
    value[i] = Math.max(0, Math.min(1, value[i]))
}

// re-update inner value without retriggering script or sending message
set("this", value, {sync: false, send: false})
```
