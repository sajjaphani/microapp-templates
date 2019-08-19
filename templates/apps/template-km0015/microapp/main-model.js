const fromObject = require("~/common/modules/data/observable").fromObject;

var frames = require("~/common/modules/ui/frame");
const imageSourceModule = require("~/common/modules/image-source");

const { create, upload } = require("~/common/kinvey-service");
const { takePicture, getTempFile } = require("~/common/utility-service");
const { showAlert } = require("~/common/utility-service");

let appJson = require("../app.json");

function _loaded(args) {
    source.currentView = args.object;
    source.statusVisibility = "collapse";
    source.formVisibility = "visible";
}

function _onSubmitTapped(args) {
    const data = {
        name: 'Ticket',
        when: source.selectedDate,
        submittedOn: new Date().toISOString(),
        from: {
            name: 'Paul Hoffman',
            avatar: '~/images/profiles/paul.png',
        },
        summary: source.summary, category: source.selectedCategory,
        businessService: source.selectedService, impact: source.selectedImpact,
        priority: source.selectedPriority,
        status: 'New',
        attachments: source.attachments
    };

    create(appJson.collectionName, data)
        .subscribe(
            data => { _updateUi() },
            error => { showAlert("Problem in Performing Action", error.message) },
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
            _source.fromAsset(imageAsset)
                .then((imageSource) => {
                    source.cameraImage = imageAsset;
                    source.imageName = 'Image Selected.'
                    return imageSource;
                }).then((imageSource) => {
                    let imagePath = getTempFile('png');
                    imageSource.saveToFile(imagePath, 'png');
                    return upload(imagePath)
                }).then(file => {
                    source.attachments[0] = {
                        type: 'kfile',
                        contents: file._filename
                    };
                });
        }).catch(function (err) {
            console.log("Error -> " + err.message);
        });
}

function _updateUi() {
    // reset fields to initials
    source.statusVisibility = "visible";
    source.formVisibility = "collapse";
}

// The binding
let source = fromObject({
    name: appJson.name,
    date: new Date(),
    selectedDate: "Select Date",
    imageName: "Upload Photo",
    cameraImage: undefined,
    summary: undefined,
    attachments: [],
    selectedCategory: "Category",
    categoryTypes: ["Breakdown", "Service Ticket", "Routine Check", "Other"],
    selectedService: "Business Service",
    serviceTypes: ["Fabrication", "Production Line", "Other"],
    selectedImpact: "Impact",
    impactTypes: ["Delay Production", "Production Downtime", "Other"],
    selectedPriority: "Priority",
    priorityTypes: ["High", "Medium", "Low"],
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