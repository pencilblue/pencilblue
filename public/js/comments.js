/*
    Copyright (C) 2015  PencilBlue, LLC

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

function submitComment(button)
{
    if(!button)
    {
        return;
    }

    var buttonID = button.attr('id');
    var articleIndex = buttonID.split('comment_submit_button_').join('');

    if($('#comment_content_' + articleIndex).val().length == 0)
    {
        return;
    }

    $('.article').each(function()
    {
        if($(this).attr('article-index') == articleIndex)
        {
            var articleID = $(this).attr('id').split('article_').join('');
            $('#comment_submitting_' + articleIndex).show();

            $.post('/api/comments/new_comment', {article: articleID, content: $('#comment_content_' + articleIndex).val()}, function(data)
            {
                var response = $.parseJSON(data);
                $('#comment_submitting_' + articleIndex).hide();

                if(response.code > 0)
                {
                    $('#comment_error_' + articleIndex).show();
                }
                else
                {
                    $('#comment_error_' + articleIndex).hide();
                    $('#comment_content_' + articleIndex).val('');

                    var commentWell = $('#user_comment_' + articleIndex).html();
                    commentWell = commentWell.split('^content^').join(encodeHtml(response.data.content));
                    commentWell = commentWell.split('^timestamp^').join(response.data.timestamp);

                    $('#comment_container_' + articleIndex).prepend(commentWell);
                }
            });
        }
    });
}

function encodeHtml(value) {
    if (value) {
        return jQuery('<div />').text(value).html();
    } else {
        return '';
    }
}
