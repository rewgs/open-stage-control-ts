require('./stacktrace')
require('./globals')

var {loading} = require('./ui/utils'),
    locales = require('./locales')

document.addEventListener('DOMContentLoaded', function(event) {

    DOM.init()

    LOADING = loading(locales('loading_server'))

    setTimeout(()=>{

        var ipc = require('./ipc/')

        ipc.init()

        require('./ui/init')

        ipc.send('ready', {backupId: ARGV.backupId})


    }, 100)

})
