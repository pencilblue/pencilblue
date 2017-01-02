'use strict';

//dependencies
var should = require('should');
var async = require('async');
var TaskUtils = require('../../../lib/utils/taskUtils');

describe('TaskUtils', function() {

    describe('getTasks', function() {

        it('should return a set of async tasks do not cause concurrency issues', function(done) {

            var items = [1, 2, 3];
            var tasks = TaskUtils.getTasks(items, function(item, i, items) {
                return function(callback) {
                    setTimeout(function() {
                        callback(null, items[i]);
                    }, 1);
                };
            });
            async.parallel(tasks, function(err, results) {
                results.should.eql(items);
                done(err);
            });
        });
    });

    describe('wrapTask', function() {

        it('should wrap a task in an anonymous function and fire the function with the specified context', function(done) {

            function SomePrototype(){

                this.f1 = function(cb) {
                    var tasks = [
                        TaskUtils.wrapTask(this, this.f2)
                    ];
                    async.parallel(tasks, cb);
                };

                this.f2 = function(cb) {
                    cb(null, true);
                };
            }

            var instance = new SomePrototype();
            instance.f1(function(err, results) {
                results.should.eql([true]);
                done(err);
            });
        });
    });

    describe('wrapTimedTask', function() {

        it('should wrap a task and provide the execution time', function(done) {
            var timeout = 5;
            function SomePrototype(){

                this.f1 = function(cb) {
                    var tasks = [
                        TaskUtils.wrapTimedTask(this, this.f2)
                    ];
                    async.parallel(tasks, cb);
                };

                this.f2 = function(cb) {
                    setTimeout(cb, timeout);
                };
            }

            var instance = new SomePrototype();
            instance.f1(function(err, results) {
                var wrapper = results[0];
                wrapper.time.should.not.be.below(timeout);
                done(err);
            });
        });
    });
});
