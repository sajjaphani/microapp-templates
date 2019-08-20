const fromObject = require("~/common/modules/data/observable").fromObject;

const appJson = require("../app.json");

function _loaded(args) {
}

function _unloaded(args) {
}

// The binding
let source = fromObject({
    name: appJson.name,
    loaded: (args) => {
        _loaded(args);
    },
    unloaded: (args) => {
        _unloaded(args)
    },
});

exports.model = source;