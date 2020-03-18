
module.exports = {


    icon: function(i) {
        return `<i class="fa fa-fw fa-${i}"></i>`
    },
    iconify:function(string){
        return String(string).replace(/\^[^\s]{2,}/g,(x)=>{return module.exports.icon(x.substring(1))})
    },



}
