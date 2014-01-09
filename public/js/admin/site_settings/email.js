var formRefillOptions =
[
    {
        id: 'secure_connection',
        type: 'button_group',
        elementPrefix: 'secure_connection_',
        onComplete: checkForCustomService
    },
    {
        id: 'verification_content',
        type: 'layout'
    }
]

$(document).ready(function()
{
    $('#media_button').hide();
});

function checkForCustomService()
{
    if($('#service').val() == 'custom')
    {
        $('#custom_smtp_options').show();
    }
    else
    {
        $('#custom_smtp_options').hide();
    }
}
