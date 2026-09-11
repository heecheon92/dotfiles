#!/bin/bash

profile_user=${USER:-$(/usr/bin/id -un)}
export PATH="/etc/profiles/per-user/$profile_user/bin:/run/current-system/sw/bin:/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/usr/local/sbin:/usr/bin:/bin:/usr/sbin:/sbin"
