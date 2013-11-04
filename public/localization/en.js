loc = 
{
    generic:
    {
        LOGOUT: 'Logout',
        FORM_INCOMPLETE: 'The form is incomplete',
        INSUFFICIENT_CREDENTIALS: 'You are not authorized to perform that action'
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
        PAGES: 'Pages',
        POSTS: 'Posts',
        PLUGINS: 'Plugins',
        THEMES: 'Themes',
        FRONTEND: 'Frontend plugins',
        BACKEND: 'Backend plugins',
        INSTALL_PLUGIN: 'Install a plugin',
        USERS: 'Users',
        MANAGE_USERS: 'Manage users',
        NEW_USER: 'New user',
        SETTINGS: 'Settings',
        SITE_SETTINGS: 'Site settings',
        ACCOUNT: 'Account'
    },
    pages:
    {
        NEW_PAGE: 'New page',
        PAGE_URL: 'Page url',
        CUSTOM_URL: 'custom-url',
        CONTENT: 'Content',
        TEMPLATE: 'Template'
    },
    new_user:
    {
        USERNAME: 'Username',
        FIRST_NAME: 'First name',
        LAST_NAME: 'Last name',
        EMAIL: 'Email',
        PASSWORD: 'Password',
        CONFIRM_PASSWORD: 'Confirm Password',
        GENERATE: 'Generate',
        WRITER: 'Writer',
        READER: 'Reader',
        EDITOR: 'Editor',
        ADMINISTRATOR: 'Administrator',
        CREATE_USER: 'Create user',
        PASSWORD_MISMATCH: 'Passwords do not match',
        EXISTING_USERNAME: 'Username is already registered',
        EXISTING_EMAIL: 'Email address is already registered',
        ERROR_SAVING: 'There was an error saving the user',
        USER_CREATED: 'The user was successfully created'
    }
}

// Allows for both server and client use
if(typeof global !== 'undefined')
{
    global.loc = loc;
}
