var Widget = require('../common/widget'),
    morph = require('nanomorph'),
    html = require('nanohtml'),
    StaticProperties = require('../mixins/static_properties')


class Svg extends StaticProperties(Widget, {bypass: true}) {

    static description() {

        return 'Svg parser.'

    }

    static defaults() {

        return super.defaults({

            _svg:'svg',

            svg: {type: 'string', value: '', help: [
                'Svg xml definition:',
                '- will be wrapped in a `< svg />` element',
                '- `<path>` commands support a special percent notation (`%x` and `%y`)'
            ]},

        }, ['decimals', 'bypass'], {})

    }

    constructor(options) {

        super({...options, html: html`
            <inner>
                <svg class="frame"></svg>
            </inner>
        `})

        this.frame = DOM.get(this.widget, '.frame')[0]

        this.height = undefined
        this.width = undefined

        this.on('resize', this.resizeHandleProxy.bind(this), {element: this.widget})

        if (!this.getProp('border')) this.container.classList.add('noborder')

    }

    updateSvg(){

        if (!this.width || !this.height) return

        var svg = this.getProp('svg')

        svg = svg.replace(/<\/svg>/gi, 'x')
        svg = svg.replace(/([0-9.]+%x)/gi, m=>(parseFloat(m) * this.width / 100).toFixed(2))
        svg = svg.replace(/([0-9.]+%y)/gi, m=>(parseFloat(m) * this.height / 100).toFixed(2))


        var node = this.frame.cloneNode(false)

        node.innerHTML = svg

        morph(this.frame, node)

    }

    resizeHandleProxy() {

        this.resizeHandle(...arguments)

    }

    resizeHandle(event){

        var {width, height} = event

        this.height = height
        this.width = width

        this.updateSvg()

    }


    onPropChanged(propName, options, oldPropValue) {

        if (super.onPropChanged(...arguments)) return true

        switch (propName) {

            case 'svg':
                this.updateSvg()
                return

        }

    }


}

Svg.dynamicProps = Svg.prototype.constructor.dynamicProps.concat(
    'svg'
)

module.exports = Svg
