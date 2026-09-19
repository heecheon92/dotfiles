# Neovim 편집 환경

Neovim의 LSP, 자동 완성, 포맷, 탐색, UI와 Jupyter 노트북 동작을 설명합니다.
이 문서의 저장소 경로와 `./rebuild.sh` 명령은 모두 저장소 루트를 기준으로 합니다.

언어별 동작을 검토하고 실행 결과를 기록할 때는 [LSP 점검표](lsp-checklist.md)의
공통 점검 영역과 기록 양식을 사용합니다. 점검표는 구현을 강제하는 통과 기준이 아닙니다.

> [!NOTE]
> 플러그인은 `lazy.nvim`, 실행 도구는 Nix로 관리합니다. 아래 서버 바이너리가 이미
> 설치된 환경에서는 LSP 설정 변경 후 `./rebuild.sh` 없이 Neovim만 다시 열면 적용됩니다.

## 언어 도구와 편집 동작

- completion capability가 있는 클라이언트에는 각 버퍼의 식별자 문자를 native completion
  트리거에 더합니다. 서버가 원래 광고한 `.`, `:`, 따옴표 같은 문장부호 트리거는 그대로
  유지합니다. signature help도 특정 언어 이름이 아니라, 연결된 서버가 광고한 trigger와
  retrigger 문자에 맞춰 자동 호출합니다. 서버가 기능을 광고하지 않는 문맥에는 강제하지 않습니다.
- Neovim의 Lua LSP는 Nix의 `lua-language-server`와 내장 자동 완성을 사용합니다.
  `./rebuild.sh` 적용 후 Lua 파일을 열면 서버가 시작되며, `vim.o.` 등의
  Neovim API를 완성할 수 있습니다. `Ctrl-Y`로 선택 항목을 확정하고,
  `:checkhealth vim.lsp`로 연결 상태를 확인합니다. Mason은 사용하지 않습니다.
  내장 자동 완성 메뉴는 기존 `mini.icons`의 종류별 아이콘과 색상을 표시하고,
  선택한 항목의 문서는 옆 팝업에 표시합니다. 별도 완성 플러그인은 사용하지 않습니다.
- Python LSP는 Nix의 `pyrefly`를 사용합니다. `./rebuild.sh` 적용 후 Neovim을
  다시 열면 Python 파일에서 자동으로 시작합니다. 내장 자동 완성과 `Ctrl-X` → `Ctrl-O`
  수동 완성을 사용하며 `Ctrl-Y`로 확정합니다. 프로젝트 설정이 없는 파일에도 표준
  타입 검사를 적용하고, `pyrefly.toml` 또는 `[tool.pyrefly]` 프로젝트 설정을 우선합니다.
  completion capability와 해당 버퍼의 식별자 문자를 사용하므로 `te`를 입력하면 `test` 같은
  이름을 자동으로 제안합니다. 후보는 미리 선택하지 않으며, `Ctrl-N`/`Ctrl-P`로
  이동하고 `Ctrl-Y`로 선택 항목(선택 전에는 첫 항목)을 확정합니다.
  Pyrefly가 알려 준 시그니처 트리거 문자(현재 `(`, `,`)를 입력하면 매개변수 힌트가
  자동으로 표시됩니다. 팝업으로 포커스를 옮기지 않아 계속 입력할 수 있고,
  입력 모드의 `Ctrl-S` 수동 시그니처 도움말도 유지합니다.
