# Diorama

[English](README.md) | [한국어](README.ko.md)

화이트보드에 잘 그린 그림처럼 설명하되, 그 그림이 움직이게 만듭니다. 구체적인 사례
하나를 고르고, 그림 하나를 한 단계씩 키워 가며, 옆에는 두어 문장만 둡니다.

이런 설명 하나를 **walkthrough**라고 부릅니다. 여러 walkthrough를 한 페이지 뒤에 묶은
것이 **collection**입니다. 강의, 온보딩 가이드, 장애 회고 모음, 설명 자료 모음이 모두
collection이 될 수 있습니다.

형식은 Dilum Sanjaya의 인터랙티브 학습 사이트들
([x.com/DilumSanjaya](https://x.com/DilumSanjaya))을 분석해 정리했습니다. Diorama는 그
형식만 가져왔고, 해당 사이트의 글, 그림, 코드는 들어 있지 않습니다.

## 스킬

| 스킬 | 하는 일 | 필요한 것 |
|---|---|---|
| `diorama-maker` | walkthrough 하나를 만듭니다. 대화 안에서, 단독 HTML 페이지로, 또는 collection의 일부로 만들 수 있습니다 | 없음. 단독으로 동작 |
| `diorama-planner` | collection을 함께 기획하고, 폴더를 만들고, 작성 → 리뷰 → 승인 순서를 진행합니다 | `diorama-maker` |
| `diorama-reviewer` | 사용자가 읽기 전에 walkthrough를 검토합니다. 먼저 처음 보는 독자의 눈으로 읽고, 이어서 형식과 출처에 맞는지 확인합니다 | `diorama-maker` |

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

## 결과물

- **단일 페이지:** HTML 파일 하나입니다. 서버나 인터넷 연결 없이 어떤 브라우저에서든
  열립니다. 화살표 키로 단계를 넘기고, `R`로 다시 재생하고, Space로 멈춥니다. 단계마다
  고유한 링크가 있습니다.
- **collection:** 압축하거나 정적 파일로 호스팅할 수 있는 폴더입니다.

  ```text
  my-collection/
  ├── index.html         이 파일을 엽니다
  ├── collection.js      목차와 각 walkthrough의 상태
  ├── walkthroughs/      walkthrough마다 파일 하나
  ├── reviews/           리뷰 기록과 사용자의 결정
  ├── sources/           사실 확인에 쓴 자료
  ├── engine/            무대 엔진. 모든 walkthrough가 함께 씁니다
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

## 한계

- 무대는 기계, 저장된 데이터, 기기, 사람, 군중, 대기열, 구역과 그 사이의 연결선, 그
  위를 움직이는 점을 그립니다. 차트, 타임라인, 수식, 3D 물체는 그리지 않습니다. 이런
  것이 필요한 walkthrough에는 전용 무대가 있어야 합니다. `diorama-maker`는 그런 무대를
  만드는 방법을 설명하지만 무대 자체를 제공하지는 않습니다.
- 모델 리뷰는 기계적인 문제를 걸러 내고 사실을 출처와 대조합니다. 사용자가 직접 읽는
  일을 대신하지는 않습니다. 처음 보는 사람에게 설명이 와닿는지는 사용자가 판단해야
  합니다.
- collection의 읽기 진행 상황은 독자의 브라우저에만 저장됩니다.

## 유지보수

무대 엔진의 원본은 `skills/diorama-maker/assets/collection/engine/` 한 곳입니다. 단일
페이지 템플릿 `skills/diorama-maker/assets/walkthrough.html`에는 그 복사본이 들어
있습니다. 엔진을 고친 뒤에는 복사본을 다시 만들고 확인하세요.

```bash
python3 tools/build-single.py          # 엔진으로 walkthrough.html을 다시 만듭니다
python3 tools/build-single.py --check  # 최신 상태가 아닌 것이 있으면 실패합니다
```

`tools/`는 유지보수용이며 어떤 스킬에도 포함되지 않습니다.
