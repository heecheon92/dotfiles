# 에이전트와 보조 도구

공유 에이전트 스킬과 OMP 저비용 모델 오버레이를 설명합니다.
이 문서의 저장소 경로와 `./rebuild.sh` 명령은 모두 저장소 루트를 기준으로 합니다.

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

## OMP 구현 작업의 속도와 품질 선택

기본 `config.yml`은 기존 에이전트별 모델 경로를 유지합니다.

- 기본 `task`: `modelRoles.task`의 Sol `high`. 모호한 요구사항, 위험도가 높은
  변경, 깊은 추론이 필요한 작업에 사용하며 선택이 애매할 때도 기본값입니다.
- `fast-task`: `modelRoles.fast_task`의 Terra `high`. 접근 방법과 범위가
  명확한 구현의 대안입니다. 읽기·쓰기 도구를 사용할 수 있으며 속도를 이유로
  정확성이나 필요한 검증을 생략하지 않습니다.
- `scout`의 `@smol`과 `sonic`의 `@spark`는 Luna를 유지합니다. 각각 읽기 전용
  탐색과 엄격히 기계적인 작업을 담당하며 `fast-task`로 대체하지 않습니다.

`home/.omp/agent/agents/fast-task.md`의 설명을 보고 메인 에이전트가 위임 유형을
선택합니다. 모델 후보 배열이나 fallback 체인이 속도·품질을 판단하는 구조는
아닙니다. Home Manager는 관리하는 정의를 개별 파일로 연결하므로 다른 사용자
에이전트는 그대로 유지합니다. 새 호스트에서는
`./rebuild.sh`로 연결을 설치합니다. 기존 실행의 도구 설명에 새 에이전트가
보이지 않으면 OMP를 다시 실행하세요. 이미 실행 중인 작업의 모델은 바뀌지 않습니다.

### 호출별 모델 선택

`task.perCallModel: on`은 task 및 Eval 위임에서 호출별 `model` 선택을
허용합니다. `task.perCallModelAllow`는 Sol, Terra, Luna,
`deploy/deepseek-ai/deepseek-v4.1-flash-1017` 네 모델로 명시적 선택을 제한합니다.
Deploy 모델은 `modelRoles.deepseek`의 `:high` 매핑으로 허용 권한을 부여합니다.
fallback 체인에 있는 것만으로는 호출별 선택 권한이 생기지 않습니다.

`model`을 생략하면 기존 에이전트 역할과 fallback 체인을 유지합니다. 명시하면
해당 모델에 고정되며 다른 모델로 fallback하지 않습니다. 호출의 추론 수준은
별도로 지정할 수 있고 `task.maxEffort` 상한을 따릅니다. `agentModelOverrides`가
있는 `sonic`, `security-reviewer`에는 명시적 모델을 함께 지정할 수 없습니다.
이 허용 목록은 에이전트별 목록이나 자동 선택 기준이 아니며, Daybreak 등 다른
모델의 명시적 override를 허용하지 않습니다. 새 에이전트 정의나 기본 모델 변경은
필요하지 않습니다.

### OMP 전용 자율 선택 정책

`home/.omp/agent/APPEND_SYSTEM.md`가 메인 에이전트의 선택 기준을 정의합니다.
일반 구현·디버깅·검증 가능한 리뷰는 Deploy DeepSeek `high`, 복잡하거나 위험한
작업은 Sol, Terra는 명시적 요청이나 작업별 근거가 있는 대안으로 사용합니다.
scout/sonic의 Luna 경로는 유지합니다. 위임 전에 모델과 선택 이유를 짧게
설명하며, 명시적으로 고정한 모델이 실패하면 다른 모델로 바꾼 사실을 알립니다.
허용 목록이나 오버레이가 선택을 제한하면 권한을 넓히지 않고 기존 경로를 따릅니다.

이 정책은 사용자가 관찰한 DeepSeek의 속도·품질을 로컬 기준으로 삼습니다.
공개 자료는 [Sol](https://openai.com/index/introducing-gpt-6-1-sol/),
[Terra](https://openai.com/index/introducing-gpt-6-1-terra/),
[Luna](https://openai.com/index/introducing-gpt-6-sol-and-luna/),
[DeepSeek 업데이트](https://api-docs.deepseek.com/updates)를 참고했습니다.
서로 다른 벤치마크·하네스의 점수를 동일 조건의 순위로 취급하지 않습니다.
[DeepSeek 추론 문서](https://api-docs.deepseek.com/guides/thinking_mode)는
기본 `high`와 별도 `max`를 설명합니다. 로컬 정책은 Deploy와 OpenRouter 모두
`high`를 기본으로, `smol`/`spark`와 기존 경량 `commit` 경로는 `low`로 사용합니다.
`plan`/`slow`/`advisor` 및 추가 추론이 필요한 명시적 위임에만 `max`를 사용합니다.
`@deepseek`와 prewalk 인계도 기본 `high`를 따릅니다.
모델 카탈로그 가격은 공급자별 추정치이며 Codex 구독의 실제 청구액이 아닙니다.

Home Manager는 이 파일만 `~/.omp/agent/APPEND_SYSTEM.md`에 연결합니다.
공유 `home/AGENTS.md` 및 다른 하네스의 지침은 바꾸지 않습니다. 새 호스트에서는
`./rebuild.sh`로 링크를 생성하고, 내용 변경 후에는 새 OMP 실행을 시작하세요.
이 파일은 메인 세션에 적용되며 task 자식에게 상속되지 않습니다. 명시적인
`--append-system-prompt`나 우선하는 프로젝트 append 설정은 전역 파일보다
우선할 수 있습니다.

### 독자가 결정하고 실행할 수 있는 문서: docs-writer

`home/.omp/agent/agents/docs-writer.md`는 문서 작성·개선 전용 에이전트입니다.
frontmatter의 `model: "@docs"`가 `modelRoles.docs`를 참조하므로 모델 이름을
에이전트에 중복 지정하지 않습니다. 현재 역할은 Terra `auto`이며,
`config.yml`에서 역할을 바꾸면 이후 위임에 반영됩니다.

`APPEND_SYSTEM.md`는 실질적인 문서 작성·개선 작업을 이 에이전트에 맡기고,
일반 DeepSeek 우선 정책으로 덮어쓰지 않도록 지정합니다. 호출에는
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
적용될 수 있습니다. 일반 기본 모델과 기존 Luna 역할 배정은 유지합니다.

`modelRoles.daybreak`는 폐기된 `gpt-daybreak-blue-latest` 대신
`openai-codex/gpt-6-sol:max`를 사용합니다. 추론 수준은 `max`이며 모델 순환 목록의
`daybreak` 항목은 유지합니다. `/model`에서 GPT-6 Sol 또는 GPT-6 Luna를
선택해도 같은 공급자 설정을 따르며, 역할 이름 자체가 Daybreak를 켜지는 않습니다.
기존 설정 연결을 통해 새 OMP 실행부터 적용되므로 Nix 재빌드는 필요하지 않습니다.

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
별도 이미지 분석 호출에 Terra를 사용하며, 주 대화 모델 Astra와 이미지 생성 모델
Sunburst는 그대로 유지합니다. 이 역할 변경은 컴퓨터 조작을 수행하는 주 에이전트나
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
나머지 설정(재시도 횟수·정책, 도구, UI, security-reviewer의 `@advisor` 연결)은
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
