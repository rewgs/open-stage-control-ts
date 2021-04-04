var {resolvePath, ipc} = require('./server'),
    callbacks = require('./callbacks'),
    chokidar = require('chokidar')

class FragmentManager {

    constructor() {

        this.fragments = {} // fragment files contents
        this.watchers = {} // fragment files watchers
        this.clients = {} // client ids for each watched fragment file

    }

    read(path, clientId, then) {

        callbacks.fileRead({path: path}, clientId, true, (result)=>{
            this.fragments[path] = result
            then(result)
        }, (error)=>{
            ipc.send('errorLog', `Could not open fragment file:\n ${error}`, clientId)
            this.deleteFragment(path)
        })

    }

    loadFragment(path, clientId) {

        var resolvedPath = resolvePath(path, clientId)

        if (!resolvedPath) return ipc.send('errorLog', `Fragment file not found: ${path}`, clientId)

        if (!this.clients[resolvedPath]) this.clients[resolvedPath] = []
        if (!this.clients[resolvedPath].includes(clientId)) this.clients[resolvedPath].push(clientId)

        if (!this.fragments[resolvedPath]) {

            this.fragments[resolvedPath] = this.read(resolvedPath, clientId, (result)=>{
                ipc.send('fragmentLoad', {path: path, fileContent: this.fragments[resolvedPath]}, clientId)
            })

            this.watchers[resolvedPath] = chokidar.watch(resolvedPath, {awaitWriteFinish: {stabilityThreshold: 200}}).on('change', ()=>{
                this.fragments[resolvedPath] = this.read(resolvedPath, clientId, (result)=>{
                    for (let id of this.clients[resolvedPath]) {
                        ipc.send('fragmentLoad', {path: path, fileContent: this.fragments[resolvedPath]}, id)
                    }
                })
            }).on('unlink', ()=>{
                this.deleteFragment(resolvedPath)
            })

        }

    }

    deleteFragment(path) {

        this.watchers[path].close()
        delete this.clients[path]
        delete this.fragments[path]
        delete this.fragments[path]

    }

}


module.exports = new FragmentManager()
