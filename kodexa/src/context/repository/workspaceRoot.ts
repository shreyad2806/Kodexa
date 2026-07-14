import * as vscode from 'vscode';

/**
 * Resolve the active VS Code workspace root.
 *
 * Why a separate module:
 *   - Keeps the repository scanner free of VS Code dependencies so it can be
 *     reused and unit-tested in plain Node.js environments.
 *
 * @returns The first workspace folder path, or undefined if no workspace is open.
 */
export function getWorkspaceRoot(): string | undefined {
	const workspaceFolders = vscode.workspace.workspaceFolders;
	if (!workspaceFolders || workspaceFolders.length === 0) {
		return undefined;
	}
	return workspaceFolders[0].uri.fsPath;
}
