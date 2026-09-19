# macOS 데스크톱 환경

호스트별 창 관리자, 메뉴 막대, AeroSpace, JankyBorders와 SketchyBar 운영 방법을
설명합니다. 이 문서의 저장소 경로와 명령은 모두 저장소 루트를 기준으로 합니다.

## macOS 창 관리와 메뉴 막대

데스크톱 구성은 `flake.nix`의 필수 `desktopProfile` 값으로 호스트마다 나뉩니다.
회사 Mac인 `Mac-mini`만 AeroSpace, SketchyBar, Borders를 사용하고 기존 원격
데스크톱 동작은 유지합니다. 개인 Mac인 `MacBook-Pro`는 기존 Hammerspoon과
macOS 메뉴 막대를 유지합니다.

`Mac-mini`의 창 관리는 `heecheon92/AeroSpace`의 `centered-zoom` 브랜치를
사용합니다. 이 브랜치는 upstream `v0.21.3-Beta`를 바탕으로 하며, Nix가
`v0.21.3-centered-zoom.2` 릴리스의 미리 빌드된 zip을 고정합니다. 로컬에서
Swift 소스를 빌드하는 순수 Nix 패키지는 아닙니다. 앱은
`/Applications/Nix Apps/AeroSpace.app`, CLI는
`/run/current-system/sw/bin/aerospace`에 설치됩니다. Home Manager는
`home/.config/aerospace/aerospace.toml`을 `~/.config/aerospace/aerospace.toml`로
링크합니다. 별도 `~/.aerospace.toml`을 함께 만들면 설정 경로가 충돌합니다.

`Mac-mini`에서 `./rebuild.sh`로 적용한 뒤 AeroSpace를 실행하고,
**시스템 설정 → 개인정보 보호 및 보안 → 손쉬운 사용**에서 허용합니다.
권한은 머신마다 승인하며 Git으로 복제하지 않습니다. ad-hoc 서명된 앱 바이너리가
교체되면 macOS가 손쉬운 사용 권한을 다시 요청할 수 있습니다.

기존 Homebrew 설치에서 전환할 때는 먼저 Nix 패키지 빌드를 확인한 뒤 기존
AeroSpace를 종료하고 `brew uninstall --cask aerospace`를 실행합니다.
`homebrew.onActivation.cleanup = "none"`이므로 선언에서 제거된 cask는
자동 삭제되지 않습니다. 새 앱을 실행하기 전에는 Homebrew와 Nix 버전을
동시에 실행하지 않습니다.

로그인 시 자동 실행하며 시스템 설정 창만 floating으로 둡니다. 일반 창은 AeroSpace가
tiling으로 관리하고, 창 안쪽과 화면 가장자리에 12pt 간격을 둡니다. 상단은
SketchyBar의 39pt 막대와 8pt 오프셋을 고려해 60pt를 예약합니다. 포커스가 다른 모니터로 이동하면
포인터를 옮기며, 마우스가 가리키는 창에도 포커스를 맞춥니다.
숫자·문자 persistent workspace를 유지하되 모니터별 이름이나 앱별 고정
워크스페이스는 지정하지 않습니다.

- `Option+Enter`: 홈 디렉터리에 독립된 WezTerm 인스턴스 열기.
  최소 사용자 환경으로 macOS 앱 런처를 호출하고 `--always-new-process`를 사용해,
  기존 터미널·Herdr 환경을 상속하거나 실행 중인 WezTerm 프로세스를 재사용하지 않습니다.
- `Option+B` / `Option+E`: 새 Safari 창 / Finder 열기
- `Option+S`: 시스템 설정 열기 (이미 실행 중이면 활성화)
- `Option+C`: 현재 창 닫기 (마지막 창이면 앱 종료)
- `Option+H/J/K/L`: 왼쪽/아래/위/오른쪽 창 포커스
- 위 조합에 `Shift` 추가: 창 이동
- `Option+/` / `Option+,`: tiles 방향 전환 / accordion 방향 전환
- `Option+F`: AeroSpace 전체 화면 (macOS 기본 `Ctrl+Cmd+F`와 별개)
- `Option+Shift+Z`: 현재 창을 화면 중앙의 60% × 70% 크기로 확대/복원
  (기본 애니메이션 없음, 필요하면 설정 명령에 `--animation on` 추가)
  다른 창이나 워크스페이스로 포커스를 옮겨도 중앙 확대 상태를 유지합니다.
- `Option+Shift+F`: floating/tiling 전환
- `Option+Shift+T`: 현재 워크스페이스 전체를
  floating → tiled → grid → floating 순서로 전환합니다.
  floating 창이 섞여 있으면 먼저 모두 tiled로 정리하며, 빈 워크스페이스는 변경하지 않습니다.
