const Bluebird = require('bluebird');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);

const sinon = require("sinon");
require('sinon-as-promised')(Bluebird);

const proxyquire = require('proxyquire').noCallThru();

module.exports = {
    sinon,
    proxyquire,
    expect: chai.expect
};