- TypeScript/JavaScript와 React (`.tsx`, `.jsx`)는 Nix의 `typescript-language-server`와
  `typescript`를 사용합니다. `./rebuild.sh` 적용 후 Neovim을 다시 열면 `ts_ls`가
  프로젝트에 연결됩니다. 프로젝트의 TypeScript 설치를 우선 사용하며, 라이브러리와
  타입 정의도 프로젝트에 설치되어 있어야 합니다. `useSta` 같은 이름을 입력하고
  React의 `useState` 제안을 `Ctrl-Y`로 확정하면 import도 추가됩니다.
  영문자·숫자·`_`·`$` 입력도 내장 자동 완성을 시작하므로 `<S`처럼 컴포넌트 이름을
  쓰기 시작하면 제안을 표시합니다. 서버가 제공하는 import 경로는 제안 오른쪽에
  표시되며, `Ctrl-N`/`Ctrl-P`로 선택하고 `Ctrl-Y`로 이름과 import를 함께 확정합니다.
  내장 완성은 `noselect`를 유지하며, 팝업에 선택된 항목이 없을 때 `Ctrl-Y`를 누르면
  첫 번째 표시 항목을 확정합니다. 선택된 항목이 있거나 팝업이 없으면 기존 동작을 유지합니다.
  `Ctrl-.`은 일반·입력·Visual 모드에서 LSP 코드 액션을 표시합니다.
  `Ctrl-X` → `Ctrl-O`로 수동 완성을 요청할 수 있습니다. 의존성이 많은 프로젝트에서도
  제안을 제공하도록 패키지 auto-import 색인을 활성화하며, 첫 연결 시 색인 시간이 필요합니다.
- Tailwind CSS는 Nix의 `tailwindcss-language-server`와 Neovim 내장 완성을 사용합니다.
  HTML에는 `vscode-html-language-server`, CSS/SCSS/Less에는
  `vscode-css-language-server`를 함께 연결해 일반 태그·속성·CSS 구문을 완성합니다.
  두 범용 서버는 이미 설치된 `vscode-langservers-extracted` 바이너리를 사용합니다.
  Neovim을 다시 열면 HTML에는 범용 HTML 서버, CSS/SCSS/Less에는 범용 CSS 서버가
  연결되고, Tailwind 서버는 HTML/CSS/JS/TS/JSX/TSX 프로젝트에서 함께 연결됩니다.
  Tailwind v4는 프로젝트에 설치된 패키지와 `@import "tailwindcss"`가 있는 CSS 진입점을
  사용합니다. `className` 안에서 `bg-r`처럼 입력하면 제안이 자동으로 표시되며,
  `Ctrl-N`/`Ctrl-P`로 선택하고 `Ctrl-Y`로 확정합니다. `cn`, `clsx`, `cva`도 설정에 포함합니다.
  클래스의 색상 미리보기는 Neovim 0.12의 기본 LSP document-color 배경 강조를 사용합니다.
  별도 colorizer 플러그인이나 완성 엔진은 추가하지 않습니다.
- YAML (`.yaml`, `.yml`)은 Nix의 `yaml-language-server`, JSON/JSONC는
  `vscode-langservers-extracted`의 JSON 서버를 사용합니다. `./rebuild.sh` 적용 후
  Neovim을 다시 열면 자동 연결되며, 구문 진단과 내장 자동 완성을 제공합니다.
  애플리케이션별 설정 키 검증에는 해당 JSON Schema가 필요합니다.
  Neovim 0.12.4에서는 자동으로 짝지어진 따옴표 안에서 JSON/JSONC Schema 속성 snippet을
  수락하면 닫는 따옴표가 하나 더 남을 수 있습니다. 서버의 replacement range는 올바른
  것으로 확인했으며, 별도 수락 hook이나 따옴표 정리 우회 처리는 추가하지 않았습니다.
- 저장 시 포맷은 `lua/plugins/formatting.lua`의 `conform.nvim`이 담당합니다.
  JavaScript/TypeScript·JSX/TSX·HTML·CSS·JSON은 Prettier, Lua는 StyLua,
  Python은 `ruff format`을 사용합니다. Python import 정렬이나 lint 자동 수정은 하지 않습니다.
  `./rebuild.sh`로 Nix의 `prettier`, `stylua`, `ruff`를 설치하고 Neovim을 다시 여세요.
  Prettier는 프로젝트의 `node_modules` 실행 파일을 우선하며, 각 도구는 프로젝트 설정을 따릅니다.
  저장 전에 최대 2초 동안 포맷하며, 해당 외부 포매터가 없을 때만 LSP 포맷으로 대체합니다.
  외부 포매터의 오류나 시간 초과는 LSP 재시도로 숨기지 않습니다. 둘 다 없으면 그대로 저장합니다.
  `:ConformInfo`로 현재 버퍼의 포매터와 실행 가능 여부를 확인할 수 있습니다.
