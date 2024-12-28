// Initialization and Configuration
let cols, rows;
let size = 80; // Size of each tile
let tiles = []; // Store tile objects
let currentSymmetry = "D4"; // Default symmetry type
// D4, C4, D2_s, (D2_d), C2, D1_h, D1_v, (D1_d1, D1_d2), (C1)
// p1, p2, pm_h, pm_v, (pm_d), pg_h, (pg_v), cm_s, (cm_d), pmm, pmg_h, pmg_v, pgg, cmm, p4, p4m, p4g
// (missing in brackets)
let currentTransformation = "None"; // Default transformation
let currentScale = [48, 60, 72, 84, 96, 108, 120]; // Default scale (C Major)
let motifRatio = 2; // Determines the motif's size
let playMode = "Melody"; // Default play mode
let playbackSpeed = 1; // Default playback speed multiplier


// GUI Elements
let speedSlider, symmetrySelector, scaleSelector, transformationSelector, sizeSelector, instrumentSelector;

// Instruments
const instruments = {
  TL: new Tone.PolySynth().toDestination(),
  TR: new Tone.PolySynth().toDestination(),
  BL: new Tone.PolySynth().toDestination(),
  BR: new Tone.PolySynth().toDestination(),
};

Tone.getContext().resume().then(() => {
  console.log('Audio context resumed.');
});

// Define scale names and scales
const scaleNames = [
  "C Major",
  "C Minor",
  "C Major Pentatonic",
  "C Minor Pentatonic",
  "C Blues Scale",
  "C Harmonic Minor",
  "C Lydian",
  "C Mixolydian",
  "C Dorian",
  "C Phrygian",
];

const scales = [
  [48, 60, 72, 84, 96, 108, 120], // C Major
  [48, 51, 60, 63, 72, 75, 84],  // C Minor
  [48, 50, 52, 55, 57, 60, 62],  // C Major Pentatonic
  [48, 51, 53, 55, 58, 60, 63],  // C Minor Pentatonic
  [48, 51, 54, 55, 58, 60, 63],  // C Blues Scale
  [48, 51, 54, 60, 64, 67, 72],  // C Harmonic Minor
  [48, 52, 56, 60, 64, 67, 71],  // C Lydian
  [48, 52, 55, 60, 64, 67, 69],  // C Mixolydian
  [48, 50, 53, 60, 62, 67, 69],  // C Dorian
  [48, 49, 53, 60, 63, 67, 72],  // C Phrygian
];

// Helper Functions
function assignScaleToInstruments(scaleIndex) {
  currentScale = scales[scaleIndex]; // Update the current scale
  console.log(`Scale selected: ${scaleNames[scaleIndex]}`);
}

function mapPitch(tileType) {
  const noteIndex = tileType % currentScale.length; // Cycle through scale notes
  const octaveOffset = Math.floor(tileType / currentScale.length) * 12; // Add dynamic octave offset
  const note = currentScale[noteIndex] + octaveOffset;

  return Math.max(36, Math.min(note, 96)); // Constrain within MIDI range (C2 to C7)
}

function mapChord(rootNote) {
  const third = rootNote + 4; // Major third
  const fifth = rootNote + 7; // Perfect fifth
  const octave = rootNote + 12; // Octave
  return [rootNote, third, fifth, octave];
}

function invertChord(chord, inversionLevel) {
  // Rotate chord notes based on inversion level
  const inversion = chord
    .slice(inversionLevel)
    .concat(chord.slice(0, inversionLevel).map((note) => note + 12));
  return inversion;
}

function mapChordWithInversion(tileType, tilePosition) {
  const rootNote = mapPitch(tileType);
  const chord = mapChord(rootNote);

  // Determine inversion level based on tile position
  const inversionLevel = (tilePosition.row + tilePosition.col) % chord.length;
  return invertChord(chord, inversionLevel);
}

function playMusic() {
  const startTime = Tone.now();
  const baseTimeStep = 0.5; // Base time step for note spacing
  const quadrantDelay = 1; // Delay between quadrants

function playChordWithTiming(instrument, chord, timing) {
  chord.forEach((note, index) => {
    setTimeout(() => {
      instrument.triggerAttackRelease(
        Tone.Frequency(note, "midi").toNote(),
        "0.5"
      );
    }, index * 200); // Evenly spaced
  });
}

  // Group tiles into quadrants
  const quadrants = {
    TL: tiles.flat().filter((tile) => tile.x < width / 2 && tile.y < height / 2),
    TR: tiles.flat().filter((tile) => tile.x >= width / 2 && tile.y < height / 2),
    BL: tiles.flat().filter((tile) => tile.x < width / 2 && tile.y >= height / 2),
    BR: tiles.flat().filter((tile) => tile.x >= width / 2 && tile.y >= height / 2),
  };

  function stopMusic() {
    Object.values(instruments).forEach((instrument) => {
      if (instrument instanceof Tone.PolySynth || instrument instanceof Tone.Sampler) {
        instrument.releaseAll(); // Stop all notes
      } else {
        instrument.dispose(); // Ensure synth is disposed properly
      }
    });
  }

  Object.keys(instruments).forEach((key, quadrantIndex) => {
    const instrument = instruments[key];
    const tilesInQuadrant = quadrants[key];

    tilesInQuadrant.forEach((tile, tileIndex) => {
      const timing =
        startTime + quadrantIndex * quadrantDelay + tileIndex * baseTimeStep;

      setTimeout(() => {
        // Highlight the tile
        tile.highlight();

        if (playMode === "Harmony") {
          instrument.triggerAttackRelease(
            chord.map((note) => Tone.Frequency(note, "midi").toNote()),
            "0.05",
            timing
          );
        } else if (playMode === "Melody") {
          // Generate a wide melodic range dynamically based on tiles
          const melody = baseMelodyPattern.map((note, index) => {
            const octaveOffset = Math.floor(tileIndex / 4) * 12; // Change octave every 4 notes
            return note + octaveOffset;
          });
        
          melody.forEach((note, noteIndex) => {
            const noteStartTime = timing + noteIndex * baseTimeStep; // Sequential timing
            setTimeout(() => {
              instrument.triggerAttackRelease(
                Tone.Frequency(note, "midi").toNote(),
                noteDuration,
                noteStartTime
              );
            }, (noteStartTime - Tone.now()) * 1000);
          });
        }

        // Reset the highlight after a short duration
        setTimeout(() => {
          tile.highlighted = false;
        }, 500);
      }, (timing - Tone.now()) * 1000);
    });
  });
}

