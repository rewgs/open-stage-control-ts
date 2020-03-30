var utils = require('../ui/utils'),
    osc = require('../osc'),
    session = require('../managers/session/'),
    widgetManager = require('../managers/widgets'),
    state = require('../managers/state'),
    editor = require('../editor/'),
    locales = require('../locales'),
    UiModal = require('../ui/ui-modal'),
    uiLoading = require('../ui/ui-loading'),
    notifications = require('../ui/notifications'),
    raw = require('nanohtml/raw'),
    backup = require('../backup')

module.exports = {

    bundle: function(data) {
        for (let i in data) {
            osc.receive(data[i])
        }
    },

    receiveOsc: function(data){
        osc.receive(data)
    },

    connected:function(){
        uiLoading(false)
    },

    sessionOpen: function(data){

        session.open(data)

    },

    sessionNew: function(){

        session.create()

    },

    sessionSaved: function(data){

        editor.unsavedSession = false

    },

    stateLoad: function(data){

        state.load(data.state, data.send, data.path)

    },

    stateSend:function(){
        notifications.add({
            icon: 'wifi',
            message: locales('loading_newclient')
        })

        setTimeout(function(){

            osc.syncOnly = true
            state.send()
            osc.syncOnly = false

        },200)

    },

    editorDisable: function(data){

        editor.disable(data.permanent)

    },

    error: function(data){
        new UiModal({title: raw(utils.icon('exclamation-triangle') + '&nbsp; ' + locales('error')), content: raw(data), closable:true})
    },

    reloadCss: function(){
        var queryString = '?reload=' + Date.now()
        DOM.each(document, 'link[rel="stylesheet"][hot-reload]', (el)=>{
            el.href = el.href.replace(/\?.*|$/, queryString)
        })

        setTimeout(()=>{
            var root = widgetManager.getWidgetById('root')[0]
            if (root) root.onPropChanged('color')
            GRIDWIDTH =  parseInt(getComputedStyle(document.documentElement).getPropertyValue('--grid-width'))
        },200)


    },

    reload: function(){

        backup.save()
        editor.unsavedSession = false
        window.location.href = window.location.href

    },

    notify: function(data) {

        var message = data.message || ''

        if (data.locale) message = locales(data.locale) + message

        notifications.add({
            icon: data.icon,
            class: data.class,
            message: message
        })

    },

    setTitle: function(data) {

        document.title = TITLE + (data ? ' (' + data + ')' : '')

    },

    serverTargets: function(data) {

        if (data) osc.serverTargets = data

    }

}
