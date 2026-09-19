# 언어별 LSP 점검표

이 문서는 LSP, 완성 또는 저장 포맷 구성을 바꾸거나 새 언어를 추가할 때 공통 영역을
빠뜨리지 않기 위한 **권고용 기록 양식**입니다. 최소 의무 사항이나 구현 gate가 아닙니다.
서버·언어·프로젝트가 지원하지 않는 동작, upstream 제약과 아직 확인하지 않은 동작을
그대로 기록할 수 있으며, 표를 맞추기 위한 복잡한 hook이나 입력 보정을 요구하지 않습니다.

설치와 설정, 서버 capability는 지원 가능성을 설명합니다. 실제 키 입력과 화면 관찰은
실행 동작을 설명합니다. 둘을 분리하고 headless LSP 응답만으로 UI를 확인했다고 쓰지 않습니다.

## 공통 검토 영역

### 1. 자동 제안

- 현재 completion engine에서 식별자나 서버 trigger 문자를 입력할 때 후보가 열리는지 봅니다.
- 최초 선택 상태, 계속 입력했을 때의 필터링과 입력 원문 보존을 확인합니다.
- ghost text나 AI 예측은 별도 기능이며 이 항목에 포함하지 않습니다.

### 2. 완성과 snippet

- 현재 completion engine의 후보 이동, 수락, 취소 키를 실제 `:map`과 UI 도움말로 확인합니다.
  이전 엔진의 키가 그대로 유지된다고 가정하지 않습니다.
- 후보 문서, snippet placeholder와 자동 import는 서버와 실제 프로젝트가 지원하는 작은
  fixture에서 각각 확인합니다. capability 광고와 실행 관찰을 구분합니다.

### 3. 자동 짝

- 문법상 적절한 위치에서 `()`, `[]`, `{}`, 큰따옴표와 작은따옴표의 삽입, closer
  건너뛰기와 빈 짝 삭제를 확인합니다. 태그 언어의 닫는 태그는 별도 항목으로 봅니다.
- 자동 짝은 LSP capability가 아니라 편집기 플러그인 동작입니다. 완성·snippet 수락 뒤
  중복 closer처럼 문제가 생길 수 있는 문맥을 filetype별로 기록합니다.

### 4. 자동 시그니처

- signature help capability가 있는 서버에서 `(`, `,` 등 서버가 광고한 trigger와
  retrigger를 입력했을 때 도움말이 자동으로 표시되는지 확인합니다.
- popup focus 유지, active parameter 갱신과 수동 호출을 구분합니다. hover와 본문
  inlay hint는 다른 기능입니다.

### 5. 저장 시 포맷

Conform은 LSP 서버가 아니라 외부 formatter와 LSP formatting을 연결하는 플러그인입니다.
완성·진단이 동작한다는 사실만으로 저장 포맷도 확인했다고 기록하지 않습니다.

현재 구성에서는 LazyVim의 `LazyVim.format`이 포맷 owner이고, LazyVim이 등록한
`BufWritePre` 흐름이 Conform을 호출합니다. 별도 `conform.nvim` `format_on_save` 필드가
설정되어 있다고 가정하거나 그 필드를 검사하지 않습니다.

- [ ] `:set filetype?`, `:ConformInfo`에서 선택된 formatter, 가용성, 실행 경로와 로그를
  확인합니다. Mason 설치 여부와 현재 buffer에서 실제 선택된 formatter를 구분합니다.
- [ ] Prettier 설정, StyLua 설정, Ruff 설정 등 프로젝트 설정과 제외 규칙이 결과에
  반영되는지 봅니다.
- [ ] 의도적으로 서식이 흐트러진 작은 fixture를 `:w`로 저장하고, buffer와 디스크가
  예상대로 바뀌는지 확인합니다. 재저장 시 불필요한 추가 변경이 없는지도 필요하면 봅니다.
- [ ] 외부 formatter 사용과 LSP fallback을 구분합니다. fallback은 formatter 오류나
  timeout 뒤 같은 저장에서 자동 재시도한다는 뜻이 아닙니다.
- [ ] formatter 실행, lint 자동 수정과 import 정렬을 서로 다른 동작으로 기록합니다.

현재 선언은 `home/.config/nvim/lua/config/lazy.lua`의 공식 extra와
`home/.config/nvim/lua/plugins/languages.lua`의 HTML/CSS 서버 보완에 있습니다.
Prettier extra는 지원하는 웹·데이터·Markdown filetype을 Conform에 연결합니다.
Markdown extra는 조건에 따라 `markdownlint-cli2`와 `markdown-toc`도 조합합니다.
Lua는 LazyVim 기본 StyLua를 사용하고, Python은 Pyrefly와 Ruff를 연결해 Ruff LSP
formatting을 fallback으로 사용할 수 있습니다. 이는 구성 설명이며 실제 저장 결과를
새로 확인했다는 뜻은 아닙니다.

