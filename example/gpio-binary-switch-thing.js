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
const {
  Property,
  SingleThing,
  Thing,
  Value,
  WebThingServer,
} = require('webthing');
const gpio = require('gpio');

function makeThing(callback) {
  const thing = new Thing('ActuatorExample',
                          'onOffSwitch',
                          'An actuator example that change pin voltage');
  thing.addProperty(
    new Property(thing,
                 'on',
                 new Value(false, (update) => {
                   console.log(`log: change: ${update}`);
                   if (typeof callback == 'function') {
                     callback(update);
                   }
                 }),
                 {
                   '@type': 'OnOffProperty',
                   label: 'On/Off',
                   type: 'boolean',
                   description: 'Whether the output is changed',
                 }));
  return thing;
}

function runServer() {
  const port = process.argv[2] ? Number(process.argv[2]) : 8888;
  const pin = process.argv[3] ? Number(process.argv[3]) : 5;
  const url = `http://localhost:${port}/properties/on`;

  console.log(`Usage:\n
${process.argv[0]} ${process.argv[1]} [port] [gpio]

Try:
curl -X PUT -H 'Content-Type: application/json' --data '{"on": true }' ${url}
`);
  var output = null;
  this.onValueChange = (value) => {
    console.log("gpio: set: "  + value);
    if (output) output.set( (value) ? 1 : 0 );
  }
  const thing = makeThing(this.onValueChange);
  const server = new WebThingServer(new SingleThing(thing), port);
  process.on('SIGINT', () => {
    server.stop();
    gpio.unexport(pin);
    process.exit();
  });

  output = gpio.export(pin, {
    direction: 'out',
    ready: () => {
      server.start();
    }});
}

runServer();
