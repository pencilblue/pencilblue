
//dependencies
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
});