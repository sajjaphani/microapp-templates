const ObservableArray = require("~/common/modules/data/observable-array").ObservableArray;
const fromObject = require("~/common/modules/data/observable").fromObject;

const StackLayout = require("~/common/modules/ui/layouts/stack-layout").StackLayout;
const ScrollView = require("~/common/modules/ui/scroll-view").ScrollView;
const Label = require("~/common/modules/ui/label").Label;
const Image = require("~/common/modules/ui/image").Image;
const appSettingsModule = require("~/common/modules/application-settings");

const { EventHeader, EventCancel } = require("~/cards");

const { PullToRefresh } = require("~/common/subscriptions");
const { fromNow } = require("~/common/transformations");
const { fetchAll } = require("~/common/kinvey-service");
const { toRange } = require("~/common/transformations");

const appJson = require("../app.json");

const eventIcon = String.fromCharCode(0xf0f2);
const _LAST_SAVED_PASS_KEY = "_LAST_SAVED_PASS_KEY";

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

    let recentItem = appSettingsModule.getString(_LAST_SAVED_PASS_KEY);
    source.recentItem = JSON.parse(recentItem || "{}");
}

function _toFormattedObject(item) {
    return fromObject({
        id: item._id,
        name: item.name,
        when: item.when,
        summary: item.summary,
        submittedOn: fromNow(item.submittedOn),
        from: fromObject(item.from)
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

function _onCancelTapped(args) {
    // TODO connect to backend and upate
    let item = args.object.bindingContext;
    let view = source.currentView.getViewById(item.id);
    view.removeChildren();
    let cancelEvent = new EventCancel();
    cancelEvent.text = "Event Dismissed";
    view.addChild(cancelEvent);

    setTimeout(() => {
        let _index = source.items.indexOf(item);
        source.items.splice(_index, 1);
        _checkEventDataAvailability();
    }, 1000);
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

function _onMoreTapped(args) {
    let item = args.object.bindingContext;
    let passItem = source.recentItem;
    let passValidity = toRange(passItem.fromDate, passItem.toDate);
    let passFilePath = passItem.passFilePath

    let modelContent = new StackLayout();

    let header = new EventHeader();
    header.fromName = item.from.name;
    header.fromAvatar = item.from.avatar;
    header.submittedOn = item.submittedOn;
    header.eventName = item.name;
    header.eventIcon = eventIcon;
    header.eventInfo = passValidity
    modelContent.addChild(header);

    let line = new StackLayout();
    line.cssClasses.add('m-t-10');
    line.cssClasses.add('h-line');
    modelContent.addChild(line);

    let image = new Image();
    image.src = passFilePath;
    image.stretch = 'aspectFill';
    image.cssClasses.add('m-10');
    modelContent.addChild(image);

    let blogView = new ScrollView();
    blogView.content = modelContent;

    const view = args.object;
    const context = { view: blogView };
    const closeCallback = () => {
        // console.log('closed')
    };

    setTimeout(() => {
        const modalViewModule = "modal/modal-view";
        view.showModal(modalViewModule, context, closeCallback, true);
    }, 100);
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