function setup() {
  // Create the canvas and place it in the container
  let canvas = createCanvas(320, 320);
  canvas.parent('canvas-container'); // Attach canvas to the container in the HTML

  document.body.addEventListener("click", () => {
    if (Tone.context.state !== 'running') {
      Tone.context.resume().then(() => {
        console.log("Audio context resumed");
      });
    }
  }, { once: true }); // Ensure this runs only once

  document.getElementById("play-button").addEventListener("click", async () => {
    if (Tone.Transport.state === "started") {
      Tone.Transport.stop();
      Tone.Transport.cancel(); // Clears all scheduled events
      console.log("Music paused and events cleared.");
    } else {
      await Tone.start();
      Tone.Transport.start();
      console.log("Music started.");
      playMusic();
    }
  });

  // Link new GUI elements
  document.getElementById('size').addEventListener('change', (e) => {
    size = parseInt(e.target.value, 10); // Update size
    cols = width / size;
    rows = height / size;
    generatePattern(); // Regenerate the pattern with the new size
  });

  document.getElementById('symmetry').addEventListener('change', (e) => {
    currentSymmetry = e.target.value;
    generatePattern(); // Update pattern based on symmetry
  });

  document.getElementById('instrument').addEventListener('change', (e) => {
    switchInstruments(e.target.value); // Connect instrument selector
  });

  document.getElementById('scale').addEventListener('change', (e) => {
    const scaleIndex = e.target.selectedIndex;
    assignScaleToInstruments(scaleIndex); // Update scale
  });

  document.getElementById('speed').addEventListener('input', (e) => {
    playbackSpeed = parseFloat(e.target.value);
    console.log(`Playback speed set to: ${playbackSpeed}`);
  });

  document.getElementById('transformation').addEventListener('change', (e) => {
    currentTransformation = e.target.value; // Update transformation
    applyTransformation(currentTransformation); // Apply the selected transformation
  });

  // Initialize pattern and settings
  cols = width / size;
  rows = height / size;
  assignScaleToInstruments(0); // Default to the first scale
  generatePattern(); // Generate the initial pattern
}

function draw() {
  background(225);
  for (let row of tiles) {
    for (let tile of row) {
      tile.display();
    }
  }
}

// Tile Class
class Tile {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.highlighted = false;
  }

  display() {
    let colors = this.highlighted
      ? ["#FF6347", "#4682B4", "#32CD32", "#FFD700"] // Highlight colors
      : ["#000000", "#000000", "#000000", "#000000"]; // Default colors
    fill(colors[this.type]);
    push();
    translate(this.x, this.y);
    beginShape();
    if (this.type === 0) vertex(size, 0), vertex(size, size), vertex(0, size);
    if (this.type === 1) vertex(size, 0), vertex(0, 0), vertex(0, size);
    if (this.type === 2) vertex(size, size), vertex(0, 0), vertex(0, size);
    if (this.type === 3) vertex(size, size), vertex(0, 0), vertex(size, 0);
    endShape(CLOSE);
    pop();
    this.highlighted = false;
  }

  highlight() {
    this.highlighted = true;
  }
}

// Generate Symmetric Pattern
function generatePattern() {
  tiles = createSymmetricPattern(currentSymmetry, motifRatio);
  applyTransformation(currentTransformation); // Apply any transformation
}

// Apply Transformation
function applyTransformation(transformation) {
  if (transformation === "None") return; // No transformation to apply

  tiles = tiles.map((row) =>
    row.map((tile) => {
      let newType = tile.type;

      switch (transformation) {
        case "Inversion":
          newType = (3 - tile.type) % 4; // Invert the tile type
          break;
        case "Retrograde":
          return new Tile(width - tile.x - size, tile.y, tile.type);
        case "Augmentation":
          newType = (tile.type + 1) % 4; // Shift tile type cyclically
          break;
        case "Canon":
          // Apply Canon transformation logic here if applicable
          break;
        case "Counterpoint":
          // Apply Counterpoint transformation logic here if applicable
          break;
      }

      return new Tile(tile.x, tile.y, newType); // Return transformed tile
    })
  );

  console.log(`Transformation applied: ${transformation}`);
}

// BEGINNING OF CREATE SYMMETRIC PATTERN // DO NOT TOUCH !!!


