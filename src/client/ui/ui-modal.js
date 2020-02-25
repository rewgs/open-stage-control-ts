var UiWidget = require('./ui-widget'),
    {icon} = require('./utils'),
    html = require('nanohtml'),
    raw = require('nanohtml/raw'),
    SINGLETON = null,
    CONTAINER = null

class UiModal extends UiWidget {

   constructor(options) {

       super(options)

       if (!CONTAINER) CONTAINER = DOM.get('osc-modal-container')[0]

       if (options.closable) {

           if (SINGLETON) SINGLETON.close()
           SINGLETON = this

       }

       this.escKey = options.closable || options.escKey
       this.enterKey = options.enterKey
       this.state = 0

       this.container = html`
           <div class="popup show">
               <div class="popup-wrapper">
                   <div class="popup-title ${options.closable? 'closable' : ''}">
                       <span class="title">
                           ${options.icon ? raw(icon(options.icon)) : ''}
                           ${options.title}
                       </span>
                       ${options.closable? html`<span class="closer">${raw(icon('times'))}</span>` : ''}
                       </div>
                   <div class="popup-content">
                       ${options.content}
                   </div>
               </div>
           </div>
       `

       if (options.closable) {
           var closer = DOM.get(this.container, '.popup-title .closer')[0]
           this.container.addEventListener('fast-click',(e)=>{
               if (e.target === this.container || e.target === closer) {
                   e.detail.preventOriginalEvent = true
                   this.close()
               }
           })
       }

       if (this.escKey) {
           this.escKeyHandler = ((e)=>{
               if (e.keyCode==27) this.close()
           }).bind(this)
       }

       if (this.enterKey) {
           this.enterKeyHandler = ((e)=>{
               if (e.keyCode == 13) this.enterKey.call(this, e)
           }).bind(this)
       }

       if (!options.hide) this.open()


   }



   close() {

       if (!this.state) return
       this.state = 0

       if (this.escKey) document.removeEventListener('keydown', this.escKeyHandler)
       if (this.enterKey) document.removeEventListener('keydown', this.enterKeyHandler)
       CONTAINER.removeChild(this.container)

       this.trigger('close')

   }

   open() {

       if (this.state) return
       this.state = 1

       if (this.escKey) document.addEventListener('keydown', this.escKeyHandler)
       if (this.enterKey) document.addEventListener('keydown', this.enterKeyHandler)
       CONTAINER.appendChild(this.container)

       this.trigger('open')
   }

}

module.exports = UiModal
