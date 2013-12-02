$(document).ready(function()
{
    $('#layout_content').resizable();
});

function checkForLayoutContent(contentID)
{
    if($('#layout_code').val().length == 0)
    {
        var content = $(contentID).val();
        if(content.length > 0)
        {
            content = createParagraphs(content);
            $('#layout_code').val(content);
            $('#layout_editable').html(content);
        }
    }
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
    $('#layout_editor').css(
    {
        'background-color': '#FFFFFF',
        'position': 'fixed',
        'top': '0',
        'left': '0',
        'width': '100%',
        'height': '100%',
        'overflow': 'auto',
        'z-index': '50000'
    });
    
    $('#layout_content').css(
    {
        'height': ($('#layout_editor').height() - $('#layout_content').position().top) + 'px',
        'margin': '0'
    });
    
    $('#layout_code').css(
    {
        'width': '100%',
        'height': '100%',
        'resize': 'none'
    });
    $('#layout_code').focus();
}

function closeLayoutFullscreen()
{
    $('#layout_editor').attr('style', '');
    $('#layout_content').css(
    {
        'margin-bottom': '1em'
    });
    $('#layout_code').attr('style', 'min-height: 200px');
}

function toggleCodeView()
{
    if($('#layout_code').is(':visible'))
    {
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

function onLayoutEditableChanged()
{
    $('#layout_code').val($('#layout_editable').html());
}

function onLayoutCodeChanged()
{
    $('#layout_editable').html($('#layout_code').val());
}

function createParagraphs(content)
{
    content = content.split("\n").join("</p>\n<p>");
    content = content.split("\r").join("</p>\n<p>");
    
    return '<p>' + content + '</p>';
}
