/**
 * IIFE to allow private scope
 */

(function (window) {
  'use strict';


  /**
   * Creates a Model instance
   *
   * @constructor
   * @param {object} items from API ({items_last_week": []})
   */

  function ListModel(items) {
    this.items = items || [];
  }

  ListModel.prototype = {

  /**
	 * Removes an item
	 *
	 * @param {number} id of the item to remove
	 * @param {function} callback run after removal is complete.
	 */
    removeItem: function (id, callback) {
      for (var i = 0; i < this.items.length; i++) {
        if (this.items[i].id == id) {
          this.items.splice(i, 1);
          break;
        }
      }
      callback.call(this, this.items);
    }
  }


})(window);