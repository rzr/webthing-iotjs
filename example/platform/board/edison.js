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

let webthing;
try {
  webthing = require('../../../webthing');
} catch (err) {
  webthing = require('webthing-iotjs');
}

const PwmProperty = require('../pwm/pwm-property');

function EdisonThing(name, type, description) {
  const self = this;
  webthing.Thing.call(this,
          name || 'Edison',
          type || [],
          description || 'A web connected Edison');
  {
    this.pinProperties = [
      new PwmProperty(this, 'PWM0', 50, {
        description: 'Analog port of Edison',
      }),
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

  return this;
}

module.exports = function() {
  if (!module.exports.instance) {
    module.exports.instance = new EdisonThing();
  }
  return module.exports.instance;
};
