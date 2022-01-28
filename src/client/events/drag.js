const {normalizeDragEvent, resetEventOffset, TRAVERSING_SAMEWIDGET} = require('./utils')
const iOS = require('../ui/ios')

var targets = {},
    previousPointers = {}

function pointerDownHandler(event) {

    if (event.capturedByEditor || event.touchPunch) return

    if (!event.target._drag_multitouch) {
        for (var i in targets) {
            if (targets[i] == event.target) return
        }
    }

    event = normalizeDragEvent(event)

    if (event.traversingStack) {

        event.target = closestDragContainer(event.target)

        if (!event.target) return

        var widget = closestDragContainer(event.target)._drag_widget,
            local = event.traversingStack.stack[event.traversingStack.stack.length - 1]

        if (widget.getProp) event.traversingStack.firstType = widget.getProp('type')

        if (local.mode === TRAVERSING_SAMEWIDGET && local.type && local.type !== event.traversingStack.firstType) {
            event.traversing = false
        } else {
            event.traversing = true
        }

    }

    targets[event.pointerId] = event.target
    previousPointers[event.pointerId] = event

    triggerWidgetEvent(targets[event.pointerId], 'draginit', event)

}

function pointerMoveHandler(event) {

    event = normalizeDragEvent(event, previousPointers[event.pointerId])

    event.stopPropagation = true

    if (event.traversing) {

        var previousTarget = targets[event.pointerId],
            target = event.isTouch ?
                document.elementFromPoint(event.clientX, event.clientY)
                : event.target

        if (target) target = closestDragContainer(target)

        var local = null
        if (target && event.traversingStack) {
            for (var i = event.traversingStack.stack.length - 1; i > -1; i--) {
                if (event.traversingStack.stack[i].container.contains(target)) {
                    local = event.traversingStack.stack[i]
                    break
                }
            }
            if (!local) {
                target = null
            } else if (local.mode === TRAVERSING_SAMEWIDGET && local.type) {
                var widget = closestDragContainer(target)._drag_widget
                if (widget.getProp && local.type !== widget.getProp('type')) target = null
            }
        }




        if (target && event.isTouch) {
            resetEventOffset(event, target)
        }

        if (previousTarget !== target) {
            triggerWidgetEvent(previousTarget, 'dragend', event)
        }


        if (target && event.traversing) {
            triggerWidgetEvent(target, previousTarget !== target ? 'draginit' : 'drag', event)
        }

        targets[event.pointerId] = target


    } else {
        triggerWidgetEvent(targets[event.pointerId], 'drag', event)
    }

    previousPointers[event.pointerId] = event

}

function pointerUpHandler(event) {

    event = normalizeDragEvent(event, previousPointers[event.pointerId])

    triggerWidgetEvent(targets[event.pointerId], 'dragend', event)

    delete targets[event.pointerId]
    delete previousPointers[event.pointerId]

}


// Move / Up Filter

function pointerMoveFilter(event) {

    if (targets[event.pointerId] !== undefined) {
        pointerMoveHandler.call(targets[event.pointerId], event)
    }

}

function pointerUpFilter(event) {

    if (targets[event.pointerId] !== undefined) {
        pointerUpHandler.call(targets[event.pointerId], event)
        delete targets[event.pointerId]
    }

}

// Mouse events wrappers

// function mouseMultiWrapper(event) {
//     mouseDownCapture(event, true)
// }

function mouseDownCapture(event, multitouch) {
    if (event.pointerType === 'touch') return
    // event.pointerId = 'mouse'
    // event.multitouch = multitouch
    pointerDownHandler(event)
}

function mouseMoveCapture(event) {
    if (event.pointerType === 'touch') return
    // event.pointerId = 'mouse'
    event.inertia = event.ctrlKey ? 10 : 1
    pointerMoveFilter(event)
}

function mouseUpCapture(event){
    if (event.pointerType === 'touch') return
    // event.pointerId = 'mouse'
    pointerUpFilter(event)
}


// Touch events wrappers

// function touchMultiWrapper(event) {
//     touchDownCapture(event, true)
// }

