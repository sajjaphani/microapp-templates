const ObservableArray = require("~/common/modules/data/observable-array").ObservableArray;
const fromObject = require("~/common/modules/data/observable").fromObject;

const Label = require("~/common/modules/ui/label").Label;
const StackLayout = require("~/common/modules/ui/layouts/stack-layout").StackLayout;
const ScrollView = require("~/common/modules/ui/scroll-view").ScrollView;

const { EventHeader, EventAccept, EventCancel } = require("~/cards");

const { PullToRefresh } = require("~/common/subscriptions");
const { fromNow } = require("~/common/transformations");

const { fetchAll, update } = require("~/common/kinvey-service");
const { showAlert } = require("~/common/utility-service");

const appJson = require("../app.json");

const eventIcon = String.fromCharCode(0xf0f2);

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

function _toFormattedObject(item) {
    return fromObject({
        id: item._id,
        name: item.name,
        submittedOn: fromNow(item.submittedOn),
        from: fromObject(item.from),
        eventInfo: item.eventInfo,
        eventPriority: "normal", // "high", "medium", "low"
        comments: item.comments
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

function _unloaded(args) {
    source.pullToRefresh && source.pullToRefresh.unsubscribe();
    source.pullToRefresh = undefined;
}

function _updateUiAndRemoveItem(item, status) {
    if (status == _ACCEPT_STATE) {
        let view = source.currentView.getViewById(item.id);
        view.removeChildren();
        let cancelEvent = new EventAccept();
        cancelEvent.text = "Event Accepted";
        view.addChild(cancelEvent);
    } else {
        let view = source.currentView.getViewById(item.id);
        view.removeChildren();
        let cancelEvent = new EventCancel();
        cancelEvent.text = "Event Cancelled";
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

function _onMoreTapped(args) {
    let item = args.object.bindingContext;
    let modelContent = new StackLayout();

    let header = new EventHeader();
    header.fromName = item.from.name;
    header.fromAvatar = item.from.avatar;
    header.submittedOn = item.submittedOn;
    header.eventName = item.name;
    header.eventIcon = eventIcon;
    header.eventInfo = item.to
    modelContent.addChild(header);

    let line = new StackLayout();
    line.cssClasses.add('m-t-10');
    line.cssClasses.add('line');
    modelContent.addChild(line);

    let additionalLabel = new Label()
    additionalLabel.text = "Add your own additional contents that are relevant to the event here.";
    additionalLabel.cssClasses.add('eloha-font-regular')
        .add('blog-title').add('m-10');
    additionalLabel.textWrap = true;
    modelContent.addChild(additionalLabel);

    let detailedView = new ScrollView();
    detailedView.content = modelContent;

    const view = args.object;
    const context = { view: detailedView };
    const closeCallback = () => {
        // console.log('closed')
    };

    setTimeout(() => {
        const modalViewModule = "modal/modal-view";
        view.showModal(modalViewModule, context, closeCallback, true);
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