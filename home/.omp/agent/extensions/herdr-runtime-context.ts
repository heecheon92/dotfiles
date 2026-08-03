import type { ExtensionAPI } from "@oh-my-pi/pi-coding-agent/extensibility/extensions";

// User-authored OMP context bridge for Herdr-managed sessions.
// Herdr's generated lifecycle integration lives beside this file and remains
// owned by `herdr integration install omp`.

function runtimeDetails() {
  return {
    workspaceId: process.env.HERDR_WORKSPACE_ID,
    tabId: process.env.HERDR_TAB_ID,
    paneId: process.env.HERDR_PANE_ID,
  };
}

function runtimeMessage(): string {
  const { workspaceId, tabId, paneId } = runtimeDetails();

  return [
    "<herdr-runtime-context>",
    "This agent is running inside a Herdr-managed pane.",
    `Workspace: ${workspaceId ?? "unknown"}`,
    `Tab: ${tabId ?? "unknown"}`,
    `Pane: ${paneId ?? "unknown"}`,
    "The user has enabled user-global Herdr awareness.",
    "Before the first Herdr control command in a task, read skill://herdr and follow it.",
    "Use scoped, read-only Herdr inspection proactively when it materially improves correctness.",
    "Do not delegate, create layout, change focus, or send pane input merely because Herdr is available.",
    "Never run bare `herdr` from inside Herdr; use a specific CLI subcommand.",
    "</herdr-runtime-context>",
  ].join("\n");
}

export default function registerHerdrRuntimeContext(pi: ExtensionAPI) {
  let injected = false;

  const reset = () => {
    injected = false;
  };

  pi.on("session_start", reset);
  pi.on("session_switch", reset);
  pi.on("before_agent_start", () => {
    if (process.env.HERDR_ENV !== "1" || injected) {
      return;
    }

    injected = true;
    return {
      message: {
        customType: "herdr-runtime-context",
        content: runtimeMessage(),
        display: false,
        details: runtimeDetails(),
      },
    };
  });
}
