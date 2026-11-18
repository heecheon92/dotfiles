import type { ExtensionAPI, ExtensionContext } from "@oh-my-pi/pi-coding-agent/extensibility/extensions";

export default function registerModelServiceTier(pi: ExtensionAPI) {
  const applyTier = (_event: unknown, { model }: ExtensionContext) => {
    if (model?.provider !== "openai-codex") return;

    if (model.id === "gpt-6.2-sol") {
      pi.setServiceTier("openai", "ultrafast");
    } else if (model.id === "gpt-6.2-astra") {
      pi.setServiceTier("openai", "priority");
    }
  };

  pi.on("before_agent_start", applyTier);
  pi.on("retry_fallback_applied", applyTier);
}
