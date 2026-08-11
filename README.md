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

## Herdr 스크래치 셸

Herdr에서 `prefix+t`를 누르면 기본 `~/.zprofile`과 `~/.zshrc` 대신
`~/.config/zsh/scratch`의 경량 Zsh 프로필을 사용하는 팝업 터미널을 엽니다.
일반 터미널의 전체 개발 환경은 그대로 유지하며, 스크래치 셸에서는 NVM과
Conda를 처음 호출할 때만 초기화합니다. 프로필 원본은
`home/.config/zsh/scratch`에서 관리하고 Home Manager가 링크합니다.
일반 셸과 스크래치 셸은 OMP 상태 표시줄의 구성을 본뜬 공통 Starship
프롬프트를 사용해 호스트, 현재 디렉터리, Git 상태와 명령 실행 시간을 표시합니다.

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
