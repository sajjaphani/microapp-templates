const fromObject = require("~/common/modules/data/observable").fromObject;

var frames = require("~/common/modules/ui/frame");

const { create } = require("~/common/kinvey-service");
const { showAlert } = require("~/common/utility-service");

let appJson = require("../app.json");

const _CAN_SEND = false;

function _loaded(args) {
    if (!args.object)
        return;

    _setInitData(args.object)
}

function _setInitData(view) {
    source.currentView = view;
    source.name = appJson.name;
    // Your other fields initialization goes here
    source.statusVisibility = "collapse";
    source.formVisibility = "visible";
}

function _unloaded(args) {
    // Do nothing now
}

function _onSubmitTapped(args) {
    // create data object based on your configured fields
    const data = {
    };

    if (!_CAN_SEND) {
        console.log(data);
        _updateUi()
    } else {
        // Do something with the captured data
        create(appJson.collectionName, data)
            .subscribe(
                data => { _updateUi() },
                error => { showAlert("Problem in Performing Action", error.message) },
                () => { });
    }
}

function _onCreateNewTapped(args) {
    source.statusVisibility = "collapse";
    source.formVisibility = "visible";
}

function _onCloseTapped(args) {
    frames.topmost().goBack();
}

function _updateUi() {
    // also need to reset fields to initials
    source.statusVisibility = "visible";
    source.formVisibility = "collapse";
}

// The binding
let source = fromObject({
    name: appJson.name,
    // Your form field binding goes here
    formVisibility: "visible",
    statusVisibility: "collapse",
    currentView: undefined,
    onSubmitTapped: (args) => {
        _onSubmitTapped(args);
    },
    onCreateNewTapped: (args) => {
        _onCreateNewTapped(args);
    },
    onCloseTapped: (args) => {
        _onCloseTapped(args);
    },
    loaded: (args) => {
        _loaded(args);
    },
    unloaded: (args) => {
        _unloaded(args);
    },
});

exports.model = source;