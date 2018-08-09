#!/bin/echo docker build . -f
# -*- coding: utf-8 -*-
# SPDX-License-Identifier: MPL-2.0
#{
# Copyright: 2018-present Samsung Electronics France SAS, and other contributors
#
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.*
#}

FROM ubuntu:18.04
MAINTAINER Philippe Coval (p.coval@samsung.com)

ENV DEBIAN_FRONTEND noninteractive
ENV LC_ALL en_US.UTF-8
ENV LANG ${LC_ALL}

RUN echo "#log: Configuring locales" \
  && set -x \
  && apt-get update -y \
  && apt-get install -y locales \
  && echo "${LC_ALL} UTF-8" | tee /etc/locale.gen \
  && locale-gen ${LC_ALL} \
  && dpkg-reconfigure locales \
  && sync

ENV project webthing-node

RUN echo "#log: ${project}: Setup system" \
  && set -x \
  && apt-get update -y \
  && apt-get install -y npm \
  && apt-get clean \
  && sync

ADD . /usr/local/${project}/${project}
WORKDIR /usr/local/${project}/${project}
RUN echo "#log: ${project}: Preparing sources" \
  && set -x \
  && which npm \
  && npm --version \
  && npm install \
  && npm run lint \
  && npm run test || echo "TODO: check package.json" \
  && sync

EXPOSE 8888
WORKDIR /usr/local/${project}/${project}
CMD [ "/usr/bin/npm" "run" "start"]
