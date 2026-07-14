import { FileMetadata } from './scanner';

/**
 * Language Detector — Phase 1, Step 3
 *
 * Infers programming languages from file extensions and aggregates repository-wide
 * language statistics. This module is intentionally simple: it does not parse ASTs
 * or run language servers. It gives a fast, deterministic overview that downstream
 * AI inference can use to choose prompts, examples, and validation strategies.
 *
 * Why extension-based detection:
 *   - It is stateless, synchronous, and fast enough to run on every repository scan.
 *   - For Kodexa's use case (auditing AI-generated software), coarse language grouping
 *     is sufficient. We can add heuristics later without changing the public API.
 *
 * @module repository/languageDetector
 */

/**
 * Supported language identifiers.
 *
 * Why a closed union type:
 *   - Keeps the public contract explicit and prevents consumers from relying on
 *     arbitrary string values. Add new languages here when detection expands.
 */
export type DetectedLanguage =
	| 'python'
	| 'typescript'
	| 'javascript'
	| 'java'
	| 'cpp'
	| 'go'
	| 'rust'
	| 'csharp'
	| 'php'
	| 'kotlin'
	| 'swift';

/**
 * Mapping of file extensions to canonical language identifiers.
 *
 * Why lowercase, no-dot extensions:
 *   - `path.extname` returns the dot (e.g. ".ts"), so we strip it and lower-case for
 *     lookup. Consistency avoids duplication in the mapping table.
 */
const EXTENSION_TO_LANGUAGE: Record<string, DetectedLanguage> = {
	py: 'python',
	ts: 'typescript',
	tsx: 'typescript',
	js: 'javascript',
	jsx: 'javascript',
	java: 'java',
	cpp: 'cpp',
	cc: 'cpp',
	cxx: 'cpp',
	h: 'cpp',
	hpp: 'cpp',
	go: 'go',
	rs: 'rust',
	cs: 'csharp',
	php: 'php',
	kt: 'kotlin',
	kts: 'kotlin',
	swift: 'swift'
};

/**
 * Result of language detection over a set of files.
 */
export interface LanguageDetectionResult {
	/**
	 * Unique languages detected, ordered from most to least common by file count.
	 */
	languages: DetectedLanguage[];

	/**
	 * The dominant language in the repository, or an empty string if none could be
	 * inferred.
	 */
	primaryLanguage: DetectedLanguage | '';

	/**
	 * Raw counts of every file extension encountered, including extensions that do
	 * not map to a supported language (e.g. ".md", ".json").
	 */
	extensionCounts: Record<string, number>;
}

/**
 * Infer a language from a single file extension.
 *
 * @param extension - File extension without the leading dot, case-insensitive.
 * @returns The detected language or undefined.
 */
export function detectLanguage(extension: string): DetectedLanguage | undefined {
	return EXTENSION_TO_LANGUAGE[extension.toLowerCase()];
}

/**
 * Run language detection over an array of file metadata.
 *
 * Why accept FileMetadata[] instead of raw paths:
 *   - The scanner already extracted and normalized extensions. Reusing that work
 *     avoids re-parsing paths and keeps the detector decoupled from filesystem
 *     concerns.
 *
 * @param files - Files returned by the repository scanner.
 */
export function detectLanguages(files: FileMetadata[]): LanguageDetectionResult {
	const languageCounts: Record<DetectedLanguage, number> = {
		python: 0,
		typescript: 0,
		javascript: 0,
		java: 0,
		cpp: 0,
		go: 0,
		rust: 0,
		csharp: 0,
		php: 0,
		kotlin: 0,
		swift: 0
	};

	const extensionCounts: Record<string, number> = {};

	for (const file of files) {
		// Count every extension we see, not just supported ones. This preserves
		// information about config files, documentation, and asset files.
		extensionCounts[file.extension] = (extensionCounts[file.extension] || 0) + 1;

		const language = detectLanguage(file.extension);
		if (language) {
			languageCounts[language] += 1;
		}
	}

	// Sort languages by file count descending, then alphabetically for stability.
	const languages = (Object.keys(languageCounts) as DetectedLanguage[])
		.filter((language) => languageCounts[language] > 0)
		.sort((a, b) => {
			const countDiff = languageCounts[b] - languageCounts[a];
			return countDiff !== 0 ? countDiff : a.localeCompare(b);
		});

	const primaryLanguage = languages[0] || '';

	return {
		languages,
		primaryLanguage,
		extensionCounts
	};
}
