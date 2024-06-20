var Canvas = require('../common/canvas'),
    html = require('nanohtml')

class Pad extends Canvas {

    constructor(options) {

        super({...options, value: [], html: html`
            <inner>
                <canvas></canvas>
            </inner>
        `})

    }

    cacheCanvasStyle(style) {

        style = style || window.getComputedStyle(this.canvas)

        super.cacheCanvasStyle(style)

        this.padPadding = (this.cssVars.padding + this.cssVars.lineWidth) + 2 * PXSCALE

    }

    onPropChanged(propName, options, oldPropValue) {

        var ret = super.onPropChanged(...arguments)

        switch (propName) {
            case 'pointSize':
                this.setCssVariables()
                return
        }

        return ret


    }

}

Pad.cssVariables = Pad.prototype.constructor.cssVariables.concat(
    {js: 'pointSize', css: '--point-size', toCss: x=>parseFloat(x) + 'rem', toJs: x=>parseFloat(x) * PXSCALE},
)

Pad.dynamicProps = Pad.prototype.constructor.dynamicProps.filter(n => n !== 'decimals').concat([
    'spring',
    'axisLock',
    'pointSize'
])

module.exports = Pad
