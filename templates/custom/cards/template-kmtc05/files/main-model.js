const ObservableArray = require("~/common/modules/data/observable-array").ObservableArray;
const fromObject = require("~/common/modules/data/observable").fromObject;

const { PullToRefresh } = require("~/common/subscriptions");
const { fromNow, toDate } = require("~/common/transformations");
const { fetchAll } = require("~/common/kinvey-service");

const appJson = require("../app.json");

const itemIcon = String.fromCharCode(0xf10c);
const itemSelectedIcon = String.fromCharCode(0xf111);

const itemClass = 'fa poll-choice';
const itemSelectedClass = 'fa poll-selected';

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

function _formatOptions(options) {
    let obsArray = new ObservableArray();
    if (options && options.length > 0) {
        options.forEach((item) => {
            item.icon = itemIcon;
            item.class = itemClass;
            item.onChoiceTapped = (args) => {
                _onChoiceTapped(args);
            };
            obsArray.push(fromObject(item))
        })
    }

    return obsArray;
}

function _formatResults(result) {
    let obsArray = new ObservableArray();
    if (result && result.length > 0) {
        result.forEach((item) => {
            obsArray.push(fromObject(item))
        })
    }

    return obsArray;
}

function _toFormattedObject(item) {
    return fromObject({
        id: item._id,
        name: item.name,
        when: toDate(item.when),
        submittedOn: fromNow(item.submittedOn),
        from: fromObject(item.from),
        to: item.to,
        title: item.title,
        data: _formatOptions(item.data),
        result: _formatResults(item.result),
        selectedChoice: ''
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

function _onAcceptTapped(args) {
    // TODO connect to backend and upate
    let id = args.object.id;
    let optionsView = source.currentView.getViewById('options-visible-' + id);
    if (optionsView) {
        let newVisibility = changeVisibility(optionsView.visibility);
        optionsView.visibility = newVisibility;
    }

    setTimeout(() => {
        let doneView = source.currentView.getViewById('options-done-' + id);
        if (doneView) {
            let newVisibility = changeVisibility(doneView.visibility);
            doneView.visibility = newVisibility;
        }
    }, 100);
}

function _onCancelTapped(args) {
    // TODO connect to backend and upate
    let id = args.object.id;
    var itemIndex = source.items.map(function (item) { return item.id; }).indexOf(id);
    source.items.splice(itemIndex, 1);
    _checkEventDataAvailability();
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

function _onChoiceTapped(args) {
    let choiceId = args.object.id;
    let parent = args.object.parent;
    let parentId = parent.bindingContext.id;

    let itemIndex = source.items.map(function (item) { return item.id; }).indexOf(parentId);
    let item = source.items.getItem(itemIndex);
    let lastSelected = item.selectedChoice;
    if (lastSelected && lastSelected != choiceId) {
        let dataItemIndex = item.data.map(function (item) { return item.id; }).indexOf(lastSelected);
        let dataItem = item.data.getItem(dataItemIndex);
        dataItem.icon = itemIcon;
        dataItem.class = itemClass;
    }
    let dataItemIndex = item.data.map(function (item) { return item.id; }).indexOf(choiceId);
    let dataItem = item.data.getItem(dataItemIndex);
    dataItem.icon = itemSelectedIcon;
    dataItem.class = itemSelectedClass;
    item.selectedChoice = choiceId;
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
        // No binding
    },
    loaded: (args) => {
        _loaded(args);
    },
    unloaded: (args) => {
        _unloaded(args);
    },
});

exports.model = source;