var settings = require('./settings'),
    fs = require('fs'),
    vm = require('vm'),
    chokidar = require('chokidar')


class CustomModule {

    constructor(file, context) {

        this.init = null
        this.oscInFilter = null
        this.oscOutFilter = null

        this.filename = file

        this.timeouts = []
        this.intervals = []

        this.context = {
            ...context,
            loadJSON: (url)=>{
                if (url.split('.').pop() === 'json') {
                    try {
                        url = path.resolve(path.dirname(customModule), url)
                        return JSON.parse(fs.readFileSync(url, 'utf8'))
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
                    url = path.resolve(path.dirname(customModule), url)
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
            settings: settings,
            setTimeout: this.setTimeout.bind(this),
            clearTimeout: this.clearTimeout.bind(this),
            setInterval: this.setInterval.bind(this),
            clearInterval: this.clearInterval.bind(this),
            module: {exports: {}}
        }

        this.load()

        chokidar.watch(this.filename).on('change', ()=>{
            this.reload()
        })

    }

    load() {

        var code

        try {
            code = fs.readFileSync(this.filename, 'utf8')
        } catch(err) {
            console.error('(ERROR) Custom module not found: ' + this.filename)
            return false
        }

        var context = vm.createContext({
            ...this.context
        })

        try {
            vm.runInContext(code, context, {
                filename: this.filename
            })
        } catch(err) {
            console.error('(ERROR) Custom module loading error')
            console.error(err)
            return false
        }

        this.init = context.module.exports.init || null
        this.oscInFilter = context.module.exports.oscInFilter || null
        this.oscOutFilter = context.module.exports.oscOutFilter || null

        return true

    }

    unload() {

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

    }

    reload() {

        this.unload()
        console.log('(INFO) Reloading custom module: ' + this.filename)
        if (this.load()) {
            console.log('(INFO) Custom module reloaded successfully')
        } else {
            console.log('(ERROR) Failed to reload custom module')
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

    clearInterval(id) {
        clearInterval(interval)
        if (this.intervals.includes(interval)) {
            this.intervals.splice(this.intervals.indexOf(interval), 1)
        }
    }

}


module.exports = CustomModule