결과에는 `확인`, `부분 확인`, `미지원`, `upstream 제한`, `해당 없음`, `미확인`처럼
관찰에 맞는 표현을 씁니다. `미지원`이나 `미확인`은 구현 실패나 우회 구현 요구가 아닙니다.
일반 JSON/YAML처럼 함수 호출 signature가 없는 영역은 `해당 없음`으로 기록할 수 있습니다.

## 재사용 기록 양식

```text
언어 / 파일 형식:
날짜 / 호스트 / Neovim 버전:
completion engine / pairing plugin:
도구 버전: 서버=, formatter=, 언어 런타임=, 프로젝트 의존성=
fixture / 프로젝트 종류:
root marker / 실제 root:
연결 provider: 이름=, attached=예|아니요

[ ] 자동 제안 — capability: / 설정 지원: / 실행 관찰: / 상태:
    증거: 입력=, popup=, 최초 selected=
[ ] 완성 — capability: / 설정 지원: / 실행 관찰: / 상태:
    증거: 필터=, 후보 이동=, 수락=, 취소=, 문서=
    snippet=미지원|upstream 제한|미확인|확인
    import=해당 없음|미지원|미확인|확인
[ ] 자동 짝 — 편집기 설정: / 실행 관찰: / 상태:
    증거: (), [], {}, 따옴표, 태그, 완성·snippet 수락 뒤 closer
[ ] 자동 시그니처 — capability: / 설정 지원: / 실행 관찰: / 상태:
    증거: trigger, retrigger, active parameter, 수동 호출, focus 유지
[ ] 저장 시 포맷 — LazyVim/Conform 설정: / 실행 관찰: / 상태:
    filetype=, formatter·버전·실행 경로=, available=, 프로젝트 설정·제외 규칙=
    증거: 저장 전후 buffer·disk diff=, 재저장 변화=, LSP fallback 사용 여부=
    오류·timeout·로그=, lint 자동 수정·import 정렬과 구분=

선택 점검: hover / diagnostics / code actions / rename / references /
           inlay hints / snippets / imports / ghost text
요약:
관찰 증거: 입력 문자열, 화면 상태, 결과 텍스트, import diff 또는 저장 전후 diff
```

snippet 플러그인이나 별도 설정의 유무만 보고 snippet 지원 상태를 판정하지 않습니다.
실제 후보와 placeholder 이동을 검사하지 않았다면 `미확인`입니다. 자동 import도 프로젝트
의존성과 export가 있는 fixture에서만 확인합니다.

## capability 확인 명령

대상 buffer에서 실행합니다. 공개 API 결과는 UI 실행 관찰과 구분합니다.

```vim
:lua for _,c in ipairs(vim.lsp.get_clients({bufnr=0})) do local s=c.server_capabilities; print(vim.inspect({name=c.name,root=c.config.root_dir,completion=c:supports_method('textDocument/completion'),completionProvider=s.completionProvider,signature=c:supports_method('textDocument/signatureHelp'),signatureHelpProvider=s.signatureHelpProvider,inlay=c:supports_method('textDocument/inlayHint'),inlay_enabled=vim.lsp.inlay_hint.is_enabled({bufnr=0})})) end
```

같은 세션에서 서버·런타임 버전과 실제 root를 별도로 기록합니다. 한 buffer에 여러 provider가
붙었다면 각각 남깁니다.

## 과거 실행 기록: LazyVim 이전 native completion 구성

아래 기록은 **2026-09-19에 이전 custom Neovim 구성과 native completion으로 관찰한
역사적 증거**입니다. 현재 LazyVim/Blink 동작이나 새 Mason 설치 상태를 검증한 결과가
아닙니다. 비교 자료로만 사용하고 현재 상태는 새 기록 블록으로 다시 점검합니다.

- Neovim `0.12.4`에서 Lua, Python, TypeScript/JavaScript fixture의 native completion
  popup, 후보 이동·수락·취소, 괄호 짝과 일부 signature help를 관찰했습니다.
- HTML의 일반 속성, CSS 속성, React auto-import, Tailwind v4 fixture 후보를 관찰했습니다.
- local Schema를 연결한 JSON/JSONC/YAML에서 속성 제안을 관찰했고 YAML snippet을
  확인했습니다. 일반 JSON/YAML의 함수 signature는 `해당 없음`으로 기록했습니다.
