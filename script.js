// Audio Synthesizer (Web Audio API - no external audio files required!)
class SoundController {
  constructor() {
    this.audioCtx = null;
    this.muted = false;
  }

  init() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioContext();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  playJump() {
    if (this.muted) return;
    this.init();
    const ctx = this.audioCtx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(450, ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  }

  playScoreMilestone() {
    if (this.muted) return;
    this.init();
    const ctx = this.audioCtx;
    const now = ctx.currentTime;

    const playTone = (freq, start, duration) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.15, start);
      gain.gain.linearRampToValueAtTime(0.01, start + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + duration);
    };

    playTone(660, now, 0.08);
    playTone(880, now + 0.09, 0.14);
  }

  playHit() {
    if (this.muted) return;
    this.init();
    const ctx = this.audioCtx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(130, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.28);

    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.28);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.28);
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }
}

// Game Setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const highScoreEl = document.getElementById('high-score');
const gameOverScreen = document.getElementById('game-over-screen');
const soundToggleBtn = document.getElementById('soundToggle');

const sound = new SoundController();

soundToggleBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  const isMuted = sound.toggleMute();
  soundToggleBtn.textContent = isMuted ? 'Sound: OFF 🔇' : 'Sound: ON 🔊';
});

const GROUND_Y = 205;
let gameSpeed = 5;
let score = 0;
let highScore = 0;
let gameOver = false;
let isStarted = false;
let spawnTimer = 0;
let animationFrameId = null;

// Dino Entity
const dino = {
  x: 50,
  y: GROUND_Y - 45,
  width: 40,
  height: 45,
  normalHeight: 45,
  duckHeight: 25,
  vy: 0,
  gravity: 0.7,
  jumpStrength: -12.5,
  isGrounded: true,
  isDucking: false,
  legSwing: 0,

  jump() {
    if (this.isGrounded && !this.isDucking) {
      this.vy = this.jumpStrength;
      this.isGrounded = false;
      sound.playJump();
    }
  },

  duck(state) {
    if (!this.isGrounded) return;
    this.isDucking = state;
    if (state) {
      this.height = this.duckHeight;
      this.y = GROUND_Y - this.duckHeight;
    } else {
      this.height = this.normalHeight;
      this.y = GROUND_Y - this.normalHeight;
    }
  },

  update() {
    if (!this.isGrounded) {
      this.vy += this.gravity;
      this.y += this.vy;

      if (this.y >= GROUND_Y - this.height) {
        this.y = GROUND_Y - this.height;
        this.vy = 0;
        this.isGrounded = true;
      }
    }

    this.legSwing += 0.25;
  },

  draw() {
    ctx.fillStyle = '#535353';

    if (this.isDucking) {
      // Ducking body
      ctx.fillRect(this.x, this.y + 5, 52, 20);
      // Head
      ctx.fillRect(this.x + 36, this.y, 18, 14);
      // Eye
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(this.x + 46, this.y + 3, 3, 3);
      ctx.fillStyle = '#535353';
      // Legs
      const legOffset = Math.sin(this.legSwing) > 0 ? 4 : 0;
      ctx.fillRect(this.x + 12, this.y + 20, 6, 5);
      ctx.fillRect(this.x + 28, this.y + 20 + legOffset, 6, 5 - legOffset);
      return;
    }

    // Normal Dino
    // Main Body
    ctx.fillRect(this.x + 8, this.y + 16, 26, 24);
    // Neck & Head
    ctx.fillRect(this.x + 22, this.y, 18, 20);
    // Snout
    ctx.fillRect(this.x + 34, this.y + 4, 8, 10);
    // Eye
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(this.x + 28, this.y + 4, 3, 3);
    ctx.fillStyle = '#535353';
    // Back & Tail
    ctx.fillRect(this.x, this.y + 20, 10, 12);
    ctx.fillRect(this.x - 4, this.y + 16, 6, 8);
    // Arms
    ctx.fillRect(this.x + 28, this.y + 22, 6, 3);

    // Legs
    if (this.isGrounded) {
      const step = Math.floor(this.legSwing) % 2 === 0;
      if (step) {
        ctx.fillRect(this.x + 14, this.y + 38, 4, 7);
        ctx.fillRect(this.x + 24, this.y + 38, 4, 4);
      } else {
        ctx.fillRect(this.x + 14, this.y + 38, 4, 4);
        ctx.fillRect(this.x + 24, this.y + 38, 4, 7);
      }
    } else {
      // Jumping legs spread
      ctx.fillRect(this.x + 12, this.y + 38, 4, 6);
      ctx.fillRect(this.x + 24, this.y + 38, 4, 6);
    }
  }
};

