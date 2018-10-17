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

var verbose = !console.log || function () {};

var webthing;

try {
  webthing = require('../../../webthing');
} catch (err) {
  webthing = require('webthing');
}

var Property = webthing.Property;
var Value = webthing.Value;

var adc = require('adc');

function AdcInProperty(thing, name, value, metadata, config) {
  var _this = this;

  var self = this;
  var valueObject = new Value(Number(value));
  Property.call(this, thing, name, valueObject, {
    '@type': 'LevelProperty',
    label: metadata && metadata.label || "Level: ".concat(name),
    type: 'number',
    readOnly: true,
    description: metadata && metadata.description || "ADC Sensor on pin=".concat(config.pin)
  });
  {
    config.frequency = config.frequency || 1;
    config.range = config.range || 0xFFF;
    this.period = 1000.0 / config.frequency;
    this.config = config;
    this.port = adc.open(config, function (err) {
      log("log: ADC: ".concat(self.getName(), ": open: ").concat(err, " (null expected)"));

      if (err) {
        console.error("error: ADC: ".concat(self.getName(), ": Fail to open: ").concat(config.pin));
        return null;
      }

      self.inverval = setInterval(function () {
        var value = Number(self.port.readSync());
        verbose("log: ADC: ".concat(self.getName(), ": update: 0x").concat(value.toString(0xF)));
        value = Number(Math.floor(100.0 * value / self.config.range));

        if (value !== self.lastValue) {
          log("log: ADC: ".concat(self.getName(), ": change: ").concat(value, "%"));
          self.value.notifyOfExternalUpdate(value);
          self.lastValue = value;
        }
      }, self.period);
    });
  }

  self.close = function () {
    try {
      _this.inverval && clearInterval(_this.inverval);
      _this.port && _this.port.closeSync();
    } catch (err) {
      console.error("error: ADC: ".concat(_this.getName(), " close:").concat(err));
      return err;
    }

    log("log: ADC: ".concat(_this.getName(), ": close:"));
  };

  return this;
}

function AdcProperty(thing, name, value, metadata, config) {
  if (config.direction === 'in') {
    return new AdcInProperty(thing, name, value, metadata, config);
  }

  throw 'error: Invalid param';
}

module.exports = AdcProperty;