#!/bin/make -f
# -*- makefile -*-
# SPDX-License-Identifier: MPL-2.0
#{
# Copyright 2018-present Samsung Electronics France SAS, and other contributors
#
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.*
#}

srcs ?= $(wildcard lib/*.js | sort )
main_src ?= example/multiple-things.js
runtime ?= node
run_args ?=

default: check

run/%: ${main_src}
	${@F} $< ${run_args}

run/node: ${main_src}  package.json node_modules
	npm start

run: run/${runtime}

check/%: ${srcs}
	status=0 ; \
 for src in $^; do \
 echo "log: check: $${src}: ($@)" ; \
 ${@F} $${src} \
 && echo "log: check: $${src}: OK" \
 || status=1 ; \
 done ; \
	exit $${status}


check/node:
	npm lint

check: check/${runtime}


eslint: .eslintrc.js
	eslint --no-color --fix .
	eslint --no-color .

.eslintrc.js:
	-which eslint || npm install
	-which eslint || echo "# TODO: npm install eslint-plugin-node eslint"
	eslint --init

test/%: ${main_src}
	${@f} $< & pid=$$!
	sleep 10
	curl http://localhost:8888
	kill $$pid


test/node:
	npm test || echo "TODO:"

test: test/${runtime}

node_modules: package.json
	npm install
	mkdir -p $@

package.json:
	npm init

setup/node: package.json
	node --version
	npm --version
	npm install

setup: setup/${runtime}

