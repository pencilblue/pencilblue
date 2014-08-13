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

var siteRoot;
var saveMediaURL;
var mediaItemTemplate = '<div id="media_^media_id^" class="label label-default media_item"><i class="fa fa-bars"></i>&nbsp;<span class="media_name">^media_name^</span><a href="^media_link^" target="_blank">&nbsp;<i class="fa fa-^media_icon^"></i></a></div>';

$(document).ready(function()
{
    $('#media .label').draggable({revert: 'invalid', containment: 'document', helper: 'clone', cursor: 'move'});
    $('#active_media').droppable({accept: '#media .label', drop: function(event, ui)
    {
        $('#active_media').append(ui.draggable);
    }});
    $('#inactive_media').droppable({accept: '#media .label', drop: function(event, ui)
    {
        $('#inactive_media').append(ui.draggable);
    }});

    new jNarrow('#media_search', '#inactive_media .media_item',
    {
        searchChildElement: '.media_name',
        searchButton: '#media_search_button',
        searchText: '<i class="fa fa-search"></i>',
        clearText: '<i class="fa fa-times"></i>',
    });
});

function initMediaPagination()
{
    mediaPagination = new Pagination('media_pagination', '#inactive_media .media_item', 75, true);
    $('#media_search').keyup(mediaPagination.initializeElements);
    $('#media_search_button').click(mediaPagination.initializeElements);
}

function setupUpload(root)
{
    siteRoot = root;
    saveMediaURL = siteRoot + '/actions/admin/content/media/inline_add_media';

    $(function()
    {
        'use strict';
        // Change this to the location of your server-side upload handler:
        var url = siteRoot + '/actions/admin/content/media/upload_media';
        $('#media_file').fileupload(
        {
            url: url,
            dataType: 'json',
            done: function(error, data)
            {
                $('#upload_progress').hide();
                validateMediaURL(data.result.filename, true);
            },
            progressall: function (error, data)
            {
                $('#upload_progress').show();
                var progress = parseInt(data.loaded / data.total * 100, 10);
                $('#upload_progress .progress-bar').css(
                    'width',
                    progress + '%'
                );
            }
        }).prop('disabled', !$.support.fileInput).parent().addClass($.support.fileInput ? undefined : 'disabled');
    });
}

function showMediaModal(subsection)
{
    $('#link_to_media').hide();
    $('#upload_media').hide();
    $('#link_to_media_header').hide();
    $('#upload_media_header').hide();
    $(subsection).show();
    $(subsection + '_header').show();

    $('#media_modal').modal({backdrop: 'static', keyboard: true});
}

function setMediaValues(isFile, type, location)
{
    $('#is_file').prop('checked', isFile);
    $('#media_type').val(type);
    $('#location').val(location);
    $('#link_loading').show();
    getMediaThumb(type, location, function(thumb)
    {
        $('#link_loading').hide();
        $('#thumb').val(thumb);
        $('#save_button').prop('disabled', false);
    });
}

// Saving -----------------------------------

function checkForAddMediaSave()
{
    $('#save_button').prop('disabled', true);

    buildTopics(function(topicsCSV)
    {
        $('#media_topics').val(topicsCSV);

        $.post(saveMediaURL, $('#media_modal fieldset').serialize(), function(newMedia)
        {
            newMedia = JSON.parse(newMedia);

            var mediaItemElement = mediaItemTemplate.split('^media_id^').join(newMedia._id.toString());
            mediaItemElement = mediaItemElement.split('^media_name^').join(newMedia.name);
            mediaItemElement = mediaItemElement.split('^media_icon^').join(getMediaIcon(newMedia.media_type));
            mediaItemElement = mediaItemElement.split('^media_caption^').join(newMedia.caption);
            mediaItemElement = mediaItemElement.split('^media_link^').join(getMediaLink(newMedia.media_type, newMedia.location, newMedia.is_file));

            $('#active_media').append(mediaItemElement);
            $('#media .col-md-3').draggable({revert: 'invalid', containment: 'document', helper: 'clone', cursor: 'move'});
            $('#save_button').prop('disabled', false);
            $('#media_modal').modal('hide');
        });
    });
}

function getMediaIcon(mediaType)
{
    var iconID = '';

    switch(mediaType) {
        case 'image':
            return 'picture-o';
        case 'video/mp4':
        case 'video/webm':
        case 'video/ogg':
            return 'film';
        case 'youtube':
            return 'youtube';
        case 'vimeo':
            return 'vimeo-square';
        case 'daily_motion':
            return 'play-circle-o';
        case 'vine':
            return 'vine';
        case 'instagram':
            return 'instagram';
        case 'slideshare':
            return 'list-alt';
        case 'trinket':
            return 'key fa-flip-horizontal';
        default:
            return 'question';
    }

    return '<i class="fa fa-' + iconID + '"></i>';
}

function getMediaLink(mediaType, mediaLocation, isFile)
{
    switch(mediaType) {
        case 'youtube':
            return 'http://youtube.com/watch/?v=' + mediaLocation;
        case 'vimeo':
            return 'http://vimeo.com/' + mediaLocation;
        case 'daily_motion':
            return 'http://dailymotion.com/video/' + mediaLocation;
        case 'vine':
            return 'https://vine.co/v/' + mediaLocation;
        case 'instagram':
            return 'http://instagram.com/p/' + mediaLocation;
        case 'instagram':
            return 'http://instagram.com/p/' + mediaLocation;
        case 'slideshare':
            return 'http://www.slideshare.net/slideshow/embed_code/' + mediaLocation;
        case 'trinket':
            if(mediaLocation.indexOf('/') === -1) {
                return 'https://trinket.io/embed/python/' + mediaLocation;
            }
            return 'https://trinket.io/embed/' + mediaLocation;
        case 'image':
        case 'video/mp4':
        case 'video/webm':
        case 'video/ogg':
        default:
            if(isFile) {
                return siteRoot + mediaLocation;
            }
            return mediaLocation;
    }
}
