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
const {
  Property,
  MultipleThings,
  Thing,
  Value,
  WebThingServer,
} = require('webthing');
const gpio = require('gpio');
const OnOffGpio = require('onoff').Gpio;

class RelayActuator extends Thing {
  constructor() {
    super("FlexRelay",
          'onOffSwitch',
          "A web connected relay actuator");
    this.pin = 5;
    this.onValueChange = null;
    this.value = new Value(false, (value) => {
      console.log("log: update: " + value);
      if (typeof this.onValueChange == 'function')
        this.onValueChange(value);
    });

    this.addProperty(
      new Property(this,
                   'on',
                   this.value,
                   {
                     '@type': 'OnOffProperty',
                     label: 'On/Off',
                     type: 'boolean',
                     description: 'Whether the output is changed',
                   }));
    var self = this;
    var output = gpio.export(this.pin, {
      direction: 'out',
      ready: () => {
        console.log(`log: GPIO${this.pin}: ready:`);
        self.onValueChange = (value) => {
          console.log(`log: GPIO${this.pin}: set: ${value}`);
          output.set((value) ? 1 : 0);
        }
      }
    });
    this.unexport = () => {
      gpio.unexport(this.pin);
    }
  }
}

class ButtonSensor extends Thing {
  constructor() {
    super("FlexButton",
          'binarySensor',
          "A web connected button sensor");
    this.pin = 11;
    this.value = new Value(false, (value) => {
      if (typeof this.onValueChange == 'function')
        this.onValueChange(value);
    });
    this.addProperty(
      new Property(this,
                   'on',
                   this.value,
                   {
                     '@type': 'OnOffProperty',
                     label: 'On/Off',
                     type: 'boolean',
                     description: 'Whether the input is changed',
                   }));
    //TODO: exec: gpio -g mode 11 up
    const { spawn } = require('child_process');
    const ls = spawn('gpio', ['-g', 'mode', '11', 'up']);
    var input = gpio.export(this.pin, {
      direction: 'in',
      ready: () => {
        input.value = undefined;
        input._get((value) => {
          console.log(`log: GPIO${this.pin}: ready:`);
          input.on("change", (value) => {
            console.log(`log: GPIO${this.pin}: change: ${value}`);
            this.value.notifyOfExternalUpdate(Boolean(value));
          });
          this.value.notifyOfExternalUpdate(Boolean(value));
        });
      }});
    this.unexport = () => {
      gpio.unexport(this.pin);
    }
  }
}

class ClapSensor extends Thing {
  constructor() {
    super("ClapSensor",
          'binarySensor',
          "A web connected mic sensor");
    var self = this;
    this.pin = 23;
    this.value = new Value(false, (value) => {
      if (typeof this.onValueChange == 'function')
        this.onValueChange(value);
    });
    this.addProperty(
      new Property(this,
                   'on',
                   this.value,
                   {
                     '@type': 'OnOffProperty',
                     label: 'On/Off',
                     type: 'boolean',
                     description: 'Whether the input is changed',
                   }));

    this.input = new OnOffGpio(this.pin, 'in', 'rising');
    const delay = 42; //TODO: update if needed 42 is a good value too
    var lastOnDate;
    this.input.watch(function (err, value) {
      if (err) throw err;
      if (!lastOnDate) {
        console.log(`log: GPIO${self.pin}: ready: ${value}`);
        lastOnDate = new Date();
      }
      var now = new Date();
      var elapsed = (now - lastOnDate);
      console.log(`log: GPIO${self.pin}: change: ${value} (+${elapsed}ms - ${delay}ms)`);
      if (value && (elapsed >= delay))
      {
        var toggle = !self.value.get();
        console.log(`log: GPIO${self.pin}: toggle: ${toggle}`);
        self.value.notifyOfExternalUpdate(toggle);
        lastOnDate = now;
      }
    });
    this.unexport = () => {
      this.input.unexport();
    }
  }
}


function runServer() {
  const port = process.argv[2] ? Number(process.argv[2]) : 8888;
  const url = `http://localhost:${port}`;

  console.log(`Usage:\n
${process.argv[0]} ${process.argv[1]} [port]

Try:
curl-H 'Accept: application/json' ${url}
`);

  const things = [
    new RelayActuator(),
    new ButtonSensor(),
    new ClapSensor()
  ];
  const server = new WebThingServer(new MultipleThings(things,
                                                       "FlexDevice"),
                                    port);
  process.on('SIGINT', () => {
    server.stop();
    things.forEach((element) => {
      element.unexport();
    });
    process.exit();
  });

  server.start();
}

runServer();
