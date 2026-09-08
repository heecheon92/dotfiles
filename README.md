# 동기화 가능한 개인 개발 환경

이 저장소는 여러 Mac에서 동일한 개발 환경을 쉽게 구성하고 유지하기
위한 개인용 dotfiles 저장소입니다.

새로운 Mac에서도 이 저장소를 내려받고 Nix 설정을 적용하면, 매번
도구와 환경을 처음부터 수동으로 설치하지 않고 익숙한 개발 환경을
재현할 수 있도록 만드는 것이 목표입니다.

## 사용 도구

- **Nix**: 개발 도구와 패키지 버전 관리
- **nix-darwin**: macOS 시스템 설정 관리
- **Home Manager**: 사용자 환경과 셸 설정 관리
- **Homebrew**: macOS 애플리케이션과 일부 패키지 관리

## 동기화하는 항목

- macOS 기본 설정
- CLI 개발 도구
- Homebrew formula 및 cask
- Zsh와 Starship 설정
- WezTerm, Neovim 등 개발 도구 설정
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
  - YAML (`.yaml`, `.yml`)은 Nix의 `yaml-language-server`, JSON/JSONC는
    `vscode-langservers-extracted`의 JSON 서버를 사용합니다. `./rebuild.sh` 적용 후
    Neovim을 다시 열면 자동 연결되며, 구문 진단과 내장 자동 완성을 제공합니다.
    애플리케이션별 설정 키 검증에는 해당 JSON Schema가 필요합니다.
  - Jupyter 노트북은 `jupynvim`으로 편집하고 실행합니다. Python 커널은 프로젝트의
    `.venv`에 두며 기존 Pyrefly와 내장 자동 완성을 유지합니다.
    설치와 이미지 렌더링 제한은 아래 **Neovim Jupyter 노트북**을 참고하세요.
  - Neovim UI 플러그인은 기존 `lazy.nvim`으로 관리합니다. Neovim 0.12 이상에서
    `tiny-cmdline.nvim`은 `:` 명령줄을 중앙 팝업으로 표시하고 (`/`, `?` 검색은 하단 유지),
    `modicator.nvim`은 모드에 따라 현재 줄 번호 색상을 바꿉니다.
    `nvim-hlslens`는 검색 결과에 카운터를 표시하며 `n`, `N`, `*`, `#`, `g*`, `g#`를
    그대로 사용할 수 있습니다. `<leader>l`로 검색 강조를 지웁니다.
  - 파일 검색은 `<leader>ff`로 현재 작업 디렉터리, `<leader>fF`로 홈 디렉터리를
    검색합니다. 홈 검색은 숨김 파일을 포함하되 ignore 규칙은 유지합니다.
  - `Snacks.indent`는 중첩 깊이별 색상으로 들여쓰기 가이드를 표시하고 현재 범위를
    강조합니다. 애니메이션은 끕니다. `rainbow-delimiters.nvim`은 Sonokai 색상으로
    괄호 쌍을 구분하며, Lua/Python/JSON/YAML 파서도 `nvim-treesitter`로 설치합니다.
  - `nvim-autopairs`는 괄호와 따옴표를 자동으로 짝지으며, Enter 줄바꿈과 `Ctrl-Y`
    완성 확정 키는 유지합니다. `nvim-ts-autotag`는 HTML/JSX/TSX 태그를 자동으로 닫고
    이름 변경 시 짝 태그도 갱신합니다. 필요한 HTML/JavaScript/TypeScript/TSX 파서는
    기존 `nvim-treesitter` 설치 설정에서 관리합니다.
- Pi의 모델, 테마, 스킬 및 확장 패키지 기본 설정

비밀번호, API 키, 인증 토큰, 회사 전용 정보처럼 외부에 공유하면 안
되는 값은 이 저장소에 포함하지 않는 것을 원칙으로 합니다. 이러한
정보는 각 Mac에서 별도로 관리합니다.

## 공유 에이전트 스킬

