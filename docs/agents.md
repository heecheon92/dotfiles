# 에이전트와 보조 도구

공유 에이전트 스킬, OMP 저비용 모델 오버레이와 명시적 Lavish 사용 정책을
설명합니다. 이 문서의 저장소 경로와 `./rebuild.sh` 명령은 모두 저장소 루트를
기준으로 합니다.

OMP의 모델 역할, 내장 에이전트, 위임 시 모델 선택 우선순위와 백그라운드 동작은
[모델 라우팅 가이드](../home/.omp/agent/MODEL-ROUTING.md)를 참고하세요.
이 문서는 사람이 요청할 때 확인한 최신 안정 버전의 동작만 유지하며, Home Manager로
`~/.omp/agent/MODEL-ROUTING.md`에도 연결합니다.

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

## OMP 입력 자동완성

`home/.omp/agent/config.yml`은 `spelling.autocomplete: auto`를 명시합니다.
OMP 18.3.5에서 `auto`는 로컬 N-gram 엔진을 사용하며, 입력 문맥과 로컬
프롬프트 기록을 바탕으로 희미한 단어 완성 제안을 표시합니다.
`Tab`은 제안과 뒤쪽 공백을, 오른쪽 화살표는 공백 없이 제안을 수락합니다.
이 설정은 Neovim 자동완성이나 응답 모델 선택과는 별개입니다.

`auto`는 OMP의 기본 엔진 선택을 따르며 SmolLM 모델을 내려받지 않습니다.
`ngram`은 엔진을 고정하고, `apple`은 macOS 사전 기반 제안,
`smollm`은 별도 모델 다운로드가 필요한 로컬 예측, `off`는 제안 끄기입니다.
YAML 변경은 기존 연결을 통해 다음 OMP 실행에 반영되므로 Nix 재빌드는
필요하지 않습니다.

## OMP 데스크톱 제어

`home/.omp/agent/config.yml`은 `computer.enabled: true`로 데스크톱 제어를
기본 활성화합니다. 새 OMP 실행부터 적용되며 Nix 재빌드는 필요하지 않습니다.
현재 세션에서는 `/computer on`, `/computer off`, `/computer status`로
활성화 상태를 제어하거나 확인합니다.

macOS에서는 실행 호스트에 화면 기록과 손쉬운 사용 권한이 필요하며,
권한 부여 후 호스트를 재시작해야 할 수 있습니다. 이 설정은 기존 도구 승인
정책을 변경하지 않습니다. `tools.approvalMode`가 `yolo`이면 입력 동작에도
별도 승인 창이 보장되지 않으므로 실제 앱을 조작할 때 주의하세요.

## OMP 도구 출력 보관

OMP 18.4.9부터 bash·Python·JavaScript 실행의 저장 출력 artifact는 기본
16 MiB 제한을 따릅니다. 공유 설정은 이 기본값을 유지하며, 큰 출력은 앞부분과
끝부분만 남고 중간은 생략됩니다. 전체 로그가 필요한 작업은 별도 파일에
명시적으로 저장하세요. `tools.artifactMaxBytes: 0`은 무제한 보관이므로
기본 설정에 추가하지 않습니다.

## OMP 저비용 모델 오버레이

사용 비용을 줄이고 싶을 때는 `ob` Zsh alias로 OMP를 실행합니다. 이 설정은
기본 설정과 인증·세션 상태는 그대로 공유하면서
`home/.omp/agent/config-budget.yml`의 저비용 모델 역할과 fallback만 현재
프로세스에 덮어씁니다. 일반 `omp` 실행은 기본 설정을 그대로 사용합니다.

```bash
ob
```

각 overlay의 모델 선택과 세부 설정은 해당 YAML 파일을 기준으로 확인합니다.

## OMP 실험용 오버레이

`config-experimental.yml`은 새로 출시된 모델을 시험하기 위한 설정입니다.
최상위 성능의 모델만을 대상으로 하지는 않습니다.

`oe`는 `omp --config ~/.omp/agent/config-experimental.yml`을 실행합니다.
Home Manager가 `home/.omp/agent/config-experimental.yml`을 해당 경로에 연결하며,
alias와 파일 연결을 처음 추가한 뒤에는 `./rebuild.sh`로 적용해야 합니다.
새 셸에서 `oe`를 실행하면 기본 설정 위에 실험용 overlay를 적용합니다.
이후 YAML 내용만 수정할 때는 재빌드 없이 다음 `oe` 실행에 반영됩니다.
일반 `omp`와 `ob`의 설정은 변경하지 않습니다.

## OMP Ultra 오버레이

`home/.omp/agent/config-ultra.yml`은 구독 기반 사용량을 적극적으로
사용하도록 구성한 overlay입니다.

모델 역할과 task fallback만 덮어쓰며, 나머지 설정은 기본 설정을 상속합니다.

저장소 루트에서는 새 링크를 적용하기 전에도 실행할 수 있습니다.

```bash
omp --config ./home/.omp/agent/config-ultra.yml
```

Home Manager 링크를 처음 추가한 뒤에는 `./rebuild.sh`로 적용합니다.
이후에는 아래 경로를 사용하며, YAML 내용만 바꿀 때는 재빌드가 필요 없습니다.
일반 `omp` 실행에는 이 overlay가 자동 적용되지 않습니다.

```bash
omp --config ~/.omp/agent/config-ultra.yml
# 어려운 작업에서 백그라운드 검토를 추가할 때만:
omp --config ~/.omp/agent/config-ultra.yml --advisor
```

advisor 모델을 지정하는 것만으로 검토가 켜지지는 않습니다.
실행 중에는 `/advisor on`, `/advisor status`, `/advisor off`로 제어합니다.
기본 advisor는 주 에이전트의 새 진행 내용을 검토하고 읽기 도구로 조사한 뒤
조언을 전달합니다. 심각한 문제는 진행을 중단하거나 방향을 바꿀 수 있지만,
작업 전 승인을 보장하는 장치는 아니며 별도 모델 사용량을 소비합니다.

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
