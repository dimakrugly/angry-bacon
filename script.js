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
// screen edges.
const BACON_KINDS = [
  'bacon-raw.png',
  'bacon-wavy.png',
  'bacon-fried-flat.png',
  'bacon-fried.png',
  'bacon-crispy.png',
];
const BACON_COUNT = 10;
const SPEED_MIN = 90; // px per second
const SPEED_MAX = 180;

const screen = document.getElementById('screen');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function random(min, max) {
  return min + Math.random() * (max - min);
}

function createBacon(_, index) {
  const img = document.createElement('img');
  img.src = BACON_KINDS[index % BACON_KINDS.length];
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
    flip: Math.random() < 0.5 ? -1 : 1,
  };
}

function render(bacon) {
  bacon.img.style.transform = `translate3d(${bacon.x}px, ${bacon.y}px, 0) scaleX(${bacon.flip})`;
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
    bacon.x += bacon.vx * dt;
    bacon.y += bacon.vy * dt;

    if (bacon.x <= 0) {
      bacon.x = 0;
      bacon.vx = Math.abs(bacon.vx);
    } else if (bacon.x >= maxX) {
      bacon.x = maxX;
      bacon.vx = -Math.abs(bacon.vx);
    }

    if (bacon.y <= 0) {
      bacon.y = 0;
      bacon.vy = Math.abs(bacon.vy);
    } else if (bacon.y >= maxY) {
      bacon.y = maxY;
      bacon.vy = -Math.abs(bacon.vy);
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

// Start once every kind has loaded, so each strip knows its real size.
Promise.all(
  bacons.map(({ img }) =>
    img.complete ? Promise.resolve() : new Promise((resolve) => img.addEventListener('load', resolve, { once: true })),
  ),
).then(start);
