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
var console = require('console'); // Disable logs here by editing to '!console.log'


var log = console.log || function () {};

var webthing;

try {
  webthing = require('../../../webthing');
} catch (err) {
  webthing = require('webthing');
}

var Property = webthing.Property;
var Value = webthing.Value;

var gpio = require('gpio');

function GpioOutProperty(thing, name, value, metadata, config) {
  var _this = this;

  Property.call(this, thing, name, new Value(value, function (value) {
    _this.handleValueChanged && _this.handleValueChanged(value);
  }), {
    '@type': 'OnOffProperty',
    label: metadata && metadata.label || "On/Off: ".concat(name),
    type: 'boolean',
    description: metadata && metadata.description || "GPIO Actuator on pin=".concat(config.pin)
  });
  {
    _this.port = gpio.open({
      pin: config.pin,
      direction: gpio.DIRECTION.OUT
    }, function (err) {
      log("log: GPIO: ".concat(_this.getName(), ": open: ").concat(err, " (null expected)"));

      if (err) {
        console.error("error: GPIO: ".concat(_this.getName(), ": Fail to open: ").concat(err));
        return err;
      }

      _this.handleValueChanged = function (value) {
        try {
          log("log: GPIO: ".concat(_this.getName(), ": writing: ").concat(value));

          _this.port.write(value);
        } catch (err) {
          console.error("error: GPIO: ".concat(_this.getName(), ": Failed to write: ").concat(err));
          return err;
        }
      };
    });
  }

  this.close = function () {
    try {
      _this.port && _this.port.closeSync();
    } catch (err) {
      console.error("error: GPIO: ".concat(_this.getName(), ": Fail to close: ${err}"));
      return err;
    }

    log("log: GPIO: ".concat(_this.getName(), ": close:"));
  };

  return this;
}

function GpioInProperty(thing, name, value, metadata, config) {
  var _this = this;

  _this.value = new Value(value, function (value) {
    _this.handleValueChanged && _this.handleValueChanged(value);
  });
  Property.call(this, thing, name, _this.value, {
    '@type': 'BooleanProperty',
    label: metadata && metadata.label || "On/Off: ".concat(name),
    type: 'boolean',
    description: metadata && metadata.description || "GPIO Sensor on pin=".concat(config.pin)
  });
  {
    _this.period = 100;
    _this.port = gpio.open({
      pin: config.pin,
      direction: gpio.DIRECTION.IN
    }, function (err) {
      log("log: GPIO: ".concat(_this.getName(), ": open: ").concat(err, " (null expected)"));

      if (err) {
        console.error("errror: GPIO: ".concat(_this.getName(), ": Fail to open"));
        return null;
      }

      _this.inverval = setInterval(function () {
        var value = _this.port.readSync(); // log("log: GPIO: " + _this.getName() + ": read: " + value);


        if (value !== _this.lastValue) {
          log("log: GPIO: ".concat(_this.getName(), ": change: ").concat(value));

          _this.value.notifyOfExternalUpdate(value);

          _this.lastValue = value;
        }
      }, _this.period);
    });
  }

  _this.close = function () {
    try {
      _this.inverval && clearInterval(_this.inverval);
      _this.port && _this.port.closeSync();
    } catch (err) {
      console.error("error: GPIO: ".concat(_this.getName(), ": Fail to close"));
      return err;
    }

    log("log: GPIO: ".concat(_this.getName(), ": close:"));
  };

  return this;
}

function GpioProperty(thing, name, value, metadata, config) {
  if (config.direction === 'out') {
    return new GpioOutProperty(thing, name, value, metadata, config);
  } else if (config.direction === 'in') {
    return new GpioInProperty(thing, name, value, metadata, config);
  }

  throw 'error: Invalid param';
}

module.exports = GpioProperty;