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
var webthing;

try {
  webthing = require('../webthing');
} catch (err) {
  webthing = require('webthing');
}

var Property = webthing.Property;
var SingleThing = webthing.server.SingleThing;
var Thing = webthing.Thing;
var Value = webthing.Value;
var WebThingServer = webthing.server.WebThingServer;

function makeThing() {
  var thing = new Thing('ActuatorExample', ['OnOffSwitch'], 'An actuator example that just log');
  thing.addProperty(new Property(thing, 'on', new Value(true, function (update) {
    return console.log("change: ".concat(update));
  }), {
    '@type': 'OnOffProperty',
    label: 'On/Off',
    type: 'boolean',
    description: 'Whether the output is changed'
  }));
  return thing;
}

function runServer() {
  var port = process.argv[2] ? Number(process.argv[2]) : 8888;
  var url = "http://localhost:".concat(port, "/properties/on");
  console.log("Usage:\n\n".concat(process.argv[0], " ").concat(process.argv[1], " [port]\n\nTry:\ncurl -X PUT -H 'Content-Type: application/json' --data '{\"on\": true }' ").concat(url, "\n"));
  var thing = makeThing();
  var server = new WebThingServer(new SingleThing(thing), port);
  process.on('SIGINT', function () {
    server.stop();
    process.exit();
  });
  server.start();
}

runServer();