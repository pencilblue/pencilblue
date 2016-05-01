
//depedencies
var should = require('should');
var Configuration = require('../../../../../include/config.js');
var Lib           = require('../../../../../lib');

describe('MediaServiceV2', function() {

    var pb = null;
    var MediaServiceV2 = null;
    before('Initialize the Environment with the default configuration', function(next) {
        this.timeout(10000);

        pb = new Lib(Configuration.getBaseConfig());
        MediaServiceV2 = pb.MediaServiceV2;
        next();
    });

    describe('MediaServiceV2.parseMediaFlag', function() {

        [1, 2.0, false, true, [], {}, null, undefined].forEach(function(val) {

            it('should return null when passed non-string value '+val, function() {
                var result = MediaServiceV2.parseMediaFlag(val);
                (result === null).should.be.ok;
            });
        });

        it('should not blow up when the attribute separator is not present', function() {
            var flag = '^media_display_4567^';
            var result = MediaServiceV2.parseMediaFlag(flag);
            result.id.should.eql('4567');
            result.cleanFlag.should.eql('media_display_4567');
            result.style.should.eql({});
        });

        it('should provide an empty hash of attributes when just a slash is there', function() {
            var flag = '^media_display_4567/^';
            var result = MediaServiceV2.parseMediaFlag(flag);
            result.id.should.eql('4567');
            result.cleanFlag.should.eql('media_display_4567/');
            result.style.should.eql({});
        });

        it('should provide a hash of attributes', function() {
            var flag = '^media_display_4567/max-height:56px,max-width:60%^';
            var result = MediaServiceV2.parseMediaFlag(flag);
            result.id.should.eql('4567');
            result.cleanFlag.should.eql('media_display_4567/max-height:56px,max-width:60%');
            result.style.should.eql({
                'max-height': '56px',
                'max-width': '60%'
            });
        });
    });

    describe('MediaServiceV2.getStyleForPosition', function() {

        ['right', 'left', 'center'].forEach(function(position) {
            it('should return a style for position '+position, function() {
                var result = MediaServiceV2.getStyleForPosition(position);
                result.should.not.eql('');
            });
        });

        ['', null, undefined, 1, 2.9, false, true, [], {}].forEach(function(position) {
            it('should return a style for position '+position, function() {
                var result = MediaServiceV2.getStyleForPosition(position);
                result.should.eql('');
            });
        });
    });
});
