# 터미널과 셸

호스트별 터미널 단축키, Tern 설정, 스크래치 셸과 Zsh 기록 검색을 설명합니다.
사용을 중단하는 중인 Herdr가 rebuild에 남기는 동작과 Radar 제거 절차도 여기에
둡니다. 이 문서의 저장소 경로와 `./rebuild.sh` 명령은 모두 저장소 루트를
기준으로 합니다.

## 호스트별 터미널 전역 단축키

`MacBook-Pro`에서는 Home Manager가 `home/.hammerspoon/init.lua`를 연결하고
Hammerspoon이 로그인할 때 자동 실행됩니다. 물리 키 코드 기반 `Ctrl+\``는 실행
중인 Tern이 앞에 있으면 숨깁니다. 뒤에 있으면 Tern을 활성화한 뒤 주 창을
마우스 포인터가 있는 화면 중앙으로 옮깁니다. 종료된 Tern을 새로 실행하지는
않습니다. 단축키 변경 후 Hammerspoon 메뉴에서 Reload Config를 선택합니다.
WezTerm은 비교·복귀용으로 설치와 설정을 유지합니다.
새 Mac에서는 Hammerspoon에 macOS 손쉬운 사용 권한을 한 번 허용해야
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

## Tern 설정

`home/.config/tern/settings.json`은 Tern의 공유 환경설정입니다. Home Manager는
`~/Library/Application Support/Tern/settings.json`만 쓰기 가능한
out-of-store symlink로 연결합니다. Tern 설치 자체는 관리하지 않으며,
같은 디렉터리의 daemon 상태, 계정 정보, 잠금 파일과 agent runtime은 로컬에
남깁니다. 다른 Mac에서도 `./rebuild.sh`로 링크를 적용합니다. 기존 일반
`settings.json`이 있으면 먼저 비교하고 백업해 두세요.

터미널 글꼴은 `Berkeley Mono, Herdr Agent Icons Max` 순서로 지정합니다.
Tern의 기본 Berkeley Mono를 일반 텍스트에 유지하고, 뒤의 fallback은 Herdr 전용
아이콘 글꼴입니다. 이 아이콘 글꼴은 각 Mac에 별도로 설치되어 있어야 합니다.

설정은 저장소 파일에서 직접 편집하는 방식을 권장합니다. Tern Preferences의
저장 방식은 확인되지 않았습니다. 링크를 따라 저장하면 변경이 바로 Git에
나타나지만, 파일을 원자적으로 교체하면 링크가 일반 파일로 바뀔 수 있습니다.
Preferences에서 변경한 뒤에는 다음 명령으로 링크 유지 여부를 확인하세요.

```sh
readlink "$HOME/Library/Application Support/Tern/settings.json"
git diff -- home/.config/tern/settings.json
```

링크가 사라졌으면 rebuild 전에 활성 파일의 변경을 저장소에 반영하세요.
`TERN_CONFIG_DIR`로 전체 상태 디렉터리를 저장소에 옮기지는 않습니다.

Tern이 링크를 일반 파일로 바꾼 상태에서 rebuild하면 Home Manager는
`flake.nix`의 `home-manager.backupCommand`로 그 파일을
`settings.json.before-home-manager.<날짜-시각>.<PID>` 이름으로 옮기고 링크를
다시 만듭니다. 기존 백업을 덮어쓰지 않으므로 백업 이름 충돌로 activation이
중단되지 않습니다. 저장소에 반영하지 않은 Preferences 변경은 그 백업 파일에만
남으니 필요하면 직접 저장소 파일로 옮기세요. 오래된 백업은 자동으로 지워지지
않습니다. 빌드 성공이나 새 system profile 선택만으로 activation 성공을 판단하지
말고, rebuild 종료 상태와 실제 `~/.agents/skills/<name>` 링크를 확인하세요.

Tern의 릴리스 검토와 안전한 업데이트 절차는
[`tern-update`](../home/.agents/skills/handmade/tern-update/README.md)를
사용합니다. 공유 검토 기록은 이 Mac의 설치·실행 버전이나 호환성 확인을
뜻하지 않습니다. 실제 설치 관리자의 업데이트 경로를 별도로 확인하며, 실행
중인 Tern·daemon 재시작이나 OMP 및 플러그인 업데이트는 별도 권한이 필요합니다.
로컬 설정과 저장소 설정이 다르면 이동 전에 비교해 최신의 공유 가능한 설정만
보존하고, 경로·크기·비밀값 등 머신별 데이터는 무조건 복사하지 않습니다.

## Herdr 잔여 설정

Herdr는 사용을 중단하는 중이지만 설정은 아직 저장소에 남아 있습니다. 설정을
제거하기 전까지 `configuration.nix`는 Homebrew의 `herdr` 패키지를 설치하고,
`./rebuild.sh`는 실행할 때마다 다음을 수행합니다.

- `home/bin/sync-herdr-config.py`가 `home/.config/herdr/config.toml`의 공통 key
  binding과 `home/.config/herdr/sidebar-overrides.toml`의 스타일을 머신 로컬
  `~/.config/herdr/config.toml`에 병합합니다. 활성 파일은 링크가 아닌 일반
  파일이며, 없으면 새로 만듭니다. 로컬에서 바꾸거나 삭제한 binding은 유지합니다.