// Obstacles
let obstacles = [];

class Cactus {
  constructor(x, type = 0) {
    this.x = x;
    this.type = type;
    this.width = type === 0 ? 18 : 34;
    this.height = type === 0 ? 38 : 46;
    this.y = GROUND_Y - this.height;
  }

  update() {
    this.x -= gameSpeed;
  }

  draw() {
    ctx.fillStyle = '#535353';
    if (this.type === 0) {
      // Single Cactus
      ctx.fillRect(this.x + 6, this.y, 6, this.height);
      // Left arm
      ctx.fillRect(this.x, this.y + 12, 6, 12);
      ctx.fillRect(this.x, this.y + 12, 10, 4);
      // Right arm
      ctx.fillRect(this.x + 12, this.y + 8, 6, 12);
      ctx.fillRect(this.x + 8, this.y + 16, 8, 4);
    } else {
      // Double Cactus
      ctx.fillRect(this.x + 6, this.y, 6, this.height);
      ctx.fillRect(this.x, this.y + 14, 6, 10);
      ctx.fillRect(this.x + 22, this.y + 6, 6, this.height - 6);
      ctx.fillRect(this.x + 28, this.y + 16, 6, 10);
    }
  }
}

class Pterodactyl {
  constructor(x) {
    this.x = x;
    this.width = 36;
    this.height = 22;
    // Fly at high or low altitude
    this.y = Math.random() > 0.5 ? GROUND_Y - 55 : GROUND_Y - 32;
    this.wingCycle = 0;
  }

  update() {
    this.x -= gameSpeed + 1;
    this.wingCycle += 0.2;
  }

  draw() {
    ctx.fillStyle = '#535353';
    // Body & Beak
    ctx.fillRect(this.x + 10, this.y + 8, 18, 8);
    ctx.fillRect(this.x, this.y + 10, 10, 4);

    // Flapping wings
    const wingUp = Math.sin(this.wingCycle) > 0;
    if (wingUp) {
      ctx.fillRect(this.x + 14, this.y, 8, 10);
    } else {
      ctx.fillRect(this.x + 14, this.y + 14, 8, 10);
    }
  }
}

// Background Clouds & Ground bumps
let clouds = [
  { x: 200, y: 50 },
  { x: 500, y: 70 },
  { x: 750, y: 40 }
];

let groundMarks = [];
for (let i = 0; i < 800; i += 40) {
  groundMarks.push({ x: i, width: Math.random() * 20 + 8 });
}

function updateEnvironment() {
  clouds.forEach(cloud => {
    cloud.x -= gameSpeed * 0.2;
    if (cloud.x < -60) cloud.x = canvas.width + Math.random() * 80;
  });

  groundMarks.forEach(mark => {
    mark.x -= gameSpeed;
    if (mark.x < -30) mark.x = canvas.width + Math.random() * 20;
  });
}

function drawEnvironment() {
  // Ground baseline
  ctx.strokeStyle = '#535353';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y);
  ctx.lineTo(canvas.width, GROUND_Y);
  ctx.stroke();

  // Ground details
  ctx.fillStyle = '#9e9e9e';
  groundMarks.forEach(m => {
    ctx.fillRect(m.x, GROUND_Y + 4, m.width, 2);
  });

  // Clouds
  ctx.fillStyle = '#dcdcdc';
  clouds.forEach(c => {
    ctx.fillRect(c.x, c.y, 36, 10);
    ctx.fillRect(c.x + 8, c.y - 6, 20, 8);
  });
}

