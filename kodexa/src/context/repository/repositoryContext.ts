import * as path from 'path';
import * as vscode from 'vscode';
import {
	scanRepository,
	RepositoryScanResult,
	FileMetadata,
	getWorkspaceRoot
} from './scanner';

/**
 * Repository Context — Phase 1, Step 2
 *
 * Aggregates everything Kodexa knows about the current workspace into a single
 * structured object. This is the canonical source of truth that all downstream
 * features (framework detection, architecture review, dependency reasoning,
 * and AI inference) should read from.
 *
 * Why a single aggregate object:
 *   - Consumers should not need to coordinate multiple service calls. By
 *     centralizing repository knowledge here, we guarantee consistency across
 *     the sidebar, debug payloads, and future AI prompts.
 *
 * @module repository/repositoryContext
 */

/**
 * High-level summary of the repository.
 */
export interface RepositorySummary {
	/** Display name of the repository. */
	name: string;

	/** Absolute path of the scanned root. */
	rootPath: string;

	/** Total files discovered. */
	totalFiles: number;

	/** Total folders discovered. */
	totalFolders: number;

	/** When the snapshot was built. */
	scannedAt: Date;
}

/**
 * Derived statistics computed from the scan result.
 *
 * Why keep these computed rather than computed on demand:
 *   - The context object is intended to be serialized and sent to the sidebar
 *     and to AI backends. Pre-computing keeps consumers simple and guarantees
 *     the same numbers everywhere.
 */
export interface RepositoryStats {
	/** Count of files per inferred language. */
	languages: Record<string, number>;

	/** Count of files per extension. */
	extensions: Record<string, number>;

	/** Top files by size. */
	largestFiles: Array<{
		name: string;
		relativePath: string;
		size: number;
	}>;

	/** Most recently modified files. */
	recentlyModified: Array<{
		name: string;
		relativePath: string;
		modifiedAt: Date;
	}>;
}

/**
 * VS Code workspace metadata surrounding the repository.
 */
export interface RepositoryWorkspaceInfo {
	/** Number of workspace folders open. */
	folderCount: number;

	/** List of workspace folders. */
	folders: Array<{
		name: string;
		path: string;
	}>;
}

/**
 * The canonical RepositoryContext object.
 *
 * Why the future-extension fields are optional and typed loosely as `any`:
 *   - We do not yet know the exact shapes for framework detection, dependency
 *     graphs, or architecture reasoning. Using optional `any` placeholders
 *     lets us add typed submodules later without breaking the context contract.
 */
export interface RepositoryContext {
	summary: RepositorySummary;
	stats: RepositoryStats;
	workspace: RepositoryWorkspaceInfo;
	scan: RepositoryScanResult;

	/**
	 * Placeholder for framework detection (React, Next.js, Django, FastAPI, etc.).
	 * Will be populated by a future framework-detection pass.
	 */
	frameworks?: any;

	/**
	 * Placeholder for dependency graph data.
	 * Will be populated by a future import/static-analysis pass.
	 */
	dependencyGraph?: any;

	/**
	 * Placeholder for architecture reasoning output.
	 * Will be populated by a future AI architecture review pass.
	 */
	architecture?: any;

	/**
	 * Placeholder for cached AI inference results tied to this snapshot.
	 * Will be populated by the inference engine as features are built.
	 */
	inference?: any;
}

/**
 * Aggregate language and extension counts from a list of file metadata.
 */
function aggregateCounts(files: FileMetadata[]): {
	languages: Record<string, number>;
	extensions: Record<string, number>;
} {
	const languages: Record<string, number> = {};
	const extensions: Record<string, number> = {};

	for (const file of files) {
		if (file.language) {
			languages[file.language] = (languages[file.language] || 0) + 1;
		}
		if (file.extension) {
			extensions[file.extension] = (extensions[file.extension] || 0) + 1;
		}
	}

	return { languages, extensions };
}

/**
 * Build the RepositoryContext snapshot.
 *
 * Why scan first, then aggregate:
 *   - The scan is the expensive I/O operation. Once we have the flat file list,
 *     all statistics are derived in-memory without touching the filesystem again.
 *
 * Why return undefined when no workspace is open:
 *   - A repository context only makes sense when there is a workspace. Callers
 *     can render an empty state or prompt the user to open a folder.
 *
 * @param rootPath - Optional override for the scan root. Defaults to the active workspace.
 */
export async function buildRepositoryContext(
	rootPath?: string
): Promise<RepositoryContext | undefined> {
	const resolvedRoot = rootPath ?? getWorkspaceRoot();
	if (!resolvedRoot) {
		return undefined;
	}

	const scan = await scanRepository(resolvedRoot);
	const { languages, extensions } = aggregateCounts(scan.files);

	// Sort in-memory copies so we do not mutate the original scan result.
	const bySize = [...scan.files].sort((a, b) => b.size - a.size).slice(0, 10);
	const byModified = [...scan.files]
		.sort((a, b) => b.modifiedAt.getTime() - a.modifiedAt.getTime())
		.slice(0, 10);

	const workspaceFolders = vscode.workspace.workspaceFolders || [];

	return {
		summary: {
			name: path.basename(resolvedRoot),
			rootPath: resolvedRoot,
			totalFiles: scan.totalFiles,
			totalFolders: scan.totalFolders,
			scannedAt: scan.scannedAt
		},
		stats: {
			languages,
			extensions,
			largestFiles: bySize.map((file) => ({
				name: file.name,
				relativePath: file.relativePath,
				size: file.size
			})),
			recentlyModified: byModified.map((file) => ({
				name: file.name,
				relativePath: file.relativePath,
				modifiedAt: file.modifiedAt
			}))
		},
		workspace: {
			folderCount: workspaceFolders.length,
			folders: workspaceFolders.map((folder) => ({
				name: folder.name,
				path: folder.uri.fsPath
			}))
		},
		scan
	};
}
