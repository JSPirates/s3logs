var stream = require('stream');
var util = require('util');
//--- ReporterStream
// Stream should consume incoming objects and store them for further analysis

function ReporterStream() {
    stream.Transform.call(this, {objectMode: true});
    this.ips = {};
}

util.inherits(ReporterStream, stream.Transform);

ReporterStream.prototype._transform = function (chunk, encoding, callback) {
    this.ips[chunk.remoteIP] = true;
    callback();
};

ReporterStream.prototype._flush = function (callback) {
    this.push({
        uniques: Object.keys(this.ips).length
    });
    callback();
};

module.exports = ReporterStream;