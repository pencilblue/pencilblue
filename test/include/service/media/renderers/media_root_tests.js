//depedencies
var should = require('should');


describe('BaseMediaRenderer', function() {
  describe('BaseMediaRenderer.getEmbedUrl', function () {
    it('should not modify media id', function () {
      var pb = {config: {siteRoot: 'http://www.test.com', media: {urlRoot: ''}}};
      pb.UrlService = require('../../../../../include/service/entities/url_service.js')(pb);
      var BaseMediaRenderer = require('../../../../../include/service/media/renderers/base_media_renderer.js')(pb);

      var url = BaseMediaRenderer.getEmbedUrl("/media/01/02/test.png");
      url.should.eql("/media/01/02/test.png");
    });

    it('should prepend media root', function () {
      var pb = {config: {siteRoot: 'http://www.test.com', media: {urlRoot: 'http://cdn.test.com'}}};
      pb.UrlService = require('../../../../../include/service/entities/url_service.js')(pb);
      var BaseMediaRenderer = require('../../../../../include/service/media/renderers/base_media_renderer.js')(pb);

      var url = BaseMediaRenderer.getEmbedUrl("/media/01/02/test.png");
      url.should.eql("http://cdn.test.com/media/01/02/test.png");
    });
  });
});

describe('ImageMediaRenderer', function() {
  describe('ImageMediaRenderer.getEmbedUrl', function () {
    it('should prepend media root', function () {
      var pb = {
        config: {siteRoot: 'http://www.test.com', media: {urlRoot: 'http://cdn.test.com'}},
        media: {renderers: {}}
      };
      pb.UrlService = require('../../../../../include/service/entities/url_service.js')(pb);
      pb.media.renderers.BaseMediaRenderer = require('../../../../../include/service/media/renderers/base_media_renderer.js')(pb);
      var ImageMediaRenderer = require('../../../../../include/service/media/renderers/image_media_renderer.js')(pb);

      var url = ImageMediaRenderer.getEmbedUrl("/media/01/02/test.png");
      url.should.eql("http://cdn.test.com/media/01/02/test.png");
    });
  });
});

describe('AudioMediaRenderer', function() {
  describe('AudioMediaRenderer.getEmbedUrl', function () {
    it('should prepend media root', function () {
      var pb = {
        config: {siteRoot: 'http://www.test.com', media: {urlRoot: 'http://cdn.test.com'}},
        media: {renderers: {}}
      };
      pb.UrlService = require('../../../../../include/service/entities/url_service.js')(pb);
      pb.media.renderers.BaseMediaRenderer = require('../../../../../include/service/media/renderers/base_media_renderer.js')(pb);
      var AudioMediaRenderer = require('../../../../../include/service/media/renderers/audio_media_renderer.js')(pb);

      var url = AudioMediaRenderer.getEmbedUrl("/media/01/02/test.mp3");
      url.should.eql("http://cdn.test.com/media/01/02/test.mp3");
    });
  });
});

describe('PdfMediaRenderer', function() {
  describe('PdfMediaRenderer.getEmbedUrl', function () {
    it('should prepend media root', function () {
      var pb = {
        config: {siteRoot: 'http://www.test.com', media: {urlRoot: 'http://cdn.test.com'}},
        media: {renderers: {}}
      };
      pb.UrlService = require('../../../../../include/service/entities/url_service.js')(pb);
      pb.media.renderers.BaseMediaRenderer = require('../../../../../include/service/media/renderers/base_media_renderer.js')(pb);
      var PdfMediaRenderer = require('../../../../../include/service/media/renderers/pdf_media_renderer.js')(pb);

      var url = PdfMediaRenderer.getEmbedUrl("/media/01/02/test.pdf");
      url.should.eql("http://cdn.test.com/media/01/02/test.pdf");
    });
  });
});

describe('VideoMediaRenderer', function() {
  describe('VideoMediaRenderer.getEmbedUrl', function () {
    it('should prepend media root', function () {
      var pb = {
        config: {siteRoot: 'http://www.test.com', media: {urlRoot: 'http://cdn.test.com'}},
        media: {renderers: {}}
      };
      pb.UrlService = require('../../../../../include/service/entities/url_service.js')(pb);
      pb.media.renderers.BaseMediaRenderer = require('../../../../../include/service/media/renderers/base_media_renderer.js')(pb);
      var VideoMediaRenderer = require('../../../../../include/service/media/renderers/video_media_renderer.js')(pb);

      var url = VideoMediaRenderer.getEmbedUrl("/media/01/02/test.webm");
      url.should.eql("http://cdn.test.com/media/01/02/test.webm");
    });
  });
});

describe('VideoMediaRenderer', function() {
  describe('VideoMediaRenderer.getEmbedUrl', function () {
    it('should prepend media root', function () {
      var pb = {
        config: {siteRoot: 'http://www.test.com', media: {urlRoot: 'http://cdn.test.com'}},
        media: {renderers: {}}
      };
      pb.UrlService = require('../../../../../include/service/entities/url_service.js')(pb);
      pb.media.renderers.BaseMediaRenderer = require('../../../../../include/service/media/renderers/base_media_renderer.js')(pb);
      var VideoMediaRenderer = require('../../../../../include/service/media/renderers/video_media_renderer.js')(pb);

      var url = VideoMediaRenderer.getEmbedUrl("/media/01/02/test.webm");
      url.should.eql("http://cdn.test.com/media/01/02/test.webm");
    });
  });
});

describe('YouTubeMediaRenderer', function() {
  describe('YouTubeMediaRenderer.getEmbedUrl', function () {
    it('should not prepend media root', function () {
      var pb = {
        config: {siteRoot: 'http://www.test.com', media: {urlRoot: 'http://cdn.test.com'}},
        media: {renderers: {}}
      };
      pb.UrlService = require('../../../../../include/service/entities/url_service.js')(pb);
      pb.media.renderers.BaseMediaRenderer = require('../../../../../include/service/media/renderers/base_media_renderer.js')(pb);
      var YouTubeMediaRenderer = require('../../../../../include/service/media/renderers/youtube_media_renderer.js')(pb);

      var url = YouTubeMediaRenderer.getEmbedUrl("mediaID");
      url.should.startWith("//www.youtube.com");
      url.indexOf(pb.config.media.urlRoot).should.eql(-1);
    });
  });
});