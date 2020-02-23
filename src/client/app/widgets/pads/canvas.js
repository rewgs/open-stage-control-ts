var Canvas = require('../common/canvas'),
    html = require('nanohtml')

class CanvasWidget extends Canvas {
    static description() {

        return 'KANVA !'

    }

    static defaults() {

        return super.defaults({

            _canvas:'canvas',


            valueLength: {type: 'number', value: 1, help: ' '},
            multiTouch:  {type: 'boolean', value: false, help: ' '},
            sensitivity: {type: 'number', value: 1, help: ' '},
            snap: {type: 'boolean', value: true, help: ' '},

            coordsToValue: {type: 'script', value: '', help: ' '},
            valueToCoords: {type: 'script', value: '', help: ' '},

            draw: {type: 'script', value: '', help: ' '},
            autoClear: {type: 'boolean', value: true, help: ' '},

        }, [], {})

    }

    constructor(options) {

        super({...options, html: html`
            <div class="canvas">
                <canvas></canvas>
            </div>
        `})

        this.nextTouch = 0
        this.value = 1
        this.touchMap = {}
        this.touchCoords = []
        for (var i = 0; i < this.getProp('valueLength'); i++) {
            this.touchCoords.push([0,0])
        }

        this.localContext = {}

        this.on('draginit',(e)=>{

            if (this.touchMap[e.pointerId] !== undefined) return
            this.touchMap[e.pointerId] = this.nextTouch++

            if (this.getProp('snap')) this.touchCoords[this.touchMap[e.pointerId]] = [e.offsetX, e.offsetY]

            this.touchCallback(e)

        }, {element: this.widget, multitouch: this.getProp('multiTouch')})

        this.on('drag',(e)=>{

            if (this.touchMap[e.pointerId] === undefined) return
            console.log(this.touchMap[e.pointerId])
            this.touchCoords[this.touchMap[e.pointerId]][0] += e.movementX / e.inertia * this.getProp('sensitivity')
            this.touchCoords[this.touchMap[e.pointerId]][1] += e.movementY / e.inertia * this.getProp('sensitivity')

            this.touchCallback(e)

        }, {element: this.widget, multitouch: this.getProp('multiTouch')})

        this.on('dragend',(e)=>{

            if (this.touchMap[e.pointerId] === undefined) return
            delete this.touchMap[e.pointerId]
            this.nextTouch--

            this.touchCallback(e)

        }, {element: this.widget, multitouch: this.getProp('multiTouch')})



    }

    touchCallback() {

        var value = this.resolveProp('coordsToValue', undefined, false, false, false, {
            coords: this.touchCoords,
            value: this.value,
            width: this.width,
            height: this.height,
            local: this.localContext
        })

        if (value !== undefined) this.setValue(value, {send: true, sync: true, dragged: true})

    }

    setValue(v, options={}) {

        if (v === null || v === undefined || ((v.length || 1) !== this.getProp('valueLength'))) return

        this.value = v

        if (!options.dragged) {
            var coords = this.resolveProp('valueToCoords', undefined, false, false, false, {
                coords: this.touchCoords,
                value: this.value,
                width: this.width,
                height: this.height,
                local: this.localContext
            }) || this.touchCoords

            this.touchCoords = coords === undefined ? this.touchCoords : coords
        }

        this.batchDraw()

        if (options.send) this.sendValue()
        if (options.sync) this.changed(options)

    }


    draw() {

        if (this.getProp('autoClear')) this.clear()

        this.resolveProp('draw', undefined, false, false, false, {
            ctx: this.ctx,
            coords: this.touchCoords,
            value: this.value,
            colors: this.colors,
            width: this.width,
            height: this.height,
        })


        if (this.getProp('autoClear')) this.clearRect = [0, 0, this.width, this.height]

    }


}

CanvasWidget.parsersContexts.coordsToValue = CanvasWidget.parsersContexts.valueToCoords = {
    coords: [[]],
    value: [],
    width: 100,
    height: 100,
    local: {}
}


CanvasWidget.parsersContexts.draw = {
    value: [],
    coords: [[]],
    colors: {},
    width: 100,
    height: 100,
    ctx: ()=>{}
}


CanvasWidget.dynamicProps = CanvasWidget.prototype.constructor.dynamicProps.concat([
    'draw',
    'sensitivity'
])

module.exports = CanvasWidget
