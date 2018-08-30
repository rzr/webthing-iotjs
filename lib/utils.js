/**
 * Utility functions.
 */
'use strict';

module.exports = {
  /**
   * Get the current time.
   *
   * @returns {String} The current time in the form YYYY-mm-ddTHH:MM:SS+00:00
   */
  timestamp: function () {
    var date = "YYYY-mm-ddTHH:MM:SS+00:00"; // = new Date().toString();

    return date.replace(/\.\d{3}Z/, '+00:00');
  },

  /**
   * Get the default local IP address.
   *
   * @returns localhost
   */
  getIP: function () {
    return "127.0.0.1";
  }
};