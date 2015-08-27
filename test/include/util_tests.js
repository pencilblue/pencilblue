
//dependencies
var async  = require('async');
var should = require('should');
var path   = require('path');
var fs     = require('fs');
var util   = require('../../include/util.js');

describe('Util', function() {
    
    describe('Util.clone', function() {
        
        it('should provide a deep copy of the object', function() {
            
            var obj = {
                a: {
                    b: [
                        true,
                        "false",
                        {
                            j: 1
                        }
                    ],
                    C: 7.0
                },
                d: null
            };
            var clone = util.clone(obj);
            clone.should.eql(obj);
        });
        
        it('should provide a deep copy of the array', function() {
            
            var array = [
                {
                    b: [
                        true,
                        "false",
                        {
                            j: 1
                        }
                    ],
                    C: 7.0
                },
                null
            ];
            var clone = util.clone(array);
            clone.should.eql(array);
        });
    });
    
    describe('Util.deepMerge', function() {
        
        it('should add the properties of a into b', function() {
            var a = {
                prop: 'val'
            };
            var b = {};
            util.deepMerge(a, b);
            
            a.should.eql(b);
        });
        
        it('should override properties of b with those of a', function() {
            var a = {
                prop: 'val1'
            };
            var b = {
                prop: 'val2'
            };
            util.deepMerge(a, b);
            
            a.should.eql(b);
        });
        
        it('should replace the items of b.items with a.items', function() {
            var a = {
                items: ['a', 'c']
            };
            var b = {
                items: ['a', 'b']
            };
            util.deepMerge(a, b);
            
            a.should.eql(b);
        });
    });
    
    describe('Util.ane', function() {
        
        it('should throw when an error is present', function() {
            
            var err = new Error('expected');
            util.ane.bind(null, err).should.throwError();
        });
        
        it('should not throw when an error is present', function() {
            
            var err = null;
            util.ane.bind(null, err).should.not.throwError();
        });
    });
    
    describe('Util.initArray', function() {
        
        it('should initialize each element with the specified value', function() {
            
            var val    = true;
            var result = util.initArray(3, val);
            
            result.should.eql([true, true, true]);
        });
        
        it('should initialize each element with the specified value', function() {
            
            var val = function(i){
                return i;
            };
            var result = util.initArray(3, val);
            
            result.should.eql([0, 1, 2]);
        });
    });
    
    describe('Util.escapeRegexp', function() {
        
        it('should return a string that escapes special characters', function() {
            
            var val = '[0-9a-zA-z]+.*';
            var result = util.escapeRegExp(val);
            
            result.should.eql('\\[0\\-9a\\-zA\\-z\\]\\+\\.\\*');
        });
        
        it('should return null', function() {
            
            var val = 1;
            var result = util.escapeRegExp(val);
            should.strictEqual(null, result);
        });
    });
    
    describe('Util.merge', function() {
        
        it('should shallow add the properties of a into b', function() {
            var a = {
                prop: {
                    a: true
                }
            };
            var b = {
                prop: {
                    c: false
                },
                d: 24.3
            };
            util.merge(a, b);
            
            var expected = {
                prop: {
                    a: true
                },
                d: 24.3
            }
            b.should.eql(expected);
        });
    });
    
    describe('Util.union', function() {
        
        it('should ensure the union of properties from a and b where b is the tie breaker', function() {
            var a = {
                a: true,
                b: false,
                c: 1
            };
            var b = {
                a: false,
                d: 25.2,
                e: "hello world"
            };
            var result = util.union(a, b);
            
            var expected = {
                a: false,
                b: false,
                c: 1,
                d: 25.2,
                e: "hello world"
            }
            result.should.eql(expected);
        });
    });
    
    describe('Util.getTasks', function() {
        
        it('should return a set of async tasks do not cause concurrency issues', function(done) {
            
            var items = [1, 2, 3];
            var tasks = util.getTasks(items, function(items, i) {
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
    
    describe('Util.wrapTask', function() {
        
        it('should wrap a task in an anonymous function and fire the function with the specified context', function(done) {
            
            function SomePrototype(){
                
                this.f1 = function(cb) {
                    var tasks = [
                        util.wrapTask(this, this.f2)
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
    
    describe('Util.forEach', function() {
        
        it('should iterate over each item in the array', function() {
            
            var val = [
                {
                    i: 0
                }
            ];
            util.forEach(val, function(item, i, iterable) {
                val.should.eql(iterable);
                val[i].should.eql(item);
                val[i].i.should.eql(i);
            });
        });
        
        it('should iterate over each item in the object', function() {
            
            var val = {
                a: {
                    key: 'a'
                }
            };
            
            var cnt = 0;
            util.forEach(val, function(item, key, iterable, i) {
                val.should.eql(iterable);
                val[key].should.eql(item);
                val[key].key.should.eql(key);
                cnt.should.eql(i);
                cnt++;
            });
        });
    });
    
    describe('Util.arrayToHash', function() {
        
        it('should return null when a non-array is provided', function() {
            should.strictEqual(null, util.arrayToHash('not an array'));
        });
        
        it('should return an object with each property set to true when no default value is provided', function() {
            
            var val = ['a', 'b', 'c'];
            var result = util.arrayToHash(val);
            var expected = {
                a: true,
                b: true,
                c: true
            };
            expected.should.eql(result);
        });
        
        it('should return an object with each property set to the default value when provided', function() {
            var val = ['a', 'b', 'c'];
            var result = util.arrayToHash(val, 26.7);
            var expected = {
                a: 26.7,
                b: 26.7,
                c: 26.7
            };
            expected.should.eql(result);
        });
        
        it('should return an object with each property set the calculated value when function is used as the default value', function() {
            var val = ['a', 'b', 'c'];
            var result = util.arrayToHash(val, function(val, i){
                return val[i];
            });
            var expected = {
                a: 'a',
                b: 'b',
                c: 'c'
            };
            expected.should.eql(result);
        });
    });
    
    describe('Util.arrayToObj', function() {
        
        it('should return null when a non-array is provided', function() {
            should.strictEqual(null, util.arrayToObj('not an array'));
        });
        
        it('should return null when an invalid key field is passed', function() {
            should.strictEqual(null, util.arrayToObj([], null));
        });
        
        it('should return an object with each property set to value of array item', function() {
            
            var val = [
                {
                    key: 'apple'
                }
            ];
            var result = util.arrayToObj(val, 'key');
            var expected = {
                apple: {
                    key: 'apple'
                }
            };
            expected.should.eql(result);
        });
        
        it('should return an object with each property set to the value of the key property', function() {
            var val = [
                {
                    key: 'apple'
                }
            ];
            var result = util.arrayToObj(val, 'key', 'key');
            var expected = {
                apple: 'apple'
            };
            expected.should.eql(result);
        });
        
        it('should return an object with each property calculated by the key length and a value calculated by adding an addition field', function() {
            var val = [
                {
                    key: 'apple'
                }
            ];
            var result = util.arrayToObj(val, function(val, i){
                return val[i].key.length;
            }, 
            function(array, i) {
                val[i].default = true;
                return val[i];
            });
            var expected = {
                '5': {
                    key: 'apple',
                    default: true
                }
            };
            expected.should.eql(result);
        });
    });
    
    describe('Util.objArrayToHash', function() {
        
        it('should return null when an invalid array is provided', function() {
            should.strictEqual(null, util.objArrayToHash('hello world', 'key'));
        });
        
        it('should return an object where the value of the id property for each array item is the hash key and the value is the array item', function() {
            var val = [
                {
                    id: 'abc'   
                }
            ];
            var result = util.objArrayToHash(val, 'id');
            var expected = {
                abc: {
                    id: 'abc'   
                }
            };
            result.should.eql(expected);
        });
    });
    
    describe('Util.hashToArray', function() {
        
        it('should return null when a non-object is provided', function() {
            should.strictEqual(null, util.arrayToObj(78.8));
        });
        
        it('should return an array where each item in the array is the value of a hash key', function() {
            var val = {
                apple: {
                    type: 'fruit'
                }
            };
            var result = util.hashToArray(val);
            var expected = [
                {
                    type: 'fruit'
                }
            ];
            expected.should.eql(result);
        });
        
        it('should return an array where each item in the array contains a property "key" who\'s value is the kash key', function() {
            var val = {
                apple: {
                    type: 'fruit'
                }
            };
            var result = util.hashToArray(val, 'key');
            var expected = [
                {
                    type: 'fruit',
                    key: 'apple'
                }
            ];
            expected.should.eql(result);
        });
    });
    
    describe('Util.invertHash', function() {
        
        it('should return null when a non-object is passed', function() {
            should.strictEqual(null, util.invertHash(78.8));
        });
        
        it('should return an object where by the keys and values are swapped', function() {
            var val = {
                a: 'apple',
                b: 'banana'
            };
            var result = util.invertHash(val);
            var expected = {
                apple: 'a',
                banana: 'b'
            };
            expected.should.eql(result);
        });
    });
    
    describe('Util.copyArray', function() {
        
        it('should return null when a non-array is passed', function() {
            should.strictEqual(null, util.copyArray(78.8));
        });
        
        it('should return an array identical to the one provided', function() {
            var val = [
                {a: 'apple'},
                {b: 'banana'}
            ];
            var result = util.copyArray(val);
            val.should.eql(result);
        });
    });
    
    describe('Util.arrayPushAll', function() {
        
        it('should return null when a non-array "from" parameter is passed', function() {
            should.strictEqual(false, util.arrayPushAll(67, []));
        });
        
        it('should return null when a non-array "to" parameter is passed', function() {
            should.strictEqual(false, util.arrayPushAll([], 90));
        });
        
        it('should return an array that contains the items of the "from" array and the items from the "to" array appended', function() {
            var from = [
                {a: 'apple'},
                {b: 'banana'}
            ];
            var to = [
                {c: 'cantaloupe'},
                {d: 'date'}
            ];
            util.arrayPushAll(from, to);
            var expected = [
                {c: 'cantaloupe'},
                {d: 'date'},
                {a: 'apple'},
                {b: 'banana'}
            ];
            expected.should.eql(to);
        });
    });
    
    describe('Util.uniqueId', function() {
        
        it('should return a unique string of characters, length 36', function() {
            var result = util.uniqueId();
            result.should.be.type('string');
            result.should.be.length(36);
        });
    });
    
    describe('Util.isObject', function() {
        
        it('should return false when passed null', function() {
            var result = util.isObject(null);
            result.should.eql(false);
        });
        
        it('should return false when passed undefined', function() {
            var result = util.isObject(undefined);
            result.should.eql(false);
        });
        
        it('should return false when passed an integer', function() {
            var result = util.isObject(5);
            result.should.eql(false);
        });
        
        it('should return false when passed a float', function() {
            var result = util.isObject(5.9);
            result.should.eql(false);
        });
        
        it('should return false when passed a boolean', function() {
            var result = util.isObject(true);
            result.should.eql(false);
        });
        
        it('should return false when passed a string', function() {
            var result = util.isObject('hello world');
            result.should.eql(false);
        });
        
        it('should return true when passed an array', function() {
            var result = util.isObject([]);
            result.should.eql(true);
        });
        
        it('should return false when passed a function', function() {
            var result = util.isObject(function(){});
            result.should.eql(false);
        });
        
        it('should return true when passed an object', function() {
            var result = util.isObject({});
            result.should.eql(true);
        });
    });
    
    describe('Util.isString', function() {
        
        it('should return false when passed null', function() {
            var result = util.isString(null);
            result.should.eql(false);
        });
        
        it('should return false when passed undefined', function() {
            var result = util.isString(undefined);
            result.should.eql(false);
        });
        
        it('should return false when passed an integer', function() {
            var result = util.isString(5);
            result.should.eql(false);
        });
        
        it('should return false when passed a float', function() {
            var result = util.isString(5.9);
            result.should.eql(false);
        });
        
        it('should return false when passed a boolean', function() {
            var result = util.isString(true);
            result.should.eql(false);
        });
        
        it('should return true when passed a string', function() {
            var result = util.isString('hello world');
            result.should.eql(true);
        });
        
        it('should return false when passed an array', function() {
            var result = util.isString([]);
            result.should.eql(false);
        });
        
        it('should return false when passed a function', function() {
            var result = util.isString(function(){});
            result.should.eql(false);
        });
        
        it('should return false when passed an object', function() {
            var result = util.isString({});
            result.should.eql(false);
        });
    });
    
    describe('Util.isFunction', function() {
        
        it('should return false when passed null', function() {
            var result = util.isFunction(null);
            result.should.eql(false);
        });
        
        it('should return false when passed undefined', function() {
            var result = util.isFunction(undefined);
            result.should.eql(false);
        });
        
        it('should return false when passed an integer', function() {
            var result = util.isFunction(5);
            result.should.eql(false);
        });
        
        it('should return false when passed a float', function() {
            var result = util.isFunction(5.9);
            result.should.eql(false);
        });
        
        it('should return false when passed a boolean', function() {
            var result = util.isFunction(true);
            result.should.eql(false);
        });
        
        it('should return false when passed a string', function() {
            var result = util.isFunction('hello world');
            result.should.eql(false);
        });
        
        it('should return false when passed an array', function() {
            var result = util.isFunction([]);
            result.should.eql(false);
        });
        
        it('should return true when passed a function', function() {
            var result = util.isFunction(function(){});
            result.should.eql(true);
        });
        
        it('should return false when passed an object', function() {
            var result = util.isFunction({});
            result.should.eql(false);
        });
    });
    
    describe('Util.isNullOrUndefined', function() {
        
        it('should return true when passed null', function() {
            var result = util.isNullOrUndefined(null);
            result.should.eql(true);
        });
        
        it('should return true when passed undefined', function() {
            var result = util.isNullOrUndefined(undefined);
            result.should.eql(true);
        });
        
        it('should return false when passed an integer', function() {
            var result = util.isNullOrUndefined(5);
            result.should.eql(false);
        });
        
        it('should return false when passed a float', function() {
            var result = util.isNullOrUndefined(5.9);
            result.should.eql(false);
        });
        
        it('should return false when passed a boolean', function() {
            var result = util.isNullOrUndefined(true);
            result.should.eql(false);
        });
        
        it('should return false when passed a string', function() {
            var result = util.isNullOrUndefined('hello world');
            result.should.eql(false);
        });
        
        it('should return false when passed an array', function() {
            var result = util.isNullOrUndefined([]);
            result.should.eql(false);
        });
        
        it('should return false when passed a function', function() {
            var result = util.isNullOrUndefined(function(){});
            result.should.eql(false);
        });
        
        it('should return false when passed an object', function() {
            var result = util.isNullOrUndefined({});
            result.should.eql(false);
        });
    });
    
    describe('Util.isNullOrUndefined', function() {
        
        it('should return false when passed null', function() {
            var result = util.isBoolean(null);
            result.should.eql(false);
        });
        
        it('should return false when passed undefined', function() {
            var result = util.isBoolean(undefined);
            result.should.eql(false);
        });
        
        it('should return false when passed an integer', function() {
            var result = util.isBoolean(5);
            result.should.eql(false);
        });
        
        it('should return false when passed a float', function() {
            var result = util.isBoolean(5.9);
            result.should.eql(false);
        });
        
        it('should return true when passed a boolean "true"', function() {
            var result = util.isBoolean(true);
            result.should.eql(true);
        });
        
        it('should return true when passed a boolean "false"', function() {
            var result = util.isBoolean(false);
            result.should.eql(true);
        });
        
        it('should return false when passed a string', function() {
            var result = util.isBoolean('hello world');
            result.should.eql(false);
        });
        
        it('should return false when passed an array', function() {
            var result = util.isBoolean([]);
            result.should.eql(false);
        });
        
        it('should return true when passed a function', function() {
            var result = util.isBoolean(function(){});
            result.should.eql(false);
        });
        
        it('should return false when passed an object', function() {
            var result = util.isBoolean({});
            result.should.eql(false);
        });
    });
    
    describe('Util.getDirectories', function() {
        
        it('should throw an error when passed a null path', function() {
            
            util.getDirectories.bind(null, function(err, results) {}).should.throwError();
        });
        
        it('should callback with an error when not passed a valid path', function(done) {
            
            util.getDirectories('&!^!%@!', function(err, results) {
                
                should.exist(err);
                should.not.exist(results);
                done();
            });
        });
        
        it('should callback with an error when not passed an iteger as the path', function() {
            
            util.getDirectories.bind(54, function(err, results) {}).should.throwError();
        });
        
        it('should callback with an array with 2 paths', function(done) {
            
            util.getDirectories('./controllers', function(err, results) {
                
                should.not.exist(err);
                results.should.be.instanceof(Array).and.have.lengthOf(2);
                results.should.containEql(path.join('controllers', 'admin'))
                results.should.containEql(path.join('controllers', 'api'));
                done();
            });
        });
    });
    
    describe('Util.getFiles', function() {
        
        it('should throw an error when passed a null path', function() {
            
            util.getFiles.bind(null, function(err, results) {}).should.throwError();
        });
        
        it('should callback with an error when not passed a valid path', function(done) {
            
            util.getFiles('&!^!%@!', function(err, results) {
                
                should.exist(err);
                should.not.exist(results);
                done();
            });
        });
        
        it('should callback with an error when not passed a valid path to a file', function(done) {
            
            util.getFiles('./controllers/base_controller.js', function(err, results) {
                
                should.exist(err);
                should.not.exist(results);
                done();
            });
        });
        
        it('should callback with an error when not passed a valid path to a file that does not exist', function(done) {
            
            util.getFiles('./controllers/non_existing_controller.js', function(err, results) {
                
                should.exist(err);
                should.not.exist(results);
                done();
            });
        });
        
        it('should callback with an array of 4 files when called with no options and a valid path', function(done) {
            
            util.getFiles('./controllers', function(err, results) {

                should.not.exist(err);
                results.should.be.instanceof(Array);
                should(results.length >= 4).be.ok;
                
                done();
            });
        });
        
        it('should callback with an empty array of file paths', function(done) {
            
            var options = {
                filter: function(/*fullPath, stat*/) {
                    return false;
                }
            };
            util.getFiles('./controllers', options, function(err, results) {

                should.not.exist(err);
                results.should.be.instanceof(Array).and.have.lengthOf(0);
                
                done();
            });
        });
        
        it('should callback with an array containing at least 5 file paths', function(done) {
            
            var options = {
                recursive: true
            };
            util.getFiles('./controllers', options, function(err, results) {

                should.not.exist(err);
                results.should.be.instanceof(Array);
                should(results.length >= 4).be.ok;
                
                done();
            });
        });
    });
    
    describe('Util.mkdirs', function() {
        
        it('should callback with an error when passed a null path', function(done) {
            
            util.mkdirs(null, function(err) {
                
                should.exist(err);
                done();
            });
        });
        
        it('should callback with an error when an absolute file path is not provided', function(done) {
            
            util.mkdirs('./test/playground/'+new Date().getTime(), function(err) {
                
                should.exist(err);
                done();
            });
        });
        
        it('should callback with no error and dir path should exist', function(done) {
            
            var dirsPath = getNextTestDir('mdirs-async');
            util.mkdirs(dirsPath, function(err) {
                
                should.not.exist(err);
                fs.existsSync(dirsPath).should.be.eql(true);
                done();
            });
        });
    });
    
    describe('Util.mkdirsSync', function() {
        
        it('should throw an error when passed a null path', function() {
            
            util.mkdirsSync.bind(null,null).should.throwError();
        });
        
        it('should throw an error when an absolute file path is not provided', function() {
            
            util.mkdirsSync.bind(null, './test/playground/'+new Date().getTime() + '-' + (cnt++)).should.throwError();
        });
        
        it('should return void and dir path should exist', function() {
            
            var dirsPath = getNextTestDir('mdirs-async');
            util.mkdirsSync(dirsPath);
            fs.existsSync(dirsPath).should.be.eql(true);
        });
    });
    
    describe('Util.getExtension', function() {
        
        it('should return null when passed a null path', function() {
            
            var result = util.getExtension(null);
            should.strictEqual(null, result);
        });
        
        it('should return null when passed an empty path', function() {
            
            var result = util.getExtension('');
            should.strictEqual(null, result);
        });
        
        it('should return "" when passed a path with no extension', function() {
            
            var result = util.getExtension(path.join('.', 'controllers', 'config'));
            should.strictEqual(null, result);
        });
        
        it('should return the "yml" extension when pass a path that is prefixed with a period but still provides extension', function() {
            
            var result = util.getExtension('./controllers/.config.yml');
            result.should.eql("yml");
        });
        
        it('should return "gif" when passed a path ending in .gif', function() {
            
            var options = {
                lower: true
            };
            var result = util.getExtension('/hello/world.GiF', options);
            result.should.eql("gif");
        });
    });
    
    describe('Util.inherits', function() {
        
        var staticFuncFor1 = function(){};
        function Type1(){}
        Type1.PROP = 'abc';
        Type1.staticFunc = staticFuncFor1;
        Type1.staticFunc2 = function(){};
        Type1.prototype.instanceFunc = function(){var y = 1;};
        Type1.prototype.instanceFunc2 = function(){var z = 3;};
        
        var staticFuncFor2 = function(){var x = 2;};
        function Type2(){}
        Type2.PROP = 'def';
        Type2.staticFunc = staticFuncFor2
        Type2.prototype.instanceFunc = function(){var j = 8;};
        
        it('should throw an error when null is passed for the first type', function() {
            
            util.inherits.bind(null, null, Type2).should.throwError();
        });
        
        it('should throw an error when null is passed for the second type', function() {
            
            util.inherits.bind(null, Type1, null).should.throwError();
        });
        
        it('should cause Type2 to inherit the prototype function and static functions/properties of type 1', function() {
            
            util.inherits(Type2, Type1);
            
            Type1.PROP.should.eql("abc");
            Type1.staticFunc.should.eql(staticFuncFor1);
            
            Type2.PROP.should.eql("def");
            Type2.staticFunc.should.eql(staticFuncFor2);
            Type2.prototype.instanceFunc.should.eql(Type1.prototype.instanceFunc);
            Type2.prototype.instanceFunc2.should.eql(Type1.prototype.instanceFunc2);
        });
    });
});

var cnt = 0;
var getNextTestDir = function(id) {
    var base = (new Date()).getTime() + '-' + id + '-';
    return path.join(__dirname, '..', 'testrun', base + (cnt++), base + (cnt++));
};
