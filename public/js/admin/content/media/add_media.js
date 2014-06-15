/*

    Interface for adding

    @author Blake Callens <blake.callens@gmail.com>
    @copyright PencilBlue 2013, All rights reserved

*/

$(document).ready(function()
{
    $('#add_media_form').validate(
    {
        rules:
        {
            name:
            {
                minlength: 2,
                required: true
            }
        }
    });
});

function setupUpload(siteRoot)
{
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
        $('#save_button').removeAttr('disabled');
        $('#media_modal').modal('hide');
    });
}

// Saving -----------------------------------

function checkForAddMediaSave()
{
    buildTopics(function(topicsCSV)
    {
        if(!$('#media_topics').position())
        {
            $('fieldset').append('<input type="text" id="media_topics" name="media_topics" value="' + topicsCSV + '" style="display: none"></input>');
        }
        else
        {
            $('#media_topics').val(topicsCSV);
        }

        $('#add_media_form').submit();
    });
}

function buildTopics(output)
{
    var topicElements = $('#active_topics').find('.topic');
    topicElementCount = 0;
    topicsArray = [];

    if(!topicElements.length)
    {
        output('');
        return;
    }

    topicElements.each(function()
    {
        topicsArray.push($(this).attr('id').split('topic_').join('').trim());

        topicElementCount++;
        if(topicElementCount >= topicElements.length)
        {
            output(topicsArray.join(','));
        }
    });
}
