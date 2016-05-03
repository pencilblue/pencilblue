
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

    describe('MediaServiceV2.isFile', function() {

        [null, 1, undefined, 2.2, true, false].forEach(function(val) {
            it('should throw when passed a non string value '+val, function() {
                MediaServiceV2.isFile.bind(val).should.throwError();
            });
        });

        ['http', '//', 'https://', 'http://go.for.it/gotIt.jpg', '//go.for.it/gotIt.jpg'].forEach(function(val) {
            it('should return true when passed a string with a valid file prefix "'+val+'"', function() {
                MediaServiceV2.isFile(val).should.eql(false);
            });
        });

        ['htt', '/go.for.it', '/var/lib', 'go.for.it/gotIt.jpg', ' //', ' http'].forEach(function(val) {
            it('should return false when passed a string with a valid file prefix "'+val+'"', function() {
                MediaServiceV2.isFile(val).should.eql(true);
            });
        });
    });

    describe('MediaServiceV2.isFile', function() {

        it('should throw when an invalid renderer is passed', function() {
            MediaServiceV2.getStyleForView.bind(null, 'view', {}).should.throwError();
        });

        it('should retrieve the base style from the renderer and apply the overrides', function() {
            var renderer = {
                getStyle: function(view) {
                    return {
                        width: '100px',
                        height: '200px'
                    }
                }
            };

            var overrides = {
                height: '201px'
            };
            var result = MediaServiceV2.getStyleForView(renderer, 'editor', overrides);
            result.should.eql({
                width: '100px',
                height: '201px'
            });
        });
    });

    describe('MediaServiceV2.getMediaIcon', function() {

        [true, 1, 2.2, false, null, undefined, 'something', ''].forEach(function(val) {
            it('should return empty string when an invalid type ' + val + ' is provided', function() {
                MediaServiceV2.getMediaIcon(val).should.eql('');
            });
        });

        [
            { v: 'image', e: 'picture-o' },
            { v: 'audio', e: '' },
            { v: 'dailymotion', e: '' },
            { v: 'instagram', e: 'instagram' },
            { v: 'kickstarter', e: 'dollar' },
            { v: 'pdf', e: 'file-pdf-o' },
            { v: 'slideshare', e: 'list-alt' },
            { v: 'storify', e: 'arrow-circle-right' },
            { v: 'trinket', e: 'key fa-flip-horizontal' },
            { v: 'video', e: 'film' },
            { v: 'vimeo', e: 'vimeo-square' },
            { v: 'vine', e: 'vine' },
            { v: 'youtube', e: 'youtube' },
        ].forEach(function(testCase) {
            it('should return ' + testCase.e + ' when the type ' + testCase.v + ' is passed', function() {
                MediaServiceV2.getMediaIcon(testCase.v).should.eql(testCase.e);
            });
        });
    });
});
