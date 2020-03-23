var Canvas = require('../common/canvas'),
    html = require('nanohtml')

class CanvasWidget extends Canvas {

    static description() {

        return 'KANVA !'

    }

    static defaults() {

        return super.defaults({

            _canvas:'canvas',


            onCreate: {type: 'string', value: '', help: ' '},
            onTouch: {type: 'string', value: '', help: ' '},

        }, [], {})

    }

    constructor(options) {

        super({...options, html: html`
            <div class="canvas">
                <canvas></canvas>
            </div>
        `})


        this.on('draginit',(e)=>{


        }, {element: this.widget, multitouch: true})

        this.on('drag',(e)=>{


        }, {element: this.widget, multitouch: true})

        this.on('dragend',(e)=>{


        }, {element: this.widget, multitouch: true})


    }

    setValue(v, options={}) {

        if (v === null || v === undefined || ((v.length || 1) !== this.getProp('valueLength'))) return

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

CanvasWidget.dynamicProps = CanvasWidget.prototype.constructor.dynamicProps.concat([
])

module.exports = CanvasWidget
