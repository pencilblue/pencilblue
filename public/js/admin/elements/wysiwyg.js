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

$(document).ready(function() {
    $('.one_active .btn').click(function() {
        $(this).addClass('active').siblings().removeClass('active');
    });
    $('.content_layout').resizable({handles: 'n,s'});
    $('.wysiwyg .btn').tooltip({
        delay: {show: 500, hide: 100},
        placement: 'bottom'
    });
    $('#format_type_dropdown a').click(function(event) {
        event.preventDefault();
    });
    $(window).bind('touchend', function (event) {
		var isInside = (editor.is(event.target) || editor.has(event.target).length > 0);
		var range = getRange();
	    var clear = range && (range.startContainer === range.endContainer && range.startOffset === range.endOffset);
		if(!clear || isInside) {
			saveSelection();
		}
	});
});

function initWYSIWYG() {
    $('.wysiwyg .layout_code').val($('.wysiwyg .layout_editable').html());
    $('.wysiwyg .layout_markdown').val(toMarkdown($('.wysiwyg .layout_editable').html()).split('<div>').join("\n").split('</div>').join(''));

    $('.wysiwyg').each(function() {
        var wysId = $(this).attr('id').split('wysiwyg_').join('');
        loadLayoutMediaPreviews(wysId);
    });
}

function toolbarAction(wysId, action, argument) {
    restoreSelection(wysId);
    $('#wysiwyg_' + wysId + ' .layout_editable').focus();
    execCommand(action, argument);
    saveSelection(wysId);
    updateToolbar(wysId);
}

function execCommand(action, argument) {
    document.execCommand(action, false, argument);
}

function formatBlock(wysId, format, formatName)
{
    $('#wysiwyg_' + wysId + ' .text_type_name').html(formatName);
    toolbarAction(wysId, 'formatblock', format);
}

function setFormatBlockType(format, formatName)
{
    $('#format_type_button').html(formatName);
    $('#format_type_button').attr('onclick', 'formatBlock(\'' + format + '\', \'' + formatName + '\')');
}

function getRange() {
    var selection = window.getSelection();
	if(selection.getRangeAt && selection.rangeCount) {
		return selection.getRangeAt(0);
	}
}

function saveSelection(wysId) {
    selectedRange = getRange();
    onLayoutEditableChanged(wysId);
    updateToolbar(wysId);
}

function restoreSelection(wysId) {
    var selection = window.getSelection();
	if(selectedRange) {
		try {
			selection.removeAllRanges();
		}
        catch(exception) {
			document.body.createTextRange().select();
			document.selection.empty();
		}

		selection.addRange(selectedRange);
	}
    updateToolbar(wysId);
}

function getSelectedHTML()
{
    var sel = window.getSelection();
    if(sel.rangeCount)
    {
        var container = document.createElement("div");
        for(var i = 0, len = sel.rangeCount; i < len; ++i)
        {
            container.appendChild(sel.getRangeAt(i).cloneContents());
        }

        return container.innerHTML;
    }
}

function updateToolbar(wysId) {
    $('#wysiwyg_' + wysId + ' .btn-group-format .btn').each(function() {
        var formatType = $(this).attr('data-format-type');
        if(document.queryCommandState(formatType)) {
            $(this).addClass('active');
        }
        else {
            $(this).removeClass('active');
        }
    });

    var formatBlock = document.queryCommandValue('formatblock');
    if(formatBlock.length > 0) {
        $('#wysiwyg_' + wysId + ' #format_type_dropdown li a').each(function() {
            if($(this).attr('data-format-type') == formatBlock) {
                $('#wysiwyg_' + wysId + ' .text_type_name').html($(this).html());
            }
        });
    }
}

function showLayoutView(wysId, type) {
    $('#wysiwyg_' + wysId + ' .layout_editable').hide();
    $('#wysiwyg_' + wysId + ' .layout_code').hide();
    $('#wysiwyg_' + wysId + ' .layout_markdown').hide();

    $('#wysiwyg_' + wysId + ' .layout_' + type).show();
}

