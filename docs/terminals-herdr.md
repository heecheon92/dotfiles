# 터미널, Herdr와 셸

호스트별 터미널 단축키, Herdr의 쓰기 가능한 로컬 설정 동기화, Radar,
스크래치 셸과 Zsh 기록 검색을 설명합니다. 이 문서의 저장소 경로와
`./rebuild.sh` 명령은 모두 저장소 루트를 기준으로 합니다.

## 호스트별 터미널 전역 단축키

`MacBook-Pro`에서는 Home Manager가 `home/.hammerspoon/init.lua`를 연결하고
Hammerspoon이 로그인할 때 자동 실행됩니다. 물리 키 코드 기반 `Ctrl+\``는 실행
중인 WezTerm이 앞에 있으면 숨깁니다. 뒤에 있으면 WezTerm을 활성화한 뒤 주 창을
마우스 포인터가 있는 화면 중앙으로 옮깁니다. 종료된 WezTerm을 새로 실행하지는
않습니다. 새 Mac에서는 Hammerspoon에 macOS 손쉬운 사용 권한을 한 번 허용해야
합니다. 이 프로필은 AeroSpace, SketchyBar, Borders와 그에 딸린 탭·폰트·Spaces
설정을 적용하지 않으며 macOS 메뉴 막대를 전체 화면에서도 표시합니다.

두 호스트 모두 공통 `home/.config/wezterm/wezterm.lua`를 개별 파일로 연결하고
rebuild가 로컬 `~/.config/wezterm/host.lua`를 생성합니다. 이 생성 파일은
`return { aerospace = true }` 또는 `return { aerospace = false }`를 제공하므로
직접 편집하지 말고 호스트 동작은 `flake.nix`의 `desktopProfile`에서 선택합니다.

iTerm의 기존 Hotkey Window 프로필은
`home/.config/iterm2/hotkey-window.json`에서 Dynamic Profile로 계속 관리하며,
보조 터미널 단축키로 `Ctrl+Option+\``를 사용합니다. Home Manager가 iTerm의
`DynamicProfiles` 디렉터리를 링크하며, 변경은 `./rebuild.sh`로 적용합니다.
왼쪽 Option은 `Esc+`, 오른쪽 Option은 `Normal`로 유지합니다.

## Herdr 설정과 Radar

`home/.config/herdr/config.toml`은 호스트 사이에 공유할 `[keys]` mode와
key binding의 기준입니다. 활성 `~/.config/herdr/config.toml`은 저장소에
링크하지 않고 각 Mac의 쓰기 가능한 일반 파일로 유지합니다. 따라서 Radar가
원자적으로 저장한 관리 블록, 주석과 테마를 포함한 `[keys]` 밖의 설정 및 다른
머신 로컬 설정은 동기화 대상이 아닙니다.

`./rebuild.sh`를 실행하면 Home Manager가 파일 링크를 만들기 전에 Nix의 Python과
`tomlkit`으로 `home/bin/sync-herdr-config.py`를 실행합니다. helper는 mode와
`key`를 binding의 식별자로 사용해 저장소 기준, 이전 관리 기준, 현재 활성 파일을
3-way merge합니다.

- 첫 실행은 활성 파일과 정확히 같은 공통 binding을 관리 대상으로 채택하고, 없는
  binding을 추가합니다. 같은 mode/key가 로컬에서 다르게 설정되어 있으면 보존합니다.
- 이후 저장소에서 바뀌거나 제거된 binding은 활성 값이 이전 관리 기준 그대로일
  때만 갱신하거나 제거합니다.
- 로컬에서 바꾼 binding과 로컬에서 삭제한 binding은 항상 우선하며, 동기화가
  되살리거나 덮어쓰지 않습니다.
- 활성 파일이 없으면 저장소의 portable 설정으로 새 일반 파일을 만듭니다.

