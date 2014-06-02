function prepareHomePageSettingsSave() {
    // We need to remove other fieldsets so the form data isn't duplicated
    $('.modal-body fieldset').remove();

    buildMedia(function(mediaCSV) {
        if(!$('#page_media').position()) {
            $('fieldset').append('<input type="text" id="page_media" name="page_media" value="' + mediaCSV + '" style="display: none"></input>');
        }
        else {
            $('#page_media').val(mediaCSV);
        }

        getContentLayout(function(contentLayout) {
            $('fieldset').append('<textarea id="page_layout" name="page_layout" style="display: none">' + encodeURIComponent(contentLayout) + '</textarea>');

            $('#home_page_settings_form').submit();
            console.log('here');
        });
    });
}

function buildMedia(output) {
    var mediaElements = $('#active_media').find('.media_item');
    mediaElementCount = 0;
    mediaArray = [];

    if(mediaElements.length === 0) {
        output('');
        return;
    }

    mediaElements.each(function() {
        mediaArray.push($(this).attr('id').split('media_').join('').trim());

        mediaElementCount++;
        if(mediaElementCount >= mediaElements.length) {
            output(mediaArray.join(','));
        }
    });
}