function createSymmetricPattern(symmetryType, motifRatio) {
  let pattern = [];
  let motifCols = cols / motifRatio;
  let motifRows = rows / motifRatio;

  if (symmetryType === "D4") {
    // Generate the top-left quadrant
    for (let y = 0; y < rows / 2; y++) {
      let row = [];
      for (let x = 0; x < cols / 2; x++) {
        let type;
        if (x < y) {
          type = floor(random(2)); // 0 or 1 for the triangle below the diagonal
        } else if (x == y) {
          type = floor(random(2)); // Ensure diagonal only has types 0 and 1
        } else {
          type = floor(random(4)); // 0, 1, 2, 3 for the rest
        }
        row.push(new Tile(x * size, y * size, type)); // Top-left quadrant
      }
      pattern.push(row);
    }

    // Reflect the right triangle to fill the top-left quadrant
    for (let y = 0; y < rows / 2; y++) {
      for (let x = 0; x < cols / 2; x++) {
        if (x > y) {
          let type = pattern[y][x].type;
          pattern[x][y] = new Tile(
            y * size,
            x * size,
            mirrorTypeDiagonally(type)
          );
        }
      }
    }

    // Create the top-right quadrant by mirroring the top-left quadrant horizontally
    for (let y = 0; y < rows / 2; y++) {
      for (let x = 0; x < cols / 2; x++) {
        let type = pattern[y][x].type;
        pattern[y].push(
          new Tile(
            (cols - x - 1) * size,
            y * size,
            mirrorTypeHorizontally(type)
          )
        );
      }
    }

    // Create the bottom-left quadrant by mirroring the top-left quadrant vertically
    for (let y = 0; y < rows / 2; y++) {
      let bottomRow = [];
      for (let x = 0; x < cols / 2; x++) {
        let type = pattern[y][x].type;
        bottomRow.push(
          new Tile(x * size, (rows - y - 1) * size, mirrorTypeVertically(type))
        );
      }
      pattern.push(bottomRow);
    }

    // Create the bottom-right quadrant by mirroring the top-right quadrant vertically
    for (let y = 0; y < rows / 2; y++) {
      for (let x = 0; x < cols / 2; x++) {
        let type = pattern[y][cols / 2 + x].type;
        pattern[rows / 2 + y].push(
          new Tile(
            (cols - x - 1) * size,
            (rows - y - 1) * size,
            mirrorTypeVertically(type)
          )
        );
      }
    }
  } else if (symmetryType === "C4") {
    // Generate the top-left quadrant
    for (let y = 0; y < rows / 2; y++) {
      let row = [];
      for (let x = 0; x < cols / 2; x++) {
        let type = floor(random(4)); // 0, 1, 2, 3
        row.push(new Tile(x * size, y * size, type)); // Top-left quadrant
      }
      pattern.push(row);
    }

    // Ensure pattern array is fully constructed
    for (let y = 0; y < rows / 2; y++) {
      pattern[y].length = cols;
    }
    for (let y = rows / 2; y < rows; y++) {
      let newRow = [];
      for (let x = 0; x < cols; x++) {
        newRow.push(undefined); // Initialize with undefined
      }
      pattern.push(newRow);
    }

    // Create the top-right quadrant by rotating the top-left quadrant 90 degrees clockwise
    for (let y = 0; y < rows / 2; y++) {
      for (let x = 0; x < cols / 2; x++) {
        let type = pattern[y][x].type;
        let newType = rotateTypeClockwise(type);
        pattern[x][cols - y - 1] = new Tile(
          (cols - y - 1) * size,
          x * size,
          newType
        );
      }
    }

    // Create the bottom-right quadrant by rotating the top-right quadrant 90 degrees clockwise
    for (let y = 0; y < rows / 2; y++) {
      for (let x = 0; x < cols / 2; x++) {
        let type = pattern[x][cols - y - 1].type;
        let newType = rotateTypeClockwise(type);
        pattern[rows - y - 1][cols - x - 1] = new Tile(
          (cols - x - 1) * size,
          (rows - y - 1) * size,
          newType
        );
      }
    }

    // Create the bottom-left quadrant by rotating the bottom-right quadrant 90 degrees clockwise
    for (let y = 0; y < rows / 2; y++) {
      for (let x = 0; x < cols / 2; x++) {
        let type = pattern[rows - y - 1][cols - x - 1].type;
        let newType = rotateTypeClockwise(type);
        pattern[rows - x - 1][y] = new Tile(
          y * size,
          (rows - x - 1) * size,
          newType
        );
      }
    }
  } else if (symmetryType === "D2_s") {
    // Generate the top-left quadrant
    for (let y = 0; y < rows / 2; y++) {
      let row = [];
      for (let x = 0; x < cols / 2; x++) {
        let type = floor(random(4)); //
        row.push(new Tile(x * size, y * size, type)); // Top-left quadrant
      }
      pattern.push(row);
    }

    // Create the top-right quadrant by mirroring the top-left quadrant horizontally
    for (let y = 0; y < rows / 2; y++) {
      for (let x = 0; x < cols / 2; x++) {
        let type = pattern[y][x].type;
        pattern[y].push(
          new Tile(
            (cols - x - 1) * size,
            y * size,
            mirrorTypeHorizontally(type)
          )
        );
      }
    }

    // Create the bottom-left quadrant by mirroring the top-left quadrant vertically
    for (let y = 0; y < rows / 2; y++) {
      let bottomRow = [];
      for (let x = 0; x < cols / 2; x++) {
        let type = pattern[y][x].type;
        bottomRow.push(
          new Tile(x * size, (rows - y - 1) * size, mirrorTypeVertically(type))
        );
      }
      pattern.push(bottomRow);
    }
    // Create the bottom-right quadrant by mirroring the top-right quadrant vertically
    for (let y = 0; y < rows / 2; y++) {
      for (let x = 0; x < cols / 2; x++) {
        let type = pattern[y][cols / 2 + x].type;
        pattern[rows / 2 + y].push(
          new Tile(
            (cols - x - 1) * size,
            (rows - y - 1) * size,
            mirrorTypeVertically(type)
          )
        );
      }
    }
  } else if (symmetryType === "C2") {
    // Generate the left half randomly
    for (let y = 0; y < rows; y++) {
      let row = [];
      for (let x = 0; x < cols / 2; x++) {
        let type = floor(random(4)); // 0, 1, 2, 3
        row.push(new Tile(x * size, y * size, type)); // Left half
      }
      pattern.push(row);
    }

    // Ensure pattern array is fully constructed
    for (let y = 0; y < rows; y++) {
      pattern[y].length = cols;
    }

    // Create the right half by rotating the left half 180 degrees
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols / 2; x++) {
        let type = pattern[y][x].type;
        let newType = rotateType180(type);
        let newX = cols - x - 1;
        let newY = rows - y - 1;
        pattern[newY][newX] = new Tile(newX * size, newY * size, newType);
      }
    }
  } else if (symmetryType === "D1_h") {
    // Generate the left half randomly
    for (let y = 0; y < rows; y++) {
      let row = [];
      for (let x = 0; x < cols / 2; x++) {
        let type = floor(random(4)); // 0, 1, 2, 3
        row.push(new Tile(x * size, y * size, type)); // Left half
      }
      pattern.push(row);
    }

    // Ensure pattern array is fully constructed
    for (let y = 0; y < rows; y++) {
      pattern[y].length = cols;
    }

    // Create the right half by mirroring the left half horizontally
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols / 2; x++) {
        let type = pattern[y][x].type;
        pattern[y][cols - x - 1] = new Tile(
          (cols - x - 1) * size,
          y * size,
          mirrorTypeHorizontally(type)
        );
      }
    }
  } else if (symmetryType === "D1_v") {
    // Generate the top half randomly
    for (let y = 0; y < rows / 2; y++) {
      let row = [];
      for (let x = 0; x < cols; x++) {
        let type = floor(random(4)); // 0, 1, 2, 3
        row.push(new Tile(x * size, y * size, type)); // Top half
      }
      pattern.push(row);
    }

    // Ensure pattern array is fully constructed
    for (let y = rows / 2; y < rows; y++) {
      let newRow = [];
      for (let x = 0; x < cols; x++) {
        newRow.push(undefined); // Initialize with undefined
      }
      pattern.push(newRow);
    }

    // Create the bottom half by mirroring the top half vertically
    for (let y = 0; y < rows / 2; y++) {
      for (let x = 0; x < cols; x++) {
        let type = pattern[y][x].type;
        pattern[rows - y - 1][x] = new Tile(
          x * size,
          (rows - y - 1) * size,
          mirrorTypeVertically(type)
        );
      }
    }
  } else if (symmetryType === "p1") {
    // Create the motif pattern
    let motifPattern = [];
    for (let y = 0; y < motifRows; y++) {
      let row = [];
      for (let x = 0; x < motifCols; x++) {
        let type = floor(random(4)); // 0, 1, 2, 3
        row.push(new Tile(x * size, y * size, type));
      }
      motifPattern.push(row);
    }

    // Repeat the motif pattern across the entire canvas
    for (let y = 0; y < rows; y++) {
      let row = [];
      for (let x = 0; x < cols; x++) {
        let motifX = x % motifCols;
        let motifY = y % motifRows;
        let motifTile = motifPattern[motifY][motifX];
        row.push(new Tile(x * size, y * size, motifTile.type));
      }
      pattern.push(row);
    }
  } else if (symmetryType === "p2") {
    // Create a C2 symmetric motif
    let motifPattern = [];
    for (let y = 0; y < motifRows; y++) {
      let row = [];
      for (let x = 0; x < motifCols / 2; x++) {
        let type = floor(random(4)); // 0, 1, 2, 3
        row.push(new Tile(x * size, y * size, type)); // Left half of the motif
      }
      motifPattern.push(row);
    }

    // Create the right half of the motif by rotating the left half 180 degrees
    for (let y = 0; y < motifRows; y++) {
      for (let x = 0; x < motifCols / 2; x++) {
        let type = motifPattern[y][x].type;
        let newType = rotateType180(type);
        let newX = motifCols - x - 1;
        let newY = motifRows - y - 1;
        motifPattern[newY][newX] = new Tile(newX * size, newY * size, newType);
      }
    }

    // Ensure motifPattern array is fully constructed
    for (let y = 0; y < motifRows; y++) {
      motifPattern[y].length = motifCols;
    }

    // Repeat the motif pattern across the entire canvas
    for (let y = 0; y < rows; y++) {
      let row = [];
      for (let x = 0; x < cols; x++) {
        let motifX = x % motifCols;
        let motifY = y % motifRows;
        let motifTile = motifPattern[motifY][motifX];
        row.push(new Tile(x * size, y * size, motifTile.type));
      }
      pattern.push(row);
    }
  } else if (symmetryType === "pm_v") {
    // Create a random motif for the left half
    let motifPattern = [];
    for (let y = 0; y < motifRows; y++) {
      let row = [];
      for (let x = 0; x < motifCols / 2; x++) {
        let type = floor(random(4)); // 0, 1, 2, 3
        row.push(new Tile(x * size, y * size, type)); // Left half of the motif
      }
      motifPattern.push(row);
    }

    // Create the right half of the motif by mirroring the left half horizontally
    for (let y = 0; y < motifRows; y++) {
      for (let x = 0; x < motifCols / 2; x++) {
        let type = motifPattern[y][x].type;
        let newType = mirrorTypeHorizontally(type);
        let newX = motifCols - x - 1;
        motifPattern[y][newX] = new Tile(newX * size, y * size, newType);
      }
    }

    // Ensure motifPattern array is fully constructed
    for (let y = 0; y < motifRows; y++) {
      motifPattern[y].length = motifCols;
    }

    // Repeat the motif pattern across the entire canvas
    for (let y = 0; y < rows; y++) {
      let row = [];
      for (let x = 0; x < cols; x++) {
        let motifX = x % motifCols;
        let motifY = y % motifRows;
        let motifTile = motifPattern[motifY][motifX];
        row.push(new Tile(x * size, y * size, motifTile.type));
      }
      pattern.push(row);
    }
  } else if (symmetryType === "pm_h") {
    // Create a random motif for the top half
    let motifPattern = [];
    for (let y = 0; y < motifRows / 2; y++) {
      let row = [];
      for (let x = 0; x < motifCols; x++) {
        let type = floor(random(4)); // 0, 1, 2, 3
        row.push(new Tile(x * size, y * size, type)); // Top half of the motif
      }
      motifPattern.push(row);
    }

    // Create the bottom half of the motif by mirroring the top half vertically
    for (let y = 0; y < motifRows / 2; y++) {
      for (let x = 0; x < motifCols; x++) {
        let type = motifPattern[y][x].type;
        let newType = mirrorTypeVertically(type);
        let newY = motifRows - y - 1;
        motifPattern[newY] = motifPattern[newY] || [];
        motifPattern[newY][x] = new Tile(x * size, newY * size, newType);
      }
    }

    // Ensure motifPattern array is fully constructed
    motifPattern.length = motifRows;

    // Repeat the motif pattern across the entire canvas
    for (let y = 0; y < rows; y++) {
      let row = [];
      for (let x = 0; x < cols; x++) {
        let motifX = x % motifCols;
        let motifY = y % motifRows;
        let motifTile = motifPattern[motifY][motifX];
        row.push(new Tile(x * size, y * size, motifTile.type));
      }
      pattern.push(row);
    }
  } else if (symmetryType === "pg_h") {
    let motifPattern = [];
    for (let y = 0; y < motifRows; y++) {
      motifPattern[y] = new Array(motifCols); // Initialize each row as an array
    }

    // Generate the top-left quadrant of the motif randomly
    for (let y = 0; y < motifRows; y++) {
      for (let x = 0; x < motifCols / 2; x++) {
        let type = floor(random(4)); // Random type for the top-left quadrant
        motifPattern[y][x] = new Tile(x * size, y * size, type);

        // Create the pattern using glide reflections
        let newType = mirrorAndFlipHorizontally(type);
        motifPattern[y][motifCols - x - 1] = new Tile(
          (motifCols - x - 1) * size,
          y * size,
          newType
        );
      }
    }

    // Apply glide reflections to ensure proper symmetry
    for (let y = 0; y < motifRows; y++) {
      for (let x = 0; x < motifCols; x++) {
        let type = motifPattern[y][x].type;
        if (type === undefined) continue;

        // Apply glide reflections vertically
        let newType = mirrorAndFlipVertically(type);
        motifPattern[(motifRows - y - 1) % motifRows][x] = new Tile(
          x * size,
          ((motifRows - y - 1) % motifRows) * size + size / 2,
          newType
        );
      }
    }

    // Repeat the motif pattern across the entire canvas with diagonal shifting
    for (let y = 0; y < rows; y++) {
      let row = [];
      for (let x = 0; x < cols; x++) {
        let motifX = (x + (y % 2) * (motifCols / 2)) % motifCols; // Diagonal shift for every other row
        let motifY = y % motifRows;
        let motifTile = motifPattern[motifY][motifX];
        row.push(new Tile(x * size, y * size, motifTile.type));
      }
      pattern.push(row);
    }
  } else if (symmetryType === "cm_s") {
    let motifPattern = [];
    for (let y = 0; y < motifRows; y++) {
      motifPattern[y] = new Array(motifCols); // Initialize each row as an array
    }

    // Generate the motif for the top half
    for (let y = 0; y < motifRows / 2; y++) {
      for (let x = 0; x < motifCols / 2; x++) {
        let type = floor(random(4)); // Random type for the top-left quadrant
        motifPattern[y][x] = new Tile(x * size, y * size, type);

        // Reflect horizontally to complete the rows
        let newType = mirrorTypeHorizontally(type);
        motifPattern[y][motifCols - x - 1] = new Tile(
          (motifCols - x - 1) * size,
          y * size,
          newType
        );
      }
    }

    // Apply vertical reflections to create the bottom half
    for (let y = 0; y < motifRows / 2; y++) {
      for (let x = 0; x < motifCols; x++) {
        let type = motifPattern[y][x].type;
        let newType = mirrorTypeVertically(type);
        motifPattern[motifRows - y - 1][x] = new Tile(
          x * size,
          (motifRows - y - 1) * size,
          newType
        );
      }
    }

    // Repeat the motif pattern across the entire canvas with staggered rows
    for (let y = 0; y < rows; y++) {
      let row = [];
      for (let x = 0; x < cols; x++) {
        let motifX = (x + (y % 2) * (motifCols / 2)) % motifCols; // Staggered shift for every other row
        let motifY = y % motifRows;
        let motifTile = motifPattern[motifY][motifX];
        row.push(new Tile(x * size, y * size, motifTile.type));
      }
      pattern.push(row);
    }
  } else if (symmetryType === "pmm") {
    let motifPattern = [];

    // Create the top left quadrant
    for (let y = 0; y < motifRows / 2; y++) {
      let row = [];
      for (let x = 0; x < motifCols / 2; x++) {
        let type = floor(random(4)); // 0, 1, 2, 3
        row.push(new Tile(x * size, y * size, type));
      }
      motifPattern.push(row);
    }

    // Create the top right quadrant by mirroring the top left quadrant horizontally
    for (let y = 0; y < motifRows / 2; y++) {
      for (let x = 0; x < motifCols / 2; x++) {
        let type = motifPattern[y][x].type;
        let newType = mirrorTypeHorizontally(type);
        motifPattern[y][motifCols - x - 1] = new Tile(
          (motifCols - x - 1) * size,
          y * size,
          newType
        );
      }
    }

    // Create the bottom left quadrant by mirroring the top left quadrant vertically
    for (let y = 0; y < motifRows / 2; y++) {
      for (let x = 0; x < motifCols / 2; x++) {
        let type = motifPattern[y][x].type;
        let newType = mirrorTypeVertically(type);
        motifPattern[motifRows - y - 1] = motifPattern[motifRows - y - 1] || [];
        motifPattern[motifRows - y - 1][x] = new Tile(
          x * size,
          (motifRows - y - 1) * size,
          newType
        );
      }
    }

    // Create the bottom right quadrant by rotating the top left quadrant 180 degrees
    for (let y = 0; y < motifRows / 2; y++) {
      for (let x = 0; x < motifCols / 2; x++) {
        let type = motifPattern[y][x].type;
        let newType = rotateType180(type);
        motifPattern[motifRows - y - 1][motifCols - x - 1] = new Tile(
          (motifCols - x - 1) * size,
          (motifRows - y - 1) * size,
          newType
        );
      }
    }

    // Ensure motifPattern array is fully constructed
    motifPattern.length = motifRows;

    // Repeat the motif pattern across the entire canvas
    for (let y = 0; y < rows; y++) {
      let row = [];
      for (let x = 0; x < cols; x++) {
        let motifX = x % motifCols;
        let motifY = y % motifRows;
        let motifTile = motifPattern[motifY][motifX];
        row.push(new Tile(x * size, y * size, motifTile.type));
      }
      pattern.push(row);
    }
  } else if (symmetryType === "pmg_h") {
    let motifPattern = [];

    // Use the predefined top left quadrant
    for (let y = 0; y < motifRows / 2; y++) {
      let row = [];
      for (let x = 0; x < motifCols / 2; x++) {
        let type = floor(random(4)); // 0, 1, 2, 3
        row.push(new Tile(x * size, y * size, type));
      }
      motifPattern.push(row);
    }

    // Create the top right quadrant by rotating the top left quadrant 180 degrees
    for (let y = 0; y < motifRows / 2; y++) {
      for (let x = 0; x < motifCols / 2; x++) {
        let type = motifPattern[y][x].type;
        let newType = rotateType180(type);
        motifPattern[y][motifCols - x - 1] = new Tile(
          (motifCols - x - 1) * size,
          y * size,
          newType
        );
      }
    }

    // Create the bottom left quadrant by mirroring the top left quadrant vertically
    for (let y = 0; y < motifRows / 2; y++) {
      for (let x = 0; x < motifCols / 2; x++) {
        let type = motifPattern[y][x].type;
        let newType = mirrorTypeVertically(type);
        motifPattern[motifRows - y - 1] = motifPattern[motifRows - y - 1] || [];
        motifPattern[motifRows - y - 1][x] = new Tile(
          x * size,
          (motifRows - y - 1) * size,
          newType
        );
      }
    }

    // Create the bottom right quadrant by mirroring the top right quadrant vertically
    for (let y = 0; y < motifRows / 2; y++) {
      for (let x = motifCols / 2; x < motifCols; x++) {
        let type = motifPattern[y][x].type;
        let newType = mirrorTypeVertically(type);
        motifPattern[motifRows - y - 1][x] = new Tile(
          x * size,
          (motifRows - y - 1) * size,
          newType
        );
      }
    }

    // Ensure motifPattern array is fully constructed
    motifPattern.length = motifRows;

    // Repeat the motif pattern across the entire canvas
    for (let y = 0; y < rows; y++) {
      let row = [];
      for (let x = 0; x < cols; x++) {
        let motifX = x % motifCols;
        let motifY = y % motifRows;
        let motifTile = motifPattern[motifY][motifX];
        row.push(new Tile(x * size, y * size, motifTile.type));
      }
      pattern.push(row);
    }
  } else if (symmetryType === "pmg_v") {
    let motifPattern = [];

    // Use the predefined top left quadrant
    for (let y = 0; y < motifRows / 2; y++) {
      let row = [];
      for (let x = 0; x < motifCols / 2; x++) {
        let type = floor(random(4)); // 0, 1, 2, 3
        row.push(new Tile(x * size, y * size, type));
      }
      motifPattern.push(row);
    }

    // Create the top right quadrant by mirroring the top left quadrant horizontally
    for (let y = 0; y < motifRows / 2; y++) {
      for (let x = 0; x < motifCols / 2; x++) {
        let type = motifPattern[y][x].type;
        let newType = mirrorTypeHorizontally(type);
        motifPattern[y][motifCols - x - 1] = new Tile(
          (motifCols - x - 1) * size,
          y * size,
          newType
        );
      }
    }

    // Create the bottom left quadrant by rotating the top left quadrant 180 degrees
    for (let y = 0; y < motifRows / 2; y++) {
      for (let x = 0; x < motifCols / 2; x++) {
        let type = motifPattern[y][x].type;
        let newType = rotateType180(type);
        motifPattern[motifRows - y - 1] = motifPattern[motifRows - y - 1] || [];
        motifPattern[motifRows - y - 1][x] = new Tile(
          x * size,
          (motifRows - y - 1) * size,
          newType
        );
      }
    }

    // Create the bottom right quadrant by mirroring the bottom left quadrant horizontally
    for (let y = motifRows / 2; y < motifRows; y++) {
      for (let x = 0; x < motifCols / 2; x++) {
        let type = motifPattern[y][x].type;
        let newType = mirrorTypeHorizontally(type);
        motifPattern[y][motifCols - x - 1] = new Tile(
          (motifCols - x - 1) * size,
          y * size,
          newType
        );
      }
    }

    // Ensure motifPattern array is fully constructed
    motifPattern.length = motifRows;

    // Repeat the motif pattern across the entire canvas
    for (let y = 0; y < rows; y++) {
      let row = [];
      for (let x = 0; x < cols; x++) {
        let motifX = x % motifCols;
        let motifY = y % motifRows;
        let motifTile = motifPattern[motifY][motifX];
        row.push(new Tile(x * size, y * size, motifTile.type));
      }
      pattern.push(row);
    }
  } else if (symmetryType === "pgg") {
    let motifPattern = [];
    for (let y = 0; y < motifRows; y++) {
      motifPattern[y] = new Array(motifCols); // Initialize each row as an array
    }

    // Generate the top-left quadrant of the motif randomly
    for (let y = 0; y < motifRows / 2; y++) {
      for (let x = 0; x < motifCols / 2; x++) {
        let type = floor(random(4)); // Random type for the top-left quadrant
        motifPattern[y][x] = new Tile(x * size, y * size, type);

        // Create the pattern using glide reflections and rotations
        let newType = mirrorAndFlipHorizontally(type);
        motifPattern[y][motifCols - x - 1] = new Tile(
          (motifCols - x - 1) * size,
          y * size,
          newType
        );

        newType = mirrorAndFlipVertically(type);
        motifPattern[motifRows - y - 1][x] = new Tile(
          x * size,
          (motifRows - y - 1) * size,
          newType
        );

        newType = rotateType180(type);
        motifPattern[motifRows - y - 1][motifCols - x - 1] = new Tile(
          (motifCols - x - 1) * size,
          (motifRows - y - 1) * size,
          newType
        );
      }
    }

    // Ensure the rotation centers are not on the glide reflection axes
    for (let y = 0; y < motifRows; y++) {
      for (let x = 0; x < motifCols; x++) {
        let type = motifPattern[y][x].type;
        if (type === undefined) continue;

        // Apply glide reflections
        let newType = mirrorAndFlipVertically(type);
        motifPattern[motifRows - y - 1][x] = new Tile(
          x * size,
          (motifRows - y - 1) * size,
          newType
        );

        newType = mirrorAndFlipHorizontally(type);
        motifPattern[y][motifCols - x - 1] = new Tile(
          (motifCols - x - 1) * size,
          y * size,
          newType
        );
      }
    }

    // Repeat the motif pattern across the entire canvas with diagonal shifting
    for (let y = 0; y < rows; y++) {
      let row = [];
      for (let x = 0; x < cols; x++) {
        let motifX = (x + (y % 2) * (motifCols / 2)) % motifCols; // Diagonal shift for every other row
        let motifY = y % motifRows;
        let motifTile = motifPattern[motifY][motifX];
        row.push(new Tile(x * size, y * size, motifTile.type));
      }
      pattern.push(row);
    }
  } else if (symmetryType === "cmm") {
    let motifPattern = [];
    for (let y = 0; y < motifRows; y++) {
      motifPattern[y] = new Array(motifCols); // Initialize each row as an array
    }

    // Generate the top-left quadrant of the motif randomly
    for (let y = 0; y < motifRows / 2; y++) {
      for (let x = 0; x < motifCols / 2; x++) {
        let type = floor(random(4)); // Random type for the top-left quadrant
        motifPattern[y][x] = new Tile(x * size, y * size, type);

        // Reflect horizontally
        let newType = mirrorTypeHorizontally(type);
        motifPattern[y][motifCols - x - 1] = new Tile(
          (motifCols - x - 1) * size,
          y * size,
          newType
        );

        // Reflect vertically
        newType = mirrorTypeVertically(type);
        motifPattern[motifRows - y - 1][x] = new Tile(
          x * size,
          (motifRows - y - 1) * size,
          newType
        );

        // 180-degree rotation
        newType = rotateType180(type);
        motifPattern[motifRows - y - 1][motifCols - x - 1] = new Tile(
          (motifCols - x - 1) * size,
          (motifRows - y - 1) * size,
          newType
        );
      }
    }

    // Apply additional reflections to ensure proper symmetry
    for (let y = 0; y < motifRows; y++) {
      for (let x = 0; x < motifCols / 2; x++) {
        let type = motifPattern[y][x].type;

        // Reflect across the horizontal center
        let newType = mirrorTypeVertically(type);
        motifPattern[motifRows - y - 1][x] = new Tile(
          x * size,
          (motifRows - y - 1) * size,
          newType
        );

        // Reflect across the vertical center
        newType = mirrorTypeHorizontally(type);
        motifPattern[y][motifCols - x - 1] = new Tile(
          (motifCols - x - 1) * size,
          y * size,
          newType
        );

        // Reflect diagonally
        newType = rotateType180(type);
        motifPattern[motifRows - y - 1][motifCols - x - 1] = new Tile(
          (motifCols - x - 1) * size,
          (motifRows - y - 1) * size,
          newType
        );
      }
    }

    // Repeat the motif pattern across the entire canvas with diagonal shifting
    for (let y = 0; y < rows; y++) {
      let row = [];
      for (let x = 0; x < cols; x++) {
        let motifX = (x + (y % 2) * (motifCols / 2)) % motifCols; // Diagonal shift for every other row
        let motifY = y % motifRows;
        let motifTile = motifPattern[motifY][motifX];
        row.push(new Tile(x * size, y * size, motifTile.type));
      }
      pattern.push(row);
    }
  } else if (symmetryType === "p4") {
    // Create a C4 symmetric motif
    let motifPattern = [];
    for (let y = 0; y < motifRows; y++) {
      motifPattern[y] = new Array(motifCols); // Initialize each row as an array
    }

    // Generate the top-left quadrant of the motif randomly
    for (let y = 0; y < motifRows / 2; y++) {
      for (let x = 0; x < motifCols / 2; x++) {
        let type = floor(random(4)); // Random type for the top-left quadrant
        motifPattern[y][x] = new Tile(x * size, y * size, type);

        // Top-right quadrant (rotate 90 degrees clockwise)
        let newType = rotateTypeClockwise(type);
        motifPattern[x][motifCols - y - 1] = new Tile(
          (motifCols - y - 1) * size,
          x * size,
          newType
        );

        // Bottom-left quadrant (rotate 270 degrees clockwise or 90 degrees counter-clockwise)
        newType = rotateTypeCounterClockwise(type);
        motifPattern[motifRows - x - 1][y] = new Tile(
          y * size,
          (motifRows - x - 1) * size,
          newType
        );

        // Bottom-right quadrant (rotate 180 degrees)
        newType = rotateType180(type);
        motifPattern[motifRows - y - 1][motifCols - x - 1] = new Tile(
          (motifCols - x - 1) * size,
          (motifRows - y - 1) * size,
          newType
        );
      }
    }

    // Repeat the motif pattern across the entire canvas
    for (let y = 0; y < rows; y++) {
      let row = [];
      for (let x = 0; x < cols; x++) {
        let motifX = x % motifCols;
        let motifY = y % motifRows;
        let motifTile = motifPattern[motifY][motifX];
        row.push(new Tile(x * size, y * size, motifTile.type));
      }
      pattern.push(row);
    }
  } else if (symmetryType === "p4m") {
    // Create a D4 symmetric motif
    let motifPattern = [];
    for (let y = 0; y < motifRows; y++) {
      motifPattern[y] = new Array(motifCols); // Initialize each row as an array
    }

    // Generate the top-left quadrant of the motif with diagonal symmetry
    for (let y = 0; y < motifRows / 2; y++) {
      for (let x = 0; x <= y; x++) {
        let type;
        if (x < y) {
          type = floor(random(2)); // 0 or 1 for the triangle below the diagonal
        } else {
          type = floor(random(2)); // Ensure diagonal only has types 0 and 1
        }
        motifPattern[y][x] = new Tile(x * size, y * size, type);
        if (x != y) {
          let newType = mirrorTypeDiagonally(type);
          motifPattern[x][y] = new Tile(y * size, x * size, newType);
        }
      }
    }

    // Reflect and rotate to create D4 symmetry
    for (let y = 0; y < motifRows / 2; y++) {
      for (let x = 0; x < motifCols / 2; x++) {
        let type = motifPattern[y][x].type;

        // Top-right quadrant (mirror horizontally)
        let newType = mirrorTypeHorizontally(type);
        motifPattern[y][motifCols - x - 1] = new Tile(
          (motifCols - x - 1) * size,
          y * size,
          newType
        );

        // Bottom-left quadrant (mirror vertically)
        newType = mirrorTypeVertically(type);
        motifPattern[motifRows - y - 1][x] = new Tile(
          x * size,
          (motifRows - y - 1) * size,
          newType
        );

        // Bottom-right quadrant (rotate 180 degrees)
        newType = rotateType180(type);
        motifPattern[motifRows - y - 1][motifCols - x - 1] = new Tile(
          (motifCols - x - 1) * size,
          (motifRows - y - 1) * size,
          newType
        );
      }
    }

    // Repeat the motif pattern across the entire canvas
    for (let y = 0; y < rows; y++) {
      let row = [];
      for (let x = 0; x < cols; x++) {
        let motifX = x % motifCols;
        let motifY = y % motifRows;
        let motifTile = motifPattern[motifY][motifX];
        row.push(new Tile(x * size, y * size, motifTile.type));
      }
      pattern.push(row);
    }

} else if (symmetryType === "p4g") {
  let motifPattern = [];
  for (let y = 0; y < motifRows; y++) {
    motifPattern[y] = new Array(motifCols);
  }

  // Generate the top-left quadrant
  for (let y = 0; y < motifRows / 2; y++) {
    for (let x = 0; x <= y; x++) {
      let type;
      if (x < y) {
        type = floor(random(2)) + 2; // Only type 2 or 3 for below the diagonal
      } else {
        type = floor(random(2)); // Only type 0 or 1 for the diagonal
      }
      motifPattern[y][x] = new Tile(x * size, y * size, type);
    }
  }

  // Reflect across the main diagonal
  for (let y = 0; y < motifRows / 2; y++) {
    for (let x = 0; x < y; x++) {
      let type = motifPattern[y][x].type;
      let reflectedType = reflectTypeAcrossDiagonal(type);
      motifPattern[x][y] = new Tile(y * size, x * size, reflectedType);
    }
  }

  // Mirror horizontally to complete top-left quadrant
  for (let y = 0; y < motifRows / 2; y++) {
    for (let x = motifCols / 2; x < motifCols; x++) {
      let type = motifPattern[y][motifCols - x - 1].type;
      let mirroredType = mirrorTypeHorizontally(type);
      motifPattern[y][x] = new Tile(x * size, y * size, mirroredType);
    }
  }

  // Mirror vertically to complete bottom-left quadrant
  for (let y = motifRows / 2; y < motifRows; y++) {
    for (let x = 0; x < motifCols / 2; x++) {
      let type = motifPattern[motifRows - y - 1][x].type;
      let mirroredType = mirrorTypeVertically(type);
      motifPattern[y][x] = new Tile(x * size, y * size, mirroredType);
    }
  }

  // Rotate 90 degrees more to fill the bottom-right quadrant
  for (let y = motifRows / 2; y < motifRows; y++) {
    for (let x = motifCols / 2; x < motifCols; x++) {
      let type = motifPattern[motifRows - y - 1][motifCols - x - 1].type;
      let rotatedType = rotateTypeClockwise(rotateTypeClockwise(type));
      motifPattern[y][x] = new Tile(x * size, y * size, rotatedType);
    }
  }

  // Repeat the motif pattern across the entire canvas
  for (let y = 0; y < rows; y++) {
    let row = [];
    for (let x = 0; x < cols; x++) {
      let motifX = x % motifCols;
      let motifY = y % motifRows;
      let motifTile = motifPattern[motifY][motifX];
      row.push(new Tile(x * size, y * size, motifTile.type));
    }
    pattern.push(row);
  }
}
return pattern;
}

