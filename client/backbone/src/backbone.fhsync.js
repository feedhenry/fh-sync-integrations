/**
 * @fileOverview This is an adaptation of Backbone.localStorage, edited to work
 *     with the FeedHenry Sync Service
 * @version 0.1
 * @author david.martin@feedhenry.com
 */

(function (root, factory) {
  if (typeof exports === 'object' && typeof require === 'function') {
    module.exports = factory(require("backbone"), require("underscore"));
  } else if (typeof define === "function" && define.amd) {
    // AMD. Register as an anonymous module.
    define(["backbone", "underscore"], function(Backbone, _) {
      // Use global variables if the locals are undefined.
      return factory(Backbone || root.Backbone, _ || root._);
    });
  } else {
    factory(Backbone, _);
  }
}(this, function(Backbone, _){

  //only call init once
  $fh.sync.init({notify_delta_received: true});

  var collectionMap = {};

  $fh.sync.notify(function(notification){
    //we need to update local collections if there is deltas received
    if(notification.code === "delta_received"){
      var datasetId = notification.dataset_id;
      var collection = collectionMap[datasetId];
      if(collection){
        collection.fetch();
      }
    }
  });

  Backbone.FHSync = function(datasetId, collection, syncOptions, queryParams, metaData) {
    this.datasetId = datasetId;
    this.collection = collection;
    _.bindAll(this, 'init', 'create', 'update', 'find', 'findAll', 'destroy');
    collectionMap[datasetId] = collection;
    this.init(syncOptions, queryParams, metaData);
  };

  _.extend(Backbone.FHSync.prototype, Backbone.Events);

  _.extend(Backbone.FHSync.prototype, {
    init: function(syncOptions, queryParams, metaData) {
      var self = this;
      var opts = _.extend(syncOptions || {}, {
        notify_delta_received: true
      });
      // Get the Sync service to manage the dataset
      $fh.sync.manage(self.datasetId, syncOptions, queryParams, metaData);
    },

    create: function(model, cb) {
      var self = this;
      $fh.sync.doCreate(self.datasetId, model.toJSON(), function(res){
        return cb(null, res.post);
      }, function(code, msg){
        var err = 'Failed to create model : (' + code + ')' + JSON.stringify(model.toJSON());
        self.collection.trigger('sync_error', err);
        return cb(err);
      });
    },

    update: function(model, cb) {
      var self = this;
      var uid = model.id.toString();

      $fh.sync.doUpdate(self.datasetId, uid, model.toJSON(), function(res){
        return cb(null, res.post);
      }, function(code, msg){
        var err = 'Unable to update row : (' + code + ') ' + msg;
        self.collection.trigger('sync_error', err);
        return cb(err);
      });
    },

    find: function(modelToFind, cb) {
      var self = this;
      var uid = modelToFind.id.toString();
      $fh.sync.doRead(self.datasetId, uid, function(res){
        return cb(null, res.data);
      }, function(code, msg){
        var err = 'Failed to read model: (' + code + ')' + modelToFind.toJSON();
        self.collection.trigger('sync_error', err);
        return cb(err);
      });
    },

    findAll: function(cb){
      var self = this;
      $fh.sync.doList(self.datasetId, function(res){
        var records = _.map(res, function(item){
          return item.data;
        });
        return cb(null, records);
      }, function(code, msg){
        var err = 'Failed to list models: (' + code + ')';
        self.collection.trigger('sync_error', err);
        return cb(err);
      });
    },

    destroy: function(model, cb) {
      var self = this;
      var uid = model.id.toString();
      $fh.sync.doDelete(self.datasetId, uid, function(res){
        return cb(null, null);
      }, function(code, msg){
        var err = 'Failed to delete model: (' + code + ')' + model.toJSON();
        self.collection.trigger('sync_error', err);
        return cb(err);
      });
    }
  });

  FHBackboneSyncFn = function(method, model, options) {

    function storeCb(err, resp) {
      if(err && options.error){
        return options.error(err);
      }
      if(resp == null && options.error){
        return options.error('Record not found');
      }
      if(options.success){
        return options.success(resp);
      }
    }

    var store = model.syncStore || model.collection.syncStore;

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

    return;
  };

  Backbone.ajaxSync = Backbone.ajax;

  Backbone.getSyncMethod = function(model) {
    if(model.syncStore || (model.collection && model.collection.syncStore)) {
      return FHBackboneSyncFn;
    }

    return Backbone.ajaxSync;
  };

  // Override 'Backbone.sync' to default to localSync,
  // the original 'Backbone.sync' is still available in 'Backbone.ajaxSync'
  Backbone.sync = function(method, model, options) {
    return Backbone.getSyncMethod(model).apply(this, [method, model, options]);
  };

  return Backbone.FHSync;
}));


