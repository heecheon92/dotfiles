import type { ExtensionAPI } from "@oh-my-pi/pi-coding-agent/extensibility/extensions";

const CONTEXT_MARKER = "OMP_NATIVE_LAVISH_CONTEXT_V1";
const COMMAND_TIMEOUT_MS = 10_000;

function formatAmbientContext(output: string): string {
  return [
    "<lavish-axi-context>",
    CONTEXT_MARKER,
    output,
    "</lavish-axi-context>",
  ].join("\n");
}

export default function registerLavishRuntimeContext(pi: ExtensionAPI) {
  let ambientContext: string | undefined;

  const refresh = async () => {
    try {
      const result = await pi.exec("lavish-axi", [], {
        cwd: process.cwd(),
        timeout: COMMAND_TIMEOUT_MS,
      });

      if (result.code !== 0) {
        ambientContext = undefined;
        pi.logger.warn("lavish-axi ambient context failed", {
          code: result.code,
          stderr: result.stderr.trim(),
        });
        return;
      }

      const output = result.stdout.trim();
      ambientContext = output ? formatAmbientContext(output) : undefined;
    } catch (error) {
      ambientContext = undefined;
      pi.logger.warn("lavish-axi ambient context failed", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };

  pi.on("session_start", refresh);
  pi.on("session_switch", refresh);
  pi.on("before_agent_start", (event) => {
    if (!ambientContext) {
      return;
    }

    return {
      systemPrompt: [...event.systemPrompt, ambientContext],
    };
  });
}
