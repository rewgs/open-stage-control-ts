var {remote, ipcRenderer} = eval('require(\'electron\')'),
    {Menu, MenuItem} = remote.require('electron'),
    menu = new Menu(),
    terminal = require('./terminal'),
    settings = require('./settings'),
    midilist = remote.getGlobal('midilist'),
    openDocs = remote.getGlobal('openDocs'),
    serverStarted = false,
    serverStart = ()=>{
        if (serverStarted) return
        ipcRenderer.send('start')
    },
    serverStop = ()=>{
        if (!serverStarted) return
        ipcRenderer.send('stop')
    }

var start = new MenuItem({
    label: 'Start',
    click: serverStart
})
var stop = new MenuItem({
    label: 'Stop',
    click: serverStop
})
var newWindow = new MenuItem({
    label: 'New window',
    visible: false,
    click: ()=>{
        ipcRenderer.send('openClient')
    }
})
menu.append(start)
menu.append(stop)
menu.append(newWindow)
menu.append(new MenuItem({
    type: 'separator'
}))
menu.append(new MenuItem({
    label: 'Load',
    click: ()=>{
        settings.load()
    }
}))
menu.append(new MenuItem({
    label: 'Save',
    click: ()=>{
        settings.save()
    }
}))
menu.append(new MenuItem({
    label: 'Save as...',
    click: ()=>{
        settings.saveAs()
    }
}))
menu.append(new MenuItem({
    type: 'separator'
}))
menu.append(new MenuItem({
    label: 'List MIDI Devices',
    click: ()=>{
        midilist()
    }
}))
menu.append(new MenuItem({type: 'submenu' , label: 'Console', submenu: [
    new MenuItem({
        label: 'Clear',
        click: ()=>{
            terminal.clear()
        }
    }),
    new MenuItem({
        label: 'Autoscroll',
        type: 'checkbox',
        checked: true,
        click: function(e){
            terminal.autoSroll = e.checked
        }
    }),
    new MenuItem({
        label: 'Check for updates at startup',
        type: 'checkbox',
        checked: settings.remote.read('checkForUpdates'),
        click: (e)=>{
            settings.remote.write('checkForUpdates', e.checked)
        }
    })
]}))
menu.append(new MenuItem({
    type: 'separator'
}))
// menu.append(new MenuItem({
//     label: 'Restart',
//     click: ()=>{
//         app.relaunch()
//         app.exit(0)
//     }
// }))
menu.append(new MenuItem({
    label: 'Documentation',
    click: ()=>{
        openDocs()
    }
}))
menu.append(new MenuItem({
    role: 'Quit'
}))

class Toolbar {

    constructor() {

        this.container = DOM.get('osc-toolbar#menu')[0]
        this.startButton = DOM.get('osc-toolbar#start')[0]

        this.container.addEventListener('click', (e)=>{
            this.container.classList.add('on')
            start.visible = !serverStarted
            stop.visible = !!serverStarted
            newWindow.visible = !!serverStarted
            menu.popup({window: remote.getCurrentWindow(), x: parseInt(PXSCALE), y: parseInt(40 * PXSCALE)})
        })

        menu.on('menu-will-close', ()=>{
            this.container.classList.remove('on')
        })

        this.startButton.addEventListener('click', (e)=>{
            if (!serverStarted) serverStart()
            else serverStop()
        })

        ipcRenderer.on('server-started', ()=>{
            serverStarted = true
            this.startButton.classList.add('started')
        })
        ipcRenderer.on('server-stopped', ()=>{
            serverStarted = false
            this.startButton.classList.remove('started')
        })

    }

}

module.exports = new Toolbar()
