const {GetConfig} = require("../configs/getConfig");

exports.plugins = [
    $('markdown-it-info',{
        admonitionStyle: GetConfig.get("markdown-it-info.previewStyles"),
        defaultType: "info",
        defaultTitle: GetConfig.get("markdown-it-info.defaultTitle")
    })
].filter(p => !!p);

function $(name,...config) {
    let 
        pluginEnable = name + ".enable",
        pluginOptions = name + ".options",
        options = Object.assign({}, ...config) // configをオブジェクトに変換
    
    if (!GetConfig.get(pluginEnable)) {        
        return undefined
    }

    if (GetConfig.get(pluginOptions)) {
        options = GetConfig.get(pluginOptions)
    }

    return {
        plugin: name,
        options: options,
    };
}
