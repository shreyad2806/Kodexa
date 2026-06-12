import * as vscode from 'vscode';

export function registerDebugCommand(context: vscode.ExtensionContext): vscode.Disposable {
	const disposable = vscode.commands.registerCommand('kodexa.debug', () => {
		try {
			vscode.window.showInformationMessage('Debug with AI - Placeholder implementation');
		} catch (error) {
			console.error('Debug command failed:', error);
			vscode.window.showErrorMessage(`Debug command failed: ${error}`);
		}
	});

	context.subscriptions.push(disposable);
	return disposable;
}
