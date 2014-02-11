function Pagination(elementClass, elementsPerPage)
{
    var paginatedElements = [];
    var currentIndex = 0;
    var instance = this;
    
    this.renderPagination = function(index)
    {
        var pages = Math.ceil(paginatedElements.length / elementsPerPage);
        if(index > pages -1)
        {
            index = pages - 1;
        }
        if(index < 0)
        {
            index = 0;
        }
        currentIndex = index;
        
        if(pages == 1)
        {
            $('#pagination').hide();
            return;
        }
        else
        {
            $('#pagination').show();
        }
        
        if(index == 0)
        {
            var buttonsString = '<li id="pagination_left" class="disabled"><a href="#"><i class="fa fa-chevron-left"></i></a></li>';
        }
        else
        {
            var buttonsString = '<li id="pagination_left"><a href="#"><i class="fa fa-chevron-left"></i></a></li>';
        }
        
        for(var i = 0; i < pages; i++)
        {
            if(i == index)
            {
                buttonsString = buttonsString.concat('<li id="pagination_' + i + '" class="active"><a href="#">' + (i + 1) + '</a></li>');
            }
            else
            {
                buttonsString = buttonsString.concat('<li id="pagination_' + i + '"><a href="#">' + (i + 1) + '</a></li>');
            }
        }
        
        if(index >= pages - 1)
        {
            buttonsString = buttonsString.concat('<li id="pagination_right" class="disabled"><a href="#"><i class="fa fa-chevron-right"></i></a></li>');
        }
        else
        {
            buttonsString = buttonsString.concat('<li id="pagination_right"><a href="#"><i class="fa fa-chevron-right"></i></a></li>');
        }
        
        $('#pagination').html(buttonsString);
        
        for(var i = 0; i < pages; i++)
        {
            $('#pagination_' + i).click(instance.onPaginationButtonClick);
        }
        $('#pagination_left').click(instance.onPaginationLeftClicked);
        $('#pagination_right').click(instance.onPaginationRightClicked);
        
        $(elementClass).hide();
        for(var i = index * elementsPerPage; i < index * elementsPerPage + elementsPerPage && i < paginatedElements.length; i++)
        {
            paginatedElements[i].show();
        }
    }
    
    this.onPaginationButtonClick = function(event)
    {
        var index = parseInt($(this).attr('id').split('pagination_').join(''));
        instance.renderPagination(index);
    }
    
    this.onPaginationLeftClicked = function()
    {
        if($('#pagination_left').attr('class') != 'disabled')
        {
            instance.renderPagination(currentIndex - 1);
        }
    }
    
    this.onPaginationRightClicked = function()
    {
        if($('#pagination_right').attr('class') != 'disabled')
        {
            instance.renderPagination(currentIndex + 1);
        }
    }
    
    this.initializeElements = function()
    {
        paginatedElements = [];
    
        var i = 0;
        $(elementClass).each(function()
        {
            if($(this).is(':visible'))
            {
                paginatedElements.push($(this));
            }
            i++;
            if(i == $(elementClass).length)
            {
                instance.renderPagination(0);
            }
        });
    }
    
    this.initializeElements();
}
