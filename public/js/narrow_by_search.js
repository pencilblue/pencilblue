NarrowBySearch = function(searchInput, elementToNarrow, opt)
{
    var instance = this;

    if(!$(searchInput).position() || !$(elementToNarrow).position())
    {
        return;
    }
    
    instance.searchInput = $(searchInput);
    instance.elementToNarrow = $(elementToNarrow);
    
    instance.options =
    {
        searchChildElement: null,
        finishedFunction: null,
        searchButton: null,
        searchText: 'Search',
        clearText: 'x'
    }
    
    for(var key in opt)
    {
        instance.options[key] = opt[key];
    }
    
    instance.onKeyUp = function()
    {
        var searchString = $(instance.searchInput).val().toLowerCase();
        
        if(searchString.length == 0)
        {
            if(instance.options.searchButton)
            {
                $(instance.options.searchButton).html(instance.options.searchText);
            }
            
            var elementCount = $(instance.elementToNarrow).length;
            var elementIndex = 0;
            
            $(instance.elementToNarrow).each(function()
            {
                $(this).show();
                
                elementIndex++;
                if(elementIndex >= elementCount)
                {
                    if(instance.options.finishedFunction)
                    {
                        instance.options.finishedFunction(instance.searchInput);
                    }
                }
            });
        }
        else
        {
            if(instance.options.searchButton)
            {
                $(instance.options.searchButton).html(instance.options.clearText);
            }
            
            var elementCount = $(instance.elementToNarrow).length;
            var elementIndex = 0;
        
            $(instance.elementToNarrow).each(function()
            {
                if(typeof instance.options.searchChildElement !== 'undefined')
                {
                    var element = $(this);
                    var childElementCount = element.find(instance.options.searchChildElement).length;
                    var childElementIndex = 0;
                
                    element.find(instance.options.searchChildElement).each(function()
                    {
                        if($(this).html().toLowerCase().indexOf(searchString) > -1)
                        {
                            element.show();
                        }
                        else
                        {
                            element.hide();
                        }
                        
                        childElementIndex++;
                        if(childElementIndex >= childElementCount)
                        {
                            elementIndex++;
                            if(elementIndex >= elementCount)
                            {
                                if(instance.options.finishedFunction)
                                {
                                    instance.options.finishedFunction(instance.searchInput);
                                }
                            }
                        }
                    });
                    return;
                }
                
                if($(this).html().toLowerCase().indexOf(searchString) > -1)
                {
                    $(this).show();
                }
                else
                {
                    $(this).hide();
                }
                
                elementIndex++;
                if(elementIndex >= elementCount)
                {
                    if(instance.options.finishedFunction)
                    {
                        instance.options.finishedFunction(instance.searchInput);
                    }
                }
            });
        }
    }
    
    instance.clearSearch = function()
    {
        $(instance.searchInput).val('');
        $(instance.searchInput).focus();
        instance.onKeyUp();
    }
    
    $(instance.searchInput).keyup(instance.onKeyUp);
    if(instance.options.searchButton)
    {
        $(instance.options.searchButton).click(instance.clearSearch);
    }
}
