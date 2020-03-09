var {remote} = eval('require(\'electron\')'),
    {Menu, MenuItem} = remote.require('electron'),
    menu = new Menu()


menu.append(new MenuItem({role: 'undo'}))
menu.append(new MenuItem({role: 'redo'}))
menu.append(new MenuItem({type: 'separator'}))
menu.append(new MenuItem({role: 'copy'}))
menu.append(new MenuItem({role: 'paste'}))

// not working currently
// menu.append(new MenuItem({type: 'submenu' , label: 'App', submenu: [
//     new MenuItem({
//         label: 'Relaunch',
//         click: ()=>{
//             app.relaunch()
//             app.exit(0)
//         }
//     }),
// ]}))


window.addEventListener('contextmenu', function(e) {
    menu.items[3].enabled = !!window.getSelection().toString()
    menu.items[4].enabled = e.target.tagName === 'INPUT' && !e.target.getAttribute('disabled')
    menu.popup({ window: remote.getCurrentWindow(), x: e.pageX, y: e.pageY - (document.body.scrollTop || document.documentElement.scrollTop) })
}, false)
