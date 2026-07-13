import * as vscode from 'vscode';

export class KodexaSidebarProvider implements vscode.WebviewViewProvider {
	private static _view?: vscode.WebviewView;

	constructor(
		private readonly _extensionUri: vscode.Uri,
	) {}

	public static postMessage(message: any): boolean {
		if (KodexaSidebarProvider._view) {
			KodexaSidebarProvider._view.webview.postMessage(message);
			return true;
		}
		return false;
	}

	public resolveWebviewView(
		webviewView: vscode.WebviewView,
		context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken,
	) {
		KodexaSidebarProvider._view = webviewView;

		webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: [
				this._extensionUri
			]
		};

		webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

		webviewView.webview.onDidReceiveMessage(
			(message: { command: string }) => {
				switch (message.command) {
					case 'debug':
						vscode.commands.executeCommand('kodexa.debug');
						break;
					case 'explain':
						vscode.commands.executeCommand('kodexa.explain');
						break;
					case 'optimize':
						vscode.commands.executeCommand('kodexa.optimize');
						break;
				}
			}
		);

		webviewView.onDidDispose(() => {
			KodexaSidebarProvider._view = undefined;
		});
	}

	private _getHtmlForWebview(webview: vscode.Webview): string {
		const nonce = this.getNonce();
		const logoUri = webview.asWebviewUri(
			vscode.Uri.joinPath(this._extensionUri, 'src', 'assets', 'logo.png')
		);

		return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}'; img-src ${webview.cspSource};">
    <title>Kodexa</title>
    <style>
        *, *::before, *::after {
            margin: 0; padding: 0;
            box-sizing: border-box;
            -webkit-font-smoothing: antialiased;
        }

        :root {
            --blue:        #3b82f6;
            --blue-lt:     #60a5fa;
            --blue-xlt:    #93c5fd;
            --blue-glow:   rgba(59,130,246,0.12);
            --blue-bd:     rgba(59,130,246,0.18);
            --blue-hover:  rgba(59,130,246,0.07);

            --s1: rgba(255,255,255,0.03);
            --s2: rgba(255,255,255,0.055);
            --bd: rgba(255,255,255,0.05);

            --t1: rgba(255,255,255,0.90);
            --t2: rgba(255,255,255,0.48);
            --t3: rgba(255,255,255,0.26);
            --t4: rgba(255,255,255,0.14);

            --r: 9px;
            --e: 130ms cubic-bezier(0.4,0,0.2,1);
        }

        html, body { height: 100%; }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
            background: var(--vscode-sideBar-background);
            color: var(--t1);
            font-size: 12px;
            line-height: 1.4;
            overflow-y: auto;
            overflow-x: hidden;
        }

        body::-webkit-scrollbar { width: 3px; }
        body::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.07); border-radius: 3px; }

        .shell {
            display: flex;
            flex-direction: column;
            padding: 0 11px 12px;
            gap: 0;
        }

        /* ── HEADER ─────────────────────────────── */
        .hdr {
            display: flex;
            align-items: center;
            gap: 9px;
            padding: 13px 0 11px;
            border-bottom: 1px solid var(--bd);
            margin-bottom: 12px;
        }

        .logo {
            width: 36px; height: 36px;
            flex-shrink: 0;
            border-radius: 8px;
            object-fit: contain;
            filter: drop-shadow(0 1px 8px rgba(59,130,246,0.35));
            image-rendering: -webkit-optimize-contrast;
        }

        .hdr-copy { flex: 1; min-width: 0; }

        .hdr-name {
            display: block;
            font-size: 13.5px;
            font-weight: 600;
            letter-spacing: -0.3px;
            color: var(--t1);
            line-height: 1.1;
        }

        .hdr-tagline {
            display: block;
            font-size: 10.5px;
            color: var(--t2);
            margin-top: 2px;
            line-height: 1.3;
        }

        .ready-pill {
            display: flex;
            align-items: center;
            gap: 4px;
            background: rgba(52,211,153,0.07);
            border: 1px solid rgba(52,211,153,0.18);
            border-radius: 20px;
            padding: 3px 8px 3px 6px;
            flex-shrink: 0;
        }
        .ready-dot {
            width: 5px; height: 5px;
            border-radius: 50%;
            background: #34d399;
            box-shadow: 0 0 4px rgba(52,211,153,0.65);
        }
        .ready-text {
            font-size: 10px;
            font-weight: 500;
            color: rgba(52,211,153,0.78);
        }

        /* ── REPO CARD ──────────────────────────── */
        .repo-card {
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: var(--s1);
            border: 1px solid var(--bd);
            border-radius: var(--r);
            padding: 9px 12px;
            margin-bottom: 12px;
        }

        .repo-left { display: flex; flex-direction: column; gap: 2px; }

        .repo-label {
            font-size: 9px;
            font-weight: 600;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            color: var(--t3);
        }

        .repo-name {
            font-size: 12px;
            font-weight: 500;
            color: var(--t1);
            letter-spacing: -0.1px;
        }

        .repo-meta {
            font-size: 10.5px;
            color: var(--t2);
        }

        .repo-status {
            font-size: 10px;
            font-weight: 500;
            color: #34d399;
            background: rgba(52,211,153,0.07);
            border: 1px solid rgba(52,211,153,0.16);
            border-radius: 10px;
            padding: 2px 8px;
        }

        /* ── SECTION LABEL ──────────────────────── */
        .sec-label {
            font-size: 9px;
            font-weight: 600;
            letter-spacing: 0.09em;
            text-transform: uppercase;
            color: var(--t3);
            margin-bottom: 6px;
        }

        /* ── ACTION CARDS ───────────────────────── */
        .action-cards {
            display: flex;
            flex-direction: column;
            gap: 5px;
        }

        .acard {
            position: relative;
            display: flex;
            align-items: center;
            gap: 10px;
            background: var(--s1);
            border: 1px solid var(--bd);
            border-radius: var(--r);
            padding: 9px 10px;
            overflow: hidden;
            transition: background var(--e), border-color var(--e),
                        box-shadow var(--e), transform var(--e);
        }

        .acard::before {
            content: '';
            position: absolute;
            left: 0; top: 18%; bottom: 18%;
            width: 2px;
            border-radius: 0 2px 2px 0;
            background: var(--blue);
            opacity: 0;
            transition: opacity var(--e);
        }

        .acard:hover {
            background: var(--blue-hover);
            border-color: var(--blue-bd);
            box-shadow: 0 3px 14px rgba(0,0,0,0.16),
                        0 0 0 1px rgba(59,130,246,0.06) inset;
            transform: translateY(-1px);
        }
        .acard:hover::before { opacity: 1; }

        .acard-icon {
            width: 28px; height: 28px;
            border-radius: 7px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            background: var(--blue-glow);
            border: 1px solid var(--blue-bd);
            transition: background var(--e), border-color var(--e);
        }
        .acard:hover .acard-icon {
            background: rgba(59,130,246,0.16);
            border-color: rgba(59,130,246,0.28);
        }
        .acard-icon svg { width: 13px; height: 13px; }

        .acard-title {
            flex: 1;
            font-size: 12px;
            font-weight: 500;
            color: var(--t1);
            letter-spacing: -0.1px;
        }

        .acard-btn {
            display: flex;
            align-items: center;
            gap: 4px;
            padding: 4px 10px;
            background: var(--blue-glow);
            border: 1px solid var(--blue-bd);
            border-radius: 6px;
            cursor: pointer;
            font-family: inherit;
            font-size: 11px;
            font-weight: 500;
            color: var(--blue-lt);
            white-space: nowrap;
            transition: background var(--e), border-color var(--e), color var(--e);
            flex-shrink: 0;
        }
        .acard-btn:hover {
            background: rgba(59,130,246,0.20);
            border-color: rgba(59,130,246,0.32);
            color: var(--blue-xlt);
        }
        .acard-btn:active { transform: scale(0.98); }

        /* ── CONTEXT PANEL ──────────────────────── */
        .panel {
            display: flex;
            flex-direction: column;
            margin-top: 12px;
        }
        .panel.hidden { display: none; }

        .panel-hdr {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 6px 10px;
            background: var(--s1);
            border: 1px solid var(--bd);
            border-radius: var(--r) var(--r) 0 0;
            cursor: pointer;
            user-select: none;
            transition: background var(--e);
        }
        .panel-hdr:hover { background: var(--s2); }

        .panel-hdr-label {
            flex: 1;
            font-size: 9px;
            font-weight: 600;
            letter-spacing: 0.07em;
            text-transform: uppercase;
            color: var(--t3);
        }

        .panel-badge {
            font-size: 9px;
            font-weight: 600;
            color: var(--blue-lt);
            background: var(--blue-glow);
            border: 1px solid var(--blue-bd);
            border-radius: 10px;
            padding: 1px 6px;
        }

        .panel-toggle { color: var(--t3); transition: transform var(--e); }
        .panel-toggle.open { transform: rotate(180deg); }

        .panel-body {
            overflow: auto;
            padding: 10px 11px;
            background: rgba(0,0,0,0.25);
            border: 1px solid var(--bd);
            border-top: none;
            border-radius: 0 0 var(--r) var(--r);
            font-family: 'Cascadia Code','Fira Code','SF Mono','Courier New',monospace;
            font-size: 10.5px;
            line-height: 1.6;
            white-space: pre-wrap;
            word-break: break-all;
            color: var(--t2);
            max-height: 220px;
        }
        .panel-body.collapsed { display: none; }
        .panel-body::-webkit-scrollbar { width: 3px; }
        .panel-body::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 3px; }

        /* ── FOOTER ─────────────────────────────── */
        .footer {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding-top: 10px;
            border-top: 1px solid var(--bd);
            margin-top: 12px;
        }
        .footer-name { font-size: 10px; color: var(--t3); }
        .footer-ver  { font-size: 10px; color: var(--t4); }
    </style>
