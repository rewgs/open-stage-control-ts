require('source-map-support').install({handleUncaughtExceptions: false})

var dev = process.argv[0].includes('node_modules'),
    settings = require('./settings')

var serverStarted

function nodeMode() {

    console.warn('(INFO) Running with node')

    if (!settings.read('no-gui')) {
        settings.cli = true
        settings.write('no-gui', true, true)
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
    var address = settings.appAddresses()[0]

    var launch = ()=>{
        var win = require('./electron-window')({address:address, shortcuts:true, fullscreen: settings.read('fullscreen')})
        win.on('error', ()=>{
            console.log('ERR')
        })
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
    if (!settings.read('no-gui')) openClient()


} else {

    var app = require('./electron-app'),
        path = require('path'),
        address = 'file://' + path.resolve(__dirname + '/../launcher/' + 'index.html'),
        {ipcMain} = require('electron'),
        {spawn} = require('child_process'),
        launcher

    process.on('exit',()=>{
        if (global.serverProcess) global.serverProcess.kill()
    })

    app.on('ready',function(){
        global.settings = settings
        global.midilist = require('./midi').list
        global.serverProcess = null
        global.clientWindows = []
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

        var args = ['--no-gui']
        for (var k in settings.read('options')) {
            args.push('--' + k)
            var val = settings.read(k)
            if (typeof val === 'object') {
                args = args.concat(val)
            } else if (typeof val !== 'boolean') {
                args.push(val)
            }
        }

        global.serverProcess = spawn(process.argv[0], process.argv.slice(1).concat(args), {stdio: 'pipe'/*, env: {"ELECTRON_RUN_AS_NODE":"1"}*/})
        launcher.webContents.send('server-started')

        if (!settings.read('no-gui')) {
            global.serverProcess.stdout.once('data', (data) => {
                global.clientWindows.push(openClient())
            })
        }

        global.serverProcess.stdout.on('data', (data) => {
            console.log(String(data).trim())
        })

        global.serverProcess.stderr.on('data', (data) => {
            console.error(String(data).trim())
        })

        global.serverProcess.on('close', (code) => {
            console.log('(INFO) Server stopped')
            global.serverProcess = null
            if (global.defaultClient) global.defaultClient.close()
            if (!launcher.isDestroyed()) launcher.webContents.send('server-stopped')
        })

    })

    ipcMain.on('stop',function(e, options){

        if (global.serverProcess) global.serverProcess.kill()
        for (var w of [...global.clientWindows]) {
            if (w && !w.isDestroyed()) w.close()
        }
        global.clientWindows = []

    })

    ipcMain.on('openClient',function(e, options){

        global.clientWindows.push(openClient())

    })


}
