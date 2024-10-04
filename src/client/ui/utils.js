var chroma = require('chroma-js'),
    fastdom = require('fastdom'),
    widgetManager = require('../managers/widgets')

module.exports = {


    icon: function(i) {
        var iclass = i.split('.').join(' fa-')
        return `<i class="fa fa-fw fa-${iclass}"></i>`
    },
    iconify:function(string){
        return String(string).replace(/\^[^\s]{2,}/g,(x)=>{return module.exports.icon(x.substring(1))})
    },

    setScrollbarColor: function(container) {

        fastdom.measure(()=>{

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
                fastdom.mutate(()=>{
                    try {
                        container.style.setProperty('--color-scrollbar', chroma(color).alpha(alpha).css())
                        container.style.setProperty('--color-scrollbar-on', chroma(color).alpha(alphaOn).css())
                    } catch(e) {}
                })
            }

        })

    },

    updateMobileThemeColor: function(){

        fastdom.measure(()=>{
            var root = widgetManager.getWidgetById('root')[0]
            var style = window.getComputedStyle(root ? root.widget : document.documentElement)

            fastdom.mutate(()=>{

                var color = style.getPropertyValue('--color-background').trim()
                try {
                    for (var el of DOM.get('meta[name="theme-color"], meta[name="apple-mobile-web-app-status-bar-style"]')) {
                        el.setAttribute('content', color)
                    }
                } catch(e) {}

            })

        })

    }

}
