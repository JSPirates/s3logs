var stream = require('stream');
var util = require('util');
var TEST_RE = /\S+ (\S+) \[(.*)\] (\d+\.\d+\.\d+\.\d+) (\S+) (\S+) (\S+) (\S+) \"(\-|.*?)\" (\-|\d+) (\-|\S+) (\-|\d+) (\-|\d+) (\-|\d+) (?:\-|\d+) \"(-|.*?)\" \"(-|.*?)\"\s?(.?)/;

//--- Logs parser
// This stream should process log strings one-by-one and push them further
// as objects

function LogProcessStream() {
    stream.Transform.call(this, {objectMode: true});
}

util.inherits(LogProcessStream, stream.Transform);

LogProcessStream.prototype._transform = function (chunk, encoding, callback) {
    var testRes = TEST_RE.exec(chunk.toString());

    if (!!testRes) {
        var _bytesSent = parseInt(testRes[11], 10);
        var _objSize = parseInt(testRes[12], 10);

        // TODO: Date parsing instead of the .timeString attribute
        var res = {
            bucket: testRes[1],
            timeString: testRes[2],
            remoteIP: testRes[3],
            requester: testRes[4],
            requestId: testRes[5],
            requestType: testRes[6],
            filename: testRes[7],
            uri: testRes[8],
            statusCode: parseInt(testRes[9], 10),
            errorCode: "-" === testRes[10] ? null : testRes[10],
            bytesSent: !!_bytesSent ? _bytesSent : null,
            objectSize: !!_objSize ? _objSize : null,
            totalTime: parseInt(testRes[13], 10),
            referer: "-" === testRes[14] ? null : testRes[14],
            userAgent: "-" === testRes[15] ? null : testRes[15],
            add: testRes[16]
        };

        // We interested only in "REST.GET.OBJECT" requests
        if ("REST.GET.OBJECT" === res.requestType) {
            this.push(res);
        }
    } else {
        throw new Error("Log pattern doesn't match: ["+chunk.toString()+"]");
    }

    // Every time we dealing with the complete string, so signaling about full
    // chunk consumption
    callback();
};
