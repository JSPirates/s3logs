var Loader = require('../../lib/Loader');
var stream = require('stream');
var fs = require('fs');
var through = require('through');

module.exports = {
    instance: function (test) {
        var loader = new Loader();
        test.equal(typeof loader, "object");
        test.ok(loader instanceof stream.Readable);
        test.equals(typeof loader._read, "function");
        test.done();
    },
    _read: {
        'stream ends': function (test) {
            var loader = new Loader([]);
            loader.push = function (data) {
                test.equals(data, null);
                test.done();
            };
            loader._read();
        },
        'stream reads': {
            setUp: function (callback) {
                this.filenames = [
                    '2013-09-10-15-32-50-79EAEEEA834E07DC',
                    '2013-09-10-16-21-56-EB94832693B13B57',
                    '2013-09-10-16-21-56-EB94832693B13B57',
                    '2013-09-10-20-51-37-A3B4685F4CAF3C44',
                    '2013-09-10-21-45-12-8F25AF55F5EFE1D0'
                ];
                this.loader = new Loader(this.filenames, './logs');
                callback();
            },
            count: function (test) {
                var count = 0;
                var targetCount = this.filenames.length;
                this.loader.on('data', function (data) {
                    count++;
                });
                this.loader.on('end', function () {
                    test.equals(count, targetCount);
                    test.done();
                });
            },
            content: function (test) {
                var sample = this.filenames.map(function (filename) {
                    return fs.readFileSync('./logs/' + filename);
                });
                this.loader.pipe(through(function (data) {
                    sample.splice(sample.indexOf(data), 1);
                }, function () {
                    test.equals(sample.length, 0);
                    test.done();
                }));
            }
        }
    }
};