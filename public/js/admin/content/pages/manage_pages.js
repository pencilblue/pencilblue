var pages = null;
var pageTemplate = '';
var pagesPerPage = 20;

function setPages(pgs)
{
    pages = pgs;
    pageTemplate = $('#page_template').html();
    $('#page_template').remove();
    
    setupPagination();
    setPageRows(0);
}

function setupPagination()
{
    var pageCount = Math.ceil(pages.length / pagesPerPage);
    if(pageCount <= 1)
    {
        return;
    }
    
    for(var i = 0; i < pageCount; i++)
    {
        $('#pages_pagination').append('<li id="page_page_' + i + '" class="page_page_button"><a href="javascript:setPageRows(' + i + ')">' + (i + 1) + '</a></li>');
    }
}

function setPageRows(index, sortField, sortOrder)
{
    var sortedPages = pages;

    if(typeof sortField !== 'undefined')
    {
        sortedPages = sortPages(sortField, sortOrder);
    }
    
    $('.page_row').remove();
    for(var i = index; i < index + pagesPerPage && i < pages.length; i++)
    {
        var pageRow = pageTemplate.split('^headline^').join(pages[i].headline);
        pageRow = pageRow.split('^url^').join(pages[i].url);
        pageRow = pageRow.split('^author^').join(pages[i].author_name);
        pageRow = pageRow.split('^publish_date^').join(getDatetimeText(new Date(pages[i].publish_date)));
        pageRow = pageRow.split('^page_id^').join(pages[i]._id);
        
        $('#pages_table').append(pageRow);
    }
    
    $('.page_page_button').attr('class', 'page_page_button');
    $('#page_page_' + index).attr('class', 'page_page_button active');
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

function editPage(siteRoot, pageID)
{
    $('#pages_content').html('<div class="row" style="padding-top: 100px;"><div class="col-md-4 col-md-offset-4"><div class="progress progress-striped active"><div class="progress-bar"  role="progressbar" aria-valuenow="100" aria-valuemin="0" aria-valuemax="100" style="width: 100%"></div></div></div></div>');
    $('#pages_content').load(siteRoot + '/admin/content/pages/edit_page?id=' + pageID);
    
    $('#sub_nav li').each(function()
    {
        $(this).attr('class', '');
    });
}

function confirmDeletePage(siteRoot, pageID, pageName)
{
    $('#delete_name').html(pageName);
    $('#delete_button').attr('onclick', 'window.location = "' + siteRoot + '/actions/admin/content/pages/delete_page?id=' + pageID + '"');
    $('#confirm_delete_modal').modal({backdrop: 'static', keyboard: true});
}
