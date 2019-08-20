const fromObject = require("~/common/modules/data/observable").fromObject;

const imageSource = require("~/common/modules/image-source");
const { Image } = require("~/common/modules/ui/image");

let appJson = require("../app.json");

function _loaded(args) {
    if (!args.object)
        return;

    _setInitData(args.object);
}

function _setInitData(view) {
    source.currentView = view;
    source.name = appJson.name;
    source.penWidth = 4;
    source.penColor = '#000000';
    source.drawVisibility = 'visible';
    source.resultVisibility = 'collapse';
}

function _unloaded(args) {
    // Do nothing here
}

function _onCaptureTapped(args) {
    let drawingPad = source.currentView.getViewById('signature-pad');
    drawingPad.getDrawing()
        .then(data => {
            let imageSrc = imageSource.fromNativeSource(data);
            let image = new Image();
            image.imageSource = imageSrc;
            let container = source.currentView.getViewById('signature-container');
            if (container) {
                container.content = image;
                source.drawVisibility = 'collapse';
                source.resultVisibility = 'visible';
            }
        }).catch(error => {
            console.log(error)
        });
}

function _onRefreshTapped(args) {
    let drawingPad = source.currentView.getViewById('signature-pad');
    drawingPad.clearDrawing();
    source.drawVisibility = 'visible';
    source.resultVisibility = 'collapse';
}

// The binding
let source = fromObject({
    name: appJson.name,
    penWidth: 4,
    penColor: '#000000',
    drawVisibility: 'visible',
    resultVisibility: 'collapse',
    currentView: undefined,
    onRefreshTapped: (args) => {
        _onRefreshTapped(args)
    },
    onCaptureTapped: (args) => {
        _onCaptureTapped(args);
    },
    loaded: (args) => {
        _loaded(args);
    },
    unloaded: (args) => {
        _unloaded(args);
    },
});

exports.model = source;