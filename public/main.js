
var notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

var maxFrets = 22;

// all offsets are defined in half-steps

// offsets of notes in key
var keys = {
	"dur (ionisch)": [0,2,4,5,7,9,11,12],
	"moll natuerlich (aeolisch)": [0,2,3,5,7,8,10,12],
	"moll harmonisch": [0,2,3,5,7,8,11,12],
	"moll melodisch": [0,2,3,5,7,9,11,12],
	"zigeuner moll": [0,2,3,6,7,8,11,12],
	"zigeuner dur": [0,1,4,5,7,8,11,12],
	"dorisch": [0,2,3,5,7,9,10,12],
	"phrygisch": [0,1,3,5,7,8,10,12],
	"lydisch": [0,2,4,6,7,9,11,12],
	"mixolydisch": [0,2,4,5,7,9,10,12],
	"lokrisch": [0,1,3,5,6,8,10,12],
	"phrygisch-dominant": [0,1,4,5,7,8,10,12],
	"chromatisch": [0,1,2,3,4,5,6,7,8,9,10,11,12],
	"pentatonisch dur": [0,2,4,7,9,12],
	"pentatonisch moll": [0,3,5,7,10,12],
	"alteriert": [0,1,3,4,6,8,10,12],
	"blues (Kai)": [0,2,3,5,6,7,10,12]
}

// offsets of strings of instruments
var instruments = {
	"Guitar": [64, 59, 55, 50, 45, 40],
	"Ukulele C": [69, 64, 60, 67],
	"Ukulele E": [71, 66, 62, 69],
	"Bass": [43, 38, 33, 28]
}

// chord offsets
var chords = {
	"dur": [0,4,7],
	"dur6": [0,4,7,9],
	"dur7": [0,4,7,10],
	"dur7major": [0,4,7,11],
	"moll": [0,3,7],
	"moll7": [0,3,7,10],
	// "maj9": [0,4,7,9,14], // TODO: > 12
}

// TODO:
// M, 7, maj7, 6, m, m7, m/maj7, m6, sus2, sus4, 7sus2, 7sus4, dim, dim7, aug, 5

var playOffset = 60;

var audio;

function printFretboard(instrument, checkNote, checkKeynote, output) {
	var html = "<table>";
	var strings = instruments[instrument];
	html += "<tr class=\"hint\">"
	for (var i = 0; i < maxFrets; i++) {
		html += "<td class=\"fret" + i + "\">" + i + "</td>";
	}
	html += "</tr>"
	for (var s in strings) {
		html += "<tr class=\"string\">"
		for (var i = 0; i < maxFrets; i++) {
			html += "<td class=\"fret fret" + i + "\">"
			var tone = strings[s] + i;
			var note = tone % 12;
			if (checkNote(note)) {
				html += "<span onclick=\"playMidi([[" + tone + "]]);\" class=\"note" + (checkKeynote(note) ? " keynote" : "") + "\">" + notes[note] + "</span>";
			}
			html += "</td>"
		}
		html += "</tr>"
	}
	html += "</table>";
	output.html(html);
}

function printKey(instrument, key, keynote) {
	printFretboard(
		instrument,
		function(n) {
			return keys[key].indexOf((n - keynote + 12) % 12) >= 0;
		},
		function(n) {
			return (n - keynote) == 0;
		},
		$("#keysOut")
	);
	$('#playkey').click(function() {
		var tones = [];
		for (var i in keys[key]) {
			tones.push([playOffset + keynote + keys[key][i]]); // TODO: offset definition
		}
		playMidi(tones)
		return false;
	});
	$('#playkeyreverse').click(function() {
		var tones = [];
		for (var i = keys[key].length - 1; i >= 0; i--) {
			tones.push([playOffset + keynote + keys[key][i]]); // TODO: offset definition
		}
		playMidi(tones)
		return false;
	});
}

function printChord(instrument, note, chord) {
	printFretboard(
		instrument,
		function(n) {
			return chords[chord].indexOf((n - note + 12) % 12) >= 0;
		},
		function(n) {
			return (n - note + 12) % 12 == 0;
		},
		$("#chordsOut")
	);
	$('#playchord').click(function() {
		var tones = [];
		for (var i in chords[chord]) {
			tones.push([playOffset + note + chords[chord][i]]); // TODO: offset definition
		}
		playMidi([tones]);
		return false;
	});
	$('#playchordsequential').click(function() {
		var tones = [];
		for (var i in chords[chord]) {
			tones.push([[playOffset + note + chords[chord][i]]]); // TODO: offset definition
		}
		playMidi(tones);
		return false;
	});
}

function printSteps(steps, note, output) {
	var prev = null;
	var html = "";
	for (i in steps) {
		var k = steps[i];
		if (prev != null) {
			var s = k - prev;
			html += "<span class=\"step step" +  s + "\">" + s + "/2</span>"
		}
		html += "<span class=\"stepnote\">" + notes[(note + k) % 12] + "</span>"
		prev = k;
	}
	output.html(html);
}

function midiToFrequency(m) {
	return Math.pow(2, ((m-69)/12.0))*440;
}

function playMidi(tones) {

	var wave = new RIFFWAVE();
	wave.header.sampleRate = 44100;
	var length = 0.8; // s (length of one tone)

	var data = [];

	for (t in tones) {
		var m = tones[t];

		// convert midi numbers to frequencies
		for (i in m) {
			var f = midiToFrequency(m[i]);
			console.log("MIDI: " + m[i] + ", Frequency: " + f + " Hz");
			m[i] = f;
		}

		var samples = wave.header.sampleRate * length;
		var attackEnd = samples/6;
		var releaseBegin = 5 * samples/6;
		var a = 0; // amplitude (0...127)
		for (var i = 0; i < samples; i++) {
			if (i < attackEnd) {
				a = 127 * (i / attackEnd);
			}
			else if (i > releaseBegin) {
				a = 127 * ((samples - i) / (samples - releaseBegin))
			}
			else {
				a = 127;
			}
			var sample = 128;
			for (j in m) {
				sample += Math.round((a / m.length) * Math.sin(i * 2 * Math.PI * m[j] / wave.header.sampleRate));
			}
			data.push(sample);
		}

	}

	wave.Make(data);
	if (audio != undefined && ! audio.paused) {
	    audio.pause();
	    audio.currentTime = 0;
	}
	audio = new Audio(wave.dataURI);
	audio.play();
}

function init() {
	for (var i in instruments) {
		addOption($("#instrument"), i);
	}
	for (var i in keys) {
		addOption($("#key"), i);
	}
	for (var i in notes) {
		addOption($("#keynote"), i, notes[i]);
		addOption($("#note"), i, notes[i]);
	}
	for (var i in chords) {
		addOption($("#chord"), i);
	}

	refresh();
}

function addOption(select, key, label) {
	var o = $("<option />");
	o.text(label != undefined ? label : key);
	o.attr("value", key);
	o.appendTo(select);
}

function refresh() {
	var instrument = $("#instrument").val();

	var key = $("#key").val();
	var keynote = parseInt($("#keynote").val());

	var note = parseInt($("#note").val());
	var chord = $("#chord").val();

	printKey(instrument, key, keynote);
	printChord(instrument, note, chord);
	printSteps(keys[key], keynote, $("#steps"));
	printSteps(chords[chord], note, $("#chordsteps"));
}

