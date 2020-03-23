var terminal = require('./terminal'),
    settings = require('./settings'),
    html = require('nanohtml')

require('./toolbar')
require('./context-menu')

DOM.get(document, '#osc-greeting-header')[0].appendChild(html`${window.PACKAGE.productName} <span class="version">v${window.PACKAGE.version}</span>`)

if (settings.remote.read('checkForUpdates') && navigator.onLine) {

    var request = new XMLHttpRequest()
    request.open('GET', 'https://api.github.com/repos/jean-emmanuel/open-stage-control/tags', true)

    request.onload = function() {
        if (request.status >= 200 && request.status < 400) {
            var data = JSON.parse(request.responseText)

            if (data[0].name != 'v' + window.PACKAGE.version) {
                terminal.log(`(INFO) A new version is available : <a target="_blank" href="https://github.com/jean-emmanuel/open-stage-control/releases">${data[0].name}</a>`, 'info')
            }

        }
    }

    request.send()

}
