const 
    vscode = require("vscode"),
    {GetConfig} = require('./src/configs/getConfig'),
    {plugins} = require("./src/lib/plugins");


exports.outputPanel = vscode.window.createOutputChannel("Markdown Info");  // エラーメッセージを出力するパネル

function activate(context) {
    context.subscriptions.push(
        exports.outputPanel,
        GetConfig,
    );
    return {        
        extendMarkdownIt(md) {            
            plugins.map(p => {       
                const 
                    plugin = require(p.plugin),
                    options = p.options
                if (options) {
                    md.use(plugin,options);
                } else {
                    md.use(plugin);
                }
            });
            return md;
        }
    };
}


function deactivate() {}


module.exports = {
	activate,
	deactivate
}
