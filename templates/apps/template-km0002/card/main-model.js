const ObservableArray = require("~/common/modules/data/observable-array").ObservableArray;
const fromObject = require("~/common/modules/data/observable").fromObject;

const StackLayout = require("~/common/modules/ui/layouts/stack-layout").StackLayout;
const Image = require("~/common/modules/ui/image").Image;

const { EventAccept, EventCancel } = require("~/cards");

const { PullToRefresh } = require("~/common/subscriptions");
const { fromNow, toDate } = require("~/common/transformations");
const { fetchAll, update } = require("~/common/kinvey-service");
const { getImageSource, showAlert } = require("~/common/utility-service");

const appJson = require("../app.json");
const _ACCEPT_STATE = 'Accept';
const _CANCEL_STATE = 'Cancel';

function _loaded(args) {
    if (!source.pullToRefresh) {
        source.pullToRefresh = PullToRefresh.subscribe(() => {
            _fetchAndUpdateData(args);
        });
    }

    if (source.initialized && source.currentView)
        return;

    _fetchAndUpdateData(args);
    source.name = appJson.name;
    source.currentView = args.object;
    source.initialized = true;
}

function formatAttachments(attachments) {
    let obsArray = new ObservableArray();
    if (attachments && attachments.length > 0) {
        attachments.forEach((item, index) => {
            obsArray.push(fromObject({
                id: index,
                type: item.type,
                contents: item.contents,
                onAttachmentTapped: (args) => {
                    _onAttachmentTapped(args);
                }
            }))
        })
    }

    return obsArray;
}

function _toFormattedObject(item) {
    return getImageSource(item.attachment)
        .then(imgSrc => {
            return fromObject({
                id: item._id,
                name: item.name,
                when: toDate(item.when),
                submittedOn: fromNow(item.submittedOn),
                from: fromObject(item.from),
                image: imgSrc,
                priority: item.priority,
                comments: item.comments,
                data: new ObservableArray([
                    fromObject({ key: 'Title', value: item.title }),
                    fromObject({ key: 'Date of Expense', value: item.dateOfExpense }),
                    fromObject({ key: 'Amount', value: item.amount }),
                    fromObject({ key: 'Place', value: item.place }),
                ]),
                attachments: formatAttachments(item.attachments)
            });
        })
}

function _fetchAndUpdateData(args) {
    if (appJson.useTestData) {
        // Use testdata
        const testData = require("./sample-data.json");
        const items = testData.map(item => {
            return _toFormattedObject(item).then(_item => {
                return _item;
            });
        });
        Promise.all(items).then(_items => {
            source.items.splice(0, source.items.length, ..._items);
            _checkEventDataAvailability();
        });
    } else {
        // Query a collection
        fetchAll(appJson.collectionName)
            .subscribe(
                data => {
                    const items = data.map(item => {
                        return _toFormattedObject(item).then(_item => {
                            return _item;
                        });
                    });
                    Promise.all(items).then(_items => {
                        source.items.splice(0, source.items.length, ..._items);
                        _checkEventDataAvailability();
                    });
                },
                error => { console.log(error) },
                () => { });
    }
}

function _unloaded(args) {
    source.pullToRefresh && source.pullToRefresh.unsubscribe();
    source.pullToRefresh = undefined;
}

function _updateUiAndRemoveItem(item, status) {
    if (status == _ACCEPT_STATE) {
        let view = source.currentView.getViewById(item.id);
        view.removeChildren();
        let cancelEvent = new EventAccept();
        cancelEvent.text = "Expenses Accepted";
        view.addChild(cancelEvent);
    } else {
        let view = source.currentView.getViewById(item.id);
        view.removeChildren();
        let cancelEvent = new EventCancel();
        cancelEvent.text = "Expenses Cancelled";
        view.addChild(cancelEvent);
    }

    setTimeout(() => {
        let _index = source.items.indexOf(item);
        source.items.splice(_index, 1);
        _checkEventDataAvailability();
    }, 1000);
}

function _updateRecord(item, updates, status) {
    update(appJson.collectionName, item.id, updates)
        .subscribe(
            data => { data ? _updateUiAndRemoveItem(item, status) : showAlert("Problem in Performing Action", "There is some problem in performing the action.") },
            error => { showAlert("Problem in Performing Action", error.message) },
            () => { });
}

function _onAcceptTapped(args) {
    let item = args.object.bindingContext;
    if (appJson.useTestData) {
        _updateUiAndRemoveItem(item, _ACCEPT_STATE);
    } else {
        let updates = { status: _ACCEPT_STATE };
        _updateRecord(item, updates, _ACCEPT_STATE);
    }
}

function _onCancelTapped(args) {
    let item = args.object.bindingContext;
    if (appJson.useTestData) {
        _updateUiAndRemoveItem(item, _CANCEL_STATE);
    } else {
        let updates = { status: _CANCEL_STATE };
        _updateRecord(item, updates, _CANCEL_STATE);
    }
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

function changeVisibility(visibility) {
    if (visibility == 'collapse')
        return 'visible';

    return 'collapse';
}

function _onMoreTapped(args) {
    let viewId = args.object.viewId;
    let page = source.currentView;
    let view = page.getViewById(viewId);
    if (view) {
        let newVisibility = changeVisibility(view.visibility);
        view.visibility = newVisibility;
    }
}

function _onAttachmentTapped(args) {
    const mainView = args.object;
    let attachmentId = args.object.attachmentId;
    let itemId = args.object.itemId;
    let itemIndex = source.items.map(function (item) { return item.id; }).indexOf(itemId);
    let item = source.items.getItem(itemIndex);

    getImageSource(item.attachments.getItem(attachmentId))
        .then(imgSrc => {
            let image = new Image();
            image.src = imgSrc;
            image.stretch = 'aspectFill'

            let modelContent = new StackLayout();
            modelContent.cssClasses.add("m-10");
            modelContent.addChild(image);

            const context = { view: modelContent };

            setTimeout(() => {
                const modalViewModule = "modal/modal-view";
                const fullscreen = true;
                mainView.showModal(modalViewModule, context, () => {
                }, fullscreen);
            }, 100);
        });
}

// The binding
let source = fromObject({
    name: appJson.name,
    notificationsVisibility: "collapse",
    noNotificationsVisibility: "visible",
    items: new ObservableArray(),
    currentView: undefined,
    initialized: false,
    pullToRefresh: undefined,
    onAcceptTapped: (args) => {
        _onAcceptTapped(args)
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
        _unloaded(args);
    },
});

exports.model = source;