- 기존 활성 파일의 최초 원본을 `~/.config/herdr/config.toml.before-dotfiles-sync`에
  권한 `0600`으로 한 번만 백업하고, 마지막으로 관리한 binding을
  `~/.config/herdr/config.toml.dotfiles-keys.json`에 기록합니다. 두 파일과 활성
  설정은 저장소에 추가하지 않습니다.
- `~/.config/herdr/plugin-sources.txt`를 저장소 파일에 연결합니다. 플러그인을
  설치하거나 제거하지는 않습니다.
- `herdr` 실행 파일이 있으면, 실행 중인 서버가 CLI와 호환될 때
  `herdr server reload-config`를 실행하고 `home.nix`에 선언된 integration
  (`claude`, `codex`, `omp`, `opencode`, `pi`)을 설치하거나 갱신한 뒤 그 목록을
  `~/.config/herdr/nix-managed-integrations`에 기록합니다. 실행 파일이 없으면
  경고만 출력하고 계속합니다.

rebuild는 Herdr 서버를 종료하지 않습니다. 서버를 종료하면 모든 pane 프로세스가
끝나기 때문입니다. 서버가 호환되지 않아 reload를 건너뛰었다는 경고가 나오면
작업을 저장한 뒤 직접 Herdr를 종료·재시작하세요.

`Herdr Agent Icons Max` 글꼴 이름은 위 Tern 설정 외에
`home/.config/wezterm/wezterm.lua`의 fallback과
`home/.config/iterm2/hotkey-window.json`의 **Special Exceptions**에도 남아
있습니다.

### Radar 제거

Radar 플러그인을 제거할 때는 아래 순서를 따릅니다. `plugin-sources.txt`에서
항목만 지우거나 `herdr plugin uninstall`만 실행하면 Radar가 수정한 설정과 사용자
폰트가 남습니다.

1. `~/.config/herdr/config.toml`을 백업하고 현재 설치 정보와 설정 경로를
   확인합니다. 기존 Herdr 세션이나 다른 플러그인 디렉터리는 삭제하지 마세요.

   ```sh
   herdr plugin list --plugin hhdebb.herdr-radar --json
   herdr plugin config-dir hhdebb.herdr-radar
   ```

2. 체크아웃이 남아 있을 때 다음 순서로 실행합니다.

   ```sh
   herdr plugin action invoke hhdebb.herdr-radar.unconfigure
   herdr plugin action invoke hhdebb.herdr-radar.uninstall-font
   herdr plugin uninstall hhdebb.herdr-radar
   ```

   `unconfigure`가 Radar 관리 블록을 제거하고 변경 전 설정을 Radar 상태
   디렉터리의 `backups/`에 보관합니다. `state-stop`만으로는 이 정리가 끝나지
   않습니다. `uninstall-font`가 사용 중인 폰트를 삭제하지 못하면 해당 터미널을
   종료한 뒤 다시 확인하세요.

3. 위 명령이 자동으로 지우지 않는 연결을 직접 정리합니다.

   - `config.toml`: `hhdebb.herdr-radar.settings`를 호출하는 `prefix+comma` 항목
     등 Radar 전용 단축키를 제거합니다. 다른 단축키와 테마 설정은 유지합니다.
   - `home/.config/wezterm/wezterm.lua`: `Herdr Agent Icons Max` fallback을
     제거하고 기본 `Hack Nerd Font Mono`는 유지합니다.
   - `plugin-sources.txt`: `hhdebb/herdr-radar` 설치 항목을 주석 처리하고 GitHub
     URL과 plugin ID는 참고 기록으로 남깁니다.

4. 완전히 지우려면 복구가 필요 없는지 확인한 뒤 **Radar 전용** 디렉터리만
   정리합니다. `plugin uninstall`은 이 디렉터리를 지우지 않습니다. 기본 경로는
   아래와 같으며, 경로를 재정의했다면 1번의 조회 결과를 우선합니다.

   - 설정: `~/.config/herdr/plugins/config/hhdebb.herdr-radar`
   - 상태·캐시·설정 백업: `~/.local/state/herdr/plugins/hhdebb.herdr-radar`

5. 플러그인 목록에 Radar가 없는지, 설정이 유효한지, 재로딩이 성공하는지
   확인합니다. Herdr 서버를 종료할 필요는 없습니다.

   ```sh
   herdr plugin list --plugin hhdebb.herdr-radar --json
   herdr config check
   herdr server reload-config
   ```

## 스크래치 셸

`~/.config/zsh/scratch`는 기본 `~/.zprofile`과 `~/.zshrc` 대신 쓰는 경량 Zsh
프로필입니다. 사용을 중단하는 중인 Herdr의 스크래치 터미널용으로 만들었고,
[`ZSH_PERFORMANCE.md`](../ZSH_PERFORMANCE.md)에서 시작 성능의 비교 기준으로도 씁니다.
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

일반 Zsh와 scratch shell에서 `Ctrl+R`을 누르면 FZF가 shell history를
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
