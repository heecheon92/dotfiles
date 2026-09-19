# 동기화 가능한 개인 개발 환경

여러 Mac에서 Nix, nix-darwin, Home Manager와 Homebrew로 같은 개발 환경을
재현하고 유지하는 개인용 dotfiles 저장소입니다. macOS 기본 설정, CLI 도구,
Zsh·Starship, 터미널, Neovim과 에이전트 설정을 Git으로 동기화합니다.

> [!IMPORTANT]
> 비밀번호, API 키, 인증 토큰, 회사 전용 정보는 저장소에 넣지 않습니다.
> 인증과 머신 로컬 상태는 각 Mac에서 별도로 관리합니다.

## 호스트 경계

| 호스트 | 용도 | 데스크톱 프로필 | Homebrew |
| --- | --- | --- | --- |
| `Mac-mini` | 회사 Mac | AeroSpace + SketchyBar + JankyBorders | 기존 설치 유지 |
| `MacBook-Pro` | 개인 Mac | Hammerspoon + macOS 메뉴 막대 | nix-homebrew로 관리 |

`flake.nix`의 필수 `desktopProfile`이 두 구성을 분리합니다. `MacBook-Pro`에는
기존 Hammerspoon 설정과 전체 화면에서도 보이는 macOS 메뉴 막대를 유지하며,
AeroSpace·SketchyBar·JankyBorders를 적용하지 않습니다. `Mac-mini`에는 반대
구성을 적용하고 기존 원격 데스크톱 소프트웨어를 유지합니다. 두 데스크톱 스택을
한 호스트에 함께 적용하지 마세요.

## 빠른 시작

먼저 현재 Mac의 사용자, 호스트 이름과 아키텍처를 확인합니다.

```bash
whoami
scutil --get LocalHostName
uname -m
```

> [!WARNING]
> `flake.nix`에 `LocalHostName`과 정확히 같은 `darwinConfiguration`이 없는 Mac에서는
> `./rebuild.sh`를 실행하지 마세요. 새 호스트 추가와 최초 Nix/nix-darwin 설치는
> [동기화 가이드](./SYNC_GUIDE.md)를 먼저 따르세요.

저장소를 받은 뒤 안정적인 경로를 만들고, 이미 부트스트랩된 호스트에 현재
프로필을 적용합니다.

```bash
git clone <private-repository-url> ~/Git/dotfiles
cd ~/Git/dotfiles
ln -sfn "$(pwd -P)" "$HOME/.dotfiles"
./rebuild.sh
```

`rebuild.sh`는 현재 `LocalHostName`에 맞는 프로필을 선택하고, 현재 사용자로 Git이
추적하는 flake 스냅샷을 Nix store에 고정한 뒤 관리자 권한으로 활성화합니다.
새 Nix 파일은 먼저 `git add`로 추적 대상에 포함해야 합니다.

## 문서

- [동기화, 최초 설치, 복구](./SYNC_GUIDE.md)
- [Neovim 편집 환경](./docs/editor.md)
- [macOS 데스크톱 환경](./docs/desktop.md)
- [터미널, Herdr와 셸](./docs/terminals-herdr.md)
- [에이전트와 보조 도구](./docs/agents.md)
- [Zsh 시작 성능 운영 가이드](./ZSH_PERFORMANCE.md)
- [공유 에이전트 스킬 카탈로그](./home/.agents/skills/README.md)

문서에 적힌 `home/...`, `packages/...`, `flake.nix` 같은 경로와
`./rebuild.sh` 같은 명령은 별도 표기가 없으면 **저장소 루트 기준**입니다.
`~/.config/...`와 `~/.local/...` 경로는 각 Mac의 로컬 상태입니다.

## 주요 관리 영역

- **시스템**: Nix 패키지, nix-darwin의 macOS 설정, Homebrew formula/cask
- **셸**: Home Manager 기반 Zsh·Starship, FNM/NVM/Conda 지연 로딩, FZF 기록 검색
- **편집기**: Neovim 0.12 내장 LSP·완성, `conform.nvim`, Jupyter 노트북
- **터미널**: WezTerm, iTerm2 Dynamic Profile, 호스트별 전역 단축키
- **에이전트**: Pi·OMP 설정, 공유 스킬, Herdr 통합과 Radar 로컬 상태

## 일반 동기화

```bash
cd ~/.dotfiles
git status --short
git pull --ff-only
nix flake check --no-build
./rebuild.sh
```

로컬 변경 때문에 `git pull --ff-only`가 거부되면 강제로 덮어쓰지 말고 변경을
검토해 커밋하거나 의도적으로 stash합니다. 적용 후에는 관련 동작과 diff를
검토하고, 민감한 파일이 포함되지 않았을 때만 명시적인 파일 이름으로 커밋합니다.
