const fromObject = require("~/common/modules/data/observable").fromObject;
var frames = require("~/common/modules/ui/frame");
const imageSourceModule = require("~/common/modules/image-source");

const { create } = require("~/common/kinvey-service");
const { takePicture } = require("~/common/utility-service");

let appJson = require("../app.json");

function _loaded(args) {
    source.currentView = args.object;
    source.statusVisibility = "collapse";
    source.formVisibility = "visible";
}

function _onSubmitTapped(args) {
    const data = {
        name: 'Expenses', when: source.when,
        submittedOn: new Date().toISOString(),
        from: {
            name: 'Sandra Young',
            avatar: '~/images/profiles/sandra.png',
        },
        title: source.title,
        type: source.selectedExpenseType,
        place: source.place,
        dateOfExpense: source.when,
        amount: source.amount,
        comments: source.comments,
        status: 'New',
        attachments: source.attachments
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

function _onUploadTapped(args) {
    takePicture()
        .then(function (imageAsset) {
            let _source = new imageSourceModule.ImageSource();
            _source.fromAsset(imageAsset).then((imageSource) => {
                const base64image = imageSource.toBase64String('png');
                source.attachments[0] = {
                    type: 'base64',
                    contents: base64image
                };
            });

            source.cameraImage = imageAsset;
            source.imageName = 'Receipt Selected.'
        }).catch(function (err) {
            console.log("Error -> " + err.message);
        });
}

function updateUi() {
    // reset fields to initials
    source.statusVisibility = "visible";
    source.formVisibility = "collapse";
}

// The binding
let source = fromObject({
    name: appJson.name,
    expenseTypes: ["Client Visit", "Team activities", "Marketing", "Miscellaneous"],
    expenseTypeVisibility: "collapse",
    selectedExpenseType: "Expense Type",
    canUpdateExpenseType: false,
    date: new Date(),
    when: undefined,
    title: undefined,
    place: undefined,
    amount: undefined,
    comments: undefined,
    attachments: [],
    selectedDateVisibility: "collapse",
    selectedDate: "Expense Date",
    canUpdateDate: false,
    cameraImage: undefined,
    imageName: "Upload Receipt",
    formVisibility: "visible",
    statusVisibility: "collapse",
    currentView: undefined,
    onUploadTapped: (args) => {
        _onUploadTapped(args)
    },
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