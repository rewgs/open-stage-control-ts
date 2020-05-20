# Download the latest release

!!! info "Open Stage Control v1 is currently in beta"
    Give it a try and send your feedback on the [forum](https://openstagecontrol.discourse.group/t/open-stage-control-v1-0-0-beta/543/3) !

<a href="https://github.com/jean-emmanuel/open-stage-control/releases/latest"> Open Stage Control <span id="osc-version"span></a>

<div id="osc-assets">Loading assets...</div>

??? abstract "Changelog"
    <div class="highlight"><pre><code id="osc-changelog">Loading changelog...</code></pre></div>


<script>

var oReq = new XMLHttpRequest();
oReq.addEventListener('load', reqListener);
oReq.open('GET', 'https://api.github.com/repos/jean-emmanuel/open-stage-control/releases/latest')
oReq.send()


function text(id,  str) {
    var el = typeof id === 'string' ? document.getElementById(id) : id
    el.textContent = str
}

function reqListener () {

    var data = JSON.parse(this.responseText)
    var date = new Date(data.published_at)

    text('osc-version', data.tag_name + ' (' + date.toLocaleDateString() + ')')

    var list = document.createElement('ul')
    for (var i in data.assets) {
        var item = document.createElement('li'),
            link = document.createElement('a')

        link.textContent = data.assets[i].name + ' (' +  (data.assets[i].size / 1024 / 1024).toFixed(1) + 'M)'
        link.href = data.assets[i].browser_download_url

        item.appendChild(link)
        list.appendChild(item)
    }
    var assets = document.getElementById('osc-assets')
    assets.innerHTML = ''
    assets.appendChild(list)

    text('osc-changelog', data.body)



}

</script>


<style>
html {
    overflow-y: scroll
}
.md-sidebar--secondary {
  display: none;
}
@media screen and (min-width: 76.25em) {
    .md-sidebar--primary {
      display: none;
    }
}
.md-content {
    margin: 0;
}
.md-content__inner {
    margin-left: .8rem;
    margin-right: .6rem;
}
</style>
