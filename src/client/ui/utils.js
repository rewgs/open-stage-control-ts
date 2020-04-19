
module.exports = {


    icon: function(i) {
	var iclass = i.split('.').join(' fa-')
        return `<i class="fa fa-fw fa-${iclass}"></i>`
    },
    iconify:function(string){
        return String(string).replace(/\^[^\s]{2,}/g,(x)=>{return module.exports.icon(x.substring(1))})
    },



}
