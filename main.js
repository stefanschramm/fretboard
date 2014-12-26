
var notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

var maxFrets = 22;

// all offsets are defined in half-steps

// offsets of notes in key
var keys = {
	"dur (ionisch)": [0,2,4,5,7,9,11,12],
	"moll_natuerlich (aeolisch)": [0,2,3,5,7,8,10,12],
	"moll_harmonisch": [0,2,3,5,7,8,11,12],
	"moll_melodisch": [0,2,3,5,7,9,11,12],
	"zigeuner_moll": [0,2,3,6,7,8,11,12],
	"zigeuner_dur": [0,1,4,5,7,8,11,12],
	"dorisch": [0,2,3,5,7,9,10,12],
	"phrygisch": [0,1,3,5,7,8,10,12],
	"lydisch": [0,2,4,6,7,9,11,12],
	"mixolydisch": [0,2,4,5,7,9,10,12],
	"lokrisch": [0,1,3,5,6,8,10,12],
	"phrygisch-dominant": [0,1,4,5,7,8,10,12]
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
	"moll7major": [0,3,7,10]
}

// TODO:
// M, 7, maj7, 6, m, m7, m/maj7, m6, sus2, sus4, 7sus2, 7sus4, dim, dim7, aug, 5

var audio;

function printFretboard(instrument, checkNote, checkKeynote, outputId) {
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
				html += "<span onclick=\"playMidi(" + tone + ");\" class=\"note" + (checkKeynote(note) ? " keynote" : "") + "\">" + notes[note] + "</span>";
			}
			html += "</td>"
		}
		html += "</tr>"
	}
	html += "</table>";
	document.getElementById(outputId).innerHTML = html;
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
		"keysOut"
	);
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
		"chordsOut"
	);
}

function midiToFrequency(m) {
	return Math.pow(2, ((m-69)/12.0))*440;
}

function playMidi(m) {
	var f = midiToFrequency(m);
	console.log("MIDI: " + m + ", Frequency: " + f + " Hz");
	var wave = new RIFFWAVE();
	wave.header.sampleRate = 44100;
	var length = 1; // s
	var data = [];
	var samples = wave.header.sampleRate * length;
	var center = samples/2;
	var a = 0; // amplitude (0...127)
	for (var i = 0; i < samples; i ++) {
		// orig:
		// data[i] = Math.round(128 + 127 * Math.sin(i * 2 * Math.PI * f / wave.header.sampleRate));
		a = 127 * (center - Math.abs(i - center)) / (center);
		data[i] = Math.round(128 + a * Math.sin(i * 2 * Math.PI * f / wave.header.sampleRate));
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
		addOption("instrument", i);
	}
	for (var i in keys) {
		addOption("key", i);
	}
	for (var i in notes) {
		addOption("keynote", i, notes[i]);
		addOption("note", i, notes[i]);
	}
	for (var i in chords) {
		addOption("chord", i);
	}

	refresh();

	// playMidi(69);


}

function addOption(selectId, key, label) {
	var s = document.getElementById(selectId);
	var o = document.createElement("option");
	o.setAttribute("value", key);
	var ot = document.createTextNode(label != undefined ? label : key);
	o.appendChild(ot);
	s.appendChild(o);
}

function refresh() {
	var instrument = document.getElementById("instrument").value;

	var key = document.getElementById("key").value;
	var keynote = parseInt(document.getElementById("keynote").value);

	var note = document.getElementById("note").value;
	var chord = document.getElementById("chord").value;

	printKey(instrument, key, keynote);
	printChord(instrument, note, chord);
}

