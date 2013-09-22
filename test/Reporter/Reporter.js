var vows = require('vows');
var assert = require('assert');
var stream = require('stream');
var es = require('event-stream');
var through = require('through');

var Reporter = require('../../lib/Reporter');

vows.describe('Reporter').addBatch({
    'can be instantiated': {
        topic: new Reporter(),
        'is object': function (topic) {
            assert.isObject(topic);
        },
        'is a transformer': function (topic) {
            assert(topic instanceof stream.Transform);
            assert.equal(typeof topic._transform, 'function');
        },
        'works': {
            topic: function (reporter) {
                var source = require('./test.json');
                var cb = this.callback;
                var d;

                es.pipeline(
                    es.readArray(source),
                    reporter,
                    through(function (data) {
                        d = data;
                        cb(null, data);
                    })
                );
            },
            'report is object': function (error, report) {
                console.log('is object');
                assert.isObject(report);
            },
            'has properties': function (error, report) {
                console.log('report', report);
                assert(report.hasOwnProperty('uniques'));
            }
        }
    }
}).export(module);