// Helper function to rotate the tile types
function rotateType180(type) {
  if (type == 0) return 1;
  if (type == 1) return 0;
  if (type == 2) return 3;
  if (type == 3) return 2;
}

function rotateTypeClockwise(type) {
  if (type == 0) return 3;
  if (type == 1) return 2;
  if (type == 2) return 1;
  if (type == 3) return 0;
}

function rotateTypeCounterClockwise(type) {
  if (type == 0) return 3;
  if (type == 1) return 2;
  if (type == 2) return 0;
  if (type == 3) return 1;
}

// Helper function to rotate the tile types
function rotateType180(type) {
  if (type == 0) return 1;
  if (type == 1) return 0;
  if (type == 2) return 3;
  if (type == 3) return 2;
}

function rotateTypeClockwise(type) {
  if (type == 0) return 2;
  if (type == 1) return 3;
  if (type == 2) return 1;
  if (type == 3) return 0;
}

function rotateTypeCounterClockwise(type) {
  if (type == 0) return 3;
  if (type == 1) return 2;
  if (type == 2) return 0;
  if (type == 3) return 1;
}

// Helper functions to mirror the tile types
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
  if (type == 0) return 0;
  if (type == 1) return 1;
  if (type == 2) return 3;
  if (type == 3) return 2;
}

