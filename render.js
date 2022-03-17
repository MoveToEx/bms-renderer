#!/usr/bin/env node
'use strict'

const argv = require('yargs')
	.usage('Usage: $0 <input.bms> <output.wav>')
	.boolean('full')
	.boolean('info')
	.describe('info', 'Only prints the song info.')
	.demand(2, 2)
	.version().argv

const childProcess = require('child_process')
const getNotes = require('./getNotes')
const _ = require('lodash')
const satisfies = require('semver').satisfies
const Promise = require('bluebird')
const cliProgress = require('cli-progress')
const fs = require('fs')

var pbar = new cliProgress.SingleBar({
	hideCursor: true,
	barCompleteChar: '██',
	barIncompleteChar: '─',
	format: '|{bar}| {percentage}% | {value}/{total} | ETA: {eta_formatted}',
	fps: 30,
	etaBuffer: 100
})

var ffmpeg = {
	path: _(process.env.PATH.split(';')).filter((s) => {
		return fs.existsSync(s + "/ffmpeg.exe")
	}).value(),
	run: function (file) {
		childProcess.execFileSync(path, ["-i", file, "./tmp/" + file + ".c.wav", ])
	}
}

const renderers = {
	ffi(song, outfilepath) {
		const snd = require('./snd')
		const samples = {}

		function frameForTime(seconds) {
			return Math.floor(seconds * 44100)
		}

		process.stderr.write('Loading samples...\n')

		pbar.start(song.keysounds.length, 0)

		song.keysounds.forEach(function (samplepath) {
			var sound = snd.read(samplepath)
			if (sound.samplerate !== 44100) {
				// if (ffmpeg.path) {
				// 	ffmpeg.run(samplepath);
				// }
				// else {
					throw new Error(samplepath + ' must be 44100 hz')
				// }
			}
			if (sound.channels !== 2) {
				throw new Error(samplepath + ' must be 2 channels')
			}
			samples[samplepath] = sound
			pbar.increment()
		})

		pbar.stop()

		var validNotes = _(song.data)
			.map(function (note) {
				return _.assign({ sound: samples[note.src] }, note)
			})
			.filter('sound')
			.value()
		process.stderr.write('Number of valid notes: ' + validNotes.length + '\n')

		var last = _(validNotes)
			.map(function (note) {
				var length = note.sound.frames
				return frameForTime(note.time) + length
			})
			.max()

		var skip = argv.full
			? 0
			: _(validNotes)
				.map(function (note) {
					return frameForTime(note.time)
				})
				.min()

		var frames = last - skip
		process.stderr.write('Total song length: ' + frames / 44100 + '\n')

		process.stderr.write('Writing notes...' + '\n')

		pbar.start(validNotes.length)

		var buffer = Buffer.alloc(frames * 2 * 4)
		_.each(validNotes, function (note) {
			var sound = note.sound
			var start = frameForTime(note.time) - skip
			var cut = note.cutTime && frameForTime(note.cutTime) - skip
			var offset = start * 2 * 4

			var framesToCopy = sound.frames
			if (cut > 0) {
				framesToCopy = Math.min(framesToCopy, cut - start)
			}

			var soundBuffer = sound.buffer
			var length = Math.min(soundBuffer.length, framesToCopy * 2 * 4)
			for (var i = 0; i < length; i += 4) {
				var position = offset + i
				buffer.writeFloatLE(
					buffer.readFloatLE(position) + soundBuffer.readFloatLE(i),
					position
				)
			}
			pbar.increment()
		})
		pbar.stop()
		process.stderr.write('Writing output...\n')
		snd.write(outfilepath, {
			samplerate: 44100,
			channels: 2,
			frames: frames,
			buffer: buffer
		}, song.info)
	}
}


{
	const filepath = argv._[0]
	const outfilepath = argv._[1]
	Promise.coroutine(function* () {
		const song = yield getNotes(filepath)
		console.log(JSON.stringify(song.info, null, 2))
		if (!argv.info) {
			renderers.ffi(song, outfilepath)
		}
	})().done()
}
