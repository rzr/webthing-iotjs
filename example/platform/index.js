// -*- mode: js; js-indent-level:2;  -*-
// SPDX-License-Identifier: MPL-2.0

/**
 *
 * Copyright 2018-present Samsung Electronics France SAS, and other contributors
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.*
 */
var console = require('console'); // TODO: disable logs here by editing to '!console.log'


var log = console.log || function () {};

var webthing;

try {
  webthing = require('../../webthing');
} catch (err) {
  webthing = require('webthing');
}

var WebThingServer = webthing.server.WebThingServer;
var SingleThing = webthing.server.SingleThing; // Update with different board here if needed

var board = 'artik530';

if (process.iotjs && process.iotjs.board) {
  board = process.iotjs.board;
}

if (process.argv.length > 2) {
  board = String(process.argv[2]);
}

log("log: board: ".concat(board, ": Loading"));

var BoardThing = require("./board/".concat(board));

function runServer() {
  var port = process.argv[3] ? Number(process.argv[3]) : 8888;
  var url = "http://localhost:".concat(port);
  log("Usage:\n".concat(process.argv[0], " ").concat(process.argv[1], " [board] [port]\nTry:\ncurl -H \"Accept: application/json\" ").concat(url, "\n"));
  var thing = new BoardThing();
  var server = new WebThingServer(new SingleThing(thing), port);
  process.on('SIGINT', function () {
    server.stop();
    thing && thing.close();
    log("log: board: ".concat(board, ": Stopped"));
    process.exit();
  });
  server.start();
  log("log: board: ".concat(board, ": Started"));
}

runServer();