import * as vscode from 'vscode';
import { KodexaSidebarProvider } from '../providers/KodexaSidebarProvider';
import { buildRepositoryContext } from '../context/repository/repositoryContext';

/**
 * Register the repository scan command.
 *
 * This command is wired to the "Repository Scan" action card in the sidebar.
 * It builds the RepositoryContext snapshot and pushes state back to the webview
 * so the UI can render live data, loading, empty, and error states.
 */
export function registerRepositoryScanCommand(
	context: vscode.ExtensionContext
) {
	const disposable = vscode.commands.registerCommand(
		'kodexa.repositoryScan',
		async () => {
			try {
				const repositoryContext = await buildRepositoryContext();

				if (!repositoryContext) {
					KodexaSidebarProvider.postMessage({ command: 'noWorkspace' });
					return;
				}

				if (repositoryContext.summary.totalFiles === 0) {
					KodexaSidebarProvider.postMessage({
						command: 'repositoryEmpty',
						repositoryContext
					});
					return;
				}

				KodexaSidebarProvider.postMessage({
					command: 'repositoryData',
					repositoryContext
				});
				console.log(
					"[Kodexa] Repository scanned successfully."
				);
			} catch (err) {
				const message = err instanceof Error ? err.message : 'Unknown scan error';
				KodexaSidebarProvider.postMessage({
					command: 'repositoryError',
					error: message
				});
				vscode.window.showErrorMessage(`Repository scan failed: ${message}`);
			}
		}
	);

	context.subscriptions.push(disposable);
}
