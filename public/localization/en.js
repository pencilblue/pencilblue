loc = 
{
    generic:
    {
        NONE: 'None',
        LOGOUT: 'Logout',
        WRITER: 'Writer',
        READER: 'Reader',
        EDITOR: 'Editor',
        MANAGING_EDITOR: 'Managing Editor',
        ADMINISTRATOR: 'Administrator',
        CONTENT: 'Content',
        META_DATA: 'Meta data',
        FORM_INCOMPLETE: 'The form is incomplete',
        INSUFFICIENT_CREDENTIALS: 'You are not authorized to perform that action',
        SAVE: 'Save',
        SAVE_DRAFT: 'Save draft',
        CANCEL: 'Cancel',
        NOW: 'Now',
    },
    index:
    {
        
    },
    login:
    {
        LOGIN: 'Login',
        USERNAME: 'Username',
        PASSWORD: 'Password',
        INVALID_LOGIN: 'Invalid username and password combination.'
    },
    admin:
    {
        DASHBOARD: 'Dashboard',
        CONTENT: 'Content',
        PAGES: 'Pages',
        ARTICLES: 'Articles',
        SECTIONS: 'Sections',
        PLUGINS: 'Plugins',
        THEMES: 'Themes',
        FRONTEND: 'Frontend plugins',
        BACKEND: 'Backend plugins',
        INSTALL_PLUGIN: 'Install a plugin',
        USERS: 'Users',
        SETTINGS: 'Settings',
        SITE_SETTINGS: 'Site settings',
        ACCOUNT: 'Account',
        CUSTOM_VARIABLES: 'Custom variables',
        CUSTOM_VARIABLE_KEY: 'Unique name for the variable',
        CUSTOM_VARIABLE_VALUE: 'Value associated with the variable'
    },
    sections:
    {
        SECTION_MAP: 'Section map',
        NEW_SECTION: 'New section',
        SECTION_NAME: 'Section name',
        DESCRIPTION: 'Description',
        PARENT_SECTION: 'Parent section',
        META_KEYWORDS: 'Meta keywords',
        META_KEYWORDS_PLACEHOLDER: 'Comma-separated keywords',
        EXISTING_SECTION: 'A section with this name already exists',
        SECTION_CREATED: 'The section was successfully created',
        SECTION_EDITED: 'The section was successfully edited'
    },
    pages:
    {
        NEW_PAGE: 'New page',
        PAGE_URL: 'Page URL',
        CUSTOM_URL: 'custom-url',
        TEMPLATE: 'Template',
        HEADLINE: 'Headline',
        SUBHEADING: 'Subheading',
        PUBLISH_DATE: 'Publish date',
        FOCUS_KEYWORD: 'Focus keyword',
        FOCUS_KEYWORD_PLACEHOLDER: 'The top keyword associated with the content',
        SEO_TITLE: 'SEO title',
        SEO_TITLE_PLACEHOLDER: 'Limited to 70 characters',
        META_DESC: 'Meta description',
        META_DESC_PLACEHOLDER: 'Limited to 156 characters',
        META_KEYWORDS: 'Meta keywords',
        META_KEYWORDS_PLACEHOLDER: 'Comma-separated keywords'
    },
    articles:
    {
        NEW_ARTICLE: 'New article',
        ARTICLE_URL: 'Article URL',
        CUSTOM_URL: 'custom-url',
        STANDALONE_TEMPLATE: 'Standalone template',
        HEADLINE: 'Headline',
        SUBHEADING: 'Subheading',
        PUBLISH_DATE: 'Publish date',
        ACTIVE_SECTIONS: 'Drag associated sections here',
        INACTIVE_SECTIONS: 'Drag unassociated sections here',
        FOCUS_KEYWORD: 'Focus keyword',
        FOCUS_KEYWORD_PLACEHOLDER: 'The top keyword associated with the content',
        SEO_TITLE: 'SEO title',
        SEO_TITLE_PLACEHOLDER: 'Limited to 70 characters',
        META_DESC: 'Meta description',
        META_DESC_PLACEHOLDER: 'Limited to 156 characters',
        META_KEYWORDS: 'Meta keywords',
        META_KEYWORDS_PLACEHOLDER: 'Comma-separated keywords'
    },
    users:
    {
        MANAGE_USERS: 'Manage users',
        NEW_USER: 'New user',
        ACCOUNT_INFO: 'Account info',
        PERSONAL_INFO: 'Personal info',
        USERNAME: 'Username',
        FIRST_NAME: 'First name',
        LAST_NAME: 'Last name',
        EMAIL: 'Email',
        PASSWORD: 'Password',
        CONFIRM_PASSWORD: 'Confirm Password',
        GENERATE: 'Generate',
        USER_TYPE: 'User type',
        CREATE_USER: 'Create user',
        PASSWORD_MISMATCH: 'Passwords do not match',
        EXISTING_USERNAME: 'Username is already registered',
        EXISTING_EMAIL: 'Email address is already registered',
        ERROR_SAVING: 'There was an error saving the user',
        USER_CREATED: 'The user was successfully created',
        USER_EDITED: 'The user was successfully edited'
    }
}

// Allows for both server and client use
if(typeof global !== 'undefined')
{
    global.loc = loc;
    global.localizationLanguage = 'en';
}
