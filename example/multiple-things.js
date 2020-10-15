// -*- mode: js; js-indent-level:2;  -*-
// SPDX-License-Identifier: MPL-2.0
var webthing;

try {
  webthing = require('../webthing');
} catch (err) {
  webthing = require('webthing-iotjs');
}

var Property = webthing.Property;
var MultipleThings = webthing.MultipleThings;
var Thing = webthing.Thing;
var Value = webthing.Value;
var WebThingServer = webthing.WebThingServer;
/**
 * A dimmable light that logs received commands to stdout.
 */

function ExampleDimmableLight() {
  {
    Thing.call(this, 'urn:dev:ops:my-lamp-1234', 'My Lamp', ['OnOffSwitch', 'Light'], 'A web connected lamp');
    this.addProperty(new Property(this, 'on', new Value(true, function (v) {
      return console.log('On-State is now', v);
    }), {
      '@type': 'OnOffProperty',
      title: 'On/Off',
      type: 'boolean',
      description: 'Whether the lamp is turned on'
    }));
    this.addProperty(new Property(this, 'brightness', new Value(50, function (v) {
      return console.log('Brightness is now', v);
    }), {
      '@type': 'BrightnessProperty',
      title: 'Brightness',
      type: 'integer',
      description: 'The level of light from 0-100',
      minimum: 0,
      maximum: 100,
      unit: 'percent'
    }));
  }
}
/**
 * A humidity sensor which updates its measurement every few seconds.
 */


function FakeGpioHumiditySensor() {
  var _this = this;

  Thing.call(this, 'urn:dev:ops:my-humidity-sensor-1234', 'My Humidity Sensor', ['MultiLevelSensor'], 'A web connected humidity sensor');
  {
    this.level = new Value(0.0);
    this.addProperty(new Property(this, 'level', this.level, {
      '@type': 'LevelProperty',
      title: 'Humidity',
      type: 'number',
      description: 'The current humidity in %',
      minimum: 0,
      maximum: 100,
      unit: 'percent',
      readOnly: true
    })); // Poll the sensor reading every 3 seconds

    setInterval(function () {
      // Update the underlying value, which in turn notifies all listeners
      var newLevel = _this.readFromGPIO();

      console.log('setting new humidity level:', newLevel);

      _this.level.notifyOfExternalUpdate(newLevel);
    }, 3000);
  }
  /**
   * Mimic an actual sensor updating its reading every couple seconds.
   */

  this.readFromGPIO = function () {
    return Math.abs(70.0 * Math.random() * (-0.5 + Math.random()));
  };
}

function runServer() {
  // Create a thing that represents a dimmable light
  var light = new ExampleDimmableLight(); // Create a thing that represents a humidity sensor

  var sensor = new FakeGpioHumiditySensor(); // If adding more than one thing, use MultipleThings() with a name.
  // In the single thing case, the thing's name will be broadcast.

  var server = new WebThingServer(new MultipleThings([light, sensor], 'LightAndTempDevice'), 8888);
  process.on('SIGINT', function () {
    server.stop();
    process.exit();
  });
  server.start();
}

runServer();