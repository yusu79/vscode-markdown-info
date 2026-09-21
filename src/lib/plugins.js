const {GetConfig} = require("../configs/getConfig");

exports.plugins = [
    $('markdown-it-info',{
        style: GetConfig.get("previewStyles"),
        classes: GetConfig.get("classes"),
        attributes: GetConfig.get("attributes"),
        embedCss: GetConfig.get("embedCss"),
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
