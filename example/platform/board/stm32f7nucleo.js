// -*- mode: js; js-indent-level:2;  -*-
// SPDX-License-Identifier: MPL-2.0

/**
 *
 * Copyright 2018-present Samsung Electronics France SAS, and other contributors
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/
 */
let webthing;

try {
  webthing = require('../../../webthing');
} catch (err) {
  webthing = require('webthing-iotjs');
}

const Thing = webthing.Thing;

const AdcProperty = require('../adc/adc-property');
const GpioProperty = require('../gpio/gpio-property');
const PwmProperty = require('../pwm/pwm-property');

const board = require(process.iotjs.board);

function STM32F7NucleoThing(name, type, description) {
  const self = this;
  Thing.call(this,
             'urn:dev:ops:my-stm32f7nucleo-1234',
             name || 'STM32F7Nucleo',
             type || [],
             description || 'A web connected STM32F7Nucleo');
  {
    this.pinProperties = [
      new AdcProperty(this, 'ADC0', 0, {
        description: 'Analog port of STM32F7Nucleo',
      }, {
        device: '/dev/adc0',
        direction: 'in',
        pin: board.pin.ADC1_3,
      }),
      new GpioProperty(this, 'LD3', true, {
        description: 'User LED (Red)',
      }, {
        direction: 'out',
        pin: board.pin.PB14,
      }),
      new PwmProperty(this, 'PWM0', 50, {
        description: 'PWM0 port of STM32',
      }, {pwm: {
        pin: board.pin.PWM1.CH1_1,
      }}),
    ];
    this.pinProperties.forEach((property) => {
      self.addProperty(property);
    });
  }

  this.close = () => {
    self.pinProperties.forEach((property) => {
      property.close && property.close();
    });
  };
}

module.exports = () => {
  if (!module.exports.instance) {
    module.exports.instance = new STM32F7NucleoThing();
  }

  return module.exports.instance;
};
