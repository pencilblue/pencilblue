global.createDocument = function(object_type, post, csvItems, nullIfEmptyItems)
{
    this.csvItemsToArrays = function()
    {
        if(!csvItems)
        {
            return;
        }
        
        for(var i = 0; i < csvItems.length; i++)
        {
            if(post[csvItems[i]])
            {
                var arrayItems = post[csvItems[i]].split(',');
                for(var j = 0; j < arrayItems.length; j++)
                {
                    arrayItems[j] = arrayItems[j].trim();
                }
                post[csvItems[i]] = arrayItems;
            }
            else
            {
                post[csvItems[i]] = [];
            }
        }
    }
    
    this.emptyItemsToNull = function()
    {
        if(!nullIfEmptyItems)
        {
            return;
        }
        
        for(var i = 0; i < nullIfEmptyItems.length; i++)
        {
            if(post[nullIfEmptyItems[i]])
            {
                if(post[nullIfEmptyItems[i]].length == 0)
                {
                    post[nullIfEmptyItems[i]] = null;
                }
            }
            else
            {
                post[nullIfEmptyItems[i]] = null;
            }
        }
    }

    this.passwordHash = function()
    {
        if(post['password'])
        {
            var whirlpool = require('crypto').createHash('whirlpool');
            whirlpool.update(post.password);
            post['password'] = whirlpool.digest('hex');
            
            if(post['confirm_password'])
            {
                delete post['confirm_password'];
            }
        }
    }
    
    this.emailFormatting = function()
    {
        if(post['email'])
        {
            post['email'] = post['email'].toLowerCase();
        }
    }
    
    this.usernameFormatting = function()
    {
        if(post['username'])
        {
            post['username'] = post['username'].toLowerCase();
        }
    }
    
    this.accessFormatting = function()
    {
        if(post['admin'])
        {
            post['admin'] = parseInt(post['admin']);
        }
    }
    
    if(typeof csvItems !== 'undefined')
    {
        this.csvItemsToArrays();
    }
    if(typeof nullIfEmptyItems !== 'undefined')
    {
        this.emptyItemsToNull();
    }
    this.passwordHash();
    this.emailFormatting();
    this.usernameFormatting();
    this.accessFormatting();
    post['object_type'] = object_type;
    
    return post;
}

global.formatIntegerItems = function(post, integerItems)
{
    for(var i = 0; i < integerItems.length; i++)
    {
        if(typeof post[integerItems[i]] !== 'undefined')
        {
            post[integerItems[i]] = parseInt(post[integerItems[i]]);
        }
    }
    
    return post;
}
