import Ember from "ember-metal/core";
import { get } from "ember-metal/property_get";
import { set } from "ember-metal/property_set";
import run from "ember-metal/run_loop";
import { guidFor } from "ember-metal/utils";

import EmberObject from "ember-runtime/system/object";
import EmberLocation from "ember-routing/location/api";

/**
@module ember
@submodule ember-routing
*/

/**
  `Ember.HashLocation` implements the location API using the browser's
  hash. At present, it relies on a `hashchange` event existing in the
  browser.

  @class HashLocation
  @namespace Ember
  @extends Ember.Object
*/
export default EmberObject.extend({
  implementation: 'hash',

  init: function() {
    set(this, 'location', get(this, '_location') || window.location);
  },

  /**
    @private

    Returns normalized location.hash

    @since 1.5.1
    @method getHash
  */
  getHash: EmberLocation._getHash,

  /**
    Returns the normalized URL, constructed from `location.hash`.

    e.g. `#/foo` => `/foo` as well as `#/foo#bar` => `/foo#bar`.

    By convention, hashed paths must begin with a forward slash, otherwise they
    are not treated as a path so we can distinguish intent.

    @private
    @method getURL
  */
  getURL: function() {
    var hash = this.getHash();
    var path = '/';

    if(hash.charAt(1) !== '/'){
      path += hash;
    } else {
      path += hash.substr(1).replace(/^\/|\/$/g, '');
    }

    return path;
  },

  /**
    Set the `location.hash` and remembers what was set. This prevents
    `onUpdateURL` callbacks from triggering when the hash was set by
    `HashLocation`.

    @private
    @method setURL
    @param path {String}
  */
  setURL: function(path) {
    var currentURL = '#' + this.getURL();
    var url = this.formatURL(path);

    if(currentURL !== url){
      get(this, 'location').hash = url;
      set(this, 'lastSetURL', url.substr(1));
    }
  },

  /**
    Uses location.replace to update the url without a page reload
    or history modification.

    @private
    @method replaceURL
    @param path {String}
  */
  replaceURL: function(path) {
    var currentURL = this.getURL();
    var url = this.formatURL(path).substr(1);

    if(currentURL !== url){
      get(this, 'location').replace('#' + url);
      set(this, 'lastSetURL', url);
    }
  },

  /**
    Register a callback to be invoked when the hash changes. These
    callbacks will execute when the user presses the back or forward
    button, but not after `setURL` is invoked.

    @private
    @method onUpdateURL
    @param callback {Function}
  */
  onUpdateURL: function(callback) {
    var self = this;
    var guid = guidFor(this);

    Ember.$(window).on('hashchange.ember-location-'+guid, function() {
      run(function() {
        var path = self.getURL();
        if (get(self, 'lastSetURL') === path) { return; }

        set(self, 'lastSetURL', null);

        callback(path);
      });
    });
  },

  /**
    Given a URL, formats it to be placed into the page as part
    of an element's `href` attribute.

    This is used, for example, when using the {{action}} helper
    to generate a URL based on an event.

    @private
    @method formatURL
    @param url {String}
  */
  formatURL: function(url) {
    return '#/' + url.replace(/^\/|\/$/g, '');
  },

  /**
    Cleans up the HashLocation event listener.

    @private
    @method willDestroy
  */
  willDestroy: function() {
    var guid = guidFor(this);

    Ember.$(window).off('hashchange.ember-location-'+guid);
  }
});
