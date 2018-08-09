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

const console = require('console');

// Disable logs here by editing to '!console.log'
const log = console.log || function() {};

let webthing;

try {
  webthing = require('../../../webthing');
} catch (err) {
  webthing = require('webthing');
}
const Property = webthing.Property;
const Value = webthing.Value;

const gpio = require('gpio');

function GpioOutProperty(thing, name, value, metadata, config) {
  const _this = this;
  Property.call(this, thing, name, new Value(value, (value) => {
    _this.handleValueChanged && _this.handleValueChanged(value);
  }), {
    '@type': 'OnOffProperty',
            label: (metadata && metadata.label) || `On/Off: ${name}`,
    type: 'boolean',
    description: (metadata && metadata.description) || 
              (`GPIO Actuator on pin=${config.pin}`),
  });
  {
    _this.port = gpio.open({
      pin: config.pin,
      direction: gpio.DIRECTION.OUT
    }, (err) => {
      log(`log: GPIO: ${_this.getName()}: open: ${err} (null expected)`);

      if (err) {
        console.error(`error: GPIO: ${_this.getName()}: Fail to open: ${err}`);
        return err;
      }

      _this.handleValueChanged = (value) => {
        try {
           log(`log: GPIO: ${_this.getName()}: writing: ${value}`);
          _this.port.write(value);
        } catch (err) {
          console.error(`error: GPIO: ${_this.getName()}: Failed to write: ${err}`);
          return err;
        }
      };
    });
  }

  this.close = () => {
    try {
      _this.port && _this.port.closeSync();
    } catch (err) {
      console.error("error: GPIO: ".concat(_this.getName(), ": Fail to close: ${err}"));
      return err;
    }
    log(`log: GPIO: ${_this.getName()}: close:`);
  };

  return this;
}

function GpioInProperty(thing, name, value, metadata, config) {
  const _this = this;
  _this.value = new Value(value, function (value) {
    _this.handleValueChanged && _this.handleValueChanged(value);
  });
  Property.call(this, thing, name, _this.value, {
    '@type': 'BooleanProperty',
            label: (metadata && metadata.label) || `On/Off: ${name}`,
    type: 'boolean',
            description:
            (metadata && metadata.description) ||
              (`GPIO Sensor on pin=${config.pin}`),
  });
  {
    _this.period = 100;
    _this.port = gpio.open({
      pin: config.pin,
      direction: gpio.DIRECTION.IN
    }, (err) => {
      log(`log: GPIO: ${_this.getName()}: open: ${err} (null expected)`);

      if (err) {
        console.error(`errror: GPIO: ${_this.getName()}: Fail to open`);
        return null;
      }

      _this.inverval = setInterval(() => {
        let value = _this.port.readSync();

        // log("log: GPIO: " + _this.getName() + ": read: " + value);

        if (value !== _this.lastValue) {
           log(`log: GPIO: ${_this.getName()}: change: ${value}`);
          _this.value.notifyOfExternalUpdate(value);
          _this.lastValue = value;
        }
      }, _this.period);
    });
  }

  _this.close = () => {
    try {
      _this.inverval && clearInterval(_this.inverval);
      _this.port && _this.port.closeSync();
    } catch (err) {
      console.error(`error: GPIO: ${_this.getName()}: Fail to close`);
      return err;
    }
    log(`log: GPIO: ${_this.getName()}: close:`);
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