function reflectTypeAcrossDiagonal(type) {
  if (type == 0) return 1;
  if (type == 1) return 0;
  if (type == 2) return 3;
  if (type == 3) return 2;
}

function mirrorAndFlipHorizontally(type) {
  if (type == 0) return 1;
  if (type == 1) return 0;
  if (type == 2) return 3;
  if (type == 3) return 2;
}

function mirrorAndFlipVertically(type) {
  if (type == 0) return 3;
  if (type == 1) return 2;
  if (type == 2) return 1;
  if (type == 3) return 0;
}

// END OF HELPER FUNCTIONS // DO NOT TOUCH !!!


function switchInstruments(selection) {
  if (selection === "Grand Piano and Organ") {
    instruments.TL = new Tone.Sampler({ urls: { A4: "A4.mp3", C4: "C4.mp3" } }).toDestination();
    instruments.TR = new Tone.Sampler({ urls: { A4: "A4.mp3", C4: "C4.mp3" } }).toDestination();
  } else if (selection === "Default Synths") {
    instruments.TL = new Tone.Synth({ oscillator: { type: "triangle" }, envelope: { release: 0.5 } }).toDestination();
    instruments.TR = new Tone.Synth({ oscillator: { type: "sine" }, envelope: { release: 0.3 } }).toDestination();
  }
}

