const {
  Property,
  SingleThing,
  Thing,
  Value,
  WebThingServer,
} = require('webthing');


function makeThing() {
  const thing = new Thing('My Lamp',
                          ['OnOffSwitch', 'Light'],
                          'A web connected lamp');

  thing.addProperty(
    new Property(thing,
                 'on',
                 new Value(true),
                 {
                   '@type': 'OnOffProperty',
                   title: 'On/Off',
                   type: 'boolean',
                   description: 'Whether the lamp is turned on',
                 }));
  thing.addProperty(
    new Property(thing,
                 'brightness',
                 new Value(50),
                 {
                   '@type': 'BrightnessProperty',
                   title: 'Brightness',
                   type: 'integer',
                   description: 'The level of light from 0-100',
                   minimum: 0,
                   maximum: 100,
                   unit: 'percent',
                 }));

  thing.addAvailableAction(
    'fade',
    {
      title: 'Fade',
      description: 'Fade the lamp to a given level',
      input: {
        type: 'object',
        required: [
          'brightness',
          'duration',
        ],
        properties: {
          brightness: {
            type: 'integer',
            minimum: 0,
            maximum: 100,
            unit: 'percent',
          },
          duration: {
            type: 'integer',
            minimum: 1,
            unit: 'milliseconds',
          },
        },
      },
    },
    FadeAction);

  thing.addAvailableEvent(
    'overheated',
    {
      description: 'The lamp has exceeded its safe operating temperature',
      type: 'number',
      unit: 'degree celsius',
    });

  return thing;
}

function runServer() {
  const thing = makeThing();

  // If adding more than one thing, use MultipleThings() with a name.
  // In the single thing case, the thing's name will be broadcast.
  const server = new WebThingServer(new SingleThing(thing), 8888);

  process.on('SIGINT', () => {
    server.stop().then(() => process.exit()).catch(() => process.exit());
  });

  server.start().catch(console.error);
}

runServer();