이 저장소에서 관리하는 에이전트 스킬 목록과 개별 설치 방법은
[`home/.agents/skills/README.md`](./home/.agents/skills/README.md)를
참고하세요. 전체 dotfiles 구성을 적용하지 않아도 원하는 스킬 디렉터리만
에이전트 또는 Codex 기본 설치 도구로 설치할 수 있습니다.

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

## macOS 창 관리와 메뉴 막대

macOS 공통 창 관리는 AeroSpace를 사용합니다. `configuration.nix`에서
Homebrew의 `nikitabobko/tap/aerospace` cask를 설치하고, Home Manager가
`home/.config/aerospace/aerospace.toml`을
`~/.config/aerospace/aerospace.toml`로 링크합니다. 별도 `~/.aerospace.toml`을
함께 만들면 설정 경로가 충돌하므로 하나만 사용합니다.

새 Mac에서는 `./rebuild.sh` 적용 후 AeroSpace를 실행하고
**시스템 설정 → 개인정보 보호 및 보안 → 손쉬운 사용**에서 AeroSpace를
허용해야 합니다. 권한은 머신마다 승인하며 Git으로 복제하지 않습니다.
로그인 시 자동 실행하며 시스템 설정 창만 floating으로 둡니다. 일반 창은 AeroSpace가
tiling으로 관리하고, 창 안쪽과 화면 가장자리에 16pt 간격을 둡니다. 상단은
SketchyBar 32pt를 포함해 48pt를 예약합니다. 포커스가 다른 모니터로 이동하면
포인터를 옮기며, 마우스가 가리키는 창에도 포커스를 맞춥니다.
숫자·문자 persistent workspace를 유지하되 모니터별 이름이나 앱별 고정
워크스페이스는 지정하지 않습니다.

- `Option+Enter`: `wezterm start --cwd ~`로 홈 디렉터리에 새 WezTerm 창 열기
- `Option+B` / `Option+E`: 새 Safari 창 / Finder 열기
- `Option+S`: 시스템 설정 열기 (이미 실행 중이면 활성화)
- `Option+C`: 현재 창 닫기 (마지막 창이면 앱 종료)
- `Option+H/J/K/L`: 왼쪽/아래/위/오른쪽 창 포커스
- 위 조합에 `Shift` 추가: 창 이동
- `Option+/` / `Option+,`: tiles 방향 전환 / accordion 방향 전환
- `Option+F`: AeroSpace 전체 화면 (macOS 기본 `Ctrl+Cmd+F`와 별개)
- `Option+Shift+F`: floating/tiling 전환
- `Option+1…9`: 워크스페이스 전환
- 위 조합에 `Shift` 추가: 현재 창만 해당 워크스페이스로 이동
- `Option+Tab`: 직전 워크스페이스로 전환
- `Option+Shift+Tab`: 현재 워크스페이스를 다음 모니터로 이동
- `Option+R`: 크기 조정 모드; `H/J/K/L`로 조정, Enter/Escape로 종료
- `Option+Shift+;`: service mode 진입

service mode에서는 `Escape`로 설정을 다시 읽고 main mode로 돌아갑니다.
`R`은 workspace 트리를 평탄화하고, `F`는 floating/tiling을 전환하며,
`Backspace`는 현재 창을 제외한 모든 창을 닫습니다. `Option+Shift+H/J/K/L`은
해당 방향의 컨테이너와 결합하며, 각 명령 뒤 main mode로 돌아갑니다.

WezTerm에서도 tiling과 전체 화면은 AeroSpace가 담당합니다.
`home/.config/wezterm/wezterm.lua`는 AeroSpace가 새 창 열기에 사용하는
`Option+Enter`의 WezTerm 기본 할당만 해제하고 나머지 기본 단축키는 유지합니다.
WezTerm의 simple fullscreen은 메뉴 막대를 자동 숨기므로 함께 사용하지 않습니다.

