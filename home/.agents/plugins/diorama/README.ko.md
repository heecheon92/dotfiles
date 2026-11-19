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

## 사용해 보기

설명 하나:

```text
우리 로그인 흐름이 어떻게 동작하는지, 새 팀원에게 공유할 수 있는 페이지로 단계별로 설명해 줘.
```

여러 개 묶음:

```text
신입 엔지니어를 위한 출입 통제 시스템 온보딩 가이드를 만들고 싶어. 아직 목차는 없어.
```

planner는 다룰 주제 목록이 이미 있는지 먼저 묻습니다. 있으면 그 목록을 그대로 쓰고,
없으면 목차를 제안합니다. 목차를 승인하기 전에는 아무것도 작성하지 않으며, 각
walkthrough는 모델 리뷰를 거친 뒤 사용자가 승인합니다.

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

### git만으로 설치

플러그인 폴더(약 1 MB)만 내려받아 스킬을 제자리에 복사합니다.

```bash
git clone --depth 1 --filter=blob:none --sparse https://github.com/heecheon92/dotfiles.git diorama-src
cd diorama-src
git sparse-checkout set home/.agents/plugins/diorama

mkdir -p ~/.agents/skills
cp -R home/.agents/plugins/diorama/skills/diorama-* ~/.agents/skills/

cd .. && rm -rf diorama-src
```

사용하는 에이전트가 읽는 스킬 폴더에 복사하세요. `~/.agents/skills`는 여러 도구가 함께
쓰는 위치이고, Claude Code는 `~/.claude/skills`, Codex는 `~/.codex/skills`를 읽습니다.
제거하려면 그 폴더에서 `diorama-*` 폴더 세 개를 지우면 됩니다. 업데이트하려면 같은
과정을 다시 실행하세요.

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

### 설치한 뒤

스킬이 인식되도록 에이전트 세션을 새로 시작한 다음, 위의 예시 요청을 시도해 보세요. 더
설치할 것은 없습니다. 스킬이 만드는 페이지는 어떤 브라우저에서든 열립니다.

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
