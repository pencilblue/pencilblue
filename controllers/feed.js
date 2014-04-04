/**
 * Feed - RSS Feed
 * 
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function Feed(){}

//dependencies
var Articles = require('../include/theme/articles');

//inheritance
util.inherits(Feed, pb.BaseController);

Feed.prototype.render = function(cb) {
	var self = this;
	
	this.ts.registerLocal('language', pb.config.defaultLanguage ? pb.config.defaultLanguage : 'en-us');
	this.ts.registerLocal('items', function(flag, cb){
		
		var dao   = new pb.DAO();
        var where = {publish_date: {$lte: new Date()}};
        var sort  = {publish_date: pb.DAO.DESC};
        dao.query('article', where, pb.DAO.PROJECT_ALL, sort).then(function(articles) {
		
			pb.users.getAuthors(articles, function(err, articlesWithAuthorNames) {
	            articles = articlesWithAuthorNames;
	            
	            Feed.getSectionNames(articles, function(articlesWithSectionNames) {
	                articles = articlesWithSectionNames;
	                
	                Feed.getMedia(articles, function(articlesWithMedia) {
	                    articles = articlesWithMedia;
	                    
	                    
	                    var tasks = pb.utils.getTasks(articles, function(articles, i) {
	                    	return function(callback) {
	                    		
	                    		self.ts.registerLocal('url', '/article/' + articles[i].url);
	                    		self.ts.registerLocal('title', articles[i].headline);
	                    		self.ts.registerLocal('pub_date', Feed.getRSSDate(articles[i].publish_date));
	                    		self.ts.registerLocal('author', articles[i].author_name);
	                    		self.ts.registerLocal('description', articles[i].meta_desc ? articles[i].meta_desc : articles[i].subheading);
	                    		self.ts.registerLocal('content', articles[i].article_layout);
	                    		self.ts.registerLocal('categories', function(flag, cb) {
	                    			var categories = '';
	                                for(var j = 0; j < articles[i].section_names.length; j++) {
	                                    categories = categories.concat('<category>' + articles[i].section_names[j] + '</category>');
	                                }
	                                cb(null, categories);
	                    		});
	                    		self.ts.load('xml_feeds/rss/item', callback);
	                    	};
	                    });
	                    async.series(tasks, function(err, results) {
	                    	cb(err, results.join(''));
	                    });
	                });
	            });
			});
        });
	});
	self.ts.load('xml_feeds/rss', function(err, data) {
		cb({content: data});
    });
};


Feed.getSectionNames = function(articles, cb) {
	
	var dao = new pb.DAO();
	dao.query('section', pb.DAO.ANYWHERE, {name: 1}, {parent: 1}).then(function(sections) {
        //TODO handle error
		
		for(var i = 0; i < articles.length; i++) {
            
			var sectionNames = [];
            for(var j = 0; j < articles[i].article_sections.length; j++) {
                
            	for(var o = 0; o < sections.length; o++) {
                    
                	if(sections[o]._id.equals(ObjectID(articles[i].article_sections[j]))) {
                        sectionNames.push(sections[o].name);
                        break;
                    }
                }
            }
            
            articles[i].section_names = sectionNames;
        }
        
        cb(articles);
    });
};

Feed.getMedia = function(articles, cb) {
    var self = this;
    
    this.addMediaToLayout = function(index) {
        if(index >= articles.length) {
            cb(articles);
            return;
        }
    
        Articles.loadMedia(articles[index].article_layout, function(layout) {
            articles[index].article_layout = layout;
            index++;
            self.addMediaToLayout(index);
        });
    };
    
    self.addMediaToLayout(0);
};

Feed.getRSSDate = function(date) {
    
    var dayNames   = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    var monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    function getTrailingZero(number)  {
        if(number < 10) {
            return '0' + number;
        }
        return number;
    }
    
    return dayNames[date.getDay()] + ', ' + date.getDate() + ' ' + monthNames[date.getMonth()] + ' ' + date.getFullYear() + ' ' + getTrailingZero(date.getHours()) + ':' + getTrailingZero(date.getMinutes()) + ':' + getTrailingZero(date.getSeconds()) + ' +0000';
};

//exports
module.exports = Feed;
