// -*- mode: js; js-indent-level:2;  -*-
// SPDX-License-Identifier: MPL-2.0
var webthing;

try {
  webthing = require('../webthing');
} catch (err) {
  webthing = require('webthing-iotjs');
}

var Property = webthing.Property;
var SingleThing = webthing.SingleThing;
var Thing = webthing.Thing;
var Value = webthing.Value;
var WebThingServer = webthing.WebThingServer;

function makeThing() {
  var thing = new Thing('urn:dev:ops:my-lamp-1234', 'My Lamp', ['OnOffSwitch', 'Light'], 'A web connected lamp');
  thing.addProperty(new Property(thing, 'on', new Value(true), {
    '@type': 'OnOffProperty',
    title: 'On/Off',
    type: 'boolean',
    description: 'Whether the lamp is turned on'
  }));
  thing.addProperty(new Property(thing, 'brightness', new Value(50), {
    '@type': 'BrightnessProperty',
    title: 'Brightness',
    type: 'integer',
    description: 'The level of light from 0-100',
    minimum: 0,
    maximum: 100,
    unit: 'percent'
  }));
  return thing;
}

function runServer() {
  var thing = makeThing(); // If adding more than one thing, use MultipleThings() with a name.
  // In the single thing case, the thing's name will be broadcast.

  var server = new WebThingServer(new SingleThing(thing), 8888);
  process.on('SIGINT', function () {
    server.stop();
    process.exit();
  });
  server.start();
}

runServer();