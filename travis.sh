#!/bin/bash -e
set -x

make lint
make build
make check
make test