- `Option+1…9`: 워크스페이스의 모니터 배치를 유지한 채 해당 워크스페이스로 이동
- `Ctrl+Option+1…9`: 선택한 워크스페이스 전체를 현재 포커스된 모니터로 가져와 전환
- `Option+Shift+1…9`: 현재 창만 해당 워크스페이스로 이동
- `Option+[` / `Option+]`: 모든 모니터의 이전/다음 워크스페이스로 순환 이동;
  워크스페이스를 옮기지 않고 해당 모니터로 포커스만 이동합니다.
- `Option+Shift+[` / `Option+Shift+]`: 현재 포커스된 모니터 안에서만 이전/다음 워크스페이스로 순환 이동
  (두 방식 모두 빈 워크스페이스와 문자 이름을 포함하며 양 끝에서 순환)
- `Option+Tab`: 직전 워크스페이스로 전환
- `Option+Shift+Tab`: 현재 워크스페이스를 다음 모니터로 이동
- `Option+R`: 크기 조정 모드; `H/J/K/L`로 조정, Enter/Escape로 종료
- `Option+Shift+;`: service mode 진입

service mode에서는 `Escape`로 설정을 다시 읽고 main mode로 돌아갑니다.
`R`은 workspace 트리를 평탄화하고, `F`는 floating/tiling을 전환하며,
`Backspace`는 현재 창을 제외한 모든 창을 닫습니다. `Option+Shift+H/J/K/L`은
해당 방향의 컨테이너와 결합하며, 각 명령 뒤 main mode로 돌아갑니다.

전체 레이아웃 전환은 `home/bin/aerospace-cycle-layout`이 담당하며 Home Manager가
`~/.local/bin/aerospace-cycle-layout`로 링크합니다. 이미 관리하는 Bun 런타임을
사용하므로 별도 패키지는 필요 없습니다. 새 머신에서는 `./rebuild.sh`로 링크를 적용합니다.

tiled는 균등한 가로 타일로 정리합니다. 한 창에 집중하려면 `Option+F`를 사용합니다.
grid는 floating 창의 좌표를 조작하는 대신 실제 중첩 타일 컨테이너를 만듭니다.
창 3개는 위 1개·아래 2개, 4개는 2×2, 5개는 위 2개·아래 3개로 배치하고
행 높이와 각 행의 열 너비를 균등하게 맞춥니다. 창 순서는 전환 시작 시
AeroSpace가 반환하는 목록을 따릅니다. 각 전환은 기존 수동 그룹·크기 설정을 다시 구성합니다.

창이 1–2개이면 grid와 tiled가 비슷하게 보일 수 있습니다. 이를 구별하기 위한
마지막 단계와 창 ID/레이아웃 정보는 사용자 임시 디렉터리의
`aerospace-cycle-layout-<uid>` 아래에만 저장하며 Git으로 관리하지 않습니다.
창 구성이나 레이아웃이 바뀌어 기록과 다르면 현재 상태를 기준으로 다시 판단합니다.
빠르게 연속 입력해도 같은 워크스페이스의 변경은 순차 실행합니다.

앱이 최소 창 크기를 강제하면 실제 창이 할당된 타일보다 커져 겹칠 수 있습니다.
grid가 앱의 최소 크기를 무시하지는 못합니다. 이 경우 디스플레이의 “공간 더 보기”
배율을 사용하거나, 더 작은 창을 지원하는 앱/브라우저 버전을 사용해야 합니다.

`Mac-mini`의 WezTerm에서도 tiling과 전체 화면은 AeroSpace가 담당합니다.
공유 `home/.config/wezterm/wezterm.lua`는 개별 파일로 링크되고, rebuild가 만든
로컬 `~/.config/wezterm/host.lua`의 `aerospace` 값을 읽습니다. 이 값이 true인
호스트에서만 AeroSpace가 새 창 열기에 사용하는 `Option+Enter`의 WezTerm 기본
할당을 해제하며, 나머지 기본 단축키는 유지합니다. `host.lua`는 생성 파일이므로
직접 편집하지 않습니다. WezTerm의 simple fullscreen은 메뉴 막대를 자동 숨기므로
`Mac-mini`에서는 함께 사용하지 않습니다.

전역 키는 동일한 앱 단축키보다 우선합니다. OMP와 충돌하는 `Option+R`
(재시도), `Option+L` (화면 초기화), `Option+Shift+L` (현재 줄 복사)는 의도적으로
AeroSpace에 우선권을 줍니다. 반면 OMP의 `Option+P`, `Option+M`, `Ctrl+S`는
AeroSpace에 할당하지 않아 그대로 사용할 수 있습니다. OMP 키맵 자체는 변경하지
않습니다. 크기 조정 모드에서는 일반 `H/J/K/L` 입력도 AeroSpace가 처리하므로
작업 후 Enter/Escape로 빠져나옵니다.

