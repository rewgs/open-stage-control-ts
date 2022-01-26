var UiWidget = require('./ui-widget'),
    Rgb = require('../widgets/pads/rgb'),
    UiModal = require('./ui-modal'),
    html = require('nanohtml'),
    chroma = require('chroma-js'),
    resize = require('../events/resize'),
    locales = require('../locales')


class ColorPicker extends UiWidget {

    constructor() {

        super({})

        this.name = ''
        this.value = ''

        this.rgb = new Rgb({props: {
            ...Rgb.defaults()._props(),
            type: 'rgb',
            width: 'auto',
            height: 'auto',
            alphaStroke: 0,
            snap: true,
            alpha: true
        }, parent: this})
        this.rgb.container.classList.add('not-editable')

        this.container = html`
            <div class="color-picker">
                ${this.rgb.container}
                <div class="actions">
                    <div class="btn color-confirm">${locales('inspector_color_confirm')}</div>
                    <div class="btn color-cancel">${locales('inspector_color_cancel')}</div>
                </div>
             </div>
        `

        DOM.get(this.container, '.color-confirm')[0].addEventListener('click', this.confirm.bind(this))
        DOM.get(this.container, '.color-cancel')[0].addEventListener('click', this.cancel.bind(this))

        this.rgb.on('change', (e)=>{
            e.stopPropagation = true
                this.value = chroma(this.rgb.value).hex()
                this.trigger('change', {preventHistory: true})
        })
        this.opened = 0

        this.cancelValue = '#00000000'

        this.escKeyHandler = ((e)=>{
            if (e.keyCode==27) this.cancel()
        }).bind(this)

        this.enterKeyHandler = ((e)=>{
            if (e.keyCode == 13) this.confirm()
        }).bind(this)

    }

    open() {

        this.parentNode.appendChild(this.container)
        resize.check(this.rgb.container)
        this.opened = 1

        document.addEventListener('keydown', this.escKeyHandler)
        document.addEventListener('keydown', this.enterKeyHandler)
    }

    close() {

        if (this.parentNode.contains(this.container)) {
            this.parentNode.removeChild(this.container)
        }
        this.setName()
        this.opened = 0

        document.removeEventListener('keydown', this.escKeyHandler)
        document.removeEventListener('keydown', this.enterKeyHandler)
    }

    confirm() {

        this.value = chroma(this.rgb.getValue(true)).css('rgba')
        this.trigger('change')
        this.close()

    }

    cancel() {

        if (this.value !== this.cancelValue) {
            this.value = this.cancelValue
            this.trigger('change', {preventHistory: true})
        }
        this.close()

    }

    isVisible() {

        return true

    }

    setName(n = '') {

        this.name = n

    }

    setValue(v) {

        if (v === 'transparent') v = '#00000000'

        this.rgb.setValue(chroma(v).rgba())

    }

    setCancelValue(v) {

        this.cancelValue = v

    }

    setParent(node) {

        if (this.opened && node !== this.parentNode) this.close()
        this.parentNode = node

    }

}

module.exports = ColorPicker
