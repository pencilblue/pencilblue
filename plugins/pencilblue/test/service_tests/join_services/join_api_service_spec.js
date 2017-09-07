// const {expect, sinon} = require('../../helpers/spec_helper');
// const pb = require('../../helpers/pb_stub')();
//
// const joinApiService = require('../../../services/join_services/join_api_service')(pb);
//
// describe('joinApiService', function () {
//     let service;
//
//     beforeEach(function () {
//         service = new joinApiService();
//
//     });
//
//     describe('getting side bar content', () => {
//         beforeEach(() => {
//             service.cacheService = {
//                 makeCachedApiCallAsync: sinon.stub()
//             };
//         });
//
//         it('should call _replaceSideBarLinks with branding.JoinCustomMsgHTML if makeCachedApiCall to getJoinSideBarContent provides that data ', (done) => {
//
//             service.cacheService.makeCachedApiCallAsync.resolves({'Branding': {JoinCustomMsgHTML: 'this is a custom message'}});
//             service._replaceSideBarLinks = sinon.stub();
//             return service.getJoinSideBarContent().then(_ => {
//                 expect(service._replaceSideBarLinks.calledWith('this is a custom message')).to.equal(true);
//                 done();
//             });
//         });
//
//         it('should call _replaceSideBarLinks with the default join_form_side_bar template if the call to getJoinBarContent does not provide sufficient data', (done) => {
//             service.cacheService.makeCachedApiCallAsync.resolves({'Branding': {JoinCustomMsgHTML: null}});
//             service._replaceSideBarLinks = sinon.stub();
//             return service.getJoinSideBarContent().then(_ => {
//                 expect(service._replaceSideBarLinks.calledWith('^tmp_elements=join_form_elements=join_form_side_bar^')).to.equal(true);
//                 done();
//             });
//         });
//
//         it('matrix links in the privacy policy and terms should be replaced with cms links', () => {
//             let content = '<a href="/TalentNetwork/Pages/PrivacyPolicy.aspx">Privacy Policy</a><a href="/TalentNetwork/Pages/TalentNetworkTerms.aspx">Terms and Conditions</a> ';
//             let expectedContent = '<a href="/en-US/privacy-policy">Privacy Policy</a><a href="/en-US/terms-and-conditions">Terms and Conditions</a> ';
//             content = service._replaceSideBarLinks(content);
//             expect(content).to.equal(expectedContent);
//
//         });
//     });
//
//     describe('getting join questions', () => {
//
//         it('required questions should be ordered before optional questions ', () => {
//             service._removeColonsFromText = sinon.stub().returnsArg(0);
//             let questions = [{Required: false, id: 'q1'}, {Required: true, id: 'q2'}];
//             let questionList = service._orderQuestionsByRequired(questions);
//             expect(questionList[0].id).to.equal('q2');
//             expect(questionList[1].id).to.equal('q1');
//
//         });
//
//         it('if a trailing colon exist on a question it should be removed from question text', () => {
//             let question = {Text: 'myQuestion:'};
//             question = service._removeColonsFromText(question);
//             expect(question.Text).to.equal('myQuestion');
//         });
//     });
//
// });
