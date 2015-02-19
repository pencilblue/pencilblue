/*
    Copyright (C) 2014  PencilBlue, LLC

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

$(document).ready(function()
{
    var self = this;
    self.loadingArticles = false;
    self.noMoreArticles = false;
    self.offset = null;
    self.limit = null;

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
            var parameters = [];  

            //Offset
            if(!self.offset && typeof infiniteScrollOffset !== 'undefined'){
                self.offset = infiniteScrollOffset;
            }
            if(self.offset){
                parameters.push({offset: self.offset });
            }

            //Limit
            if(!self.limit && typeof infiniteScrollLimit !== 'undefined'){
                self.limit = infiniteScrollLimit;
            }
            if(self.limit){
                parameters.push({limit: self.limit });
            }
            
            //Section or Topic
            if(typeof infiniteScrollSection !== 'undefined'){
                parameters.push({section: infiniteScrollSection });
            }
            else if(typeof infiniteScrollTopic !== 'undefined'){
                parameters.push({topic: infiniteScrollTopic });
            }

            var query;
            for(var p = 0; p < parameters.length; p++) {
                var parameter = parameters[p];
                for(var key in parameter) {
                    var value = parameter[key];
                    var pair = key + '=' + value;
                    if(!query) { query = '?' + pair; }
                    else { query += '&' + pair; }
                }
            };
            
            var uri = '/api/content/get_articles';
            if(query){ uri += query; }

            $.getJSON(uri, function(result)
            {
                if(!result)
                {
                    return;
                }
                else if(result.data.count === 0)
                {
                    self.noMoreArticles = true;
                    return;
                }

                self.loadingArticles = false;

                if(!self.offset)
                {
                    self.offset = result.data.count * 2;
                    self.limit  = result.data.count;
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
