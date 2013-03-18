describe('backbone.fhsync', function () {
  var async = new AsyncSpec(this);

  async.beforeEach(function (done) {
    this.sync = new FHBackboneSync('testdataset');
    this.model = new (Backbone.Model.extend({

    }))();

    // mock fh.sync
    //$fh = {};
    //$fh.sync = jasmine.createSpy('$fh.sync', ['init', 'manage']);
    // $fh.sync.notify = function (model, cb) {
    //   setTimeout(cb, 1);
    // };
    // jasmine.spyOn($fh.sync.notify).andCallThrough();
    spyOn($fh.sync, 'init');
    spyOn($fh.sync, 'notify').andCallFake(function (cb) {
      setTimeout(function () {
        cb({
          "code": "sync_complete",
          "uid": "test_uid_001"
        });
      }, 1);
    });
    spyOn($fh.sync, 'manage');
    done();
  });

  async.afterEach(function (done) {
    this.model = null;
    this.sync = null;
    done();
  });

  async.it('tests init', function (done) {
    var self = this;
    console.log('$fh.sync:', $fh.sync);
    console.log('this.model:', this.model);
    console.log('this.sync:', this.sync);
    expect($fh.sync.init.calls.length).toEqual(0);
    expect($fh.sync.notify.callCount).toEqual(0);
    expect($fh.sync.manage.callCount).toEqual(0);

    this.sync.init(this.model, function () {
      expect($fh.sync.init.calls.length).toEqual(1);
      expect($fh.sync.notify.callCount).toEqual(1);
      expect($fh.sync.manage.callCount).toEqual(1);

      done();
    });
  });
});