- 당시 native completion과 자동 짝 따옴표를 함께 쓸 때 JSON/JSONC Schema 속성
  snippet 수락 뒤 닫는 따옴표가 하나 더 남는 제한을 관찰했습니다. 이것은 Blink에서
  재현했다고 주장하는 기록이 아니며, 현재 구성에는 이를 위한 cleanup hook을 추가하지 않습니다.
- 당시에도 SCSS/Less 전체 UI, 모든 snippet placeholder, notebook kernel integration과
  모든 pairing 문맥은 포괄적으로 확인하지 않았습니다.

## 실행 기록: 2026-09-19 LazyVim/Mason 전환

Neovim `0.12.4`와 LazyVim `16.0.1`의 별도 실제 TUI에서 다음을 확인했습니다.
이 기록은 아래 범위의 smoke 결과이며 점검표 전체 통과를 뜻하지 않습니다.

- Mason 실행 경로로 LuaLS, Pyright/Ruff, vtsls, Tailwind, HTML/CSS, JSON/YAML,
  Marksman이 연결되었습니다. 이전 Mason Pyrefly는 제거해 Python 중복 연결을 정리했습니다.
- Lua/Python/JavaScript/TypeScript에서 Blink LSP 후보와 `<C-y>` 수락, 자동 signature,
  쉼표 입력 뒤 signature 유지와 Insert focus 유지를 확인했습니다.
- HTML 속성, CSS 속성, TSX/JSX의 React `useState` 자동 import, Tailwind v4의
  `bg-red-*` 후보를 확인했습니다.
- local schema를 연결한 JSON/YAML에서 속성을 수락했습니다. JSON 결과는 parser로
  읽을 수 있었으며 이전 native 구성의 추가 닫는 따옴표 문제는 이 fixture에서 없었습니다.
- TypeScript는 Mason Prettier, Lua는 Mason StyLua, Python은 Ruff LSP로 저장 포맷을
  확인했습니다. 각 buffer와 disk 결과가 일치했고 두 번째 저장은 결과를 바꾸지 않았습니다.
- Markdown buffer의 rendering과 실제 브라우저 preview, `:Oil`과 기존 Snacks 탐색기
  mapping 공존, 현재 줄 Git blame 표시를 확인했습니다.
- Jupyter Python 셀 편집·실행, `42` 텍스트 출력의 저장·재열기, PNG 출력의 저장과
  원본과 일치하는 export를 확인했습니다. iTerm의 inline 이미지는 현재 jupynvim의
  terminal 감지 제한으로 표시되지 않았습니다. 자세한 사용법은 [편집 환경](editor.md)을 봅니다.
- 두 Nix host의 package 평가, MacBook-Pro system build와 활성화, Nix user profile에서
  이전 editor language tool 제거를 확인했습니다.

Health check에는 미사용 LuaRocks/hererocks 설치 오류, 비어 있는 이전 native package
경로 경고, 선택하지 않은 언어 runtime와 `wget`의 부재 경고가 남습니다. 현재 설치한
plugin은 LuaRocks를 요구하지 않으며, 선택한 Mason 도구 설치와 위 실행은 통과했습니다.
경고를 없애기 위한 별도 우회 설정은 추가하지 않았습니다.

SCSS/Less 전체 UI, JSONC, 모든 snippet placeholder·취소 동작, 임의 프로젝트의 설정·제외
규칙, 새 머신 bootstrap 전체와 다른 terminal의 notebook 이미지 표시는 이번 실행
범위에 포함하지 않았습니다.

## 후속 변경: Pyrefly 선택

초기 LazyVim 전환 이후 사용자 선택에 따라 Pyright를 Pyrefly로 교체했습니다. 위의
Pyright 실행 기록은 초기 전환 시점의 기록입니다. 현재는 Mason Pyrefly `1.3.1`과 Ruff를
사용하며 Pyright는 비활성화하고 Mason 설치도 제거했습니다.

- 실제 TUI에서 Pyrefly LSP 후보 수락, 자동 signature, `gd` 이동과 Ruff 저장 포맷을
  확인했습니다. Blink와 키맵은 변경하지 않았습니다.
- `typeCheckingMode = "default"`로 타입 불일치의 `bad-assignment` 진단과 코드 수정 후
  진단 해제를 확인했습니다. 서버 기본 `auto`/`basic`에서는 이 오류를 보고하지 않습니다.
- 새 Neovim 세션에서 Pyrefly/Ruff만 연결되고 Pyright가 설치·활성화되지 않음을 확인했습니다.
- notebook에서는 Pyrefly/Ruff와 notebook kernel client가 연결되었고, kernel 시작 후
  셀 실행으로 `42` 출력을 확인했습니다.
