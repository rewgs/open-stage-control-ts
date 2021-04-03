var {resolvePath, ipc} = require('./server'),
    callbacks = require('./callbacks'),
    chokidar = require('chokidar')

class FragmentManager {

    constructor() {

        this.fragments = {} // fragment files contents
        this.watchers = {} // fragment files watchers
        this.clients = {} // client ids for each watched fragment file

    }

    read(path, resolvedPath, clientId, then) {

        var pathId = path + '->' + resolvedPath

        callbacks.fileRead({path: resolvedPath}, clientId, true, (result)=>{
            this.fragments[pathId] = result
            then(result)
        }, (error)=>{
            ipc.send('errorLog', `Could not open fragment file:\n ${error}`, clientId)
            this.deleteFragment(pathId)
        })

    }

    loadFragment(path, clientId) {

        var resolvedPath = resolvePath(path, clientId),
            pathId = path + '->' + resolvedPath


        if (!resolvedPath) return ipc.send('errorLog', `Fragment file not found: ${path}`, clientId)

        if (!this.clients[pathId]) this.clients[pathId] = []
        if (!this.clients[pathId].includes(clientId)) this.clients[pathId].push(clientId)

        if (!this.fragments[resolvedPath]) {

            this.fragments[pathId] = this.read(path, resolvedPath, clientId, (result)=>{
                ipc.send('fragmentLoad', {path: path, fileContent: this.fragments[pathId]}, clientId)
            })

            this.watchers[pathId] = chokidar.watch(resolvedPath, {awaitWriteFinish: {stabilityThreshold: 200}}).on('change', ()=>{
                this.fragments[pathId] = this.read(path, resolvedPath, clientId, (result)=>{
                    for (let id of this.clients[pathId]) {
                        ipc.send('fragmentLoad', {path: path, fileContent: this.fragments[pathId]}, id)
                    }
                })
            }).on('unlink', ()=>{
                this.deleteFragment(pathIdv)
            })

        }

    }

    deleteFragment(pathId) {

        this.watchers[pathId].close()
        delete this.clients[pathId]
        delete this.fragments[pathId]
        delete this.fragments[pathId]

    }

}


module.exports = new FragmentManager()
