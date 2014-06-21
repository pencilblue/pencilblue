var layoutRange;
var selectedHTML;

$(document).ready(function()
{
    $('#layout_content').resizable({handles: 'n,s'});
});

function initLayoutEditable()
{
    onLayoutEditableChanged();
    loadLayoutMediaPreviews();
}

function calculateColumnInches()
{
    var wordCount = $('#layout_editable').text().split(' ').length;
    var columnInches = (Math.floor(wordCount / 4) * 0.1).toFixed(1);

    $('#column_inches').html('(' + columnInches + ' ' + loc.generic.COLUMN_INCHES + ')');
}

function toggleLayoutFullscreen()
{
    if(!$('#layout_editor').attr('style'))
    {
        openLayoutFullscreen();
    }
    else if($('#layout_editor').attr('style').length == 0)
    {
        openLayoutFullscreen();
    }
    else
    {
        closeLayoutFullscreen();
    }
}

function openLayoutFullscreen()
{
    $('#layout_content').resizable('disable');

    $('#layout_editor').css(
    {
        'background-color': '#FFFFFF',
        'position': 'fixed',
        'top': '0',
        'left': '0',
        'width': '100%',
        'height': '100%',
        'overflow': 'auto',
        'z-index': '10000'
    });

    $('#layout_content').css(
    {
        'height': ($('#layout_editor').height() - $('#layout_content').position().top) + 'px',
        'margin': '0',
        'opacity': '1'
    });

    $('#layout_code').focus();
}

function closeLayoutFullscreen()
{
    $('#layout_content').resizable('enable');

    $('#layout_editor').attr('style', '');
    $('#layout_content').css(
    {
        'margin-bottom': '1em',
        'height': '200px'
    });
}

function toggleCodeView()
{
    if($('#layout_code').is(':visible'))
    {
        loadLayoutMediaPreviews();
        $('#layout_code').hide();
        $('#layout_editable').show();
        $('#layout_content').css(
        {
            'background-color': '#FFFFFF'
        });
    }
    else
    {
        $('#layout_code').show();
        $('#layout_editable').hide();
        $('#layout_content').css(
        {
            'background-color': '#333333'
        });
    }
}

function forceEditableView()
{
    if($('#layout_code').is(':visible'))
    {
        toggleCodeView();
    }
}

function onLayoutEditableChanged()
{
    if($('#layout_editable').is(':visible'))
    {
        if(!$('#temp_editable').position())
        {
            $('body').append('<div id="temp_editable" style="display:none"></div>');
        }
        $('#temp_editable').html($('#layout_editable').html());

        var i = 0;
        var mediaCount = $('#temp_editable .media_preview').length;

        if(mediaCount === 0)
        {
            $('#layout_code').val($('#temp_editable').html());
            layoutRange = window.getSelection().getRangeAt(0);
            setSelectedHTML();
            checkForFormatState();
            calculateColumnInches();
            return;
        }

        $('#temp_editable .media_preview').each(function()
        {
            $(this).replaceWith('^' + $(this).attr('media-tag') + '^');
            i++;

            if(i >= mediaCount)
            {
                $('#layout_code').val($('#temp_editable').html());
                layoutRange = window.getSelection().getRangeAt(0);
                setSelectedHTML();
                checkForFormatState();
                calculateColumnInches();
            }
        });
    }
}

function checkForFormatState()
{
    var formatBlock = document.queryCommandValue('formatblock');
    if(formatBlock.length > 0)
    {
        $('#format_type_dropdown li a').each(function()
        {
            if($(this).attr('href').indexOf(formatBlock) > -1)
            {
                setTimeout($(this).attr('href').split('javascript:formatBlock').join('setFormatBlockType'), 5);
            }
        });
    }

    var buttonGroups = ['#text_format_group', '#justify_group', '#layout_list_group'];

    for(var i = 0; i < buttonGroups.length; i++)
    {
        $(buttonGroups[i] + ' .btn').each(function()
        {
            var formatType = $(this).attr('data-format-type');
            if(typeof formatType !== 'undefined')
            {
                if(document.queryCommandValue(formatType) == 'false' && $(this).hasClass('active'))
                {
                    $(this).attr('class', $(this).attr('class').split(' active').join(''));
                }
                else if(document.queryCommandValue(formatType) == 'true' && !$(this).hasClass('active'))
                {
                    $(this).attr('class', $(this).attr('class') + ' active');
                }
            }
        });
    }
}

