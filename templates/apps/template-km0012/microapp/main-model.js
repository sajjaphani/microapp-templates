const fromObject = require("~/common/modules/data/observable").fromObject;

const imageSourceModule = require("~/common/modules/image-source");
const appSettingsModule = require("~/common/modules/application-settings");

const { create, upload } = require("~/common/kinvey-service");
const { toRange } = require("~/common/transformations");
const { takePicture, getTempFile, showAlert, viewToImageSource } = require("~/common/utility-service");

let appJson = require("../app.json");

const _LAST_SAVED_PASS_KEY = "_LAST_SAVED_PASS_KEY";

const _USER_IMAGE = 'https://storage.googleapis.com/1260b1c390e14f6bae3d391c74665860/b43e3acb-e0b5-4cc2-a0e5-bac54f702747/default_user.png';
const _AUTHORITY_LOGO = 'https://storage.googleapis.com/1260b1c390e14f6bae3d391c74665860/a90258e4-c5a7-4bc3-8dc4-20c246380050/logo2.png';
const _AUTHORITY_SIGN = 'https://storage.googleapis.com/1260b1c390e14f6bae3d391c74665860/77509c57-d40a-4c51-a892-bdb3ea326317/sign_authority.png';
const _AUTHORITY_BARCODE = 'https://storage.googleapis.com/1260b1c390e14f6bae3d391c74665860/6e820657-4ab1-4474-b3ea-8a94abdef7d7/qr-pdf147.png';

function _loaded(args) {
    source.currentView = args.object;
    source.passVisibility = "collapse";
    source.sendingMailVisibility = "collapse";
    source.formVisibility = "visible";
}

function _onCreateTapped(args) {
    source.passValidity = toRange(source.fromDate, source.toDate);
    source.passVisibility = 'visible';
}

function _onCaptureImageTapped(args) {
    takePicture()
        .then(function (imageAsset) {
            let _source = new imageSourceModule.ImageSource();
            _source.fromAsset(imageAsset)
                .then((imageSource) => {
                    let imagePath = getTempFile('png');
                    imageSource.saveToFile(imagePath, 'png');
                    return imagePath;
                }).then(file => {
                    source.userImage = file;
                });
        }).catch(function (err) {
            console.log("Error -> " + err.message);
        });
}

function _updateUi() {
    // reset fields to initials
    source.passVisibility = "collapse";
    source.formVisibility = "visible";
    showAlert('Guest Pass', 'Guest Pass has been successfully sent to ' + source.email + ".")
}

function _onSendTapped(args) {
    source.sendingMailVisibility = "visible";
    let view = source.currentView.getViewById('guestpass-view');
    if (view) {
        let imageSrc = viewToImageSource(view);
        if (imageSrc) {
            let imagePath = getTempFile('png');
            imageSrc.saveToFile(imagePath, 'png');
            upload(imagePath).then(file => {
                let data = {
                    name: 'Guest Pass',
                    fullName: source.fullName,
                    orgName: source.orgName,
                    contactNo: source.contactNo,
                    email: source.email,
                    fromDate: source.fromDate,
                    toDate: source.toDate,
                    selectedFacility: source.selectedFacility,
                    passImageId: file._id
                };
                let recentItem = data;
                recentItem.passFilePath = imagePath;

                create(appJson.collectionName, data)
                    .subscribe(
                        data => {
                            appSettingsModule.setString(_LAST_SAVED_PASS_KEY, JSON.stringify(recentItem));
                            _updateUi()
                        },
                        error => { console.log(error) },
                        () => { source.sendingMailVisibility = "collapse"; });
            });
        }
    }
}

// The binding
let source = fromObject({
    name: appJson.name,
    date: new Date(),
    userImage: _USER_IMAGE,
    authorityLogo: _AUTHORITY_LOGO,
    authoritySign: _AUTHORITY_SIGN,
    authorityBarcode: _AUTHORITY_BARCODE,
    fullName: undefined,
    orgName: undefined,
    contactNo: undefined,
    email: undefined,
    fromDate: undefined,
    toDate: undefined,
    passValidity: undefined,
    facilityTypes: ["New York, NY", "Los Angeles, CA", "Englewood Cliffs, NJ", "Universal City, CA", "Stamford, CT", "Miami, FL"],
    selectedFacility: undefined,
    formVisibility: "visible",
    passVisibility: "collapse",
    sendingMailVisibility: 'collapse',
    currentView: undefined,
    isCreateEnabled: (args) => {
        let canEnable = !source.fullName || !source.orgName || !source.selectedFacility
            || !source.contactNo || !source.email || !source.fromDate || !source.toDate;

        return !canEnable;
    },
    onCreateTapped: (args) => {
        _onCreateTapped(args);
    },
    onCaptureImageTapped: (args) => {
        _onCaptureImageTapped(args);
    },
    onDiscardTapped: (args) => {
        source.passVisibility = 'collapse';
    },
    onSendTapped: (args) => {
        _onSendTapped(args);
    },
    loaded: (args) => {
        _loaded(args);
    },
    unloaded: (args) => {
        // Not bound
    },
});

exports.model = source;