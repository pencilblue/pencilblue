$(document).ready(function()
{
    var self = this;
    self.loadingArticles = false;
    self.noMoreArticles = false;
    self.offset = null;

    $(document).scroll(function()
    {
        if(self.loadingArticles || self.noMoreArticles)
        {
            return;
        }
    
        var documentHeight = $(document).height();
        var scrollPosition = $(document).scrollTop() + $(window).height();
        
        if(scrollPosition >= documentHeight - 200)
        {
            self.loadingArticles = true;
            var parameters = (self.offset) ? '?offset=' + self.offset + '&limit=' + self.limit : '';
            $.getJSON('/api/content/get_articles' + parameters, function(result)
            {
                if(!result)
                {
                    return;
                }
                else if(result.data.length == 0)
                {
                    self.noMoreArticles = true;
                    return;
                }
                
                self.loadingArticles = false;
                
                if(!self.offset)
                {
                    self.offset = result.data.count * 2;
                }
                else
                {
                    self.offset += result.data.count;
                }
                
                $('#articles').append(result.data.articles);
            });
        }
    });
});