기존 활성 파일의 최초 원본은
`~/.config/herdr/config.toml.before-dotfiles-sync`에 권한 `0600`으로 한 번만
백업합니다. 마지막으로 관리한 공통 binding은
`~/.config/herdr/config.toml.dotfiles-keys.json`에 기록합니다. 두 파일과 활성
설정은 머신 로컬이며 저장소에 추가하지 않습니다. 공통 키를 수정한 뒤에는
수동 복사 대신 반드시 `./rebuild.sh`를 실행해 merge를 적용합니다.

저장소 기준에는 사용자가 관리하는 `prefix+comma` Radar 설정 단축키를 유지하지만,
Radar가 생성하는 탭 바·테마·사이드바 관리 블록은 넣지 않습니다. 같은 디렉터리에
생기는 세션·로그·플러그인 체크아웃과 개별 플러그인 설정도 머신 로컬입니다.
Radar 캐시·백업은 `~/.local/state/herdr`, 설치된 아이콘 폰트는 사용자 폰트
디렉터리에 남습니다.

`home/.config/herdr/plugin-sources.txt`는 설치 가능한 출처를 기록하고 Home
Manager가 활성 경로에 링크할 뿐, 플러그인을 자동으로 설치하거나 제거하지
않습니다.

Homebrew로 Herdr를 업그레이드해도 실행 중인 서버는 이전 버전일 수 있습니다.
`herdr status server --json`의 `compatible`이 `false`이면 rebuild는 설정을
저장하고 통합 파일을 갱신하되 서버 reload를 건너뛰고 경고합니다. 서버 종료는
모든 pane 프로세스를 끝내므로 작업 중 자동으로 수행하지 않습니다. 작업을
저장하고 Herdr를 종료·재시작한 뒤 rebuild와 Radar 활성화를 진행하세요.
Radar는 설치된 CLI뿐 아니라 실행 중인 서버도 0.9.0 이상이어야 합니다.

Radar는 에이전트 상태와 작업 공간 그룹을 사이드바에 표시합니다. 다음 명령으로
설치하고 현재 세션에서 상태를 시작합니다.

```sh
herdr plugin install hhdebb/herdr-radar
herdr plugin action invoke hhdebb.herdr-radar.state-start
```

Radar 설치 프로그램은 머신 로컬 활성 설정에 관리 블록을 추가하고 사용자 아이콘
폰트를 설치합니다. 생성된 블록은 저장소 기준 설정에 복사하지 않습니다. WezTerm은
공유 설정에서 기본 Hack Nerd Font 뒤에 `Herdr Agent Icons Max`를 명시적
fallback으로 사용합니다. 그렇지 않으면 같은 코드포인트가 시스템 수학 폰트의 다른
기호로 표시될 수 있습니다. 기존 `prefix+a`는 주석 기능에 유지하며,
`prefix+comma` 또는 다음 명령으로 Radar 설정을 엽니다.

```sh
herdr plugin action invoke hhdebb.herdr-radar.settings
```

iTerm2의 `Hotkey Window (Managed)` 프로필은
`home/.config/iterm2/hotkey-window.json`에서 **Special Exceptions**를 사용합니다.
일반 글꼴과 비 ASCII 기본 글꼴은 모두 기존 `HackNFM-Regular 13`을 유지하고,
Radar 로고 `U+E1A0–U+E1B7`와 상태 기호 `U+E1C0–U+E1C5`만 설치된
`Herdr Agent Icons Max`로 표시합니다. 위 Radar 설치가 해당 글꼴을 설치하며,
프로필 변경은 iTerm2가 자동으로 읽으므로 Herdr를 재시작할 필요가 없습니다.