전역 키는 동일한 앱 단축키보다 우선합니다. OMP와 충돌하는 `Option+R`
(재시도), `Option+L` (화면 초기화), `Option+Shift+L` (현재 줄 복사)는 의도적으로
AeroSpace에 우선권을 줍니다. 반면 OMP의 `Option+P`, `Option+M`, `Ctrl+S`는
AeroSpace에 할당하지 않아 그대로 사용할 수 있습니다. OMP 키맵 자체는 변경하지
않습니다. 크기 조정 모드에서는 일반 `H/J/K/L` 입력도 AeroSpace가 처리하므로
작업 후 Enter/Escape로 빠져나옵니다.

설정 파일 저장 시 자동으로 다시 읽습니다. `auto-reload-config`를 처음 켠 뒤에는
`aerospace reload-config`를 한 번 실행해야 하며, 변경 전 검사는
`aerospace reload-config --dry-run --no-gui --warnings-as-errors`를 사용합니다.

상단은 SketchyBar로 표시하고, macOS 기본 메뉴 막대와 하단 Dock은 자동으로
숨깁니다. Apple 메뉴와 앱 메뉴는 화면 맨 위로 포인터를 올리면 나타납니다.
`configuration.nix`의 `_HIHideMenuBar = true`,
`AppleMenuBarVisibleInFullscreen = false`, `dock.autohide = true`가 원본입니다.
실행 중인 앱이 이전 전체 화면 설정을 유지하면 전체 화면을 나갔다가 다시
들어가거나 앱을 다시 실행합니다.

### 창 테두리 (JankyBorders)

`configuration.nix`에서 Homebrew의 `felixkratz/formulae/borders`를 설치합니다.
macOS 14 이상에서 동작하며, AeroSpace의 `after-startup-command`가 로그인 후
실행합니다. 시작 주체를 하나로 유지하기 위해 `brew services start borders`는
사용하지 않습니다. 별도 `bordersrc` 없이 모양도 같은 startup 명령에서 관리합니다.

기본 모양은 둥근 10pt 테두리, HiDPI 켜짐, 활성 창은 밝은 cyan `0xff00e5ff`,
비활성 창은 `0xff494d64`입니다. 색은 `0xAARRGGBB` 형식입니다.
기존 WezTerm의 비활성 창 흐림 효과는 그대로 유지합니다.

`after-startup-command`는 AeroSpace 시작 때 실행되므로 설정 파일을 저장하거나
`reload-config`만 실행해도 테두리 옵션이 다시 적용되는 것은 아닙니다.
모양을 바꿀 때는 startup 명령의 옵션을 수정한 뒤 같은 명령을 터미널에서
실행하면 현재 프로세스에 즉시 반영됩니다:

```sh
borders style=round width=10.0 hidpi=on \
  active_color=0xff00e5ff inactive_color=0xff494d64
```

이미 실행 중이면 위 명령은 새 상주 프로세스를 만들지 않고 기존 인스턴스를
갱신합니다. 새 Mac에서는 `./rebuild.sh` 적용 후 AeroSpace를 실행하면 됩니다.

### 상태 막대 (SketchyBar)

`configuration.nix`에서 `felixkratz/formulae/sketchybar`를 설치하고 Home Manager가
`home/.config/sketchybar`를 `~/.config/sketchybar`로 링크합니다.
AeroSpace의 `after-startup-command`가 실행하므로 별도
`brew services start sketchybar`는 사용하지 않습니다.

모든 디스플레이 상단에 32pt 어두운 막대를 표시합니다. 왼쪽에는 AeroSpace
워크스페이스와 현재 앱, 오른쪽에는 음량과 날짜·시간을 표시합니다.
숫자 1–9는 항상 표시하며, 문자 워크스페이스는 창이 있거나 포커스되었을 때
표시합니다. 선택한 워크스페이스는 JankyBorders와 같은 cyan으로 강조하며
클릭하면 해당 워크스페이스로 이동합니다. macOS 기본 Spaces 번호와는 다릅니다.

