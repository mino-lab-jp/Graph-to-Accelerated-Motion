
let points = [];
let tNow = 0;
let playing = false;

let speedSlider;
let playBtn, resetBtn, clearBtn;

const TMAX = 10;
const VMAX = 10;
const AMAX_MIN = 2;

// グラフと運動表示の位置
let gv = { x: 75, y: 85, w: 600, h: 210 };
let ga = { x: 75, y: 370, w: 600, h: 180 };
let motion = { x: 75, y: 660, w: 600 };

function setup() {
  createCanvas(750, 810);
  textFont("Arial");

  playBtn = createButton("▶ 再生");
  playBtn.position(75, 12);
  playBtn.mousePressed(() => {
    if (points.length < 2) return;

    if (tNow >= points[points.length - 1].t) {
      tNow = points[0].t;
    }

    playing = !playing;
    playBtn.html(playing ? "⏸ 一時停止" : "▶ 再生");
  });

  resetBtn = createButton("最初に戻る");
  resetBtn.position(175, 12);
  resetBtn.mousePressed(() => {
    playing = false;
    tNow = points.length ? points[0].t : 0;
    playBtn.html("▶ 再生");
  });

  clearBtn = createButton("点をすべて消す");
  clearBtn.position(290, 12);
  clearBtn.mousePressed(() => {
    points = [];
    tNow = 0;
    playing = false;
    playBtn.html("▶ 再生");
  });

  speedSlider = createSlider(0.2, 3, 1, 0.1);
  speedSlider.position(515, 15);
  speedSlider.size(120);

  // 初期点：時刻0、速度0
  points.push({ t: 0, v: 0 });
}

function draw() {
  background(250);

  noStroke();
  fill(30);
  textSize(13);
  text("再生速度", 450, 29);
  text(speedSlider.value().toFixed(1) + "倍", 645, 29);

  if (playing && points.length >= 2) {
    tNow += deltaTime / 1000 * speedSlider.value();

    if (tNow >= points[points.length - 1].t) {
      tNow = points[points.length - 1].t;
      playing = false;
      playBtn.html("▶ 再生");
    }
  }

  drawVT();
  drawAT();
  drawMotion();
  drawInfo();
}

// 時刻を画面上のX座標に変換
function px(t, g) {
  return g.x + t / TMAX * g.w;
}

// 速度を画面上のY座標に変換
function pyV(v) {
  return gv.y + gv.h / 2
       - v / VMAX * gv.h / 2;
}

// 加速度を画面上のY座標に変換
function pyA(a, amax) {
  return ga.y + ga.h / 2
       - a / amax * ga.h / 2;
}

// v-t グラフ
function drawVT() {
  drawGrid(gv, -VMAX, VMAX,
           "速度 v (m/s)", "時間 t (s)");

  stroke(25, 100, 230);
  strokeWeight(3);
  noFill();

  beginShape();
  for (let p of points) {
    vertex(px(p.t, gv), pyV(p.v));
  }
  endShape();

  // クリックした点
  for (let p of points) {
    fill(25, 100, 230);
    stroke(255);
    strokeWeight(1.5);
    circle(px(p.t, gv), pyV(p.v), 11);
  }

  // 現在時刻の表示
  if (points.length >= 2) {
    let v = velocityAt(tNow);

    stroke(220, 60, 60);
    strokeWeight(1.5);

    drawingContext.setLineDash([5, 5]);
    line(px(tNow, gv), gv.y,
         px(tNow, gv), gv.y + gv.h);
    drawingContext.setLineDash([]);

    fill(230, 40, 40);
    noStroke();
    circle(px(tNow, gv), pyV(v), 13);
  }

  noStroke();
  fill(40);
  textSize(13);
  text("① クリックして速度と時刻を指定（左から右へ）",
       75, 62);
}

