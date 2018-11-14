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
var webthing;

try {
  webthing = require('../../../webthing');
} catch (err) {
  webthing = require('webthing');
}

var Thing = webthing.Thing;

var AdcProperty = require('../adc/adc-property');

var GpioProperty = require('../gpio/gpio-property');

function ARTIK05xThing(name, type, description) {
  var self = this;
  Thing.call(this, name || 'ARTIK05x', type || [], description || 'A web connected ARTIK05x');
  {
    this.pinProperties = [new GpioProperty(this, 'BlueLed', false, {
      description: 'Blue LED on ARTIK05x board (on GPIO45)'
    }, {
      direction: 'out',
      pin: 49
    }), new GpioProperty(this, 'RedLed', false, {
      description: 'Red LED on ARTIK05x board (on GPIO45)'
    }, {
      direction: 'out',
      pin: 45
    }), new GpioProperty(this, 'LeftButton', true, {
      description: 'Left Button on ARTIK05x board (on GPIO42)'
    }, {
      direction: 'in',
      pin: 42
    }), new GpioProperty(this, 'RightButton', true, {
      description: 'Right Button on ARTIK05x board (on GPIO44)'
    }, {
      direction: 'in',
      pin: 44
    }), new AdcProperty(this, 'ADC1', 0, {
      description: 'Analog port of ARTIK05x'
    }, {
      device: '/dev/adc0',
      direction: 'in',
      pin: 0
    }), new AdcProperty(this, 'ADC2', 0, {
      description: 'Analog port of ARTIK05x'
    }, {
      device: '/dev/adc0',
      direction: 'in',
      pin: 1
    })];
    this.pinProperties.forEach(function (property) {
      self.addProperty(property);
    });
  }

  this.close = function () {
    self.pinProperties.forEach(function (property) {
      property.close && property.close();
    });
  };

  return this;
}

module.exports = function () {
  if (!module.exports.instance) {
    module.exports.instance = new ARTIK05xThing();
  }

  return module.exports.instance;
};