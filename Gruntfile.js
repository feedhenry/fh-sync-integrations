/*global module:false*/
module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    meta: {
      pkg: grunt.file.readJSON('package.json'),
      src: ['client/backbone/src/*.js', 'cloud/**/*.js'],
      specs: 'client/backbone/test/*.spec.js', // client
      tests: 'cloud/**/*.test.js', // cloud
      helpers: ''
    },
    jshint: {
      all: ['Gruntfile.js',
        '<%= meta.src %>',
        '<%= meta.specs %>',
        '<%= meta.tests %>'],
      options: {
        jshintrc: '.jshintrc'
      }
    },
    jasmine: {
      backbone_fhsync: {
        src: './client/backbone/src/**/*.js',
        options: {
          vendor: ['./client/backbone/bower_components/underscore/underscore.js',
            './client/backbone/bower_components/backbone/backbone.js',
            './client/backbone/bower_components/fh-js-sdk/dist/feedhenry-forms.min.js'],
          specs: './client/backbone/test/**/*.spec.js',
          helpers: './client/backbone/test/jasmine.async.helper.js',
          junit: {
            path: 'test-report',
            consolidate: true
          }
        }
      }
    },
    nodeunit: {
      files: '<%= meta.tests %>'
    },
    watch: {
      js: {
        files: ['<%= meta.src %>', '<%= meta.specs %>', '<%= meta.helpers %>'],
        tasks: ['default']
      }
    }
  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-nodeunit');
  grunt.loadNpmTasks('grunt-contrib-jasmine');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');

  // Default task.
  grunt.registerTask('default', ['jshint', 'jasmine', 'nodeunit']);

};
