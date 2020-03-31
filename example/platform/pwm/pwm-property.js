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
const console = require('console'); // Disable logs here by editing to '!console.log'


const log = console.log || function() {};

const verbose = !console.log || function() {};

let webthing;

try {
  webthing = require('../../../webthing');
} catch (err) {
  console.log(err);
  webthing = require('webthing-iotjs');
}

const pwm = require('pwm');

function PwmOutProperty(thing, name, value, metadata, config) {
  const _this = this;

  const self = this;

  if (typeof config === 'undefined') {
    config = {};
  }

  webthing.Property.call(this, thing, name || 'PwmOut', new webthing.Value(Number(value)), {
    '@type': 'LevelProperty',
    title: metadata && metadata.title || 'PWM: '.concat(name, ' (dutyCycle)'),
    type: 'integer',
    minimum: config.minimum || 0,
    maximum: config.maximum || 100,
    readOnly: false,
    unit: 'percent',
    description: metadata && metadata.description || 'PWM DutyCycle',
  });
  {
    this.config = config;

    if (typeof this.config.pwm == 'undefined') {
      this.config.pwm = {};
    }

    if (typeof this.config.pwm.pin == 'undefined') {
      this.config.pwm.pin = 0;
    }

    if (typeof this.config.pwm.period == 'undefined') {
      this.config.pwm.period = 1 / 50;
    }

    if (typeof this.config.pwm.pin == 'undefined') {
      this.config.pwm.pin = 0;
    }

    if (typeof this.config.pwm.chip == 'undefined') {
      this.config.pwm.chip = 0;
    } // secs (eg: 50Hz = 20 ms = 0.02 sec)


    if (typeof this.config.pwm.period == 'undefined') {
      this.config.pwm.period = 0.02;
    } // [0..1]


    if (typeof this.config.pwm.dutyCycle == 'undefined') {
      this.config.pwm.dutyCycle = 0.5;
    }

    verbose('log: opening: '.concat(this.getName()));
    this.port = pwm.open(this.config.pwm, function(err) {
      verbose('log: PWM: '.concat(self.getName(), ': open: ').concat(err));

      if (err) {
        console.error('error: PWM: '.concat(self.getName(), ': open: ').concat(err));
        throw err;
      }

      self.port.freq = 1 / self.config.pwm.period;
      self.port.setFrequencySync(self.port.freq);
      self.port.setEnableSync(true);

      self.value.valueForwarder = function(value) {
        const ratio = Number(value) / 100.0;

        if (typeof self.config.pwm.convert != 'undefined') {
          value = self.config.pwm.convert(value);
        }

        verbose(self.port.freq);
        self.port.setDutyCycleSync(Number(ratio));
      };
    });
  }

  this.close = function() {
    verbose('log: PWM: '.concat(_this.getName(), ': close:'));

    try {
      self.port && self.port.closeSync();
    } catch (err) {
      console.error('error: PWM: '.concat(_this.getName(), ' close:').concat(err));
      return err;
    }

    log('log: PWM: '.concat(_this.getName(), ': close:'));
  };

  return this;
}

module.exports = PwmOutProperty;

if (module.parent === null) {
  new PwmOutProperty();
}
