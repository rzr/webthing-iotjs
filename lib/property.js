/**
 * High-level Property base class implementation.
 */
'use strict';
/**
 * A Property represents an individual state value of a thing.
 */

function Property(thing, name, value, metadata) {
  var _this2 = this;

  var _this = this;
  /**
   * Initialize the object.
   *
   * @param {Object} thing Thing this property belongs to
   * @param {String} name Name of the property
   * @param {Value} value Value object to hold the property value
   * @param {Object} metadata Property metadata, i.e. type, description, unit,
   *                          etc., as an object.
   */


  {
    this.thing = thing;
    this.name = name;
    this.value = value;
    this.hrefPrefix = '';
    this.href = "/properties/".concat(this.name);
    this.metadata = metadata || {}; // Add the property change observer to notify the Thing about a property
    // change.

    this.value.on('update', function () {
      return _this2.thing.propertyNotify(_this2);
    });
  }
  /**
   * Get the property description.
   *
   * @returns {Object} Description of the property as an object.
   */

  this.asPropertyDescription = function () {
    var description = JSON.parse(JSON.stringify(_this2.metadata));
    description.href = _this2.hrefPrefix + _this2.href;
    return description;
  };
  /**
   * Set the prefix of any hrefs associated with this property.
   *
   * @param {String} prefix The prefix
   */


  this.setHrefPrefix = function (prefix) {
    _this2.hrefPrefix = prefix;
  };
  /**
   * Get the href of this property.
   *
   * @returns {String} The href
   */


  this.getHref = function () {
    return "".concat(_this2.hrefPrefix).concat(_this2.href);
  };
  /**
   * Get the current property value.
   *
   * @returns {*} The current value
   */


  this.getValue = function () {
    return _this2.value.get();
  };
  /**
   * Set the current value of the property.
   *
   * @param {*} value The value to set
   */


  this.setValue = function (value) {
    _this2.value.set(value);
  };
  /**
   * Get the name of this property.
   *
   * @returns {String} The property name.
   */


  this.getName = function () {
    return _this2.name;
  };
  /**
   * Get the thing associated with this property.
   *
   * @returns {Object} The thing.
   */


  this.getThing = function () {
    return _this2.thing;
  };
  /**
   * Get the metadata associated with this property
   *
   * @returns {Object} The metadata
   */


  this.getMetadata = function () {
    return _this2.metadata;
  };

  return this;
}

module.exports = Property;