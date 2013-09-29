var Loader = require('../../lib/Loader');
var Processor = require('../../lib/Processor');
var Reporter = require('../../lib/Reporter');
var fs = require('fs');
var logDir = './test/logs';
var es = require('event-stream');


var assert = require('assert');

describe('Log parser', function () {
    var files;
    before(function () {
        files = fs.readdirSync(logDir);
    });
    it('works', function (done) {
        var loader = new Loader(files, logDir);
        var processor = new Processor();
        var reporter = new Reporter();
        var reports = 0;

        es.pipeline(
            loader,
            es.split(),
            processor,
            reporter,
            es.through(function (data) {
                reports++;
                assert.equal(typeof data, 'object');
                assert(data.hasOwnProperty('uniques'));
                console.log('report', data);
            }, function () {
                assert.equal(reports, 1);
                done();
            })
        );
    });
});
