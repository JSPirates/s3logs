var stream = require('stream');
var util = require('util');
//--- ReporterStream
// Stream should consume incoming objects and store them for further analysis

function ReporterStream() {
    stream.Writable.call(this, {objectMode: true});
}

util.inherits(ReporterStream, stream.Writable);

ReporterStream.prototype._write = function (chunk, encoding, callback) {
    // TODO: Method code instead of printing
    console.log("---", chunk.statusCode, chunk);
    callback();
};

module.exports = ReporterStream;