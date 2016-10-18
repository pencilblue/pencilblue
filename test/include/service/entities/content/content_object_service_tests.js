'use strict';

//dependencies
var should = require('should');
var TestHelpers = require('../../../../test_helpers');

describe('ContentObjectService', function() {

    TestHelpers.registerReset();

    describe('ContentObjectService.validateHeadline', function() {

        [null, undefined, '', 1, true, false, {}, [], function(){}].forEach(function(val) {
            it('should set a validation error when the headline is an invalid format: '+val, function(next) {
                var service = new this.pb.ContentObjectService({type: 'article'});
                var context = {
                    data: {
                        headline: val
                    },
                    validationErrors: [],
                    service: service
                };

                service.validateHeadline(context, function(err) {
                    should(err).eql(undefined);
                    context.validationErrors.length.should.eql(1);
                    context.validationErrors[0].field.should.eql('headline');
                    should(context.validationErrors[0].code).eql(null);
                    context.validationErrors[0].message.should.eql('The headline is required');
                    next();
                });
            });
        });

        it('should set a validation error when the headline is not unique when creating a new piece of content', function(next) {
            var service = new this.pb.ContentObjectService({type: 'page'});
            service.dao = {
                unique: function(type, where, exclusionId, cb) {
                    type.should.eql('page');
                    where.should.eql({headline: 'Hello World'});
                    should(exclusionId).eql(undefined);
                    cb(null, false);
                }
            };
            var context = {
                data: {
                    headline: 'Hello World'
                },
                validationErrors: [],
                service: service
            };

            service.validateHeadline(context, function(err) {
                should(err).eql(null);
                context.validationErrors.length.should.eql(1);
                context.validationErrors[0].field.should.eql('headline');
                should(context.validationErrors[0].code).eql(null);
                context.validationErrors[0].message.should.eql('The headline must be unique');
                next();
            });
        });

        it('should set a validation error when the headline is not unique when updating an existing piece of content', function(next) {
            var service = new this.pb.ContentObjectService({type: 'page'});
            service.dao = {
                unique: function(type, where, exclusionId, cb) {
                    type.should.eql('page');
                    where.should.eql({headline: 'Hello World'});
                    should(exclusionId).eql('abcdefghijkl');
                    cb(null, false);
                }
            };
            var context = {
                data: {
                    _id: 'abcdefghijkl',
                    headline: 'Hello World'
                },
                validationErrors: [],
                service: service
            };

            service.validateHeadline(context, function(err) {
                should(err).eql(null);
                context.validationErrors.length.should.eql(1);
                context.validationErrors[0].field.should.eql('headline');
                should(context.validationErrors[0].code).eql(null);
                context.validationErrors[0].message.should.eql('The headline must be unique');
                next();
            });
        });

        it('should not set a validation error when the headline is a non-empty string and unique', function(next) {
            var service = new this.pb.ContentObjectService({type: 'page'});
            service.dao = {
                unique: function(type, where, exclusionId, cb) {
                    type.should.eql('page');
                    where.should.eql({headline: 'Hello World'});
                    should(exclusionId).eql('abcdefghijkl');
                    cb(null, true);
                }
            };
            var context = {
                data: {
                    _id: 'abcdefghijkl',
                    headline: 'Hello World'
                },
                validationErrors: [],
                service: service
            };

            service.validateHeadline(context, function(err) {
                should(err).eql(null);
                context.validationErrors.length.should.eql(0);
                next();
            });
        });
    });
});
