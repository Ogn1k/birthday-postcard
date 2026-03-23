let font;
let button_font;
let state = 'waiting'; // 'waiting' | 'animating' | 'done'
let music;

let gif;
let gifAlpha = 0;
const FADE_SPEED = 2;

let gif2;
let gif2X;              // текущая X позиция
let gif2TargetX;        // финальная X позиция
let gif2Moving = false; // флаг начала анимации
const SLIDE_SPEED = 4;  // скорость выезда в пикселях за кадр

let domino;
let dominoScale = 0;       // текущий масштаб 0→1
let dominoAngle = 0;       // текущий угол в радианах
let dominoAppearing = false;
const DOMINO_SCALE_SPEED = 0.002;  // скорость роста
const DOMINO_SPIN_SPEED  = 0.08;  // скорость вращения
let dominoDone = false;

let dominoHead;
let particles = [];
let particlesSpawned = false;

let dominoDance;

let mikuDance;

// --- дверь ---

let closedDoor, closedDoorAnim, openDoorAnim;
let knockImg, clickHereImg;
let gifAlpha2 = 0;
let knockParticles = [];

// масштаб двери — 1.0 оригинал, меняй здесь
const DOOR_SCALE = 1.0;

// позиция двери
const DOOR_X = 0;
const DOOR_Y = 0;

// размеры оригинала
const DOOR_W_ORIG = 371;
const DOOR_H_ORIG = 342;

// итоговые размеры с учётом масштаба
let doorW, doorH;

// зона клика — правая часть двери
let zoneX, zoneY, zoneW, zoneH;

let doorAnimTimer = -1; // -1 = ещё не запущен

// -- мем ---

let cigarettePlate;
let plateOpen = false;
 
// --- физика текста ---
let tx, ty, vx, vy;
const GRAVITY  = 0.55;
const BOUNCE   = 0.52;   // коэффициент отскока по Y
const FRICTION = .72;   // затухание по X при каждом отскоке
const STOP_VY  = 2.0;    // порог остановки
 
// пол — Y-координата базовой линии текста в покое
let FLOOR;
 
// --- кнопка ---
let btn;
 
function preload() {
    button_font = loadFont('arialmt.ttf');
    font = loadFont('GreatVibes-Regular.ttf');

    music = new Audio('TripleBaka.mp3')
    music.loop = true;
    music.volume = 0.7;

    gif = loadImage('maxvell.gif');
    gif2 = loadImage('noelle-deltarune.gif');

    domino = loadImage('domino.png')
    dominoHead = loadImage('domino_head.png');
    dominoDance = loadImage('dominoDance.gif');
    mikuDance = loadImage('mikuDance.gif');

    closedDoor     = loadImage('closedDoor.png');
    closedDoorAnim = loadImage('closedDoorAnim.gif');
    openDoorAnim   = loadImage('openDoorAnim.gif');
    knockImg       = loadImage('knock.png');
    clickHereImg   = loadImage('clickHere.png');

    cigarettePlate = loadImage('cigarettePlate.jpg');
}
 
function setup() {
  createCanvas(800, 600);
  textFont(font);
 
  FLOOR = height - 70;
 
  btn = {
    x: width  / 2,   // центр круга
    y: height / 2,
    r: 44             // радиус круга
  };

  gif2X = width + 10; // за правым краем, скрыт

    doorW = DOOR_W_ORIG * DOOR_SCALE;
    doorH = DOOR_H_ORIG * DOOR_SCALE;

    // зона клика — правая половина двери
    zoneX = DOOR_X + doorW * 0;
    zoneY = DOOR_Y;
    zoneW = doorW * 1;
    zoneH = doorH;

    // GIF-ы ставим на паузу сразу — чтобы не играли до нужного момента
    closedDoorAnim.pause();
    closedDoorAnim.setFrame(0);
    openDoorAnim.pause();
    openDoorAnim.setFrame(0);
}
 
function draw() {
  background(255);

  if (state === 'waiting') {
      drawButton();
    } else if (state === 'animating') {
        drawAuthor()
        drawDoor();
        drawGif4()
        updatePhysics();
        drawMessage();
    } else {
        drawAuthor()
        drawDoor(); 

        drawGif4()
        drawGif();
        drawGif2();
        drawDomino();

        if (dominoDone && frameCount % 3 === 0) spawnParticle(200);
        drawParticles();

        drawMessage();
        
        drawPlate();
    }
}

