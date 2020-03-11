var UiWidget = require('./ui-widget')

class UiSidePanel extends UiWidget {

    constructor(options) {

        super(options)

        if (options.label) DOM.get(this.container, 'osc-panel-header')[0].textContent = options.label

        this.vertical = this.container.classList.contains('bottom') || this.container.classList.contains('top')
        this.resizeDirection = this.container.classList.contains('left') || this.container.classList.contains('top') ? 1 : -1
        this.resizeHandle = DOM.get(this.container, '.resize-handle')[0]
        this.toggleButton = DOM.get(this.container, '.toggle-button')[0]
        this.content = DOM.get(this.container, 'osc-panel-content')[0]

        this.minWidth = options.size || 250
        this.width = options.size || 250

        this.disabled = false
        this.minimized = false
        this.init = false


        this.on('draginit', (event)=>{

            this.width = parseInt(this.container[this.vertical ? 'offsetHeight' : 'offsetWidth']) / PXSCALE

        }, {element: this.resizeHandle})

        this.on('drag', (event)=>{

            this.width += this.resizeDirection * event[this.vertical ? 'movementY' : 'movementX'] / PXSCALE
            this.container.style[this.vertical ? 'height' : 'width'] = this.width + 'rem'

        }, {element: this.resizeHandle})

        this.on('dragend', (event)=>{

            this.width = parseInt(this.container[this.vertical ? 'offsetHeight' : 'offsetWidth']) / PXSCALE
            DOM.dispatchEvent(window, 'resize')

        }, {element: this.resizeHandle})

        this.toggleButton.addEventListener('click', ()=>{

            if (this.disabled) return

            if (this.minimized) this.restore()
            else this.minimize()

        })

        this.disable()

    }

    enable() {

        this.container.classList.remove('disabled')
        this.disabled = false

        if (!this.minimized) this.open()

    }

    disable() {

        this.container.classList.add('disabled')
        this.disabled = true

        this.close()

    }

    minimize() {

        if (this.minimized) return

        this.minimized = true

        if (!this.disabled) this.close()


    }

    restore() {

        if (!this.minimized) return

        this.minimized = false

        if (!this.disabled) this.open()


    }

    open() {

        this.container.style[this.vertical ? 'height' : 'width'] = this.width + 'rem'
        this.container.style[this.vertical ? 'minHeight' : 'minWidth'] = this.minWidth + 'rem'
        this.container.classList.remove('minimized')

        DOM.dispatchEvent(window, 'resize')

    }

    close() {

        this.container.style[this.vertical ? 'height' : 'width'] = 0
        this.container.style[this.vertical ? 'minHeight' : 'minWidth'] = 0
        this.container.classList.add('minimized')

        DOM.dispatchEvent(window, 'resize')

    }

}



module.exports = UiSidePanel
