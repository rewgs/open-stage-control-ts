var path = require('path'),
    {BrowserWindow, dialog, shell, screen} = require('electron'),
    shortcut = require('electron-localshortcut'),
    settings = require('./settings'),
    theme = require('./theme'),
    screenSize = screen.getPrimaryDisplay().size


module.exports = function(options={}) {

    var window

    window = new BrowserWindow({
        width: options.width || screenSize.width,
        height: options.height || screenSize.height,
        title: options.title || settings.read('appName'),
        icon: path.resolve(__dirname + '/../assets/logo.png'),
        backgroundColor: options.color || theme.backgroundColor,
        type: options.type,
        useContentSize: true,
        autoHideMenuBar: true,
        webPreferences: {
            nodeIntegration: !!options.node,

        },
        show: false,
    })

    window.once('ready-to-show', ()=>{
        window.show()

    })
    window.webContents.once('page-title-updated', ()=>{
        if (options.fullscreen) {
            window.webContents.sendInputEvent({keyCode: 'F11', type: 'keyDown'})
        }
    })


    window.webContents.on('will-prevent-unload', (event)=>{
        var choice = dialog.showMessageBoxSync(window, {
            type: 'question',
            buttons: ['Yes', 'No'],
            title: 'Are you sure ?',
            message: 'Unsaved data will be lost. Are you sure you want to quit?',
            defaultId: 0,
            cancelId: 1
        })
        if (choice === 0) {
            event.preventDefault()
        }
    })

    // window.webContents.on('will-navigate', (event)=>event.preventDefault())
    window.webContents.on('new-window', (event, url)=>{
        event.preventDefault()
        shell.openExternal(url)
    })

    // window.webContents.on('dom-ready', ()=>{
    //     window.webContents.executeJavaScript(`
    //         window.ELECTRON = true
    //     `)
    // })

    if (options.zoom === false) {
        window.webContents.setVisualZoomLevelLimits(1, 1)
    }


    window.on('closed', function() {
        window = null
    })

    window.setMenu(null)

    window.loadURL(options.address)

    if (options.shortcuts) {

        shortcut.register(window,'CmdOrCtrl+R',function(){
            window.reload()
        })

        shortcut.register(window,'F12',function(){
            window.toggleDevTools()
        })

    } else {
        shortcut.register(window,'CmdOrCtrl+R',function(e){
            return false
        })
    }

    return window

}
