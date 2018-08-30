var webthing;

try {
  webthing = require('../webthing');
} catch (err) {
  webthing = require('webthing');
}

var Property = webthing.Property;
var MultipleThings = webthing.server.MultipleThings;
var Thing = webthing.Thing;
var Value = webthing.Value;
var WebThingServer = webthing.server.WebThingServer;
/**
 * A dimmable light that logs received commands to stdout.
 */

function ExampleDimmableLight() {
  var _this = this;

  {
    Thing.call(this, 'My Lamp', ['OnOffSwitch', 'Light'], 'A web connected lamp');
    this.addProperty(new Property(this, 'on', new Value(true, function (v) {
      return console.log('On-State is now', v);
    }), {
      '@type': 'OnOffProperty',
      label: 'On/Off',
      type: 'boolean',
      description: 'Whether the lamp is turned on'
    }));
    this.addProperty(new Property(this, 'brightness', new Value(50, function (v) {
      return console.log('Brightness is now', v);
    }), {
      '@type': 'BrightnessProperty',
      label: 'Brightness',
      type: 'number',
      description: 'The level of light from 0-100',
      minimum: 0,
      maximum: 100,
      unit: 'percent'
    }));
  }

  this.getOnProperty = function () {
    return new Property(_this, 'on', new Value(true, function (v) {
      return console.log('On-State is now', v);
    }), {
      type: 'boolean',
      description: 'Whether the lamp is turned on'
    });
  };

  this.getLevelProperty = function () {
    return new Property(_this, 'level', new Value(50, function (l) {
      return console.log('New light level is', l);
    }), {
      type: 'number',
      description: 'The level of light from 0-100',
      minimum: 0,
      maximum: 100
    });
  };

  this.addProperty(this.getOnProperty());
  this.addProperty(this.getLevelProperty());
  return this;
}
/**
 * A humidity sensor which updates its measurement every few seconds.
 */


function FakeGpioHumiditySensor() {
  var _this2 = this;

  Thing.call(this, 'My Humidity Sensor', ['MultiLevelSensor'], 'A web connected humidity sensor');
  {
    this.level = new Value(0.0);
    this.addProperty(new Property(this, 'level', this.level, {
      '@type': 'LevelProperty',
      label: 'Humidity',
      type: 'number',
      description: 'The current humidity in %',
      minimum: 0,
      maximum: 100,
      unit: 'percent'
    })); // Poll the sensor reading every 3 seconds

    setInterval(function () {
      // Update the underlying value, which in turn notifies all listeners
      var newLevel = _this2.readFromGPIO();

      console.log('setting new humidity level:', newLevel);

      _this2.level.notifyOfExternalUpdate(newLevel);
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