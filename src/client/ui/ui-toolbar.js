var UiWidget = require('./ui-widget'),
    morph = require('nanomorph'),
    ContextMenu = require('./context-menu'),
    html = require('nanohtml'),
    raw = require('nanohtml/raw'),
    {icon} = require('./utils'),
    ipc = require('../ipc'),
    locales = require('../locales'),
    notifications = require('./notifications'),
    fullscreen = require('./fullscreen'),
    editor = require('../editor'),
    sessionManager = require('../managers/session'),
    stateManager = require('../managers/state'),
    uiSidePanel = require('./ui-sidepanel')


var recentSessions = []
var menuEntries = [

    {
        label: locales('session'),
        action: [
            {
                label: locales('session_new'),
                action: sessionManager.create.bind(sessionManager)
            },
            {
                separator: true
            },
            {
                label: locales('file_open'),
                action: sessionManager.browse.bind(sessionManager),
                shortcut: 'mod + o'
            },
            {
                label: locales('file_open_recent'),
                action: recentSessions
            },
            {
                separator: true
            },
            {
                label: locales('file_save'),
                action: sessionManager.save.bind(sessionManager),
                shortcut: 'mod + s'
            },
            {
                label: locales('file_save_as'),
                action: sessionManager.saveAs.bind(sessionManager),
                shortcut: 'mod + shift + s'
            },
            {
                separator: true
            },
            {
                label: locales('file_import'),
                action: sessionManager.import.bind(sessionManager)
            },
            {
                label: locales('file_export'),
                action: sessionManager.export.bind(sessionManager)
            },

        ]
    },
    {
        label: locales('state'),
        class: ()=>{return sessionManager.session === null ? 'disabled' : ''},
        action: [
            {
                label: locales('state_store'),
                action: stateManager.quickSave.bind(stateManager)
            },
            {
                label: locales('state_recall'),
                class: ()=>{return stateManager.quickState === null ? 'disabled' : ''},
                action: stateManager.quickLoad.bind(stateManager)
            },
            {
                label: locales('state_send'),
                action: ()=>{
                    stateManager.send()
                    notifications.add({
                        icon: 'sliders-h',
                        message: locales('state_sendsuccess')
                    })
                }
            },
            {
                separator: true
            },
            {
                label: locales('file_open'),
                action: stateManager.browse.bind(stateManager)
            },
            {
                label: locales('file_save'),
                action: stateManager.save.bind(stateManager)
            },
            {
                label: locales('file_save_as'),
                action: stateManager.saveAs.bind(stateManager)
            },
            {
                separator: true
            },
            {
                label: locales('file_import'),
                action: stateManager.import.bind(stateManager)
            },
            {
                label: locales('file_export'),
                action: stateManager.export.bind(stateManager)
            },
        ]
    },
    {
        label: locales('editor'),
        class: ()=>{return sessionManager.session === null ? 'disabled' : ''},
        action: [
            {
                label: locales('editor_enabled'),
                class: ()=>{return 'toggle ' + (editor.enabled ? 'on' : 'off')},
                action: ()=>{
                    if (editor.enabled) editor.disable()
                    else editor.enable()
                },
                shortcut: 'mod + e'
            },
            {
                separator: true
            },
            {
                label: locales('editor_grid'),
                class: ()=>{return 'toggle ' + (editor.grid ? 'on' : 'off')},
                action: editor.toggleGrid.bind(editor),
                // shortcut: 'mod + g'

            },
            {
                label: locales('editor_tree'),
                class: ()=>{return 'toggle ' + (uiSidePanel.left.minimized ? 'off' : 'on')},
                action: ()=>{return uiSidePanel.left.minimized ? uiSidePanel.left.restore() : uiSidePanel.left.minimize()},
                // shortcut: 'mod + t'


            },
            {
                label: locales('editor_inspector'),
                class: ()=>{return 'toggle ' + (uiSidePanel.right.minimized ? 'off' : 'on')},
                action: ()=>{return uiSidePanel.right.minimized ? uiSidePanel.right.restore() : uiSidePanel.right.minimize()},
                // shortcut: 'mod + i'
            }
        ]
    },
    {
        separator: true
    },
    {
        label: locales('fullscreen'),
        class: ()=>{return 'toggle ' + (fullscreen.isFullscreen ? 'on' : 'off')},
        action: ()=>{
            if (fullscreen.isEnabled) fullscreen.toggle()
        },
        shortcut: 'f11'
    },

]

if (navigator.userAgent.match(/Android|iPhone|iPad|iPod/i)) {

    var NoSleep = require('nosleep.js'),
        noSleep = new NoSleep(),
        noSleepState = false

    menuEntries.push({
        label: locales('nosleep'),
        class: ()=>{return 'toggle ' + (noSleepState ? 'on' : 'off')},
        action:()=>{
            noSleepState = !noSleepState
            if (noSleepState) noSleep.disable()
            else noSleep.enable()
        }
    })

}





class UiToolbar extends UiWidget {

    constructor(options) {

        super(options)

        this.menu = new ContextMenu({
            position: [39, 1]
        })
        this.opened = false
        this.menu.bindShortcuts(menuEntries)

        ipc.on('sessionList', (data)=>{
            if (recentSessions.length) {
                recentSessions.splice(0, 10)
            }
            for (let s of data) [
                recentSessions.push({
                    label: s,
                    action: ()=>{sessionManager.requestOpen(s)}
                })
            ]
        })

        this.container.addEventListener('fast-click', (e)=>{
            if (this.opened) this.close()
            else this.open(e)
        })

        this.menu.on('close', ()=>{
            setTimeout(()=>{
                this.opened = false
                this.toggleState()
            })
        })

    }

    open(e) {

        if (this.opened) return

        this.menu.open(e, menuEntries)

        this.opened = true
        this.toggleState()


    }

    close() {

        if (this.opened) return

        this.menu.close()

        this.opened = false
        this.toggleState()

    }

    toggleState() {

        this.container.classList.toggle('on', this.opened)

    }

}


module.exports = new UiToolbar({selector: 'osc-toolbar'})
