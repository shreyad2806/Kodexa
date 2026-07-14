import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

/**
 * Repository Scanner — Phase 1, Step 1
 *
 * A reusable, production-grade directory scanner for the Kodexa VS Code extension.
 *
 * Architectural intent:
 *   - The scanner is a pure service: it accepts a filesystem root and returns a structured
 *     snapshot of the repository. It does not depend on VS Code APIs to traverse the tree,
 *     which makes it testable outside of the extension host and reusable in CLI tooling.
 *   - VS Code APIs are only used to *discover* the workspace root. This separation of
 *     concerns keeps the service portable and keeps the traversal logic decoupled from
 *     editor state.
 *
 * @module repository/scanner
 */

/**
 * Default directories excluded from traversal.
 *
 * Why a Set:
 *   - O(1) membership checks during the hot traversal loop.
 *
 * Why these entries:
 *   - node_modules: dependency trees are huge and irrelevant to repo analysis.
 *   - .git: version control internals, not user-authored code.
 *   - dist, build, out, .next: generated artifacts that distort metrics and hide source.
 *   - __pycache__, .venv, venv: Python virtual environment and bytecode caches.
 */
export const DEFAULT_IGNORED_DIRS = new Set<string>([
	'node_modules',
	'.git',
	'dist',
	'build',
	'out',
	'.next',
	'__pycache__',
	'.venv',
	'venv'
]);

/**
 * Maximum traversal depth.
 *
 * Why:
 *   - Prevents runaway scanning on deeply nested monorepos or dependency trees
 *     that slipped past the ignore list. This keeps the extension host responsive
 *     and avoids out-of-memory failures on huge repositories.
 */
export const DEFAULT_MAX_DEPTH = 128;

/**
 * Metadata captured for each scanned file.
 */
export interface FileMetadata {
	/** Base filename, e.g. "scanner.ts". */
	name: string;

	/** Absolute filesystem path. */
	absolutePath: string;

	/** Path relative to the scan root, using POSIX separators. */
	relativePath: string;

	/** File extension in lowercase, without the leading dot. */
	extension: string;

	/** Size in bytes. */
	size: number;

	/** Last modification time. */
	modifiedAt: Date;

	/**
	 * Programming language inferred from the extension.
	 *
	 * Why:
	 *   - Downstream AI analysis can group files by language without re-implementing
	 *     extension-to-language mapping. We keep the mapping minimal and extensible.
	 */
	language?: string;
}

/**
 * A single node in the folder tree.
 *
 * Why a recursive node type:
 *   - The tree mirrors the filesystem hierarchy, which is the natural shape consumers
 *     (sidebar UI, AI prompts, future visualization) expect.
 */
export interface FolderTreeNode {
	/** Base folder name. */
	name: string;

	/** Absolute filesystem path. */
	absolutePath: string;

	/** Path relative to the scan root, using POSIX separators. */
	relativePath: string;

	/** Child folders. */
	children: FolderTreeNode[];

	/** Files contained directly in this folder. */
	files: FileMetadata[];
}

/**
 * Result of a repository scan.
 */
export interface RepositoryScanResult {
	/** Absolute path that was scanned. */
	rootPath: string;

	/** Total number of files scanned. */
	totalFiles: number;

	/** Total number of folders scanned. */
	totalFolders: number;

	/** Hierarchical tree rooted at the scan root. */
	tree: FolderTreeNode;

	/** Flat list of all file metadata, ordered by absolute path. */
	files: FileMetadata[];

	/**
	 * Timestamp when the scan completed.
	 *
	 * Why:
	 *   - Consumers can detect stale scans and decide when to re-run. The timestamp is
	 *     generated at the end of the scan so it reflects the most recently observed state.
	 */
	scannedAt: Date;
}

/**
 * Options that control scanning behavior.
 */
export interface ScannerOptions {
	/**
	 * Directories to skip by exact name match.
	 *
	 * Why exact name matching:
	 *   - Faster than glob or regex matching and covers the typical exclusion cases
	 *     (dependency directories, build output, VCS). Path-based exclusions can be added
	 *     later when the product demands them.
	 */
	ignoredDirs?: Set<string> | string[];

