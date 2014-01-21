global.ResponseHead = function(request, response, code, cookie)
{
    this.requestURL = request.url;
    this.binary = false;
    this.responseData = {};
    
    if(typeof code === 'undefined')
    {
        code = 200;
    }
    
    if(typeof cookie !== 'undefined')
    {
        cookieString = '';
        for(var key in cookie)
        {
            if(cookieString.length > 0)
            {
                cookieString = cookieString.concat('; ');
            }
            cookieString = cookieString.concat(key + '=' + cookie[key]);
        }
        this.responseData['set-cookie'] = cookieString;
    }
    
    if(this.requestURL.indexOf('?') != -1)
    {
        this.requestURL = this.requestURL.substr(0, this.requestURL.indexOf('?'));
    }
    
    // If a response code other than 200 is provided, force that code into the head
    if(code != 200)
    {
        this.responseData['content-type'] = 'text/html; charset=utf-8';
    }
    else
    {
        // XML responses
        if(this.requestURL == '/sitemap' || this.requestURL.lastIndexOf('.xml') > -1)
        {
            this.responseData['content-type'] = 'text/xml; charset=utf-8';
        }
        // HTML responses
        else if(this.requestURL.lastIndexOf('.') == -1 || this.requestURL.lastIndexOf('.html') > -1)
        {
            this.responseData['content-type'] = 'text/html; charset=utf-8';
        }
        // CSS files
        else if(this.requestURL.lastIndexOf('.css') > -1)
        {
            this.responseData['content-type'] = 'text/css; charset=utf-8';
        }
        // Client side JavaScript files
        else if(this.requestURL.lastIndexOf('.js') > -1)
        {
            this.responseData['content-type'] = 'text/javascript; charset=utf-8';
        }
        // Plain text files
        else if(this.requestURL.lastIndexOf('.txt') > -1)
        {
            this.responseData['content-type'] = 'text/plain; charset=utf-8';
        }
        else if(this.requestURL.lastIndexOf('.jpg') > -1)
        {
            this.responseData['content-type'] = 'image/jpg';
        }
        // GIF
        else if(this.requestURL.lastIndexOf('.gif') > -1)
        {
            this.responseData['content-type'] = 'image/gif';
        }
        // PNG
        else if(this.requestURL.lastIndexOf('.png') > -1)
        {
            this.responseData['content-type'] = 'image/png';
        }
        // SVG
        else if(this.requestURL.lastIndexOf('.svg') > -1)
        {
            this.responseData['content-type'] = 'image/svg+xml';
        }
        // ICO
        else if(this.requestURL.lastIndexOf('.ico') > -1)
        {
            this.responseData['content-type'] = 'image/ico';
        }
        // TTF
        else if(this.requestURL.lastIndexOf('.ttf') > -1)
        {
            this.responseData['content-type'] = 'font/truetype';
        }
        // OTF
        else if(this.requestURL.lastIndexOf('.otf') > -1)
        {
            this.responseData['content-type'] = 'font/opentype';
        }
        // EOF
        else if(this.requestURL.lastIndexOf('.eof') > -1)
        {
            this.responseData['content-type'] = 'application/vnd.ms-fontobject';
        }
        // WOFF
        else if(this.requestURL.lastIndexOf('.woff') > -1)
        {
            this.responseData['content-type'] = 'application/font-woff';
        }
        // Other binary file
        else
        {
            this.responseData['content-type'] = 'application/octet-stream';
        }
    }
    
    if(this.responseData['content-type'].indexOf('text') == -1)
    {
        this.binary = true;
    }
    response.writeHead(code, this.responseData);
}
