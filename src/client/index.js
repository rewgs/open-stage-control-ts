require('./stacktrace')
require('./globals')

var uiLoading = require('./ui/ui-loading'),
    locales = require('./locales')

document.addEventListener('DOMContentLoaded', function(event) {

    DOM.init()

    LOADING = uiLoading(locales('loading_server'))

    setTimeout(()=>{

        var ipc = require('./ipc/')

        ipc.init()

        require('./ui/init')

        ipc.send('ready', {backupId: ARGV.backupId})


    }, 100)

})
