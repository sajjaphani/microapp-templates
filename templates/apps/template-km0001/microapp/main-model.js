const fromObject = require("~/common/modules/data/observable").fromObject;

var frames = require("~/common/modules/ui/frame");

const { create } = require("~/common/kinvey-service");

let appJson = require("../app.json");

function _loaded(args) {
    source.currentView = args.object;
    source.statusVisibility = "collapse";
    source.formVisibility = "visible";
}

function _onSubmitTapped(args) {
    const data = {
        name: source.selectedVacationType,
        fromDate: source.fromDate, toDate: source.toDate,
        submittedOn: new Date().toISOString(),
        from: {
            name: 'Sandra Young',
            avatar: '~/images/profiles/sandra.png',
        },
        comments: source.comments, status: 'New'
    };

    create(appJson.collectionName, data)
        .subscribe(
            data => { updateUi() },
            error => { console.log(error) },
            () => { });
}

function _onCreateNewTapped(args) {
    source.statusVisibility = "collapse";
    source.formVisibility = "visible";
}

function _onCloseTapped(args) {
    frames.topmost().goBack();
}

function updateUi() {
    // reset fields to initials
    source.statusVisibility = "visible";
    source.formVisibility = "collapse";
}

// The binding
let source = fromObject({
    name: appJson.name,
    vacationTypes: ["Vacation", "Sick Leave", "Paid Leave", "Special Leave"],
    selectedVacationType: "Vacation",
    date: new Date(),
    fromDate: undefined,
    toDate: undefined,
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
        // Not bound
    },
});

exports.model = source;