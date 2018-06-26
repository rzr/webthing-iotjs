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
  SingleThing,
  Thing,
  Value,
  WebThingServer,
} = require('webthing');

const fs = require('fs');
const Mastodon = require('mastodon-lite');
const conf = '.mastodon-lite.json';
const config = JSON.parse(fs.readFileSync(conf, 'utf8'));
const mastodon = Mastodon(config);

function handleLevelUpdate(value)
{ 
  var message = value;
  message = `https://s-opensource.org/tag/wot/# #MultiLevelSwitch is \"${value}\" (#MastodonLite #WebThing Actuator)`
  console.log(message);
  mastodon.post(message);
}

function makeThing() {
  const thing = new Thing('MastodonMultiLevelSwitchExample', 'multiLevelSwitch', 'An actuator example that just blog');

  thing.addProperty(
    new Property(thing,
                 'level',
                 new Value(0, handleLevelUpdate),
                 {
                   label: 'Level',
                   type: 'number',
                   description: 'Whether the output is changed',
                 }));
  return thing;
}

function runServer() {
  const port = process.argv[2] ? Number(process.argv[2]) : 8888;
  const url = `http://localhost:${port}/properties/multiLevelSwitch`;
  console.log('Usage:\n'
              + process.argv[0] + ' ' + process.argv[1] + ' [port]\n'
              + 'Try:\ncurl -H "Content-Type: application/json" '
              + url + '\n');

  const thing = makeThing();
  const server = new WebThingServer(new SingleThing(thing), port);
  process.on('SIGINT', () => {
    server.stop();
    process.exit();
  });
  server.start();
}

runServer();