다른 iTerm2 프로필에도 적용하려면 **Settings → Profiles → Text**에서 비 ASCII
글꼴을 활성화하되 기존 일반 글꼴과 같은 글꼴·크기로 지정한 뒤, **Special
Exceptions**에 위 두 범위를 추가합니다. 비 ASCII 기본 글꼴 전체를 아이콘 전용
글꼴로 바꾸면 다른 Nerd Font 기호가 깨질 수 있습니다.
[iTerm2의 Special Exceptions 안내](https://iterm2.com/documentation-preferences-profiles-text.html#special-exceptions)를
참고하세요.

### Radar 제거

아래 절차는 **제거할 때만** 실행합니다. 단순히 소스 목록에서 항목을 지우거나
`herdr plugin uninstall`만 실행하면 Radar가 수정한 설정과 사용자 폰트가 남습니다.
[Radar 원본](https://github.com/hhdebb/herdr-radar)의 제거 액션을 먼저 실행해야 합니다.

먼저 `config.toml`을 백업하고, 아래 조회 명령으로 현재 설치 정보와 설정 경로를
확인합니다. 기존 Herdr 세션이나 다른 플러그인 디렉터리를 삭제하지 마세요.

```sh
herdr plugin list --plugin hhdebb.herdr-radar --json
herdr plugin config-dir hhdebb.herdr-radar
```

체크아웃이 남아 있을 때 다음 순서로 실행합니다.

```sh
herdr plugin action invoke hhdebb.herdr-radar.unconfigure
herdr plugin action invoke hhdebb.herdr-radar.uninstall-font
herdr plugin uninstall hhdebb.herdr-radar
```

- `unconfigure`는 Radar 데몬과 토큰을 정리하고, 탭 바·테마·사이드바의 세 관리
  블록을 제거한 뒤 Herdr 설정을 다시 불러옵니다. 기록된 원래 테마 설정이 있으면
  복원하며, 변경 전 설정은 Radar 상태 디렉터리의 `backups/`에 보관합니다.
  `state-stop`만으로는 이 정리가 끝나지 않습니다.
- `uninstall-font`는 Radar 아이콘 폰트와 플러그인이 추가한 Ghostty/kitty
  코드포인트 매핑을 제거합니다. 직접 추가한 WezTerm fallback은
  자동 제거하지 않습니다. 사용 중이라 삭제하지 못한 폰트는 해당 터미널을 종료한
  뒤 다시 확인하세요.
- 마지막 `plugin uninstall`은 Herdr 등록과 관리되는 GitHub 체크아웃을 제거합니다.
  플러그인 설정·상태·백업은 자동 삭제하지 않으며, `--purge` 옵션도 없습니다.

직접 추가한 연결이 있으면 다음 파일에서도 정리합니다.

- `config.toml`: `hhdebb.herdr-radar.settings`를 호출하는 `prefix+comma` 항목 등
  Radar 전용 단축키를 제거합니다. 다른 단축키와 테마 설정은 유지합니다.
- `home/.config/wezterm/wezterm.lua`: `Herdr Agent Icons Max` fallback을 제거하고
  기본 `Hack Nerd Font Mono`는 유지합니다.
- `plugin-sources.txt`: `hhdebb/herdr-radar` 설치 항목을 주석 처리합니다.
  나중에 출처를 찾을 수 있도록 GitHub URL과 plugin ID는 참고 기록으로 남깁니다.

완전히 지우려면 복구가 필요 없는지 확인한 뒤 **Radar 전용** 설정·상태 디렉터리만
별도로 정리합니다. 기본 경로는 아래와 같으며, XDG 또는 Radar 경로를 재정의했다면
위의 조회 결과와 실제 환경을 우선합니다.

- 설정: `~/.config/herdr/plugins/config/hhdebb.herdr-radar`
- 상태·캐시·설정 백업: `~/.local/state/herdr/plugins/hhdebb.herdr-radar`

마지막으로 다음을 실행해 플러그인 목록에 Radar가 없는지, 설정이 유효한지,
재로딩이 성공하는지 확인합니다. Herdr 서버를 종료할 필요는 없습니다.

```sh
herdr plugin list --plugin hhdebb.herdr-radar --json
herdr config check
herdr server reload-config
```

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
[`ZSH_PERFORMANCE.md`](../ZSH_PERFORMANCE.md)를 참고하세요. 각 Mac에서
dotfiles 작업을 위임받은 에이전트는 Zsh 변경 전에 이 문서를 읽어야 합니다.
