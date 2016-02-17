/**
 * Created by logenet on 1/28/16.
 */
module.exports = {
  "siteName": "My PencilBlue Site",
  "siteRoot": "http://localhost:8080",
  "sitePort": 8080,
  "logging": {
    "level": "silly"
  },
  "localization": {
    "db":false,
    "nav":false,
    "pages": false
  },
  "db": {
    "type":"mongo",
    "servers": [
      "localhost:27017"
    ],
    "name": "multilingual",
    "writeConcern": 1
  },
  "cache": {
    "fake": true,
    "host": "localhost",
    "port": 6379
  },
  "settings": {
    "use_memory": false,
    "use_cache": false
  },
  "templates": {
    "use_memory": true,
    "use_cache": false
  },
  "plugins": {
    "caching": {
      "use_memory": false,
      "use_cache": false
    }
  },
  "registry": {
    "type": "mongo"
  },
  "session": {
    "storage": "mongo"
  },
  "media": {
    "provider": "mongo",
    "max_upload_size": 6 * 1024 * 1024
  },
  "cluster": {
    "workers": 1,
    "self_managed": true
  },
  multisite: {
    enabled: true,
    globalRoot: 'http://global.localhost:8080'
  },
    "TemplateService":{
        "useReprocess": false
    }
};
