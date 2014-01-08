global.apiResponseCode = 
{
    FAILURE: 0,
    SUCCESS: 1
}

global.apiResponse = function(cd, msg, dta)
{
    if(typeof msg === 'undefined')
    {
        switch(cd)
        {
            case apiResponseCode.FAILURE:
                msg = 'FAILURE';
                break;
            case apiResponseCode.SUCCESS:
                msg = 'SUCCESS';
                break;
            default:
                msg = '';
                break;
        }
    }
    if(typeof dta === 'undefined')
    {
        dta = null;
    }
    var response = {code: cd, message: msg, data: dta};
    
    return JSON.stringify(response);
}