// a-t グラフ
function drawAT() {
  let accelerations = [];

  for (let i = 0; i < points.length - 1; i++) {
    let p1 = points[i];
    let p2 = points[i + 1];

    let a = (p2.v - p1.v) / (p2.t - p1.t);
    accelerations.push(a);
  }

  let amax = AMAX_MIN;

  for (let a of accelerations) {
    amax = max(amax, abs(a) * 1.2);
  }

  drawGrid(ga, -amax, amax,
           "加速度 a (m/s²)", "時間 t (s)");

  // 区間ごとに一定の加速度
  for (let i = 0; i < accelerations.length; i++) {
    let a = accelerations[i];

    let x1 = px(points[i].t, ga);
    let x2 = px(points[i + 1].t, ga);
    let y = pyA(a, amax);

    stroke(20, 155, 90);
    strokeWeight(4);
    line(x1, y, x2, y);

    // 加速度の変化を破線で表示
    if (i > 0) {
      stroke(130);
      strokeWeight(1);

      drawingContext.setLineDash([3, 4]);
      line(x1,
           pyA(accelerations[i - 1], amax),
           x1, y);
      drawingContext.setLineDash([]);
    }
  }

  if (points.length >= 2) {
    let a = accelerationAt(tNow);

    stroke(220, 60, 60);
    strokeWeight(1.5);

    drawingContext.setLineDash([5, 5]);
    line(px(tNow, ga), ga.y,
         px(tNow, ga), ga.y + ga.h);
    drawingContext.setLineDash([]);

    fill(230, 40, 40);
    noStroke();
    circle(px(tNow, ga), pyA(a, amax), 12);
  }

  noStroke();
  fill(40);
  textSize(13);
  text("② v-t グラフの傾きから加速度を自動計算",
       75, 347);
}

// グラフの目盛りと軸
function drawGrid(g, minVal, maxVal, ylabel, xlabel) {
  fill(255);
  stroke(170);
  strokeWeight(1);
  rect(g.x, g.y, g.w, g.h);

  textSize(11);
  textAlign(CENTER, TOP);

  for (let i = 0; i <= 10; i++) {
    let x = g.x + g.w * i / 10;

    stroke(225);
    line(x, g.y, x, g.y + g.h);

    noStroke();
    fill(60);
    text(i, x, g.y + g.h + 5);
  }

  textAlign(RIGHT, CENTER);

  for (let i = 0; i <= 4; i++) {
    let val = maxVal - (maxVal - minVal) * i / 4;
    let y = g.y + g.h * i / 4;

    stroke(225);
    line(g.x, y, g.x + g.w, y);

    noStroke();
    fill(60);
    text(val.toFixed(1), g.x - 7, y);
  }

  stroke(70);
  strokeWeight(1.5);
  line(g.x, g.y + g.h / 2,
       g.x + g.w, g.y + g.h / 2);

  noStroke();
  fill(30);

  textAlign(LEFT, CENTER);
  textSize(13);
  text(ylabel, g.x, g.y - 12);

  textAlign(RIGHT, CENTER);
  text(xlabel, g.x + g.w, g.y + g.h + 35);

  textAlign(LEFT, BASELINE);
}

// 時刻tにおける速度（線形補間）
function velocityAt(t) {
  if (points.length === 0) return 0;

  if (t <= points[0].t) {
    return points[0].v;
  }

  for (let i = 0; i < points.length - 1; i++) {
    let p1 = points[i];
    let p2 = points[i + 1];

    if (t <= p2.t) {
      let f = (t - p1.t) / (p2.t - p1.t);
      return lerp(p1.v, p2.v, f);
    }
  }

  return points[points.length - 1].v;
}

// 時刻tにおける加速度
function accelerationAt(t) {
  if (points.length < 2) return 0;

  for (let i = 0; i < points.length - 1; i++) {
    let p1 = points[i];
    let p2 = points[i + 1];

    if (t < p2.t || i === points.length - 2) {
      return (p2.v - p1.v) / (p2.t - p1.t);
    }
  }

  return 0;
}

