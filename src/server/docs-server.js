var EventEmitter = require('events').EventEmitter,
    http = require('http'),
    send = require('send'),
    path = require('path'),
    fs = require('fs'),
    open = require('open'),
    address = require('./address')

class DocsServer extends EventEmitter {

    constructor() {

        super(...arguments)


        this.baseUrl = path.resolve(__dirname + '/../../resources/site')
        this.home = '/docs/getting-started/introduction/'
        this.server = null
        this.started = false
        this.port = 0

        this.available = true
        if (!fs.existsSync(this.baseUrl)) {
            console.error(`(ERROR, DOCS) Documentation assets not found in the app\'s directory.`)
            this.available = false
        }



    }

    start() {

        if (this.started || !this.available) return

        this.server = http.createServer(this.route.bind(this))
        this.server.on('error', (e)=>{
            console.error(`(ERROR, DOCS) ${e.message}`)
        })
        this.server.listen(0).on('listening', ()=>{
            this.port = this.server.address().port
            console.log('(INFO) Documentation server started, docs available at \n    ' + address(this.port).join('\n    '))
            this.emit('ready')

        })
        this.started = true

    }

    open() {

        if (!this.started || !this.port) {
            this.start()
            this.on('ready', ()=>{
                open(address(this.port)[0] + this.home)
                console.log('(INFO) Opening documentation with default browser...')
            })
        } else {
            open(address(this.port)[0] + this.home)
            console.log('(INFO) Opening documentation with default browser...')
        }

    }

    route(req, res) {

        var url = req.url.replace(this.baseUrl, '').split('?')[0]

        if (url[url.length-1] === '/') url += 'index.html'

        var fpath = path.join(this.baseUrl, url)

        if (!fs.existsSync(fpath)) {
            if (url.indexOf('index.html') !== -1) {
                return send(req, path.join(this.baseUrl, '/404.html')).pipe(res)
            } else {
                res.writeHead(403)
                res.end()
            }
        } else {
            return send(req, fpath).pipe(res)
        }

    }

}

module.exports = DocsServer
