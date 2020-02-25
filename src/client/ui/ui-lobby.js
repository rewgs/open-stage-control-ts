var html = require('nanohtml'),
    UiModal = require('./ui-modal')

class UiLobby {

    constructor() {

        this.state = 0

        this.container = html`
            <div class="lobby">
                <div class="list"></div>
                <div class="footer"></div>
            </div>
        `

        this.list = DOM.get(this.container, '.list')[0]
        this.footer = DOM.get(this.container, '.footer')[0]

        this.modal = new UiModal({
            content: this.container,
            closable: false,
            title: `${PACKAGE.productName} v${PACKAGE.version}`
        })

    }

    open() {

        this.modal.open()

    }

    close() {

        this.modal.close()

    }

}

var uiLobby = new UiLobby()

module.exports = uiLobby
