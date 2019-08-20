const fromObject = require("~/common/modules/data/observable").fromObject;

const ObservableArray = require("~/common/modules/data/observable-array").ObservableArray;

const { isIOS } = require("~/common/modules/platform");
const { Color } = require("~/common/modules/color");
const fs = require("~/common/modules/file-system");

const { fetchAll } = require("~/common/kinvey-service");

const appJson = require("../app.json");

const caftList = ["Cafeteria A, Building No: 1",
    "Cafeteria B, Building No: 1",
    "Cafeteria C, Building No: 2",
    "Terrace Cafe, Building No: 3"];

function _loaded(args) {
    if (!args.object)
        return;

    source.name = appJson.name;
    let view = args.object;
    source.currentView = view;

    _fetchAndUpdateData(args)
}

function _unloaded() {
    source.items.splice(0, source.items.length, ...[]);
    source.originalItems = source.items;
}

function getImagePath(imageSrc) {
    var relPath = imageSrc.replace('~', '');
    return fs.path.join(__dirname, '../', relPath);
}

function _toFormattedObject(item) {
    return fromObject({
        id: item._id,
        name: item.name,
        desc: item.desc,
        price: item.price,
        imageSrc: getImagePath(item.imageSrc),
        quantity: 0,
        quantityVisibility: 'visible',
        onAddItemTapped: (args) => {
            let item = args.object.bindingContext;
            item.quantity = item.quantity + 1;
            item.quantityVisibility = 'visible';
            source.orderValue = parseFloat((item.price + source.orderValue).toFixed(2));
            source.hasOrderVisibility = 'visible';
        },
        onRemoveItemTapped: (args) => {
            let item = args.object.bindingContext;
            if (item.quantity > 0) {
                source.orderValue = parseFloat((source.orderValue - item.price).toFixed(2));
                item.quantity = item.quantity - 1;
            }
            if (item.quantity == 0)
                item.quantityVisibility = 'collapse';
            if (source.orderValue == 0)
                source.hasOrderVisibility = 'collapse';
        }
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
        source.originalItems = source.items;
        source.cafetariaList.splice(0, source.cafetariaList.length, ...caftList);

        setTimeout(() => {
            source.items.forEach(item => {
                item.quantityVisibility = 'collapse';
            });
        }, 100);
    } else {
        // Query a collection
        fetchAll(appJson.collectionName, undefined, false)
            .subscribe(
                data => {
                    const items = data.map(item => {
                        return _toFormattedObject(item)
                    });

                    source.items.splice(0, source.items.length, ...items);
                    source.originalItems = source.items;
                    source.cafetariaList.splice(0, source.cafetariaList.length, ...caftList);

                    setTimeout(() => {
                        source.items.forEach(item => {
                            item.quantityVisibility = 'collapse';
                        });
                    }, 100);
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
    let listView = source.currentView.getViewById("catalog-items-list");
    listView.deselectAll();
}

// The binding
let source = fromObject({
    name: appJson.name,
    listItemsVisibility: 'visible',
    cafeteriaSelectionVisibility: 'collapse',
    itemDetailsVisibility: 'collapse',
    searchFilter: undefined,
    orderSummaryVisibility: 'collapse',
    selectedCafeteria: 'Cafeteria A, Building No: 1',
    // items: items,
    items: new ObservableArray(),
    cafetariaList: new ObservableArray(),
    originalItems: undefined,
    selectedItem: undefined,
    currentView: undefined,
    hasOrderVisibility: 'collapse',
    orderValue: 0,
    order_container_class: '',
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
        // Not bound
        _unloaded(args);
    },
    onShowCafListTapped: (args) => {
        source.cafeteriaSelectionVisibility = 'visible';
    },
    onCafeteriaItemTapped: (args) => {
        let itemIndex = args.index;
        source.selectedCafeteria = source.cafetariaList.getItem(itemIndex);
        source.cafeteriaSelectionVisibility = 'collapse';
        // TODO change the menu items
    },
    onPlaceOrderTapped: (args) => {
        source.order_container_class = 'order-container-opacity';
        source.orderSummaryVisibility = 'visible';
    },
    dismissOrderDetailsTapped: (args) => {
        source.items.forEach(item => {
            item.quantity = 0;
            item.quantityVisibility = 'collapse'
        });
        source.order_container_class = '';
        source.orderValue = 0;
        source.hasOrderVisibility = 'collapse';
        source.orderSummaryVisibility = 'collapse';
    }
});

exports.model = source;