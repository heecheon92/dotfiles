# 에이전트와 보조 도구

공유 에이전트 스킬, OMP 저비용 모델 오버레이와 명시적 Lavish 사용 정책을
설명합니다. 이 문서의 저장소 경로와 `./rebuild.sh` 명령은 모두 저장소 루트를
기준으로 합니다.

## Claude Code 설치 채널

`configuration.nix`는 Homebrew의 `claude-code@latest` cask로 Claude Code를 관리합니다.
일반 `claude-code` cask와는 충돌하므로 두 cask를 동시에 선언하거나 설치하지 않습니다.
다른 호스트에 일반 cask가 설치되어 있다면 재빌드 전에 해당 cask를 제거하고
`claude-code@latest`로 전환하세요. 인증과 로컬 설정은 저장소에 넣지 않습니다.

## 공유 에이전트 스킬

이 저장소에서 관리하는 에이전트 스킬 목록과 개별 설치 방법은
[`home/.agents/skills/README.md`](../home/.agents/skills/README.md)를
참고하세요. 전체 dotfiles 구성을 적용하지 않아도 원하는 스킬 디렉터리만
에이전트 또는 Codex 기본 설치 도구로 설치할 수 있습니다.

## OMP 저비용 모델 오버레이

Codex 사용량을 아껴야 할 때는 `ob` Zsh alias로 OMP를 실행합니다. 이 설정은
기본 설정과 인증·세션 상태는 그대로 공유하면서
`home/.omp/agent/config-budget.yml`의 저비용 모델 역할과 fallback만 현재
프로세스에 덮어씁니다. 일반 `omp` 실행은 기존 고성능 모델 구성을 유지합니다.

```bash
ob
```

기본(default)·slow·task 역할은 OpenRouter GLM 5.3 flash max를 사용하고,
smol·vision·commit 역할은 Luna, plan 역할은 Terra, advisor 역할은 Sol high를
유지합니다. fallback에는 Sol을 넣지 않아 지원 역할이 예기치 않게 고비용 모델로
복귀하지 않습니다.

## OMP 실험용 오버레이

`oe`는 `omp --config ~/.omp/agent/config-experimental.yml`을 실행합니다.
Home Manager가 `home/.omp/agent/config-experimental.yml`을 해당 경로에 연결하며,
alias와 파일 연결을 처음 추가한 뒤에는 `./rebuild.sh`로 적용해야 합니다.
새 셸에서 `oe`를 실행하면 기본 설정 위에 실험용 overlay를 적용합니다.
이후 YAML 내용만 수정할 때는 재빌드 없이 다음 `oe` 실행에 반영됩니다.
일반 `omp`와 `ob`의 설정은 변경하지 않습니다.

## 명시적 Lavish 사용

Lavish CLI는 `packages/lavish-axi.nix`에서 version을 pin하며 `./rebuild.sh`로
설치합니다. 사용자가 HTML review를 명시적으로 요청했을 때만
`lavish-axi <html-file>`로 실행합니다.

Lavish bundled skill은 전역 skill 목록에 연결하지 않고, Claude Code, Codex,
OpenCode 및 GitHub Copilot CLI의 `SessionStart` hook이나 OMP ambient-context
extension도 등록하지 않습니다. `lavish-axi setup hooks`를 실행하면 자동 주입이
다시 설치되므로 실행하지 않습니다. 기존 hook을 제거한 뒤에는 실행 중인 harness를
재시작하고 새 대화를 시작해야 이미 로드된 지침이 남지 않습니다.

Lavish를 올릴 때는 Nix expression의 version과 npm tarball hash, 그리고
`packages/lavish-axi/package.json` 및 `package-lock.json`의 dependency lock을
함께 갱신합니다.
