const ObservableArray = require("~/common/modules/data/observable-array").ObservableArray;
const fromObject = require("~/common/modules/data/observable").fromObject;

const StackLayout = require("~/common/modules/ui/layouts/stack-layout").StackLayout;
const Image = require("~/common/modules/ui/image").Image;

const { EventCancel } = require("~/cards");

const { fromNow, toDate } = require("~/common/transformations");

const { fetchAll } = require("~/common/kinvey-service");

const appJson = require("../app.json");

function _loaded(args) {
    if (source.initialized && source.currentView)
        return;

    _fetchAndUpdateData(args);
    source.currentView = args.object;
    source.initialized = true;
}

function _toFormattedObject(item) {
    return fromObject({
        id: item._id,
        name: item.name,
        when: toDate(item.when),
        submittedOn: fromNow(item.submittedOn),
        from: fromObject(item.from),
        comments: item.comments,
        payslipImageUrl: item.payslipImageUrl
    });
}

function _fetchAndUpdateData(args) {
    if (appJson.useTestData) {
        // Use testdata
        const testData = require("./sample-data.json");
        const items = testData.map(item => {
            return _toFormattedObject(item)
        });

        source.items.splice(0, source.items.length, ...items);
        _checkEventDataAvailability();
    } else {
        // Query a collection
        fetchAll(appJson.collectionName)
            .subscribe(
                data => {
                    const items = data.map(item => {
                        return _toFormattedObject(item)
                    });

                    source.items.splice(0, source.items.length, ...items);
                    _checkEventDataAvailability();
                },
                error => { console.log(error) },
                () => { });
    }
}

function _onDownloadTapped(args) {
    console.log('Handle download yourself...')
}

function _onCancelTapped(args) {
    let item = args.object.bindingContext;
    let view = source.currentView.getViewById(item.id);
    view.removeChildren();
    let cancelEvent = new EventCancel();
    cancelEvent.text = "Payslip Dismissed";
    view.addChild(cancelEvent);

    setTimeout(() => {
        let _index = source.items.indexOf(item);
        source.items.splice(_index, 1);
        _checkEventDataAvailability();
    }, 1000);
}

function _onMoreTapped(args) {
    const mainView = args.object;
    let itemId = args.object.id;
    let itemIndex = source.items.map(function (item) { return item.id; }).indexOf(itemId);
    let item = source.items.getItem(itemIndex);

    let image = new Image();
    image.src = item.payslipImageUrl;
    image.stretch = 'aspectFill'

    let modelContent = new StackLayout();
    modelContent.cssClasses.add("m-10");
    modelContent.addChild(image);

    const context = { view: modelContent };

    setTimeout(() => {
        const modalViewModule = "modal/modal-view";
        const fullscreen = true;
        mainView.showModal(modalViewModule, context, () => {
            // console.log('modal closed');
        }, fullscreen);
    }, 100);
}

function _checkEventDataAvailability() {
    let hasData = source.items.length > 0;
    if (!hasData) {
        source.notificationsVisibility = "collapse";
        source.noNotificationsVisibility = "visible";
    } else {
        source.notificationsVisibility = "visible";
        source.noNotificationsVisibility = "collapse";
    }
}

// The binding
let source = fromObject({
    name: appJson.name,
    notificationsVisibility: "collapse",
    noNotificationsVisibility: "visible",
    items: new ObservableArray(),
    currentView: undefined,
    initialized: false,
    onDownloadTapped: (args) => {
        _onDownloadTapped(args)
    },
    onCancelTapped: (args) => {
        _onCancelTapped(args);
    },
    onMoreTapped: (args) => {
        _onMoreTapped(args);
    },
    loaded: (args) => {
        _loaded(args);
    },
    unloaded: (args) => {
        // Do nothing
    },
});

exports.model = source;