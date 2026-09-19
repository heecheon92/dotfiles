# Neovim 편집 환경

Neovim은 LazyVim을 기준으로 구성합니다. 시작 화면, Snacks 탐색기, 기본 LSP 키맵,
Blink 완성, Conform 포맷과 lazygit 동작은 LazyVim 기본값을 따르고, 저장소에는 필요한
언어 extra와 작은 로컬 조정만 둡니다. 언어별 동작을 점검할 때는
[LSP 점검표](lsp-checklist.md)를 사용하되, 점검표를 구현 gate로 취급하지 않습니다.

## 소스와 동기화

- 공유 설정의 원본은 `home/.config/nvim`입니다. Home Manager는 이 디렉터리를
  `~/.config/nvim`에 out-of-store symlink로 연결하므로 저장소에서 수정한 내용이 원본입니다.
- `home/.config/nvim/lazy-lock.json`은 플러그인 commit을, 같은 디렉터리의
  `lazyvim.json`은 LazyVim extra와 메타데이터를 기록합니다. 재현 가능한 구성을 위해 둘 다
  Git으로 관리합니다.
- Mason이 언어 서버와 editor formatter를 전담합니다. 선택한 언어 extra와
  `ensure_installed` 목록은 dotfiles로 동기화되지만, Mason이 설치한 바이너리의 정확한
  버전은 `lazy-lock.json`에 고정되지 않습니다.
- Nix는 Neovim, tree-sitter, ripgrep, fd, fzf, lazygit, chafa와 일반 CLI를 제공합니다.
  LSP와 formatter를 Nix와 Mason에 중복 선언하지 않습니다.
- 새 머신의 첫 실행 전에는 Node.js/npm과 Python/venv 등 Mason 설치에 필요한 runtime을
  준비합니다. Mason의 editor 도구 경로는 Neovim 안에서 우선 적용되며, 셸 전역 도구
  설치를 대신하지 않습니다.

## 기본 편집 경험

- 인자 없이 열면 LazyVim의 Snacks dashboard가 표시됩니다. 검색, 세션, Lazy와
  Lazy Extras 진입점도 기본 dashboard 동작을 사용합니다.
- 키맵은 LazyVim 기본값을 기준으로 하되, 명시적으로 선택한 Oil 탐색기, 완성, hlslens
  검색 동작을 조정합니다. `<leader>`는 Space이며 `which-key`로 현재 문맥의 키를 확인합니다.
- 완성은 `blink.cmp`가 담당합니다. `default` 키 preset과
  `preselect = false`, `auto_insert = false`로 메뉴가 열려도 후보를 자동 선택·삽입하지
  않습니다. `<C-y>`는 선택한 후보를 수락하며 선택이 없으면 첫 후보를 수락합니다.
  `<Enter>`는 완성을 수락하지 않고 일반 줄바꿈과 `mini.pairs` 들여쓰기를 유지합니다.
  자동 signature popup은 유지하며, 설정은 `lua/plugins/completion.lua`에 둡니다.
- 괄호와 따옴표 짝은 LazyVim의 `mini.pairs` 기본 동작을 사용합니다. 자동 짝은 LSP
  capability가 아니며, snippet 수락과의 상호작용은 실제 filetype에서 따로 확인합니다.
- `nvim-hlslens`는 Normal 모드의 `n`, `N`, `*`, `#`, `g*`, `g#` 검색에 현재/전체
  일치 개수와 이동 횟수를 표시합니다. `3n` 같은 횟수 지정도 유지합니다. 표시된 이동
  키와 실제 동작을 맞추기 위해 `n`/`N`은 기존 Vim 검색 방향을 따릅니다. `/` 검색 뒤
  `n`은 앞으로, `?` 검색 뒤 `n`은 뒤로 이동하며 `N`은 그 반대입니다.
  `<Esc>`로 검색 강조와 lens를 지우고, `<leader>l`은 Lazy plugin manager로 유지합니다.
