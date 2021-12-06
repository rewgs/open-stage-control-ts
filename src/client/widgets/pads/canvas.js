var Canvas = require('../common/canvas'),
    Script = require('../scripts/script'),
    widgetManager = require('../../managers/widgets'),
    html = require('nanohtml')

class CanvasWidget extends Canvas {

    static description() {

        return 'Multitouch canvas widget with user-defined drawing functions and touch reactions.'

    }

    static defaults() {

        return super.defaults().extend({
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
                touch: {type: 'string', value: '', help: [
                    'Script executed when the widget is touched',
                ]},
                draw: {type: 'string', value: '', help: [
                    'Script executed when the widget is redrawn.'
                ]},
            }
        })

    }

    constructor(options) {

        super({...options, html: html`
            <inner>
                <canvas></canvas>
            </inner>
        `})

        this.valueLength = Math.max(1, parseInt(this.getProp('valueLength')) || 1)
        this.value = this.valueLength > 1 ? Array(this.valueLength).fill(0) : 0

        this.drawScript = new Script({props:{
            id: this.getProp('id') + '/drawScript',
            script: this.getProp('draw'),
            event: {
                value: 0,
                width: 100,
                height: 100,
                ctx: {},
                cssVars: {}
            }
        }, builtIn: true, parent: this})

        this.touchScript = new Script({props:{
            id: this.getProp('id') + '/touchScript',
            script: this.getProp('touch'),
            event: {
                value: 0,
                width: 100,
                height: 100,
                event: {}
            }
        }, builtIn: true, parent: this})

        var touchCb = (e, type)=>{

            var event = {...e}
            delete event.firstTarget
            var w = widgetManager.getWidgetByElement(event.target)
            if (w) event.target = w === this ? 'this' : w.getProp('id')
            else event.target = null
            event.type = type

            this.touchScript.run({
                value: this.value,
                width: this.width,
                height: this.height,
                event: event,
            }, {sync: true, send: true})

            this.batchDraw()
        }

        this.on('draginit',(e)=>{
            touchCb(e, 'start')
        }, {element: this.widget, multitouch: true})

        this.on('drag',(e)=>{
            touchCb(e, 'move')
        }, {element: this.widget, multitouch: true})

        this.on('dragend',(e)=>{
            touchCb(e, 'stop')
        }, {element: this.widget, multitouch: true})

        if (this.getProp('continuous')) {
            var freq = parseInt(this.getProp('continuous')) || 30
            freq = Math.max(Math.min(60, freq), 1)
            this.drawInterval = setInterval(()=>{
                this.batchDraw()
            }, 1000/freq)
        }

    }

    setValue(v, options={}) {

        if (this.valueLength > 1 && Array.isArray(v) && v.length != this.valueLength) return

        this.value = v

        this.batchDraw()

        if (options.sync) this.changed(options)
        if (options.send) this.sendValue()
        if (options.defaultInit && this.script) this.script.setValue(this.value, {id: this.getProp('id')})

    }


    draw() {

        if (this.getProp('autoClear')) {
            this.clear()
            this.ctx.beginPath()
        }

        this.drawScript.run({
            value: this.value,
            ctx: this.ctx,
            width: this.width,
            height: this.height,
            cssVars: this.cssVars
        }, {sync: false, send: false})
        this.batchDraw()

    }

    onRemove() {

        clearInterval(this.drawInterval)
        super.onRemove()

    }

}

CanvasWidget.dynamicProps = CanvasWidget.prototype.constructor.dynamicProps.concat([
])

module.exports = CanvasWidget
