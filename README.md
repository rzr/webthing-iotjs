# WEBTHING-IOTJS #

[![license](https://img.shields.io/badge/license-MPL--2.0-blue.svg)](LICENSE)


# Disclamer:

Webthing-iotjs is derived of webthing-node project (supporting Node.js)
but adapted for for IoT.js runtime
based on JerryScript engine for constrained devices.

Downstream project plans to keep aligned to upstream and only focus on IoT.js port.

New contributions should be submitted to webthing-node first
and then should land here (once rebased on webthing-node's master branch).


# Basic Usage:

After installing IoT.js program on your system,
you can get started by running the "Simplest Thing"
which is just simulating an actuator (LED, switch, relay...).

```
iotjs -h

iotjs example/simplest-thing.js 
# Usage:
# 
# iotjs example/simplest-thing.js [port]
# 
# Try:
# curl -X PUT -H 'Content-Type: application/json' --data '{"on": true }' http://localhost:8888/properties/on
```

Then thing can be connected to Mozilla IoT gateway using the Thing Web URL adapter.

# Guide:

For more insights and details please guide:

* https://github.com/rzr/webthing-iotjs/wiki


# References:

* https://github.com/mozilla/webthing-node
* https://github.com/rzr/webthing-iotjs/wiki
* https://s-opensource.org/2018/06/21/webthing-iotjs/

