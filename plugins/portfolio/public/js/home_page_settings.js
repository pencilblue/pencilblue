var formRefillOptions =
[
    {
        id: 'home_page_hero',
        type: 'text'
    },
    {
        id: 'page_layout',
        type: 'layout'
    },
    {
        id: 'page_media',
        type: 'drag_and_drop',
        elementPrefix: 'media_',
        activeContainer: '#active_media'
    },
    {
        id: 'callout_headline_1',
        type: 'text'
    },
    {
        id: 'callout_link_1',
        type: 'text'
    },
    {
        id: 'callout_copy_1',
        type: 'text'
    },
    {
        id: 'callout_headline_2',
        type: 'text'
    },
    {
        id: 'callout_link_2',
        type: 'text'
    },
    {
        id: 'callout_copy_2',
        type: 'text'
    },
    {
        id: 'callout_headline_3',
        type: 'text'
    },
    {
        id: 'callout_link_3',
        type: 'text'
    },
    {
        id: 'callout_copy_3',
        type: 'text'
    }
];

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

        var wysId = $('.wysiwyg').attr('id').substring('wysiwg_'.length + 1);
        getWYSIWYGLayout(wysId, function(layout) {
            if(!$('#page_layout').position()) {
                $('fieldset').append('<textarea id="page_layout" name="page_layout" style="display: none">' + layout + '</textarea>');
            }
            else {
                $('#page_layout').val(layout);
            }

            $('#home_page_settings_form').submit();
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
