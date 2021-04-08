var {remote, ipcRenderer} = require('electron'),
    {Menu, MenuItem} = remote.require('electron'),
    menu = new Menu(),
    terminal = require('./terminal'),
    settings = require('./settings'),
    keyboardJS = require('keyboardjs/dist/keyboard.min.js'),
    {midilist, openDocs} = remote.getGlobal('launcherSharedGlobals'),
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
    click: serverStart,
    accelerator: 'f5'
})
var stop = new MenuItem({
    label: 'Stop',
    click: serverStop,
    accelerator: 'f6'
})
var newWindow = new MenuItem({
    label: 'New window',
    visible: false,
    click: ()=>{
        ipcRenderer.send('openClient')
    },
    accelerator: 'CmdOrCtrl + n'
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
    },
    accelerator: 'CmdOrCtrl + o'
}))
menu.append(new MenuItem({
    label: 'Save',
    click: ()=>{
        settings.save()
    },
    accelerator: 'CmdOrCtrl + s'
}))
menu.append(new MenuItem({
    label: 'Save as...',
    click: ()=>{
        settings.saveAs()
    },
    accelerator: 'CmdOrCtrl + shift + s'
}))
menu.append(new MenuItem({
    type: 'separator'
}))
menu.append(new MenuItem({
    label: 'List MIDI Devices',
    click: ()=>{
        midilist()
    },
    accelerator: 'CmdOrCtrl + m'
}))
menu.append(new MenuItem({type: 'submenu' , label: 'Console', submenu: [
    new MenuItem({
        label: 'Clear',
        click: ()=>{
            terminal.clear()
        },
        accelerator: 'CmdOrCtrl + l'
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
menu.append(new MenuItem({
    label: 'Always on top',
    type: 'checkbox',
    checked: settings.remote.read('alwaysOnTop'),
    click: (e)=>{
        settings.remote.write('alwaysOnTop', e.checked)
        remote.getCurrentWindow().setAlwaysOnTop(e.checked)
    }
}))
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


function bindShortcuts(menu) {

    for (let m of menu.items) {

        if (m.type === 'submenu') {

            bindShortcuts(m.submenu)

        } else if (m.accelerator && m.click) {

            keyboardJS.bind(m.accelerator.replace('CmdOrCtrl', 'mod'), (e)=>{
                m.click()
            })

        }

    }

}

bindShortcuts(menu)

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
