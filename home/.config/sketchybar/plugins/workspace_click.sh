#!/usr/bin/env bash

sid=${NAME#space.}
[ -n "$sid" ] && aerospace workspace "$sid"