// ─── дверь ────────────────────────────────────────────────────────────────

function drawDoor() {
  if (state === 'animating') {
    image(closedDoor, DOOR_X, DOOR_Y, doorW, doorH);

  } else if (state === 'done') {
  image(closedDoor, DOOR_X, DOOR_Y, doorW, doorH);

  if (doorAnimTimer > 0) {
    doorAnimTimer--;
  } else if (doorAnimTimer <= 0) {
    doorAnimTimer = -1;
    state = 'doorAnim';
    closedDoorAnim.play();
  }
} else if (state === 'doorAnim') {
    image(closedDoorAnim, DOOR_X, DOOR_Y, doorW, doorH);

    // последний кадр — замораживаем и переходим к knocking
    if (closedDoorAnim.getCurrentFrame() === closedDoorAnim.numFrames() - 1) {
      closedDoorAnim.pause();
      state = 'knocking';
    }

  } else if (state === 'knocking') {
    image(closedDoorAnim, DOOR_X, DOOR_Y, doorW, doorH);
    drawDoorZone();

    drawClickHere();
    drawKnocks();

  } else if (state === 'opening') {
    image(openDoorAnim, DOOR_X, DOOR_Y, doorW, doorH);

    if (openDoorAnim.getCurrentFrame() === openDoorAnim.numFrames() - 1) {
      openDoorAnim.pause();
      gifAlpha2 = 0;
      state = 'openDone';
    }

  } else if (state === 'openDone') {
    image(openDoorAnim, DOOR_X, DOOR_Y, doorW, doorH);
    drawClickHere();
  }
}

function drawDoorZone() {
  let hovered = mouseX > zoneX && mouseX < zoneX + zoneW &&
                mouseY > zoneY && mouseY < zoneY + zoneH;
  if (hovered) {
    noStroke();
    fill(255, 255, 255, 40);
    rect(zoneX, zoneY, zoneW, zoneH);
    cursor(HAND);
  } else {
    cursor(ARROW);
  }
}

function spawnKnockPair() {
  knockParticles.push({
    x: 130, y: 180, alpha: 255, delay: 0   // первая — без задержки
  });
  knockParticles.push({
    x: 130, y: 180, alpha: 255, delay: 30  // вторая — 30 кадров задержки (~0.5 сек)
  });
}

function drawKnocks() {
  if (knockParticles.length === 0) spawnKnockPair();

  for (let i = knockParticles.length - 1; i >= 0; i--) {
    let k = knockParticles[i];

    // ждём пока задержка не истечёт
    if (k.delay > 0) {
      k.delay--;
      continue;
    }

    k.alpha -= 3;
    k.x     += 0.5;
    k.y     -= 0.5;

    if (k.alpha <= 0) {
      knockParticles.splice(i, 1);
      continue;
    }

    tint(255, k.alpha);
    image(knockImg, k.x, k.y);
    noTint();
  }
}

function drawClickHere() {
  if (gifAlpha2 < 255) gifAlpha2 = min(gifAlpha2 + FADE_SPEED, 255);

  let gifW = clickHereImg.width;
  let gifH = clickHereImg.height;
  let gifX = 200;                 // у левого края
  let gifY = 0;    // чуть выше текста

  tint(255, gifAlpha2);
  image(clickHereImg, gifX, gifY, gifW, gifH);
  noTint();
}

// ─── мем ────────────────────────────────────────────────────────────────

function drawPlate() {
  if (!plateOpen) return;

  // затемнённый фон
  noStroke();
  fill(0, 0, 0, 180);
  rect(0, 0, width, height);

  // размер картинки — 75% от canvas
  let imgW = width  * 0.75;
  let imgH = height * 0.75;
  let imgX = (width  - imgW) / 2;
  let imgY = (height - imgH) / 2;

  image(cigarettePlate, imgX, imgY, imgW, imgH);

  // кнопка закрытия — крестик в правом верхнем углу картинки
  let btnSize = 30;
  let btnX = imgX + imgW - btnSize / 2;
  let btnY = imgY - btnSize / 2;

  fill(0);
  stroke(255);
  strokeWeight(1.5);
  ellipse(btnX, btnY, btnSize);

  stroke(255);
  strokeWeight(2);
  let o = 7; // размер крестика
  line(btnX - o, btnY - o, btnX + o, btnY + o);
  line(btnX + o, btnY - o, btnX - o, btnY + o);

  strokeWeight(1);
  cursor(ARROW);
}

