const { ContentView } = require("~/common/modules/ui/content-view");
const builder = require('~/common/modules/ui/builder');

const { model } = require('./main-model');

let Main = (function (source, _super) {
    __extends(Main, _super);
    function Main() {
        var _this = _super.call(this) || this;

        var innerComponent = builder.load(__dirname + '/main.xml');
        if (innerComponent) {
            innerComponent.bindingContext = source;
            innerComponent.on("unloaded", (args) => source.unloaded(args));
            source.loaded(innerComponent)
        }
        _this.content = innerComponent;

        return _this;
    }

    return Main;
}(model, ContentView));

exports.Main = Main;