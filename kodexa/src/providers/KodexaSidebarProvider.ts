import * as vscode from 'vscode';

export class KodexaSidebarProvider implements vscode.WebviewViewProvider {
	private static _view?: vscode.WebviewView;
	private _messageHandler?: (message: any) => void;

	constructor(
		private readonly _extensionUri: vscode.Uri,
	) {}

	public setMessageHandler(handler: (message: any) => void): void {
		this._messageHandler = handler;
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
			(message) => {
				try {
					if (this._messageHandler) {
						this._messageHandler(message);
					}
				} catch (error) {
					console.error('Webview message handler failed:', error);
				}
			}
		);

		webviewView.onDidDispose(() => {
			KodexaSidebarProvider._view = undefined;
		});
	}

	private _getHtmlForWebview(webview: vscode.Webview): string {
		const nonce = this.getNonce();

		return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';">
    <title>Kodexa</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background-color: var(--vscode-sideBar-background);
            color: var(--vscode-sideBar-foreground);
            padding: 16px;
            height: 100vh;
            overflow: hidden;
        }

        .container {
            display: flex;
            flex-direction: column;
            height: 100%;
        }

        header {
            margin-bottom: 24px;
            padding-bottom: 16px;
            border-bottom: 1px solid var(--vscode-sideBar-border);
        }

        .title {
            font-size: 20px;
            font-weight: 600;
            margin-bottom: 4px;
            color: var(--vscode-sideBar-foreground);
            letter-spacing: -0.5px;
        }

        .subtitle {
            font-size: 13px;
            color: var(--vscode-descriptionForeground);
            font-weight: 400;
        }

        main {
            display: flex;
            flex-direction: column;
            gap: 12px;
            flex: 1;
        }

        .action-button {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 16px;
            background-color: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
            border: 1px solid var(--vscode-button-border);
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            transition: all 0.2s ease;
            text-align: left;
        }

        .action-button:hover {
            background-color: var(--vscode-button-secondaryHoverBackground);
            border-color: var(--vscode-button-hoverBorder);
            transform: translateY(-1px);
        }

        .action-button:active {
            transform: translateY(0);
            background-color: var(--vscode-button-activeBackground);
        }

        .icon {
            font-size: 20px;
            line-height: 1;
        }

        .text {
            flex: 1;
            line-height: 1.4;
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1 class="title">🚀 Kodexa</h1>
            <p class="subtitle">Your AI Pair Programmer</p>
        </header>
        <main>
            <button class="action-button" data-command="debug">
                <span class="icon">✨</span>
                <span class="text">Debug with AI</span>
            </button>
            <button class="action-button" data-command="explain">
                <span class="icon">🧠</span>
                <span class="text">Explain Error</span>
            </button>
            <button class="action-button" data-command="optimize">
                <span class="icon">⚡</span>
                <span class="text">Optimize File</span>
            </button>
        </main>
    </div>
    <script nonce="${nonce}">
        (function() {
            const vscode = acquireVsCodeApi();
            const buttons = document.querySelectorAll('.action-button');

            buttons.forEach(button => {
                button.addEventListener('click', () => {
                    const command = button.getAttribute('data-command');
                    if (command) {
                        vscode.postMessage({ command });
                    }
                });
            });
        })();
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
