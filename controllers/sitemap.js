// Retrieve the header, body, and footer and return them to the router
this.init = function(request, output)
{
    var instance = this;

    getHTMLTemplate('xml_feeds/sitemap', null, null, function(result)
    {        
        getHTMLTemplate('xml_feeds/sitemap/url', null, null, function(urlTemplate)
        {
            var urls = '';
        
            getDBObjectsWithValues({object_type: 'section'}, function(sections)
            {
                for(var i = 0; i < sections.length; i++)
                {
                    var url = urlTemplate.split('^url^').join('/' + sections[i].url);
                    url = url.split('^last_mod^').join(instance.getLastModDate(sections[i].last_modified));
                    url = url.split('^change_freq^').join('daily');
                    url = url.split('^priority^').join('0.5');
                    
                    urls = urls.concat(url);
                }
                
                getDBObjectsWithValues({object_type: 'page', publish_date: {$lte: new Date()}}, function(pages)
                {
                    for(var i = 0; i < pages.length; i++)
                    {
                        var url = urlTemplate.split('^url^').join('/page/' + pages[i].url);
                        url = url.split('^last_mod^').join(instance.getLastModDate(pages[i].last_modified));
                        url = url.split('^change_freq^').join('daily');
                        url = url.split('^priority^').join('1.0');
                        
                        urls = urls.concat(url);
                    }
                    
                    getDBObjectsWithValues({object_type: 'article', publish_date: {$lte: new Date()}}, function(articles)
                    {
                        for(var i = 0; i < articles.length; i++)
                        {
                            var url = urlTemplate.split('^url^').join('/page/' + articles[i].url);
                            url = url.split('^last_mod^').join(instance.getLastModDate(articles[i].last_modified));
                            url = url.split('^change_freq^').join('daily');
                            url = url.split('^priority^').join('1.0');
                            
                            urls = urls.concat(url);
                        }
                    
                        result = result.split('^urls^').join(urls);
                        
                        output({content: result});
                    });
                });
            });
        });
    });
}

this.getLastModDate = function(date)
{
    var month = date.getMonth() + 1;
    if(month < 10)
    {
        month = '0' + month;
    }
    var day = date.getDate();
    if(day < 10)
    {
        day = '0' + day;
    }

    return date.getFullYear() + '-' + month + '-' + day;
}
