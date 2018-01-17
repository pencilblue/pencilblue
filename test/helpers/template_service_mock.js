const sinon = require('sinon');
module.exports = function TemplateServiceModule() {

    function TemplateService(ls) {
        this.localCallbacks = {};
    }

    TemplateService.prototype.reset = function(){
        this.localCallbacks = {};
    };

    TemplateService.prototype.registerLocal = function (flag, callbackOrValue) {
        this.localCallbacks[flag] = callbackOrValue;

        return true;
    };
    TemplateService.prototype.load = function (template, cb) {
        cb(null, "");
    };
    TemplateService.prototype.loadAsync = sinon.stub().returns(Promise.resolve('Template HTML'));

// Helper Functions for Expects
    TemplateService.prototype.doesExist = function(key){
        let wasFound = false;
        Object.keys(this.localCallbacks).forEach(local => {
            if(local === key && ( this.localCallbacks[local] || this.localCallbacks[local]  === '') ){
                wasFound = true;
            }
        });
        return wasFound;
    };
    TemplateService.prototype.isLocalTemplateValue = function(key) {
        return (this.doesExist(key) && this.localCallbacks[key].raw) ? true : false;
    };
    TemplateService.prototype.getAll = function(){
        return this.localCallbacks;
    };
    TemplateService.prototype.getRegisteredLocal = function(id){
        if(this.localCallbacks[id] && this.localCallbacks[id].raw){
            return this.localCallbacks[id].raw;
        }
        else if(this.localCallbacks[id]){
            return this.localCallbacks[id];
        }
        return '';
    };
    TemplateService.prototype.getRaw = function(id){
      return this.localCallbacks[id].raw || this.localCallbacks[id];
    };



    return TemplateService;
};
