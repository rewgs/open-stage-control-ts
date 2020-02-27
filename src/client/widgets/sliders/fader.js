var {clip} = require('../utils'),
    Slider = require('./slider'),
    parser = require('../../parser'),
    html = require('nanohtml')

module.exports = class Fader extends Slider {

    static description() {

        return 'Vertical / horizontal slider.'

    }

    static defaults() {

        return super.defaults({

            _fader:'fader',

            mode: {type: 'string', value: 'flat', choices: ['flat', 'line'], help: 'Design style'},
            horizontal: {type: 'boolean', value: false, help: 'Set to `true` to display the fader horizontally'},
            alignRight: {type: 'boolean', value: false, help: 'Set to `true` to invert the pip\'s and fader\'s position'},
            pips: {type: 'boolean', value: true, help: 'Set to `false` to hide the scale'},
            dashed: {type: 'boolean', value: false, help: 'Set to `true` to display a dashed gauge'},
            gradient: {type: 'array|object', value: [], help: [
                'When set, the meter\'s gauge will be filled with a linear color gradient',
                '- each item must be a CSS color string.',
                '- as an `object`: each key must be a number between 0 and 1',
                '- each item must be a CSS color string.',
                'Examples: `[\'blue\', \'red\']`, {\'0\': \'blue\', \'0.9\': \'blue\', \'1\': \'red\'} '
            ]},
            snap: {type: 'boolean', value: false, help: 'By default, dragging the widget will modify it\'s value starting from its last value. Setting this to `true` will make it snap directly to the mouse/touch position'},
            spring: {type: 'boolean', value: false, help: 'When set to `true`, the widget will go back to its `default` value when released'},
            doubleTap: {type: 'boolean', value: false, help: [
                'Set to `true` to make the fader reset to its `default` value when receiving a double tap.',
                'Can also be an osc address, in which case the widget will just send an osc message (`/<doubleTap> <preArgs>`)'
            ]},
            range: {type: 'object', value: {min:0,max:1}, help: [
                'Defines the breakpoints of the fader\'s scale:',
                '- keys can be percentages and/or `min` / `max`',
                '- values can be `number` or `object` if a custom label is needed',
                'Example: (`{min:{"-inf": 0}, "50%": 0.25, max: {"+inf": 1}}`)'
            ]},
            logScale: {type: 'boolean|number', value: false, help: 'Set to `true` to use logarithmic scale (base 10). Set to a `number` to define the logarithm\'s base.'},
            sensitivity: {type: 'number', value: 1, help: 'Defines the fader\'s sensitivity when `snap` is `false` '},
            steps: {type: 'string|number|array', value: '', help: [
                'Restricts the widget\'s value:',
                '- `auto`: use values defined in `range`',
                '- `number`: define a number of evenly spaced steps',
                '- `array`: use arbitrary values',
            ]},
            origin: {type: 'number', value: 'auto', help: 'Defines the starting point\'s value of the fader\'s gauge'},

        }, [], {

            touchAddress: {type: 'string', value:'', help: 'OSC address for touched state messages: `/touchAddress [preArgs] 0/1`'},

        })

    }

    constructor(options) {

        super(options)

        this.gaugeGradient = null

        this.container.classList.toggle('alt', this.getProp('mode') !== 'flat')

        if (false && this.getProp('pips')) {

            this.widget.classList.add('has-pips')


            var pipTexts = {}
            for (var k in this.rangeKeys) {
                pipTexts[this.rangeKeys[k]]=this.rangeLabels[k]
            }

            var pips = html`<div class="pips"></div>`
            for (var i=0;i<=100;i++) {
                if (pipTexts[i]==undefined) continue

                var pos = this.getProp('horizontal')?'left':'bottom'

                pips.appendChild(html`
                    <div class="pip val" style="${pos}:${i}%">
                        <span>${Math.abs(pipTexts[i])>=1000?pipTexts[i]/1000+'k':pipTexts[i]}</span>
                    </div>
                `)

            }

            this.widget.appendChild(pips)

        }


    }

    draginitHandle(e) {

        super.draginitHandle(...arguments)

        this.percent = clip(this.percent,[0,100])

        if (!(e.traversing || this.getProp('snap'))  || e.ctrlKey) return

        this.percent = this.getProp('horizontal')?
            (e.offsetX - this.gaugePadding) / (this.width - this.gaugePadding * 2) * 100:
            (this.height - e.offsetY - this.gaugePadding) / (this.height - this.gaugePadding * 2) * 100

        this.setValue(this.percentToValue(this.percent), {send: true, sync: true, dragged: true})

    }

    dragHandle(e, data) {

        super.dragHandle(...arguments)

        this.percent = this.getProp('horizontal')?
            this.percent + ( e.movementX / (this.width - this.gaugePadding * 2)) * 100 / e.inertia * this.getProp('sensitivity'):
            this.percent + (-e.movementY / (this.height - this.gaugePadding * 2)) * 100  / e.inertia * this.getProp('sensitivity')

        this.setValue(this.percentToValue(this.percent), {send:true,sync:true,dragged:true})

    }

    percentToCoord(percent) {

        if (this.getProp('horizontal')) {
            return clip(percent / 100,[0,1]) * (this.width - this.gaugePadding * 2) + this.gaugePadding
        } else {
            return (this.height - this.gaugePadding) - clip(percent / 100, [0,1]) * (this.height - this.gaugePadding * 2)
        }

    }

    resizeHandle(event) {

        var ratio = CANVAS_SCALING * this.scaling

        super.resizeHandle(event)

        if (this.getProp('horizontal')){
            this.ctx.setTransform(1, 0, 0, 1, 0, 0)
            this.ctx.rotate(-Math.PI/2)
            this.ctx.translate(-this.height * ratio, 0)

            if (ratio != 1) this.ctx.scale(ratio, ratio)
        }

        if (this.getProp('gradient')) {

            var colors = this.getProp('gradient')

            if (
                (Array.isArray(colors) && colors.length > 1) ||
                (typeof colors === 'object' && Object.keys(colors).length > 1)
            ) {

                var grad = this.ctx.createLinearGradient(0,  this.getProp('horizontal') ? 0 : this.height, 0, this.getProp('horizontal') ? this.width : 0)

                try {
                    if (Array.isArray(colors)) {

                        for (var i in colors) {
                            grad.addColorStop(i / (colors.length - 1), colors[i])
                        }
                        this.gaugeGradient = grad

                    } else {

                        for (var k in colors) {
                            if (!isNaN(k)) {
                                grad.addColorStop(clip(k, [0, 1]), colors[k])
                            }
                        }
                        this.gaugeGradient = grad

                    }
                } catch(err) {
                    this.errors.gradient = err
                }

            }

        }

    }


    draw() {

        var width = this.getProp('horizontal') ? this.height : this.width,
            height = !this.getProp('horizontal') ? this.height : this.width

        var percent = this.getProp('steps') ? this.valueToPercent(this.value) : this.percent,
            d = Math.round(this.percentToCoord(percent)),
            o = Math.round(this.percentToCoord(this.valueToPercent(this.originValue))),
            m = this.getProp('horizontal') ? this.height / 2 : this.width / 2,
            dashed = this.getProp('dashed'),
            flat = this.getProp('mode') === 'flat'

        // sharp border trick
        if (width % 2 && parseInt(m) === m) m -= 0.5

        this.clear()



        this.ctx.strokeStyle = this.gaugeGradient || this.cssVars.colorFill

        if (flat) {
            this.ctx.lineWidth = Math.round(width - this.gaugePadding * 2)
        } else {
            this.ctx.lineWidth = 2 * PXSCALE
        }


        if (dashed) this.ctx.setLineDash([PXSCALE, PXSCALE])


        if (this.cssVars.alphaFillOff) {
            // gaugo off
            this.ctx.globalAlpha = this.cssVars.alphaFillOff
            this.ctx.beginPath()
            this.ctx.moveTo(m, height - this.gaugePadding)
            this.ctx.lineTo(m, this.gaugePadding)
            this.ctx.stroke()
        }


        if (this.cssVars.alphaFillOn) {
            // gaugo on
            this.ctx.globalAlpha = this.cssVars.alphaFillOn
            this.ctx.beginPath()
            this.ctx.moveTo(m, o)
            this.ctx.lineTo(m, d)
            this.ctx.stroke()
        }

        if (dashed) this.ctx.setLineDash([])

        if (flat) {

            // stroke

            this.ctx.globalAlpha = this.cssVars.alphaStroke
            this.ctx.strokeStyle = this.cssVars.colorStroke

            this.ctx.beginPath()
            this.ctx.moveTo(0, 0)
            this.ctx.lineTo(width, 0)
            this.ctx.lineTo(width, height)
            this.ctx.lineTo(0, height)
            this.ctx.closePath()
            this.ctx.lineWidth = 2 * PXSCALE
            this.ctx.stroke()


            // flat knob

            this.ctx.globalAlpha = 1
            this.ctx.fillStyle = this.cssVars.colorFill

            this.ctx.beginPath()
            this.ctx.rect(this.gaugePadding, Math.min(d, height - 3 * PXSCALE), width - this.gaugePadding * 2, PXSCALE)
            this.ctx.fill()

            this.clearRect = [0, 0, width, height]


        } else {

            this.ctx.globalAlpha = 1
            this.ctx.fillStyle = this.cssVars.colorFill

            this.ctx.beginPath()
            this.ctx.arc(m, d, 3 * PXSCALE, 0, 2 * Math.PI)
            this.ctx.fill()

            this.ctx.globalAlpha = 0.25
            this.ctx.fillStyle = this.cssVars.colorFill

            this.ctx.beginPath()
            this.ctx.arc(m, d, 10 * PXSCALE, 0, 2 * Math.PI)
            this.ctx.fill()

            this.clearRect = [m - 10 * PXSCALE, this.gaugePadding - 10 * PXSCALE, 20 * PXSCALE, height - 2 * this.gaugePadding + 20 * PXSCALE]

        }




    }

}
