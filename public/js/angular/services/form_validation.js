angular.module('validation', [])
.service('validationService', function() {
    this.isFormValid = function(form) {
        return form.$valid;
    };

    this.isFieldValid = function(field, validationType) {
        if(!field) {
            return true;
        }

        if(typeof validationType === 'undefined') {
            validationType = 'required';
        }
        return !field.$error[validationType];
    };

    this.isSafeFileName = function(value, required){
        if(typeof required === 'undefined') {
            required = 'required';
        }
        if (!value && !required) {
                return true;
        }
        return  (typeof value === 'string') && /^[a-zA-Z0-9-_]+$/.test(value);
      };
});
