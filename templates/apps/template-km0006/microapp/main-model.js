const fromObject = require("~/common/modules/data/observable").fromObject;

var app = require("~/common/modules/application");

var { getNativeChatUrl } = require("~/common/nativechat-util");

const appJson = require("../app.json");
const config = require("../config.json");

var _config = new fromObject({
    botId: config.botId,
    channelId: config.channelId,
    channelToken: config.channelToken,
    user: {
        name: "Guest"
    },
    session: {
        clear: true,
        userMessage: "Hi",
        context: {
            company: "Progress Software",
            phone: "555 555 5555"
        }
    }
});

function _loaded(args) {
    source.name = appJson.name;
    source.currentView = args.object;
    let nativechatUrl = getNativeChatUrl(_config);
    source.nativechatUrl = nativechatUrl;
    source.busy = true;
    source.loaderVisibility = "visible";
}

function _onWebViewLoadFinished(args) {
    source.busy = false;
    source.loaderVisibility = "collapse"
}

function _onWebViewLoaded(args) {
    source.nativeChatVisibility = 'visible'
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
    nativechatUrl: "https://eloha.io/",
    busy: true,
    loaderVisibility: "visible",
    nativeChatVisibility: 'collapse',
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
        // Not bound
    },
});

exports.model = source;