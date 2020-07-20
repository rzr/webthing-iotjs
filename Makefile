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

default: help all

tmp_dir ?= tmp
runtime ?= iotjs
export runtime
eslint ?= node_modules/eslint/bin/eslint.js
babel ?= ./node_modules/.bin/babel
babelrc ?= ${CURDIR}/extra/${runtime}/.babelrc
babel_stamp_file += ${CURDIR}/extra/${runtime}/babel.txt
babel_out_dir ?= tmp/babel/runtime/${runtime}/dist
srcs_dir ?= lib example
srcs ?= $(wildcard *.js lib/*.js | sort | uniq)
run_args ?=
run_timeout ?= 10

main_src ?= example/multiple-things.js
NODE_PATH := .:${NODE_PATH}
export NODE_PATH


port?=8888
url?=http://localhost:${port}

help:
	@echo "## Usage: "
	@echo "# make start # To start default application"
	@echo "# make test # To test default application"

all: build

setup/%:
	${@F}

node_modules: package.json
	npm install

modules: ${runtime}_modules
	ls $<

package-lock.json: package.json
	rm -fv "$@"
	npm install
	ls "$@"

setup/node: node_modules
	@echo "NODE_PATH=$${NODE_PATH}"
	node --version
	npm --version

setup: setup/${runtime}

build/%: setup
	@echo "log: $@: $^"

build/node: setup node_modules

build: build/${runtime}

run/%: ${main_src} build
	${@F} $< ${run_args}

run/npm: ${main_src} setup
	npm start

run: run/${runtime}

clean:
	rm -rf ${tmp_dir}

cleanall: clean
	rm -f *~

distclean: cleanall
	rm -rf node_modules

${tmp_dir}/rule/test/pid/%: ${main_src} build modules
	@mkdir -p "${@D}"
	${@F} $< & echo $$! > "$@"
	sleep ${run_timeout}
	cat $@

test/%: ${tmp_dir}/rule/test/pid/%
	cat $<
	curl ${url} || curl -I ${url}
	@echo ""
	curl --fail ${url}/0/properties
	@echo ""
	curl --fail ${url}/1/properties
	@echo ""
	kill $$(cat $<) ||:
	kill -9 $$(cat $<) ||:

test/npm: package.json
	npm test

test: test/${runtime}

start: run

start/board/%: example/platform/Makefile example/platform/board/%.js
	${MAKE} -C ${<D} board/${@F}

check/%: ${srcs}
	${MAKE} setup
	@echo "log: SHELL=$${SHELL}"
	status=0 ; \
 for src in $^; do \
 echo "log: check: $${src}: ($@)" ; \
 ${@F} $${src} \
 && echo "log: check: $${src}: OK" \
 || status=1 ; \
 done ; \
	exit $${status}

check/npm:
	npm run lint

check: check/${runtime}

git/commit/%:
	-git commit -am "${runtime}: WIP: About to do something (${@})"

eslint: .eslintrc.js ${eslint}
	@rm -rf tmp/dist
	${eslint} --no-color --fix . ||:
	${eslint} --no-color .
	git diff --exit-code

eslint/setup: node_modules
	ls ${eslint} || npm install eslint-plugin-node eslint
	${eslint} --version

${eslint}:
	ls $@ || make eslint/setup
	touch $@

.eslintrc.js: ${eslint}
	ls $@ || $< --init

lint/%: eslint
	sync

lint: lint/${runtime}
	sync

### Babel
#	

babel/setup: Makefile
	ls node_modules || ${MAKE} node_modules
	-git commit -am "WIP: babel: About to setup"
	npm install @babel/cli
	npm install @babel/core
	npm install @babel/plugin-transform-arrow-functions
	npm install @babel/plugin-transform-block-scoping
	npm install @babel/plugin-transform-template-literals
	@echo "TODO: npm install @babel/plugin-transform-for-of"
	@echo "TODO: npm install @babel/plugin-transform-classes"
	npm install @babel/preset-env
	-git commit -am "WIP: babel: Installed tools"

${babel}:
	ls $@ || ${MAKE} babel/setup

${babelrc}: ${babel}
	ls $@ || echo '{ "ignore": [ "node_modules/**.js" ] }' > $@
	cat $@

${babel_out_dir}: ${babelrc} ${babel}
	${babel} \
 --no-babelrc \
 --config-file "$<" \
 --delete-dir-on-start \
 --ignore 'node_modules/**,dist/**' \
 -d "${CURDIR}/$@/" \
 --verbose \
 .
	ls ${babel_out_dir}

babel/build: ${babel_out_dir}
	rsync -avx $</ ./
	@rm -rf $<

${babel_stamp_file}: ${srcs_dir}
	${MAKE} babel/build
	${babel} --version | tee ${babel_stamp_file}

babel/runtime/%: ${babel_stamp_file}
	ls $<

babel/commit/%:	git/commit/babel/build/${runtime}
	${MAKE} babel/runtime/${runtime}
	-git commit -m "${runtime}: babel: Transpiled (${@})" ${srcs_dir} ${srcs}
	-git add "${babel_stamp_file}"
	-git commit -m "${runtime}: babel: Add stamp file" "${babel_stamp_file}"

babel: babel/commit/${runtime}
	sync

babel/done:
	ls ${babel_stamp_file} && exit 0 || echo "log: Assuming it is not transpiled yet"
	ls ${babel_stamp_file} || ${MAKE} ${@D}
	ls ${babel_stamp_file}

babel/clean:
	rm -rf ${babel_out_dir}

babel/rebuild: babel/clean babel/build


transpile/revert:
	@echo "TODO: move $@ patch and ${runtime} port at end of list"
	-git commit -am "WIP: babel: About to $@"
	git rebase -i remotes/upstream/master
	git revert HEAD
	git revert HEAD~2

lint/eslint:
	if [ ! -e ${babel_stamp_file} ] ; then make eslint ; fi

lint/babel:
	if [ -e ${babel_stamp_file} ] ; then make babel ; fi

transpile: git/commit/transpile/${runtime} lint babel

retranspile: babel/done transpile/revert eslint babel
	git rebase -i remotes/upstream/master

### IoT.js related rules:

setup/iotjs:
	iotjs \
 || echo "log: Should have printed iotjs's usage..."
	-which iotjs

build/iotjs: setup ${babel_stamp_file}
	echo "log: $@: $^"

lint/iotjs: lint/eslint lint/babel

#babel/runtime/iotjs:
#	${MAKE} babel/runtime/node
#	${MAKE} babel/runtime/iotjs

babel/runtimes: babel/runtime/iotjs babel/runtime/node
	-sync
