module.exports.widgets = {
    // tabs
    tab: require('./containers/tab'),
    root: require('./containers/root'),

    // sliders
    fader: require('./sliders/fader'),
    knob: require('./sliders/knob'),
    encoder: require('./sliders/encoder'),
    range: require('./sliders/range'),

    // buttons
    toggle: require('./buttons/toggle'),
    switch: require('./buttons/switch'),
    dropdown: require('./buttons/dropdown'), // redo as menu derivate ?
    menu: require('./buttons/menu'), // redo using canvas

    // pads
    xy: require('./pads/xy'),
    rgb: require('./pads/rgb'),
    multixy: require('./pads/multixy'),
    canvas: require('./pads/canvas'), // implement...

    // matrices
    keyboard: require('./matrices/keyboard'),
    patchbay: require('./matrices/patchbay').PatchBay,
    patchbaynode: require('./matrices/patchbay').PatchBayNode,

    // indicators
    led: require('./indicators/led'),
    text: require('./indicators/text'),

    // graphs
    plot: require('./graphs/plot'),
    eq: require('./graphs/eq'),
    visualizer: require('./graphs/visualizer'),

    // frames
    image: require('./frames/image'),
    svg: require('./frames/svg'),
    html: require('./frames/html'),
    frame: require('./frames/frame'),

    // containers
    panel: require('./containers/panel'),
    modal: require('./containers/modal'),
    clone: require('./containers/clone'),
    matrix: require('./containers/matrix'),

    // state switchers
    switcher: require('./switchers/switcher'),
    crossfader: require('./switchers/crossfader'),
    state: require('./switchers/state'),

    // inputs
    input: require('./inputs/input'),
    keys: require('./inputs/keys'),
    script: require('./inputs/script'),
    gyroscope: require('./inputs/gyroscope'),
    file: require('./inputs/file'),

}

module.exports.categories = {
    'Buttons':['toggle', 'switch', 'dropdown', 'menu'],
    'Containers':['panel', 'modal', 'clone', 'matrix'],
    'Frames':['frame', 'svg', 'html', 'image'],
    'Graphs':['plot','eq','visualizer'],
    'Indicators':['led', 'text'],
    'Inputs':['input', 'keys', 'script', 'gyroscope', 'file'],
    'Matrices':['keyboard', 'patchbay'],
    'Pads':['xy','rgb','multixy', 'canvas'],
    'Sliders':['fader','knob', 'encoder', 'range'],
    'Switchers':['state', 'switcher','crossfader'],
}

var defaults = {}
for (var k in module.exports.widgets) {
    defaults[k] = module.exports.widgets[k].defaults()
}
module.exports.defaults = defaults