설정 원본은 `home/.config/sketchybar/sketchybarrc`, 항목 동작은 같은 디렉터리의
`plugins/*.sh`입니다. 별도 Lua 런타임이나 플러그인 프레임워크는 사용하지 않습니다.
`sketchybar --hotload on`으로 설정 디렉터리의 변경을 감시하므로 설정이나
플러그인 스크립트를 저장하면 자동으로 다시 읽습니다. 수동으로 다시 구성하려면:

```sh
sketchybar --reload
```

워크스페이스 전환은 AeroSpace의 `exec-on-workspace-change` 이벤트로 반영합니다.
새 워크스페이스 이름을 추가한 경우에도 `sketchybar --reload`로 버튼을 다시 만듭니다.
막대 높이를 바꾸면 AeroSpace의 `gaps.outer.top`도 `높이 + 16`에 맞춥니다.

새 Mac에서는 `./rebuild.sh` 적용 후 AeroSpace를 실행합니다.
SketchyBar는 **디스플레이마다 개별 Spaces**가 켜져 있어야 하므로
`com.apple.spaces`의 `spans-displays = false`를 관리합니다. 이 설정을 이전에
꺼 두었다면 적용 후 로그아웃·로그인이 필요할 수 있습니다.
기본 메뉴 막대는 삭제되지 않으며 화면 위쪽에 포인터를 올려 계속 사용할 수 있습니다.

## 터미널 전역 단축키

iTerm의 기존 Hotkey Window 프로필은
`home/.config/iterm2/hotkey-window.json`에서 Dynamic Profile로 계속 관리하며,
보조 터미널 단축키로 `Ctrl+Option+\``를 사용합니다. Home Manager가 iTerm의
`DynamicProfiles` 디렉터리를 링크하며, 변경은 `./rebuild.sh`로 적용합니다.
왼쪽 Option은 `Esc+`, 오른쪽 Option은 `Normal`로 유지합니다.

## Herdr 스크래치 셸

Herdr에서 `prefix+t`를 누르면 기본 `~/.zprofile`과 `~/.zshrc` 대신
`~/.config/zsh/scratch`의 경량 Zsh 프로필을 사용하는 팝업 터미널을 엽니다.
일반 셸은 FNM, 스크래치 셸은 롤백 기준으로 기존 NVM을 사용하며 어느 쪽도
Node 관리자를 시작 시 초기화하지 않습니다. 일반 셸은 `fnm`, Node 패키지
명령, 관리되는 전역 CLI 중 하나를 처음 실행할 때 FNM과 현재 디렉터리의
Node 버전을 활성화합니다. 스크래치 셸은 기존 NVM
로더를 그대로 유지합니다. Conda도 두 셸에서 첫 `conda` 명령이 현재 셸에 훅을
로드합니다. 런타임 버전과 전역 패키지는 각 머신에 로컬로 유지하며, 프로필과
로더 원본은 `home/.config/zsh`에서 관리하고 Home Manager가 링크합니다.
일반 셸과 스크래치 셸은 OMP 상태 표시줄의 구성을 본뜬 공통 Starship
프롬프트를 사용해 호스트, 현재 디렉터리, Git 상태와 명령 실행 시간을 표시합니다.

## Zsh 명령 기록 검색

일반 Zsh와 Herdr scratch shell에서 `Ctrl+R`을 누르면 FZF가 shell history를
fuzzy-search하는 selector를 엽니다. 검색 결과를 선택하면 command line에
삽입되며 바로 실행되지 않으므로 검토하거나 수정한 뒤 Enter를 누릅니다. 일반
Zsh는 첫 prompt가 표시된 뒤 다른 UI helper와 함께 widget을 lazy-load합니다.
Scratch shell은 시작 성능을 유지하기 위해 첫 `Ctrl+R` 입력 시에만 widget을
load합니다. 두 shell 모두 `Ctrl+T`와 `Alt+C`는 FZF에 할당하지 않습니다.

## Zsh 시작 성능 유지

