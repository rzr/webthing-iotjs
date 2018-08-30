// -*- mode: js; js-indent-level:2;  -*-
// SPDX-License-Identifier: MPL-2.0

/**
 * Reimplimentation of Express API for IoT.js
 *
 * Copyright 2018-present Samsung Electronics France SAS, and other contributors
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.*
 */
function Express() {
  const _this = this;

  this.routes = {
    GET: {},
    PUT: {}
  };

  this.extendsServerResponse = function (res) {
    if (!res.json) {
      res.json = function (object) {
        return res.end(JSON.stringify(object));
      };
    }

    return res;
  };

  this.receive = function (incoming, callback) {
    let data = '';
    incoming.on('data', function (chunk) {
      data += chunk;
    });
    incoming.on('end', function () {
      incoming.body = JSON.parse(data);

      if (!incoming.params) {
        incoming.params = {};
      }

      if (!incoming.params.propertyName) {
        incoming.params.thingId = 0;
        incoming.params.propertyName = Object.keys(incoming.body)[incoming.params.thingId];
      }

      callback ? callback(incoming) : '';
    });
  };

  this.parse = function (req, pattern) {
    if (req.url.split('/').length != pattern.split('/').length) {
      return false;
    }

    const result = {};
    let re = /:[^/]+/g;
    const ids = pattern.match(re);
    re = pattern.replace('/', '\/');
    re = `^${re}$`;

    for (let id in ids) {
      id = ids[id];
      re = re.replace(id, '([^/]+)');
    }

    re = new RegExp(re, 'g');

    if (!req.url.match(re)) {
      return false;
    }

    for (const idx in ids) {
      const value = req.url.replace(re, `$${Number(idx) + 1}`);

      if (value) {
        result[ids[idx].substring(1)] = value;
      }
    }

    req.params = result;

    if (ids && Object.keys(result) && Object.keys(result).length != ids.length) {
      return false;
    }

    return true;
  };

  this.handlePut = function (req, res, pattern, callback) {
    if (req.method !== 'PUT') {
      return;
    }

    if (this.parse(req, pattern)) {
      res = this.extendsServerResponse(res);

      if (callback) {
        callback(req, res);
      }
    }
  };

  this.handleRequest = function (req, res, pattern, callback) {
    if (req.method === 'PUT') {
      this.receive(req, function (req) {
        _this.handlePut(req, res, pattern, callback);
      });
    } else if (req.method === 'GET') {
      if (this.parse(req, pattern)) {
        res = this.extendsServerResponse(res);

        if (callback) {
          callback(req, res);
        }
      }
    }
  };

  this.get = function (pattern, callback) {
    _this.routes.GET[pattern] = callback;
  };

  this.put = function (pattern, callback) {
    _this.routes.PUT[pattern] = callback;
  };

  this.request = function (req, res) {
    req.params = {};

    for (const pattern in _this.routes[req.method]) {
      const callback = _this.routes[req.method][pattern];

      _this.handleRequest(req, res, pattern, callback);
    }
  };
}

module.exports = function express() {
  return new Express();
};