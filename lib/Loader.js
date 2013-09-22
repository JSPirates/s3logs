var fs = require('fs');
var util = require('util');
var stream = require('stream');
var path = require('path');

//--- Logs reader
// This stream should read all logs and push their contents to the next stream

function LogLoaderStream(filenames, logs_dir, options) {
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
};

module.exports = LogLoaderStream;