# 언어별 LSP 점검표

이 문서는 LSP 설정을 바꾸거나 새 언어를 추가할 때 공통 영역을 빠뜨리지 않고 검토하기 위한
기록 양식입니다. 아래 항목은 최소 의무 사항이나 구현 gate가 아닙니다. 서버·언어·프로젝트의
성격에 따라 지원하지 않거나 upstream 제약이 있는 동작, 아직 검증하지 않은 동작을 그대로
기록할 수 있습니다. 점검표를 맞추기 위한 복잡한 hook이나 입력 보정은 요구하지 않습니다.

설치·설정·서버 capability는 지원 가능성을 설명하고, 실제 키 입력과 화면 관찰은 실행 동작을
설명합니다. 둘을 분리해 기록하며, headless 요청 응답만으로 UI 동작을 확인했다고 쓰지 않습니다.

## 공통 검토 영역

### 1. 자동 제안

- completion capability가 있는 클라이언트에서는 식별자를 입력할 때 native completion
  후보가 자동으로 열리는지 살펴봅니다. 현재 설정은 버퍼의 keyword 문자를 자동 트리거에
  추가하고, 서버가 원래 광고한 `.`, `:`, 따옴표 등의 문장부호 트리거도 보존합니다.
- 후보의 최초 선택 상태(`noselect`), 계속 입력했을 때의 필터링, 입력 원문 보존을 확인합니다.
- ghost text나 AI 예측은 별도 기능이며 이 영역에 포함하지 않습니다.

### 2. 완성

- `Ctrl-N`/`Ctrl-P` 후보 이동, `Ctrl-Y` 수락, `Ctrl-E` 취소와
  `Ctrl-X` → `Ctrl-O` 수동 완성을 필요에 따라 확인합니다.
- 서버가 제공하는 후보 문서, snippet placeholder, 자동 import는 서버와 실제 프로젝트가
  지원하는 fixture에서 따로 확인합니다. 설정 지원과 실행 확인을 구분합니다.

### 3. 자동 짝

- 문법상 적절한 위치에서 `()`, `[]`, `{}`, 큰따옴표와 작은따옴표의 삽입·건너뛰기·삭제를
  확인합니다. 태그 언어에서는 닫는 태그도 별도 항목으로 볼 수 있습니다.
- 자동 짝은 LSP capability가 아니라 편집기 플러그인의 동작입니다. 완성 수락 뒤 중복 closer,
  snippet replacement와의 상호작용처럼 실제로 필요한 문맥을 filetype별로 기록합니다.

### 4. 자동 시그니처

- 특정 언어에 고정하지 않고, signature help capability가 있는 서버가 광고한 trigger와
  retrigger 문자를 입력했을 때 도움말이 자동으로 표시되는지 확인합니다. 현재 설정도
  이 capability와 문자 목록을 그대로 사용합니다.
- 팝업의 포커스 유지, 쉼표 입력 뒤 active parameter 갱신, `Ctrl-S` 수동 호출을 구분해
  기록합니다. hover와 본문 inlay hint는 다른 기능이며 inlay hint 활성화는 선택 사항입니다.

결과에는 `확인`, `부분 확인`, `미지원`, `upstream 제한`, `해당 없음`, `미확인`처럼 관찰에
맞는 표현을 씁니다. 미지원·제한·미확인은 구현 실패를 뜻하지 않으며 우회 구현을 요구하지
않습니다. 예를 들어 일반 JSON/YAML 값에는 함수 호출 시그니처가 없어 `해당 없음`으로
기록할 수 있습니다.

## 재사용 기록 양식

언어별로 아래 블록을 복사합니다.

