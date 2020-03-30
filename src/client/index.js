document.addEventListener('DOMContentLoaded', function(event) {

    require('./globals')
    require('./stacktrace')

    var locales = require('./locales'),
        html = require('nanohtml')

    DOM.get(document, '#osc-greeting-header')[0].appendChild(html`${PACKAGE.productName} <span class="version">v${PACKAGE.version}</span>`)

    DOM.init()

    var uiLoading = require('./ui/ui-loading')
    uiLoading(locales('loading_server'))

    setTimeout(()=>{

        var ipc = require('./ipc/'),
            backup = require('./backup')

        ipc.init()


        require('./ui/init')

        document.title = TITLE

        ipc.send('open', {hotReload: backup.exists})

        window.onunload = ()=>{
            ipc.send('close')
        }

        backup.load()


    }, 100)

})