- Sonokai Atlantis를 투명 배경 모드로 사용합니다. Snacks picker의 hidden, ignored,
  untracked 경로는 투명 배경에서도 읽히도록 `Grey`에 연결합니다. 설정 위치는
  `home/.config/nvim/lua/plugins/appearance.lua`입니다.
  같은 `ColorScheme` callback에서 `Comment`/`SpecialComment`는 `#b0b6c2`,
  `LineNr`는 `#9299a8`, `LspInlayHint`는 `#a0a7b4`로 밝힙니다. foreground만 바꾸므로
  기존 italic 속성, 배경 투명도와 다른 syntax 색은 유지하며 theme을 다시 적용해도 보존됩니다.
  일반 들여쓰기 guide의 `SnacksIndent`도 `#9299a8`로 밝히며, 활성 scope 색은 그대로
  유지해 구분합니다. 공백·기타 `NonText` 표시는 함께 밝히지 않습니다.
  비슷한 문제가 다시 발생하면 [가독성 문제 대응 지침](../AGENTS.md#neovim-foreground-visibility)에
  따라 표시의 생성 주체와 highlight group을 먼저 확인하고 좁은 범위로 조정합니다.
- `gitsigns.nvim`은 현재 줄 blame을 표시합니다. LazyVim의 Git picker와 lazygit을
  그대로 사용하며, `<leader>gg`는 저장소 root, `<leader>gG`는 현재 작업 디렉터리에서
  lazygit을 엽니다. Neogit과 Diffview는 추가하지 않습니다.
- `<leader>e`는 프로젝트 root의 Oil, `<leader>E`는 현재 작업 디렉터리의 Oil을 엽니다.
  Snacks 탐색기는 기존 `<leader>fe`/`<leader>fE`에 각각 root/cwd 동작으로 유지합니다.
  키 설정은 `lua/config/keymaps.lua`, Oil plugin 설정은 `lua/plugins/workflows.lua`에 둡니다.

## 언어와 포맷

`home/.config/nvim/lua/config/lazy.lua`는 로컬 `plugins`보다 먼저
`lang.python`, `lang.typescript`, `lang.tailwind`, `lang.json`, `lang.yaml`,
`lang.markdown`, `formatting.prettier` 공식 extra를 불러옵니다. HTML과 CSS/SCSS/Less는
공식 언어 extra가 없는 범위를 `home/.config/nvim/lua/plugins/languages.lua`의
`html`/`cssls` 서버 설정으로 보완합니다. Mason은 이 선언에서 필요한 서버와 formatter를
설치합니다.

- Python은 Pyrefly와 Ruff, JavaScript/TypeScript/React는 기본 `vtsls`를 사용합니다.
- Tailwind, JSON, YAML과 Markdown은 각각 `tailwindcss`, `jsonls`, `yamlls`,
  `marksman`을 사용합니다. JSON/YAML schema, 프로젝트 의존성, Tailwind 진입점처럼
  프로젝트별 조건은 별도로 갖춰야 합니다.
- `lua/config/options.lua`의 `vim.g.lazyvim_python_lsp = "pyrefly"`로 공식 Python extra의
  서버를 선택합니다. 이 선택은 Pyright/basedpyright를 비활성화합니다. 이전 Mason
  Pyright 설치는 `:MasonUninstall pyright`로 정리합니다.
- Python 타입 검사·완성은 Pyrefly, lint·format은 Ruff가 담당합니다. `languages.lua`에서
  Pyrefly의 `python.pyrefly.typeCheckingMode`를 `default`로 설정해 별도 프로젝트 설정이
  없어도 일반 타입 오류를 표시합니다. `strict` 모드가 아니며 `pyrefly.toml` 또는
  `[tool.pyrefly]` 설정이 우선합니다. Pyrefly 기본 `auto` 모드는 설정이 없는 프로젝트에서
  최소 검사인 `basic`으로 내려갑니다. 자세한 동작은
  [공식 IDE 설정](https://pyrefly.org/en/docs/IDE/#pythonpyreflytypecheckingmode)을 참고합니다.
- HTML과 CSS 계열은 `html`과 `cssls`의 일반 구문·완성을 사용하고, 해당 프로젝트에서는
  Tailwind 서버가 함께 연결될 수 있습니다.
- Prettier extra는 JS/TS/JSX/TSX, HTML, CSS/SCSS/Less, JSON/JSONC, YAML, Markdown 등
  지원 filetype에 Prettier를 연결합니다. Markdown은 조건에 따라 `markdownlint-cli2`와
  `markdown-toc`도 이어서 실행합니다. Lua는 LazyVim 기본 StyLua를 사용하고, Python은
  Ruff LSP formatting을 fallback으로 사용할 수 있습니다.

저장 포맷의 소유자는 LazyVim의 `LazyVim.format`과 Conform입니다. LazyVim이 등록한
`BufWritePre` 흐름이 저장 전에 선택된 formatter를 호출하며, 별도
`conform.nvim` `format_on_save` 설정은 두지 않습니다. 수동 포맷은 `<leader>cf`,
현재 buffer의 formatter와 실행 경로는 `:ConformInfo`, LSP 연결은 `:LspInfo`, Mason
설치 상태는 `:Mason`에서 확인합니다. formatter가 없을 때의 LSP fallback을 formatter
실행 실패 재시도와 혼동하지 않습니다.

## Jupyter 노트북

`home/.config/nvim/lua/plugins/notebook.lua`는 `jupynvim`을 시작 시 로드해 `.ipynb`를
일반 JSON보다 먼저 처리합니다. 기존 노트북은 `nvim analysis.ipynb`, 새 노트북은
`:JupynvimOpen analysis.ipynb`으로 엽니다. 대표 명령은 다음과 같습니다.

- `:JupynvimRunCell`, `:JupynvimRunAll`: 현재 셀 또는 전체 코드 셀 실행
- `:JupynvimKernel`, `:JupynvimRestart`: 커널 선택 또는 재시작
- `:JupynvimClearCellOutput`, `:JupynvimClearOutputs`: 출력 정리
- `:JupynvimSaveImage [path]`, `:JupynvimImageMode chafa`: 이미지 저장과 renderer 선택

노트북 buffer 안의 셀 키맵은 jupynvim 기본값을 사용합니다. 예를 들어 `<leader>nr` 또는
Shift+Enter는 셀을 실행하고 다음 셀로 이동하며, `<leader>nR`은 전체 셀을 실행합니다.
반면 explorer, terminal, picker의 전역 dispatch mapping 목록은 모두 비워 두어 LazyVim의
전역 탐색기·터미널·picker 키를 가로채지 않습니다.

노트북은 기본적으로 셀 선택용 COMMAND 모드로 열립니다. `<CR>` 또는 `i`를 한 번
눌러 EDIT 모드로 들어간 뒤 일반 Vim 편집 키를 사용합니다. COMMAND 모드에서 바로
`cc`를 누르면 수정 불가 오류가 나는 것이 기본 동작입니다. EDIT 모드의 Normal 상태에서
`<Esc>`를 누르면 다시 COMMAND 모드로 돌아갑니다.

Python kernel은 프로젝트 `.venv`에 둡니다. uv 프로젝트에서는 다음처럼 설치합니다.

```bash
uv add --dev ipykernel
uv sync
nvim analysis.ipynb
```

이미지 renderer는 `chafa`로 선택하고 실행 파일은 Nix가 제공합니다. 다만 현재 고정된
`jupynvim`은 Chafa 선택 여부와 무관하게 Kitty/Ghostty terminal 감지를 먼저 요구합니다.
2026-09-19 iTerm 실행에서는 이미지 생성·노트북 저장·`:JupynvimSaveImage path.png`의
원본 PNG export는 확인했지만, inline 표시는 이 upstream 제한으로 동작하지 않았습니다.
terminal 환경 위장이나 plugin 내부 patch는 추가하지 않습니다. 이미지 지원이 바뀌면
실제 사용 terminal에서 다시 확인합니다.
