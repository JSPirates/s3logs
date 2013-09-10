#!/usr/bin/env node

var fs = require("fs");
var path = require("path");
var stream = require("stream");
var split = require("split");
var util = require("util");

LOGS_DIR = "./logs";

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
// This stream should process log strings one-by-one and push it futher as objects

LogProcessStream = function (options) {
    var realOpts = options || {};
    realOpts.objectMode = true;
    stream.Transform.call(this, realOpts);
}

util.inherits(LogProcessStream, stream.Transform);

LogProcessStream.prototype._transform = function(chunk, encoding, callback) {
    // TODO: Should be rewritten to regexp processing
    var chunkString = chunk.toString();
    var test = chunkString.split(" ");

    var res = {
        source: chunkString,
        requestType: test[7].toUpperCase()
    };

    if ("REST.GET.OBJECT" === res.requestType) {
        // We interested only for "REST.GET.OBJECT" requests
        this.push(res);
        console.log("---", res);
    }

    // Every time we dealing with the complete stream, so signaling about full
    // chunk consumption
    callback();
};

//--- Main

fs.readdir(LOGS_DIR, function (err, files) {
    if (err) {
        console.log("ERROR:", err.message);
        process.exit(1);
    } else {
        var loader = new LogLoaderStream(files, LOGS_DIR);
        var processor = new LogProcessStream();
        loader.pipe(split()).pipe(processor);
    }
});
