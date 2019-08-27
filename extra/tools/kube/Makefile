#! /usr/bin/make -f
# -*- makefile -*-
# ex: set tabstop=4 noexpandtab:
# Copyright: 2019-present Samsung Electronics Co., Ltd. and other contributors
# SPDX-License-Identifier: MPL-2.0

name?=webthing-iotjs

${name}.yml: deployment.yml service.yml Makefile
	@echo '#YAML' > $@
	@echo '---'  >> $@
	cat deployment.yml >> $@
	@echo '---'  >> $@
	cat service.yml >> $@
	@echo '---'  >> $@
