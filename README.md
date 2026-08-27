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
- Pi의 모델, 테마, 스킬 및 확장 패키지 기본 설정

비밀번호, API 키, 인증 토큰, 회사 전용 정보처럼 외부에 공유하면 안
되는 값은 이 저장소에 포함하지 않는 것을 원칙으로 합니다. 이러한
정보는 각 Mac에서 별도로 관리합니다.

## 공유 에이전트 스킬

이 저장소에서 관리하는 에이전트 스킬 목록과 개별 설치 방법은
[`home/.agents/skills/README.md`](./home/.agents/skills/README.md)를
참고하세요. 전체 dotfiles 구성을 적용하지 않아도 원하는 스킬 디렉터리만
에이전트 또는 Codex 기본 설치 도구로 설치할 수 있습니다.

## 터미널 전역 단축키

Hammerspoon은 `home/.hammerspoon/init.lua`에서 물리 키 코드 기반
`Ctrl+\`` 전역 단축키를 관리합니다. 실행 중인 WezTerm이 앞에 있으면 숨기고,
뒤에 있으면 주 창을 마우스 포인터가 있는 화면 중앙으로 옮긴 뒤 모든 창을
앞으로 가져옵니다. WezTerm이 종료된 상태에서는 새로 실행하지 않습니다. 새
Mac에서는 Hammerspoon에 macOS 손쉬운 사용 권한을 한 번 허용해야 합니다.
WezTerm 창은 크기가 바뀔 때 현재 화면의 중앙으로 다시 배치됩니다.

iTerm의 기존 Hotkey Window 프로필은
`home/.config/iterm2/hotkey-window.json`에서 Dynamic Profile로 계속 관리하며,
보조 터미널 단축키로 `Ctrl+Option+\``를 사용합니다. Home Manager가 iTerm의
`DynamicProfiles` 디렉터리와 Hammerspoon 설정을 링크하며, 변경은
`./rebuild.sh`로 적용합니다. 왼쪽 Option은 `Esc+`, 오른쪽 Option은 `Normal`로
유지합니다.

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

Codex 사용량을 아껴야 할 때는 `omp-budget`으로 OMP를 실행합니다. 이 명령은
기본 설정과 인증·세션 상태는 그대로 공유하면서
`home/.omp/agent/config-budget.yml`의 저비용 모델 역할과 fallback만 현재
프로세스에 덮어씁니다. 일반 `omp` 실행은 기존 고성능 모델 구성을 유지합니다.

```bash
omp-budget
```

기본 대화 모델은 Sol medium을 유지하고, smol·slow·vision·commit·task 역할은
Luna, plan 역할은 Terra, advisor 역할은 Sol high를 사용합니다. fallback에는
Sol을 넣지 않아 지원 역할이 예기치 않게 고비용 모델로 복귀하지 않습니다.

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