- Jupyter 노트북은 `jupynvim`으로 편집하고 실행합니다. Python 커널은 프로젝트의
  `.venv`에 두며 기존 Pyrefly와 내장 자동 완성을 유지합니다.
  설치와 이미지 렌더링 제한은 아래 **Neovim Jupyter 노트북**을 참고하세요.
- Neovim UI 플러그인은 기존 `lazy.nvim`으로 관리합니다. Neovim 0.12 이상에서
  `tiny-cmdline.nvim`은 `:` 명령줄을 중앙 팝업으로 표시하고 (`/`, `?` 검색은 하단 유지),
  `modicator.nvim`은 모드에 따라 현재 줄 번호 색상을 바꿉니다.
  `nvim-hlslens`는 검색 결과에 카운터를 표시하며 `n`, `N`, `*`, `#`, `g*`, `g#`를
  그대로 사용할 수 있습니다. `<leader>l`로 검색 강조를 지웁니다.
- `:` 명령줄은 글자를 입력할 때마다 Neovim 내장 완성 후보를 자동으로 표시합니다.
  후보는 미리 선택하지 않으며, `Tab`으로 선택하기 전까지 입력 내용은 그대로 유지됩니다.
  `/`, `?` 검색과 TypeScript/React의 코드 완성 동작은 변경하지 않습니다.
- 파일 검색은 `<leader>ff`로 현재 작업 디렉터리, `<leader>fF`로 홈 디렉터리를
  검색합니다. 두 검색 모두 숨김 파일을 포함하되 ignore 규칙은 유지합니다.
  `<leader>/` 내용 검색도 숨김 파일을 포함하며 ignore 규칙은 유지합니다.
  Snacks 탐색기와 파일 선택기의 숨김·Git ignored·untracked 파일명은 Sonokai의 `Grey`
  색상을 사용합니다. `lua/plugins/colorscheme.lua`에서 지정하며, 투명 배경은 유지합니다.
- `Snacks.indent`는 중첩 깊이별 색상으로 들여쓰기 가이드를 표시하고 현재 범위를
  강조합니다. 애니메이션은 끕니다. `rainbow-delimiters.nvim`은 Sonokai 색상으로
  괄호 쌍을 구분하며, Lua/Python/JSON/YAML 파서도 `nvim-treesitter`로 설치합니다.
- `nvim-autopairs`는 괄호와 따옴표를 자동으로 짝지으며 `Ctrl-Y` 완성 확정 키는
  유지합니다. 괄호와 태그 사이의 Enter 확장은 플러그인의 기본 규칙을 사용하며,
  들여쓰기는 Neovim의 `indentexpr`, `shiftwidth`, `expandtab` 설정을 따릅니다.
  짝 사이에서는 완성 팝업이 열려 있어도 현재 보이는 텍스트를 유지하며 완성을
  종료한 뒤 펼칩니다. `Ctrl-E` 취소로 `>` 같은 문자가 되돌려지는 것을 방지합니다.
  그 밖의 일반 줄바꿈과 완성 팝업의 Enter 동작, `Ctrl-Y` 수락은 유지합니다.
  `nvim-ts-autotag`는 HTML/JSX/TSX 태그를 자동으로 닫고
  이름 변경 시 짝 태그도 갱신합니다. 필요한 HTML/JavaScript/TypeScript/TSX 파서는
  기존 `nvim-treesitter` 설치 설정에서 관리합니다.
- JSX/TSX, HTML, Vue, Svelte, XML에서 `<table>|</table>`처럼 여는 태그와 닫는
  태그 사이에 커서를 놓고 Enter를 누르면 세 줄로 펼칩니다. `<Card>`,
  `<Dialog.Content>` 같은 사용자 정의 태그와 JSX fragment도 지원합니다.
  JSX/TSX와 HTML은 `nvim-treesitter`의 `indentexpr()`로 중첩 구조와 여러 줄에 걸친
  태그 속성을 인식해 들여씁니다. 나머지 파일 형식은 해당 파일 형식의 들여쓰기를 사용합니다.
  직접 줄을 교체하거나 공백을 삽입하지 않습니다. 플러그인의 Enter 확장은 `.` 반복 시
  전체 줄 배치를 재현하지 못하는 제한이 있습니다.

