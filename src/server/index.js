require('source-map-support').install({handleUncaughtExceptions: false})

var dev = process.argv[0].includes('node_modules'),
    settings = require('./settings'),
    docsServer,
    app = null,
    launcher = null,
    clientWindows = [],
    serverProcess = null,
    node = false

function openDocs() {

    if (!docsServer) {
        var DocsServer = require('./docs-server')
        docsServer = new DocsServer()
    }

    docsServer.open()

}

function nodeMode() {

    if (!settings.read('no-gui') && !process.env.OSC_SERVER_PROCESS) {
        settings.write('no-gui', true, true)
        console.warn('(INFO) Headless mode (--no-gui) enabled automatically (running with node)')
    }

    process.on('uncaughtException', (err)=>{
        console.error('(ERROR) A JavaScript error occurred in the main process:')
        console.error(err.stack)
    })

    node = true

}
if (!process.versions.electron || process.env.ELECTRON_RUN_AS_NODE) {

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


function openClient() {

    var app = require('./electron-app')
    var address = settings.appAddresses()[0]

    var launch = ()=>{
        var win = require('./electron-window')({
            address:address,
            shortcuts:true,
            fullscreen: settings.read('fullscreen'),
            noFocus: settings.read('client-options') && settings.read('client-options').some(x=>x.match(/nofocus=1/i)),
            id: 'client'
        })
        win.on('error', ()=>{
            console.log('ERR')
        })
        clientWindows.push(win)
    }
    if (app.isReady()) {
        launch()
    } else {
        app.on('ready',function(){
            launch()
        })
    }

}

function showQRCode(){

    var QRCode = require('qrcode')

    if (launcher) {
        launcher.webContents.send('server-started')
        QRCode.toString(settings.appAddresses().pop(),{type:'svg', small: true, margin: 1}, (err, qr)=>{
            launcher.webContents.send('stdout', '<div class="qrcode">' + qr + '</div>')
        })
    } else {
        QRCode.toString(settings.appAddresses().pop(),{type:'terminal', small: true}, (err, qr)=>{
            console.log('\n' + qr.replace(/^/gm, '    '))
        })
    }
}

function startServerProcess() {

    var args = [ '--no-gui']

    for (var k in settings.read('options')) {
        args.push('--' + k)
        var val = settings.read(k)
        if (typeof val === 'object') {
            args = args.concat(val)
        } else if (typeof val !== 'boolean') {
            args.push(val)
        }
    }

    var {fork} = require('child_process')

    serverProcess = fork(app.getAppPath(), args, {stdio: 'pipe', env: {...process.env, OSC_SERVER_PROCESS: 1}})

    var cb = (data)=>{
        if (data.indexOf('(INFO) Server started') > -1) {
            if (!settings.read('no-gui')) openClient()
            setTimeout(()=>{
                showQRCode()
            })
            serverProcess.stdout.off('data', cb)
        }
    }
    serverProcess.stdout.on('data', cb)

    serverProcess.stdout.on('data', (data) => {
        console.log(String(data).trim())
    })

    serverProcess.stderr.on('data', (data) => {
        var str = String(data).trim()
        if (str.includes('--debug')) return
        console.error(str)
    })



    serverProcess.on('message', (data) => {
        var [command, args] = data
        if (command === 'settings.write') {
            settings.write(args[0], args[1], false)
        }
    })

    serverProcess.on('close', (code) => {
        console.log('(INFO) Server stopped')
        serverProcess = null
        if (global.defaultClient) global.defaultClient.close()
    })

    if (launcher) {
        serverProcess.on('close', (code) => {
            if (!launcher.isDestroyed()) launcher.webContents.send('server-stopped')
        })
        launcher.webContents.send('server-starting')
    }

}

function stopServerProcess() {

    if (settings.read('no-gui')) {
        if (serverProcess) serverProcess.kill()
        return
    }

    var toClose = [...clientWindows].filter(w=>w && !w.isDestroyed()),
        closed = 0

    if (toClose.length === 0) serverProcess.kill()

    for (var w of toClose) {
        w.on('closed', ()=>{
            closed++
            if (closed === toClose.length) {
                clientWindows = []
                if (serverProcess) serverProcess.kill()
            }
        })
        w.close()
    }

}

function startLauncher() {

    global.launcherSharedGlobals = {
        settings: settings,
        openDocs: openDocs,
        midilist: require('./midi').list
    }
    var path = require('path'),
        address = 'file://' + path.resolve(__dirname + '/../launcher/' + 'index.html'),
        {ipcMain} = require('electron')

    require('@electron/remote/main').initialize()

    app.on('ready',function(){
        launcher = require('./electron-window')({address:address, shortcuts:dev, width:680, height:(40 + 200 + 20 + 24 * Object.keys(settings.options).filter(x=>settings.options[x].launcher !== false).length / 2), node:true, color:'#151a24', id: 'launcher'})
        require('@electron/remote/main').enable(launcher.webContents)
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

        startServerProcess()

    })

    ipcMain.on('stop',function(e, options){

        stopServerProcess()

    })

    ipcMain.on('openClient',function(e, options){

        openClient()

    })

}


if (settings.read('docs')) {

    openDocs()

} else if (node || (settings.cli && settings.read('no-gui'))) {

    // node mode: minimal server startup

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

    if (!process.env.OSC_SERVER_PROCESS) server.eventEmitter.on('serverStarted', ()=>{
        showQRCode()
    })

} else {

    // normal mode:
    // - electron process: launcher and/or built-in client(s)
    // - node process: server (node mode in a forked process)

    app = require('./electron-app')
    process.on('exit',()=>{
        if (serverProcess) serverProcess.kill()
    })


    if (settings.cli) {

        startServerProcess()

    } else {

        startLauncher()

    }

}
