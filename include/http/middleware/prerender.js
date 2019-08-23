const url = require('url');
const request = require('request-promise');
const zlib = require('zlib');

// This is based on https://github.com/RisingStack/koa-prerender
module.exports = pb => ({
    prerender: async (req, res) => {
        try {
            const enablePrerender = pb.config && pb.config.flags && pb.config.flags.enablePrerender;
            const siteObj = pb.RequestHandler.sites[req.handler.hostname];
            const enableSitePrerender = siteObj && siteObj.enableSitePrerender;

            if (!enablePrerender && !enableSitePrerender) return;

            const option = {
                userAgent: req.headers['user-agent'],
                bufferAgent: req.headers['x-bufferbot'],
                method: req.method,
                url: req.url
            };

            if (!shouldPreRender(option)) return;

            const content = await getPrerenderedPage(req);
            await renderResponse(req, content);

        } catch(ex) {
            // Just go normally path if there is any errors happen.
            console.log(ex);
        }
    }
});

const extensionsToIgnore = [
    '.js',
    '.css',
    '.xml',
    '.less',
    '.png',
    '.jpg',
    '.jpeg',
    '.gif',
    '.pdf',
    '.doc',
    '.txt',
    '.ico',
    '.rss',
    '.zip',
    '.mp3',
    '.rar',
    '.exe',
    '.wmv',
    '.doc',
    '.avi',
    '.ppt',
    '.mpg',
    '.mpeg',
    '.tif',
    '.wav',
    '.mov',
    '.psd',
    '.ai',
    '.xls',
    '.mp4',
    '.m4a',
    '.swf',
    '.dat',
    '.dmg',
    '.iso',
    '.flv',
    '.m4v',
    '.torrent'
];

const crawlerUserAgents = [
    'googlebot',
    'Yahoo! Slurp',
    'bingbot',
    'yandex',
    'baiduspider',
    'facebookexternalhit',
    'twitterbot',
    'rogerbot',
    'linkedinbot',
    'embedly',
    'quora link preview',
    'showyoubot',
    'outbrain',
    'pinterest/0.',
    'developers.google.com/+/web/snippet',
    'slackbot',
    'vkShare',
    'W3C_Validator',
    'redditbot',
    'Applebot',
    'WhatsApp',
    'flipboard',
    'tumblr',
    'bitlybot',
    'SkypeUriPreview',
    'nuzzel',
    'Discordbot',
    'Google Page Speed',
    'Qwantify',
    'pinterestbot',
    'Bitrix link preview',
    'XING-contenttabreceiver',
    'Chrome-Lighthouse'
];

function shouldPreRender(options) {
    var hasExtensionToIgnore = extensionsToIgnore.some(function (extension) {
        return options.url.indexOf(extension) !== -1;
    });

    var isBot = crawlerUserAgents.some(function (crawlerUserAgent) {
        return options.userAgent.toLowerCase().indexOf(crawlerUserAgent.toLowerCase()) !== -1;
    });

    // do not pre-rend when:
    if (!options.userAgent) {
        return false;
    }

    if (options.method !== 'GET') {
        return false;
    }

    if (hasExtensionToIgnore) {
        return false;
    }

    // do pre-render when:
    var query = url.parse(options.url, true).query;
    if (query && query['_escaped_fragment_']) {
        return true;
    }

    if (options.bufferAgent) {
        return true;
    }

    return isBot;
}

function getPrerenderedPage(req) {
    var options = {
        uri: url.parse(buildApiUrl(req)),
        followRedirect: false,
        headers: {}
    };

    Object.keys(req.headers).forEach(function (h) {
        // Forwarding the host header can cause issues with server platforms that require it to match the URL
        if (h == 'host') {
            return;
        }
        options.headers[h] = req.headers[h];
    });

    options.headers['X-Prerender-Token'] = process.env.PRERENDER_TOKEN;

    delete options.headers['User-Agent'];
    return request.get(options);
};

function buildApiUrl(req) {
    const prerenderUrl = process.env.PRERENDER_SERVICE_URL || 'https://service.prerender.io/';
    const forwardSlash = prerenderUrl.indexOf('/', prerenderUrl.length - 1) !== -1 ? '' : '/';

    var fullUrl = getProtocol(req) + "://" + getHost(req) + req.url;
    return prerenderUrl + forwardSlash + fullUrl;
};

function getProtocol(req) {
    let protocol = req.connection.encrypted ? "https" : "http";
    if (req.headers['cf-visitor']) {
        var match = req.headers['cf-visitor'].match(/"scheme":"(http|https)"/);
        if (match) protocol = match[1];
    }
    if (req.headers['x-forwarded-proto']) {
        protocol = req.headers['x-forwarded-proto'].split(',')[0];
    }

    return protocol;
}

function getHost(req) {
    return req.headers['x-forwarded-host'] || req.headers['host'];
}

function renderResponse(req, content) {
    req.handler.resp.statusCode = 200;

    const data = {
        content: content,
        content_type: 'text/html'
    };

    req.handler.req.controllerResult = data;
    req.handler.writeResponse(data);

    req.router.continueAfter('writeResponse');
}
