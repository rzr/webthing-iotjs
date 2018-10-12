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

default: all

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


help:
	@echo "## Usage: "
	@echo "# make retranspile"

all: build

setup/%:
	${@F}

node_modules: package.json
	npm install

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

build/node: setup node_modules eslint

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

${tmp_dir}/rule/test/pid/%: ${main_src} build
	@mkdir -p "${@D}"
	${@F} $< & echo $$! > "$@"
	sleep ${run_timeout}
	cat $@

test/%: ${tmp_dir}/rule/test/pid/%
	cat $<
	curl http://localhost:8888 \
 || curl -I http://localhost:8888 \
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

lint: lint/${runtime}

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

babel/run: ${babel_out_dir}
	ls $<

babel/build: babel/run
	rsync -avx ${babel_out_dir}/ ./
	@rm -rf ${babel_out_dir}

${babel_stamp_file}: ${srcs_dir}
	${MAKE} babel/build
	${babel} --version | tee ${babel_stamp_file}

babel/runtime/%: ${babel_stamp_file}
	ls $<

babel/runtime: babel/runtime/${runtime}

babel/commit/%:	git/commit/babel/build/${runtime}
	${MAKE} babel/runtime/${runtime}
	-git commit -m "${runtime}: babel: Transpiled (${@})" ${srcs_dir} ${srcs}
	-git add "${babel_stamp_file}"
	-git commit -m "${runtime}: babel: Add stamp file" "${babel_stamp_file}"

babel/commit: babel/commit/${runtime}

babel: babel/runtime
	sync

babel/done:
	ls ${babel_stamp_file} && exit 0 || echo "log: Assuming it is not transpiled yet"
	ls ${babel_stamp_file} || ${MAKE} ${@D}/commit
	ls ${babel_stamp_file}

babel/clean:
	rm -rf ${babel_out_dir}

babel/rebuild: babel/clean babel/build


transpile/revert:
	@echo "TODO: move $@ (babel) patches (2) for ${runtime} at end of list"
	-git commit -am "WIP: babel: About to $@"
	git rebase -i remotes/upstream/master
	git revert HEAD
	git revert HEAD~2

transpile: git/commit/transpile/${runtime} lint/${runtime} babel/commit

retranspile: babel/done transpile/revert
	${MAKE} transpile
	git rebase -i remotes/upstream/master


### IoT.js related rules:

setup/iotjs/devel: ${eslint} ${babel}

setup/iotjs:
	iotjs \
 || echo "log: Should have printed iotjs's usage..."
	-which iotjs

build/iotjs/devel: setup lint ${babel_stamp_file}
	echo "log: $@: $^"

build/iotjs: setup babel/done

lint/iotjs/eslint:
	if [ ! -e ${babel_stamp_file} ] ; then make eslint ; fi

lint/iotjs/babel:
	if [ -e ${babel_stamp_file} ] ; then make babel/run ; fi

lint/iotjs: lint/iotjs/eslint lint/iotjs/babel

#babel/runtime/iotjs:
#	${MAKE} babel/runtime/node
#	${MAKE} babel/runtime/iotjs

babel/runtimes: babel/runtime/iotjs babel/runtime/node
