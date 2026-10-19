#!/usr/bin/env python3
"""Link this self-contained skill into a user's skill directory without overwriting files."""

import argparse
from pathlib import Path
import sys


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--skills-dir', type=Path, default=Path.home() / '.agents/skills',
                        help='Skill discovery directory (default: ~/.agents/skills)')
    args = parser.parse_args()
    source = Path(__file__).resolve().parent
    if not (source / 'SKILL.md').is_file() or not (source / 'scripts/review_state.py').is_file():
        raise ValueError('Incomplete skill package')
    destination = args.skills_dir.expanduser().absolute() / 'omp-update'
    if destination.is_symlink() and destination.resolve() == source:
        print(f'Already installed: {destination}')
        return
    if destination.exists() or destination.is_symlink():
        raise ValueError(f'Refusing to replace existing skill: {destination}; inspect its owner first')
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.symlink_to(source, target_is_directory=True)
    print(f'Installed: {destination} -> {source}')
    print('Keep the source directory in place. No review checkpoint was initialized.')
    print('Restart/reload your agent to discover the skill. OMP must be available on PATH when reviewing.')


if __name__ == '__main__':
    try:
        main()
    except (OSError, ValueError) as error:
        print(f'omp-update install: {error}', file=sys.stderr)
        sys.exit(1)
