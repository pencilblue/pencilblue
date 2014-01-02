global.setFormFieldValues = function(post, session)
{
    session.fieldValues = post;
    return session;
}

global.checkForFormRefill = function(result, session, output)
{
    if(session.fieldValues)
    {
        console.log(session.fieldValues);
        var formScript = getJSTag('if(typeof refillForm !== "undefined") refillForm(' + JSON.stringify(session.fieldValues) + ')');
        result = result.concat(formScript);
        
        delete session.fieldValues;
    }
    
    output(result, session);
}
