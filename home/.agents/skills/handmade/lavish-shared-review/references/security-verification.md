# Secure access and verification

Read this before networking. These are acceptance gates, not authorization to
install tools, create accounts, incur costs, or disclose content. Use current
installed CLI help and provider documentation; do not copy a stale tunnel recipe.

Current upstream sources:
- [README: live feedback, network binding, allowed hosts, and CLI](https://github.com/kunchenguid/lavish-axi#readme).
- [Standalone share backend](https://github.com/kunchenguid/lavish-axi/blob/main/docs/self-hosting-share.md)
  documents publication, not live review transport.
Compare these with the installed CLI version; newer documentation is not proof
that an older executable supports a particular option or API.

## Choose the smallest authorized route

- **Cloudflare Quick Tunnel:** useful for short-lived access without a stable
  hostname; it does not itself establish reviewer authentication. Ensure an
  approved authentication proxy covers the entire tunnel and its live transport.
  Discover its exact hostname, configure that hostname in proxy and Lavish before
  forwarding, and do not serve real content through an ungated startup window.
- **ngrok or equivalent:** consider existing account/policy, authentication
  capability, limits, duration, stable domain needs, and paid features. Provider
  branding or HTTPS alone does not prove an audience-restricted gate.
- **Tailscale/private network:** use only when all reviewers have authorized
  access. Restrict the audience with existing network/access policy, use HTTPS,
  and gate the application appropriately. Do not expose an unauthenticated host
  file-reading server to an entire tailnet. Phone access must actually be tested.
- **Organization-managed ingress:** prefer existing approved identity/access
  controls where sensitivity or retention policy requires them. Do not route
  around organizational restrictions because a public tunnel is easier.

Explain unresolved choices only when material: who can access, where content
transits, required account/install/permission, lifetime, cost, and credential
handling. A request to “share with PM” does not authorize arbitrary third-party
publication or all company files. Reuse authorization already exact for this scope.

## Isolation and proxy contract

Lavish is not a filesystem sandbox or an authentication server: its origin can
read/serve local files. Merely changing cwd, `STATE_DIR`, or the URL is not isolation.
For public access use a restricted runtime (for example a container) with only
copied sanitized artifact/assets and dedicated writable state. Private routes
also require an explicit filesystem/access-risk assessment; prefer the same
restricted runtime. Do not assume an image is available or silently pull/install
one. If existing tooling cannot provide the authorized boundary, stop networking
and report the exact missing prerequisite.

- Inspect copied HTML/assets for secrets, private links, remote fonts/CDNs,
  scripts, and asset symlinks escaping the copy. Minimize dependencies and egress.
- No home/repo/auth mounts, inherited secret environment, engine socket, or
  unrelated shared volumes. Restrict process privileges and network reach using
  the chosen runtime's supported controls. Tool/runtime files are not approval
  to make host files reachable; inspect the actual mount/filesystem boundary.
- Select an unused port; Lavish can discover and reuse a server on the same port
  across local addresses, so state directory alone does not isolate servers.
  Record unique task-owned process/resource identifiers privately.
- Set `LAVISH_AXI_HOST` explicitly. Current documented behavior: explicit host
  bypasses automatic Tailscale binding; wildcard host inputs are restricted to
  loopback. Use exact container private IP if loopback cannot reach the proxy;
  publish/route only the narrow required interface, never the raw origin publicly.
- Set distinct `LAVISH_AXI_PORT`, `LAVISH_AXI_STATE_DIR`, and `LAVISH_AXI_NO_OPEN=1`
  for **every** CLI operation in that namespace. Resolve artifact canonical paths
  there. Keep any agent-only origin/control access on a private route.
- Set `LAVISH_AXI_ALLOWED_HOSTS` to exact required names including the external
  hostname; it is a whitespace list, not a wildcard policy. Never use `*`.
  Add only exact internal names genuinely needed for control/proxy operation.
- At ingress reject unexpected authority/Host. Remove untrusted incoming
  `Forwarded`, `X-Forwarded-*`, and equivalent proxy-trust headers; set only the
  trusted values needed downstream, including exact `X-Forwarded-Host` and
  `X-Forwarded-Proto: https`. Keep legitimate browser Origin/Referer for Lavish
  validation; do not rewrite hostile Origin into a trusted value.
- Authenticate every reviewer path: HTML, filesystem assets, feedback endpoints,
  and live transport. Ensure no alternate port/hostname bypasses the gate.
  Review current control routes before deciding what ingress may expose; keep
  unnecessary file/session/agent-management surfaces private. Do not invent a
  route allowlist from this document or cripple required browser transport.
- Keep credentials out of tracked files, URLs/query strings, shell history,
  process arguments where avoidable, screenshots, and verbose logs. Prefer
  protected files/stdin or the access tool's secure input. Share credentials only
  through an approved private channel; do not echo them in evidence or chat logs.

## Verification before reviewer handover

Use a disposable synthetic session under the same isolation, gate, hostname,
proxy headers, and transport configuration intended for review. Record only
redacted results and resource ownership in private task state, never dotfiles.
Use a single reviewer tab and one poll owner at a time.

1. **Local artifact:** inspect meaningful content, accessible labels/keyboard
   behavior, final-value submission, queue-vs-send states, and visible failure
   without SDK/transport. Check a narrow mobile viewport for overflow and touch
   usability. A viewport test alone is not proof of phone/network access.
2. **Denied access:** from outside the origin network, anonymous and incorrect
   credentials cannot fetch HTML, assets, or interact with feedback/transport.
   Follow redirects and inspect the actual protected destination, not just an
   initial status. Do not include credentials in captured command/output.
3. **Authorized render:** a permitted reviewer authenticates at the real HTTPS
   endpoint without certificate bypass and sees the correct artifact, controls,
   and connected review chrome. Confirm intended mobile/phone access if claimed.
4. **Transport round trip:** start a tracked poll; submit a distinctive synthetic
   answer through the external form and Send to Agent. Observe its exact question
   ID/value in poll output, send a CLI reply, and observe successful server
   acceptance (and browser display when claiming that). A 200 page or successful
   local POST alone proves neither end-to-end delivery nor reviewer reading.
5. **Security rejection:** with otherwise valid authentication, probe unexpected
   Host and a genuinely cross-origin mutation through the relevant boundary;
   denial must not rely solely on failed auth. Spoofed forwarding headers must
   be rejected or overwritten with trusted values, never honored. Probe Lavish
   directly over the controlled private path to confirm it rejects an invalid
   forwarded host and foreign Origin even if ingress blocks or normalizes them.
   Never add broad allowed hosts, strip hostile Origin, disable checks, or invent
   raw routes to force a passing test. Derive mutation probes from the current
   browser request or installed implementation.
6. **Listener ownership:** prove foreground delivery or the harness completion
   callback resumes this agent. No untracked detached poll, listener takeover,
   promise of monitoring across inactive agent turns, or simultaneous coediting.
7. **Clean probe:** end the disposable synthetic session and preserve/remove its
   answers under the agreed policy. Start the real unique artifact session and
   tracked listener only after gates pass; do not hand over a user-ended probe.

If external access, a second network, phone, approved account, or gate cannot be
exercised, name exactly what was and was not tested. A local HTTPS proxy smoke
is useful **partial evidence**, never external/phone verification. No company
material should be exposed merely to finish a probe. Handover must not describe
an unverified route as verified or an absent listener as live.

## End, retention, and shutdown evidence

- `browser_disconnected` is resumable, not user end: ask before reopen/end. User
  `ended` may carry the final submitted batch; read/preserve it once, then stop.
  Unsent edits are not submitted answers and have no promised persistence.
- Save required answers/attachments and a concise decision receipt to the agreed
  protected destination **before** deleting state. Check that the intended saved
  material is accessible there; report the actual preservation performed rather
  than asserting unspecified durability or retention. Validate attachment paths
  inside the isolated runtime before reading/copying them.
- Stop only task-owned poll, Lavish server, proxy, tunnel, runtime, and temporary
  gate grants. Use the recorded namespace/port/IDs, not default/global stop,
  broad process-name kills, or deleting a shared state directory. Preserve
  unrelated sessions, user accounts, organization policy, and provider config.
- Verify owned processes/resources stopped and the external endpoint no longer
  serves the review service (closed tunnel, unreachable origin, or explicit
  denial). DNS/URL disappearance is not necessary, nor is one failed request
  proof all resources stopped. Report remaining provider logs/retention honestly.
- Standalone ht-ml.app publishing is outside this loop. Its `--unpublish` locks
  a replacement placeholder, not provider-side deletion; if separately authorized
  publishing occurred, retain required update credentials securely until its
  agreed lifecycle ends and never claim the host erased prior content.