function onLayoutEditableChanged(wysId) {
    $('#wysiwyg_' + wysId + ' .layout_code').val($('#wysiwyg_' + wysId + ' .layout_editable').html());
    $('#wysiwyg_' + wysId + ' .layout_markdown').val(toMarkdown($('#wysiwyg_' + wysId + ' .layout_editable').html()).split('<div>').join('').split('</div>').join(''));
}

function onLayoutCodeChanged(wysId) {
    $('#wysiwyg_' + wysId + ' .layout_editable').html($('#wysiwyg_' + wysId + ' .layout_code').val());
    $('#wysiwyg_' + wysId + ' .layout_markdown').val(toMarkdown($('#wysiwyg_' + wysId + ' .layout_code').val()).split('<div>').join('').split('</div>').join(''));
}

function onLayoutMarkdownChanged(wysId) {
    $('#wysiwyg_' + wysId + ' .layout_editable').html(markdown.toHTML($('#wysiwyg_' + wysId + ' .layout_markdown').val()));
    $('#wysiwyg_' + wysId + ' .layout_code').val(markdown.toHTML($('#wysiwyg_' + wysId + ' .layout_markdown').val()));
}

function toggleLayoutFullscreen(wysId) {
    if(!$('#wysiwyg_' + wysId).attr('style')) {
        openLayoutFullscreen(wysId);
    }
    else if($('#wysiwyg_' + wysId).attr('style').length === 0) {
        openLayoutFullscreen(wysId);
    }
    else {
        closeLayoutFullscreen(wysId);
    }
}

function openLayoutFullscreen(wysId) {
    $('#wysiwyg_' + wysId).css({
        'background-color': '#FFFFFF',
        'position': 'fixed',
        'top': '0',
        'left': '0',
        'width': '100%',
        'height': '100%',
        'overflow': 'auto',
        'z-index': '10000'
    });

    $('#wysiwyg_' + wysId + ' .content_layout').css({
        'height': ($(window).height() - $('#wysiwyg_' + wysId + ' .content_layout').position().top - 5) + 'px',
        'margin': '0'
    });

    $('#wysiwyg_' + wysId).focus();
}

function closeLayoutFullscreen(wysId) {
    $('#wysiwyg_' + wysId).attr('style', '');
    $('#wysiwyg_' + wysId + ' .content_layout').attr('style', '');
}

function showContentLayoutModal(wysId, subsection)
{
    if(typeof selectedRange === 'undefined') {
        $('#wysiwyg_' + wysId + ' .layout_editable').focus();
        saveSelection(wysId);
    }

    switch(subsection)
    {
        case 'add_layout_link':
            $('.add_layout_media').hide();
            $('.add_layout_link').show();
            $('#wysiwyg_modal_' + wysId + ' #layout_link_url').focus();
            $('#wysiwyg_modal_' + wysId + ' #layout_link_text').val(getSelectedHTML());
            break;
        case 'add_layout_media':
        default:
            $('.add_layout_link').hide();
            $('.add_layout_media').show();
            $('#wysiwyg_modal_' + wysId + ' #layout_media_options').html(getLayoutMediaOptions(wysId));
            break;
    }

    closeLayoutFullscreen(wysId);
    $('#wysiwyg_modal_' + wysId + ' #layout_link_url').val('');
    $('#wysiwyg_modal_' + wysId).modal({backdrop: 'static', keyboard: true});
}

