module.exports = (pb) => {

    class TokenService {
        constructor (context) {
            this.site = context.site;
            this.user = context.user;
        }

        async generateUserToken () {
            let tokenInfo = {
                token: pb.util.uniqueId(),
                user: this.user,
                used: false,
                site: this.site
            };

            let result = await this.saveToken(tokenInfo);
            return {token: result.token};
        }
        async saveToken (tokenInfo) {
            let doc = pb.DocumentCreator.create('auth_token', tokenInfo);
            let dao = new pb.SiteQueryService(this.site, false);
            return dao.saveAsync(doc);
        }
        async validateUserToken (token) {
            let dao = new pb.SiteQueryService({site: this.site, onlyThisSite: true});
            let tokenInfo = await dao.loadByValueAsync('token', token, 'auth_token');

            if (!tokenInfo || tokenInfo.used) {
                throw new Error("Token was either not found or already used.");
            }

            tokenInfo.used = true;
            let result = await this.saveToken(tokenInfo);

            let timeDiff = Date.now() - tokenInfo.created;
            return {
                tokenInfo: result,
                valid: timeDiff < 300000
            };
        };
    }

    //exports
    return TokenService;
};
