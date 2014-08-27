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

function getContent(wysId) {
    return $('#wysiwyg_' + wysId + ' .layout_editable').html();
}
