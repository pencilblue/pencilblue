
/**
 * Ascending index value
 * @private
 * @static
 * @readonly
 * @property ASC
 * @type {Integer}
 */
var ASC  = 1;

/**
 * Descending index value
 * @private
 * @static
 * @readonly
 * @property DESC
 * @type {Integer}
 */
var DESC = -1;

module.exports = function IndicesModule(multisite) {
    return [

        //user
        {
            collection: 'user',
            spec: multisite ? {username: ASC, site: ASC} : {username: ASC},
            options: {unique: true}
        },
        {
            collection: 'user',
            spec: multisite ?  {email: ASC, site: ASC} : {email: ASC},
            options: {unique: true}
        },
        {
            collection: 'user',
            spec: {username: ASC, password: ASC},
            options: {}
        },
        {
            collection: 'user',
            spec: {created: ASC},
            options: {}
        },
        {
            collection: 'user',
            spec: {admin: DESC},
            options: {}
        },

        //unverified user
        {
            collection: 'unverified_user',
            spec: { last_modified: ASC },
            options: { expireAfterSeconds: 2592000 }
        },

        //theme settings
        {
            collection: 'theme_settings',
            spec: {plugin_uid: ASC},
            options: {}
        },
        {
            collection: 'theme_settings',
            spec: {plugin_id: ASC},
            options: {}
        },

        //plugin settings
        {
            collection: 'plugin_settings',
            spec: multisite ? {plugin_uid: ASC, site: ASC} : {plugin_uid: ASC},
            options: {unique: true}
        },
        {
            collection: 'plugin_settings',
            spec: multisite ? {plugin_id: ASC, site: ASC} : {plugin_id: ASC},
            options: {unique: true}
        },

        //settings
        {
            collection: 'setting',
            spec: multisite ? {key: ASC, site: ASC} : {key: ASC},
            options: {unique: true}
        },

        //section
        {
            collection: 'section',
            spec: {parent: ASC},
            options: {}
        },
        {
            collection: 'section',
            spec: {created: ASC},
            options: {}
        },
        {
            collection: 'section',
            spec: multisite ? {name: ASC, site: ASC} : {name: ASC},
            options: {unique: true}
        },

        //plugin
        {
            collection: 'plugin',
            spec: multisite ? {uid: ASC, site: ASC} : {uid: ASC},
            options: {unique: true}
        },
        {
            collection: 'plugin',
            spec: {created: ASC},
            options: {}
        },

        //password reset
        {
            collection: 'password_reset',
            spec: {verification_code: ASC},
            options: {unique: true}
        },

        //media
        {
            collection: 'media',
            spec: {location: ASC},
            options: {}
        },
        {
            collection: 'media',
            spec: multisite ? {name: ASC, site: ASC} : {name: ASC},
            options: {unique: true}
        },
        {
            collection: 'media',
            spec: {media_type: ASC},
            options: {}//TODO make unique once validation is in place
        },
        {
            collection: 'media',
            spec: {created: ASC},
            options: {}
        },

        //job run
        //NOTHING YET

        //job log
        {
            collection: 'job_log',
            spec: {job_id: ASC},
            options: {}//TODO make unique once validation is in place
        },
        {
            collection: 'job_log',
            spec: {job_id: ASC, created: ASC},
            options: {}//TODO make unique once validation is in place
        },
        {
            collection: 'job_log',
            spec: {created: ASC},
            options: {}
        },

        //custom object type
        {
            collection: 'custom_object_type',
            spec: multisite ? {name: ASC, site: ASC} : {name: ASC},
            options: {unique: true}
        },
        {
            collection: 'custom_object_type',
            spec: {created: ASC},
            options: {}
        },

        //custom objects
        {
            collection: 'custom_object',
            spec: {name: ASC, type: ASC},
            options: {unique: true}
        },
        {
            collection: 'custom_object',
            spec: {created: ASC},
            options: {}
        },

        //article
        {
            collection: 'article',
            spec: multisite ? {url: ASC, site: ASC} : {url: ASC},
            options: {unique: true}
        },
        {
            collection: 'article',
            spec: multisite ? {headline: ASC, site: ASC} : {headline: ASC},
            options: {unique: true}
        },
        {
            collection: 'article',
            spec: {publish_date: DESC},
            options: {}
        },
        {
            collection: 'article',
            spec: {publish_date: DESC, draft: ASC},
            options: {}
        },
        {
            collection: 'article',
            spec: {author: ASC},
            options: {}
        },
        {
            collection: 'article',
            spec: {author: ASC, publish_date: DESC, draft: ASC},
            options: {}
        },
        {
            collection: 'article',
            spec: {article_media: ASC},
            options: {}
        },
        {
            collection: 'article',
            spec: {article_topics: ASC},
            options: {}
        },
        {
            collection: 'article',
            spec: {article_sections: ASC},
            options: {}
        },
        {
            collection: 'article',
            spec: {created: ASC},
            options: {}
        },

        //comment
        {
            collection: 'comment',
            spec: {article: ASC},
            options: {}
        },
        {
            collection: 'comment',
            spec: {commenter: ASC},
            options: {}
        },

        //topic
        {
            collection: 'topic',
            spec: multisite ? {name: ASC, site: ASC} : {name: ASC},
            options: {unique: true}
        },
        {
            collection: 'topic',
            spec: {created: ASC},
            options: {}
        },

        //page
        {
            collection: 'page',
            spec: multisite ? {url: ASC, site: ASC} : {url: ASC},
            options: {unique: true}
        },
        {
            collection: 'page',
            spec: multisite ? {headline: ASC, site: ASC} : {headline: ASC},
            options: {unique: true}
        },
        {
            collection: 'page',
            spec: {publish_date: DESC},
            options: {}
        },
        {
            collection: 'page',
            spec: {publish_date: DESC, draft: ASC},
            options: {}
        },
        {
            collection: 'page',
            spec: {author: ASC},
            options: {}
        },
        {
            collection: 'page',
            spec: {author: ASC, publish_date: DESC, draft: ASC},
            options: {}
        },
        {
            collection: 'page',
            spec: {page_media: ASC},
            options: {}
        },
        {
            collection: 'page',
            spec: {page_topics: ASC},
            options: {}
        },
        {
            collection: 'page',
            spec: {created: ASC},
            options: {}
        },

        //lock
        {
            collection: 'lock',
            spec: {name: ASC},
            options: {unique: true}
        },
        {
            collection: 'lock',
            spec: {timeout: ASC},
            options: {expireAfterSeconds: 0}
        },

        //token
        {
            collection: 'auth_token',
            spec: {token: ASC},
            options: {unique: true}
        },
        {
            collection: 'auth_token',
            spec: {created: ASC},
            options: {expireAfterSeconds: 25920000}
        }
    ];
};