var {clip} = require('../utils'),
    Widget = require('../common/widget'),
    Plot = require('./plot'),
    StaticProperties = require('../mixins/static_properties')


module.exports = class Visualizer extends StaticProperties(Plot, {rangeX: {min: '', max: ''}, dots: false, smooth: false}) {

    static description() {

        return 'Display its value over time.'

    }

    static defaults() {

        return Widget.defaults({

            _visualizer:'visualizer',

            duration: {type: 'number', value: 1, help: 'Defines visualization duration in seconds'},
            rangeY: {type: 'object', value: {min:0,max:1}, help: 'Defines the min and max values for the y axis'},
            origin: {type: 'number', value: 'auto', help: 'Defines the y axis origin. Set to `false` to disable it'},
            logScaleY: {type: 'boolean|number', value: false, help: 'Set to `true` to use logarithmic scale for the y axis (base 10). Set to a `number` to define the logarithm\'s base.'},
            pips:{type: 'boolean', value: true, help: 'Set to `false` to hide the scale'},

        }, ['precision', 'bypass'], {})

    }

    constructor(options) {

        super(options)

        this.fps = CANVAS_FRAMERATE
        this.length = Math.round(clip(this.fps * this.getProp('duration'), [8, 4096]))
        this.value = new Array(this.length).fill(this.rangeY.min)
        this.cancel = false
        this.looping = false
        this.clock = 0
        this.lastUpdate = 0
        this.watchDuration = 1000 * this.getProp('duration')
        this.ticks = 0

    }

    startLoop() {

        this.clock = Date.now()
        if (!this.looping) {
            this.lastUpdate = Date.now()
            this.looping = true
            this.ticks = 0
            this.loop()
        }
    }

    loop() {

        var t = Date.now()

        if (t -this.clock >= this.watchDuration) {
            this.looping = false
        }

        this.ticks += (t - this.lastUpdate) / (1000/this.fps)

        if (Math.floor(this.ticks) > 0) {
            this.shiftData(Math.floor(this.ticks))
            this.ticks -= Math.floor(this.ticks)
            this.batchDraw()
        }

        this.lastUpdate = t

        if (!this.looping) return

        setTimeout(()=>{
            this.loop()
        }, (1000/this.fps))

    }

    shiftData(n) {

        for (var i=0; i<n; i++) {
            this.value.push(this.value[this.length - 1])
            this.value.splice(0,1)
        }

    }

    getValue() {

        return this.value[this.length - 1]

    }

    setValue(v, options={}) {

        if (Array.isArray(v) && v.length == this.length) {

            this.value = v
            this.startLoop()

            if (options.sync) this.changed(options)


        } else if (typeof(v) == 'number'){

            this.value[this.length - 1] = v
            this.startLoop()

            if (options.sync) this.changed(options)


        }

    }


}