</head>
<body>
<div class="shell">

    <!-- HEADER -->
    <header class="hdr">
        <img class="logo" src="${logoUri}" width="36" height="36" alt="Kodexa" draggable="false" />
        <div class="hdr-copy">
            <span class="hdr-name">Kodexa</span>
            <span class="hdr-tagline">Inference Engine for AI-generated Software</span>
        </div>
        <div class="ready-pill">
            <span class="ready-dot"></span>
            <span class="ready-text">Ready</span>
        </div>
    </header>

    <!-- REPO CARD -->
    <div class="repo-card">
        <div class="repo-left">
            <span class="repo-label">Repository</span>
            <span class="repo-name" id="repo-name">Python &bull; 58 files</span>
        </div>
        <span class="repo-status">Ready</span>
    </div>

    <!-- ACTION CARDS -->
    <p class="sec-label">Actions</p>

    <div class="action-cards">

        <div class="acard">
            <span class="acard-icon">
                <svg viewBox="0 0 14 14" fill="none">
                    <path d="M1 3h12M1 7h8M1 11h5" stroke="#60a5fa" stroke-width="1.2" stroke-linecap="round"/>
                    <circle cx="11.5" cy="10.5" r="2" stroke="#60a5fa" stroke-width="1.1"/>
                    <path d="M13 12l1 1" stroke="#60a5fa" stroke-width="1.1" stroke-linecap="round"/>
                </svg>
            </span>
            <span class="acard-title">Repository Scan</span>
            <button class="acard-btn" data-command="debug">Run</button>
        </div>

        <div class="acard">
            <span class="acard-icon">
                <svg viewBox="0 0 14 14" fill="none">
                    <circle cx="7" cy="7" r="5.5" stroke="#60a5fa" stroke-width="1.1"/>
                    <path d="M7 4.5v3" stroke="#60a5fa" stroke-width="1.3" stroke-linecap="round"/>
                    <circle cx="7" cy="9.5" r="0.6" fill="#60a5fa"/>
                </svg>
            </span>
            <span class="acard-title">Architecture Review</span>
            <button class="acard-btn" data-command="explain">Run</button>
        </div>

        <div class="acard">
            <span class="acard-icon">
                <svg viewBox="0 0 14 14" fill="none">
                    <path d="M7 1.5L4 7.5h3L5.5 12.5l5-7H7.5Z" stroke="#60a5fa" stroke-width="1.1" stroke-linejoin="round" fill="rgba(59,130,246,0.10)"/>
                </svg>
            </span>
            <span class="acard-title">Generate Fixes</span>
            <button class="acard-btn" data-command="optimize">Generate</button>
        </div>

    </div>

    <!-- CONTEXT PANEL -->
    <div id="output-panel" class="panel hidden">
        <div class="panel-hdr" id="panel-toggle-btn" role="button" aria-expanded="true">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M1 3h8M1 5.5h6M1 8h4" stroke="#60a5fa" stroke-width="1.1" stroke-linecap="round"/>
            </svg>
            <span class="panel-hdr-label">Context Payload</span>
            <span class="panel-badge" id="panel-badge">live</span>
            <svg class="panel-toggle open" id="panel-chevron" width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M2 3.5l3 3 3-3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        </div>
        <pre class="panel-body" id="context-container"></pre>
    </div>

    <!-- FOOTER -->
    <footer class="footer">
        <span class="footer-name">Kodexa</span>
        <span class="footer-ver">v0.1.0</span>
    </footer>

