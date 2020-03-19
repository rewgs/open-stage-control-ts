var chroma = require('chroma-js')

module.exports = (container)=>{

    setTimeout(()=>{

        var computedStyle = window.getComputedStyle(container),
            alpha = parseFloat(computedStyle.getPropertyValue('--alpha-scrollbar')),
            alphaOn = parseFloat(computedStyle.getPropertyValue('--alpha-scrollbar-on')),
            color = computedStyle.getPropertyValue('--color-fill').trim()

        if (color === 'transparent') {
            // prevent chroma-js error
            // irrelevant case, but still...
            color = 'rgb(0, 0, 0)'
            alpha = 0
            alphaOn = 0
        }

        if (color) {
            container.style.setProperty('--color-scrollbar', chroma(color).alpha(alpha).css())
            container.style.setProperty('--color-scrollbar-on', chroma(color).alpha(alphaOn).css())
        }

    })

}
