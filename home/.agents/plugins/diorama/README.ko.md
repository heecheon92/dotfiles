# Diorama

[English](README.md) | [한국어](README.ko.md)

Diorama는 코딩 에이전트용 플러그인입니다. 에이전트가 개념, 시스템, 장애, 절차를 단계별로
움직이는 그림으로 설명하게 해 주는 스킬 세 개와, 그 그림을 그리는 HTML 페이지로
이루어져 있습니다.

walkthrough 형식은 Dilum Sanjaya의 인터랙티브 학습 사이트들
([x.com/DilumSanjaya](https://x.com/DilumSanjaya))을 따랐습니다. 그 위에 얹은 방법(움직이는
것 하나와 숫자 하나로 이루어진 질문, 출처가 있는 숫자, 직접 해 보는 단계, sheet로 하는
검토)은 @0xKapri의 [SIMULAB](https://github.com/ecapri-dev/simulab-skill)(MIT 라이선스)을
바탕으로 합니다. Diorama는 별도로 구현한 것이며, 두 곳의 글, 그림, 코드, 폰트는 들어 있지
않습니다.

## 스킬

| 스킬 | 하는 일 | 필요한 것 |
|---|---|---|
| `diorama-maker` | walkthrough 하나를 만듭니다. 대화 안에서, 단독 HTML 페이지로, 또는 collection의 일부로 만들 수 있습니다 | 없음. 단독으로 동작 |
| `diorama-planner` | collection을 함께 기획하고, 폴더를 만들고, 작성 → 리뷰 → 승인 순서를 진행합니다 | `diorama-maker` |
| `diorama-reviewer` | 사용자가 읽기 전에 walkthrough를 검토합니다. 먼저 처음 보는 독자의 눈으로 읽고, 이어서 형식, 숫자, 출처에 맞는지 확인합니다 | `diorama-maker` |

## 사용 방법

메시지 맨 앞에 스킬 이름을 적고, 이어서 원하는 것을 평소 말하듯 쓰면 됩니다. 스킬을
부르는 방식은 도구마다 다릅니다.

| 도구 | 입력 |
|---|---|
| OMP | `/skill:diorama-maker <요청 내용>` |
| Claude Code | `/diorama-maker <요청 내용>` |
| Codex | `$diorama-maker <요청 내용>` |

`diorama-planner`와 `diorama-reviewer`도 같은 방식으로 부릅니다. 스킬 이름 없이 그냥
요청해도 되며, 요청이 스킬 설명과 맞으면 에이전트가 알아서 고릅니다. 이름을 적으면
원하는 스킬이 확실히 쓰입니다.

### 일반적인 흐름

walkthrough 여러 개를 만들 때는 planner에게만 말하면 됩니다. 나머지 둘은 planner가 대신
부릅니다.

```text
diorama-planner   원하는 것을 묻고, 목차를 제안하고, 승인을 기다립니다
   └─ walkthrough마다 순서대로:
        diorama-maker     작성하고 화면에 그려 봅니다
        diorama-reviewer  검토하고, 지적된 내용을 고칩니다
        사용자            읽어 보고 승인하거나 수정을 요청합니다
```

설명 하나만 필요하면 `diorama-maker`로 충분합니다. 공유하기 전에 점검받고 싶으면 이어서
`diorama-reviewer`를 부르세요.

### 하나를 설명할 때: `diorama-maker`

```text
/skill:diorama-maker 우리 로그인 흐름이 어떻게 동작하는지, 새 팀원에게 공유할 수 있는 페이지로 단계별로 설명해 줘.
```

```text
/diorama-maker 어제 배포가 왜 실패했는지 단계별로 설명해 줘. 대화 안에서만 보여 주면 돼.
```

```text
$diorama-maker 요청 하나가 브라우저에서 우리 데이터베이스까지 가는 과정을 보여 주는 페이지를 만들어 줘.
```

보관하거나 공유할 파일이 필요하면 "페이지"라고 말하세요. 말하지 않으면 대화 안에서
단계별로 설명합니다.

### 여러 개를 묶어 만들 때: `diorama-planner`

```text
/skill:diorama-planner 신입 엔지니어를 위한 출입 통제 시스템 온보딩 가이드를 만들고 싶어. 아직 목차는 없어.
```

```text
/diorama-planner 이 주제들로 강의를 만들어 줘: 1) 배지 태그가 동작하는 방식 2) 출입문 동기화 3) 출근 시간 혼잡.
```

planner는 다룰 주제 목록이 이미 있는지 먼저 묻습니다. 있으면 그 목록을 그대로 쓰고,
없으면 목차를 제안합니다. 목차를 승인하기 전에는 아무것도 작성하지 않으며, 각
walkthrough는 모델 리뷰를 거친 뒤 사용자가 승인합니다.

나중에 기존 collection을 이어서 작업하려면 그 폴더를 열고 이렇게 요청하세요.

```text
$diorama-planner 이 collection 이어서 진행해 줘.
```

### 읽기 전에 검토받을 때: `diorama-reviewer`

```text
/skill:diorama-reviewer walkthroughs/badge-tap.js를 내가 읽기 전에 검토해 줘.
```

collection 안에서는 planner가 이 단계를 대신 진행합니다. 단일 페이지를 검토하거나, 다른
모델의 의견을 한 번 더 받고 싶을 때 직접 부르세요.

## 아이디어

요청은 움직이는 것 하나와 답이 되는 숫자 하나가 있는 질문일 때 가장 잘 됩니다. 아래는
기본 무대로 그릴 수 있는 예입니다. 첫 열처럼 말하면 나머지는 에이전트가 제안합니다.

| 이런 것을 물으면 | 질문 | 움직이는 것 | 숫자 |
|---|---|---|---|
| 우리 로그인이 동작하는 방식 | 왜 그날의 첫 로그인은 더 오래 걸릴까? | 브라우저에서 API를 거쳐 세션 저장소까지 가는 로그인 요청 하나 | 구간마다 걸린 밀리초와 그 합 |
| 작업 대기열이 밀리는 이유 | 왜 오전 9시에 작업이 쌓일까? | 워커가 꺼내 가는 속도보다 빠르게 대기열에 들어오는 작업 | 10분 뒤에 기다리는 작업 수 |
| 로그 디스크가 차는 시점 | 로그 디스크는 언제 가득 찰까? | 저장소를 채워 가는 로그 쓰기 | 가득 찰 때까지 남은 일수 |
| 지원 티켓이 머무는 곳 | 왜 티켓 하나를 닫는 데 나흘이 걸릴까? | 팀에서 팀으로 넘어가는 티켓 하나 | 팀마다 기다린 시간 |
| 캐시로 얻는 것 | 왜 두 번째 페이지 로드가 첫 번째보다 빠를까? | 데이터베이스까지 가지 않고 캐시에서 멈추는 요청 | 로드 한 번에 줄어드는 밀리초 |
| 장애가 나면 생기는 일 | 결제 서비스가 죽으면 주문은 어떻게 될까? | 끊긴 연결에 닿았다가 대기열에서 기다리는 주문 | 늦어진 주문 수와 잃은 주문 수 |
| 요청 수를 제한하는 이유 | 클라이언트 하나는 거절당하기 전까지 요청을 몇 번 보낼 수 있을까? | 관문을 통과하거나 튕겨 나오는 요청 | 분당 허용되는 요청 수 |
| 내 업무 | [설명하기 가장 어려운 과정] | [움직이는 것] | [중요한 숫자] |

## 결과물

- **단일 페이지:** HTML 파일 하나입니다. 서버나 인터넷 연결 없이 어떤 브라우저에서든
  열립니다. 화살표 키로 단계를 넘기고, `R`로 다시 재생하고, Space로 멈춥니다. 단계마다
  고유한 링크가 있습니다.
- **독자가 모든 페이지에서 보는 것:**
  - 제목 바로 아래에, 이 walkthrough가 답하는 질문
  - 직접 해 보는 단계. 값을 고르면(클릭하거나 `1`–`5` 키) 무슨 일이 일어나는지와 그
    이유를 보여 줍니다. `0`을 누르면 처음으로 돌아갑니다
  - "Where this comes from" 목록. 어떤 사실과 숫자에 출처가 있고 어떤 것이 가정인지
    알려 줍니다
  - 가까이 들여다볼 수 있는 무대. 휠(페이지가 스크롤되는 화면에서는 Ctrl/⌘ + 휠), 핀치,
    무대 위 버튼, `+`/`-` 키로 확대하고 끌어서 둘러봅니다. 물체를 더블클릭하면 그 물체를
    확대하고, `F`를 누르거나 바닥을 더블클릭하면 장면 전체가 다시 보입니다. 새 단계는
    언제나 작성자가 잡아 둔 구도에서 시작합니다
  - 연결 따라가기. 물체를 가리키거나 Tab으로 고르거나 탭하면, 그 물체와 연결선, 연결선
    끝의 물체는 또렷하게 남고 나머지 장면은 흐려집니다. 연결선을 가리키면 그 양 끝이
    보입니다
  - 테마 버튼. 라이트, 다크, 시스템 설정 따르기 중에서 고릅니다. 단일 페이지에서는 오른쪽
    위에, 컬렉션에서는 목차와 상단 바에 있습니다. 고른 값은 독자의 브라우저에 저장됩니다
- **작성자와 리뷰어가 쓰는 것:** `#/<walkthrough-id>/sheet` 주소의 시트입니다. 모든
  단계와 직접 해 보는 단계의 모든 선택지를 정지 화면으로 한 페이지에 보여 주고, 맨 위에
  자동 검사 결과를 나열합니다. 잘못된 참조, 맞지 않는 합계, 겹치는 라벨, 분량을 넘긴
  글을 잡아냅니다. 사용자도 시트를 열어 볼 수 있으며, 에이전트가 링크를 알려 줍니다.
- **collection:** 압축하거나 정적 파일로 호스팅할 수 있는 폴더입니다.

  ```text
  my-collection/
  ├── index.html         이 파일을 엽니다
  ├── collection.js      목차와 각 walkthrough의 상태
  ├── walkthroughs/      walkthrough마다 파일 하나
  ├── reviews/           리뷰 기록과 사용자의 결정
  ├── sources/           사실과 숫자의 출처가 되는 자료
  ├── engine/            페이지 셸, 무대, 단계별 스토리. 모든 walkthrough가 함께 씁니다
  └── AGENTS.md          이 폴더를 여는 에이전트를 위한 규칙과 현재 상태
  ```

collection 안의 walkthrough는 `planned` → `drafted` → `reviewed` → `awaiting-approval` →
`approved` 순서로 진행됩니다. 마지막 상태는 사용자만 지정합니다.

## 설치

이 dotfiles 저장소의 나머지 부분은 필요 없습니다. 아래 방법 중 하나를 고르세요.

### 에이전트에 붙여 넣어 설치

가장 빠른 방법입니다. 아래 블록 전체를 복사해 사용하는 코딩 에이전트에 붙여 넣으세요.

```text
Diorama 에이전트 플러그인을 설치해 줘.

출처: https://github.com/heecheon92/dotfiles (공개 저장소), 폴더 home/.agents/plugins/diorama.
그 안의 skills/ 폴더에 스킬 세 개가 있어: diorama-maker, diorama-planner, diorama-reviewer.

1. 임시 디렉터리에 그 폴더만 내려받아:
   git clone --depth 1 --filter=blob:none --sparse https://github.com/heecheon92/dotfiles.git <tmp>/diorama-src
   cd <tmp>/diorama-src && git sparse-checkout set home/.agents/plugins/diorama
2. home/.agents/plugins/diorama/skills/ 안의 스킬 폴더 세 개를 수정 없이, 네가 스킬을 읽어
   오는 사용자 단위 스킬 폴더에 복사해. 어느 폴더인지 확실하지 않으면 ~/.agents/skills를
   쓰고 나에게 알려 줘.
3. 같은 이름의 폴더가 이미 있으면 덮어쓰기 전에 멈추고 나에게 물어봐.
4. 설치한 폴더마다 SKILL.md가 있는지, diorama-maker/assets/walkthrough.html이 있는지 확인해.
5. 임시 디렉터리를 지워.
6. 스킬을 어디에 설치했는지, 어느 커밋에서 가져왔는지, 스킬이 인식되려면 세션을 새로
   시작해야 하는지 알려 줘.

다른 것은 설치하지 말고, 다른 파일은 바꾸지 말고, 스킬을 아직 실행하지는 마.
```

단독으로 동작하는 부분만 설치하려면 요청을 "diorama-maker만 설치해 줘"로 바꾸세요.

### Skills CLI로 설치

Node.js가 필요합니다. 스킬 세 개를 사용자 계정 전체에 설치하며, 어떤 에이전트에 설치할지
묻습니다.

```bash
npx skills add https://github.com/heecheon92/dotfiles/tree/main/home/.agents/plugins/diorama --global --skill '*'
```

단독으로 동작하는 maker만 설치하려면:

```bash
npx skills add https://github.com/heecheon92/dotfiles/tree/main/home/.agents/plugins/diorama --global --skill diorama-maker
```

위처럼 경로까지 포함한 전체 URL을 쓰세요. `npx skills add heecheon92/dotfiles`는 저장소
최상위의 스킬만 찾기 때문에 이 플러그인을 찾지 못합니다.

나중에 제거하려면: `npx skills remove --global diorama-maker diorama-planner diorama-reviewer`.

### Codex에 포함된 설치 스크립트로 설치

```bash
python3 "${CODEX_HOME:-$HOME/.codex}/skills/.system/skill-installer/scripts/install-skill-from-github.py" \
  --repo heecheon92/dotfiles \
  --path home/.agents/plugins/diorama/skills/diorama-maker \
         home/.agents/plugins/diorama/skills/diorama-planner \
         home/.agents/plugins/diorama/skills/diorama-reviewer
```

### 이 dotfiles를 쓰는 경우

`./rebuild.sh`는 이 플러그인을 설치하지 않습니다. 필요할 때 직접 연결하세요.

```bash
~/.dotfiles/home/.agents/plugins/install.sh diorama
```

링크가 저장소를 가리키므로 수정한 내용이 재설치 없이 바로 반영됩니다. 제거 방법과
`diorama-maker`만 따로 연결하는 방법은 [plugins README](../README.md)에 있습니다.

## 선택 사항으로 함께 쓰면 좋은 스킬

Diorama는 다른 것 없이 동작합니다. 다음 스킬 묶음은 함께 쓰기를 권장합니다.

| 스킬 | 도움이 되는 경우 | 설치 |
|---|---|---|
| [`threejs-*`](https://github.com/CloudAI-X/threejs-skills) (스킬 13개, MIT) | 독자가 부품을 직접 눌러 보는 실습처럼, 전용 3D 무대를 만들 때 | `npx skills add cloudai-x/threejs-skills`, 또는 이 저장소 스킬 레지스트리의 `external/cloudai-x/` |

`diorama-maker`는 해당되는 곳에서 이 스킬들을 안내하며, 없어도 똑같이 동작합니다.

## 기대할 수 있는 것

**되는 것:** 무언가를 실제로 설명해 주는 첫 walkthrough를, 근거를 댈 수 있는 숫자와
함께, 공유할 수 있는 파일 하나로 받습니다.

**안 되는 것:** 첫 요청에 바로 완성되는 일은 드뭅니다. 고칠 점을 하나씩 요청하게 될
것으로 생각하세요. 그리고 결과물은 그림으로 그린 아이소메트릭 다이어그램이지, 돌려 볼
수 있는 실사 3D가 아닙니다.

세 가지만 기억한다면:

1. 주제가 아니라, 움직이는 것 하나와 숫자 하나가 있는 질문을 던지세요.
2. 무엇이든 그리기 전에 숫자를 출처와 함께 모아 두세요.
3. 페이지의 모든 숫자는 같은 몇 개의 값에서 나옵니다.

## 한계

- 무대는 기계, 저장된 데이터, 기기, 사람, 군중, 대기열, 구역과 그 사이의 연결선, 그
  위를 움직이는 점을 그립니다. 차트, 타임라인, 수식, 3D 물체는 그리지 않습니다. 이런
  것이 필요한 walkthrough에는 전용 무대가 있어야 합니다. `diorama-maker`는 그런 무대를
  만드는 방법을 설명하지만 무대 자체를 제공하지는 않습니다.
- 직접 해 보는 단계는 미리 정해 둔 값만 제공합니다. 자유 입력, 열린 연습 과제, 나중에
  독자를 다시 불러오는 장치는 없습니다.
- 자동 검사는 기계적인 문제를 잡아냅니다. 잘못된 참조, 틀린 합계, 겹치는 라벨, 너무 긴
  글이 그 대상입니다. 모델 리뷰는 여기에 더해 사실과 숫자를 출처와 대조합니다. 어느
  쪽도 사용자가 직접 읽는 일을 대신하지는 않습니다. 처음 보는 사람에게 설명이
  와닿는지는 사용자가 판단해야 합니다.
- collection의 읽기 진행 상황은 독자의 브라우저에만 저장됩니다.
- 지금 walkthrough를 보여 주는 방식은 하나뿐입니다. 아이소메트릭 무대 위의 단계별
  스토리입니다. 엔진 0.4.0부터는 엔진에 이런 템플릿을 더 넣을 수 있고 추가할 계획도
  있지만, 아직 다른 템플릿은 없습니다.

## 유지보수

엔진의 원본은 `skills/diorama-maker/assets/collection/engine/` 한 곳이며(버전 0.5.0),
세 층으로 나뉩니다. 셸(`diorama.js`, `diorama.css`)은 walkthrough를 둘러싼 페이지로,
collection, 검색, 진행 상황, 링크를 맡습니다. 무대(`stage-iso.*`)는 아이소메트릭 그림을
그립니다. 템플릿(`template-story.*`)은 단계별 스토리이며, 지금 있는 유일한 템플릿입니다.
층 사이의 계약과 템플릿이나 무대를 추가하는 방법은
`skills/diorama-maker/references/templates.md`에 있습니다.

단일 페이지 `skills/diorama-maker/assets/walkthrough.html`에는 세 층 모두의 복사본이 들어
있습니다. 엔진을 고친 뒤에는 복사본을 다시 만들고 확인하세요.

```bash
python3 tools/build-single.py          # 엔진으로 walkthrough.html을 다시 만듭니다
python3 tools/build-single.py --check  # 최신 상태가 아닌 것이 있으면 실패합니다
```

`--template <name>`, `--template-dir <folder>`, `--out <path>`를 쓰면 다른 템플릿의 단일
페이지를, 다른 폴더의 파일로, 다른 경로에 만듭니다. `tools/test-template/`에는 `plain`이
있습니다. 단계도 무대도 없는 템플릿으로, 층이 제대로 분리되었는지 시험하는 용도로만
씁니다. 실행 방법은 `templates.md`에 있습니다.

`tools/`는 유지보수용이며 어떤 스킬에도 포함되지 않습니다.
