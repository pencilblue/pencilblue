$(document).ready(function()
{    
    setupDateInputs();
});

function setupDateInputs()
{
    if(customObjectType)
    {
        for(var key in customObjectType.fields)
        {
            if(customObjectType.fields[key].field_type == 'date')
            {
                $('#' + key).datetimepicker(
                {
                    language: 'en',
                    format: 'Y-m-d H:m'
                });
            }
        }
    }
}