	/** Maximum depth to traverse from the root. */
	maxDepth?: number;

	/**
	 * Optional predicate to filter files by metadata.
	 *
	 * Why:
	 *   - Lets callers constrain the scan without re-traversing. For example, a future
	 *     "code-only" view can drop binary assets right here.
	 */
	fileFilter?: (metadata: FileMetadata) => boolean;
}

/**
 * Resolve the active workspace root.
 *
 * Why return undefined instead of throwing:
 *   - The scanner itself is decoupled from VS Code. The workspace helper is only a
	 *     convenience for callers that live in the extension host. Returning undefined
	 *     lets the caller decide how to communicate "no workspace open" to the user.
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

/**
 * Normalize a user-supplied ignore set into a Set<string>.
 *
 * Why:
 *   - Accepts both arrays and Sets so callers can use whichever is convenient,
	 *     while internally we always use the O(1) Set lookup.
 */
function normalizeIgnoredDirs(ignoredDirs?: Set<string> | string[]): Set<string> {
	if (!ignoredDirs) {
		return DEFAULT_IGNORED_DIRS;
	}
	if (ignoredDirs instanceof Set) {
		return ignoredDirs;
	}
	return new Set(ignoredDirs);
}

/**
 * Infer a programming language from a file extension.
 *
 * Why a small mapping instead of a full parser:
	 *   - Language detection is only needed for coarse grouping. We avoid a heavy
	 *     dependency and keep the scanner lightweight.
 */
function inferLanguage(extension: string): string | undefined {
	const mapping: Record<string, string> = {
		ts: 'typescript',
		tsx: 'typescript',
		js: 'javascript',
		jsx: 'javascript',
		py: 'python',
		go: 'go',
		rs: 'rust',
		java: 'java',
		kt: 'kotlin',
		cs: 'csharp',
		cpp: 'cpp',
		c: 'c',
		h: 'c',
		php: 'php',
		rb: 'ruby',
		swift: 'swift',
		md: 'markdown',
		yml: 'yaml',
		yaml: 'yaml',
		json: 'json',
		html: 'html',
		css: 'css',
		scss: 'scss',
		sql: 'sql',
		sh: 'shell',
		bash: 'shell',
		ps1: 'powershell'
	};
	return mapping[extension.toLowerCase()];
}

/**
 * Build a FileMetadata object from a fs.Stats entry.
 *
 * Why keep the absolute path:
	 *   - Callers that open documents or run diagnostics need the absolute path. The
	 *     relative path is kept for tree display and AI context windows.
 */
function buildFileMetadata(
	name: string,
	absolutePath: string,
	rootPath: string,
	stat: fs.Stats
): FileMetadata {
	const extension = path.extname(name).slice(1).toLowerCase();
	return {
		name,
		absolutePath,
		relativePath: path.relative(rootPath, absolutePath).split(path.sep).join('/'),
		extension,
		size: stat.size,
		modifiedAt: stat.mtime,
		language: inferLanguage(extension)
	};
}

/**
 * Recursively scan a directory and return a populated tree node.
 *
 * Why fs.promises instead of synchronous fs:
   *   - The extension host must remain responsive. Blocking synchronous calls on large
	 *     repositories would freeze the UI. Async I/O interleaves with the event loop.
 *
 * Why depth-first, returning one node at a time:
	 *   - It keeps the call stack bounded by the filesystem depth rather than the total
	 *     number of entries, and it produces a natural recursive tree structure with no
	 *     post-processing pass.
 *
 * @param dirPath - Absolute path to scan.
 * @param rootPath - Original scan root, used for relative path calculation.
 * @param ignoredDirs - Directories to skip.
 * @param maxDepth - Remaining depth budget.
 * @param fileFilter - Optional file predicate.
 * @param accumulator - Shared accumulator for the flat file list and counters.
 */
