module.exports = (pb) => {
    
    function TokenAuthentication(options) {
        this.options = options;
        this.tokenService = new pb.TokenService(options);
        this.userService = new pb.UserService(options);
    }
    /**
     * @method authenticate
     * @param {String} token
     * @param {Function} cb
     */
    async function action(token, cb) {
        let result = null;
        try {
            result = await this.tokenService.validateUserToken(token);
        } catch (err) {
            pb.log.error(err);
            return cb(null, false);
        }
        this.userService.get(result.tokenInfo.user, cb);
    }

    return new CustomStrategy(action);
};
