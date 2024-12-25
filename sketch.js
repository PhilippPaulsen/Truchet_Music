let cols, rows;
let size = 50;
let tiles = [];
let synth;

function setup() {
  createCanvas(400, 400);
  cols = width / size;
  rows = height / size;
  tiles = createSymmetricPattern();

  // Set up Tone.js synth
  synth = new Tone.PolySynth().toDestination();
  Tone.Transport.bpm.value = 120;

  // Create a button to start the music
  let startButton = createButton("Start Music");
  startButton.position(10, 10);
  startButton.mousePressed(() => {
    Tone.start();
    scheduleCounterpoint();
    Tone.Transport.start();
  });
}

function draw() {
  background(225);
  for (let row of tiles) {
    for (let tile of row) {
      tile.display();
    }
  }
}

class Tile {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;
  }

  display() {
    fill(0);
    push();
    translate(this.x, this.y);
    beginShape();
    if (this.type == 0) {
      vertex(size, 0);
      vertex(size, size);
      vertex(0, size);
    } else if (this.type == 1) {
      vertex(size, 0);
      vertex(0, 0);
      vertex(0, size);
    } else if (this.type == 2) {
      vertex(size, size);
      vertex(0, 0);
      vertex(0, size);
    } else if (this.type == 3) {
      vertex(size, size);
      vertex(0, 0);
      vertex(size, 0);
    }
    endShape();
    pop();
  }

  getMusicProperties(quadrant) {
    // Quadrant-specific pitch sets
    const pitchSets = {
      TL: ["C4", "D4", "E4", "F4"], // Soprano
      TR: ["G3", "A3", "B3", "C4"], // Alto
      BL: ["C3", "D3", "E3", "F3"], // Tenor
      BR: ["G2", "A2", "B2", "C3"], // Bass
    };

    const pitches = pitchSets[quadrant];
    let pitch = pitches[this.type];
    let timing = map(this.x, 0, width, 0, 4); // Map x to timing (4-beat measure)
    let duration = map(this.y, 0, height, 0.1, 1); // Map y to duration (short → long)
    return { pitch, timing, duration };
  }
}

function createSymmetricPattern() {
  let pattern = [];

  // Generate top-left quadrant
  for (let y = 0; y < rows / 2; y++) {
    let row = [];
    for (let x = 0; x < cols / 2; x++) {
      let type = floor(random(4)); // Randomly select type 0, 1, 2, or 3
      row.push(new Tile(x * size, y * size, type));
    }
    pattern.push(row);
  }

  // Reflect top-left quadrant diagonally
  for (let y = 0; y < rows / 2; y++) {
    for (let x = 0; x < cols / 2; x++) {
      if (x > y) {
        let type = pattern[y][x].type;
        pattern[x][y] = new Tile(y * size, x * size, mirrorTypeDiagonally(type));
      }
    }
  }

  // Create top-right quadrant by horizontal reflection
  for (let y = 0; y < rows / 2; y++) {
    for (let x = 0; x < cols / 2; x++) {
      let type = pattern[y][x].type;
      pattern[y].push(new Tile((cols - x - 1) * size, y * size, mirrorTypeHorizontally(type)));
    }
  }

  // Create bottom-left quadrant by vertical reflection
  for (let y = 0; y < rows / 2; y++) {
    let newRow = [];
    for (let x = 0; x < cols / 2; x++) {
      let type = pattern[y][x].type;
      newRow.push(new Tile(x * size, (rows - y - 1) * size, mirrorTypeVertically(type)));
    }
    pattern.push(newRow);
  }

  // Create bottom-right quadrant by diagonal reflection of top-left quadrant
  for (let y = rows / 2; y < rows; y++) {
    for (let x = cols / 2; x < cols; x++) {
      let mirroredX = cols - 1 - x;
      let mirroredY = rows - 1 - y;
      let type = pattern[mirroredY][mirroredX].type;
      pattern[y].push(new Tile(x * size, y * size, mirrorTypeDiagonally(type)));
    }
  }

  return pattern;
}

function getQuadrant(x, y) {
  if (x < cols / 2 && y < rows / 2) return "TL"; // Top-left
  if (x >= cols / 2 && y < rows / 2) return "TR"; // Top-right
  if (x < cols / 2 && y >= rows / 2) return "BL"; // Bottom-left
  if (x >= cols / 2 && y >= rows / 2) return "BR"; // Bottom-right
}

function mirrorTypeHorizontally(type) {
  if (type == 0) return 2;
  if (type == 1) return 3;
  if (type == 2) return 0;
  if (type == 3) return 1;
}

function mirrorTypeVertically(type) {
  if (type == 0) return 3;
  if (type == 1) return 2;
  if (type == 2) return 1;
  if (type == 3) return 0;
}

function mirrorTypeDiagonally(type) {
  if (type == 0) return 1;
  if (type == 1) return 0;
  if (type == 2) return 3;
  if (type == 3) return 2;
}

function transpose(pitch, semitones) {
  const notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  let [note, octave] = pitch.split(/(\d+)/);
  let index = notes.indexOf(note) + semitones;
  let newOctave = parseInt(octave) + Math.floor(index / 12);
  index = (index + 12) % 12;
  return notes[index] + newOctave;
}

function scheduleCounterpoint() {
  let voices = { TL: [], TR: [], BL: [], BR: [] };

  for (let row of tiles) {
    for (let tile of row) {
      let quadrant = getQuadrant(tile.x / size, tile.y / size);
      voices[quadrant].push(tile.getMusicProperties(quadrant));
    }
  }

  let motif = voices["TL"];

  voices["TR"] = motif.map((note) => ({
    ...note,
    pitch: transpose(note.pitch, 5), // Transpose up a fifth
    timing: note.timing + 1, // Slight delay
  }));

  voices["BL"] = motif.map((note) => ({
    ...note,
    pitch: transpose(note.pitch, -12), // Transpose down an octave
    timing: note.timing + 2, // Greater delay
  }));

  voices["BR"] = motif.map((note) => ({
    ...note,
    pitch: transpose(note.pitch, -7), // Transpose down a fifth
    timing: note.timing + 3, // Longest delay
  }));

  ["TL", "TR", "BL", "BR"].forEach((voice) => {
    voices[voice].forEach((note) => {
      Tone.Transport.scheduleOnce((time) => {
        synth.triggerAttackRelease(note.pitch, note.duration, time);
      }, `+${note.timing}`);
    });
  });
}