async function scanDirectory(
	dirPath: string,
	rootPath: string,
	ignoredDirs: Set<string>,
	maxDepth: number,
	fileFilter: ((metadata: FileMetadata) => boolean) | undefined,
	accumulator: {
		totalFiles: number;
		totalFolders: number;
		flatFiles: FileMetadata[];
	}
): Promise<FolderTreeNode> {
	const relativePath = path.relative(rootPath, dirPath).split(path.sep).join('/') || '.';
	const node: FolderTreeNode = {
		name: path.basename(dirPath) || dirPath,
		absolutePath: dirPath,
		relativePath,
		children: [],
		files: []
	};

	accumulator.totalFolders += 1;

	if (maxDepth <= 0) {
		// Depth limit reached. We still count the folder but do not descend further.
		return node;
	}

	let entries: fs.Dirent[];
	try {
		entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
	} catch (error) {
		// Permission-denied or otherwise unreadable directories are skipped gracefully.
		// Why not throw: a single inaccessible directory should not abort the entire scan.
		console.warn(`[kodexa] Skipped unreadable directory: ${dirPath}`, error);
		return node;
	}

	// Sort entries for deterministic output. This makes diffing and tests reliable.
	entries.sort((a, b) => a.name.localeCompare(b.name));

	for (const entry of entries) {
		const entryPath = path.join(dirPath, entry.name);

		if (entry.isDirectory()) {
			if (ignoredDirs.has(entry.name)) {
				// Skip the entire subtree. This is the primary performance guard.
				continue;
			}

			const child = await scanDirectory(
				entryPath,
				rootPath,
				ignoredDirs,
				maxDepth - 1,
				fileFilter,
				accumulator
			);
			node.children.push(child);
			continue;
		}

		if (entry.isFile() || entry.isSymbolicLink()) {
			// Symbolic links are followed. Why: common in monorepos (e.g. pnpm) where
			// source packages are symlinked into node_modules. We already skip node_modules,
			// so following symlinks elsewhere is usually the desired behavior.
			let stat: fs.Stats;
			try {
				stat = await fs.promises.stat(entryPath);
			} catch (error) {
				console.warn(`[kodexa] Skipped unreadable file: ${entryPath}`, error);
				continue;
			}

			if (!stat.isFile()) {
				// A symlink could point to a directory. We treat it as a directory if so,
				// but we do not descend into it to avoid cycles.
				continue;
			}

			const metadata = buildFileMetadata(entry.name, entryPath, rootPath, stat);

			if (fileFilter && !fileFilter(metadata)) {
				continue;
			}

			node.files.push(metadata);
			accumulator.flatFiles.push(metadata);
			accumulator.totalFiles += 1;
		}
	}

	return node;
}

/**
 * Scan a repository root and return a complete snapshot.
 *
 * Why validate the root path:
 *   - Failing fast with a clear message is better than returning an empty tree and
 *     forcing the caller to guess whether the workspace is empty or the path is wrong.
 *
 * @param rootPath - Directory to scan. If omitted, the active workspace root is used.
 * @param options - Scanner options.
 * @returns A fully populated RepositoryScanResult.
 */
export async function scanRepository(
	rootPath?: string,
	options: ScannerOptions = {}
): Promise<RepositoryScanResult> {
	const resolvedRoot = rootPath ?? getWorkspaceRoot();

	if (!resolvedRoot) {
		throw new Error(
			'[kodexa] No scan root provided and no workspace is open.'
		);
	}

	if (!(await fs.promises.stat(resolvedRoot)).isDirectory()) {
		throw new Error(`[kodexa] Scan root is not a directory: ${resolvedRoot}`);
	}

	const ignoredDirs = normalizeIgnoredDirs(options.ignoredDirs);
	const maxDepth = options.maxDepth ?? DEFAULT_MAX_DEPTH;
	const accumulator = {
		totalFiles: 0,
		totalFolders: 0,
		flatFiles: [] as FileMetadata[]
	};

	const tree = await scanDirectory(
		resolvedRoot,
		resolvedRoot,
		ignoredDirs,
		maxDepth,
		options.fileFilter,
		accumulator
	);

	return {
		rootPath: resolvedRoot,
		totalFiles: accumulator.totalFiles,
		totalFolders: accumulator.totalFolders,
		tree,
		files: accumulator.flatFiles,
		scannedAt: new Date()
	};
}
