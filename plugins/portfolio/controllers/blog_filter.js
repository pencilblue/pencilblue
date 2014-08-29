/**
 * BlogFilter - Responsible for looking up a specific filter (section, article, page, author) and rendering it.
 *
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue, LLC. 2014 All Rights Reserved
 */
function BlogFilter(){}

//dependencies
var Blog = require('./blog.js');

//inheritance
util.inherits(BlogFilter, Blog);


BlogFilter.prototype.render = function(cb) {
    var self    = this;
    var custUrl = this.pathVars.customUrl;
    var dao     = new pb.DAO();

    var fieldToMatch = 'url';
    var objectType = 'section';

    if(self.req.url.indexOf('/preview/') > -1) {
        self.req.pencilblue_preview = this.pathVars.id;
        if(self.req.url.indexOf('/article/') > -1) {
            self.req.pencilblue_article = this.pathVars.id;
        }
        else if(self.req.url.indexOf('/page/') > -1) {
            self.req.pencilblue_page = this.pathVars.id;
        }

        BlogFilter.super_.prototype.render.apply(self, [cb]);
        return;
    }
    else if(self.req.url.indexOf('/article/') > -1) {
        objectType = 'article';
    }
    else if(self.req.url.indexOf('/page/') > -1) {
        objectType = 'page';
    }
    else if(self.req.url.indexOf('/topic/') > -1) {
        self.req.pencilblue_topic = custUrl;
        BlogFilter.super_.prototype.render.apply(self, [cb]);
        return;
    }

    dao.loadByValue(fieldToMatch, custUrl, objectType, function(err, result) {
        if (util.isError(err) || result === null) {
            self.reqHandler.serve404();
            return;
        }

        self.req['pencilblue_' + objectType] = result._id.toString();
        this.result = result;
        BlogFilter.super_.prototype.render.apply(self, [cb]);
    });
};

BlogFilter.prototype.getPageTitle = function() {
    return this.result.name;
};

BlogFilter.getRoutes = function(cb) {
    var routes = [
        {
            method: 'get',
            path: '/section/:customUrl',
            auth_required: false,
            content_type: 'text/html'
        },
        {
            method: 'get',
            path: '/article/:customUrl',
            auth_required: false,
            content_type: 'text/html'
        },
        {
            method: 'get',
            path: '/page/:customUrl',
            auth_required: false,
            content_type: 'text/html'
        },
        {
            method: 'get',
            path: '/topic/:customUrl',
            auth_required: false,
            content_type: 'text/html'
        },
        {
            method: 'get',
            path: "/preview/:type/:id",
            access_level: ACCESS_WRITER,
            auth_required: true,
            content_type: 'text/html'
        }
    ];
    cb(null, routes);
};

//exports
module.exports = BlogFilter;
