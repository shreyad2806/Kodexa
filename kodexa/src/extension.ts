import * as vscode from 'vscode';
import { registerDebugCommand } from './commands/debug';
import { registerExplainCommand } from './commands/explain';
import { registerOptimizeCommand } from './commands/optimize';
import { KodexaSidebarProvider } from './providers/KodexaSidebarProvider';

export function activate(context: vscode.ExtensionContext) {
	try {
		console.log('Kodexa activated');

		registerDebugCommand(context);
		registerExplainCommand(context);
		registerOptimizeCommand(context);

		const sidebarProvider = new KodexaSidebarProvider(context.extensionUri);

		sidebarProvider.setMessageHandler((message) => {
			try {
				switch (message.command) {
					case 'debug':
						vscode.window.showInformationMessage('Debug clicked');
						break;
					case 'explain':
						vscode.window.showInformationMessage('Explain clicked');
						break;
					case 'optimize':
						vscode.window.showInformationMessage('Optimize clicked');
						break;
				}
			} catch (error) {
				console.error('Message handler failed:', error);
				if (error instanceof Error) {
					console.error('Stack trace:', error.stack);
				}
				vscode.window.showErrorMessage(`Failed to handle message: ${error}`);
			}
		});

		const disposable = vscode.window.registerWebviewViewProvider('kodexa.sidebar', sidebarProvider);
		context.subscriptions.push(disposable);
	} catch (error) {
		console.error('Kodexa activation failed:', error);
		if (error instanceof Error) {
			console.error('Stack trace:', error.stack);
		}
		throw error;
	}
}

export function deactivate() {}
