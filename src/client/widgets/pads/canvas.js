var Canvas = require('../common/canvas'),
    Script = require('../scripts/script'),
    widgetManager = require('../../managers/widgets'),
    html = require('nanohtml'),
    iOS = require('../../ui/ios'),
    iosEvents = ['altitudeAngle', 'azimuthAngle', 'force']

class CanvasWidget extends Canvas {

    static description() {

        return 'Multitouch canvas widget with user-defined drawing functions and touch reactions.'

    }

    static defaults() {

        var defaults = super.defaults().extend({
            class_specific: {
                valueLength: {type: 'number', value: 1, help:[
                    'Defines the number of values accepted by the widget (minimum 1). Incoming messages that don\'t comply will be ignored',
                    'When calling `set()` from a script, submitted value should be an array only if `valueLength` is greater than 1.'
                ]},
                autoClear: {type: 'boolean', value: true, help: [
                    'If set to `false`, the canvas context won\'t be cleared automatically and `ctx.clear` will need to be called in `draw`.'
                ]},
                continuous: {type: 'boolean|number', value: false, help: [
                    'If set to `true`, `draw` will be called at each frame, otherwise it will be called only when the widget is touched and when it receives a value.',
                    'Can be a number between 1 and 60 to specify the framerate (default: 30 fps).'
                ]},
            }
        })
        defaults.scripting = {
            onCreate: {type: 'script', value: '', editor: 'javascript', help: ['Script executed when the widget is created. See <a href="https://openstagecontrol.ammd.net/docs/widgets/scripting/">documentation</a>.']},
            onValue: {type: 'script', value: '', editor: 'javascript', help: ['Script executed whenever the widget\'s value updates. See <a href="https://openstagecontrol.ammd.net/docs/widgets/scripting/">documentation</a>.']},
            onTouch: {type: 'script', value: '', editor:'javascript', help: ['Script executed when the widget is touched and released, and when the pointer moves when the widget is touched. See <a href="https://openstagecontrol.ammd.net/docs/widgets/canvas/">documentation</a>.',]},
            onDraw: {type: 'script', value: '', editor:'javascript', help: ['Script executed when the widget is redrawn. See <a href="https://openstagecontrol.ammd.net/docs/widgets/canvas/">documentation</a>.']},
            onResize: {type: 'script', value: '', editor:'javascript', help: ['Script executed when the widget is resized. See <a href="https://openstagecontrol.ammd.net/docs/widgets/canvas/">documentation</a>.']},
        }
        return defaults

    }

