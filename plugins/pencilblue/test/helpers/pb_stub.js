var util = require('util');
var sinon = require('sinon');
module.exports = () => {

    let pb = sinon.stub();
    pb.AdminSubnavService = { registerFor: sinon.stub() };
    pb.BaseController = sinon.stub();
    pb.BaseController.apiResponse = sinon.stub();
    pb.BaseService = sinon.stub();
    pb.cache = sinon.stub();
    pb.cache.delAsync = sinon.stub();
    pb.cache.set = sinon.stub();
    pb.cache.expire = sinon.stub();
    pb.DAO = sinon.stub();

    pb.util = {
        clone: (arg) => {return JSON.parse(JSON.stringify(arg));},
        uniqueId: sinon.stub().returns('randomID')
    }
    pb.config = {
        cb:{
            cb_api_dev_key: 'LOOKATMEIMMRKEYTHING'
        }
    }

    /****************************************
     * Define the Methods of the Template Service Mocks
     */
    pb.TemplateService = require('./template_service_mock')();
    pb.TemplateValue = function(content, isEscaped){
        return {
            raw: content,
            htmlEscaped: isEscaped
        };
    };
    pb.Localization = require('./localization_mock')();

    /****************************************
     * Define the Methods of the CMS Stub
     */
    pb.PromisedCMSBaseController = sinon.stub();
    pb.PromisedCMSBaseController.prototype.getServiceContext = sinon.stub().returns({locale: 'en-US', isContext: true});

    pb.PromisedCMSBaseController.prototype.ts = new pb.TemplateService();
    pb.PromisedCMSBaseController.prototype.ls = new pb.Localization();

    pb.PromisedCMSBaseController.prototype.log = sinon.stub();
    pb.PromisedCMSBaseController.prototype.log.error = sinon.stub();
    pb.PromisedCMSBaseController.prototype.log.warn = sinon.stub();

    /****************************************
     * Define the Methods of the Plugin Service Stub
     */
    pb.PluginService = sinon.stub();
    pb.PluginService.isActivePlugin = sinon.stub().returns(true);
    pb.PluginService.getService = sinon.stub();

    pb.BaseService = sinon.stub();
    pb.BaseService.prototype = {
        context: {}
    };

    pb.BaseService = sinon.stub();
    pb.BaseService.prototype = {
        context: {},
        createService: sinon.stub().returns({})
    };
    return pb;
};