// ─── кнопка ────────────────────────────────────────────────────────────────
 
function drawButton() {
  let hovered = dist(mouseX, mouseY, btn.x, btn.y) < btn.r;
 
  // тень
  noStroke();
  fill(0, 0, 0, 25);
  ellipse(btn.x + 3, btn.y + 5, btn.r * 2);
 
  // круг — заливка меняется при наведении
  fill(hovered ? 40 : 0);
  ellipse(btn.x, btn.y, btn.r * 2);
 
  // треугольник (символ play) — чуть сдвинут вправо для оптического баланса
  fill(255);
  noStroke();
  let s = btn.r * 0.38;   // полуразмер треугольника
  let ox = btn.r * 0.12;  // сдвиг вправо
  beginShape();
  vertex(btn.x + ox - s,       btn.y - s * 1.5);
  vertex(btn.x + ox + s * 1.3, btn.y);
  vertex(btn.x + ox - s,       btn.y + s * 1.5);
  endShape(CLOSE);
}
 
// ─── анимация ──────────────────────────────────────────────────────────────
 
function startAnimation() {
    music.play();
  // стартуем за верхним краем, чуть левее центра
  tx = 60;
  ty = -80;
  vx = 1.2;   // лёгкий дрейф влево
  vy = 7;      // начальная скорость падения
  state = 'animating';
}
 
function updatePhysics() {
    vy += GRAVITY;
    tx += vx;
    ty += vy;
    
    if (ty >= FLOOR) {
        ty  = FLOOR;
        vy *= -BOUNCE;
        vx *= FRICTION;
 
        if (abs(vy) < STOP_VY) {
            vy    = 0;
            vx    = 0;
            state = 'done';
            doorAnimTimer = frameRate() * 20; // 20 секунд в кадрах
            gif2Moving = true;
            dominoScale = 0;
            dominoAngle = TWO_PI * 20; // 3 полных оборота до остановки
            dominoAppearing = true;
        }
  }
}
 
function drawMessage() {
  noStroke();
  fill(0);
  textFont(font);
  textSize(66);
  textAlign(LEFT, BASELINE);
  text('с днем рождения, дурашка!', tx, ty);
}

function drawAuthor() {
  noStroke();
  fill(0);
  textFont(button_font);
  textSize(14);
  textAlign(LEFT, BASELINE);
  text('От Кхлулхлу', 20, height - 10);
}
// ─── gif1 ──────────────────────────────────────────────────────────────────

function drawGif() {
  if (gifAlpha < 255) gifAlpha = min(gifAlpha + FADE_SPEED, 255);

  let gifW = 200;//gif.width;
  let gifH = 200;//gif.height;
  let gifX = -10;                 // у левого края
  let gifY = ty - gifH - 20;    // чуть выше текста

  tint(255, gifAlpha);
  image(gif, gifX, gifY, gifW, gifH);
  noTint();
}

// ─── gif2 ──────────────────────────────────────────────────────────────────

function drawGif2() {
  if (!gif2Moving) return;

  let gifW = gif2.width;
  let gifH = gif2.height;


  // финальная позиция — у правого края
  gif2TargetX = width - gifW - 10;

  // едет влево пока не доехал
  if (gif2X > gif2TargetX) {
    gif2X = max(gif2X - SLIDE_SPEED, gif2TargetX);
  }

  let gifY = ty - gifH - 20; // чуть выше текста, как первый GIF

  image(gif2, gif2X, gifY, gifW, gifH);
}

// ─── mikuDance dominoDance ───────────────────────────────────────────────────────