    constructor(options) {

        super({...options, html: html`
            <inner>
                <canvas></canvas>
            </inner>
        `})

        this.valueLength = Math.max(1, parseInt(this.getProp('valueLength')) || 1)
        this.value = this.valueLength > 1 ? Array(this.valueLength).fill(0) : 0

        if (this.getProp('onResize')) {
            this.scripts.onResize = new Script({
                widget: this,
                property: 'onResize',
                code: this.getProp('onResize'),
                context: {
                    value: 0,
                    width: 100,
                    height: 100,
                    cssVars: {}
                }
            })
        }

        if (this.getProp('onDraw')) {
            this.scripts.onDraw = new Script({
                widget: this,
                property: 'onDraw',
                code: this.getProp('onDraw'),
                context: {
                    value: 0,
                    width: 100,
                    height: 100,
                    ctx: {},
                    cssVars: {}
                }
            })
        }

        if (this.getProp('onTouch')) {

            this.scripts.onTouch = new Script({
                widget: this,
                property: 'onTouch',
                code: this.getProp('onTouch'),
                context: {
                    value: 0,
                    width: 100,
                    height: 100,
                    event: {}
                }
            })

            var touchCb = (e, type)=>{

                var event = {...e}
                delete event.firstTarget
                event.targetName = event.target.getAttribute('name')
                event.targetTagName = event.target.tagName
                var w = widgetManager.getWidgetByElement(event.target)
                if (w) event.target = w === this ? 'this' : w.getProp('id')
                else event.target = null
                event.type = type

                this.scripts.onTouch.run({
                    value: this.value,
                    width: this.width,
                    height: this.height,
                    event: event,
                }, {sync: true, send: true})

                this.batchDraw()
            }

            if (iOS) {
                var code = String(this.getProp('onTouch'))
                if (iosEvents.some(x=>code.includes(x))) {
                    this.iosTouch = true
                    this.iosTouchCache = {}
                    this.iosTouchPolls = {}
                    IOS_TOUCH_POLLING = true
                    // enable data getters in ../../events/utils.js
                }
            }

            this.on('draginit',(e)=>{
                touchCb(e, 'start')

                if (iOS && this.iosTouch) {
                    // cache touch inforamtions
                    this.iosTouchCache[e.pointerId] = e
                    // start polling extra touch inforamtions
                    this.iosTouchPolls[e.pointerId] = setInterval(()=>{
                        if (!this.iosTouchCache[e.pointerId]) return
                        var update = false
                        for (var p of iosEvents) {
                            var newval = e['get_' + p]()
                            // if polled value has changed, retrig last move event
                            if (newval !== this.iosTouchCache[e.pointerId][p]) {
                                // reset movement data since this is only relevant when
                                // the pointer doesn't move
                                this.iosTouchCache[e.pointerId].movementX = 0
                                this.iosTouchCache[e.pointerId].movementY = 0
                                // polled data
                                this.iosTouchCache[e.pointerId][p] = newval
                                update = true
                            }
                        }
                        if (update) touchCb(this.iosTouchCache[e.pointerId], 'move')
                    }, 1000 / 30)
                }
            }, {element: this.container, multitouch: true})

            this.on('drag',(e)=>{
                touchCb(e, 'move')
                if (iOS && this.iosTouch) {
                    // cache touch inforamtions
                    this.iosTouchCache[e.pointerId] = e
                }
            }, {element: this.container, multitouch: true})

            this.on('dragend',(e)=>{
                touchCb(e, 'stop')
                if (iOS && this.iosTouch) {
                    // stop polling extra touch inforamtions
                    clearInterval(this.iosTouchPolls[e.pointerId])
                    delete this.iosTouchPolls[e.pointerId]
                    delete this.iosTouchCache[e.pointerId]
                }
            }, {element: this.container, multitouch: true})

        }

        if (this.getProp('continuous')) {
            var freq = parseInt(this.getProp('continuous')) || 30
            freq = Math.max(Math.min(60, freq), 1)
            this.drawInterval = setInterval(()=>{
                this.batchDraw()
            }, 1000/freq)
        }

    }

    setValue(v, options={}) {

        if (Array.isArray(v)) {
            if (v.length !== this.valueLength) return
        } else if (this.valueLength > 1) return

        this.value = v

        this.batchDraw()

        if (options.sync) this.changed(options)
        if (options.send) this.sendValue()
        if (options.defaultInit && this.script) this.script.setValue(this.value, {id: this.getProp('id')})

    }


    draw() {

        if (!this.getProp('onDraw')) return

        if (this.getProp('autoClear')) {
            this.clear()
            this.ctx.beginPath()
        }

        this.scripts.onDraw.run({
            value: this.value,
            ctx: this.ctx,
            width: this.width,
            height: this.height,
            cssVars: this.cssVars
        }, {sync: false, send: false})

        this.batchDraw()

    }

    extraResizeHandle(event) {

        if (!this.getProp('onResize')) return

        this.scripts.onResize.run({
            value: this.value,
            width: this.width,
            height: this.height,
            cssVars: this.cssVars
        }, {sync: false, send: false})

    }

    onRemove() {

        clearInterval(this.drawInterval)

        if (iOS) {
            for (var k in this.iosTouchPolls) {
                clearInterval(this.iosTouchPolls[k])
            }
        }

        super.onRemove()

    }

}

CanvasWidget.dynamicProps = CanvasWidget.prototype.constructor.dynamicProps.concat([
])

module.exports = CanvasWidget
