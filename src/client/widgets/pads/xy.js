var Pad = require('./pad'),
    Fader = require('../sliders/fader'),
    doubleTap = require('../mixins/double_tap'),
    touchstate = require('../mixins/touch_state')

var faderDefaults = Fader.defaults()._props()

module.exports = class Xy extends Pad {

    static description() {

        return 'Two-dimensional slider.'

    }

    static defaults() {

        var defaults = super.defaults().extend({
            style: {
                _separator_xy_style: 'Xy style',
                pointSize: {type: 'integer', value: 20, help: 'Defines the points\' size'},
                ephemeral: {type: 'boolean', value: false, help: 'When set to `true`, the point will be drawn only while touched.'},
                pips: {type: 'boolean', value: true, help: 'Set to `false` to hide the scale'},
            },
            class_specific: {
                snap: {type: 'boolean', value: false, help: [
                    'By default, the points are dragged from their initial position.',
                    'If set to `true`, touching anywhere on the widget\'s surface will make them snap to the touching coordinates',
                ]},
                spring: {type: 'boolean', value: false, help: 'When set to `true`, the widget will go back to its default value when released'},
                rangeX: {type: 'object', value: {min:0,max:1}, help: 'Defines the min and max values for the x axis'},
                rangeY: {type: 'object', value: {min:0,max:1}, help: 'Defines the min and max values for the y axis'},
                logScaleX: {type: 'boolean|number', value: false, help: 'Set to `true` to use logarithmic scale for the x axis. Set to `-1` for exponential scale.'},
                logScaleY: {type: 'boolean|number', value: false, help: 'Set to `true` to use logarithmic scale for the y axis. Set to `-1` for exponential scale.'},
                axisLock: {type: 'string', value: '', choices: ['', 'x', 'y', 'auto'], help: [
                    'Restrict movements to one of the axes only unless `Shift` is held.',
                    'When left empty, holding `Shift` while dragging will lock the pad according the first movement. `auto` will do the opposite.'
                ]},
                doubleTap: {type: 'boolean|string', value: false, help: [
                    'Set to `true` to make the fader reset to its default value when receiving a double tap.',
                    'Can also be an osc address, which case the widget will just send an osc message: `/<doubleTap> <preArgs>`'
                ]},
                sensitivity: {type: 'number', value: 1, help: 'Defines the pad\'s sensitivity when `snap` is `false` '},
            }
        })

        defaults.scripting.onTouch = {type: 'script', value: '', editor:'javascript', help: ['Script executed when the widget is touched and released. See <a href="https://openstagecontrol.ammd.net/docs/widgets/scripting/">documentation</a>.',]}

        return defaults

    }

    constructor(options) {

        super(options)

        this.preventChildrenTouchState = true

        this.faders = {
            x: new Fader({props:{
                ...faderDefaults,
                id:0,
                visible:false,
                horizontal:true,
                default:this.getProp('default').length === 2 ? this.getProp('default')[0] : '',
                snap:this.getProp('snap'),
                range:this.getProp('rangeX'),
                decimals:this.getProp('decimals'),
                logScale:this.getProp('logScaleX'),
                sensitivity: this.getProp('sensitivity'),
            }, parent: this}),
            y: new Fader({props:{
                ...faderDefaults,
                id:1,
                visible:false,
                horizontal:false,
                default:this.getProp('default').length === 2 ? this.getProp('default')[1] : '',
                snap:this.getProp('snap'),
                range:this.getProp('rangeY'),
                decimals:this.getProp('decimals'),
                logScale:this.getProp('logScaleY'),
                sensitivity: this.getProp('sensitivity'),
            }, parent: this}),
        }

        this.on('value-changed',(e)=>{
            if (e.widget == this) return
            e.stopPropagation = true
        })

        touchstate(this, {element: this.canvas})

        this.active = false

        this.autoAxisLock = ''

        this.on('draginit',(e)=>{
            this.active = true
            this.autoAxisLock = ''
            var axis = this.getProp('axisLock')
            if (axis !== '' && e.shiftKey) axis = ''
            if (axis !== 'y') this.faders.x.trigger('draginit', {...e, stopPropagation: true})
            if (axis !== 'x') this.faders.y.trigger('draginit', {...e, stopPropagation: true})
            this.dragHandle()
        }, {element: this.canvas})

        this.on('drag',(e)=>{
            var axis = this.getProp('axisLock')
            if (axis !== '' && e.shiftKey) axis = ''
            else if (e.shiftKey && axis === '' || !e.shiftKey && axis === 'auto') {
                if (this.autoAxisLock === '') {
                    if (Math.abs(e.movementX) > Math.abs(e.movementY)) {
                        this.autoAxisLock = 'x'
                    } else if (Math.abs(e.movementY) > Math.abs(e.movementX)) {
                        this.autoAxisLock = 'y'
                    }
                }
                axis = this.autoAxisLock
            }
            if (axis !== 'y') this.faders.x.trigger('drag', e)
            if (axis !== 'x') this.faders.y.trigger('drag', e)
            this.dragHandle()
        }, {element: this.canvas})

        this.on('dragend', (e)=>{
            this.active = false
            var axis = this.getProp('axisLock')
            if (axis !== '' && e.shiftKey) axis = ''
            if (axis !== 'y') this.faders.x.trigger('dragend', {...e, stopPropagation: true})
            if (axis !== 'x') this.faders.y.trigger('dragend', {...e, stopPropagation: true})
            if (this.getProp('spring')) {
                this.setValue([this.faders.x.getSpringValue(),this.faders.y.getSpringValue()],{sync:true, send:true, spring:true})
            } else {
                this.batchDraw()
            }
        }, {element: this.canvas})

        if (this.getProp('doubleTap')) {

            if (typeof this.getProp('doubleTap') === 'string' && this.getProp('doubleTap')[0] === '/') {

                doubleTap(this, ()=>{
                    this.sendValue({v:null, address: this.getProp('doubleTap')})
                }, {element: this.widget})

            } else {

                doubleTap(this, ()=>{
                    this.setValue([this.faders.x.getSpringValue(),this.faders.y.getSpringValue()],{sync:true, send:true, spring:true, doubleTap:true})
                }, {element: this.widget})

            }

        }

        this.setValue([0,0])

    }

    dragHandle(){

        var x = this.faders.x.value,
            y = this.faders.y.value


        if (x != this.value[0] || y != this.value[1]) {
            this.setValue([x, y],{send:true,sync:true,dragged:true})
        } else {
            this.batchDraw()
        }

    }

    extraResizeHandle(event){

        super.extraResizeHandle(event)

        for (var k in this.faders) {
            this.faders[k].width = this.width
            this.faders[k].height = this.height
            this.faders[k].gaugePadding = this.padPadding
        }

    }


    setValue(v, options={}) {

        if (!v || !v.length || v.length!=2) return
        if (this.touched && !options.dragged && !options.doubleTap) return this.setValueTouchedQueue = [v, options]

        if (!options.dragged) {
            this.faders.x.setValue(v[0], {sync: false, send:false, dragged:false, doubleTap: options.doubleTap})
            this.faders.y.setValue(v[1], {sync: false, send:false, dragged:false, doubleTap: options.doubleTap})
        }

        this.value = [
            this.faders.x.value,
            this.faders.y.value
        ]

        if (options.send) this.sendValue()
        if (options.sync) this.changed(options)

        this.batchDraw()

    }

    draw() {

        var pointSize = this.cssVars.pointSize,
            margin = this.padPadding,
            x = this.faders.x.percentToCoord(this.faders.x.percent),
            y = this.faders.y.percentToCoord(this.faders.y.percent),
            ephemeral = this.getProp('ephemeral')

        this.clear()


        if (!ephemeral || this.active) {
            this.ctx.fillStyle = this.cssVars.colorFill
            this.ctx.globalAlpha = this.cssVars.alphaFillOn
            this.ctx.beginPath()
            this.ctx.arc(x, y, pointSize - 3 * PXSCALE, Math.PI * 2, false)
            this.ctx.fill()
        }




        var pipsDrawn = false
        if (this.getProp('pips')) {

            var pipTexts = margin >= this.fontSize * 1.5

            this.ctx.lineWidth = PXSCALE
            this.ctx.fillStyle = this.cssVars.colorText
            this.ctx.strokeStyle = this.cssVars.colorStroke
            this.ctx.globalAlpha = this.cssVars.alphaPips
            this.ctx.beginPath()

            for (let i in this.faders.x.rangeKeys) {

                let pip = this.faders.x.rangeKeys[i],
                    px = Math.round(0.5 * this.faders.x.percentToCoord(pip)) * 2

                if (parseInt(px) === px) px -= 0.5

                if (pipTexts) {
                    this.ctx.textAlign = 'center'
                    let label = this.faders.x.rangeLabels[i]
                    this.ctx.fillText(label, px, this.height - margin / 2)
                    pipsDrawn = true
                }

                if (pip == 0 || pip == 100) continue
                this.ctx.moveTo(px, margin - PXSCALE)
                this.ctx.lineTo(px, this.height - margin + PXSCALE)
                pipsDrawn = true


            }
            for (let i in this.faders.y.rangeKeys) {

                let pip = this.faders.y.rangeKeys[i],
                    py = Math.round(0.5 * this.faders.y.percentToCoord(pip)) * 2

                if (parseInt(py) === py) py -= 0.5

                if (pipTexts) {
                    this.ctx.textAlign = 'right'
                    let label = this.faders.y.rangeLabels[i]
                    this.ctx.fillText(label, margin / 2 + this.fontSize / 2, py)
                    pipsDrawn = true
                }

                if (pip == 0 || pip == 100) continue
                this.ctx.moveTo(margin - PXSCALE, py)
                this.ctx.lineTo(this.width - margin + PXSCALE, py)
                pipsDrawn = true


            }

            this.ctx.globalAlpha = this.cssVars.alphaFillOn
            this.ctx.stroke()

        }

        if (!pipsDrawn) this.clearRect = [x - pointSize - 2 * PXSCALE, y - pointSize - 2 * PXSCALE, (pointSize + PXSCALE) * 4, (pointSize + PXSCALE) * 4]


        if (!ephemeral || this.active) {
            this.ctx.strokeStyle = this.cssVars.colorStroke
            this.ctx.globalAlpha = this.active ? 1 : 0.75
            this.ctx.lineWidth = 1.5 * PXSCALE
            this.ctx.beginPath()
            this.ctx.arc(x, y, pointSize, Math.PI * 2, false)
            this.ctx.stroke()
        }



    }

    onPropChanged(propName, options, oldPropValue) {

        if (super.onPropChanged(...arguments)) return true

        switch (propName) {

            case 'spring':
                if (this.getProp('spring') && !this.touched) this.setValue([this.faders.x.getSpringValue(),this.faders.y.getSpringValue()], {...options})
                return

        }

    }


    onRemove() {

        this.faders.x.onRemove()
        this.faders.y.onRemove()
        super.onRemove()

    }

}
