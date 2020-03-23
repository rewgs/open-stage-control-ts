var fs = require('fs'),
    path = require('path'),
    settings = require('./settings')

class Theme {

    constructor() {

        this.themes = []
        this.files = []
        this.css = []

        this.defaultColor = '#151a24'
        this.backgroundColor = this.defaultColor

    }

    init() {

        this.themes = settings.read('theme') || []
        this.files = []

        for (let theme of this.themes) {

            if (theme.includes('.css') && fs.existsSync(theme)) {
                this.files.push(theme)
            } else if (!theme.includes('.css') && fs.existsSync(path.resolve(__dirname + '/../assets/themes/' + theme + '.css'))) {
                this.files.push(path.resolve(__dirname + '/../assets/themes/' + theme + '.css'))
            } else {
                console.error('(ERROR) Theme not found: "' + theme)
            }
        }

        this.load()

        return this

    }

    load() {

        this.css = []

        for (let i in this.files) {

            try {
                this.css.push(fs.readFileSync(this.files[i],'utf-8'))
            } catch(err) {
                console.error('(ERROR) Could not load theme "' + this.files[i])
            }

        }

        var css = this.get()

        if (css.includes('--color-background:')) {
            this.backgroundColor = css.match(/--color-background:([^;]*);/)[1].trim()
        } else {
            this.backgroundColor = this.defaultColor
        }

        return this

    }

    get() {

        return this.css.join('\n')

    }

}

var theme = new Theme()

module.exports = theme
