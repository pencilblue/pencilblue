const {expect, sinon} = require('../../helpers/spec_helper');
const pb = require('../../helpers/pb_stub')();

const ManageSitesController = require('../../../controllers/admin/sites/manage_sites')(pb);

describe('When hitting the manage sites route', function () {
    let manageSitesController;

    beforeEach(function () {
        manageSitesController = new ManageSitesController();
        manageSitesController.siteObj = {displayName: 'My Site Display Name'};

        manageSitesController.ts = new pb.TemplateService();
        manageSitesController.ls = new pb.Localization();
    });

    describe('get sites by criteria', function () {
        beforeEach(function() {

        });
        it('should take in options, and perform a query with them on the site collection', function () {

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