function drawGif4() {

  let gifW = mikuDance.width;
  let gifH = mikuDance.height;

  let gifX = width - gifW;
  let gifY = 0;

  let AgifW = dominoDance.width;
  let BgifH = dominoDance.height;

  let AgifX = width - AgifW + 100;
  let BgifY = -100;

  blendMode(MULTIPLY);
  image(dominoDance, AgifX, BgifY, AgifW, BgifH);
  image(mikuDance, gifX, gifY, gifW, gifH);
  blendMode(BLEND); // возвращаем стандартный режим
}

// ─── domino ────────────────────────────────────────────────────────────────

function drawDomino() {
  if (!dominoAppearing) return;

    let maxW = 200;
    let ratio = domino.height / domino.width;

    if (dominoScale < 1) {
        dominoScale = min(dominoScale + DOMINO_SCALE_SPEED, 1);
        dominoAngle += DOMINO_SPIN_SPEED; // непрерывное вращение
    } else {
        dominoAngle = lerp(dominoAngle, 0, 0.04); // выравнивание к 0

        if (abs(dominoAngle) < 0.01) {
            dominoAngle = 0;
            dominoDone  = true;  // ← крутиться закончил
        }
    }

    let imgH = maxW * ratio;
    

  let cx = width / 2;
  let cy = ty - imgH * 0.5 - 30; // центр чуть выше текста

  push();
    translate(cx, cy);
    rotate(dominoAngle);
    scale(dominoScale);
    imageMode(CENTER);
    image(domino, 0, 0, maxW, maxW * ratio);
    imageMode(CORNER); // возвращаем дефолт чтобы не сломать остальное
  pop();
}

// particles

function spawnParticle(particleSize) {
  let cx = width / 2;
  let cy = ty - (particleSize * (domino.height / domino.width)) * 0.5 - 30;

  let angle = random(TWO_PI);
  let speed = random(3, 10);

  particles.push({
    x:    cx,
    y:    cy,
    vx:   cos(angle) * speed,
    vy:   sin(angle) * speed,
    size: particleSize,
    rot:  random(TWO_PI)
  });
}

function drawParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    let p = particles[i];

    p.x   += p.vx;
    p.y   += p.vy;
    p.rot += 0.05;

    // удаляем только когда вышла за canvas
    if (p.x < -100 || p.x > width + 100 ||
        p.y < -100 || p.y > height + 100) {
      particles.splice(i, 1);
      continue;
    }

    push();
      translate(p.x, p.y);
      rotate(dominoAngle);
      scale(dominoScale)
      imageMode(CENTER);
      image(dominoHead, 0, 0, p.size, p.size * (domino.height / domino.width));
      imageMode(CORNER);
    pop();
  }
}
 
// ─── ввод ──────────────────────────────────────────────────────────────────
 
function mousePressed() {
    // кнопка старта
  if (state === 'waiting') {
    if (dist(mouseX, mouseY, btn.x, btn.y) < btn.r) {
      startAnimation();
    }
    return;
  }

  // клик по двери
  if (state === 'knocking') {
    if (mouseX > zoneX && mouseX < zoneX + zoneW &&
        mouseY > zoneY && mouseY < zoneY + zoneH) {
      knockParticles = [];
      state = 'opening';
      openDoorAnim.play();
    }
  }

  // открыть по клику на дверь в состоянии openDone
if (state === 'openDone') {
  if (mouseX > DOOR_X && mouseX < DOOR_X + doorW &&
      mouseY > DOOR_Y && mouseY < DOOR_Y + doorH) {
    plateOpen = true;
  }
}

// закрыть по клику на крестик или вне картинки
if (plateOpen) {
  let imgW = width  * 0.75;
  let imgH = height * 0.75;
  let imgX = (width  - imgW) / 2;
  let imgY = (height - imgH) / 2;

  let btnSize = 30;
  let btnX = imgX + imgW - btnSize / 2;
  let btnY = imgY - btnSize / 2;

  // клик на крестик
  if (dist(mouseX, mouseY, btnX, btnY) < btnSize / 2) {
    plateOpen = false;
  }
  // клик вне картинки
  if (mouseX < imgX || mouseX > imgX + imgW ||
      mouseY < imgY || mouseY > imgY + imgH) {
    plateOpen = false;
  }
}

}