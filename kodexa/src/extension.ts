import * as vscode from 'vscode';
import { registerDebugCommand } from './commands/debug';
import { registerExplainCommand } from './commands/explain';
import { registerOptimizeCommand } from './commands/optimize';
import { registerRepositoryScanCommand } from './commands/repositoryScan';
import { KodexaSidebarProvider } from './providers/KodexaSidebarProvider';
import { TerminalContextManager } from './context/terminal';

let terminalManager: TerminalContextManager;

export function activate(context: vscode.ExtensionContext) {
	try {
		console.log('Extension activated');

		terminalManager = TerminalContextManager.getInstance();
		context.globalState.update('terminalManager', terminalManager);

		registerDebugCommand(context);
		registerExplainCommand(context);
		registerOptimizeCommand(context);
		registerRepositoryScanCommand(context);

		const sidebarProvider = new KodexaSidebarProvider(context.extensionUri);

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

export function getTerminalManager(): TerminalContextManager {
	return terminalManager;
}

export function deactivate() {}
