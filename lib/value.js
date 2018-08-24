/**
 * An observable, settable value interface.
 */

'use strict';

const EventEmitter = require('events').EventEmitter;
/**
 * A property value.
 *
 * This is used for communicating between the Thing representation and the
 * actual physical thing implementation.
 *
 * Notifies all observers when the underlying value changes through an external
 * update (command to turn the light off) or if the underlying sensor reports a
 * new value.
 */
function Value(initialValue, valueForwarder) {
  /**
   * Initialize the object.
   *
   * @param {*} initialValue The initial value
   * @param {function} valueForwarder The method that updates the actual value
   *                                  on the thing
   */
  {
    EventEmitter.call(this);
    this.lastValue = initialValue;
    if (!valueForwarder) {
      this.valueForwarder = () => {
        throw new Error('Read-only value');
      };
    } else {
      this.valueForwarder = valueForwarder;
    }
  }

  /**
   * Set a new value for this thing.
   *
   * @param {*} value Value to set
   */
  this.set = (value) => {
    this.valueForwarder(value);
    this.notifyOfExternalUpdate(value);
  };
  /**
   * Return the last known value from the underlying thing.
   *
   * @returns the value.
   */
  this.get = () => {
    return this.lastValue;
  };
  /**
   * Notify observers of a new value.
   *
   * @param {*} value New value
   */
  this.notifyOfExternalUpdate = (value) => {
    if (typeof value !== 'undefined' && value !== null && value !== this.lastValue) {
      this.lastValue = value;
      this.emit('update', value);
    }
  };
  return this;
}

Value.prototype = Object.create(require('events').EventEmitter.prototype);
module.exports = Value;
