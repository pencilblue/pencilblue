
//depedencies
var should          = require('should');
var UrlService      = require('../../../../../include/service/entities/url_service.js')({config: {siteRoot: 'http://www.test.com', multisite: { enabled: false}}});
var ArticleRenderer = require('../../../../../include/service/entities/content/article_renderer.js')(
    {
        UrlService: UrlService,
        CommentService: function(){},
        SiteService: { getCurrentSite: function(){} },
        UserService: function(){}
    });
var fakeContext = {site: 'PencilBlue', onlyThisSite: true};

describe('ArticleRenderer', function() {
    describe('ArticleRenderer.containsReadMoreFlag', function() {
        it('should recognize read_more flags', function() {
            var article = getArticle();

            var renderer = new ArticleRenderer(fakeContext);
            var containsReadMore = renderer.containsReadMoreFlag(article);
            containsReadMore.should.eql(true);
        });
    });

    describe('ArticleRenderer.formatLayoutForReadMore', function() {

        it('should create read more links', function() {
            var article = getArticle();
            var context = {
                readMore: true,
                contentSettings: {read_more_text: 'Read More'}
            };

            var service = new ArticleRenderer(fakeContext);
            service.formatLayoutForReadMore(article, context);
            article.article_layout.indexOf('<a href="http://www.test.com/article/test_article">Read More</a>').should.be.above(0);
        });

        it('should remove extra read more links', function() {
            var article = getArticle();
            article.article_layout += "^read_more^^read_more^";

            var context = {
                readMore: true,
                contentSettings: {read_more_text: 'Read More'}
            };

            var service = new ArticleRenderer(fakeContext);
            service.formatLayoutForReadMore(article, context);

            var count = (article.article_layout.match(/Read More/g)).length;
            count.should.eql(1);
        });

        it('should render full article without read more links', function() {
            var article = getArticle();

            var context = {
                readMore: false,
                contentSettings: {read_more_text: 'Read More'}
            };

            var service = new ArticleRenderer(fakeContext);
            service.formatLayoutForReadMore(article, context);

            article.article_layout.indexOf('Read More').should.be.below(0);
        });

    });

});

var getArticle = function() {
    return {
        url: 'test_article',
        article_layout: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.^read_more^Suspendisse vitae volutpat ipsum."
    };
};