function onLayoutCodeChanged()
{
    $('#layout_editable').html($('#layout_code').val());
    calculateColumnInches();
}

function createParagraphs(content)
{
    content = content.split("\n").join("</div>\n<div>");
    content = content.split("\r").join("</div>\n<div>");

    return '<div>' + content + '</div>';
}

function formatBlock(format, formatName)
{
    setFormatBlockType(format, formatName);
    layoutFormat('formatblock', format);
}

function setFormatBlockType(format, formatName)
{
    $('#format_type_button').html(formatName);
    $('#format_type_button').attr('onclick', 'formatBlock(\'' + format + '\', \'' + formatName + '\')');
}

function layoutFormat(command, argument)
{
    if(typeof argument === 'undefined')
    {
        argument = null;
    }

    forceEditableView();
    $('#layout_editable').focus();
    setLayoutRange();
    document.execCommand(command, false, argument);
    checkForFormatState();
    onLayoutEditableChanged();
}

function setLayoutRange()
{
    var input = document.getElementById('layout_editable');

    var range = document.createRange();
    range.setEnd(layoutRange.startContainer, layoutRange.endOffset);
    range.setStart(layoutRange.endContainer, layoutRange.startOffset);

    var selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
}

function clearAllLayoutStyles()
{
    $('#text_format_group button').each(function()
    {
        if($(this).attr('id') != 'clear_button' && $(this).hasClass('active'))
        {
            $(this).click();
        }
    });
}

function showContentLayoutModal(subsection)
{
    switch(subsection)
    {
        case 'add_layout_link':
            $('.add_layout_media').hide();
            $('.add_layout_link').show();
            $('#layout_link_url').focus();
            $('#layout_link_text').val(selectedHTML);
            break;
        case 'add_layout_media':
        default:
            $('.add_layout_link').hide();
            $('.add_layout_media').show();
            $('#layout_media_options').html(getLayoutMediaOptions());
            break;
    }

    closeLayoutFullscreen();
    $('#layout_link_url').val('');
    $('#content_layout_modal').modal({backdrop: 'static', keyboard: true});
}

function setSelectedHTML()
{
    var sel = window.getSelection();
    if(sel.rangeCount)
    {
        var container = document.createElement("div");
        for(var i = 0, len = sel.rangeCount; i < len; ++i)
        {
            container.appendChild(sel.getRangeAt(i).cloneContents());
        }

        selectedHTML = container.innerHTML;
    }
}

function addLayoutLink()
{
    if($('#layout_link_url').val().length > 0)
    {
        if($('#link_in_tab').is(':checked'))
        {
            layoutFormat('inserthtml', '<a href="' + $('#layout_link_url').val() + '" target="_blank">' + $('#layout_link_text').val() + '</a>');
        }
        else
        {
            layoutFormat('inserthtml', '<a href="' + $('#layout_link_url').val() + '">' + $('#layout_link_text').val() + '</a>');
        }
    }

    $('#content_layout_modal').modal('hide');
}

function getLayoutMediaOptions()
{
    var activeMedia = $('#active_media .media_item');
    if(activeMedia.length == 0)
    {
        return '<a href="javascript:associateMedia()">' + loc.articles.ASSOCIATE_MEDIA + '</a><br/>&nbsp;';
        $('#layout_media_format').hide();
    }

    var mediaHTML = '';
    activeMedia.each(function()
    {
        var mediaCheckbox = '<div class="checkbox"><label><input type="checkbox" id="layout_media_^media_id^">^media_name^</label></div>';
        mediaCheckbox = mediaCheckbox.split('^media_id^').join($(this).attr('id').substr(6));
        mediaCheckbox = mediaCheckbox.split('^media_name^').join($(this).find('.media_name').html());

        mediaHTML = mediaHTML.concat(mediaCheckbox);
    });

    $('#layout_media_format').show();
    return mediaHTML;
}

function setMediaMaxHeightUnit(unit)
{
    $('#media_max_height_unit').html(unit);
}

