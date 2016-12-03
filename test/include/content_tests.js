//dependencies
var should        = require('should');
var Configuration = require('../../include/config.js');
var Lib           = require('../../lib');

describe('Content', function() {

    var pb = null;
    var ContentService = null;
    before('Initialize the Environment with the default configuration', function() {
        this.timeout(10000);

        pb = new Lib(Configuration.getBaseConfig());
        ContentService = pb.ContentService;
    });

    describe('ContentService.getDefaultSettings', function() {

        it('should return the correct default settings', function() {
            var settings = ContentService.getDefaultSettings();

            settings.should.be.an.Object();
            settings.should.deepEqual({
                articles_per_page: 5,
                auto_break_articles: 0,
                read_more_text: 'Read more',
                display_timestamp: 1,
                date_format: 'M dd, YYYY',
                two_digit_date: 0,
                display_hours_minutes: 1,
                time_format: '12',
                two_digit_time: 0,
                display_bylines: 1,
                display_author_photo: 1,
                display_author_position: 1,
                allow_comments: 1,
                default_comments: 1,
                require_account: 0,
                require_verification: 0
            });
        });
    });
});
