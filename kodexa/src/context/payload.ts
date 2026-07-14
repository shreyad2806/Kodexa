import * as vscode from 'vscode';
import { ContextData } from './contextCollector';
import { EditorContext } from './editor';
import { WorkspaceContext } from './workspace';
import { TerminalContext } from './terminal';
import { getActiveEditorContext } from './editor';
import { getSelectedCode } from './editor';
import { getCurrentLineContext } from './editor';
import { getOpenedEditors } from './editor';
import { getWorkspaceFiles } from './workspace';
import { getWorkspaceFolders } from './workspace';
import { TerminalContextManager } from './terminal';
import { buildRepositoryContext } from './repository/repositoryContext';

export interface DebugPayload {
	error?: string;
	code?: string;
	filePath?: string;
	language?: string;
	lineNumber?: number;
	context?: string;
	workspaceContext?: WorkspaceContext;
	terminalContext?: TerminalContext;
}

export interface ExplainPayload {
	code?: string;
	filePath?: string;
	language?: string;
	lineNumber?: number;
	selection?: string;
	workspaceContext?: WorkspaceContext;
}

export interface OptimizePayload {
	code?: string;
	filePath?: string;
	language?: string;
	workspaceContext?: WorkspaceContext;
}

export interface BasePayload {
	timestamp: number;
	extensionVersion?: string;
	vscodeVersion?: string;
}

export interface ContextPayload {
	editor?: any;
	selection?: any;
	line?: any;
	openedEditors?: any[];
	workspace?: any[];
	folders?: any[];
	terminalLogs?: string[];
	repositoryContext?: any;
	timestamp: number;
}

export async function buildContextPayload(): Promise<ContextPayload> {
	const payload: ContextPayload = {
		timestamp: Date.now()
	};

	try {
		payload.editor = await getActiveEditorContext();
	} catch (error) {
		console.error('Failed to get active editor context:', error);
	}

	try {
		payload.selection = await getSelectedCode();
	} catch (error) {
		console.error('Failed to get selected code:', error);
	}

	try {
		payload.line = await getCurrentLineContext();
	} catch (error) {
		console.error('Failed to get current line context:', error);
	}

	try {
		payload.openedEditors = await getOpenedEditors();
	} catch (error) {
		console.error('Failed to get opened editors:', error);
	}

	try {
		payload.workspace = await getWorkspaceFiles();
	} catch (error) {
		console.error('Failed to get workspace files:', error);
	}

	try {
		payload.folders = await getWorkspaceFolders();
	} catch (error) {
		console.error('Failed to get workspace folders:', error);
	}

	try {
		payload.repositoryContext = await buildRepositoryContext();
	} catch (error) {
		console.error('Failed to build repository context:', error);
	}

	try {
		const terminalManager = TerminalContextManager.getInstance();
		payload.terminalLogs = terminalManager.getLogs();
	} catch (error) {
		console.error('Failed to get terminal logs:', error);
	}

	return payload;
}

export async function collectContext(): Promise<ContextPayload> {
	try {
		return await buildContextPayload();
	} catch (error) {
		console.error('Failed to collect context:', error);
		return {
			timestamp: Date.now()
		};
	}
}

export async function buildDebugPayload(
	error: string,
	contextData: ContextData
): Promise<DebugPayload> {
	const basePayload = await buildBasePayload();
	const editor = contextData.editor as EditorContext | undefined;

	return {
		...basePayload,
		error,
		code: editor?.content,
		filePath: editor?.filePath,
		language: editor?.language,
		lineNumber: editor?.cursorPosition?.line,
		context: editor?.selection?.selectedText,
		workspaceContext: contextData.workspace as WorkspaceContext | undefined,
		terminalContext: contextData.terminal as TerminalContext | undefined
	};
}

export async function buildExplainPayload(
	contextData: ContextData
): Promise<ExplainPayload> {
	const basePayload = await buildBasePayload();
	const editor = contextData.editor as EditorContext | undefined;

	return {
		...basePayload,
		code: editor?.content,
		filePath: editor?.filePath,
		language: editor?.language,
		lineNumber: editor?.cursorPosition?.line,
		selection: editor?.selection?.selectedText,
		workspaceContext: contextData.workspace as WorkspaceContext | undefined
	};
}

export async function buildOptimizePayload(
	contextData: ContextData
): Promise<OptimizePayload> {
	const basePayload = await buildBasePayload();
	const editor = contextData.editor as EditorContext | undefined;

	return {
		...basePayload,
		code: editor?.content,
		filePath: editor?.filePath,
		language: editor?.language,
		workspaceContext: contextData.workspace as WorkspaceContext | undefined
	};
}

export async function buildBasePayload(): Promise<BasePayload> {
	const vscodeVersion = await getVscodeVersion();
	const extensionVersion = await getExtensionVersion();

	return {
		timestamp: Date.now(),
		extensionVersion,
		vscodeVersion
	};
}

export async function getVscodeVersion(): Promise<string> {
	return vscode.version;
}

export async function getExtensionVersion(): Promise<string> {
	const extension = vscode.extensions.getExtension('kodexa.kodexa');
	return extension?.packageJSON.version || 'unknown';
}

export function sanitizePayload(payload: any): any {
	const sanitized: any = {};

	for (const key in payload) {
		if (payload[key] !== undefined && payload[key] !== null) {
			sanitized[key] = payload[key];
		}
	}

	return sanitized;
}

export function truncateString(str: string, maxLength: number): string {
	if (str.length <= maxLength) {
		return str;
	}
	return str.substring(0, maxLength) + '...';
}

export function limitPayloadSize(payload: any, maxSize: number = 10000): any {
	const jsonString = JSON.stringify(payload);
	if (jsonString.length <= maxSize) {
		return payload;
	}

	const truncated = JSON.parse(jsonString);
	if (truncated.code && typeof truncated.code === 'string') {
		truncated.code = truncateString(truncated.code, maxSize / 2);
	}
	if (truncated.context && typeof truncated.context === 'string') {
		truncated.context = truncateString(truncated.context, maxSize / 4);
	}

	return truncated;
}

export function validatePayload(payload: any): boolean {
	if (!payload || typeof payload !== 'object') {
		return false;
	}

	if (!payload.timestamp || typeof payload.timestamp !== 'number') {
		return false;
	}

	return true;
}
