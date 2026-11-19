/**
 * Phys3B1B: Composable 3Blue1Brown-style physics drawing primitives.
 */
(function (global) {
  const P = global.PALETTE_3B1B;

  function drawLabelPill(ctx, text, x, y, color = P.text, font = "600 13px Inter, 'PingFang SC', sans-serif") {
    ctx.save();
    ctx.font = font;
    const m = ctx.measureText(text);
    const padX = 8;
    const h = 22;
    const w = m.width + padX * 2;
    ctx.fillStyle = P.pillBg;
    ctx.beginPath();
    ctx.roundRect(x - w / 2, y - h / 2, w, h, 6);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  function drawGround(ctx, x1, y, x2, label = "") {
    ctx.save();
    ctx.strokeStyle = "rgba(236, 239, 244, 0.55)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x1, y);
    ctx.lineTo(x2, y);
    ctx.stroke();

    ctx.strokeStyle = "rgba(236, 239, 244, 0.22)";
    ctx.lineWidth = 1;
    for (let x = x1 + 8; x < x2; x += 14) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - 7, y + 8);
      ctx.stroke();
    }
    if (label) {
      drawLabelPill(ctx, label, x2 - 42, y + 20, P.muted, "500 12px 'PingFang SC', sans-serif");
    }
    ctx.restore();
  }

  function drawBlock(ctx, x, y, w, h, color = P.blue, label = "", glow = true) {
    ctx.save();
    if (glow) {
      ctx.shadowColor = color;
      ctx.shadowBlur = 14;
    }
    ctx.fillStyle = color + "26";
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 5);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
    if (label) {
      ctx.fillStyle = P.text;
      ctx.font = "700 14px Inter, 'PingFang SC', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(label, x + w / 2, y + h / 2);
    }
    ctx.restore();
  }

  function drawVector(ctx, x, y, dx, dy, color = P.gold, label = "", progress = 1) {
    const px = x + dx * progress;
    const py = y + dy * progress;
    const len = Math.hypot(px - x, py - y);
    if (len < 2) return;
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 2.6;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(px, py);
    ctx.stroke();

    const angle = Math.atan2(py - y, px - x);
    const head = Math.min(11, Math.max(6, len * 0.25));
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px - head * Math.cos(angle - 0.42), py - head * Math.sin(angle - 0.42));
    ctx.lineTo(px - head * Math.cos(angle + 0.42), py - head * Math.sin(angle + 0.42));
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;

    if (label && progress > 0.35) {
      const nx = px + 16 * Math.cos(angle);
      const ny = py + 16 * Math.sin(angle) - (Math.abs(dy) < 5 ? 14 : 0);
      drawLabelPill(ctx, label, nx, ny, color);
    }
    ctx.restore();
  }

  function drawBField(ctx, x, y, w, h, intoPage = true, spacing = 36) {
    ctx.save();
    ctx.strokeStyle = "rgba(88, 196, 221, 0.35)";
    ctx.setLineDash([6, 5]);
    ctx.strokeRect(x, y, w, h);
    ctx.setLineDash([]);
    ctx.strokeStyle = "rgba(88, 196, 221, 0.55)";
    ctx.fillStyle = "rgba(88, 196, 221, 0.65)";
    ctx.lineWidth = 1.5;
    for (let cx = x + spacing / 2; cx < x + w - 8; cx += spacing) {
      for (let cy = y + spacing / 2; cy < y + h - 8; cy += spacing) {
        if (intoPage) {
          ctx.beginPath();
          ctx.moveTo(cx - 5, cy - 5);
          ctx.lineTo(cx + 5, cy + 5);
          ctx.moveTo(cx + 5, cy - 5);
          ctx.lineTo(cx - 5, cy + 5);
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.arc(cx, cy, 2.6, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    ctx.restore();
  }

  function drawVTGraph(ctx, rect, seriesList, tCur, tMax, opts = {}) {
    const { x: gx, y: gy, w: gw, h: gh } = rect;
    const padL = 44, padR = 18, padT = 24, padB = 30;
    const pw = gw - padL - padR;
    const ph = gh - padT - padB;
    const ox = gx + padL;
    const oy = gy + padT + ph;

    let vMin = opts.vMin ?? 0;
    let vMax = opts.vMax ?? 1;
    seriesList.forEach((s) => {
      s.points.forEach((pt) => {
        if (pt.v < vMin) vMin = pt.v;
        if (pt.v > vMax) vMax = pt.v;
      });
    });
    if (vMax - vMin < 1e-6) vMax = vMin + 1;
    const mapX = (t) => ox + (t / Math.max(tMax, 1e-6)) * pw;
    const mapY = (v) => oy - ((v - vMin) / (vMax - vMin)) * ph;
    const yZero = mapY(0);

    ctx.save();
    ctx.fillStyle = "rgba(18, 23, 42, 0.78)";
    ctx.strokeStyle = "rgba(88, 196, 221, 0.22)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.roundRect(gx, gy, gw, gh, 10);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = "rgba(236, 239, 244, 0.45)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(ox, gy + padT);
    ctx.lineTo(ox, oy);
    ctx.moveTo(ox, yZero);
    ctx.lineTo(ox + pw, yZero);
    ctx.stroke();

    ctx.fillStyle = P.muted;
    ctx.font = "600 12px Inter, sans-serif";
    ctx.fillText(opts.yLabel || "v (m/s)", ox - 34, gy + padT + 4);
    ctx.fillText("t (s)", ox + pw - 22, yZero + 18);

    if (opts.shadeBetween && seriesList.length >= 2) {
      const s0 = seriesList[0].points.filter((p) => p.t <= tCur + 1e-6);
      const s1 = seriesList[1].points.filter((p) => p.t <= tCur + 1e-6);
      if (s0.length > 1 && s1.length > 1) {
        ctx.fillStyle = "rgba(244, 208, 63, 0.16)";
        ctx.beginPath();
        s0.forEach((p, idx) => (idx === 0 ? ctx.moveTo(mapX(p.t), mapY(p.v)) : ctx.lineTo(mapX(p.t), mapY(p.v))));
        for (let i = s1.length - 1; i >= 0; i--) {
          ctx.lineTo(mapX(s1[i].t), mapY(s1[i].v));
        }
        ctx.closePath();
        ctx.fill();
      }
    }

    seriesList.forEach((s) => {
      const pts = s.points.filter((p) => p.t <= tCur + 1e-6);
      if (pts.length < 1) return;
      ctx.save();
      ctx.shadowColor = s.color;
      ctx.shadowBlur = 8;
      ctx.strokeStyle = s.color;
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      pts.forEach((p, idx) => {
        const cx = mapX(p.t);
        const cy = mapY(p.v);
        if (idx === 0) ctx.moveTo(cx, cy);
        else ctx.lineTo(cx, cy);
      });
      ctx.stroke();
      const last = pts[pts.length - 1];
      ctx.fillStyle = s.color;
      ctx.beginPath();
      ctx.arc(mapX(last.t), mapY(last.v), 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    if (opts.markers) {
      opts.markers.forEach((m) => {
        if (m.t <= tCur + 1e-6 && m.t >= 0) {
          const mx = mapX(m.t);
          ctx.save();
          ctx.strokeStyle = m.color || P.gold;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(mx, gy + padT);
          ctx.lineTo(mx, oy);
          ctx.stroke();
          ctx.setLineDash([]);
          drawLabelPill(ctx, m.label, mx, gy + padT + 12, m.color || P.gold, "600 11px 'PingFang SC', sans-serif");
          ctx.restore();
        }
      });
    }
    ctx.restore();
  }

  global.Phys3B1B = {
    drawLabelPill,
    drawGround,
    drawBlock,
    drawVector,
    drawBField,
    drawVTGraph,
  };
})(window);
