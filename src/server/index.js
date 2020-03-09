require('source-map-support').install({handleUncaughtExceptions: false})

var dev = process.argv[0].includes('node_modules'),
    settings = require('./settings')

var serverStarted

function nodeMode() {

    console.warn('Running with node')

    if (!settings.read('noGui')) {
        settings.cli = true
        settings.write('noGui', true, true)
        console.warn('(INFO) Headless mode (--no-gui) enabled automatically')
    }

    process.on('uncaughtException', (err)=>{
        console.error('(ERROR) A JavaScript error occurred in the main process:')
        console.error(err.stack)
    })

}

if (process.title === 'node' || process.title === 'node.exe') {

    nodeMode()

} else {

    try {

        require('electron').dialog.showErrorBox = (title, err)=>{
            console.error(title + ': ' + err)
        }

    } catch(e) {

        nodeMode()

    }

}

function start() {

    if (!serverStarted) {

        var server = require('./server'),
            osc = require('./osc'),
            callbacks = require('./callbacks'),
            zeroconf = require('./zeroconf')

        server.bindCallbacks(callbacks)

        serverStarted = true
        process.on('exit',()=>{
            if (osc.midi) osc.midi.stop()
            zeroconf.unpublishAll()
        })

    }

}

function openClient() {

    var app = require('./electron-app')
    var address = settings.read('appAddresses')[0]
    address += settings.read('urlOptions')

    var launch = ()=>{
        var win = require('./electron-window')({address:address, shortcuts:true, zoom:false, fullscreen: settings.read('fullScreen')})
        return win
    }
    if (app.isReady()) {
        return launch()
    } else {
        app.on('ready',function(){
            launch()
        })
    }

}


if (settings.cli) {

    start()
    if (!settings.read('noGui')) openClient()


} else {

    var app = require('./electron-app'),
        path = require('path'),
        address = 'file://' + path.resolve(__dirname + '/../launcher/' + 'index.html'),
        {ipcMain} = require('electron'),
        launcher

    app.on('ready',function(){
        global.settings = settings
        global.midilist = require('./midi').list
        launcher = require('./electron-window')({address:address, shortcuts:dev, width:680, height:(40 + 200 + 20 + 24 * Object.keys(settings.options).filter(x=>settings.options[x].launcher !== false).length / 2), node:true, color:'#151a24'})
        launcher.on('close', ()=>{
            process.stdout.write = stdoutWrite
            process.stderr.write = stderrWrite
            if (process.log) process.log = processLog
        })
    })

    let processLog = process.log,
        stdoutWrite = process.stdout.write,
        stderrWrite = process.stderr.write

    if (process.log) {
        process.log = function(string, encoding, fd) {
            processLog.apply(process, arguments)
            launcher.webContents.send('stdout', string)
        }
    }

    process.stdout.write = function(string, encoding, fd) {
        stdoutWrite.apply(process.stdout, arguments)
        launcher.webContents.send('stdout', string)
    }

    process.stderr.write = function(string, encoding, fd) {
        stderrWrite.apply(process.stderr, arguments)
        launcher.webContents.send('stderr', string)
    }

    ipcMain.on('start',function(e, options){

        start()
        if (!settings.read('noGui')) openClient()

    })


    ipcMain.on('openClient',function(e, options){

        openClient()

    })


}
