var ifaces = require('os').networkInterfaces(),
    address = Object.values(ifaces)
        .reduce((a,b)=>a.concat(b), [])
        .filter(i=>i.family === 'IPv4')
        .map(i=>'http://' + i.address + ':')

module.exports = (port)=>{
    return address.map(x=>x + port)
}
