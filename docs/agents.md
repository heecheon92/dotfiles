# 에이전트와 보조 도구

공유 에이전트 스킬과 OMP 모델 라우팅 설정을 설명합니다.
이 문서의 저장소 경로와 `./rebuild.sh` 명령은 모두 저장소 루트를 기준으로 합니다.

OMP의 모델 역할, 내장 에이전트, 위임 시 모델 선택 우선순위와 백그라운드 동작은
[모델 라우팅 가이드](../home/.omp/agent/MODEL-ROUTING.md)를 참고하세요.
이 문서는 사람이 요청할 때 확인한 최신 안정 버전의 동작만 유지하며, Home Manager로
`~/.omp/agent/MODEL-ROUTING.md`에도 연결합니다.

## OMP 설정 주석 보존

설정은 `home/.omp/agent/config.yml` 원본에서 필요한 줄만 수정하세요.
현재 Home Manager 연결은 이 파일을 가리키므로 `/nix/store` 파일을 편집하지 않습니다.
`omp config get`과 `omp config list`는 값을 확인할 때 사용할 수 있습니다.

OMP 18.20.2의 [설정 저장 경로](https://github.com/can1357/oh-my-pi/blob/v18.20.2/packages/coding-agent/src/config/settings.ts)는
파싱한 값을 [YAML로 다시 직렬화](https://github.com/can1357/oh-my-pi/blob/v18.20.2/packages/utils/src/yaml-config.ts)하므로
주석과 빈 줄을 보존하지 않습니다. `omp config set`이나 OMP 설정 UI의 영구 저장 대신
원본을 직접 편집하세요. 모델 역할 등 다른 영구 설정 저장도 같은 경로를 사용할 수 있습니다.
저장 후 주석이 사라졌다면 값 변경은 유지하고 Git diff에서 주석과 주변 배치만 복원합니다.
이는 편집 절차상의 예방책이며 OMP 자체의 저장 동작을 수정하거나 차단하지는 않습니다.

## Claude Code 설치 채널

`configuration.nix`는 Homebrew의 `claude-code@latest` cask로 Claude Code를 관리합니다.
일반 `claude-code` cask와는 충돌하므로 두 cask를 동시에 선언하거나 설치하지 않습니다.
다른 호스트에 일반 cask가 설치되어 있다면 재빌드 전에 해당 cask를 제거하고
`claude-code@latest`로 전환하세요.

## Claude Code 개인 설정

Home Manager는 `~/.claude/settings.json`을 `home/.claude/settings.json`에 연결합니다.
이 파일은 개인 계정용 설정으로, 기본 모델과 권한 모드, 플러그인, 세션 시작 hook,
그리고 실험 기능인 Code Mode(`env.CLAUDE_CODE_EXPERIMENTAL_CODE_MODE`)를 담습니다.
Claude Code뿐 아니라 다른 도구가 이 설정을 바꿔도 링크를 통해
저장소 파일이 바로 바뀌므로, 변경 내용은 Git diff에서 확인한 뒤 커밋하세요.

인증 정보와 실행 상태(`~/.claude.json`, 세션, 기록, 캐시)는 저장소에 넣지 않습니다.
회사 계정용 설정 디렉터리(`CLAUDE_CONFIG_DIR`로 지정하는 별도 경로)도 관리하지
않습니다. 재빌드할 때 기존 `settings.json`이 일반 파일이면 Home Manager가 백업한 뒤
링크로 바꿉니다. 그 전에 로컬 파일과 저장소 파일의 차이를 먼저 확인하세요.

Code Mode에서는 Claude가 여러 도구 호출을 하나의 JavaScript로 묶어 실행합니다.
Code Mode로 시작한 세션은 Code Mode가 켜진 상태에서만 이어서 열 수 있고, Remote
Control, Claude in Chrome, computer use는 쓸 수 없습니다. 끄려면 값을 `"0"`으로
바꾸거나 해당 줄을 지운 뒤 새 세션을 시작합니다.

## 공유 에이전트 스킬

이 저장소에서 관리하는 에이전트 스킬 목록과 개별 설치 방법은
[`home/.agents/skills/README.md`](../home/.agents/skills/README.md)를
참고하세요. 전체 dotfiles 구성을 적용하지 않아도 원하는 스킬 디렉터리만
에이전트 또는 Codex 기본 설치 도구로 설치할 수 있습니다.

## OMP 모델 역할과 위임

기본 대화 역할 `default`는 `anthropic/claude-fable-5-2:medium`입니다.
위임은 Sol이 구현하고(2026-11-22부터 몇 주간 시험), Fable이 계획하고, Astra가 리뷰하도록 나눕니다.
이 분리는 사용자가 정한 출발점이며 모델의 우열이나 벤치마크 결과를 뜻하지
않습니다. 메인 에이전트가 작업 범위와 위험도를 보고 위임 유형을 선택합니다.

- `task`: `@task`, `openai-codex/gpt-6.2-sol:high`. 일반 구현과 디버깅의
  기본 위임입니다. 시험 기간 동안 Sol을 쓰며, 이전 값인
  `anthropic/claude-opus-5-5:high`는 `task` fallback 체인의 첫 항목입니다.
- `fast-task`: `@fast_task`, `openai-codex/gpt-6.2-sol:high`. 접근 방법과
  범위가 명확한 구현에 씁니다. 이 계정에서 GPT-6.2 Sol의 Ultrafast를 쓸 수 있어
  사용자가 기본 모델로 선택했습니다. `high`는 추론 수준이고, Ultrafast는
  `model-service-tier.ts` 훅이 모델 ID를 보고 요청하는 서비스 티어입니다.
  새 모델이 나왔다는 이유만으로 교체하지 마세요. 변경을 제안하기 전에 이 계정에서
  후보 모델이 Ultrafast를 제공하는지, 훅이 해당 ID에 그 티어를 요청하는지 확인하세요.
  속도를 이유로 정확성이나 필요한 검증을 생략하지 않습니다.
- `reviewer`: 번들 정의의 `@slow`, `openai-codex/gpt-6.2-astra:xhigh`.
  코드 리뷰의 기본 경로이며 읽기 전용 범위는 그대로입니다.
- `security-reviewer`: `@mythos, @daybreak, @advisor` 순서 목록. 기본은 Mythos
  `high`이고, 실패하면 Daybreak(GPT-6 Sol `max`), 그다음 Astra `high`로 넘어갑니다.
- `docs-writer`: `@docs`, Fable `medium`. 아래 문서 작성 경로처럼
  `model`을 생략해 호출합니다.
- `ui-ux-specialist`: Fable `high`, 실패하면 Opus `xhigh`. 조사, 설계, 리뷰를 맡습니다.
- `ui-ux-implementer`: Fable `medium`, 그다음 Opus `high`, Astra `medium`, Sol `high`
  순서. 구현을 맡습니다. 둘 다 아래 UI/UX 경로처럼 `model`을 생략해 호출합니다.
- `plan` 역할은 Fable `high`입니다. 이 역할은 `planner`라는 번들 에이전트가
  아니므로, 계획 작업을 `task`에 위임할 때는 호출에
  `anthropic/claude-fable-5-2:high`를 명시합니다.
- `slow`는 Astra `xhigh`, `advisor`는 Astra `high`입니다. 역할 설정만으로
  선택적 advisor 기능이 활성화되지는 않습니다. `scout`의 `@smol`과 `sonic`의
  `@spark` 등 기존 경량 역할은 Luna를 유지합니다. `vision`과 `browser`는
  Terra를 유지합니다.

`agentModelOverrides`로 고정된 에이전트는 `security-reviewer`(위 순서 목록)와
`sonic`(`@spark`)뿐입니다. 이 둘은 호출 시 `model`을 생략하세요. `task`,
`fast-task`, `reviewer`의 고정은 제거했으므로 이들은 위 역할을 기본값으로
쓰되 호출별 `model`로 바꿀 수 있습니다.
Home Manager는 관리하는 에이전트 정의를 개별 파일로 연결하므로 다른 사용자
에이전트는 그대로 유지합니다. 새 호스트에서는 `./rebuild.sh`로 연결을 설치합니다.
기존 실행의 도구 설명에 새 에이전트가 보이지 않으면 OMP를 다시 실행하세요.
이미 실행 중인 작업의 모델은 바뀌지 않습니다.

역할 fallback은 먼저 직접 Anthropic과 OpenAI Codex 경로를 사용합니다. `default`는
Astra `high`, `smol`은 Terra `medium` 다음 Fable `low`, `slow`는
Fable `xhigh`, `plan`은 Astra `high`, `vision`은 Astra `high` 다음
Fable `medium`입니다.
`commit`과 `spark`는 Fable `low`, `task`는 Fable `high`, `fast_task`는
Fable `medium`, `advisor`는 Fable `high`, `docs`는 Astra `medium`으로
대체합니다. `default`의 유일한 대체 모델은 Astra `high`입니다. 기존 DeepSeek·GLM
체인을 사용하는 다른 역할은 직접 경로 뒤에 Deploy DeepSeek → OpenRouter GLM →
OpenRouter DeepSeek 순으로 시도합니다. OpenRouter 요청은 API 크레딧을 사용합니다.
`docs`와 빈 `image` 체인에도 이 경로를 추가하지 않았습니다.
OpenRouter `judge`(`openrouter/~typesafe/jev-latest`)
역할은 유지합니다. opt-in prewalk는 `@task`(시험 기간에는 Sol `high`)로 인계합니다. 이 설정은 인증이나 계정 선택을 바꾸지 않으며,
각 모델의 계정 권한이나 과금 여부는 이 문서에서 확인하지 않았습니다.

`task.eager: preferred`는 메인 에이전트가 위임을 선호하도록 지시합니다.
`task.autoParallel: suggest`는 별도로 native `judge` 모델에 병렬화 가능한
부분을 판별하게 하고 `Auto-parallel: …` 안내만 표시합니다. 작업을 자동으로
실행하거나 추가 위임 지시를 주지는 않으므로, 실제 위임은 기존 정책에 따라
메인 에이전트가 결정합니다. 사용자 입력이 2–16개 항목으로 나뉘는 경우에만
판별하며 plan mode·하위 에이전트·steering 입력은 제외합니다. 판별 요청의
사용량과 지연이 추가될 수 있고, judge 오류나 4초 시간 초과 시 기존 턴을
그대로 진행합니다. 새 OMP 실행에서 설정을 확인할 수 있으며, 실제 안내를
보려면 서로 독립적인 작업을 최상위 목록으로 입력하세요.

### 호출별 모델 선택

`task.perCallModel: on`은 task 및 Eval 위임에서 호출별 `model` 선택을
허용합니다. `task.perCallModelAllow`는 명시적 선택을 다음 아홉 선택자로
제한합니다.

- `openai-codex/gpt-6.2-sol`
- `openai-codex/gpt-6.2-astra`
- `anthropic/claude-opus-5-5`
- `anthropic/claude-fable-5-2`
- `openai-codex/gpt-6.1-terra`
- `openai-codex/gpt-6-luna`
- `openai-codex/gpt-6-sol` (Daybreak 전용)
- `anthropic/claude-mythos-5-2` (Mythos 전용)
- `deploy/deepseek-ai/deepseek-v4.1-flash-1017`

Astra, Opus, Fable을 새로 추가했고 Sol, Terra, Luna, Deploy DeepSeek는
기존 항목입니다. `modelRoles`의 `astra`, `sol`, `fable`, `opus` 별칭은 이 중
네 선택자를 정확히 가리키며 허용 권한을 부여합니다. Deploy 모델은
`modelRoles.deepseek`의 `:high` 매핑으로 허용 권한을 부여합니다.
fallback 체인에 있는 것만으로는 호출별 선택 권한이 생기지 않습니다.

고정되지 않은 에이전트에서 `model`을 생략하면 에이전트 역할과 fallback 체인을
유지합니다. 명시하면 해당 모델에 고정되며 일반 fallback과 prewalk가 적용되지
않습니다. 고정한 모델을 쓸 수 없으면 호출이 실패하고, 다른 모델로 다시 시도할
때는 대체 사실을 알립니다. 모델을 명시해도 에이전트의 지침·도구·읽기 전용
범위, 프로젝트 제한, `task.maxEffort` 상한은 그대로 적용됩니다.
`APPEND_SYSTEM.md`는 명시적 선택자에 `:high` 같은 추론 수준 접미사를 항상
포함하도록 지시합니다.
`agentModelOverrides`가 호출별 선택보다 우선하므로 고정된 `security-reviewer`나
`sonic`에 명시적 `model`을 함께 지정하면 거부됩니다. 이 허용 목록은 에이전트별
목록이나 자동 선택 기준이 아니며, 목록 밖의 선택자는 역할 매핑이 있어도 명시적
override에 쓸 수 없습니다. fallback 체인과 호출별 허용 목록은 서로 별개입니다.

`openai-codex/gpt-6-sol`은 Daybreak(`daybreak_blue` cyber 접근) 전용 항목입니다.
`daybreak` 역할(`:max`)이 이 선택자를 가리키며, 어떤 에이전트 정의에도 고정하지
않았습니다. 대신 메인 에이전트가 취약점 연구, 익스플로잇·악성코드 분석, 바이너리
리버스 엔지니어링, 일반 모델이 거절하는 보안 테스트처럼 해당 접근이 필요한
작업이거나 사용자가 요청할 때 호출별로 `openai-codex/gpt-6-sol:max`를 선택합니다.
일반 구현·리뷰·계획에는 쓰지 않습니다. `security-reviewer`는 순서 목록에
고정되어 있어 호출별 `model`을 받을 수 없으므로, 호출별로 고르려면 `task` 같은
고정되지 않은 에이전트로 위임합니다. 호출별 허용은 공급자 설정
`providers.openai-codex.daybreak`와 별개이며, 실제 Daybreak 적용에는 그 설정과
계정·모델별 승인이 모두 필요합니다.

`anthropic/claude-mythos-5-2`는 보안 작업에 대한 제한이 완화된 Anthropic 모델로,
계정이 승인받은 접근을 통해 사용합니다. `mythos` 역할(`:high`)이 이 선택자를
가리키며 Daybreak와 같은 방식으로 씁니다. 에이전트 정의에 고정하지 않고, 같은
종류의 보안 작업이거나 사용자가 요청할 때만 호출별로
`anthropic/claude-mythos-5-2:high`를 선택합니다. 2026-11-21 기준 저장된 OMP
Anthropic 로그인으로 `claude-mythos-5-2`와 `claude-mythos-5-1`이 응답했고,
접미사 없는 `claude-mythos-5`는 404를 반환한 뒤 fallback 모델이 대신
응답했으므로 정확한 `-5-2` ID를 사용하세요. Daybreak와 달리 별도의 공급자
설정은 없습니다.

### OMP 전용 자율 선택 정책

`home/.omp/agent/APPEND_SYSTEM.md`가 메인 에이전트의 선택 기준을 정의합니다.
일반 구현·리뷰에 Deploy DeepSeek를 우선하던 지침은 제거했습니다. 현재 기준은
다음과 같습니다.

- 확신이 없으면 선택한 에이전트의 기본 역할을 쓰고 `model`을 생략합니다.
  구현·디버깅은 `task`(시험 기간에는 Sol `high`), 범위가 명확한 구현은 `fast-task`
  (Sol `high`, Ultrafast 요청), 코드 리뷰는 `reviewer`(Astra `xhigh`)입니다.
- 계획은 `@plan`(Fable `high`)을 씁니다. `task`에 위임하는 계획 작업에는
  `anthropic/claude-fable-5-2:high`를 명시합니다.
- Opus(`anthropic/claude-opus-5-5:high`)는 코딩 작업이나 독립적인 두 번째
  접근이 필요하고 작업별 근거가 있을 때만 명시적으로 선택하는 대안입니다.
  Sol·Fable·Astra 기본값을 자동으로 대체하지 않습니다.
- Deploy DeepSeek는 사용자의 명시적 요청이나 구체적인 작업별 이유가 있을 때
  선택하며, 낮은 우선순위의 자동 fallback에도 유지합니다. 기본 구현·리뷰 경로가 아닙니다.
- Terra는 시각 추론과 컴퓨터 사용 작업에, Luna는 `scout`와 `sonic`에 유지합니다.
- Daybreak(`openai-codex/gpt-6-sol:max`)는 cyber 접근이 필요한 보안 작업이나
  사용자 요청이 있을 때만 호출별로 선택합니다. 에이전트 정의에 고정하지 않습니다.
- Mythos(`anthropic/claude-mythos-5-2:high`)도 같은 조건에서 호출별로 선택합니다.
  에이전트 정의에 고정하지 않습니다. 둘 다 맞는 작업에서는 Daybreak보다 Mythos를
  우선하고, Daybreak는 사용자가 요청하거나 Mythos를 쓸 수 없을 때 선택합니다.
- 문서 작업에는 아래 `docs-writer` 경로를, UI/UX 작업에는 `ui-ux-specialist`와
  `ui-ux-implementer` 경로를 우선합니다.

에이전트는 모델보다 먼저 지침·도구·읽기/쓰기 범위를 기준으로 고릅니다.
모델을 바꿔도 읽기 전용 에이전트가 구현 작업자가 되지는 않습니다.
위임 전에 모델과 선택 이유를 짧게 설명합니다. 명시적으로 고정한 모델이
실패하면 실패를 보고하고, 다른 허용 모델로 다시 시도할 때는 대체 사실을
알립니다. 사용자가 특정 모델을 요구했다면 대체 전에 묻습니다. 허용 목록이나
오버레이가 선택을 제한하면 권한을 넓히지 않고 기존 경로를 따릅니다.

`@deepseek`는 기존 `high` 매핑을 유지합니다. opt-in prewalk의 인계 대상은
`@task`(시험 기간에는 Sol `high`)이며, `/prewalk restart`의 계획 역할은 `@plan`(Fable `high`)입니다.
이 기본값은 사용자가 선호하는 역할 분담이며 벤치마크 순위나 측정한 속도를
근거로 하지 않습니다. 모델 카탈로그 가격은 공급자별 추정치이며 Codex 구독의
실제 청구액이 아닙니다.

Home Manager는 이 파일만 `~/.omp/agent/APPEND_SYSTEM.md`에 연결합니다.
공유 `home/AGENTS.md` 및 다른 하네스의 지침은 바꾸지 않습니다. 이미 링크가
있는 호스트에서는 rebuild 없이 내용 변경이 반영되지만, 실행 중인 세션에는
적용되지 않으므로 새 OMP 세션을 시작하세요. 새 호스트에서만 `./rebuild.sh`로
링크를 생성합니다.
이 파일은 메인 세션에 적용되며 task 자식에게 상속되지 않습니다. 명시적인
`--append-system-prompt`나 우선하는 프로젝트 append 설정은 전역 파일보다
우선할 수 있습니다.

### 독자가 결정하고 실행할 수 있는 문서: docs-writer

`home/.omp/agent/agents/docs-writer.md`는 문서 작성·개선 전용 에이전트입니다.
frontmatter의 `model: "@docs"`가 `modelRoles.docs`를 참조하므로 모델 이름을
에이전트에 중복 지정하지 않습니다. 현재 역할은 Fable `medium`이며,
`config.yml`에서 역할을 바꾸면 이후 위임에 반영됩니다.

`APPEND_SYSTEM.md`는 실질적인 문서 작성·개선 작업을 이 에이전트에 맡기고,
이 경로가 일반 모델 선택 기준보다 우선하도록 지정합니다. 호출에는
`agent: "docs-writer"`를 사용하고 `model`은 생략합니다. 사용자 요청과 프로젝트
설정은 여전히 우선하며, 이 문서 작성 경로가 제품 결정 권한을 부여하지는 않습니다.

예: “docs-writer로 이 PRD와 API 계약의 충돌을 PM·백엔드 공유용으로 정리해 줘.
사용자가 무엇을 겪는지, 정확히 어떤 선택이 필요한지 설명하고 미확인 사항은 구분해 줘.”
별도 slash command는 추가하지 않습니다.

에이전트는 독자·목적·사전 지식에 맞춰 구성을 고릅니다. 결정 문서는 구체적인
상황 → 요구와 현재 계약의 차이 → 사용자 영향 → 선택지와 질문을 설명하지만,
사용 가이드나 API 참조 문서까지 같은 틀에 강제로 넣지는 않습니다. 정확성은
유지하며 출처, 실제 관찰, 추론, 가상 예시, 제안, 확정된 결정을 구분합니다.
문서만 수정하고 구현 코드는 근거 확인용으로 읽습니다. 합의·구현·운영 검증을
같은 완료 상태로 취급하지 않습니다.

작성 원칙은 [Google의 독자 분석](https://developers.google.com/tech-writing/one/audience),
[문서 구성](https://developers.google.com/tech-writing/one/documents),
[GOV.UK 사용자 요구 중심 작성](https://guidance.publishing.service.gov.uk/writing-to-gov-uk-standards/plan-manage-content/identify-user-needs/),
[Google Cloud 결정 기록](https://docs.cloud.google.com/architecture/architecture-decision-records)을
참고했습니다. 이는 일반적인 작성 원칙이지 특정 모델의 우열에 대한 증거는 아닙니다.
[LLM verbosity 연구](https://aclanthology.org/2025.uncertainlp-main.14/)도 QA 실험에
한정되므로 모든 긴 문서가 나쁘다는 근거로 사용하지 않습니다.

Home Manager는 `~/.omp/agent/agents/docs-writer.md`만 개별 연결합니다.
새 호스트에서는 `./rebuild.sh`로 설치하고, 이미 실행 중인 메인 세션에 새 설명과
라우팅 정책을 확실히 반영하려면 OMP를 다시 시작하세요. 이 에이전트는 자체
작성 지침을 가지므로 메인 전용 append 파일의 자식 상속에 의존하지 않습니다.

### 제품 UI/UX 작업: ui-ux-specialist와 ui-ux-implementer

화면이 어떻게 보이고 읽히고 쓰이는지가 주된 결과인 작업은 두 에이전트가 나눠
맡습니다. 웹, 네이티브, 터미널 UI를 모두 다룹니다. 지침은 같은 원칙을 공유하고,
작업 종류와 추론 수준이 다릅니다.

| 에이전트 | 맡는 일 | 모델 순서 |
| --- | --- | --- |
| `ui-ux-specialist` | 조사, 설계, 리뷰. 제품 코드는 수정하지 않습니다 | Fable `high` → Opus `xhigh` |
| `ui-ux-implementer` | 구현과 다듬기 | Fable `medium` → Opus `high` → Astra `medium` → Sol `high` |

정의 파일은 `home/.omp/agent/agents/ui-ux-specialist.md`와
`home/.omp/agent/agents/ui-ux-implementer.md`입니다. 모델 순서는 각 정의 파일의
frontmatter `model` 목록에만 적혀 있습니다. 목록의 첫 모델이 기본이고 나머지가 그
호출의 fallback 체인 전체입니다. 메인 에이전트는 `model` 없이 에이전트 이름만
고르며, 그러면 모델과 추론 수준이 함께 정해집니다. `task.enableEffort`가 꺼져
있어 추론 수준만 따로 넘길 수는 없습니다. budget, experimental, ultra overlay도
이 목록을 바꾸지 않습니다.

두 에이전트는 `task.agentModelOverrides`에 고정하지 않았습니다. 그래서 사용자가
“이번에는 Opus로”처럼 모델을 지정하면 메인 에이전트가 그 호출에만 `model`을 넘길
수 있습니다. 넘길 수 있는 모델은 `config.yml`의 `modelRoles`에 있고
`task.perCallModelAllow` 목록에도 있는 모델이며, 에이전트 정의 파일에 적혀 있을
필요는 없습니다. 이렇게 지정한 호출은 그 모델 하나로만 실행되고 fallback이
없습니다.

`APPEND_SYSTEM.md`는 UI/UX 작업을 이 두 에이전트에 맡기고, 이 경로가 일반 모델
선택 기준과 `task` 경로보다 우선하도록 지정합니다. 위임할 때는 사용자가 이미 내린
제품 결정을 전달하고, 구현을 맡길 때는 설계나 리뷰 결과가 있으면 함께 전달합니다.

예: “ui-ux-specialist로 설정 화면의 빈 상태와 오류 상태를 조사하고 개선안을
설계해 줘. 사용자가 결정해야 할 항목은 따로 정리해 줘.” 그다음
“ui-ux-implementer로 이 설계대로 구현해 줘.”

두 에이전트 모두 기존 디자인 토큰과 컴포넌트를 먼저 재사용하고, 결과는 코드만
읽지 않고 실제 화면에서 확인하며, 확인하지 못한 부분은 보고에 밝힙니다. 범위,
브랜드, 가격처럼 소유자가 정할 일은 대신 결정하지 않습니다. 구현 에이전트는 빈
상태, 로딩, 오류, 긴 내용 등 모든 상태와 키보드 접근, 대비, 좁은 화면,
라이트·다크, reduced motion을 확인합니다.

리뷰는 추가된 기능, 화면, 흐름을 평가만 하고 아무것도 수정하지 않습니다. 제품에
명시된 UX 요구사항이나 디자인 기준이 있으면 그것을 먼저 기준으로 삼습니다. 그런
기준이 없으면 한 가지만 봅니다. 사용자가 두 번 생각하지 않고 쓸 수 있는가입니다.
화면이 무엇을 위한 것인지, 다음에 무엇을 해야 하는지, 버튼을 누르면 어떻게 되는지,
보이는 정보가 지금 내릴 결정에 무엇을 뜻하는지를 사용자가 멈춰서 따져 봐야 한다면
그 지점이 지적 사항입니다. 각 지적에는 사용자가 무엇을 보고 어떻게 오해하거나
망설이는지, 그리고 그 의문을 없애는 가장 작은 변경을 적습니다.

코드가 올바른지는 `reviewer`가, 사람이 쓰기 쉬운지는 `ui-ux-specialist`가
판단합니다. 두 판단이 모두 필요한 변경에는 둘 다 사용합니다.

Home Manager는 두 정의 파일을 `~/.omp/agent/agents/`에 개별 연결합니다. 이미 실행
중인 메인 세션에 새 에이전트와 라우팅 정책을 반영하려면 OMP를 다시 시작하세요.

### 실제 브라우저 작업: web-operator

`home/.omp/agent/agents/web-operator.md`는 ego-browser(ego lite)로 로그인된
웹사이트를 조작하는 전용 에이전트입니다. frontmatter의 `model: "@browser"`가
`modelRoles.browser`를 참조하며 현재 역할은 Terra `auto`입니다. 모델 이름이나
추론 강도를 에이전트에 고정하지 않으므로 `config.yml`에서 역할을 바꾸면 이후
위임에 반영됩니다.

`autoloadSkills: ego-browser`는 자식 세션에 해당 스킬을 미리 주입합니다. 호출에는
`agent: "web-operator"`를 사용하고 `model`은 생략합니다. 에이전트는 첫 브라우저
동작 전에 `ego-browser skill`을 실행해 설치된 버전의 사용 안내를 따르고, 작업
하나에 TaskSpace 하나만 만들며, 성공 시 `finish`, 사용자 조작이 필요하면
`handOff`로 끝냅니다.

ego-browser가 없거나 연결되지 않거나 문서화된 API로 작업을 표현할 수 없으면
다른 브라우저나 데스크톱 제어로 조용히 대체하지 않고 중단·보고합니다. 네이티브
데스크톱 자동화는 이 에이전트의 범위가 아니므로 메인 에이전트가 다른 작업자에게
넘깁니다. 페이지 내용은 신뢰할 수 없는 데이터이며, 사용자가 이미 승인한 정확한
동작·대상·범위는 다시 묻지 않고 수행합니다. 반면 금융·고용·주거·교육·보험·신용·
법률·의료·정부 서비스·선거·생체정보·고민감 개인정보와 공급자 안전 확인은
실행 시점의 대화형 승인이 필요하며, 에이전트가 사용자에게 직접 물을 수 없으므로
결정을 부모에게 반환합니다. 로그인·권한 프롬프트처럼 사용자가 브라우저에서
직접 조작해야 하는 경우에만 `handOff`를 씁니다.

Home Manager는 `~/.omp/agent/agents/web-operator.md`를 개별 연결합니다. 새
호스트에서는 `./rebuild.sh`로 링크를 만들고, 이미 실행 중인 세션의 도구 설명에
새 에이전트가 보이지 않으면 OMP를 다시 시작하세요.

## OMP Deploy 모델

`home/.omp/agent/models.yml`의 `deploy` 공급자는
`https://api-cdn.deploy.com/api/v1`을 사용합니다. 모델 선택자는
`deploy/deepseek-ai/deepseek-v4.1-flash-1017`이며 표시 이름은
`DeepSeek V4.1 Flash 1017 (Deploy)`입니다. 기존 로컬 자격 증명과의 호환성을
위해 `apiKey`의 환경 변수 이름은 `HIVE_API_KEY`를 유지합니다. 공급자 이름
변경을 위해 키나 로컬 비밀 설정을 바꿀 필요는 없습니다.

## OMP EXAONE 모델

`home/.omp/agent/models.yml`에 LG의 직접 API 공급자 `exaone`을 등록합니다.
OpenRouter 경유가 아닌 `https://api.exaone.ai/v1`의 OpenAI Chat Completions
호환 API이며, 선택자는 `exaone/k-exaone_v2.5`입니다. 기존 역할과 fallback은
변경하지 않습니다.

발급받은 키는 로컬 비밀 관리 방식으로 `EXAONE_API_KEY` 환경 변수에 설정한 뒤,
그 환경을 상속하는 터미널에서 실행합니다. 실제 키는 dotfiles에 기록하지 않습니다.

```bash
omp --model exaone/k-exaone_v2.5 --thinking high
```

기존 세션에서는 `/model` 선택기로 모델을 선택할 수 있습니다. 새 공급자가 보이지
않으면 OMP를 새로 실행합니다. 기존 Home Manager 링크에서는 Nix 재빌드가 필요 없습니다.

[공식 모델 안내](https://docs.exaone.ai/en/docs/models)는 텍스트 전용 입력,
도구 호출과 스트리밍, 524,288토큰 context/output 상한을 설명합니다.
[API 문서](https://docs.exaone.ai/ko/docs/k-exaone-2.5)에 따라 실제 입력 토큰과
`max_tokens`의 합은 524,288 이하여야 하며 출력 예산에는 추론도 포함됩니다.
OMP는 `max_tokens`와 `system` 역할을 사용하고, 추론 이력은
`reasoning_content`로 전달하도록 설정합니다.

API 문서는 추론 강도를 `low/high/max`로 나열하지만
[agent 안내](https://docs.exaone.ai/ko/docs/agent-start)는 `medium`도 사용합니다.
이 불일치 때문에 보수적으로 `minimal/low → low`, `medium/high → high`,
`xhigh/max → max`로 매핑합니다. 추론을 완전히 끄는 API 동작은 확인하지 않았으므로
`--thinking off`를 추론 비활성화 보장으로 해석하지 않습니다.
이 모델의 OMP 기본 추론 강도는 `high`입니다(API 자체 기본값은 `max`).
가격 메타데이터는 미등록 상태이므로 OMP의 비용 표시를 무료 사용의 의미로 해석하지 않습니다.
인증된 실제 응답·도구 호출·멀티턴 호환성은 별도의 실사용 확인이 필요합니다.

## OMP Codex Daybreak 자동 요청

`home/.omp/agent/config.yml`은 사용자 선택에 따라
`providers.openai-codex.daybreak: true`를 명시합니다. OMP는 선택된 ChatGPT
계정과 모델의 검색 메타데이터가 허용할 때 `access_programs.cyber:
daybreak_blue`를 요청합니다. OpenAI는 Daybreak Blue 세션 내용을 모델 개선에
사용할 수 있습니다.

이 설정은 역할별 허용 목록이 아니라 공급자 단위 설정입니다. GPT-6 Sol과
GPT-6 Luna뿐 아니라 해당 프로세스의 다른 적격 Codex 모델 및 보조 요청에도
적용될 수 있습니다. 기본 대화 모델은 Fable이고 기존 Luna 역할 배정은 유지합니다.

`modelRoles.daybreak`는 폐기된 `gpt-daybreak-blue-latest` 대신
`openai-codex/gpt-6-sol:max`를 사용합니다. 추론 수준은 `max`이며 모델 순환 목록의
`daybreak` 항목은 유지합니다. `/model`에서 GPT-6 Sol 또는 GPT-6 Luna를
선택해도 같은 공급자 설정을 따르며, 역할 이름 자체가 Daybreak를 켜지는 않습니다.
기존 설정 연결을 통해 새 OMP 실행부터 적용되므로 Nix 재빌드는 필요하지 않습니다.

`daybreak`는 일반 모델 역할이 아니라 `daybreak_blue`(cyber) 접근 프로그램을
쓰기 위한 전용 역할입니다. 따라서 이 계정에서 해당 프로그램을 제공하는 Codex
모델만 지정해야 합니다. 2026-11-18 기준으로 계정별 모델 목록이 `daybreak_blue`를
제공하는 모델은 `gpt-6-sol`, `gpt-6-luna`, `gpt-5.6-*`, `gpt-daybreak-blue-latest`이며
`gpt-6.2-sol`, `gpt-6.2-astra`, `gpt-6.1-sol`, `gpt-6-astra`, `gpt-6.1-terra`는
`standard`만 제공합니다. 다른 GPT 역할을 새 버전으로 올릴 때 이 역할은 함께
바꾸지 말고, 새 모델이 `daybreak_blue`를 제공하는지 먼저 확인하세요. 제공하지
않는 모델을 지정하면 오류 없이 일반 모델로 동작합니다.

확인 방법: OMP가 저장한 Codex 모델 검색 결과(`~/.omp/agent/models.db`의
`model_cache`, `openai-codex` 최신 행)에서 각 모델의
`accountAccess.<계정>.cyberPrograms`를 읽습니다. `omp usage`의 계정 줄에
`daybreak` 표시가 없더라도 조회 실패와 구분되지 않으므로 그것만으로 접근 권한이
없다고 판단하지 않습니다.

OMP 18.16.0은 접근 프로그램이 거절되면 해당 필드를 제거하고 재시도할 수
있습니다. 따라서 카탈로그 표시나 응답 성공만으로 Daybreak 적용을 확인할 수
없습니다. `false` 역시 명시적인 `standard` 전송이 아니라 필드 생략이므로
서버의 기본 처리와 구분해야 합니다. 실제 사용에는 계정·모델별 승인이 필요하며
GPT-6 Sol/Luna의 Blue 지원을 Astra/Sol 6.1의 승인 조건과 혼동하지 마세요.
자세한 조건은 [OpenAI 문제 해결 안내](https://help.openai.com/en/articles/20001259)와
[OMP 요청 처리 소스](https://github.com/can1357/oh-my-pi/blob/v18.16.0/packages/ai/src/providers/openai-codex/access-programs.ts)를 참고하세요.

## OMP 저장된 Codex 리셋 사용

OMP 18.18.7부터 `codexResets.autoRedeem5h`와 `autoRedeemWeekly`를 각각
`unset`으로 설정합니다. 이전 `autoRedeem: unset`의 정책을 두 시간 구간에
유지하며, 대화형 확인 없이 저장된 리셋을 소비하지 않습니다.
`omp -p`처럼 확인 UI가 없는 세션에서는 만료가 임박해도 자동으로 소비하지 않습니다.
수동 확인에는 `/usage reset` 또는 `omp usage reset`을 사용하세요. 인자 없이
실행하면 목록만 표시하며, 계정 대상을 지정하면 리셋 하나를 소비합니다.
[18.18.7 설정 문서](https://github.com/can1357/oh-my-pi/blob/v18.18.7/docs/settings.md#saved-reset-auto-consumption)를 참고하세요.

## OMP 이미지 분석

기본 설정의 `modelRoles.vision`은 `openai-codex/gpt-6.1-terra:medium`입니다.
별도 이미지 분석 호출에 Terra를 사용하며, 기본 대화 모델 Fable과 이미지 생성 모델
Sunburst는 별도 역할입니다. 이 역할 변경은 컴퓨터 조작을 수행하는 주 에이전트나
위임 에이전트의 모델을 바꾸지 않습니다.

## OMP 이미지 생성

`home/.omp/agent/config.yml`은 `generate_image.enabled: true`와
`modelRoles.image: openai/gpt-image-2.6-sunburst`를 설정합니다.
`home/.omp/agent/models.yml`은 이 모델을 `openai-images` 이미지 모델로
등록하여 OpenAI의 `/v1/images/generations` 및 `/v1/images/edits` 경로를
사용합니다. Codex 구독이나 OpenRouter가 아니라 `OPENAI_API_KEY`를 사용하는
직접 OpenAI API 경로이며, API 사용 요금과 계정별 접근 제한이 적용됩니다.
키 값은 저장소에 넣지 않습니다.
[공식 모델 문서](https://developers.openai.com/api/docs/models/gpt-image-2.6-sunburst)를 참고하세요.

`retry.fallbackChains.image: []`는 이미지 역할의 기본 대체 모델 체인을 끕니다.
일반 대화 역할의 fallback 설정은 바꾸지 않습니다. 빈 이미지 fallback 체인은
현재 대화 모델의 이미지 후보까지 차단하지 않으므로, 반드시 Sunburst만
사용해야 하는 요청은 이미지 도구에 `model: openai/gpt-image-2.6-sunburst`를
명시하세요. 명시적 도구 모델 선택은 그 모델만 시도합니다.
기존 설정 연결을 사용하므로 Nix 재빌드는 필요하지 않으며,
설정을 확실히 반영하려면 OMP를 새로 시작하세요.

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

`composer.predictions: true`는 OMP 18.9의 다음 메시지 예측을 활성화합니다.
응답이 끝나면 현재 모델이 대화 문맥으로 다음 사용자 메시지를 예측하여
희미하게 표시합니다. `Tab` 또는 오른쪽 화살표로 초안에 수락하며 자동 전송하지
않습니다. 위 단어 자동완성과는 별개이며 추가 모델 요청과 사용량이 발생합니다.
끄려면 `home/.omp/agent/config.yml`의 `composer.predictions`를 `false`로 바꿉니다.

## OMP 데스크톱 제어

`home/.omp/agent/config.yml`은 `computer.enabled: true`로 데스크톱 제어를
기본 활성화합니다. 새 OMP 실행부터 적용되며 Nix 재빌드는 필요하지 않습니다.
현재 세션에서는 `/computer on`, `/computer off`, `/computer status`로
활성화 상태를 제어하거나 확인합니다.

공유 설정은 `computer.display: active`를 명시합니다. OMP 18.7.0에서 일반
데스크톱 캡처는 포커스된 창과 가장 많이 겹치는 모니터를 선택하며, 찾지 못하면
주 모니터를 사용합니다. 다른 모니터로 포커스를 옮기면 다음 캡처 대상도 바뀝니다.
특정 앱 작업은 창 단위 캡처를 우선하며, 전체 모니터 합성은 명시적으로 `all`을
선택할 때만 사용합니다.

캡처 범위는 입력 격리 설정이 아닙니다. 공유 `home/AGENTS.md`는 손쉬운 사용
또는 백그라운드 입력을 우선하고, 이미 명시적으로 허용한 경우가 아니라면 포커스
전환이나 실제 포인터 조작 전에 묻도록 합니다. 앱 자체가 포커스를 바꿀 수 있으므로
동시 작업 중 방해가 없다는 보장은 없으며, 이 지침은 런타임 강제 차단 기능이 아닙니다.

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

## OMP 기록 조회와 작업 완료 추정

`home/.omp/agent/config.yml`은 OMP 18.6.1의 다음 기본값을 명시적으로 유지합니다.

- `archive.enabled: true`: Eval의 읽기 전용 `archive` helper로 이전 프롬프트,
  세션 정보와 recap을 명시적으로 조회할 수 있습니다. 기본 범위는 현재 프로젝트이며,
  요청이 여러 프로젝트에 걸칠 때 `project: "*"`로 넓힐 수 있습니다. 기록을 자동으로
  모두 읽거나 업로드하지는 않지만, 조회한 내용은 모델 문맥에 포함될 수 있습니다.
- `task.completionProbe: true`: 대화형 세션의 주 에이전트가 직접 실행한
  장시간 작업 중인 하위 에이전트에 완료 정도를 추정하는 추가 모델 요청을 보냅니다.
  추정 요청은 별도 사용량을 소비하며 print/RPC/ACP/SDK 실행과 중첩 하위 에이전트는
  제외됩니다.

설정 변경은 기존 YAML 연결을 통해 다음 OMP 실행에 반영되므로 Nix 재빌드는
필요하지 않습니다. 자체 관리 설치는 `omp update`, Tern 관리 설치는 Tern의
지원되는 업데이트 경로를 사용하며 관리 바이너리를 직접 덮어쓰지 않습니다.
`omp update --plugins`는 별도 승인 없이 함께 실행하지 않습니다.
설치된 바이너리를 업데이트해도 이미 실행 중인 OMP는 이전 런타임을 사용하므로
OMP를 다시 실행해야 합니다.

`omp-update`는 설치 버전, 공유 마지막 검토 버전, 최신 공식 stable 릴리스
(검토 대상), 설치 소유자가 제공하는 업데이트 대상의 네 가지를 구분합니다.
설치가 뒤처져 있거나 소유자의 업데이트 대상이 없어도 공유 checkpoint 이후부터
최신 공식 stable까지 검토합니다. GitHub 릴리스는 설치 대상이 아닙니다.
이미 공유 검토한 릴리스는 다시 브리핑하지 않지만, 매 업데이트 실행에서 현재
머신의 활성 설정과 런타임 호환성을 별도로 확인합니다. 공유 완료는 릴리스
브리핑과 공유 설정 결정·이관이 처리되었다는 뜻이지 각 머신의 설치나 호환성
검증을 보증하지 않습니다. 미해결 릴리스 검토나 공유 설정 결정·필수 이관이
있으면 checkpoint를 갱신하지 않고, 머신별 설치·런타임 이관을 미룬 경우에는
별도로 보고합니다. 읽기 전용 audit은 checkpoint를 변경하지 않습니다.

공유 schema 2 checkpoint는 실제 skill 디렉터리의 `review-state.json`이며
프로필·호스트·설치 정보는 저장하지 않습니다. 이전 로컬 state는 사용하거나
자동 이관하지 않습니다. Git으로 다른 checkout에 전파하려면 사용자가 명시적으로
요청한 commit과 push가 필요합니다. 잠금과 revision token은 한 checkout만
보호하므로, 서로 다른 checkout의 상태가 다르면 실제 완료 근거를 확인하여 가장
높은 **완전히 검토된** 경계를 조정합니다. 버전 숫자만 보고 선택하지 않습니다.
helper와 독립 installer는 skill 디렉터리에 함께 들어 있습니다.
[독립 설치·checkpoint 사용법](../home/.agents/skills/handmade/omp-update/README.md)을 참고합니다.

## OMP 저비용 모델 오버레이

사용 비용을 줄이고 싶을 때는 `ob` Zsh alias로 OMP를 실행합니다. 이 설정은
기본 설정과 인증·세션 상태는 그대로 공유하면서
`home/.omp/agent/config-budget.yml`의 저비용 모델 역할과 fallback만 현재
프로세스에 덮어씁니다. 일반 `omp` 실행은 기본 설정을 그대로 사용합니다.

```bash
ob
```

각 overlay의 모델 선택과 세부 설정은 해당 YAML 파일을 기준으로 확인합니다.

현재 budget overlay의 `default`는 `openai-codex/gpt-6.1-sol:high`,
`task`는 `deploy/deepseek-ai/deepseek-v4.1-flash-1017:high`입니다.
`slow`·`plan`은 `deploy/deepseek-ai/deepseek-v4.1-flash-1017:max`를 사용합니다.
fallback에서는 Deploy DeepSeek를 OpenRouter GLM·DeepSeek보다 먼저 시도합니다.
`task`는 Deploy가 primary이므로 fallback에 같은 선택을 중복하지 않습니다.
YAML 수정은 재빌드 없이 다음 `ob` 실행에 반영됩니다.

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

`home/.omp/agent/config-ultra.yml`은 Codex OAuth 구독 사용량을 적극적으로
사용하도록 구성한 overlay입니다. `modelRoles`와 `retry.fallbackChains`만 덮어쓰며,
나머지 설정(재시도 횟수·정책, 도구, UI, security-reviewer의 모델 고정)은
기본 `config.yml`을 그대로 상속합니다.

- `slow`·`plan`·`advisor`: `openai-codex/gpt-6-astra:max`
- `smol`·`vision`·`task`: `openai-codex/gpt-6-astra:xhigh`
- `default`: `openai-codex/gpt-6-astra:high`
- `spark`: `openai-codex/gpt-6-astra:low`
- `memory`: `openai-codex/gpt-6-astra:medium`
- `commit`: `openai-codex/gpt-6.1-sol:medium`
- `tiny`는 기본 local 모델을 상속하므로 제목 생성은 로컬에 유지합니다.
  `judge`도 기본 `openrouter/~typesafe/jev-latest` 모델과 전용 chain을 상속하는 예외입니다.
- Astra 역할의 fallback은 `gpt-6.1-sol` → `gpt-6-luna`이며, Sol을 주 모델로
  사용하는 `commit`은 `gpt-6-astra` → `gpt-6-luna`를 사용합니다.
  각 fallback의 effort는 해당 주 역할과 동일합니다. 이 역할들은 Claude·OpenRouter로
  fallback하지 않으며, JEV는 judge 전용으로 유지합니다.
- 높은 effort는 응답 시간과 구독 사용량을 늘릴 수 있습니다. Codex 역할은
  같은 제공자 경로이므로 Codex 전체 장애나 계정 사용량 소진을 우회하지 못합니다.
  이 제한은 모델 역할·fallback 라우팅에 대한 것이며, 별도 도구·통합 설정은 바꾸지 않습니다.

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
