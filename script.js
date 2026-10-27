// Background music. Browsers block sound until the visitor interacts with the
// page, so if autoplay is refused it starts on the first click, tap or key.
const music = document.getElementById('music');
const unlockEvents = ['pointerdown', 'keydown', 'touchstart'];

function playOnInteraction() {
  music.play().then(() => {
    unlockEvents.forEach((type) => window.removeEventListener(type, playOnInteraction));
  }, () => {});
}

music.volume = 0.6;
music.play().catch(() => {
  unlockEvents.forEach((type) => window.addEventListener(type, playOnInteraction));
});

// DVD screensaver: bacon strips fly in straight lines and bounce off the
// screen edges, changing colour on every hit like the old DVD logo.
const BACON_COUNT = 10;
const SPEED_MIN = 90; // px per second
const SPEED_MAX = 180;

const screen = document.getElementById('screen');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function random(min, max) {
  return min + Math.random() * (max - min);
}

function createBacon() {
  const img = document.createElement('img');
  img.src = 'bacon.png';
  img.alt = '';
  img.className = 'bacon';
  img.draggable = false;
  screen.appendChild(img);

  // Diagonal like the DVD logo: 45° in a random quadrant, give or take 20°.
  const quadrant = Math.floor(Math.random() * 4);
  const angle = ((quadrant * 90 + 45 + random(-20, 20)) * Math.PI) / 180;
  const speed = random(SPEED_MIN, SPEED_MAX);

  return {
    img,
    x: 0,
    y: 0,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    hue: 0,
    flip: Math.random() < 0.5 ? -1 : 1,
  };
}

function render(bacon) {
  bacon.img.style.transform = `translate3d(${bacon.x}px, ${bacon.y}px, 0) scaleX(${bacon.flip})`;
  bacon.img.style.filter = `hue-rotate(${bacon.hue}deg) saturate(${bacon.hue ? 1.6 : 1})`;
}

function bounce(bacon) {
  // Any colour except the one it already has.
  bacon.hue = (bacon.hue + random(60, 300)) % 360;
}

const bacons = Array.from({ length: BACON_COUNT }, createBacon);

function placeAll() {
  const w = window.innerWidth;
  const h = window.innerHeight;

  for (const bacon of bacons) {
    const bw = bacon.img.offsetWidth;
    const bh = bacon.img.offsetHeight;
    bacon.x = random(0, Math.max(0, w - bw));
    bacon.y = random(0, Math.max(0, h - bh));
    render(bacon);
  }
}

function step(dt) {
  const w = window.innerWidth;
  const h = window.innerHeight;

  for (const bacon of bacons) {
    const bw = bacon.img.offsetWidth;
    const bh = bacon.img.offsetHeight;
    const maxX = Math.max(0, w - bw);
    const maxY = Math.max(0, h - bh);
    let hit = false;

    bacon.x += bacon.vx * dt;
    bacon.y += bacon.vy * dt;

    if (bacon.x <= 0) {
      bacon.x = 0;
      bacon.vx = Math.abs(bacon.vx);
      hit = true;
    } else if (bacon.x >= maxX) {
      bacon.x = maxX;
      bacon.vx = -Math.abs(bacon.vx);
      hit = true;
    }

    if (bacon.y <= 0) {
      bacon.y = 0;
      bacon.vy = Math.abs(bacon.vy);
      hit = true;
    } else if (bacon.y >= maxY) {
      bacon.y = maxY;
      bacon.vy = -Math.abs(bacon.vy);
      hit = true;
    }

    if (hit) {
      bounce(bacon);
    }

    render(bacon);
  }
}

let last = null;

function frame(now) {
  if (last !== null) {
    // Cap the step so a hidden tab does not teleport the bacon on return.
    step(Math.min((now - last) / 1000, 0.05));
  }

  last = now;
  requestAnimationFrame(frame);
}

function start() {
  placeAll();

  if (!reduceMotion) {
    requestAnimationFrame(frame);
  }
}

const firstImg = bacons[0].img;

if (firstImg.complete) {
  start();
} else {
  firstImg.addEventListener('load', start, { once: true });
}
