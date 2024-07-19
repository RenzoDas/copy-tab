import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    let openDocuments: vscode.Uri[] = [];
    let statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.text = "🟢 CopyTab: All tabs";
    statusBarItem.command = 'extension.copyAllOpenFiles';

    let statusBarItemActiveTab = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItemActiveTab.text = "🟢 CopyTab: Active tab";
    statusBarItemActiveTab.command = 'extension.copyActiveTab';

    context.subscriptions.push(statusBarItem);
    context.subscriptions.push(statusBarItemActiveTab);

    vscode.window.onDidChangeActiveTextEditor((editor: vscode.TextEditor | undefined) => {
        if (editor && !openDocuments.includes(editor.document.uri)) {
            openDocuments.push(editor.document.uri);
            console.log(`[CopyTab] Document ${editor.document.uri} added to tracking.`);
        }
        updateStatusBarItem();
    });

    vscode.workspace.onDidCloseTextDocument((document: vscode.TextDocument) => {
        openDocuments = openDocuments.filter(uri => uri.toString() !== document.uri.toString());
        console.log(`[CopyTab] Document ${document.uri} removed from tracking.`);
        updateStatusBarItem();
    });

    let disposableAllTabs = vscode.commands.registerCommand('extension.copyAllOpenFiles', async () => {
        let allContent = '';

        // Activate all open text documents
        for (const editor of vscode.window.visibleTextEditors) {
            const document = editor.document;
            if (!openDocuments.includes(document.uri)) {
                openDocuments.push(document.uri);
            }
        }

        for (let uri of openDocuments) {
            let document = await vscode.workspace.openTextDocument(uri);
            let filePath = document.uri.fsPath;
            allContent += `File: ${filePath}:\n\n${document.getText()}\n\n`;
        }

        await vscode.env.clipboard.writeText(allContent);
        vscode.window.showInformationMessage('Copied all open files to clipboard!');
    });

    let disposableActiveTab = vscode.commands.registerCommand('extension.copyActiveTab', async () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const document = editor.document;
            const content = document.getText();
            const filePath = document.uri.fsPath;

            await vscode.env.clipboard.writeText(`File: ${filePath}:\n\n${content}\n\n`);
            vscode.window.showInformationMessage('Copied active tab to clipboard!');
        } else {
            vscode.window.showWarningMessage('No active tab to copy.');
        }
    });

    context.subscriptions.push(disposableAllTabs);
    context.subscriptions.push(disposableActiveTab);

    function updateStatusBarItem() {
        if (openDocuments.length > 0) {
            console.log('[CopyTab] Showing status bar item.');
            statusBarItem.show();
            statusBarItemActiveTab.show();
        } else {
            console.log('[CopyTab] Hiding status bar item.');
            statusBarItem.hide();
            statusBarItemActiveTab.hide();
        }
    }

    if (vscode.window.activeTextEditor) {
        openDocuments.push(vscode.window.activeTextEditor.document.uri);
        console.log(`[CopyTab] Document ${vscode.window.activeTextEditor.document.uri} added to tracking.`);
    } else {
        console.log('[CopyTab] No active text editor.');
    }

    // Ensure the status bar item is visible at the start
    updateStatusBarItem();

    // Always show the status bar item for debugging
    statusBarItem.show();
    statusBarItemActiveTab.show();
}

export function deactivate() {}
