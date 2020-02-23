var chroma = require('chroma-js')

module.exports = (container)=>{

    setTimeout(()=>{

        var computedStyle = window.getComputedStyle(container),
            color = computedStyle.getPropertyValue('--color-fill').trim(),
            alpha = parseFloat(computedStyle.getPropertyValue('--alpha-scrollbar')),
            alphaOn = parseFloat(computedStyle.getPropertyValue('--alpha-scrollbar-on'))

        if (color) {
            container.style.setProperty('--color-scrollbar', chroma(color).alpha(alpha).css())
            container.style.setProperty('--color-scrollbar-on', chroma(color).alpha(alphaOn).css())
        }

    })

}