function associateMedia()
{
    $('#content_layout_modal').modal('hide');
    $('.nav-tabs a[href="#media"]').tab('show');
}

function addLayoutMedia()
{
    var associatedMedia = [];
    var mediaOptionsChecked = 0;
    $('#layout_media_options input').each(function()
    {
        if($(this).is(':checked'))
        {
            associatedMedia.push($(this).attr('id').substr(13));
        }
        mediaOptionsChecked++;

        if(mediaOptionsChecked >= $('#layout_media_options input').length)
        {
            var mediaFormat = getMediaFormat();

            if(associatedMedia.length == 1)
            {
                layoutFormat('inserthtml', '<div>^media_display_' + associatedMedia[0] + mediaFormat + '^</div>');
            }
            else if(associatedMedia.length > 1)
            {
                layoutFormat('inserthtml', '<div>^carousel_display_' + associatedMedia.join('-') + mediaFormat + '^</div>');
            }

            loadLayoutMediaPreviews();
            $('#content_layout_modal').modal('hide');
        }
    });
}

function getMediaFormat()
{
    var mediaFormat = '/position:' + $('#media_position_radio').find('.active').first().find('input').attr('id');

    if($('#media_max_height').val())
    {
        mediaFormat = mediaFormat.concat(',maxheight:' + $('#media_max_height').val() + $('#media_max_height_unit').html());
    }

    return mediaFormat;
}

function loadLayoutMediaPreviews()
{
    var layout = $('#layout_editable').html();
    var index = layout.indexOf('^media_display_');
    if(index == -1)
    {
        return;
    }

    var startIndex = index + 15;
    var endIndex = layout.substr(startIndex).indexOf('^');
    var mediaProperties = layout.substr(startIndex, endIndex).split('/');
    var mediaID = mediaProperties[0];
    var styles = getLayoutMediaStyle(mediaProperties[1]);
    var mediaTag = layout.substr(startIndex - 14, endIndex + 14);

    $.getJSON('/api/content/get_media_embed?id=' + mediaID, function(result)
    {
        if(result.code === 0)
        {
            var mediaPreview = '<div id="media_preview_' + mediaID + '" class="media_preview" media-tag="' + mediaTag + '" + style="' + styles.containerCSS + '">' + result.data + '</div>';

            layout = layout.split('^' + mediaTag + '^').join(mediaPreview);
            $('#layout_editable').html(layout);

            $('#media_preview_' + mediaID).children().first().attr('style', styles.mediaCSS);

            if(layout.indexOf('^media_display_') > -1) {
                loadLayoutMediaPreviews();
            }
        }
    });
}

function getLayoutMediaStyle(styleString)
{
    var styleElements = styleString.split(',');
    var containerCSS = [];
    var mediaCSS = [];

    for(var i = 0; i < styleElements.length; i++)
    {
        var styleSetting = styleElements[i].split(':');

        switch(styleSetting[0])
        {
            case 'position':
                switch(styleSetting[1]) {
                    case 'left':
                        containerCSS.push('float: left');
                        containerCSS.push('margin-right: 1em');
                        break;

                    case 'right':
                        containerCSS.push('float: right');
                        containerCSS.push('margin-left: 1em');
                        break;
                    case 'center':
                        containerCSS.push('text-align: center');
                        break;
                    default:
                        break;
                }
                break;
            case 'maxheight':
                mediaCSS.push('max-height: ' + styleSetting[1]);
                break;
            default:
                break;
        }
    }

    return {containerCSS: containerCSS.join('; '), mediaCSS: mediaCSS.join('; ')};
}

function getContentLayout(cb)
{
    if(!$('#temp_editable').position())
    {
        $('body').append('<div id="temp_editable" style="display:none"></div>');
    }
    $('#temp_editable').html($('#layout_editable').html());

    var i = 0;
    var mediaCount = $('#temp_editable .media_preview').length;
    if(mediaCount === 0)
    {
        cb($('#temp_editable').html());
        return;
    }

    $('#temp_editable .media_preview').each(function()
    {
        $(this).replaceWith('^' + $(this).attr('media-tag') + '^');
        i++;

        if(i >= mediaCount)
        {
            cb($('#temp_editable').html());
        }
    });
}
