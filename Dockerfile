#!/bin/echo docker build . -f
# -*- coding: utf-8 -*-
# SPDX-License-Identifier: MPL-2.0
#{
# Copyright: 2018-present Samsung Electronics France SAS, and other contributors
#
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/ .
#}

FROM rzrfreefr/iotjs-express:v0.0.11
LABEL maintainer="Philippe Coval (rzr@users.sf.net)"

ENV DEBIAN_FRONTEND noninteractive
ENV LC_ALL en_US.UTF-8
ENV LANG ${LC_ALL}

ENV project webthing-iotjs
COPY . /usr/local/${project}/${project}
WORKDIR /usr/local/${project}/${project}
RUN echo "#log: ${project}: Preparing sources" \
  && set -x \
  && make setup \
  && make \
  && make check \
  && make test \
  && sync

EXPOSE 8888
WORKDIR /usr/local/${project}/${project}
ENTRYPOINT [ "/usr/bin/make" ]
CMD [ "start" ]
