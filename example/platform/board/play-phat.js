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
  webthing = require('webthing-iotjs');
}

var Thing = webthing.Thing;

var GpioProperty = require('../gpio/gpio-property');

function PlayPHatThing(name, type, description) {
  var _this = this;

  var self = this;
  Thing.call(this, 'urn:dev:ops:my-play-phat-1234', name || 'PlayPHat', type || [], description || 'A web connected Play RaspberryPi Hat');
  {
    this.gpioProperties = [new GpioProperty(this, 'Left', false, {
      description: 'SW1 Sensor Button on GPIO4 (Pin7)'
    }, {
      direction: 'in',
      pin: 4
    }), new GpioProperty(this, 'Right', false, {
      description: 'SW2 Sensor button on GPIO17 (Pin11)'
    }, {
      direction: 'in',
      pin: 17
    }), new GpioProperty(this, 'Up', false, {
      description: 'SW3 Sensor button on GPIO22 (Pin15)'
    }, {
      direction: 'in',
      pin: 22
    }), new GpioProperty(this, 'Down', false, {
      description: 'SW4 Sensor button on GPIO27 (Pin13)'
    }, {
      direction: 'in',
      pin: 27
    }), new GpioProperty(this, 'A', false, {
      description: 'SW5 Sensor button on GPIO19 (Pin35)'
    }, {
      direction: 'in',
      pin: 19
    }), new GpioProperty(this, 'B', false, {
      description: 'SW6 Sensor button on GPIO26 (Pin37)'
    }, {
      direction: 'in',
      pin: 26
    }), new GpioProperty(this, 'Start', false, {
      description: 'SW7 Sensor button on GPIO5 (Pin29)'
    }, {
      direction: 'in',
      pin: 5
    }), new GpioProperty(this, 'Select', false, {
      description: 'SW8 Sensor button on GPIO6 (Pin31)'
    }, {
      direction: 'in',
      pin: 6
    })];
    this.gpioProperties.forEach(function (property) {
      self.addProperty(property);
    });
  }

  this.close = function () {
    _this.gpioProperties.forEach(function (property) {
      property.close && property.close();
    });
  };

  return this;
}

module.exports = function () {
  if (!module.exports.instance) {
    module.exports.instance = new PlayPHatThing();
  }

  return module.exports.instance;
};