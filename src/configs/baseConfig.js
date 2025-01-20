const 
    vscode = require("vscode"),
    localeEn = require("../../package.nls.json"),
    localeJa = require("../../package.nls.ja.json");

class BaseConfig extends vscode.Disposable {
    constructor(extension) {
        super(() => this.dispose());
        this._extensionName = extension;
        this._folderConf = {};
        this.getWorkspaceConf(extension);
        this._disposable = vscode.workspace.onDidChangeConfiguration(async(e) => {
            if (e.affectsConfiguration(this._extensionName)) {
                const 
                    localeTableKey = vscode.env.language,
                    localeTable = Object.assign(
                        {}, // 空のオブジェクトで、これがコピー先となる
                        localeEn, // 英語のローカライズデータを含むオブジェクト
                        {ja: localeJa}[localeTableKey] || {} // localeTableKey が 'ja' の場合に localeJa オブジェクトを返し、それ以外の場合は空のオブジェクト {} を返す
                    );
                
                const answer = await vscode.window.showInformationMessage(
                    localeTable["reload.message"],
                    localeTable["reload.yes"],
                    localeTable["reload.no"]
                );
                if (answer === localeTable["reload.yes"]) {
                    await vscode.commands.executeCommand('workbench.action.reloadWindow');
                }
            }
            this.onChange(e);
            this.getWorkspaceConf(extension);
        });
    }

    dispose() { this._disposable && this._disposable.dispose(); }

    // ワークスペース(左のフォルダ)に設定フォルダがあれば、そっちを優先をしてthis._extensionを上書き
    getWorkspaceConf(extension) {
        this._extension = vscode.workspace.getConfiguration(extension); 
        // package.jsonに記述されたconfigurationの値を全てを取得する
        // "contributes":{ 
        //    "configuration": {} 
        // }

        this._folders = vscode.workspace.workspaceFolders;
        this._folderConf = {};

        if (!this._folders) return;
        this._folders.map(folder => this._folderConf[folder.uri.fsPath] = vscode.workspace.getConfiguration(extension, folder.uri));
    }

    // 子classがthis.read(propertyName)でコンフィグを読み込めるようになる
    read(config, ...para) {
        if (!para || !para.length || !para[0]) return this._extension.get(config); 

        let 
            uri = para.shift(),
            folder = vscode.workspace.getWorkspaceFolder(uri),
            folderConf = this._folderConf[folder.uri.fsPath];

        if (!folder || !folder.uri) return this._extension.get(config); 
        

        if (!folderConf) {
            folderConf = vscode.workspace.getConfiguration(this._extensionName, folder.uri);
            this._folderConf[folder.uri.fsPath] = folderConf;
        }

        let 
            folderConfig = folderConf.inspect(config),
            func = undefined,
            configValue = undefined;
        
        if (para.length) func = para.shift();


        
        if (folderConfig.workspaceFolderValue !== undefined) {
            // ワークスペースフォルダ固有値
            configValue = folderConfig.workspaceFolderValue;
        } else if (folderConfig.workspaceValue !== undefined) {
            // ワークスペース固有値
            configValue = folderConfig.workspaceValue;
        } else if (folderConfig.globalValue !== undefined) {
            // グローバル値
            configValue = folderConfig.globalValue;
        } else {
            // デフォルト値
            configValue = folderConfig.defaultValue;
        }


        if ( folder && folder.uri && func) {
            return func(folder.uri, configValue);
        } else {
            return configValue;
        }
    }
}

exports.BaseConfig = BaseConfig;