function touchDownCapture(event, multitouch) {

    event.preventDefault()
    for (var i in event.changedTouches) {
        if (isNaN(i) || !event.changedTouches[i]) continue
        var touchEvent = event.changedTouches[i]

        if (event.traversingStack) {
            touchEvent.traversingStack = event.traversingStack
        }

        touchEvent.pointerId = touchEvent.identifier
        // touchEvent.multitouch = multitouch

        pointerDownHandler(touchEvent)
    }
}

function touchMoveCapture(event) {
    for (var i in event.changedTouches) {
        if (isNaN(i) || !event.changedTouches[i]) continue
        var touchEvent = event.changedTouches[i]

        var fingers = 0
        for (var j in event.touches) {
            if (event.touches[j].target && event.touches[j].target.isSameNode(touchEvent.target)) {
                fingers += 1
                if (fingers == 2) {
                    touchEvent.inertia = 10
                    break
                }
            }
        }

        touchEvent.pointerId = touchEvent.identifier
        pointerMoveFilter(touchEvent)
    }
}

function touchUpCapture(event) {
    for (var i in event.changedTouches) {
        if (isNaN(i) || !event.changedTouches[i]) continue
        var touchEvent = event.changedTouches[i]
        touchEvent.pointerId = touchEvent.identifier
        pointerUpFilter(touchEvent)
    }
}


function closestDragContainer(target) {
    var container = target
    while (container !== null) {
        if (container._drag_widget) {
            return container
        } else {
            container = container.parentNode
        }
    }
    return null
}

// Callback trigger

function triggerWidgetEvent(target, name, event) {
    var container = closestDragContainer(target)
    if (container) container._drag_widget.trigger(name, event)
}

// init

DOM.ready(()=>{
    if (!iOS) document.addEventListener('pointermove', mouseMoveCapture, true)
    if (!iOS) document.addEventListener('pointerup', mouseUpCapture, true)
    document.addEventListener('touchmove', touchMoveCapture, true)
    DOM.addEventListener(document, 'touchend touchcancel', touchUpCapture, true)

    document.addEventListener('touchstart', touchDownCapture, false)
    if (!iOS) document.addEventListener('pointerdown', mouseDownCapture)

})

module.exports = {

    setup: function(options) {

        if (
            this._customBindings['drag'] !== 0 ||
            this._customBindings['draginit'] !== 0 ||
            this._customBindings['dragend'] !== 0 ||
            !options || options.ignoreCustomBindings
        ) {
            return
        }

        var {element, multitouch} = options

        element._drag_widget = this
        element._drag_multitouch = multitouch
        element.style.touchAction = 'none'

    },

    teardown: function(options) {

        if (
            this._customBindings['drag'] !== 0 ||
            this._customBindings['draginit'] !== 0 ||
            this._customBindings['dragend'] !== 0 ||
            !options || options.ignoreCustomBindings
        ) {
            return
        }

        var {element, multitouch} = options

        delete element._drag_widget
        delete element._drag_multitouch
        element.style.touchAction = ''

    },

    enableTraversingGestures: function(element, options={}) {

        if (element._traversing) return

        var traversing = options.type ? TRAVERSING_SAMEWIDGET : true,
            traversingType = options.type === 'auto' ? '' : options.type

        element._traversing = traversing

        function makeEventTraversing(event) {
            if (event.ctrlKey) return
            if (!event.traversingStack) event.traversingStack = {firstType: '', stack: []}
            event.traversingStack.stack.push({
                container: element,
                mode: traversing,
                type: traversingType
            })

        }

        if (!iOS) element.addEventListener('pointerdown', makeEventTraversing, true)
        element.addEventListener('touchstart', makeEventTraversing, true)

        element.addEventListener('disableTraversingGestures', (e)=>{
            e.stopPropagation()
            if (!iOS) element.removeEventListener('pointerdown', makeEventTraversing, true)
            element.removeEventListener('touchstart', makeEventTraversing, true)

        })

    },

    disableTraversingGestures: function(element) {

        if (!element._traversing) return

        delete element._traversing

        DOM.dispatchEvent(element, 'disableTraversingGestures')

    }

}
