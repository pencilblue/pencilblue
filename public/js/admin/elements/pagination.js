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

function Pagination(container, elementClass, elementsPerPage, skipVisible)
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

        if(pages <= 1)
        {
            $('#' + container).hide();
            return;
        }
        else
        {
            $('#' + container).show();
        }

        if(index == 0)
        {
            var buttonsString = '<li id="' + container + '_left" class="disabled"><a><i class="fa fa-chevron-left"></i></a></li>';
        }
        else
        {
            var buttonsString = '<li id="' + container + '_left"><a><i class="fa fa-chevron-left"></i></a></li>';
        }

        for(var i = 0; i < pages; i++)
        {
            if(i == index)
            {
                buttonsString = buttonsString.concat('<li id="' + container + '_' + i + '" class="active"><a>' + (i + 1) + '</a></li>');
            }
            else
            {
                buttonsString = buttonsString.concat('<li id="' + container + '_' + i + '"><a>' + (i + 1) + '</a></li>');
            }
        }

        if(index >= pages - 1)
        {
            buttonsString = buttonsString.concat('<li id="' + container + '_right" class="disabled"><a><i class="fa fa-chevron-right"></i></a></li>');
        }
        else
        {
            buttonsString = buttonsString.concat('<li id="' + container + '_right"><a><i class="fa fa-chevron-right"></i></a></li>');
        }

        $('#' + container).html(buttonsString);

        for(var i = 0; i < pages; i++)
        {
            $('#' + container + '_' + i).click(instance.onPaginationButtonClick);
        }
        $('#' + container + '_left').click(instance.onPaginationLeftClicked);
        $('#' + container + '_right').click(instance.onPaginationRightClicked);

        $(elementClass).hide();
        for(var i = index * elementsPerPage; i < index * elementsPerPage + elementsPerPage && i < paginatedElements.length; i++)
        {
            paginatedElements[i].show();
        }
    }

    this.onPaginationButtonClick = function(event)
    {
        var index = parseInt($(this).attr('id').split(container + '_').join(''));
        instance.renderPagination(index);
    }

    this.onPaginationLeftClicked = function()
    {
        if($('#' + container + '_left').attr('class') != 'disabled')
        {
            instance.renderPagination(currentIndex - 1);
        }
    }

    this.onPaginationRightClicked = function()
    {
        if($('#' + container + '_right').attr('class') != 'disabled')
        {
            instance.renderPagination(currentIndex + 1);
        }
    }

    this.initializeElements = function(skipVisible)
    {
        paginatedElements = [];

        if(typeof skipVisible !== 'boolean')
        {
            skipVisible = false;
        }

        var i = 0;
        $(elementClass).each(function()
        {
            if($(this).is(':visible') || skipVisible)
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

    this.initializeElements(skipVisible);
}
