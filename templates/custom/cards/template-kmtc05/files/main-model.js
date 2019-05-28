const ObservableArray = require("~/common/modules/data/observable-array").ObservableArray;
const fromObject = require("~/common/modules/data/observable").fromObject;

const appJson = require("../app.json");

function _loaded(args) {
    if (source.initialized && source.currentView)
        return;

    _fetchAndUpdateData(args);
    source.name = appJson.name;
    source.currentView = args.object;
    source.initialized = true;
}

function _getBindingObject() {
    return fromObject({
        id: 'some-custom-id',
        name: 'Event Name',
        submittedOn: 'submitted date',
        from: fromObject({
            "name": "User Name",
            "avatar": "~/images/profiles/user.png"
        }),
        eventInfo: "A Date or Pririty Etc.",
        eventPriority: "normal", // "high", "medium", "low"
    });
}

function _fetchAndUpdateData(args) {
    const items = [_getBindingObject()];

    source.items.splice(0, source.items.length, ...items);
    _checkEventDataAvailability();
}

function _unloaded(args) {
    // Do something when unloaded
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
    loaded: (args) => {
        _loaded(args);
    },
    unloaded: (args) => {
        _unloaded(args);
    },
});

exports.model = source;