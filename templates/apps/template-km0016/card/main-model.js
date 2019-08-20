const ObservableArray = require("~/common/modules/data/observable-array").ObservableArray;
const fromObject = require("../../template-km0006/microapp/node_modules/~/common/modules/data/observable").fromObject;

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

function _getFirstAttachment(attachments) {
    attachments = attachments || [];

    return attachments[0]
}

function _toFormattedObject(item) {
    return getImageSource(_getFirstAttachment(item.attachments))
        .then(imgSrc => {
            return fromObject({
                id: item._id,
                name: item.name,
                submittedOn: fromNow(item.submittedOn),
                from: fromObject(item.from),
                image: imgSrc,
                priority: item.priority,
                summary: item.summary,
                data: new ObservableArray([
                    fromObject({ key: 'Date', value: toDate(item.when) }),
                    fromObject({ key: 'Category', value: item.category }),
                    fromObject({ key: 'Business Service', value: item.businessService }),
                    fromObject({ key: 'Impact', value: item.impact }),
                    fromObject({ key: 'Priority', value: item.priority }),
                ]),
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
        cancelEvent.text = "Ticket Accepted";
        view.addChild(cancelEvent);
    } else {
        let view = source.currentView.getViewById(item.id);
        view.removeChildren();
        let cancelEvent = new EventCancel();
        cancelEvent.text = "Ticket Cancelled";
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