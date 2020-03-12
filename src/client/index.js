require('./stacktrace')

document.addEventListener('DOMContentLoaded', function(event) {

    require('./globals')

    var locales = require('./locales'),
        html = require('nanohtml')

    DOM.get(document, '#osc-greeting-header')[0].appendChild(html`${PACKAGE.productName} <span class="version">v${PACKAGE.version}</span>`)

    DOM.init()

    var uiLoading = require('./ui/ui-loading')
    uiLoading(locales('loading_server'))

    setTimeout(()=>{

        var ipc = require('./ipc/')

        ipc.init()

        require('./ui/init')

        document.title = TITLE

        ipc.send('ready', {backupId: ENV.backupId})


    }, 100)

})
