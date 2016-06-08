
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
            { v: 'youtube', e: 'youtube' }
        ].forEach(function(testCase) {
            it('should return ' + testCase.e + ' when the type ' + testCase.v + ' is passed', function() {
                MediaServiceV2.getMediaIcon(testCase.v).should.eql(testCase.e);
            });
        });
    });

    describe('MediaServiceV2.generateFilename', function() {

        [true, 1, 2.2, false, null, undefined, [], {}].forEach(function(val) {
            it('should throw error when an invalid value ' + val + ' is passed', function () {
                MediaServiceV2.generateFilename.bind(val).should.throwError();
            });
        });

        it('should append the extension of the original filename to the generated filename', function() {
            var originalFilename = 'selfie.jpg';
            MediaServiceV2.generateFilename(originalFilename).indexOf('.jpg').should.be.greaterThan(0);
        });

        it('should not append an extension to the generated filename when the original does not have one', function() {
            var originalFilename = 'selfie';
            MediaServiceV2.generateFilename(originalFilename).indexOf('.jpg').should.eql(-1);
        });
    });

    describe('MediaServiceV2.generateMediaPath', function() {

        it('should generate a path and filename with the correct extension of the original filename', function() {
            var originalFilename = 'selfie.png';
            var result = MediaServiceV2.generateMediaPath(originalFilename);
            result.indexOf('.png').should.be.greaterThan(0);
            result.indexOf('/media/').should.eql(0);
        });
    });

    describe('MediaServiceV2.getStyleForPosition', function() {

        ['left', 'right', 'center'].forEach(function(val) {
            it('should provide a style when the position '+val+' is passed', function() {
                MediaServiceV2.getStyleForPosition(val).length.should.be.greaterThan(0);
            });
        });

        it('should return an empty string when passed an invalid position', function() {
            MediaServiceV2.getStyleForPosition('somerandomthing').should.eql('');
        });
    });

    describe('MediaServiceV2.getSupportedExtensions', function() {

        it('should provide the default set of extensions', function() {
            var exts = MediaServiceV2.getSupportedExtensions();
            var expected = [
                'jpg',
                'jpeg',
                'pdf',
                'png',
                'svg',
                'webp',
                'gif',
                'mp4',
                'ogg',
                'ogv',
                'webm'
            ];
            exts.length.should.eql(expected.length);
            expected.forEach(function(ext) {
                exts.indexOf(ext).should.not.eql(-1);
            });
        });
    });

    describe('MediaServiceV2.extractNextMediaFlag', function() {

        it('should return null when no media flag is present in the content', function() {
            var result = MediaServiceV2.extractNextMediaFlag('');
            should(result).be.null;
        });

        it('should return null when there is not an end to the media flag', function() {
            var result = MediaServiceV2.extractNextMediaFlag('^media_display_');
            should(result).be.null;
        });

        it('should extract the media flag from the string and parse it', function() {
            MediaServiceV2.extractNextMediaFlag('look here: ^media_display_1881181818/width:21px,height:22%^ hello world').should.eql({
                id: '1881181818',
                style: {
                    width: '21px',
                    height: '22%'
                },
                startIndex: 11,
                endIndex: 58,
                flag: '^media_display_1881181818/width:21px,height:22%^',
                cleanFlag: 'media_display_1881181818/width:21px,height:22%'
            });
        });
    });

    describe('MediaServiceV2.getMediaFlag', function() {

        it('should create a media flag when provided an id and style options', function() {
            MediaServiceV2.getMediaFlag('190abc', {width: '100', height: 28}).should.eql('^media_display_190abc/width:100,height:28^');
        });
    });

    describe('MediaServiceV2.getRenderer', function() {

        it('should retrieve the renderer when provided a valid media URL', function() {
            MediaServiceV2.getRenderer('//hello.world.jpg', false).should.not.be.null;
        });

        it('should return null when a media URL is provided that the registered renderers do not support', function() {
            var result = MediaServiceV2.getRenderer('//hello.world.abc', false);
            should(result).be.null;
        });
    });

    describe('MediaService.formatMedia', function() {

        it('should populate icon and link fields on each media item when passed an array of media entities', function() {
            var media = [
                {
                    media_type: 'youtube',
                    location: 'abcdef'
                }
            ];
            var expected = [
                {
                    media_type: 'youtube',
                    icon: 'youtube',
                    link: 'https://www.youtube.com/watch?v=abcdef',
                    location: 'abcdef'
                }
            ];
            MediaServiceV2.formatMedia(media).should.eql(expected);
        });
    });

    describe('MediaService Renderer Registration', function() {

        it('should successfully register and unregister a provider', function() {
            var renderer = function(){};
            MediaServiceV2.isRegistered(renderer).should.eql(false);
            MediaServiceV2.registerRenderer(renderer).should.eql(true);
            MediaServiceV2.isRegistered(renderer).should.eql(true);
            MediaServiceV2.unregisterRenderer(renderer).should.eql(true);
            MediaServiceV2.isRegistered(renderer).should.eql(false);
        });
    });
});
