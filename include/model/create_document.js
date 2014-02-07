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
    };
    
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
    };

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
    };
    
    this.emailFormatting = function()
    {
        if(post['email'])
        {
            post['email'] = post['email'].toLowerCase();
        }
    };
    
    this.usernameFormatting = function()
    {
        if(post['username'])
        {
            post['username'] = post['username'].toLowerCase();
        }
    };
    
    this.accessFormatting = function()
    {
        if(post['admin'])
        {
            post['admin'] = parseInt(post['admin']);
        }
    };
    
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
};

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
};

/**
 * DocumentCreator - Creates structures for persistence and cleans various 
 * fields.
 * 
 * @author Blake Callens <blake@pencilblue.org>
 * @author Brian Hyder <brian@pencilblue.org>
 * @copyright PencilBlue, LLC. 2014 All Rights Reserved
 */
function DocumentCreator(){}

DocumentCreator.create = function(object_type, post, csvItems, nullIfEmptyItems) {
	
	if(typeof csvItems !== 'undefined') {
		DocumentCreator.csvItemsToArrays(post, csvItems);
    }
    if(typeof nullIfEmptyItems !== 'undefined') {
    	DocumentCreator.emptyItemsToNull(post, nullIfEmptyItems);
    }
    
    DocumentCreator.passwordHash(post);
    DocumentCreator.emailFormatting(post);
    DocumentCreator.usernameFormatting(post);
    DocumentCreator.accessFormatting(post);
    post['object_type'] = object_type;
    return post;
};

DocumentCreator.passwordHash = function(post){
	if (post['password']) {
		var whirlpool = crypto.createHash('whirlpool');
	    whirlpool.update(post.password);
	    post['password'] = whirlpool.digest('hex');
	    
	    if(post['confirm_password']) {
	        delete post['confirm_password'];
	    }
	}
};

DocumentCreator.emailFormatting = function(post){
	if(post['email']) {
        post['email'] = post['email'].toLowerCase();
    }
};

DocumentCreator.usernameFormatting = function(post){
	if(post['username']) {
        post['username'] = post['username'].toLowerCase();
    }
};

DocumentCreator.accessFormatting = function(post){
	if(post['admin']) {
        post['admin'] = parseInt(post['admin']);
    }
};

DocumentCreator.formatIntegerItems = function(post, integerItems) {
    for (var i = 0; i < integerItems.length; i++) {
        if (typeof post[integerItems[i]] !== 'undefined') {
            post[integerItems[i]] = parseInt(post[integerItems[i]]);
        }
    }
    
    return post;
};

DocumentCreator.emptyItemsToNull = function(post, nullIfEmptyItems) {
    if(!nullIfEmptyItems) {
        return;
    }
    
    for (var i = 0; i < nullIfEmptyItems.length; i++) {
        if (post[nullIfEmptyItems[i]]) {
            if(post[nullIfEmptyItems[i]].length == 0) {
                post[nullIfEmptyItems[i]] = null;
            }
        }
        else {
            post[nullIfEmptyItems[i]] = null;
        }
    }
};

DocumentCreator.csvItemsToArrays = function(post, csvItems) {
    if (!csvItems) {
        return;
    }
    
    for (var i = 0; i < csvItems.length; i++) {
        if(post[csvItems[i]]) {
            
        	var arrayItems = post[csvItems[i]].split(',');
            for (var j = 0; j < arrayItems.length; j++) {
                arrayItems[j] = arrayItems[j].trim();
            }
            post[csvItems[i]] = arrayItems;
        }
        else {
            post[csvItems[i]] = [];
        }
    }
};

//exports 
module.exports.DocumentCreator = DocumentCreator;
