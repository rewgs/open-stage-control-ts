var UiSidePanel = require('../client/ui/ui-sidepanel'),
    {ipcRenderer} = eval('require(\'electron\')'),
    ansiHTML = require('ansi-html'),
    html = require('nanohtml')

class Terminal extends UiSidePanel {

    constructor(options) {

        super(options)

        this.autoSroll = true
        this.length = 0
        this.maxLength = 500

        this.enable()

        ipcRenderer.on('stdout', (e, msg)=>{
            this.log(ansiHTML(msg), 'log')
        })

        ipcRenderer.on('stderr', (e, msg)=>{
            this.log(ansiHTML(msg), 'error')
        })

    }

    log(message, iclass = '') {

        var node = html`<div class="${iclass}"></div>`
        node.innerHTML = message

        this.content.appendChild(node)

        if (++this.length > this.maxLength) this.purge()

        if (this.autoSroll) {
            node.scrollIntoView()
        }

    }

    purge() {

        var children = [...this.content.children]
        for (var i = 0; i < this.maxLength / 2; i++) {
            this.content.removeChild(children[i])
        }
        this.length = this.maxLength / 2 + 1

    }

    clear() {

        this.content.innerHTML = ''
        this.length = 0

    }

}

module.exports = new Terminal({selector: 'osc-panel-container.bottom', size: 200})
