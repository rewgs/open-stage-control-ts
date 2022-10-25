// mousewheel zoom

var mod = (navigator.platform || '').match('Mac') ? 'metaKey' : 'ctrlKey'

var localZoom = 1//,
//    mousePos = [0, 0]

document.addEventListener('wheel', function(event) {
    if (event.ctrlKey) event.preventDefault()
    if (event[mod]) {

        event.preventDefault()

        if (event.deltaY === 0) return

        let d = - event.deltaY / (10 * Math.abs(event.deltaY))
        if (!isNaN(d)) {
            PXSCALE = parseFloat(d) + parseFloat(PXSCALE)
            document.documentElement.style.setProperty('font-size', PXSCALE + 'px')
            DOM.dispatchEvent(window, 'resize')
        }
    }
    if (event.altKey) {
        event.preventDefault()
        let d = - event.deltaY / (10 * Math.abs(event.deltaY)) * 2
        if (!isNaN(d)) {
            localZoom = Math.max(parseFloat(d) + parseFloat(localZoom), 1)
            applylocalZoom()
        }
    }
}, {passive: false})

// document.addEventListener('mousemove', function(event) {
//     mousePos = [
//         event.pageX / window.innerWidth * 100,
//         event.pageY / window.innerHeight * 100
//     ]
//     if (localZoom !== 1) {
//         applylocalZoom()
//     }
// }, {passive: false})


var container = DOM.get('#osc-container')[0]
function applylocalZoom() {
    if (localZoom === 1) {
        container.style.transformOrigin = ''
        container.parentNode.style.overflow = ''
        container.style.transform = ''
    } else {
        // container.style.transformOrigin = `${mousePos[0]}% ${mousePos[1]}%`
        container.parentNode.style.overflow = 'auto'
        container.style.transformOrigin = '0 0'
        requestAnimationFrame(()=>{
            container.style.transform = `scale(${localZoom})`
        })
    }
}

document.addEventListener('keydown', function(event){
    if (event[mod]) {

        var z = false
        if (event.keyCode == 96 || event.keyCode == 48) {
            PXSCALE = INITIALZOOM
            document.documentElement.style.setProperty('font-size', PXSCALE + 'px')
            localZoom = 1
            applylocalZoom()
            z = true
        }
        else if (event.keyCode == 107 || event.keyCode == 109) {
            PXSCALE = (event.keyCode == 107 ? 0.1 : -0.1) + parseFloat(PXSCALE)
            document.documentElement.style.setProperty('font-size', PXSCALE + 'px')
        }


        if (z) DOM.dispatchEvent(window, 'resize')

    }
}, {passive: true})
