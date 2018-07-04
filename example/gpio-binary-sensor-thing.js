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

function makeThing() {
  const thing = new Thing('GpioBinarySensorExample',
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
  const pin = process.argv[3] ? Number(process.argv[3]) : 11;
  const url = `http://localhost:${port}/properties/on`;

  console.log(`Usage:\n
${process.argv[0]} ${process.argv[1]} [port] [gpio]

Try:
curl -H 'Content-Type: application/json' ${url}
`);

  const thing = makeThing();
  const server = new WebThingServer(new SingleThing(thing), port);
  process.on('SIGINT', () => {
    server.stop();
    gpio.unexport(pin);
    process.exit();
  });
  const input = gpio.export(pin, {
    direction: 'in',
    ready: () => {
      input.value = undefined;
      input._get((value) => {
        console.log(`log: GPIO${pin}: ready: ${value}`);
        input.on("change", (value) => {
          console.log(`log: GPIO${pin}: change: ${value}`);
          thing.value.notifyOfExternalUpdate(Boolean(value));
        });
        server.start();
        thing.value.notifyOfExternalUpdate(Boolean(value));
      });
    }
  });
}

runServer();
