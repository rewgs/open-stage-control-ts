var {PythonShell} = require('python-shell'),
    fs = require('fs'),
    path = require('path'),
    settings = require('./settings'),
    midiVersion = '1.7.0'

var pythonOptions = {
    scriptPath:__dirname,
    mode:'text',
}

var midiBinaries = {
    linux: 'osc-midi-linux',
    darwin: 'osc-midi-osx',
    win32: 'osc-midi-windows.exe'
}

var pythonPathOverride
if (process.arch === 'x64' && midiBinaries[process.platform]) {
    if (fs.existsSync(path.resolve(__dirname, midiBinaries[process.platform]))) {
        pythonPathOverride = midiBinaries[process.platform]
    }
}

class MidiConverter {

    constructor() {

        this.py = new PythonShell('python/midi.py', Object.assign({
            args: [
                settings.read('debug') ? 'debug' : '',
                ...settings.read('midi')
            ],
            pythonPath: MidiConverter.getPythonPath()
        }, pythonOptions))

        this.py.childProcess.on('error', (e)=>{
            if (e.code === 'ENOENT') {
                console.error(`(ERROR, MIDI) Could not find python binary: ${e.message.replace(/spawn (.*) ENOENT/, '$1')}`)
            } else {
                console.error(`(ERROR, MIDI) ${e.message}`)
            }
        })

    }

    send(data) {

        var args = []
        for (let i in data.args) {
            args.push(data.args[i].value)
        }

        this.py.send(JSON.stringify([data.port, data.address, ...args]))

    }

    stop() {

        this.py.childProcess.kill()

    }

    init(receiveOsc) {

        this.receiveOsc = receiveOsc
        this.py.on('message', (message)=>{
            MidiConverter.parseIpc(message, this)
        })

    }

    static parseIpc(message, instance) {

        // console.log(message)
        var name, data
        try {
            [name, data] = JSON.parse(message)
        } catch (err) {
            if (settings.read('debug')) console.error(`(DEBUG, MIDI) Unparsed python log:\n    ${message}`)
        }
        if (name == 'log') {
            if (data.indexOf('ERROR') > -1) {
                console.error(data)
            } else {
                console.log(data)
            }
        } else if (name ==  'osc') {
            instance.receiveOsc(data)
        } else if (name == 'error') {
            console.error('(ERROR, MIDI) ' + data)
            if (instance) instance.stop()
        } else if (name == 'version' && data != midiVersion) {
            console.error(`(WARNING, MIDI) binary version mismatch (${data} installed, ${midiVersion} expected)`)
        }

    }

    static list() {

        PythonShell.run('python/midi.py', Object.assign({pythonPath: MidiConverter.getPythonPath(), args: ['list-only']}, pythonOptions), function(e, results) {
            if (e) {
                if (e.code === 'ENOENT') {
                    console.error(`(ERROR, MIDI) Could not find python binary: ${e.message.replace(/spawn (.*) ENOENT/, '$1')}`)
                } else {
                    console.error(`(ERROR, MIDI) ${e.message}`)
                }
            }

            for (let r of results) {
                MidiConverter.parseIpc(r)
            }
        })

    }

    static getPythonPath() {

        var pythonPath = settings.read('midi') ? settings.read('midi').filter(x=>x.includes('path=')).map(x=>x.split('=')[1])[0] : undefined

        if (!pythonPath && pythonPathOverride) pythonPath = pythonPathOverride

        return pythonPath

    }

}

module.exports = MidiConverter
