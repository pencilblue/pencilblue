var formRefillOptions =
[
    {
        id: 'publish_date',
        type: 'datetime'
    },
    {
        id: 'article_layout',
        type: 'layout'
    },
    {
        id: 'article_media',
        type: 'drag_and_drop',
        elementPrefix: 'media_',
        activeContainer: '#active_media'
    },
    {
        id: 'article_sections',
        type: 'drag_and_drop',
        elementPrefix: 'section_',
        activeContainer: '#active_sections'
    },
    {
        id: 'article_topics',
        type: 'drag_and_drop',
        elementPrefix: 'topic_',
        activeContainer: '#active_topics'
    }
];