```text
언어 / 파일 형식:
날짜 / 호스트 / Neovim 버전:
도구 버전: 서버=, 언어 런타임=, 프로젝트 의존성=
fixture / 프로젝트 종류:
root marker / 실제 root:
연결 provider: 이름=, attached=예|아니요

[ ] 자동 제안 — capability: / 설정 지원: / 실행 관찰: / 상태:
    증거: 입력=, popup=, 최초 selected=
[ ] 완성 — capability: / 설정 지원: / 실행 관찰: / 상태:
    증거: 필터=, Ctrl-N/P=, Ctrl-Y=, 취소=, 문서=
    snippet=미지원|upstream 제한|미확인|확인
    import=해당 없음|미지원|미확인|확인
[ ] 자동 짝 — 편집기 설정: / 실행 관찰: / 상태:
    증거: (), [], {}, 따옴표, 태그, 완성·snippet 수락 뒤 closer
[ ] 자동 시그니처 — capability: / 설정 지원: / 실행 관찰: / 상태:
    증거: trigger, retrigger, active parameter, 수동 Ctrl-S, focus 유지

UI 키: Ctrl-X Ctrl-O=수동 완성, Ctrl-N/P=후보 이동,
       Ctrl-Y=수락, Ctrl-E=완성 취소, Ctrl-S=수동 시그니처
선택 점검: hover / diagnostics / code actions / rename / references /
           format / inlay hints / snippets / imports / ghost text
요약:
관찰 증거: 입력 문자열, 화면 상태, 결과 텍스트 또는 import diff
```

snippet 플러그인이나 별도 설정이 없다는 이유만으로 Neovim의 native snippet 지원을
`미지원`으로 기록하지 않습니다. 실제 snippet 후보와 placeholder 이동을 검사하지 않았다면
`미확인`입니다. 자동 import도 프로젝트 의존성과 export가 있는 fixture에서만 확인합니다.

## capability 확인 명령

대상 버퍼에서 실행합니다. 공개 API만 사용하며 결과는 UI 실행 관찰과 구분합니다.

```vim
:lua for _,c in ipairs(vim.lsp.get_clients({bufnr=0})) do local s=c.server_capabilities; print(vim.inspect({name=c.name,root=c.config.root_dir,completion=c:supports_method('textDocument/completion'),completionProvider=s.completionProvider,signature=c:supports_method('textDocument/signatureHelp'),signatureHelpProvider=s.signatureHelpProvider,inlay=c:supports_method('textDocument/inlayHint'),inlay_enabled=vim.lsp.inlay_hint.is_enabled({bufnr=0})})) end
```

서버와 런타임 버전은 같은 세션에서 별도로 기록합니다. root가 예상 프로젝트인지,
한 버퍼에 `ts_ls`와 `tailwindcss`처럼 여러 provider가 붙었는지도 함께 남기면 좋습니다.

## 2026-09-19 점검 결과

### 구성 지원과 공통 상태

- 실행 환경은 Neovim `v0.12.4`입니다.
- 설정에는 `lua_ls`, `pyrefly`, `ts_ls`, `tailwindcss`, `html`, `cssls`, `jsonls`,
  `yamlls` 여덟 클라이언트가 있습니다. `html`과 `cssls`는 이미 설치된
  `vscode-langservers-extracted`의 `vscode-html-language-server`와
  `vscode-css-language-server` 바이너리를 사용합니다.
- completion capability가 있는 연결 클라이언트에는 버퍼의 keyword 문자를 native
  autotrigger로 더하고 서버의 기존 문장부호 trigger를 유지합니다.
- signature help capability가 있는 연결 클라이언트에는 서버가 광고한 trigger와 retrigger
  문자로 자동 도움말을 요청합니다.
- inlay hint는 계속 비활성화되어 있습니다. ghost text나 AI 예측 설정도 추가하지 않았습니다.
  진단 virtual text는 ghost text가 아닙니다.

### 프로그래밍 언어 실행 관찰

Lua, Python, TypeScript, JavaScript fixture의 실제 TUI에서 다음 동작을 확인했습니다.

- 식별자 prefix 입력 중 자동 popup이 열리고 최초 선택은 `selected=-1`이었습니다.
- `Ctrl-N` 선택, `Ctrl-P` 이동, `Ctrl-E` 취소 뒤 입력 prefix 복원,
  `Ctrl-Y` 첫 후보 수락을 확인했습니다.
