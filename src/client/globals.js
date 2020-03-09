window.ARGV = {}
location.search.replace(/[?&]+([^=&]+)=([^&]*)/gi, (s,k,v)=>{
    ARGV[k]=v
})

window.LANG = ARGV.lang === 'debug' ? 'debug' : (ARGV.lang || navigator.language || '').substr(0, 2).toLowerCase()

window.PACKAGE = require('../../package.json')

window.LOADING = null

window.READ_ONLY = false
window.GRIDWIDTH = 10


window.CANVAS_FRAMERATE = parseFloat(ARGV.framerate || 60)
window.CANVAS_SCALING = parseFloat(ARGV.forceHdpi) || ( ARGV.hdpi ? window.devicePixelRatio : 1 )
window.INITIALZOOM = ARGV.zoom ? ARGV.zoom : 1
window.PXSCALE = INITIALZOOM
document.documentElement.style.setProperty('font-size', PXSCALE + 'px')

window.DOUBLE_TAP_TIME = ARGV.doubletap ? ARGV.doubletap : 375


window.JSON.parseFlex = require('json5').parse

window.DOM = require('./dom')

window.TITLE = PACKAGE.productName + ' v' + PACKAGE.version