설정 파일 저장 시 자동으로 다시 읽습니다. `auto-reload-config`를 처음 켠 뒤에는
`aerospace reload-config`를 한 번 실행해야 하며, 변경 전 검사는
`aerospace reload-config --dry-run --no-gui --warnings-as-errors`를 사용합니다.

`Mac-mini`의 상단은 SketchyBar로 표시하고, macOS 기본 메뉴 막대와 하단 Dock은
자동으로 숨깁니다. Apple 메뉴와 앱 메뉴는 화면 맨 위로 포인터를 올리면 나타납니다.
이 호스트에는 `configuration.nix`의 `_HIHideMenuBar = true`,
`AppleMenuBarVisibleInFullscreen = false`, `dock.autohide = true`와 관련
Spaces 설정을 적용합니다. 실행 중인 앱이 이전 전체 화면 설정을 유지하면 전체
화면을 나갔다가 다시 들어가거나 앱을 다시 실행합니다.

### AeroSpace fork 업그레이드

upstream `main`은 수정하지 않습니다. 새 버전은 `centered-zoom` 브랜치를 선택한
upstream 릴리스 태그 위로 rebase하고 테스트한 뒤, upstream 빌드 스크립트로
릴리스 zip을 만듭니다. 새 태그와 asset을 fork에 게시하고
`packages/aerospace.nix`의 version과 hash를 갱신한 다음 `./rebuild.sh`를
실행합니다. Nix가 고정한 릴리스만 설치되므로 자동 업데이트를 보장하지 않습니다.
릴리스 빌드는 upstream의 `build-release.sh --build-version VERSION --codesign-identity -`를
사용하며 Xcode와 upstream 개발 문서의 빌드 의존성이 필요합니다.
`hash`는 zip 파일 자체의 SHA-256이 아니라 `nix-prefetch-url --unpack` 결과를
`nix hash convert --hash-algo sha256 --to sri`로 변환한 unpacked 해시입니다.

### 창 테두리 (JankyBorders)

`configuration.nix`에서 Homebrew의 `felixkratz/formulae/borders`를 설치합니다.
macOS 14 이상에서 동작하며, AeroSpace의 `after-startup-command`가 로그인 후
실행합니다. 시작 주체를 하나로 유지하기 위해 `brew services start borders`는
사용하지 않습니다. 별도 `bordersrc` 없이 모양도 같은 startup 명령에서 관리합니다.

기본 모양은 둥근 8pt 테두리, HiDPI 켜짐, 활성 창은 밝은 cyan `0xff00e5ff`,
비활성 창은 `0xff494d64`입니다. 색은 `0xAARRGGBB` 형식입니다.
기존 WezTerm의 비활성 창 흐림 효과는 그대로 유지합니다.

`after-startup-command`는 AeroSpace 시작 때 실행되므로 설정 파일을 저장하거나
`reload-config`만 실행해도 테두리 옵션이 다시 적용되는 것은 아닙니다.
모양을 바꿀 때는 startup 명령의 옵션을 수정한 뒤 같은 명령을 터미널에서
실행하면 현재 프로세스에 즉시 반영됩니다:

```sh
borders style=round width=8.0 hidpi=on \
  active_color=0xff00e5ff inactive_color=0xff494d64
```

이미 실행 중이면 위 명령은 새 상주 프로세스를 만들지 않고 기존 인스턴스를
갱신합니다. 새 Mac에서는 `./rebuild.sh` 적용 후 AeroSpace를 실행하면 됩니다.

### 상태 막대 (SketchyBar)

`configuration.nix`에서 `felixkratz/formulae/sketchybar`와 공식 Homebrew cask
`font-sf-pro`를 선언하고, Home Manager가 `home/.config/sketchybar`를
`~/.config/sketchybar`로 링크합니다. 앱 아이콘에는
`sketchybar-app-font` v1.0.4를 사용하며, Home Manager가 릴리스 파일과 SHA-256을
고정해 `~/Library/Fonts/sketchybar-app-font.ttf`에 배치합니다. SketchyBar의
텍스트에는 SF Pro 패밀리의 Regular, Bold, Semibold, Heavy, Black, Light Italic을 사용합니다.

설정은 `FelixKratz/dotfiles`의
`e6288b3f4220ca1ac64a68e60fced2d4c3e3e20b` 커밋
(`.config/sketchybar` tree
`d9d2805845488c1cad2d38dddb0279cd7ed9a121`)을 기준으로 저장소에 가져온 뒤
AeroSpace와 이 dotfiles 실행 환경에 맞게 수정한 스냅샷입니다. 활성화할 때 upstream
최신 파일을 다시 받지 않습니다. 막대는 모든 디스플레이 상단에 높이 39px,
`y_offset=8`, 바깥 여백 10px로 표시하고, 둥근 9px 모서리와 blur 20을 사용합니다.
AeroSpace의 상단 바깥 간격은 이 배치에 맞춰 60pt로 유지합니다.

