var Processor = require('../../lib/Processor');
var stream = require('stream');
var assert = require('assert');

var JaySchema = require('jayschema');
var js = new JaySchema();
var es = require('event-stream');

var through = require('through');

var schema = {
    type: "object",
    required: ['bucket', 'timeString', 'remoteIP', 'requester',
        'requestId', 'requestType', 'filename', 'uri', 'statusCode',
        'errorCode', 'bytesSent', 'objectSize', 'totalTime',
        'referer', 'userAgent', 'add'
    ],
    properties: {
        bucket: { type: 'string'},
        timeString: { type: 'string'},
        remoteIP: { type: 'string'},
        requester: { type: 'string'},
        requestId: { type: 'string'},
        requestType: { type: 'string'},
        filename: { type: 'string'},
        uri: { type: 'string'},
        statusCode: { type: 'integer' },
        errorCode: { type: ['string', 'null'] },
        bytesSent: { type: ['integer', 'null']},
        objectSize: { type: ['integer', 'null']},
        totalTime: { type: ['integer', 'null']},
        referer: { type: ['string', 'null'] },
        userAgent: { type: ['string', 'null'] },
        add: { type: 'string' }
    }
};

suite('Processor', function () {

    test('instance', function (done) {
        var processor = new Processor();
        assert.equal(typeof processor, "object", 'processor is an object');
        assert(processor instanceof stream.Transform);
        assert.equal(typeof processor._transform, 'function');
        done();
    });

    suite('transforms', function () {
        var processor;
        setup(function () {
            processor = new Processor();
        });
        suite('regexp', function () {
            var reg;
            setup(function () {
                reg = processor.TEST_RE;
            });
            test('correct', function () {
                var strings = [
                    'a527002d94e86f45bc3eb23479890f1832ab559c2a44d24da78a9dcd7a426b17 jspirates [10/Sep/2013:14:52:51 +0000] 92.241.252.220 - 5CD3E7282AE525E0 REST.GET.OBJECT jsp_s01e01_480p.mp4 "GET /jspirates/jsp_s01e01_480p.mp4 HTTP/1.1" 403 AccessDenied 231 - 13 - "-" "AppleCoreMedia/1.0.0. (AAS-2.3.4; U; Windows NT 6.1)" -',
                    'a527002d94e86f45bc3eb23479890f1832ab559c2a44d24da78a9dcd7a426b17 jspirates [10/Sep/2013:18:50:50 +0000] 92.241.252.220 - 815BD1E4F164AF6D REST.GET.OBJECT jsp_004.mp3 "GET /jspirates/jsp_004.mp3 HTTP/1.1" 200 - 65282325 65282325 113634 86 "-" "Zune/4.8" -',
                    'a527002d94e86f45bc3eb23479890f1832ab559c2a44d24da78a9dcd7a426b17 jspirates [10/Sep/2013:20:25:36 +0000] 46.173.1.85 - C2B90E04EC780038 REST.GET.OBJECT jsp_004_720p.mp4 "GET /jspirates/jsp_004_720p.mp4 HTTP/1.1" 206 - 290158515 544074005 1367230 420 "-" "AppleCoreMedia/1.0.0.10B329 (iPad; U; CPU OS 6_1_3 like Mac OS X; ru_ru)" -'
                ];
                var parsed = strings.map(function (str) {
                    return reg.exec(str);
                });
                parsed.forEach(function (chunk) {
                    assert(!!chunk, "Chunk is truthy");
                    assert(Array.isArray(chunk));
                    assert(chunk[0].length > 0);
                    assert.equal(chunk.length, 17);
                });
            });
            test('incorrect', function () {
                var strings = [
                    'asdnjkfasjkdf ajklsdnfjkals dlfn ajlkwe nfuq weufhqiw eif ',
                    'asjdfjsdhfa sldjhfa фыоварфлыра фолырва йдцу алдйоцур ац',
                    'a527002d94e86f45bc3eb23479890f1832ab559c2a44d24da78a9dcd7a426b17 jspirates [10/Sep/2013:20:25:36 +0000] 46.173.1.85 - C2B90E04EC780038 REST.GET.OBJECT jsp_004_720p.mp4 "GET /jspirates/jsp_004_720p.mp4 HTTP/1.1" 206 - 290158515 544074005 1367230 420 "AppleCoreMedia/1.0.0.10B329 (iPad; U; CPU OS 6_1_3 like Mac OS X; ru_ru)" -'
                ];
                var parsed = strings.map(function (str) {
                    return reg.exec(str);
                });
                parsed.forEach(function (chunk) {
                    assert.equal(chunk, null);
                });
            });
        });
        test('format', function (done) {
            var strings = [
                'a527002d94e86f45bc3eb23479890f1832ab559c2a44d24da78a9dcd7a426b17 jspirates [10/Sep/2013:14:52:51 +0000] 92.241.252.220 - 5CD3E7282AE525E0 REST.GET.OBJECT jsp_s01e01_480p.mp4 "GET /jspirates/jsp_s01e01_480p.mp4 HTTP/1.1" 403 AccessDenied 231 - 13 - "-" "AppleCoreMedia/1.0.0. (AAS-2.3.4; U; Windows NT 6.1)" -',
                'a527002d94e86f45bc3eb23479890f1832ab559c2a44d24da78a9dcd7a426b17 jspirates [10/Sep/2013:18:50:50 +0000] 92.241.252.220 - 815BD1E4F164AF6D REST.GET.OBJECT jsp_004.mp3 "GET /jspirates/jsp_004.mp3 HTTP/1.1" 200 - 65282325 65282325 113634 86 "-" "Zune/4.8" -',
                'a527002d94e86f45bc3eb23479890f1832ab559c2a44d24da78a9dcd7a426b17 jspirates [10/Sep/2013:20:25:36 +0000] 46.173.1.85 - C2B90E04EC780038 REST.GET.OBJECT jsp_004_720p.mp4 "GET /jspirates/jsp_004_720p.mp4 HTTP/1.1" 206 - 290158515 544074005 1367230 420 "-" "AppleCoreMedia/1.0.0.10B329 (iPad; U; CPU OS 6_1_3 like Mac OS X; ru_ru)" -'
            ];
            es.pipeline(
                es.readArray(strings),
                processor,
                through(function (data) {
                    assert.equal(typeof data, 'object');
                    var errs = js.validate(data, schema);
                    assert(Array.isArray(errs));
                    assert.equal(errs.length, 0, JSON.stringify(errs));
                }, function () {
                    done();
                })
            );
        });
    });
});