const fromObject = require("~/common/modules/data/observable").fromObject;

var frameModule = require("~/common/modules/ui/frame");

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
    source.title = undefined;
    source.inputTypes = ["Input Type 1", "Input Type 2", "Input Type 3", "Input Type 4"];
    source.selectedType = undefined;
    source.selectedDate = undefined;
    source.selectedTime = undefined;
    source.state = false;
    source.ratings = 1;
    source.comments = undefined;
    source.statusVisibility = "collapse";
    source.formVisibility = "visible";
}

function _unloaded(args) {
    // Do nothing now
}

function _onSubmitTapped(args) {
    const data = {
        title: source.title || 'Not Provided',
        type: source.selectedType || 'Not Selected',
        date: source.selectedDate || 'Not Selected',
        time: source.selectedTime || 'Not Selected',
        state: source.state,
        ratings: source.ratings,
        comments: source.comments || 'Not Provided',
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
    frameModule.topmost().goBack();
}

function _updateUi() {
    // also need to reset fields to initials
    source.statusVisibility = "visible";
    source.formVisibility = "collapse";
}

// The binding
let source = fromObject({
    name: appJson.name,
    title: undefined,
    inputTypes: ["Input Type 1", "Input Type 2", "Input Type 3", "Input Type 4"],
    selectedType: undefined,
    selectedDate: undefined,
    selectedTime: undefined,
    state: false,
    ratings: 1,
    comments: undefined,
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