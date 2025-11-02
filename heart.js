// Cleaned and corrected heart animation script

// requestAnimationFrame polyfill
window.requestAnimationFrame = window.requestAnimationFrame ||
  window.webkitRequestAnimationFrame ||
  window.mozRequestAnimationFrame ||
  window.oRequestAnimationFrame ||
  window.msRequestAnimationFrame ||
  function (cb) { return window.setTimeout(cb, 1000 / 60); };

window.isDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
  (navigator.userAgent || navigator.vendor || window.opera || '').toLowerCase()
);

var loaded = false;

var init = function () {
  if (loaded) return;
  loaded = true;

  var mobile = window.isDevice;
  var koef = mobile ? 0.5 : 1;

  var canvas = document.getElementById('heart');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');

  var width = (canvas.width = koef * window.innerWidth);
  var height = (canvas.height = koef * window.innerHeight);
  var rand = Math.random;

  // set blending for nicer glow
  ctx.globalCompositeOperation = 'lighter';

  ctx.fillStyle = 'rgba(0,0,0,1)';
  ctx.fillRect(0, 0, width, height);

  var heartPosition = function (rad) {
    return [
      Math.pow(Math.sin(rad), 3),
      -(15 * Math.cos(rad) - 5 * Math.cos(2 * rad) - 2 * Math.cos(3 * rad) - Math.cos(4 * rad)) / 16
    ];
  };

  var scaleAndTranslate = function (pos, sx, sy, dx, dy) {
    return [dx + pos[0] * sx, dy + pos[1] * sy];
  };

  var resize = function () {
    width = canvas.width = koef * window.innerWidth;
    height = canvas.height = koef * window.innerHeight;
    // clear fully on resize
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = 'rgba(0,0,0,1)';
    ctx.fillRect(0, 0, width, height);
    ctx.globalCompositeOperation = 'lighter';
  };

  window.addEventListener('resize', function () {
    resize();
  });

  // Create normalized heart points (unscaled) so we can scale dynamically
  var pointsOrigin = [];
  var dr = mobile ? 0.2 : 0.08;
  for (var i = 0; i < Math.PI * 2; i += dr) {
    pointsOrigin.push(heartPosition(i)); // store normalized coordinates
  }

  var heartPointsCount = pointsOrigin.length;
  var targetPoints = new Array(heartPointsCount);

  // pulse will scale points according to current canvas size
  var pulse = function (kx, ky) {
    var baseScale = Math.min(width, height) * 0.28; // controls overall heart size
    for (var j = 0; j < pointsOrigin.length; j++) {
      targetPoints[j] = [
        width / 2 + kx * pointsOrigin[j][0] * baseScale,
        height / 2 + ky * pointsOrigin[j][1] * baseScale
      ];
    }
  };

  // particles
  var particles = [];
  var traceCount = mobile ? 20 : 40;
  for (i = 0; i < heartPointsCount; i++) {
    var x = rand() * width;
    var y = rand() * height;
    var color = 'hsla(350,' + ~~(25 * rand() + 75) + '%,' + ~~(30 * rand() + 40) + '%,.85)';
    var p = {
      x: x,
      y: y,
      vx: 0,
      vy: 0,
      speed: rand() * 2 + (mobile ? 1.2 : 2.2),
      q: ~~(rand() * heartPointsCount),
      D: rand() > 0.5 ? 1 : -1,
      force: 0.85 + 0.1 * rand(),
      f: color,
      trace: []
    };
    for (var k = 0; k < traceCount; k++) {
      p.trace.push({ x: x, y: y });
    }
    particles.push(p);
  }

  var config = {
    tracek: 0.35,
    timeDelta: 0.01
  };

  var time = 0;
  var particleSize = mobile ? 1 : 2;

  var loop = function () {
    var n = -Math.cos(time);
    pulse((1 + n) * 0.56, (1 + n) * 0.56); // slightly bigger multiplier for better fill
    time += (Math.sin(time) < 0 ? 8 : (n > 0.8 ? 0.25 : 1)) * config.timeDelta;

    // light fade for cleaner trails
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = 'rgba(0,0,0,0.08)';
    ctx.fillRect(0, 0, width, height);
    ctx.globalCompositeOperation = 'lighter';

    for (i = 0; i < particles.length; i++) {
      var u = particles[i];
      var qIndex = u.q % heartPointsCount;
      if (qIndex < 0) qIndex += heartPointsCount;
      var q = targetPoints[qIndex] || [width / 2, height / 2];

      var dx = u.trace[0].x - q[0];
      var dy = u.trace[0].y - q[1];
      var len = Math.sqrt(dx * dx + dy * dy) || 1;

      if (len < 10) {
        if (rand() > 0.96) {
          u.q = ~~(rand() * heartPointsCount);
        } else {
          if (rand() > 0.995) u.D *= -1;
          u.q += u.D;
        }
      }

      u.vx += (-dx / len) * u.speed;
      u.vy += (-dy / len) * u.speed;

      u.trace[0].x += u.vx;
      u.trace[0].y += u.vy;

      u.vx *= u.force;
      u.vy *= u.force;

      // smooth trace
      for (k = 0; k < u.trace.length - 1; k++) {
        var T = u.trace[k];
        var N = u.trace[k + 1];
        N.x -= config.tracek * (N.x - T.x);
        N.y -= config.tracek * (N.y - T.y);
      }

      // draw trace with slightly larger dots for visibility
      ctx.fillStyle = u.f;
      for (k = 0; k < u.trace.length; k++) {
        ctx.fillRect(u.trace[k].x, u.trace[k].y, particleSize, particleSize);
      }
    }

    window.requestAnimationFrame(loop);
  };

  // initial clear + start
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = 'rgba(0,0,0,1)';
  ctx.fillRect(0, 0, width, height);
  ctx.globalCompositeOperation = 'lighter';

  loop();
};

var s = document.readyState;
if (s === 'complete' || s === 'loaded' || s === 'interactive') init();
else document.addEventListener('DOMContentLoaded', init, false);