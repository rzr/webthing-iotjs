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

babel: ./node_modules/.bin/babel
	cat .babelrc
	rm -rf dist
	BABEL_ENV=production ./node_modules/.bin/babel .  --experimental --source-maps-inline -d ./dist --ignore 'node_modules/**'
	rm -rf lib example *.js
	cp -rfa dist/lib lib
	cp -rfa dist/example example
	cp -a dist/*.js .

.babelrc:
	ls $@ || echo '{ "ignore": [ "node_modules/**.js" ] }' > $@
	touch $@

babel/commit: .babelrc babel/runtime/node babel/runtime/iotjs

babel/runtime/%:
	-git commit -am "WIP: babel: About to babelize for ${@F}"
	cp -av extra/${@F}/.babelrc .babelrc
	-git commit -am "WIP: babel: About to babelize for ${@F}"
	${MAKE} babel
	-git commit -am "babel: Babelized for $@"

./node_modules/.bin/babel: ./node_modules Makefile
	-git commit -am "WIP: babel: About to babelize"
	npm install @babel/cli
	npm install @babel/core
	npm install @babel/plugin-transform-arrow-functions
	npm install @babel/plugin-transform-block-scoping
	npm install @babel/plugin-transform-template-literals
	echo "TODO: npm install @babel/plugin-transform-for-of"
	echo "TODO: npm install @babel/plugin-transform-classes"
	npm install @babel/preset-env
	-git commit -am "WIP: babel: Installed tools"
