var stream = require('stream');
//--- StorageStream
// Stream should consume incoming objects and store them for further analysis

function StorageStream() {
    stream.Writable.call(this, {objectMode: true});
}

util.inherits(StorageStream, stream.Writable);

StorageStream.prototype._write = function (chunk, encoding, callback) {
    // TODO: Method code instead of printing
    console.log("---", chunk.statusCode, chunk);
    callback();
};