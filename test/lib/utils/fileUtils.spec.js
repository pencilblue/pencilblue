'use strict';

//dependencies
var should = require('should');
var path = require('path');
var util = require('util');
var FileUtils = require('../../../lib/utils/fileUtils');

describe('FileUtils', function() {

    describe('getDirectories', function() {

        it('should throw an error when passed a null path', function() {

            FileUtils.getDirectories.bind(null, function(err, results) {}).should.throwError();
        });

        it('should reject with an error when not passed a valid path', function(done) {

            FileUtils.getDirectories('&!^!%@!').catch(function(err) {

                should.exist(err);
                done();
            });
        });

        it('should throw an error when passed an integer as the path', function() {

            FileUtils.getDirectories.bind(54, function(err, results) {}).should.throwError();
        });

        it('should callback with an array with 2 paths', function(done) {

            FileUtils.getDirectories('./controllers').then(function(results) {

                results.should.be.instanceof(Array).and.have.lengthOf(2);
                results.should.containEql(path.join('controllers', 'admin'));
                results.should.containEql(path.join('controllers', 'api'));
                done();
            });
        });
    });

    describe('getFiles', function() {

        it('should throw an error when passed a null path', function() {

            FileUtils.getFiles.bind(null, function(err, results) {}).should.throwError();
        });

        it('should callback with an error when not passed a valid path', function(done) {

            FileUtils.getFiles('&!^!%@!').catch(function(err) {
                should.exist(err);
                done();
            });
        });

        it('should callback with an error when not passed a valid path to a file', function(done) {

            FileUtils.getFiles('./controllers/base_controller.js').catch(function(err) {
                should.exist(err);
                done();
            });
        });

        it('should callback with an error when not passed a valid path to a file that does not exist', function(done) {

            FileUtils.getFiles('./controllers/non_existing_controller.js').catch(function(err) {
                should.exist(err);
                done();
            });
        });

        it('should callback with an array of 4 files when called with no options and a valid path', function(done) {

            FileUtils.getFiles('./controllers').then(function(results) {
                results.should.be.instanceof(Array);
                should(results.length >= 4).be.ok();

                done();
            });
        });

        it('should callback with an empty array of file paths', function(done) {

            var options = {
                filter: function(/*fullPath, stat*/) {
                    return false;
                }
            };
            FileUtils.getFiles('./controllers', options).then(function(results) {

                results.should.be.instanceof(Array).and.have.lengthOf(0);
                done();
            });
        });

        it('should callback with an array containing at least 5 file paths', function(done) {

            var options = {
                recursive: true
            };
            FileUtils.getFiles('./controllers', options).then(function(results) {

                results.should.be.instanceof(Array);
                should(results.length >= 4).be.ok();

                done();
            });
        });
    });

    describe('getExtension', function() {

        it('should return null when passed a null path', function() {

            var result = FileUtils.getExtension(null);
            should.strictEqual(null, result);
        });

        it('should return null when passed an empty path', function() {

            var result = FileUtils.getExtension('');
            should.strictEqual(null, result);
        });

        it('should return "" when passed a path with no extension', function() {

            var result = FileUtils.getExtension(path.join('.', 'controllers', 'config'));
            should.strictEqual(null, result);
        });

        it('should return the "yml" extension when pass a path that is prefixed with a period but still provides extension', function() {

            var result = FileUtils.getExtension('./controllers/.config.yml');
            result.should.eql("yml");
        });

        it('should return "gif" when passed a path ending in .gif', function() {

            var options = {
                lower: true
            };
            var result = FileUtils.getExtension('/hello/world.GiF', options);
            result.should.eql("gif");
        });
    });

    describe('getFileExtensionFilter', function() {

        [3, 2.1, false, undefined, null, {}].forEach(function(val) {
            it('should throw when handled a non-string value '+util.inspect(val)+' as the filename', function() {
                FileUtils.getFileExtensionFilter('js').bind(null, val).should.throwError();
            });
        });

        it('should return true when passed a filename with a js extension', function() {
            FileUtils.getFileExtensionFilter('js')('hello_world.js').should.eql(true);
        });

        it('should return false when passed a filename with a non-js extension', function() {
            FileUtils.getFileExtensionFilter('js')('hello_world.json').should.eql(false);
        });
    });
});
