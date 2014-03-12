function checkForPencilBlueSettingsSave()
{
    buildCarouselMedia(function(mediaCSV)
    {
        if(!$('#carousel_media').position())
        {
            $('fieldset').append('<input type="text" id="carousel_media" name="carousel_media" value="' + mediaCSV + '" style="display: none"></input>');
        }
        else
        {
            $('#carousel_media').val(mediaCSV);
        }
        
        $('#pencilblue_settings_form').submit();
    });
}

function buildCarouselMedia(output)
{
    var mediaElements = $('#active_media').find('.media_item');
    mediaElementCount = 0;
    mediaArray = [];
    
    if(mediaElements.length == 0)
    {
        output('');
        return;
    }
    
    mediaElements.each(function()
    {
        mediaArray.push($(this).attr('id').split('media_').join('').trim());
        
        mediaElementCount++;
        if(mediaElementCount >= mediaElements.length)
        {
            output(mediaArray.join(','));
        }
    });
}
