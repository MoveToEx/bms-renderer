var ref = require('ref-napi')
var ffi = require('ffi-napi')
var Struct = require('ref-struct-di')(ref)

var SFM_READ = 0x10
var SFM_WRITE = 0x20
var SF_FORMAT_WAV = 0x010000
var SF_FORMAT_FLOAT = 0x0006

var SF_STR_TITLE = 0x01
var SF_STR_ARTIST = 0x04
var SF_STR_ALBUM = 0x07
var SF_STR_TRACKNUMBER = 0x09
var SF_STR_GENRE = 0x10

var SNDFILE = ref.types.void
var SNDFILEPtr = ref.refType(SNDFILE)
var SF_INFO = Struct({
	frames: ref.types.int64,
	samplerate: ref.types.int32,
	channels: ref.types.int32,
	format: ref.types.int32,
	sections: ref.types.int32,
	seekable: ref.types.int32
})
// var SF_CHUNK_INFO = Struct({
// 	id: ref.types.Object,
// 	id_size: ref.types.uint32,
// 	datalen: ref.types.uint32,
// 	data: ref.types.pointer
// })
var SF_INFOPtr = ref.refType(SF_INFO)
var floatPtr = ref.refType(ref.types.float)

process.env.path = `${process.env.path};${process.cwd()}`

var libsndfile = ffi.Library('sndfile.dll', {
	sf_open: [SNDFILEPtr, ['string', 'int', SF_INFOPtr]],
	sf_close: ['int', [SNDFILEPtr]],
	sf_readf_float: ['long', [SNDFILEPtr, floatPtr, 'long']],
	sf_writef_float: ['long', [SNDFILEPtr, floatPtr, 'long']],
	sf_set_string: ['int', [SNDFILEPtr, 'int', 'string']]
})

exports.read = function (path) {
	var info = new SF_INFO()
	info.format = 0
	var ptr = libsndfile.sf_open(path, SFM_READ, info.ref())
	if (ptr.isNull()) throw new Error('Cannot load ' + path)

	var sound = {}
	sound.frames = info.frames
	sound.samplerate = info.samplerate
	sound.channels = info.channels

	var size = 4 * sound.frames * sound.channels
	var buffer = Buffer.alloc(size)
	libsndfile.sf_readf_float(ptr, buffer, sound.frames)
	sound.buffer = buffer
	libsndfile.sf_close(ptr)

	return sound
}

exports.write = function (path, sound, tag) {
	var info = new SF_INFO()
	info.format = SF_FORMAT_WAV | SF_FORMAT_FLOAT
	info.samplerate = sound.samplerate
	info.channels = sound.channels

	var ptr = libsndfile.sf_open(path, SFM_WRITE, info.ref())
	if (ptr.isNull()) throw new Error('Cannot open ' + path)

	var size = 4 * sound.frames * sound.channels

	libsndfile.sf_writef_float(ptr, sound.buffer, sound.frames)

	libsndfile.sf_set_string(ptr, SF_STR_TITLE, tag.title)
	libsndfile.sf_set_string(ptr, SF_STR_ARTIST, tag.artist)
	libsndfile.sf_set_string(ptr, SF_STR_GENRE, tag.genre)
	libsndfile.sf_set_string(ptr, SF_STR_ALBUM, tag.title)
	libsndfile.sf_set_string(ptr, SF_STR_TRACKNUMBER, '1/1')

	libsndfile.sf_close(ptr)
}
