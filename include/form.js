global.prepareFormReturns = function(session, result, output)
{
    displayErrorOrSuccess(session, result, function(newSession, newResult)
    {
        checkForFormRefill(newSession, newResult, output);
    });
}

global.setFormFieldValues = function(post, session)
{
    session.fieldValues = post;
    return session;
}

global.checkForFormRefill = function(session, result, output)
{
    if(session.fieldValues)
    {
        console.log(session.fieldValues);
        var formScript = getJSTag('if(typeof refillForm !== "undefined") $(document).ready(function(){refillForm(' + JSON.stringify(session.fieldValues) + ')})');
        result = result.concat(formScript);
        
        delete session.fieldValues;
    }
    
    output(session, result);
}
