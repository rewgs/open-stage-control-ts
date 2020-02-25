var popupSingleton = null,
    uploadSingleton = null,
    locales = require('../locales'),
    html = require('nanohtml'),
    raw = require('nanohtml/raw'),
    ipc = require('../ipc'),
    EventEmitter = require('../events/event-emitter'),
    doubleTap = require('../widgets/mixins/double_tap')

module.exports = {


    icon: function(i) {
        return `<i class="fa fa-fw fa-${i}"></i>`
    },
    iconify:function(string){
        return String(string).replace(/\^[^\s]*/g,(x)=>{return module.exports.icon(x.substring(1))})
    },



}
