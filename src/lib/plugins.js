const {GetConfig} = require("../configs/getConfig");

exports.plugins = [
    $('markdown-it-info',{
        admonitionStyle: GetConfig.get("previewStyles"),
        defaultType: "info",
        defaultTitle: GetConfig.get("defaultTitle")
    })
].filter(p => !!p);

function $(name,...config) {
    let options = Object.assign({}, ...config) // configをオブジェクトに変換

    return {
        plugin: name,
        options: options,
    };
}
