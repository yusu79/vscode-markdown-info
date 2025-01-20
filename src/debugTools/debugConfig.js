const vscode = require("vscode");

class DebugConfig extends vscode.Disposable {
    constructor(extension) {
        super(() => this.dispose());
        this._extensionName = extension;
        this._folderextensions = {};
        this._previousConfig = this.getConfObjects(extension);
        this._disposable = vscode.workspace.onDidChangeConfiguration(async(e) => {
            if (e.affectsConfiguration(this._extensionName)) {
                const newConfig = this.getConfObjects(extension);
                this.detectChanges(this._previousConfig, newConfig);
                this._previousConfig = newConfig;
                const answer = await vscode.window.showInformationMessage(
                    '設定を反映するにはVSCodeをリロードする必要があります。リロードしますか？',
                    'はい', 'いいえ'
                );
                if (answer === 'はい') {
                    await vscode.commands.executeCommand('workbench.action.reloadWindow');
                }
            }
            this.onChange(e);
            this.getConfObjects(extension);
        });
    }

    detectChanges(oldConfig, newConfig) {
        // 全てのプロパティの変更を確認
        for (const key in newConfig) {
            if (oldConfig[key] !== newConfig[key]) {
                console.log(`\n設定が変更されました: ${this._extensionName}.${key}`);
                console.log(`旧値: ${JSON.stringify(oldConfig[key], null, 2)}`);
                console.log(`新値: ${JSON.stringify(newConfig[key], null, 2)}`);
            }
        }
    }

    dispose() { this._disposable && this._disposable.dispose(); }

    getConfObjects(extension) {
        this._extension = vscode.workspace.getConfiguration(extension); 
        // 〇〇.config 全てを取得する
        // "contributes":{ 
        //    "configuration": { 
        //      "type": "object",
        //      "title": "〇〇 Configuration",
        //      "properties": {
        //          "〇〇.config1": {}, 
        //          "〇〇.config2": {},
        //                  :,
        //      } 
        // }

        this._folders = vscode.workspace.workspaceFolders;
        this._folderextensions = {};

        if (!this._folders) return;
        this._folders.map(folder => this._folderextensions[folder.uri.fsPath] = vscode.workspace.getConfiguration(extension, folder.uri));

        // 設定オブジェクトを複製して返す
        return Object.keys(this._extension).reduce((acc, key) => {
            if (typeof this._extension[key] !== 'function') {
                acc[key] = this._extension.get(key);
            }
            return acc;
        }, {});
    }

    // 子classがthis.read(propertyName)でコンフィグを読み込めるようになる
    read(config, ...para) {
        if (!para || !para.length || !para[0]) return this._extension.get(config); 

        let 
            uri = para.shift(),
            folder = vscode.workspace.getWorkspaceFolder(uri);

        if (!folder || !folder.uri) return this._extension.get(config); 
        

        let folderextension = this._folderextensions[folder.uri.fsPath];
        if (!folderextension) {
            folderextension = vscode.workspace.getConfiguration(this._extensionName, folder.uri);
            this._folderextensions[folder.uri.fsPath] = folderextension;
        }

        let 
            folderConfig = folderextension.inspect(config),
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

exports.DebugConfig = DebugConfig;
