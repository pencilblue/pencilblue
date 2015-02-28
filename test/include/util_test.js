
//dependencies
var async  = require('async');
var should = require('should');
var util   = require('../../include/util.js');

describe('util', function() {
    
    describe('util.clone', function() {
        
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
    
    describe('util.deepMerge', function() {
        
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
    
    describe('util.ane', function() {
        
        it('should throw when an error is present', function() {
            
            var err = new Error('expected');
            util.ane.bind(null, err).should.throwError();
        });
        
        it('should not throw when an error is present', function() {
            
            var err = null;
            util.ane.bind(null, err).should.not.throwError();
        });
    });
    
    describe('util.initArray', function() {
        
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
    
    describe('util.escapeRegexp', function() {
        
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
    
    describe('util.merge', function() {
        
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
    
    describe('util.union', function() {
        
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
    
    describe('util.getTasks', function() {
        
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
    
    describe('util.wrapTask', function() {
        
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
    
    describe('util.forEach', function() {
        
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
    
    describe('util.arrayToHash', function() {
        
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
    
    describe('util.arrayToObj', function() {
        
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
    
    describe('util.objArrayToHash', function() {
        
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
    
    describe('util.hashToArray', function() {
        
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
    
    describe('util.invertHash', function() {
        
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
    
    describe('util.copyArray', function() {
        
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
    
    describe('util.arrayPushAll', function() {
        
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
    
    describe('util.uniqueId', function() {
        
        it('should return a unique string of characters, length 36', function() {
            var result = util.uniqueId();
            result.should.be.type('string');
            result.should.be.length(36);
        });
    });
    
    describe('util.isObject', function() {
        
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
    
    describe('util.isString', function() {
        
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
    
    describe('util.isFunction', function() {
        
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
});