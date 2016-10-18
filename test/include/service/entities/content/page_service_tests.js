'use strict';

//dependencies
var should = require('should');
var pb = {};
pb.DAO = require('../../../../../include/dao/dao.js')(pb);
pb.BaseObjectService = require('../../../../../include/service/base_object_service.js')(pb);
pb.ValidationService = require('../../../../../include/validation/validation_service.js')(pb);
pb.ContentObjectService = require('../../../../../include/service/entities/content/content_object_service.js')(pb);
var PageService = require('../../../../../include/service/entities/content/page_service.js')(pb);

describe('PageService', function () {

    describe('PageService.format', function () {

        it('should allow valid values', function () {
            var page = getPage();
            var page2 = getPage();

            // Set expected date to the parsed version of the date being passed to the service
            page2.publish_date = pb.BaseObjectService.getDate(page2.publish_date);

            PageService.format({data: page}, function () {
            });
            should.deepEqual(page, page2);
        });

        it('should sanitize keywords', function () {
            var page = getPage();
            page.meta_keywords = ["A Keyword With <div>HTML</div>", "Another <a href='http://www.test.com'>HTML</a> keyword"];

            PageService.format({data: page}, function () {
            });
            page.meta_keywords[0].should.eql("A Keyword With HTML");
            page.meta_keywords[1].should.eql("Another HTML keyword");
        });
    });

    describe('PageService.merge', function () {

        it('should copy all properties', function () {
            var page = getPage();
            var page2 = {};

            PageService.merge({data: page, object: page2}, function () {
            });
            should.deepEqual(page, page2);
        });
    });

    describe('PageService.validate', function () {

        it('should allow valid values', function (next) {
            // Set  date to the parsed version of the date being passed to the service
            var page = getPage();
            page.publish_date = pb.BaseObjectService.getDate(page.publish_date);

            var context = {
                validationErrors: [],
                data: page,
                service: {
                    validateHeadline: function(context, cb) {
                        cb();
                    }
                }
            };
            PageService.validate(context, function () {

                context.validationErrors.length.should.eql(0);
                next();
            });
        });

        it('should find errors', function (next) {
            var page = getPage();
            page.meta_keywords = "This should be an array, not a string";

            var context = {
                validationErrors: [],
                data: page,
                service: {
                    validateHeadline: function(context, cb) {
                        cb();
                    }
                }
            };
            PageService.validate(context, function () {

                context.validationErrors.length.should.eql(2);
                context.validationErrors[0].field.should.eql("publish_date");
                context.validationErrors[1].field.should.eql("meta_keywords");
                next();
            });
        });
    });
});

var getPage = function () {
    return {
        allow_comments: false,
        draft: 0,
        page_media: undefined,
        page_topics: undefined,
        author: "507f191e810c19729de860ea", // Random MongoDB compatible object ID
        template: undefined,
        thumbnail: null,
        headline: "Test Headline",
        subheading: "Test Subheading",
        page_layout: "Simple Page Layout",
        focus_keyword: "Testing",
        seo_title: "SEO Title",
        meta_desc: "This is a test page",
        url: "http://test-size.com/page/test-page",
        publish_date: "2015-09-08T01:55:28+00:00", // ISO Format
        meta_keywords: ["Keyword One", "Keyword Two", "Keyword Three"]
    };
};
