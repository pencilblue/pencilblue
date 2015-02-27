
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
});