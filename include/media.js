//TODO: add options like sizing

global.getMediaEmbed = function(mediaObject, options)
{
    switch(mediaObject.media_type)
    {
        case 'image':
            return '<img src="' + mediaObject.location + '"></img>';
        case 'youtube':
            return '<iframe width="560" height="315" src="//www.youtube.com/embed/' + mediaObject.location + '" frameborder="0" allowfullscreen></iframe>';
        case 'vimeo':
            return '<iframe src="//player.vimeo.com/video/' + mediaObject.location + '" width="500" height="281" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>';
        case 'daily_motion':
            return '<iframe frameborder="0" width="480" height="270" src="http://www.dailymotion.com/embed/video/' + mediaObject.location + '"></iframe>'
    }
}
