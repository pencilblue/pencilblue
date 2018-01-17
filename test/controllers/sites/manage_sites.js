const {expect, sinon} = require('../../helpers/spec_helper');
const pb = require('../../helpers/pb_stub')();

const ManageSitesController = require('../../../plugins/pencilblue/controllers/admin/sites/manage_sites')(pb);

describe('ManageSitedController', function () {
    let manageSitesController;

    beforeEach(function () {
        manageSitesController = new ManageSitesController();
        manageSitesController.siteObj = {displayName: 'My Site Display Name'};

        manageSitesController.ts = new pb.TemplateService();
        manageSitesController.ls = new pb.Localization();
    });

    describe('to render the page', function () {
       it('should get sites and register an angular object', function (done) {
          manageSitesController._getSites = sinon.stub().resolves(['myActiveSites', 'myInactiveSites', 'activeSiteCount', 'inactiveSiteCount']);
           manageSitesController.render(function(data) {
                expect(data.content).to.exist;
                let angularObject = manageSitesController.ts.getRegisteredLocal('angular_objects');
                expect(angularObject.navigation).to.be.ok;
                expect(angularObject.pills).to.equal('sites_manage');
                expect(angularObject.activeSites).to.equal('myActiveSites');
                expect(angularObject.inactiveSites).to.equal('myInactiveSites');
                expect(angularObject.activeCount).to.equal('activeSiteCount');
                expect(angularObject.inactiveCount).to.equal('inactiveSiteCount');
                expect(angularObject.tabs).to.be.ok;
                done();
          });
       });
        it('should calculate the active and inactive page counts', function (done) {
            manageSitesController._getSites = sinon.stub().resolves(['myActiveSites', 'myInactiveSites', 1123, 136]);
            manageSitesController.render(function(data) {
                expect(data.content).to.exist;
                let angularObject = manageSitesController.ts.getRegisteredLocal('angular_objects');
                expect(angularObject.navigation).to.be.ok;
                expect(angularObject.activeCount).to.equal(1123);
                expect(angularObject.inactiveCount).to.equal(136);
                expect(angularObject.totalPagesActive).to.equal(23);
                expect(angularObject.totalPagesInactive).to.equal(3);
                done();
            });
        });

    });
    describe('to search', function () {
        beforeEach(function () {
            manageSitesController._getSitesByCriteria = sinon.stub().resolves('results');
        });
        it('should default the site query to empty, and set active to true if it is true, then run a search on uid and display name according to active state', function (done) {
            manageSitesController.query = {
                active: 'true'
            };
            manageSitesController.search(function (data) {
                let queryOptions = manageSitesController._getSitesByCriteria.args[0][0];
                expect(data.content).to.equal('results');
                expect(queryOptions.where.active).to.equal(true);
                expect(queryOptions.where['$or'][0].uid).to.equal('');
                expect(queryOptions.where['$or'][1].displayName.toString()).to.equal('/(?:)/i');
                expect(queryOptions.where['$or'][2].hostname.toString()).to.equal('/(?:)/i');
                done();
            });
        });
        it('should use the site query, and set active to false if it is not equal to the string true, then run a search on uid and display name according to active state', function (done) {
            manageSitesController.query = {
                active: 'false',
                site: 'siteID'
            };
            manageSitesController.search(function (data) {
                let queryOptions = manageSitesController._getSitesByCriteria.args[0][0];
                expect(data.content).to.equal('results');
                expect(queryOptions.where.active).to.equal(false);
                expect(queryOptions.where['$or'][0].uid).to.equal('siteID');
                expect(queryOptions.where['$or'][1].displayName.toString()).to.equal('/siteID/i');
                expect(queryOptions.where['$or'][2].hostname.toString()).to.equal('/siteID/i');
                done();
            });
        });
        it('should callback with an error if the _getSitesByCriteria rejects', function (done) {
            manageSitesController._getSitesByCriteria = sinon.stub().rejects(new Error('something went wrong!'));
            manageSitesController.query = {
                active: 'false'
            };
            manageSitesController.search(function (err) {
                let queryOptions = manageSitesController._getSitesByCriteria.args[0][0];
                expect(err).to.exist;
                expect(err.message).to.equal('something went wrong!');
                expect(queryOptions.where.active).to.equal(false);
                done();
            });
        });
    });
    describe('to paginate', function () {
        beforeEach(function () {
            manageSitesController._getSitesByCriteria = sinon.stub().resolves('results');
        });
        it('should default page to 0, and check if active is true', function (done) {
            manageSitesController.query = {
                active: 'true'
            };
            manageSitesController.getPage(function (data) {
                let queryOptions = manageSitesController._getSitesByCriteria.args[0][0];
                expect(data.content).to.equal('results');
                expect(queryOptions.where.active).to.equal(true);
                expect(queryOptions.limit).to.equal(50);
                expect(queryOptions.offset).to.equal(0);
                done();
            });
        });
        it('should respect the page number if given and adjust the offset by the perpage.', function (done) {
            manageSitesController.query = {
                active: 'false',
                page: '2'
            };
            manageSitesController.getPage(function (data) {
                let queryOptions = manageSitesController._getSitesByCriteria.args[0][0];
                expect(data.content).to.equal('results');
                expect(queryOptions.where.active).to.equal(false);
                expect(queryOptions.limit).to.equal(50);
                expect(queryOptions.offset).to.equal(100);
                done();
            });
        });
        it('should callback with an error if the _getSitesByCriteria rejects', function (done) {
            manageSitesController._getSitesByCriteria = sinon.stub().rejects(new Error('something went wrong!'));
            manageSitesController.query = {
                active: 'false',
                page: '4'
            };
            manageSitesController.getPage(function (err) {
                let queryOptions = manageSitesController._getSitesByCriteria.args[0][0];
                expect(err).to.exist;
                expect(err.message).to.equal('something went wrong!');
                expect(queryOptions.where.active).to.equal(false);
                expect(queryOptions.limit).to.equal(50);
                expect(queryOptions.offset).to.equal(200);
                done();
            });
        });
    });
    describe('getting all of the site data for initial page load', function () {
        beforeEach(function () {
            manageSitesController._getSitesByCriteria = sinon.stub().resolves(true)
        });
        it('should call to get active sites, inactive sites, active count, and inactive count', function () {
            return manageSitesController._getSites()
                .then(() => {
                    let activeSites = manageSitesController._getSitesByCriteria.args[0][0];
                    let inactiveSites = manageSitesController._getSitesByCriteria.args[1][0];

                    let activeSitesCountWhereClause = manageSitesController.dao.count.args[0][1];
                    let inactiveSitesCountWhereClause = manageSitesController.dao.count.args[1][1];

                    expect(activeSites.limit).to.equal(50);
                    expect(activeSites.offset).to.equal(0);
                    expect(activeSites.where.active).to.equal(true);

                    expect(inactiveSites.limit).to.equal(50);
                    expect(inactiveSites.offset).to.equal(0);
                    expect(inactiveSites.where.active).to.equal(false);

                    expect(activeSitesCountWhereClause.active).to.equal(true);
                    expect(inactiveSitesCountWhereClause.active).to.equal(false);
                });
        });
    });
    describe('get sites by criteria', function () {
        beforeEach(function () {
            manageSitesController.dao.q.yields(null, [{}]);
        });
        it('should take in options, and perform a query with them on the site collection', function () {
            let options = {someKey: 1};
            return manageSitesController._getSitesByCriteria(options)
                .then(() => {
                    expect(manageSitesController.dao.q.calledOnce).to.equal(true);
                    expect(manageSitesController.dao.q.calledWith('site', options)).to.equal(true);
                })
        });
        it('should stamp the active theme onto the site object', function () {
            let options = {someKey: 1};
            manageSitesController.dao.q.yields(null, [{}]);
            return manageSitesController._getSitesByCriteria(options)
                .then((sites) => {
                    expect(sites[0]).to.exist;
                    expect(sites[0].activeTheme).to.equal('bravo');
                })
        });
    });
    describe('the sub navigation options', function () {
        let subNav;
        before(function () {
            subNav = ManageSitesController.getSubNavItems('dummy', new pb.Localization());
        });
        it('should have a link for manage sites - ie current page', function () {
            expect(subNav[0]).to.exist;
            expect(subNav[0].name).to.equal('manage_sites');
            expect(subNav[0].title).to.equal('admin.MANAGE_SITES');
            expect(subNav[0].icon).to.equal('refresh');
            expect(subNav[0].href).to.equal('/admin/sites');
        });
        it('should have a link for creating a new site', function () {
            expect(subNav[1]).to.exist;
            expect(subNav[1].name).to.equal('new_site');
            expect(subNav[1].title).to.equal('');
            expect(subNav[1].icon).to.equal('plus');
            expect(subNav[1].href).to.equal('/admin/sites/new');
        });
    });
    describe('the page tabs', function () {
        let tabNav;
        before(function () {
            tabNav = manageSitesController.tabs;
        });
        it('should have a tab for active sites', function () {
            expect(tabNav[0].active).to.equal('active');
            expect(tabNav[0].href).to.equal('#active_sites');
            expect(tabNav[0].icon).to.equal('font');
            expect(tabNav[0].title).to.equal('Active Sites');
        });
        it('should have a tab for inactive sites', function () {
            expect(tabNav[1].active).to.not.exist;
            expect(tabNav[1].href).to.equal('#inactive_sites');
            expect(tabNav[1].icon).to.equal('italic');
            expect(tabNav[1].title).to.equal('Inactive Sites');
        });
    });

    it('controller should be a ManageSitesController object', function () {
        let manageSitesController = new ManageSitesController();
        expect(manageSitesController).to.be.instanceof(ManageSitesController);
    });

});