function playMusic() {
  const startTime = Tone.now();
  const baseTimeStep = 1 / playbackSpeed; // Adjust base time step by playback speed
  const noteDuration = 0.5 / playbackSpeed; // Adjust note duration by playback speed
  const highlightDuration = 200 / playbackSpeed; // Adjust highlight duration by playback speed

  const grandPiano = new Tone.Sampler({
    urls: {
      A4: "A4.mp3",
      C4: "C4.mp3",
      E4: "E4.mp3",
    },
    baseUrl: "https://tonejs.github.io/audio/salamander/",
  }).toDestination();

  // Generate music based on tile patterns and transformations
  tiles.forEach((row, rowIndex) => {
    row.forEach((tile, colIndex) => {
      const motifStartTime =
        startTime + rowIndex * baseTimeStep + colIndex * (0.2 / playbackSpeed);

      // Map the tile type to a note in the current scale
      const noteIndex = tile.type % currentScale.length;
      const baseNote = currentScale[noteIndex];

      // Adjust pitch and chords using transformations and patterns
      let pitch = baseNote;
      let chord = mapChord(baseNote); // Default chord based on root note

      switch (currentTransformation) {
        case "Inversion":
          pitch = currentScale[0] + (currentScale[0] - baseNote);
          chord = mapChord(pitch); // Update chord after inversion
          break;
        case "Retrograde":
          pitch = currentScale[currentScale.length - 1 - noteIndex];
          chord = mapChord(pitch); // Update chord after retrograde
          break;
        case "Augmentation":
          pitch += 12; // Shift an octave up
          chord = mapChord(pitch); // Update chord after augmentation
          break;
        case "Canon":
        case "Counterpoint":
          // Handled in layering section below
          break;
      }

      // Apply dynamic inversion to chords
      const inversionLevel = (rowIndex + colIndex) % chord.length;
      chord = invertChord(chord, inversionLevel);

      // Play the chord or single note
      setTimeout(() => {
        if (playMode === "Harmony") {
          // Play the chord
          chord.forEach((note, index) => {
            setTimeout(() => {
              grandPiano.triggerAttackRelease(
                Tone.Frequency(note, "midi").toNote(),
                noteDuration
              );
            }, index * (200 / playbackSpeed)); // Stagger notes within the chord
          });
        } else if (playMode === "Melody") {
          // Play a single note
          grandPiano.triggerAttackRelease(
            Tone.Frequency(pitch, "midi").toNote(),
            noteDuration
          );
        }

        // Highlight the tile for visual feedback
        tile.highlighted = true;
        setTimeout(() => {
          tile.highlighted = false; // Remove highlight after duration
        }, highlightDuration);
      }, (motifStartTime - Tone.now()) * 1000);
    });
  });

  // Canon and Counterpoint Layering
  if (currentTransformation === "Canon" || currentTransformation === "Counterpoint") {
    tiles.forEach((row, rowIndex) => {
      row.forEach((tile, colIndex) => {
        const motifStartTime =
          startTime + rowIndex * baseTimeStep + colIndex * (0.2 / playbackSpeed);
        const canonOffset = 0.5 / playbackSpeed; // Adjust delay for canon
        const counterpointOffset = 7; // Fifth above for counterpoint
        const noteIndex = tile.type % currentScale.length;
        const baseNote = currentScale[noteIndex];

        const secondaryNote =
          currentTransformation === "Canon"
            ? baseNote
            : baseNote + counterpointOffset;

        setTimeout(() => {
          grandPiano.triggerAttackRelease(
            Tone.Frequency(secondaryNote, "midi").toNote(),
            noteDuration,
            motifStartTime + canonOffset
          );

          // Highlight the tile for the secondary melody
          tile.highlighted = true;
          setTimeout(() => {
            tile.highlighted = false;
          }, highlightDuration);
        }, (motifStartTime + canonOffset - Tone.now()) * 1000);
      });
    });
  }

  console.log(
    `Playing with Grand Piano, scale: ${currentScale}, transformation: ${currentTransformation}, speed: ${playbackSpeed}`
  );
}