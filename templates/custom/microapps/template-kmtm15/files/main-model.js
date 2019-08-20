const fromObject = require("~/common/modules/data/observable").fromObject;

const { copyToClipboard } = require("~/common/clipboard-service");

const appJson = require("../app.json");

function _loaded(args) {
    if (!args.object)
        return;

    _setInitData(args.object);
}

function _setInitData(view) {
    source.currentPage = view;
    source.name = appJson.name;
    source.formats = 'EAN_8, EAN_13, CODE_128, QR_CODE, DATA_MATRIX, AZTEC',
    source.selectedBarcodeResult = { format: '', value: '' };
    source.microappMessage = 'No Microapp UI';
    source.scannerVisibility = 'visible';
    source.scanResultVisibility = 'collapse';
    source.pause = false;
}

function _unloaded(args) {
    source.scannerVisibility = 'visible';
    source.scanResultVisibility = 'collapse';
    source.pause = true;
}

function _onBarcodeScanResult(args) {
    const result = args.value;
    let barcodes = result.barcodes;
    if (Array.isArray(barcodes) && barcodes.length == 1) {
        source.pause = true;
        source.selectedBarcodeResult = barcodes[0];
        source.scanResultVisibility = 'visible';
        source.scannerVisibility = 'collapse';
    }
}

function _onScanTapped(args) {
    source.scannerVisibility = 'visible';
    source.scanResultVisibility = 'collapse';
    source.pause = false;
}

function _onCopyTapped(args) {
    let contents = source.selectedBarcodeResult.value
    copyToClipboard(contents).then((some) => {
        console.log('copied to clipboard', some)
    })
}

// The binding
let source = fromObject({
    name: appJson.name,
    formats: 'EAN_8, EAN_13, CODE_128, QR_CODE, DATA_MATRIX, AZTEC',
    selectedBarcodeResult: { format: '', value: '' },
    microappMessage: 'No Microapp UI',
    pause: false,
    scannerVisibility: "visible",
    scanResultVisibility: 'collapse',
    currentPage: undefined,
    onBarcodeScanResult: (args) => {
        _onBarcodeScanResult(args);
    },
    onCopyTapped: (args) => {
        _onCopyTapped(args);
    },
    onScanTapped: (args) => {
        _onScanTapped(args);
    },
    loaded: (args) => {
        _loaded(args);
    },
    unloaded: (args) => {
        _unloaded(args);
    },
});

exports.model = source;