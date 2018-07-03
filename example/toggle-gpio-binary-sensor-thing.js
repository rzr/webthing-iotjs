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
var gpio = require('gpio');
var Gpio = require('onoff').Gpio;

function makeThing() {
  var thing = new Thing('ToggleGpioBinarySensorExample',
                        'binarySensor',
                        'A sensor example that monitor GPIO input ie: button');
  thing.value = new Value(false);
  thing.addProperty(
    new Property(thing,
                 'on',
                 thing.value,
                 {
                   '@type': 'OnOffProperty',
                   label: 'On/Off',
                   type: 'boolean',
                   description: 'Whether the input is changed'
                 }));
  return thing;
}

function runServer() {
  const port = process.argv[2] ? Number(process.argv[2]) : 8888;
  const pin = process.argv[3] ? Number(process.argv[3]) : 23;
  const url = `http://localhost:${port}/properties/on`;

  console.log(`Usage:\n
${process.argv[0]} ${process.argv[1]} [port] [gpio]

Try:
curl -H 'Content-Type: application/json' ${url}
`);
  const thing = makeThing();
  const server = new WebThingServer(new SingleThing(thing), port);
  const input = new Gpio(pin, 'in', 'rising');
  const delay = 5000; //TODO: update if needed 42 is a good value too
  var lastOnDate;

  process.on('SIGINT', function(){
    server.stop();
    input.unexport();
    process.exit();
  });

  input.watch(function (err, value) {
    if (err) throw err;
    if (!lastOnDate) {
      console.log(`log: GPIO${pin}: ready: ${value}`);
      lastOnDate = new Date();
      return server.start();
    }
    var now = new Date();
    var elapsed = (now - lastOnDate);
    console.log(`log: GPIO${pin}: change: ${value} (+${elapsed}ms - ${delay}ms)`);
    if (value && (elapsed >= delay))
    {
      var toggle = !thing.value.get();
      console.log(`log: GPIO${pin}: toggle: ${toggle}`);
      thing.value.notifyOfExternalUpdate(toggle);
      lastOnDate = now;
    }
  });
}

runServer();
