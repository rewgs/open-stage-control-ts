var settings = require('./settings'),
    fs = require('fs'),
    vm = require('vm'),
    chokidar = require('chokidar'),
    path = require('path'),
    modulePathExtended = false,
    loadedModules = {}

class CustomModule {

    constructor(file, context, parent=null, mainModule=null) {

        this.module = {exports: null}
        this.init = null
        this.oscInFilter = null
        this.oscOutFilter = null

        this.mainModule = mainModule

        this.parent = parent
        this.submodule = !!parent

        this.filename = this.submodule ? file : path.resolve(file)

        this.timeouts = []
        this.intervals = []
        this.submodules = {}


        this.context = this.submodule ? {
            ...context,
            require: this.require.bind(this),
        } : {
            ...context,
            loadJSON: (url)=>{
                if (url.split('.').pop() === 'json') {
                    try {
                        url = path.resolve(path.dirname(this.filename), url)
                        var content = fs.readFileSync(url, 'utf8')
                        if (content[0] === '\ufeff') content = content.slice(1) // remove BOM
                        return JSON.parse(content)
                    } catch(e) {
                        console.error('(ERROR) could not load json file from ' + url)
                        console.error(e.message)
                    }
                } else {
                    console.error('(ERROR) unauthorized file type for loadJSON')
                }
            },
            saveJSON: (url, data)=>{
                if (url.split('.').pop() === 'json') {
                    url = path.resolve(path.dirname(this.filename), url)
                    try {
                        return fs.writeFileSync(url, JSON.stringify(data, null, '  '))
                    } catch(e) {
                        console.error('(ERROR) could not save json file to ' + url)
                        console.error(e.message)
                    }
                } else {
                    console.error('(ERROR) unauthorized file type for saveJSON')
                }
            },
            console: console,
            settings: {
                read: settings.read,
                appAddresses: settings.appAddresses,
            },
            setTimeout: this.setTimeout.bind(this),
            clearTimeout: this.clearTimeout.bind(this),
            setInterval: this.setInterval.bind(this),
            clearInterval: this.clearInterval.bind(this),
            require: this.require.bind(this),
            nativeRequire: require,
            process: process
        }

        if (!this.submodule && !modulePathExtended) {
            require('module').globalPaths.push(
                path.resolve(path.dirname(this.filename)),
                path.resolve(path.dirname(this.filename), 'node_modules')
            )
            modulePathExtended = true
        }

        this.load()

        this.watcher = chokidar.watch(this.filename, {awaitWriteFinish: {stabilityThreshold: 200}}).on('change', ()=>{
            if (this.submodule) {
                console.log('(INFO) Submodule changed: ' + this.filename)
                this.mainModule.reload()
            } else {
                console.log('(INFO) Custom module changed: ' + this.filename)
                this.reload()
            }
        })

    }

    load() {

        if (loadedModules[this.filename]) {
            this.module.exports = loadedModules[this.filename].module.exports
            return true
        }

        var code

        try {
            code = fs.readFileSync(this.filename, {encoding: 'utf8', flag: 'rs'}) // flag 'rs' to avoid cache issue on windows
        } catch(err) {
            console.error(`(ERROR) ${this.submodule ? 'Submodule' : 'Custom module'} not found: ${this.filename}`)
            return false
        }

        var context = vm.createContext({
            ...this.context,
            __dirname: path.resolve(path.dirname(this.filename)),
            __filename: path.resolve(this.filename),
            module: this.module
        })


        try {
            loadedModules[this.filename] = this
            vm.runInContext(code, context, {
                filename: this.filename
            })
        } catch(err) {
            loadedModules[this.filename] = null
            console.error('(ERROR) Custom module loading error')
            console.error(err)
            return false
        }

        if (typeof this.module.exports === 'object' && this.module.exports !== null) {
            this.init = this.module.exports.init || null
            this.oscInFilter = this.module.exports.oscInFilter || null
            this.oscOutFilter = this.module.exports.oscOutFilter || null
        }

        return true

    }

    unload() {

        if (!loadedModules[this.filename]) return
        loadedModules[this.filename] = null

        if (this.module.exports && this.module.exports.unload) {
            try {
                this.module.exports.unload()
            } catch(e) {
                console.error('(ERROR) Error while unloading custom module')
                console.error(e)
            }
        }

        this.module = {exports: null}
        this.init = null
        this.oscInFilter = null
        this.oscOutFilter = null

        for (let timeout of this.timeouts) {
            clearTimeout(timeout)
        }

        for (let interval of this.intervals) {
            clearInterval(interval)
        }

        this.timeouts = []
        this.intervals = []

        for (let name of this.context.app.eventNames()) {
            this.context.app.removeAllListeners(name)
        }

        for (let name in this.submodules) {
            this.submodules[name].unload()
        }
        this.submodules = {}

        if (this.submodule) {
            this.watcher.close()
        }

    }

    reload() {

        this.unload()
        console.log('(INFO) Reloading custom module...')
        if (this.load()) {
            console.log('(INFO) Custom module reloaded successfully')
        } else {
            console.error('(ERROR) Failed to reload custom module')
            this.unload()
        }
    }

    setTimeout(fn, t) {
        var timeout = setTimeout(fn, t)
        this.timeouts.push(timeout)
        return timeout
    }

    setInterval(fn, t) {
        var interval = setInterval(fn, t)
        this.intervals.push(interval)
        return interval
    }

    clearTimeout(timeout) {
        clearTimeout(timeout)
        if (this.timeouts.includes(timeout)) {
            this.timeouts.splice(this.timeouts.indexOf(timeout), 1)
        }
    }

    clearInterval(interval) {
        clearInterval(interval)
        if (this.intervals.includes(interval)) {
            this.intervals.splice(this.intervals.indexOf(interval), 1)
        }
    }

    require(filename) {

        if (!path.isAbsolute(filename)) {
            filename = path.resolve(path.dirname(this.filename), filename)
        }

        this.submodules[filename] = loadedModules[filename] || new CustomModule(filename, this.context, this, this.parent || this)

        return this.submodules[filename].module.exports

    }

}


module.exports = CustomModule
