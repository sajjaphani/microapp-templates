const fromObject = require("~/common/modules/data/observable").fromObject;

const appJson = require("../app.json");

function _loaded(args) {
    if (!args.object)
        return;

    _setInitData(args.object);
}

function _setInitData(view) {
    source.currentView= view;
    source.name = appJson.name;
}

function _unloaded(args) {
    // Do nothing now
}

// The binding
let source = fromObject({
    name: appJson.name,
    currentView: undefined,
    loaded: (args) => {
        _loaded(args);
    },
    unloaded: (args) => {
        _unloaded(args);
    },
});

exports.model = source;