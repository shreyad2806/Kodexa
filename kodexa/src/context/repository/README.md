# Repository Context Module

This module is Kodexa's single source of truth for everything the extension knows about the current workspace.

## Modules

| File | Responsibility |
|------|--------------|
| `scanner.ts` | Pure filesystem scanner. Accepts a root path and returns a recursive tree + flat file list. No VS Code dependency. |
| `languageDetector.ts` | Infers languages from file extensions and aggregates language/extension statistics. |
| `repositoryContext.ts` | Aggregates scan output, language stats, and workspace metadata into one `RepositoryContext` object. |
| `workspaceRoot.ts` | Thin VS Code wrapper that resolves the active workspace root. |

## Design rules

1. **Scanner is pure Node.js.** It only imports `fs` and `path` so it can be unit-tested outside the extension host.
2. **Workspace root resolution is separate.** `repositoryContext.ts` decides where to scan; `workspaceRoot.ts` asks VS Code.
3. **Language detection is a pass over scanned files.** It never touches the filesystem itself.
4. **Context is a snapshot.** Every `RepositoryContext` carries a `scannedAt` timestamp so consumers can reason about staleness.
5. **Future features are typed as placeholders.** `frameworks`, `dependencyGraph`, `architecture`, and `inference` are `any` until their designs stabilize.

## Error handling

- No workspace open → `buildRepositoryContext()` returns `undefined`.
- Empty workspace → returns a context with `totalFiles: 0`.
- Unreadable files/folders → logged and skipped; scan continues.
- Scan errors → thrown to the caller (e.g., `repositoryScan.ts`) and surfaced in the UI.
