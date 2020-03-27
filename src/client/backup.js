var localBackup = sessionStorage.getItem('osc.backup')


module.exports = {

    exists: localBackup !== null,

    save: ()=>{

        var session = require('./managers/session/'),
            state = require('./managers/state'),
            editor = require('./editor/')

        if (session.session) {
            sessionStorage.setItem('osc.backup', JSON.stringify({
                session: session.session.data,
                sessionPath: session.sessionPath,
                state: state.get(),
                history: editor.history,
                historyState: editor.historyState,
                editorEnabled: editor.enabled
            }))
        }

    },

    load: ()=>{

        var session = require('./managers/session/'),
            state = require('./managers/state'),
            editor = require('./editor/'),
            ipc = require('./ipc/')

        if (localBackup) {

            var data = JSON.parse(localBackup)

            sessionStorage.removeItem('osc.backup')
            session.load(data.session, ()=>{

                state.set(data.state, false)

                editor.clearHistory()
                editor.history = data.history
                editor.historyState = data.historyState

                if (data.editorEnabled) editor.enable()


                ipc.send('sessionSetPath', {path: data.sessionPath})
                session.setSessionPath(data.sessionPath)

            })

        }

    }
}