function checkCollision(a, b) {
  const padding = 5; // Slight forgiving hitbox
  return (
    a.x + padding < b.x + b.width &&
    a.x + (a.isDucking ? 50 : a.width) - padding > b.x &&
    a.y + padding < b.y + b.height &&
    a.y + a.height > b.y + padding
  );
}

function triggerGameOver() {
  gameOver = true;
  sound.playHit();
  gameOverScreen.classList.remove('hidden');

  if (score > highScore) {
    highScore = score;
    highScoreEl.textContent = `HI ${String(highScore).padStart(5, '0')}`;
  }
}

function resetGame() {
  dino.y = GROUND_Y - dino.normalHeight;
  dino.height = dino.normalHeight;
  dino.vy = 0;
  dino.isGrounded = true;
  dino.isDucking = false;

  obstacles = [];
  score = 0;
  gameSpeed = 5;
  spawnTimer = 0;
  gameOver = false;
  gameOverScreen.classList.add('hidden');
}

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawEnvironment();

  if (!gameOver && isStarted) {
    updateEnvironment();
    dino.update();

    // Score update
    score += 0.2;
    const currentScore = Math.floor(score);
    scoreEl.textContent = String(currentScore).padStart(5, '0');

    // Milestone sound every 100 points
    if (currentScore > 0 && currentScore % 100 === 0 && Math.floor(score - 0.2) % 100 !== 0) {
      sound.playScoreMilestone();
    }

    // Gradual difficulty increase
    gameSpeed += 0.0008;

    // Obstacle Spawning
    spawnTimer++;
    if (spawnTimer > Math.max(55, 110 - gameSpeed * 4)) {
      spawnTimer = 0;
      const rand = Math.random();
      if (rand < 0.6) {
        obstacles.push(new Cactus(canvas.width, 0));
      } else if (rand < 0.85) {
        obstacles.push(new Cactus(canvas.width, 1));
      } else if (score > 150) {
        // Birds appear after score > 150
        obstacles.push(new Pterodactyl(canvas.width));
      } else {
        obstacles.push(new Cactus(canvas.width, 0));
      }
    }

    // Update & draw obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const obs = obstacles[i];
      obs.update();
      obs.draw();

      if (checkCollision(dino, obs)) {
        triggerGameOver();
      }

      if (obs.x + obs.width < 0) {
        obstacles.splice(i, 1);
      }
    }
  } else if (!isStarted) {
    // Idle ground
    drawEnvironment();
  }

  dino.draw();

  animationFrameId = requestAnimationFrame(gameLoop);
}

// Input Handlers
window.addEventListener('keydown', (e) => {
  sound.init(); // unlocks audio context on first interaction

  if (e.code === 'Space' || e.code === 'ArrowUp') {
    e.preventDefault();
    if (!isStarted) {
      isStarted = true;
      resetGame();
    } else if (gameOver) {
      resetGame();
    } else {
      dino.jump();
    }
  } else if (e.code === 'ArrowDown') {
    e.preventDefault();
    if (isStarted && !gameOver) {
      dino.duck(true);
    }
  }
});

window.addEventListener('keyup', (e) => {
  if (e.code === 'ArrowDown') {
    dino.duck(false);
  }
});

// Canvas touch / click support for mobile and mouse users
canvas.addEventListener('pointerdown', () => {
  sound.init();
  if (!isStarted) {
    isStarted = true;
    resetGame();
  } else if (gameOver) {
    resetGame();
  } else {
    dino.jump();
  }
});

gameOverScreen.addEventListener('click', () => {
  resetGame();
});

// Start loop
requestAnimationFrame(gameLoop);

