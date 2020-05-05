var ifaces = require('os').networkInterfaces(),
    address = Object.values(ifaces)
        .reduce((a,b)=>a.concat(b), [])
        .filter(i=>i.family === 'IPv4')
        .map(i=>i.address + ':')

module.exports = (proto, port)=>{
    return address.map(x=>proto + x + port)
}
