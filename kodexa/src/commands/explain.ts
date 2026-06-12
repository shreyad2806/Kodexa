import * as vscode from 'vscode';

export function registerExplainCommand(context: vscode.ExtensionContext): vscode.Disposable {
	const disposable = vscode.commands.registerCommand('kodexa.explain', () => {
		try {
			vscode.window.showInformationMessage('Explain Error - Placeholder implementation');
		} catch (error) {
			console.error('Explain command failed:', error);
			vscode.window.showErrorMessage(`Explain command failed: ${error}`);
		}
	});

	context.subscriptions.push(disposable);
	return disposable;
}
