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

$(document).ready(function()
{
    sizeMediaEmbeds();
    $(window).resize(sizeMediaEmbeds);
});

function sizeMediaEmbeds()
{
    $('.media_embed').each(function()
    {
        var mediaEmbed = $(this);
        var caption = mediaEmbed.find('.media_caption').first();
        var media = mediaEmbed.find('img').first();

        var captionPadding = Math.ceil(caption.css('padding-left').split('px').join('')) + Math.ceil(caption.css('padding-right').split('px').join(''));

        if(!media)
        {
            media = $(this).find('iframe').first();
        }

        if(media.width() > 0)
        {
            caption.width(media.width() - captionPadding);
        }
        else
        {
            media.load(function()
            {
                caption.width(media.width() - captionPadding);
            });
        }
    });
}