</div>
<script nonce="${nonce}">
    (function () {
        const vscode = acquireVsCodeApi();

        // ── Button click → postMessage to extension host ──
        const buttons = document.querySelectorAll('.acard-btn');
        buttons.forEach(function (button) {
            button.addEventListener('click', function () {
                var command = button.getAttribute('data-command');
                if (command) {
                    vscode.postMessage({ command: command });
                }
            });
        });

        // ── Collapsible panel toggle ──────────────────────
        var panelBody    = document.getElementById('context-container');
        var panelChevron = document.getElementById('panel-chevron');
        var toggleBtn    = document.getElementById('panel-toggle-btn');
        var isOpen       = true;

        toggleBtn.addEventListener('click', function () {
            isOpen = !isOpen;
            if (isOpen) {
                panelBody.classList.remove('collapsed');
                panelChevron.classList.add('open');
            } else {
                panelBody.classList.add('collapsed');
                panelChevron.classList.remove('open');
            }
        });

        // ── Listen for messages from the extension ────────
        window.addEventListener('message', function (event) {
            var message = event.data;
            if (message.command === 'showContext') {
                var contextContainer = document.getElementById('context-container');
                if (contextContainer) {
                    contextContainer.textContent = JSON.stringify(message.payload, null, 2);
                    // Make panel visible
                    var outputPanel = document.getElementById('output-panel');
                    if (outputPanel) {
                        outputPanel.classList.remove('hidden');
                    }
                    // Ensure body is expanded when new data arrives
                    if (!isOpen) {
                        isOpen = true;
                        contextContainer.classList.remove('collapsed');
                        panelChevron.classList.add('open');
                    }
                }
            }
        });
    }());
</script>
</body>
</html>`;
	}

	private getNonce(): string {
		let text = '';
		const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
		for (let i = 0; i < 32; i++) {
			text += possible.charAt(Math.floor(Math.random() * possible.length));
		}
		return text;
	}
}
