// mousewheel zoom

var mod = (navigator.platform || '').match('Mac') ? 'metaKey' : 'ctrlKey'

var localZoom = 1,
    mousePos = [0, 0]

document.addEventListener('wheel', function(event) {
    if (event.ctrlKey) event.preventDefault()
    if (event[mod]) {

        event.preventDefault()

        if (event.deltaY === 0) return

        var d = - event.deltaY / (10 * Math.abs(event.deltaY))
        if (!isNaN(d)) {
            PXSCALE = parseFloat(d) + parseFloat(PXSCALE)
            document.documentElement.style.setProperty('font-size', PXSCALE + 'px')
            DOM.dispatchEvent(window, 'resize')
        }
    }
    if (event.altKey) {
        event.preventDefault()
        var d = - event.deltaY / (10 * Math.abs(event.deltaY))
        if (!isNaN(d)) {
            localZoom = Math.max(parseFloat(d) + parseFloat(localZoom), 1)
            applylocalZoom()
        }
    }
}, {passive: false})

document.addEventListener('mousemove', function(event) {
    mousePos = [
        event.screenX / screen.width * 100,
        event.screenY / screen.height * 100
    ]
    if (localZoom !== 1) {
        applylocalZoom()
    }
}, {passive: false})

function applylocalZoom() {
    if (localZoom === 1) {
        document.body.style.transformOrigin = ''
        document.body.style.transform = ''
    } else {
        document.body.style.transformOrigin = `${mousePos[0]}% ${mousePos[1]}%`
        requestAnimationFrame(()=>{
            document.body.style.transform = `scale(${localZoom})`
        })
    }
}

document.addEventListener('keydown', function(event){
    if (event[mod] && (event.keyCode == 96 || event.keyCode == 48)) {
        PXSCALE = INITIALZOOM
        document.documentElement.style.setProperty('font-size', PXSCALE + 'px')

        DOM.dispatchEvent(window, 'resize')

        localZoom = 1
        applylocalZoom()
    }
}, {passive: true})