// 速度を積分して位置を計算
function positionAt(t) {
  let x = 0;

  if (points.length < 2) return x;

  for (let i = 0; i < points.length - 1; i++) {
    let p1 = points[i];
    let p2 = points[i + 1];

    if (t <= p1.t) break;

    let dt = min(t, p2.t) - p1.t;
    let a = (p2.v - p1.v) / (p2.t - p1.t);

    // x = x0 + v0*dt + (1/2)*a*dt²
    x += p1.v * dt + 0.5 * a * dt * dt;

    if (t <= p2.t) break;
  }

  return x;
}

// 物体の1次元運動
function drawMotion() {
  noStroke();
  fill(30);
  textSize(14);
  text("③ 1次元の物体の運動", 75, 625);

  let y = motion.y + 40;

  // 全移動範囲を計算し、画面内に収める
  let minX = 0;
  let maxX = 0;
  let totalX = 0;

  for (let i = 0; i < points.length - 1; i++) {
    let p1 = points[i];
    let p2 = points[i + 1];
    let dt = p2.t - p1.t;
    let a = (p2.v - p1.v) / dt;

    minX = min(minX, totalX);
    maxX = max(maxX, totalX);

    // 区間内で速度0となる位置も確認
    if (abs(a) > 1e-10) {
      let tz = -p1.v / a;
      if (tz > 0 && tz < dt) {
        let xt = totalX + p1.v * tz
                 + 0.5 * a * tz * tz;
        minX = min(minX, xt);
        maxX = max(maxX, xt);
      }
    }

    totalX += (p1.v + p2.v) * dt / 2;
    minX = min(minX, totalX);
    maxX = max(maxX, totalX);
  }

  let range = max(20, maxX - minX);
  let center = (maxX + minX) / 2;

  let left = center - range * 0.6;
  let right = center + range * 0.6;

  // 運動の軸
  stroke(80);
  strokeWeight(2);
  line(motion.x, y, motion.x + motion.w, y);

  for (let i = 0; i <= 10; i++) {
    let value = left + (right - left) * i / 10;
    let xx = motion.x + motion.w * i / 10;

    stroke(100);
    line(xx, y - 6, xx, y + 6);

    noStroke();
    fill(50);
    textSize(10);
    textAlign(CENTER);
    text(value.toFixed(1), xx, y + 22);
  }

  let x = positionAt(tNow);
  let bx = motion.x +
           (x - left) / (right - left) * motion.w;

  // ボール
  fill(240, 110, 30);
  stroke(160, 70, 20);
  strokeWeight(2);
  circle(bx, y - 20, 30);

  textAlign(LEFT);
  noStroke();
  fill(40);
  textSize(12);
  text("位置 x (m)", 75, y - 48);
}

// 数値情報
function drawInfo() {
  let x = positionAt(tNow);
  let v = velocityAt(tNow);
  let a = accelerationAt(tNow);

  noStroke();
  fill(20);
  textSize(15);

  text(
    "時刻 t = " + tNow.toFixed(2) + " s" +
    "    位置 x = " + x.toFixed(2) + " m",
    75, 770
  );

  text(
    "速度 v = " + v.toFixed(2) + " m/s" +
    "    加速度 a = " + a.toFixed(2) + " m/s²",
    75, 795
  );
}

// マウスで v-t グラフに点を追加
function mousePressed() {
  if (mouseX < gv.x || mouseX > gv.x + gv.w ||
      mouseY < gv.y || mouseY > gv.y + gv.h) {
    return;
  }

  let t = (mouseX - gv.x) / gv.w * TMAX;
  let v = (gv.y + gv.h / 2 - mouseY) /
          (gv.h / 2) * VMAX;

  // 時刻は増加する順番のみ
  if (points.length > 0 &&
      t <= points[points.length - 1].t + 0.05) {
    return;
  }

  points.push({ t: t, v: v });

  playing = false;
  tNow = points[0].t;
  playBtn.html("▶ 再生");
}
