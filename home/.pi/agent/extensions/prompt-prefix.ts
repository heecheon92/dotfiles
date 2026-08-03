import { CustomEditor, type ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { visibleWidth } from "@earendil-works/pi-tui";

class PromptPrefixEditor extends CustomEditor {
	promptPrefix = "> ";
	background: (text: string) => string = (text) => text;

	setPromptPrefix(prefix: string): void {
		this.promptPrefix = prefix;
		this.tui.requestRender();
	}

	render(width: number): string[] {
		const prefixWidth = visibleWidth(this.promptPrefix);
		if (width <= prefixWidth) return super.render(width);

		// The base editor always renders top and bottom borders. Making them empty
		// leaves reliable separators that we can remove without touching content.
		this.borderColor = () => "";
		const lines = super.render(width - prefixWidth);
		const bottomBorder = lines.findIndex((line, index) => index > 0 && line === "");
		if (bottomBorder === -1) return lines;

		const padding = " ".repeat(prefixWidth);
		const inputLines = lines.slice(1, bottomBorder).map((line, index) => {
			const prefix = index === 0 ? this.promptPrefix : padding;
			return this.background(`${prefix}${line}`);
		});

		// Replace the removed borders with background-filled padding rows so the
		// editor keeps its original height and remains visible while empty.
		const backgroundPadding = this.background(" ".repeat(width));

		// Keep autocomplete results outside the input background.
		const autocompleteLines = lines.slice(bottomBorder + 1).map((line) => `${padding}${line}`);
		return [backgroundPadding, ...inputLines, backgroundPadding, ...autocompleteLines];
	}
}

export default function promptPrefix(pi: ExtensionAPI) {
	let prefix = "> ";
	let activeEditor: PromptPrefixEditor | undefined;

	pi.registerCommand("prompt-prefix", {
		description: "Change the input prompt prefix for this session",
		getArgumentCompletions: (input) => {
			const options = [">", "$", "❯", "off", "status"];
			const query = input.trim();
			const matches = options.filter((option) => option.startsWith(query));
			return matches.length > 0 ? matches.map((option) => ({ value: option, label: option })) : null;
		},
		handler: async (args, ctx) => {
			const value = args.trim();

			if (!value || value === "status") {
				ctx.ui.notify(`Prompt prefix: ${prefix ? JSON.stringify(prefix.trimEnd()) : "off"}`, "info");
				return;
			}

			if (value === "off") {
				prefix = "";
			} else {
				if (visibleWidth(value) > 4) {
					ctx.ui.notify("Prompt prefix must be 4 columns or fewer", "error");
					return;
				}
				prefix = `${value} `;
			}

			activeEditor?.setPromptPrefix(prefix);
			ctx.ui.notify(`Prompt prefix: ${prefix ? JSON.stringify(prefix.trimEnd()) : "off"}`, "info");
		},
	});

	pi.on("session_start", (_event, ctx) => {
		ctx.ui.setEditorComponent((tui, theme, keybindings) => {
			const editor = new PromptPrefixEditor(tui, theme, keybindings);
			editor.promptPrefix = prefix;
			editor.background = (text) =>
				text
					.split("\x1b[0m")
					.map((segment) => ctx.ui.theme.bg("userMessageBg", segment))
					.join("\x1b[0m");
			activeEditor = editor;
			return editor;
		});
	});

	pi.on("session_shutdown", () => {
		activeEditor = undefined;
	});
}
