function refillForm(fieldValues)
{
    for(var key in fieldValues)
    {
        if($('#' + key).position())
        {
            $('#' + key).val(fieldValues[key]);
        }
    }
}
