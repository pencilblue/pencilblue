loc = 
{
    generic:
    {
        
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
        THEMES: 'Themes',
        PLUGINS: 'Plugins',
        SETTINGS: 'Settings'
    }
}

// Allows for both server and client use
if(typeof global !== 'undefined')
{
    global.loc = loc;
}