function addLayoutLink(wysId)
{
    if($('#wysiwyg_modal_' + wysId + ' #layout_link_url').val().length > 0)
    {
        if($('#wysiwyg_modal_' + wysId + ' #link_in_tab').is(':checked'))
        {
            toolbarAction(wysId, 'inserthtml', '<a href="' + $('#wysiwyg_modal_' + wysId + ' #layout_link_url').val() + '" target="_blank">' + $('#wysiwyg_modal_' + wysId + ' #layout_link_text').val() + '</a>');
        }
        else
        {
            toolbarAction(wysId, 'inserthtml', '<a href="' + $('#wysiwyg_modal_' + wysId + ' #layout_link_url').val() + '">' + $('#wysiwyg_modal_' + wysId + ' #layout_link_text').val() + '</a>');
        }
    }

    $('#wysiwyg_modal_' + wysId).modal('hide');
}

function getLayoutMediaOptions(wysId)
{
    var activeMedia = $('#active_media .media_item');
    if(activeMedia.length === 0)
    {
        return '<button type="button" class="btn btn-sm btn-default" onclick="associateMedia(\'' + wysId + '\')">' + loc.wysiwyg.ASSOCIATE_MEDIA + '</button><br/>&nbsp;';
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

function addLayoutMedia(wysId)
{
    var associatedMedia = [];
    var mediaOptionsChecked = 0;
    $('#wysiwyg_modal_' + wysId + ' #layout_media_options input').each(function()
    {
        if($(this).is(':checked'))
        {
            associatedMedia.push($(this).attr('id').substr(13));
        }
        mediaOptionsChecked++;

        if(mediaOptionsChecked >= $('#layout_media_options input').length)
        {
            var mediaFormat = getMediaFormat(wysId);

            for(var i = 0; i < associatedMedia.length; i++) {
                toolbarAction(wysId, 'inserthtml', '<div>^media_display_' + associatedMedia[i] + mediaFormat + '^</div>');
            }

            loadLayoutMediaPreviews(wysId);
            $('#wysiwyg_modal_' + wysId).modal('hide');
        }
    });
}

function getMediaFormat(wysId)
{
    var mediaFormat = '/position:' + $('#wysiwyg_modal_' + wysId + ' #media_position_radio').find('.active').first().find('input').attr('id');

    if($('#wysiwyg_modal_' + wysId + ' #media_max_height').val())
    {
        mediaFormat = mediaFormat.concat(',maxheight:' + $('#wysiwyg_modal_' + wysId + ' #media_max_height').val() + $('#wysiwyg_modal_' + wysId + ' #media_max_height_unit').html());
    }

    return mediaFormat;
}

function loadLayoutMediaPreviews(wysId)
{
    var layout = $('#wysiwyg_' + wysId + ' .layout_editable').html();
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
            $('#wysiwyg_' + wysId + ' .layout_editable').html(layout);

            $('#wysiwyg_' + wysId + ' #media_preview_' + mediaID).children().first().attr('style', styles.mediaCSS);

            if(layout.indexOf('^media_display_') > -1) {
                loadLayoutMediaPreviews(wysId);
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

function associateMedia(wysId)
{
    $('#wysiwyg_modal_' + wysId).modal('hide');
    $('.nav-tabs a[href="#media"]').tab('show');
}

function getWYSIWYGLayout(wysId, cb) {
    if(!$('#temp_editable').position()){
        $('body').append('<div id="temp_editable" style="display:none"></div>');
    }
    $('#temp_editable').html($('#wysiwyg_' + wysId + ' .layout_editable').html());

    var i = 0;
    var mediaCount = $('#temp_editable .media_preview').length;
    if(mediaCount === 0)
    {
        cb($('#temp_editable').html());
        return;
    }

    $('#temp_editable .media_preview').each(function()
    {
        var innerHTML = $(this).html();

        if(innerHTML.indexOf('<img') === -1 && innerHTML.indexOf('<iframe') === -1 && innerHTML.indexOf('<video') === -1) {
            $(this).replaceWith('<div>' + innerHTML + '</div>');
        }
        else {
            $(this).replaceWith('^' + $(this).attr('media-tag') + '^');
        }

        i++;

        if(i >= mediaCount)
        {
            cb($('#temp_editable').html());
        }
    });
}