일반 셸의 eager/lazy 경계, 스크래치 셸과의 벤치마크 방법, 새 SDK나
completion을 추가할 때의 판단 기준, 검증 및 롤백 절차는
[`ZSH_PERFORMANCE.md`](./ZSH_PERFORMANCE.md)를 참고하세요. 각 Mac에서
dotfiles 작업을 위임받은 에이전트는 Zsh 변경 전에 이 문서를 읽어야 합니다.

## OMP 저비용 모델 오버레이

Codex 사용량을 아껴야 할 때는 `ob` Zsh alias로 OMP를 실행합니다. 이 설정은
기본 설정과 인증·세션 상태는 그대로 공유하면서
`home/.omp/agent/config-budget.yml`의 저비용 모델 역할과 fallback만 현재
프로세스에 덮어씁니다. 일반 `omp` 실행은 기존 고성능 모델 구성을 유지합니다.

```bash
ob
```

기본(default)·slow·task 역할은 OpenRouter GLM 5.3 flash max를 사용하고,
smol·vision·commit 역할은 Luna, plan 역할은 Terra, advisor 역할은 Sol high를
유지합니다. fallback에는 Sol을 넣지 않아 지원 역할이 예기치 않게 고비용 모델로
복귀하지 않습니다.

## OMP Lavish ambient context

Lavish CLI와 bundled skill은 `packages/lavish-axi.nix`에서 같은 version으로
pin합니다. `./rebuild.sh`는 CLI를 설치하고 package 안의 `skills/lavish`를
`~/.agents/skills/lavish`에 연결한 뒤, Claude Code, Codex, OpenCode 및 GitHub
Copilot CLI의 machine-local `SessionStart` hook을 idempotent하게 등록하거나
복구합니다. 별도의 `npm install -g lavish-axi` 또는 `lavish-axi setup hooks`
실행은 필요하지 않습니다.

Home Manager는 `home/.omp/agent/extensions/lavish-runtime-context.ts`도 OMP의
native extension으로 연결합니다. 이 extension은 session 시작 시 Nix가 관리하는
`lavish-axi`를 한 번 실행하고 반환된 live review session 및 artifact 지침을 OMP
system prompt에 추가합니다. 설치 또는 변경 후에는 새 agent session을 시작해야
합니다.

Lavish를 올릴 때는 Nix expression의 version과 npm tarball hash, 그리고
`packages/lavish-axi/package.json` 및 `package-lock.json`의 dependency lock을
함께 갱신합니다.

## OMP 병렬 벤치마크 스크립트

`home/bin/omp_parallel_bench`는 여러 OMP 모델을 tmux pane에서 동시에
실행하는 개인용 벤치마크 명령입니다. `./rebuild.sh`를 실행하면
`omp_parallel_bench` 명령으로 사용할 수 있습니다.

```bash
omp_parallel_bench "/Users/heecheonpark/Git/agent-swarm"
omp_parallel_bench "/Users/heecheonpark/Git/agent-swarm" -v
omp_parallel_bench "/Users/heecheonpark/Git/agent-swarm" -o bench
omp_parallel_bench "/Users/heecheonpark/Git/agent-swarm" -o ./logs/omp-bench -v
```

`-o`/`--output`을 지정한 경우에만 모델별 로그를 저장합니다. `-v`/`--view`를
지정하면 벤치마크를 시작한 뒤 해당 tmux 세션을 즉시 표시합니다. `tmux`는
Home Manager가 설치하며, `omp` 실행 파일은 별도 OMP 설치가 필요합니다.

## 적용 방법

현재 Mac의 호스트 이름에 맞는 nix-darwin 구성을 적용합니다.

```bash
./rebuild.sh
```

현재 회사 Mac용 `Mac-mini` 프로필과 개인 Mac용 `MacBook-Pro` 프로필이
정의되어 있습니다. 다른 Mac에서 사용하기 전에는 해당 Mac의 호스트
이름과 환경에 맞는 별도 프로필을 `flake.nix`에 추가해야 합니다.

자세한 설치, 동기화, 복구 절차는
[SYNC_GUIDE.md](./SYNC_GUIDE.md)를 참고하세요.
