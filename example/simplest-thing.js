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
let webthing;

try {
  webthing = require('../webthing');
} catch (err) {
  webthing = require('webthing-iotjs');
}

const Property = webthing.Property;
const SingleThing = webthing.SingleThing;
const Thing = webthing.Thing;
const Value = webthing.Value;
const WebThingServer = webthing.WebThingServer;

function makeThing() {
  const thing = new Thing('urn:dev:ops:my-actuator-1234', 'ActuatorExample', ['OnOffSwitch'], 'An actuator example that just log');
  thing.addProperty(new Property(thing, 'on', new Value(true, function(update) {
    return console.log('change: '.concat(update));
  }), {
    '@type': 'OnOffProperty',
    title: 'On/Off',
    type: 'boolean',
    description: 'Whether the output is changed',
  }));
  return thing;
}

function runServer() {
  const port = process.argv[2] ? Number(process.argv[2]) : 8888;
  const hostname = process.argv[3] ? String(process.argv[3]) : null;
  const sslOptions = process.argv[4] ? String(process.argv[4]) : null;
  const url = ''.concat(sslOptions ? 'https' : 'http', '://localhost:').concat(port, '/properties/on');
  console.log('Usage:\n\n'.concat(process.argv[0], ' ').concat(process.argv[1], ' [port]\n\nTry:\ncurl -X PUT -H \'Content-Type: application/json\' --data \'{"on": true }\' ').concat(url, '\n'));
  const thing = makeThing();
  const server = new WebThingServer(new SingleThing(thing), port, hostname, sslOptions);
  process.on('SIGINT', function() {
    server.stop();
    process.exit();
  });
  server.start();
}

runServer();