왼쪽에는 AeroSpace 워크스페이스, 앱 아이콘과 현재 앱을 표시하고 오른쪽에는
캘린더, Homebrew 업데이트, GitHub 알림, 배터리, 음량과 CPU 상태를 표시합니다.
숫자 1–9는 항상 만들며, 그 밖의 워크스페이스는 포커스되었거나 창이 있을 때만
표시합니다. 선택한 워크스페이스는 강조하고 왼쪽 클릭은
`aerospace workspace`로 전환합니다. macOS Spaces나 yabai의 생성·삭제 이벤트 및
layout 상태를 흉내 내지 않고, `aerospace_workspace_change` 이벤트와 2초 간격의
`aerospace list-workspaces`/`list-windows` 조회로 AeroSpace 상태를 반영합니다.

설정 원본은 `home/.config/sketchybar/sketchybarrc`이며 `items/*.sh`가 항목을,
`plugins/*.sh`가 동작을 정의합니다. upstream의 C helper 소스도
`helper/`에 추적합니다. 막대를 읽을 때 Xcode Command Line Tools의 `clang`으로
`~/Library/Caches/sketchybar/helper/helper`를 만들고, 소스 SHA-256이 바뀔 때만
다시 컴파일합니다. 실행 중 helper를 교체할 때는 기록한 PID와 명령을 확인해 해당
프로세스만 종료하므로 다른 helper나 macOS OSD를 포괄적으로 종료하지 않습니다.
따라서 새 Mac에는 Xcode Command Line Tools가 필요하지만 helper 바이너리를
저장소에 커밋할 필요는 없습니다.

다음 연동은 선택 사항이며 이 SketchyBar 설정이 패키지나 자격 증명을 설치하지
않습니다.

- GitHub 항목은 `gh`, Nix로 이미 관리하는 `jq`, 유효한 `gh` 로그인이 모두 있을
  때 알림 API를 조회합니다. 새 Mac의 인증은 필요할 때 `gh auth login`으로 로컬에
  저장하며 저장소에는 복제하지 않습니다. `gh`가 없거나 인증/API 호출이 실패하면
  회색 `–`를 표시합니다.
- Spotify 앱은 선언하지 않습니다. 설치되지 않았거나 실행 중이 아니면 중앙 항목과
  팝업은 숨겨지고, 백그라운드 갱신이나 강제 갱신이 Spotify를 실행하지 않습니다.
  실행 중 항목에서 앨범 커버를 명시적으로 클릭할 때만 앱을 열 수 있습니다.
  재생 제어를 처음 사용하면 macOS가 Spotify 제어를 위한 **자동화** 권한을 요청할
  수 있으며, 이 승인은 Mac마다 로컬에서 처리합니다.
- `SwitchAudioSource`도 선언하지 않습니다. 없으면 음량의 오른쪽 클릭 또는
  Shift+클릭 장치 선택은 아무 작업도 하지 않으며, 기본 음량 표시와 슬라이더는
  계속 동작합니다.

GitHub 알림과 Homebrew 업데이트 확인, Spotify 앨범 아트에는 각각의 네트워크
접근이 필요합니다. 네트워크 실패는 해당 선택 항목의 정보만 제한합니다.

AeroSpace의 `after-startup-command`가 SketchyBar를 실행하므로 별도
`brew services start sketchybar`는 사용하지 않습니다. 로그인으로 실행한 앱은
셸의 Nix 환경을 상속하지 않으므로 `aerospace.toml`은 Nix 시스템·Homebrew 경로를
전달하고, `sketchybarrc`와 각 플러그인은 `environment.sh`를 읽어 Nix 사용자
프로필 경로까지 포함한 PATH를 설정합니다. 변경 후에는 `sketchybar --reload`로
설정을 다시 읽습니다.
AeroSpace가 전달하는 프로세스 시작 환경 자체를 변경한 경우에는
SketchyBar를 종료한 뒤 AeroSpace를 다시 실행하거나 다음 로그인에서 적용합니다.

`sketchybar --hotload on`으로 설정 변경을 감시합니다. 수동으로 다시 읽으려면:

```sh
sketchybar --reload
```

`Mac-mini`에서는 다른 dotfiles 구성과 동일하게 `./rebuild.sh`를 실행하고
AeroSpace를 실행합니다. SketchyBar는 **디스플레이마다 개별 Spaces**가 켜져
있어야 하므로 이 프로필만 `com.apple.spaces`의 `spans-displays = false`를
관리합니다. 이 설정을 이전에 꺼 두었다면 적용 후 로그아웃·로그인이 필요할 수
있습니다. 기본 메뉴 막대는 삭제되지 않으며 화면 위쪽에 포인터를 올려 계속 사용할
수 있습니다.
