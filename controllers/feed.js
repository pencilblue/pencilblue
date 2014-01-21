// Retrieve the header, body, and footer and return them to the router
this.init = function(request, output)
{
    var instance = this;
    
    getHTMLTemplate('xml_feeds/rss', null, null, function(result)
    {
        result = result.split('^language^').join((pb.config.defaultLanguage) ? pb.config.defaultLanguage : 'en-us');
    
        getHTMLTemplate('xml_feeds/rss/item', null, null, function(itemTemplate)
        {
            var items = '';
        
            getDBObjectsWithValues({object_type: 'article', publish_date: {$lte: new Date()}, $orderby: {publish_date: -1}}, function(articles)
            {
                instance.getAuthorNames(articles, function(articlesWithAuthorNames)
                {
                    articles = articlesWithAuthorNames;
                    
                    instance.getSectionNames(articles, function(articlesWithSectionNames)
                    {
                        articles = articlesWithSectionNames;
                        
                        instance.getMedia(articles, function(articlesWithMedia)
                        {
                            articles = articlesWithMedia;
                            
                            for(var i = 0; i < articles.length && i < 100; i++)
                            {
                                if(i == 0)
                                {
                                    result = result.split('^last_build^').join(instance.getRSSDate(articles[i].publish_date));
                                }
                                
                                var item = itemTemplate.split('^url^').join('/article/' + articles[i].url);
                                item = item.split('^title^').join(articles[i].headline);
                                item = item.split('^pub_date^').join(instance.getRSSDate(articles[i].publish_date));
                                item = item.split('^author^').join(articles[i].author_name);
                                item = item.split('^description^').join((articles[i].meta_desc) ? articles[i].meta_desc : articles[i].subheading);
                                item = item.split('^content^').join(articles[i].article_layout);
                                
                                var categories = '';
                                for(var j = 0; j < articles[i].section_names.length; j++)
                                {
                                    categories = categories.concat('<category>' + articles[i].section_names[j] + '</category>');
                                }
                                item = item.split('^categories^').join(categories);
                                
                                items = items.concat(item);
                            }
                            
                            result = result.split('^items^').join(items);
                                    
                            output({content: result});
                        });
                    });
                });
            });
        });
    });
}

this.getAuthorNames = function(articles, output)
{
    getDBObjectsWithValues({object_type: 'user', admin: {$gte: ACCESS_WRITER}}, function(authors)
    {
        for(var i = 0; i < articles.length; i++)
        {
            var authorName = '';
            for(var j = 0; j < authors.length; j++)
            {
                if(authors[j]._id.equals(ObjectID(articles[i].author)))
                {
                    authorName = (authors[j].first_name) ? authors[j].first_name + ' ' + authors[j].last_name : authors[j].username;
                    break;
                }
            }
            
            articles[i].author_name = authorName;
        }
        
        output(articles);
    });
}

this.getSectionNames = function(articles, output)
{
    getDBObjectsWithValues({object_type: 'section', $orderby: {parent: 1}}, function(sections)
    {
        for(var i = 0; i < articles.length; i++)
        {
            var sectionNames = []
            
            for(var j = 0; j < articles[i].article_sections.length; j++)
            {
                for(var o = 0; o < sections.length; o++)
                {
                    if(sections[o]._id.equals(ObjectID(articles[i].article_sections[j])))
                    {
                        sectionNames.push(sections[o].name);
                        break;
                    }
                }
            }
            
            articles[i].section_names = sectionNames;
        }
        
        output(articles);
    });
}

this.getMedia = function(articles, output)
{
    var instance = this;
    var articleFunctions = require('../include/theme/articles');
    
    this.addMediaToLayout = function(index)
    {
        if(index >= articles.length)
        {
            output(articles);
            return;
        }
    
        articleFunctions.loadMedia(articles[index].article_layout, function(layout)
        {
            articles[index].article_layout = layout;
            index++;
            instance.addMediaToLayout(index);
        });
    }
    
    instance.addMediaToLayout(0);
}

this.getRSSDate = function(date)
{
    var instance = this;
    
    var dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    var monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    function getTrailingZero(number)
    {
        if(number < 10)
        {
            return '0' + number;
        }
        
        return number;
    }
    
    return dayNames[date.getDay()] + ', ' + date.getDate() + ' ' + monthNames[date.getMonth()] + ' ' + date.getFullYear() + ' ' + getTrailingZero(date.getHours()) + ':' + getTrailingZero(date.getMinutes()) + ':' + getTrailingZero(date.getSeconds()) + ' +0000';
}
