// Prevent iOS Pull-To-Refresh

var iOS

if (navigator.platform.match(/iPhone|iPod|iPad/) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) {

    var supportsPassiveOption = false
    try {
        document.createElement('div').addEventListener('test', function() {}, {
            get passive() {
                supportsPassiveOption = true
                return false
            }
        })
    } catch(e) {}

    iOS = true

    var preventNextMove = false

    document.addEventListener('touchstart', (e)=>{
        if (e.touches.length === 1 && !e.target._drag_widget) preventNextMove = true
    }, supportsPassiveOption ? {passive: false} : false)

    document.addEventListener('touchmove', (e)=>{
        // preventDefault the first overscrolling touchmove
        if (preventNextMove) {
            preventNextMove = false
            e.preventDefault()
        }
    }, supportsPassiveOption ? {passive: false} : false)

}

module.exports = iOS
