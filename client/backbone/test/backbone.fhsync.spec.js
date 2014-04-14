describe('backbone.fhsync', function () {
  var async = new AsyncSpec(this);

  async.beforeEach(function (done) {
    // mock fh.sync
    //$fh = {};
    //$fh.sync = jasmine.createSpy('$fh.sync', ['init', 'manage']);
    // $fh.sync.notify = function (model, cb) {
    //   setTimeout(cb, 1);
    // };
    // jasmine.spyOn($fh.sync.notify).andCallThrough();
    spyOn($fh.sync, 'manage');
    this.model = new (Backbone.Model.extend({

    }))();

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
    this.sync = new Backbone.FHSync('testdataset', null, {storage_strategy: "memory"});
    expect($fh.sync.manage.callCount).toEqual(1);
    done();
  });
});
