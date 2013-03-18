/**
 * @fileOverview This is an adaptation of Backbone.localStorage, edited to work
 *     with the FeedHenry Sync Service
 * @version 0.1
 * @author david.martin@feedhenry.com
 */

// Generate four random hex digits (for GUIDs).

function S4() {
  return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
}

// Generate a pseudo-GUID by concatenating random hexadecimal.

function guid() {
  return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
}

var FHBackboneSync = function(datasetId) {
  this.datasetId = datasetId;
  //this.data = null;
  this.inited = false;
  _.bindAll(this);
};

_.extend(FHBackboneSync.prototype, Backbone.Events);

_.extend(FHBackboneSync.prototype, {
  init: function(model, cb) {
    var self = this;
    self.datasetHash = null;

    $fh.sync.init({
      "sync_frequency": 5,
      "auto_sync_local_updates": true,
      "notify_client_storage_failed": true,
      "notify_sync_started": true,
      "notify_sync_complete": true,
      "notify_offline_update": true,
      "notify_collision_detected": true,
      "notify_update_failed": true,
      "notify_update_applied": true,
      "notify_delta_received": true
    });

    // Provide handler function for receiving notifications from sync service - e.g. data changed
    $fh.sync.notify(function (notification) {
      if( 'sync_complete' == notification.code ) {
        // We are interested in sync_complete notifications as there may be changes to the dataset
        if( self.datasetHash != notification.uid ) {
          // The dataset hash received in the uid parameter is different to the one we have stored.
          // This means that there has been a change in the dataset, so we should invoke the list operation.
          self.datasetHash = notification.uid;
          if (!self.inited) {
            self.inited = true;
            cb(null);
          }
        }
      }
    });

    // Get the Sync service to manage the dataset called "myShoppingList"
    $fh.sync.manage(self.datasetId, {});
  },

  create: function(model, cb) {
  },

  update: function(model, cb) {
    var self = this;
    var uid = model.get('id');
    var syncTarget = model.collection || model;

    $fh.sync.read(self.datasetId, uid, function(res) {
      res.data = model.toJSON();

      // Send the update to the sync service
      $fh.sync.update(self.datasetId, uid, res.data, function(res2) {
        cb(null, res2.post);
      },
      function(code, msg) {
        var err = 'Unable to update row : (' + code + ') ' + msg;
        syncTarget.trigger('sync_error', err);
        cb(err);
      });
    }, function(code, msg) {
      var err = 'Unable to read row for updating : (' + code + ') ' + msg;
      cb(err);
    });
  },

  find: function(modelToFind, cb) {
  },

  // Return array of all models currently in memory
  findAll: function(cb) {
    $fh.sync.list(this.datasetId, function (res) {
      cb(null, _.map(res, function (item) { return item.data; }));
    }, function (code, msg) {
      var err = 'Unable to findAll items : (' + code + ') ' + msg;
      cb(err);
    });
  },

  destroy: function(model, cb) {
  }
});

FHBackboneSyncFn = function(method, model, options) {
  if (!model.store && !model.collection) {
    $fh.logger.debug("Trying to action a model that's not part of a store, returning.");
    return;
  }

  var store = model.store || model.collection.store;

  function storeCb(err, resp) {
    if (err || resp == null) return options.error("Record not found");
    return options.success(resp);
  }

  function routeMethod() {
    switch (method) {
      case "read":
        return model.id ? store.find(model, storeCb) : store.findAll(storeCb);
      case "create":
        return store.create(model, storeCb);
      case "update":
        return store.update(model, storeCb);
      case "delete":
        return store.destroy(model, storeCb);
    }
  }

  // if we don't have data yet, initialise it before routing the method
  if (!store.inited) {
    store.init(model, function(err) {
      if (err) return options.error(err);

      return routeMethod();
    });
    return;
  }
  return routeMethod();
};
