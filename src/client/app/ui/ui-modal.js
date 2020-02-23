var UiWidget = require('./ui-widget'),
    html = require('nanohtml'),
    raw = require('nanohtml/raw'),
    {iconify} = require('../ui/utils')


class UiModalWindow {

    constructor(options) {

        this.container = html`
            <osc-modal-window class="${options.class || ''}">
                <inner>
                    ${options.content}
                </inner>
            </osc-modal-window>
        `

        if (options.label) {
            this.container.appendChild(html`<label>${raw(iconify(options.label))}</label>`)
        }

        this.opened = false
    }

    open(z) {

        this.opened = true
        this.container.classList.add('on')
        this.container.style.zIndex = z

    }

    close() {

        this.opened = false
        this.container.classList.remove('on')

    }

}

class UiModal extends UiWidget {

    constructor(options) {

        super(options)

        this.modals = {}
        this.openedModals = []

    }

    create(id, options) {

        if (this.modals[id]) this.destroy(id)

        this.modals[id] = new UiModalWindow(options)
        this.container.appendChild(this.modals[id].container)


    }

    destroy(id) {

        if (!this.modals[id]) return

        this.close(id)
        this.container.removeChild(this.modals[id].container)
        delete this.modals[id]
    }

    open(id) {

        if (!this.modals[id]) return
        if (this.openedModals.includes(id)) this.close(id)

        this.openedModals.push(id)

        this.modals[id].open(this.openedModals.length)

    }

    close(id) {

        if (!this.modals[id] || !this.openedModals.includes(id)) return

        this.openedModals.splice(this.openedModals.indexOf(id), 1)
        this.modals[id].close()

    }



}

module.exports = UiModal
