
//depedencies
var should = require('should');
var pb = {};
pb.DAO = require('../../../../../include/dao/dao.js')(pb);
pb.BaseObjectService = require('../../../../../include/service/base_object_service.js')(pb);
pb.ValidationService = require('../../../../../include/validation/validation_service.js')(pb);
pb.ContentObjectService = require('../../../../../include/service/entities/content/content_object_service.js')(pb);
var ArticleServiceV2 = require('../../../../../include/service/entities/content/article_service_v2.js')(pb);

describe('ArticleServiceV2', function() {
  describe('ArticleServiceV2.format', function () {
    it('should allow valid values', function () {
      var article = getArticle();
      var article2 = getArticle();

      // Set expected date to the parsed version of the date being passed to the service
      article2.publish_date = pb.BaseObjectService.getDate(article2.publish_date);

      ArticleServiceV2.format({data: article}, function() {});
      should.deepEqual(article, article2);
    });

    it('should sanitize keywords', function () {
      var article = getArticle();
      article.meta_keywords = ["A Keyword With <div>HTML</div>", "Another <a href='http://www.test.com'>HTML</a> keyword"];

      ArticleServiceV2.format({data: article}, function() {});
      article.meta_keywords[0].should.eql("A Keyword With HTML");
      article.meta_keywords[1].should.eql("Another HTML keyword");
    });
  });

  describe('ArticleServiceV2.merge', function () {
    it('should copy all properties', function () {
      var article = getArticle();
      var article2 = {};

      ArticleServiceV2.merge({data: article, object: article2}, function() {});
      should.deepEqual(article, article2);
    });
  });

  describe('ArticleServiceV2.validate', function () {
    it('should allow valid values', function () {
      var article = getArticle();
      var errors = [];

      // Set  date to the parsed version of the date being passed to the service
      article.publish_date = pb.BaseObjectService.getDate(article.publish_date);

      ArticleServiceV2.validate({data: article, validationErrors: errors}, function() {});
      errors.length.should.eql(0);
    });

    it('should find errors', function () {
      var article = getArticle();
      var errors = [];

      article.meta_keywords = "This should be an array, not a string";

      ArticleServiceV2.validate({data: article, validationErrors: errors}, function() {});

      errors.length.should.eql(2);
      errors[0].field.should.eql("publish_date");
      errors[1].field.should.eql("meta_keywords");
    });
  });
});

var getArticle = function() {
  return {
    allow_comments: false,
    draft: 0,
    article_media: undefined,
    article_sections: undefined,
    article_topics: undefined,
    author: "507f191e810c19729de860ea", // Random MongoDB compatible object ID
    template: undefined,
    thumbnail: null,
    headline: "Test Headline",
    subheading: "Test Subheading",
    article_layout: "Simple Page Layout",
    focus_keyword: "Testing",
    seo_title: "SEO Title",
    meta_desc: "This is a test article",
    url: "http://test-size.com/article/test-article",
    publish_date: "2015-09-08T01:55:28+00:00", // ISO Format
    meta_keywords: ["Keyword One", "Keyword Two", "Keyword Three"]
  }
};