var screenfull = require('screenfull'),
    UiModal = require('./ui-modal'),
    locales = require('../locales')

var fullscreen

if (screenfull.isEnabled) {

    fullscreen = screenfull

} else {

    class IOSFullScreen {

        constructor(){

            this.enabled = !navigator.standalone
            this.isFullScreen = navigator.standalone

        }

        toggle(){

            new UiModal({
                title: locales('fs_unnavailable'),
                content: locales('fs_addtohome'),
                closable: true
            })

        }

        on(){}

    }

    fullscreen = new IOSFullScreen()

}


module.exports = fullscreen
