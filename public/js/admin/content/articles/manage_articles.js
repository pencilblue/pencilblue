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

var tableSort;

$(document).ready(function()
{
    new jNarrow('#article_search', '.article_row',
    {
        searchChildElement: '.article_headline',
        searchButton: '#article_search_button',
        searchText: '<i class="fa fa-search"></i>',
        clearText: '<i class="fa fa-times"></i>',
    });

    tableSort = new TableSort(
    {
        table: '#articles_table',
        rowClass: '.article_row',
        sortFields:
        [
            {
                header: '#article_headline_header',
                textContainer: '.article_headline'
            },
            {
                header: '#article_status_header',
                textContainer: '.article_status'
            },
            {
                header: '#article_url_header',
                textContainer: '.article_url'
            },
            {
                header: '#article_author_header',
                textContainer: '.article_author'
            },
            {
                header: '#article_date_header',
                textContainer: '.article_date',
                default: true
            }
        ]
    });
});

function initArticlesPagination()
{
    pagination = new Pagination('articles_pagination', '.article_row', 30);
    $('#article_search').keyup(pagination.initializeElements);
    $('#article_search_button').click(pagination.initializeElements);

    tableSort.pagination = pagination;
}

function confirmDeleteArticle(articleID, articleName)
{
    $('#delete_name').html(articleName);
    $('#delete_button').attr('onclick', 'window.location = "/actions/admin/content/articles/delete_article/' + articleID + '"');
    $('#confirm_delete_modal').modal({backdrop: 'static', keyboard: true});
}