- 함수명 뒤에 여는 괄호를 입력했을 때 괄호 짝이 한 번만 삽입되었습니다.
- 여는 괄호 뒤 자동 signature help가 열렸고, 쉼표 뒤 active parameter 강조가
  갱신되었으며 입력 모드 포커스가 유지되었습니다.

이 목록은 해당 fixture에서 관찰한 실행 증거입니다. 모든 프로젝트 의존성, overload,
snippet placeholder, import 경로 또는 편집 문맥을 포괄한다는 뜻은 아닙니다.

Python fixture의 추가 spot-check에서는 `gre`에서 `greeti`까지 입력했을 때 후보가
`greeting`으로 좁혀지고 `Ctrl-Y`로 수락되는 것을 확인했습니다. `()`, `[]`, `{}`,
큰따옴표, 작은따옴표는 각각 짝 삽입, 기존 closer 건너뛰기, 빈 짝의 Backspace 삭제가
동작했습니다. 완성 후보를 선택하자 `(name: str) -> str` 문서 popup이 열렸고 입력 모드는
유지되었습니다. 이 추가 관찰은 Python 한 fixture의 결과이며 다른 언어로 확대하지 않습니다.

### 웹 언어 실행 관찰

- HTML에서 일반 `class` 속성 완성, CSS에서 `color` 속성 완성을 확인했습니다.
  이는 Tailwind overlay와 별도로 `html`/`cssls` 범용 서버가 실행된 결과입니다.
- TSX와 JSX에서 React `useState` 후보 수락 뒤 auto-import를 확인했습니다.
- Tailwind v4 fixture에서 `bg-r` 클래스 후보를 확인했습니다. 이 fixture에는
  `tailwindcss` v4 패키지와 CSS 진입점이 있었습니다.
- HTML의 `section` 태그와 TSX의 `Card` 태그 짝을 확인했습니다. 태그 짝은 LSP가 아니라
  `nvim-ts-autotag`의 편집기 동작입니다.

SCSS/Less UI 동작과 모든 태그·괄호·따옴표 문맥은 포괄적으로 확인하지 않았습니다.

### JSON / JSONC / YAML 실행 관찰

- local Schema를 연결한 JSON과 JSONC에서 속성 제안을 확인했습니다.
- local Schema를 연결한 YAML에서 속성 제안과 snippet 수락을 확인했습니다.
- 일반 JSON/JSONC/YAML에는 함수 호출 시그니처가 없으므로 자동 시그니처는
  `해당 없음`으로 기록합니다.

Neovim `0.12.4`에서 확인한 native completion 제약이 있습니다. 자동으로 짝지어진 따옴표 안에서
JSON/JSONC Schema 속성 snippet을 수락하면 닫는 따옴표가 하나 더 남을 수 있습니다.
서버가 보낸 replacement range는 올바른 것으로 확인했습니다. 이 동작을 숨기기 위한
custom acceptance hook이나 따옴표 cleanup은 구현하지 않았습니다.

### 이번에 포괄적으로 확인하지 않은 범위

- overload 전환
- 모든 snippet placeholder 이동
- SCSS/Less UI 동작
- notebook kernel integration
- 모든 filetype과 pairing 문맥

이 항목들은 `미확인` 기록이며 현재 구성의 실패 판정이 아닙니다. 필요해진 실제 프로젝트와
문맥에서 다시 관찰하고, 서버 미지원이나 upstream 제한이 확인되면 그 상태를 그대로 남깁니다.

## 다음 검토에 참고할 항목

1. 프로젝트 의존성이 달라졌다면 TS/JS/TSX/JSX auto-import와 Tailwind 후보를 대표
   프로젝트에서 다시 관찰합니다.
2. JSON/JSONC/YAML은 Schema 연결 유무를 기록하고 후보·문서·snippet 동작을 구분합니다.
3. 자동 짝·태그·취소·문서 popup은 LSP 응답과 편집기 플러그인 결과를 섞지 않고 기록합니다.
4. 현재 꺼진 inlay hint나 ghost text가 필요해질 때만 별도 정책으로 검토합니다.
