const fromObject = require("~/common/modules/data/observable").fromObject;

const ObservableArray = require("~/common/modules/data/observable-array").ObservableArray;

const { isIOS } = require("~/common/modules/platform");
const { Color } = require("~/common/modules/color");

const { fetchAll } = require("~/common/kinvey-service");

const appJson = require("../app.json");

function _loaded(args) {
    if (!args.object)
        return;

    _setInitData(args.object);
}

function _setInitData(view) {
    source.currentView = view;
    source.name = appJson.name;
    source.items = new ObservableArray();
    source.originalItems = source.items;

    let txt = source.currentView.getViewById("catalog-search-filter");
    txt && txt.on("textChange", (e) => {
        let value = e.value;
        if (value) {
            source.items = source.originalItems.filter(item => {
                return (
                    item.name.toLowerCase().indexOf(value) !== -1 ||
                    item.desc.toLowerCase().indexOf(value) !== -1
                );
            });
        }
    });

    _fetchAndUpdateData(null)
}

function _unloaded() {
    source.items.splice(0, source.items.length, ...[]);
    source.originalItems = source.items;
}

function _toFormattedObject(item) {
    return fromObject({
        id: item._id,
        name: item.name,
        desc: item.desc,
        price: item.price,
        imageSrc: item.imageSrc
    });
}

function _fetchAndUpdateData(args) {
    if (appJson.useTestData) {
        const testData = require("./sample-data.json");
        const items = testData.map(item => {
            return _toFormattedObject(item)
        });

        source.items.splice(0, source.items.length, ...items);
        source.originalItems = source.items;
    } else {
        fetchAll(appJson.collectionName)
            .subscribe(
                data => {
                    const items = data.map(item => {
                        return _toFormattedObject(item)
                    });

                    source.items.splice(0, source.items.length, ...items);
                    source.originalItems = source.items;
                },
                error => { console.log(error) },
                () => { });
    }
}

function _onCloseTapped(args) {
    let listView = source.currentView.getViewById("catalog-items-list");
    listView.deselectAll();
    source.listItemsVisibility = "visible";
    source.itemDetailsVisibility = "collapse";
}

function _onItemLoading(args) {
    if (isIOS) {
        var newcolor = new Color("#e6e6e6");
        args.ios.backgroundView.backgroundColor = newcolor.ios;
    }
}

function _onItemSelected(item) {
    source.selectedItem = source.items.getItem(item.index);
    source.listItemsVisibility = "collapse";
    source.itemDetailsVisibility = "visible";
}

// The binding
let source = fromObject({
    name: appJson.name,
    searchFilter: undefined,
    items: new ObservableArray([]),
    originalItems: undefined,
    selectedItem: undefined,
    currentView: undefined,
    listItemsVisibility: 'visible',
    itemDetailsVisibility: 'collapse',
    onItemLoading: (args) => {
        _onItemLoading(args);
    },
    onItemSelected: (args) => {
        _onItemSelected(args);
    },
    onCloseTapped: (args) => {
        _onCloseTapped(args);
    },
    loaded: (args) => {
        _loaded(args);
    },
    unloaded: (args) => {
        _unloaded(args);
    },
});

exports.model = source;