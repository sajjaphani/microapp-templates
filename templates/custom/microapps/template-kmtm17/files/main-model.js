const fromObject = require("~/common/modules/data/observable").fromObject;

var app = require("~/common/modules/application");

const appJson = require("../app.json");
const config = require("../config.json");

function _loaded(args) {
    if (!args.object)
        return;

    _setInitData(args.object);
    source.name = appJson.name;
    source.currentView = args.object;
    source.busy = true;
    source.loaderVisibility = "visible";
}

function _setInitData(view) {
    source.currentPage = view;
    source.name = appJson.name;
    source.websiteUrl = config.websiteUrl,
    source.busy = true;
    source.loaderVisibility = "visible";
}

function _unloaded(args) {
    // Do nothing now
}

function _onWebViewLoadFinished(args) {
    source.busy = false;
    source.loaderVisibility = "collapse"
}

function _onWebViewLoaded(args) {
    const wv = args.object;

    // hide those ugly Android zoomcontrols
    if (wv && wv.android) {
        wv.android.getSettings().setBuiltInZoomControls(false);
        let window = app.android.startActivity.getWindow();
        window.setSoftInputMode(
            android.view.WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE
        );
    }
}

// The binding
let source = fromObject({
    name: appJson.name,
    websiteUrl: config.websiteUrl,
    busy: true,
    loaderVisibility: "visible",
    currentView: undefined,
    onViewLoadFinished: (args) => {
        _onWebViewLoadFinished(args);
    },
    onViewLoaded: (args) => {
        _onWebViewLoaded(args);
    },
    loaded: (args) => {
        _loaded(args);
    },
    unloaded: (args) => {
        _unloaded(args);
    },
});

exports.model = source;