## Neovim Jupyter 노트북

`home/.config/nvim/lua/plugins/notebook.lua`에서 `jupynvim`의 안정 릴리스를
사용하며, 실제 버전은 `lazy-lock.json`으로 고정합니다. `.ipynb` 읽기 전에
플러그인을 로드해야 하므로 eager loading을 사용합니다. 최초 Neovim 실행 시
Lazy가 설치하며, 필요하면 `:Lazy install jupynvim`으로 실행할 수 있습니다.
Apple Silicon Mac에서는 upstream 설치기가 Rust 백엔드의 prebuilt와
`SHA256SUMS`를 내려받아 검증합니다. Prebuilt가 없는 플랫폼에서는 `cargo`가
필요합니다.

Python 커널은 전역이 아니라 프로젝트 환경에 설치합니다. 기존 uv 프로젝트라면
uv가 설치된 셸에서 프로젝트 디렉터리로 이동한 후 실행합니다:

```bash
uv add --dev ipykernel
uv sync
nvim analysis.ipynb
```

uv를 쓰지 않는 프로젝트는 `python3 -m venv .venv`로 환경을 만들고
`.venv/bin/python -m pip install ipykernel`로 설치할 수 있습니다.
이미 커널이 있는 `.venv`는 다시 만들 필요가 없습니다. 플러그인은 노트북의
상위 디렉터리에서 `.venv`를 자동 탐색하므로 사용자 kernelspec을 별도로
등록하지 않아도 됩니다. Python/uv와 프로젝트 의존성은 각 머신·프로젝트에서
관리하며 이 설정은 전역 Python 환경을 변경하지 않습니다.

새 노트북은 `:JupynvimOpen analysis.ipynb`으로 생성합니다. 노트북 안에서만
기본 키맵이 적용됩니다 (`<leader>`는 Space):

- `<leader>nr` 또는 Shift+Enter: 셀 실행 후 다음 셀로 이동
- Ctrl+Enter: 현재 셀 실행 후 그대로 유지
- `<leader>nR`: 전체 실행
- `<leader>na` / `<leader>nb`: 위 / 아래에 셀 추가
- `<leader>nm` / `<leader>ny`: Markdown / 코드 셀로 변환
- `<leader>nK`: 커널 선택, `<leader>ni`: 중단, `<leader>nx`: 재시작
- `:w`: 코드와 실행 결과 저장

터미널에서 수정키+Enter를 구분하지 못하면 `<leader>nr`을 사용합니다.
실행 중인 커널의 완성·hover는 `jupynvim_kernel` LSP가 제공하며, 기존 내장
완성과 `Ctrl-Y`를 그대로 사용합니다. Pyrefly는 notebook protocol로 연결됩니다.
프로젝트 루트와 `.venv`를 올바르게 탐지하려면 프로젝트에 `pyproject.toml`
또는 `pyrefly.toml`을 두는 것이 좋습니다. 원격 SSH 프로필은 설정하지 않습니다.

이미지는 WezTerm/iTerm2를 고려해 `image_renderer = 'chafa'`로 설정합니다.
`chafa`는 Nix로 관리하므로 `./rebuild.sh` 적용 후 사용할 수 있습니다.
다만 **검증한 jupynvim v0.4.5에는 코드 셀 이미지의 capability 검사 버그**가
있어 Kitty/Ghostty가 아닌 터미널에서는 chafa fallback에 도달하지 않습니다.
이 환경에서는 텍스트 출력과 실행·저장은 동작하지만 코드 셀 이미지는 표시되지
않습니다. 이미지 데이터는 `.ipynb`에 그대로 저장됩니다. Upstream 코드는
수정하거나 monkey-patch하지 않습니다. 실제 그래픽에는 Kitty 또는 Ghostty
1.3+와 `image_renderer = 'placeholder'` 설정이 필요하며, multiplexer 조합은
별도 확인이 필요합니다.
