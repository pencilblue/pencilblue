
//dependencies
var should = require('should');
var Configuration = require('../../../../../include/config.js');
var Lib           = require('../../../../../lib');

describe('PluginDependencyService', function() {

    var pb = null;
    var PluginDependencyService = null;
    before('Initialize the Environment with the default configuration', function () {
        this.timeout(10000);

        pb = new Lib(Configuration.getBaseConfig());
        PluginDependencyService = pb.PluginDependencyService;
    });

    describe('PluginDependencyService.getType', function() {

        it('should throw when called directly', function() {
            var service = new PluginDependencyService({});
            service.getType.bind(service).should.throwError();
        });
    });

    describe('PluginDependencyService.isSatisfied', function() {

        it('should throw when called directly', function() {
            var service = new PluginDependencyService({});
            service.isSatisfied.bind(service).should.throwError();
        });
    });

    describe('PluginDependencyService.configure', function() {

        it('should throw when called directly', function() {
            var service = new PluginDependencyService({});
            service.configure.bind(service).should.throwError();
        });
    });

    describe('PluginDependencyService.hasDependencies', function() {

        it('should throw when called directly', function() {
            var service = new PluginDependencyService({});
            service.hasDependencies.bind(service).should.throwError();
        });
    });

    describe('PluginDependencyService._installAll', function() {

        it('should throw when called directly', function() {
            var service = new PluginDependencyService({});
            service._installAll.bind(service).should.throwError();
        });
    });

    describe('PluginDependencyService.getLockKey', function() {

        it('should postfix the key with the type and plugin uid', function() {
            PluginDependencyService.getLockKey('test1', 'pluginX').should.containEql(':pluginX:test1:dependency:install');
        });
    });

    describe('PluginDependencyService.buildResult', function() {

        it('should provide an object with a result and any validation errors', function() {
            PluginDependencyService.buildResult('abc', true, [{a: '1'}]).should.eql({ moduleName: 'abc', success: true, validationErrors: [{a: '1'}]});
        });
    });

    describe('PluginDependencyService.getResultReducer', function() {

        [true, false, 1, 2.2, {}, null, undefined].forEach(function(val) {

            it('should callback true when a non-array results value '+val+' is passed', function(next) {
                PluginDependencyService.getResultReducer('sample', function(err, result) {

                    should(err).eql(null);
                    result.should.eql(true);
                    next();
                })(null, val);
            });
        });

        it('should return false if a result item\'s success property is false', function(next) {
            PluginDependencyService.getResultReducer('sample', function(err, result) {

                should(err).eql(null);
                result.should.eql(false);
                next();
            })(null, [{success: false, validationErrors: [{field: 'npm', message: 'unit test'}]}]);
        });

        describe('PluginDependencyService.getLockIteration', function() {

            it('should callback with error when it fails to execute request for the lock', function(next) {
                var context = {
                    lockKey: 'hello',
                    lockService: {
                        acquire: function(key, handler) {
                            key.should.eql('hello');
                            handler(new Error('This is expected'));
                        }
                    }
                };
                PluginDependencyService.getLockIteration(context)(function(err) {
                    err.message.should.eql('This is expected');
                    next();
                });
            });

            it('should callback with no error and set didLock true when the lock service acquires the lock', function(next) {
                var context = {
                    lockKey: 'hello',
                    lockService: {
                        acquire: function(key, handler) {
                            handler(null, true);
                        }
                    }
                };
                PluginDependencyService.getLockIteration(context)(function() {
                    context.didLock.should.eql(true);
                    next();
                });
            });

            it('should callback with no error, set didLock false and wait the interval when the lock service fails to acquire the lock', function(next) {
                var context = {
                    lockKey: 'hello',
                    interval: 100,
                    retryCount: 0,
                    lockService: {
                        acquire: function(key, handler) {
                            handler(null, false);
                        }
                    }
                };
                PluginDependencyService.getLockIteration(context)(function() {
                    context.interval.should.eql(100);
                    context.retryCount.should.eql(1);
                    next();
                });
            });
        });

        describe('PluginDependencyService.getLockIteration', function() {

            it('should return true when the didLock property is true', function() {
                var context = {
                    didLock: true
                };
                PluginDependencyService.getLockCondition(context)().should.eql(true);
            });

            it('should return true when the retryCount property is equal to or greater than the maxCount', function() {
                var context = {
                    didLock: false,
                    retryCount: 13,
                    maxCount: 13
                };
                PluginDependencyService.getLockCondition(context)().should.eql(true);
            });

            it('should return false when the retryCount property is less than the maxCount and didLock is false', function() {
                var context = {
                    didLock: false,
                    retryCount: 12,
                    maxCount: 13
                };
                PluginDependencyService.getLockCondition(context)().should.eql(false);
            });
        });
    });
});
