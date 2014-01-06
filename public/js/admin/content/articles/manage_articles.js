var articles = null;
var articleTemplate = '';
var articlesPerPage = 20;

function setArticles(artcls)
{
    articles = artcls;
    articleTemplate = $('#article_template').html();
    $('#article_template').remove();
    
    setupPagination();
    setArticleRows(0);
}

function setupPagination()
{
    var pageCount = Math.ceil(articles.length / articlesPerPage);
    if(pageCount <= 1)
    {
        return;
    }
    
    for(var i = 0; i < pageCount; i++)
    {
        $('#articles_pagination').append('<li id="article_page_' + i + '" class="article_page_button"><a href="javascript:setArticleRows(' + i + ')">' + (i + 1) + '</a></li>');
    }
}

function setArticleRows(index, sortField, sortOrder)
{
    var sortedArticles = articles;

    if(typeof sortField !== 'undefined')
    {
        sortedArticles = sortArticles(sortField, sortOrder);
    }
    
    $('.article_row').remove();
    for(var i = index; i < index + articlesPerPage && i < articles.length; i++)
    {
        var articleRow = articleTemplate.split('^headline^').join(articles[i].headline);
        articleRow = articleRow.split('^url^').join(articles[i].url);
        articleRow = articleRow.split('^author^').join(articles[i].author_name);
        articleRow = articleRow.split('^publish_date^').join(getDatetimeText(new Date(articles[i].publish_date)));
        articleRow = articleRow.split('^article_id^').join(articles[i]._id);
        
        $('#articles_table').append(articleRow);
    }
    
    $('.article_page_button').attr('class', 'article_page_button');
    $('#article_page_' + index).attr('class', 'article_page_button active');
}

function getDatetimeText(date)
{
    var datetime = date.getFullYear() + '-' + getExtraZero(date.getMonth() + 1) + '-' + getExtraZero(date.getDate()) + ' ';
    datetime += getExtraZero(date.getHours()) + ':' + getExtraZero(date.getMinutes());
    
    return datetime;
}

function getExtraZero(dateNumber)
{
    if(dateNumber < 10)
    {
        dateNumber = '0' + dateNumber;
    }
    
    return dateNumber;
}

function editArticle(siteRoot, articleID)
{
    $('#articles_content').html('<div class="row" style="padding-top: 100px;"><div class="col-md-4 col-md-offset-4"><div class="progress progress-striped active"><div class="progress-bar"  role="progressbar" aria-valuenow="100" aria-valuemin="0" aria-valuemax="100" style="width: 100%"></div></div></div></div>');
    $('#articles_content').load(siteRoot + '/admin/content/articles/edit_article?id=' + articleID);
    
    $('#sub_nav li').each(function()
    {
        $(this).attr('class', '');
    });
}

function confirmDeleteArticle(siteRoot, articleID, articleName)
{
    $('#delete_name').html(articleName);
    $('#delete_button').attr('onclick', 'window.location = "' + siteRoot + '/actions/admin/content/articles/delete_article?id=' + articleID + '"');
    $('#confirm_delete_modal').modal({backdrop: 'static', keyboard: true});
}
