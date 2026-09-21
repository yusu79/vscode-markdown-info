const 
    vscode = require("vscode"),
    {GetConfig} = require('./src/configs/getConfig'),
    {findInfoFoldingRanges} = require('./src/lib/folding'),
    {extendMarkdownItWithFrontmatter} = require("./src/lib/frontmatter"),
    {plugins} = require("./src/lib/plugins");


exports.outputPanel = vscode.window.createOutputChannel("Markdown Info");  // エラーメッセージを出力するパネル

function activate(context) {
	const foldingRangeProvider = vscode.languages.registerFoldingRangeProvider(
		{language: 'markdown'},
		{
			provideFoldingRanges(document) {
				return findInfoFoldingRanges(document).map(({start, end}) =>
					new vscode.FoldingRange(start, end, vscode.FoldingRangeKind.Region)
				);
			}
		}
	);

    context.subscriptions.push(
        exports.outputPanel,
        GetConfig,
		foldingRangeProvider,
    );
    return {        
        extendMarkdownIt(md) {            
            extendMarkdownItWithFrontmatter(md);
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
