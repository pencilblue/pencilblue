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
	
	pb.templates.load('xml_feeds/rss', null, null, function(data) {
        var result = ('' + data).split('^language^').join((pb.config.defaultLanguage) ? pb.config.defaultLanguage : 'en-us');
    
        pb.templates.load('xml_feeds/rss/item', null, null, function(itemTemplate) {
            var items = '';
        
            var dao = new pb.DAO();
            
            var where = {publish_date: {$lte: new Date()}};
            var sort  = {publish_date: pb.DAO.DESC};
            dao.query('article', where, pb.DAO.PROJECT_ALL, sort).then(function(articles) {
                
            	pb.users.getAuthors(articles, function(err, articlesWithAuthorNames) {
                    articles = articlesWithAuthorNames;
                    
                    Feed.getSectionNames(articles, function(articlesWithSectionNames) {
                        articles = articlesWithSectionNames;
                        
                        Feed.getMedia(articles, function(articlesWithMedia) {
                            articles = articlesWithMedia;
                            
                            for(var i = 0; i < articles.length && i < 100; i++) {
                                if(i == 0) {
                                    result = result.split('^last_build^').join(Feed.getRSSDate(articles[i].publish_date));
                                }
                                
                                var item = itemTemplate.split('^url^').join('/article/' + articles[i].url);
                                item = item.split('^title^').join(articles[i].headline);
                                item = item.split('^pub_date^').join(Feed.getRSSDate(articles[i].publish_date));
                                item = item.split('^author^').join(articles[i].author_name);
                                item = item.split('^description^').join((articles[i].meta_desc) ? articles[i].meta_desc : articles[i].subheading);
                                item = item.split('^content^').join(articles[i].article_layout);
                                
                                var categories = '';
                                for(var j = 0; j < articles[i].section_names.length; j++) {
                                    categories = categories.concat('<category>' + articles[i].section_names[j] + '</category>');
                                }
                                item  = item.split('^categories^').join(categories);
                                items = items.concat(item);
                            }
                            
                            result = result.split('^items^').join(items);    
                            cb({content: result});
                        });
                    });
                });
            });
        });
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
