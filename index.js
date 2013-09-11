#!/usr/bin/env node

var fs = require("fs");
var path = require("path");
var stream = require("stream");
var split = require("split");
var util = require("util");

var LOGS_DIR = "./logs";
var TEST_RE = /\S+ (\S+) \[(.*)\] (\d+\.\d+\.\d+\.\d+) (\S+) (\S+) (\S+) (\S+) \"(\-|.*?)\" (\-|\d+) (\-|\S+) (\-|\d+) (\-|\d+) (\-|\d+) (?:\-|\d+) \"(-|.*?)\" \"(-|.*?)\"\s?(.?)/;

//--- Logs reader
// This stream should read all logs and push their contents to the next stream

LogLoaderStream = function (filenames, logs_dir, options) {
    stream.Readable.call(this, options);
    this.filenames = [];
    var self = this;
    filenames.forEach(function (item) {
        self.filenames.push(path.join(logs_dir, item));
    });
}

util.inherits(LogLoaderStream, stream.Readable);

LogLoaderStream.prototype._read = function (size) {
    var self = this;
    if (this.filenames.length > 0) {
        var nextFilename = this.filenames.pop();
        fs.readFile(nextFilename, function (err, data) {
            if (err) throw err;
            // Ignoring push return because we are pushing one chunk at a time
            // but this may be a very bad idea!
            self.push(data);
        });
    } else {
        self.push(null);
    }
}

//--- Logs parser
// This stream should process log strings one-by-one and push them futher
// as objects

LogProcessStream = function () {
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

//--- StorageStream
// Stream should consume incomming objects and store them for futher analysis

StorageStream = function () {
    stream.Writable.call(this, {objectMode: true});
}

util.inherits(StorageStream, stream.Writable);

StorageStream.prototype._write = function (chunk, encoding, callback) {
    // TODO: Method code instead of printing
    console.log("---", chunk.statusCode, chunk);
    callback();
}

//--- Main

fs.readdir(LOGS_DIR, function (err, files) {
    if (err) {
        console.log("ERROR:", err.message);
        process.exit(1);
    } else {
        var loader = new LogLoaderStream(files, LOGS_DIR);
        var processor = new LogProcessStream();
        var storage = new StorageStream();
        loader.pipe(split()).pipe(processor).pipe(storage);
    }
});
