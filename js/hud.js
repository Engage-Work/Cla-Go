'use strict';
// ======================================================================
//  hud.js - tactical shooter HUD: crosshair, radar, health/armor, ammo, kill feed,
//             hit direction, scoreboard, buy menu (real OS cursor), net graph
// ======================================================================
const _hv = new THREE.Vector3(), _hd = new THREE.Vector3(), _he = new THREE.Vector3();
const HUD = (() => {
  const E = {};
  let crossKey = '', radarT = 0, game = null;
  const cache = {};
  const feed = [];
  let buyOpen = false, buyCat = -1, buyCats = [];
  let centerT = 0, hitT = 0, introLive = -1;

  function setText(id, v) { if (cache[id] !== v) { cache[id] = v; E[id].textContent = v; } }
  function setHTML(id, v) { if (cache['h' + id] !== v) { cache['h' + id] = v; E[id].innerHTML = v; } }
  function show(id, on) { const k = 's' + id; if (cache[k] !== on) { cache[k] = on; E[id].classList.toggle('hidden', !on); } }

  const api = {
    init() {
      for (const id of ['hud', 'crosshair', 'scope', 'hitmarker', 'dmgdir', 'radar', 'radarLabel', 'money', 'buyhint', 'aliveCT', 'aliveT', 'scoreCT', 'scoreT',
        'timer', 'bombIcon', 'killfeed', 'center', 'subcenter', 'hpbox', 'hp', 'armor', 'hpbar', 'armorbar', 'armorIco', 'weaponbar', 'wname', 'mag', 'reserve',
        'progress', 'progressLabel', 'progressBar', 'netgraph', 'deathinfo', 'spectate', 'scoreboard', 'buymenu', 'tags', 'intro']) E[id] = $(id);
      E.tctx = E.tags.getContext('2d');
      E.rctx = E.radar.getContext('2d');
      E.cctx = E.crosshair.getContext('2d');
      // The menu is re-rendered when its state changes, so buy on press: a click whose mousedown and
      // mouseup land on different nodes would be lost
      E.buymenu.addEventListener('pointerdown', (e) => {
        if (!buyOpen || !game || e.button !== 0) return;
        const it = e.target.closest && e.target.closest('[data-buy]');
        if (it) { e.preventDefault(); game.buy(game.player, it.dataset.buy, true); }
      });
      // Close on click (after mouseup) so the press that closes the menu can never reach the gun
      E.buymenu.addEventListener('click', (e) => { if (buyOpen && e.target.closest && e.target.closest('[data-close]')) api.closeBuy(true); });
    },
    bind(g) { game = g; feed.length = 0; E.killfeed.innerHTML = ''; for (const k in cache) delete cache[k]; crossKey = ''; api.closeBuy(false); api.hideIntro(true); },

    // First-match hint: your side, the objective and the keys. Stays through freeze time, then fades a
    // few seconds into the round (or on H). Shown once per browser.
    showIntro(g) {
      const P = g.player, md = g.mode, S = Settings.data, ct = P.team === 'CT';
      const obj = md.id === 'comp'
        ? (ct ? 'Stop the attackers from planting the C4 at site A or B. If they plant it, defuse it with <kbd>E</kbd>. Or eliminate them all.'
          : 'Plant the C4 at site A or B (stand on the site with the bomb and hold <kbd>E</kbd>), then protect it until it explodes. Or eliminate the defenders.')
        : md.id === 'tdm' ? `Respawn and fight: the first team to ${md.limit} kills wins.`
        : 'Practice on the targets. Ammo is unlimited and buying is free.';
      const k = (keys, what) => `<span>${keys.map((x) => `<kbd>${x}</kbd>`).join(' ')} ${what}</span>`;
      E.intro.innerHTML = `<div class="side ${ct ? 'cCT' : 'cT'}">You are ${md.id === 'range' ? 'on the range' : ct ? 'a Defender' : 'an Attacker'}</div><div class="obj">${obj}</div>`
        + `<div class="keys">${k(['W', 'A', 'S', 'D'], 'Move')}${k(['Mouse'], 'Aim')}${k(['Click'], 'Fire')}${k(['R'], 'Reload')}${k(['Space'], 'Jump')}${k(['Ctrl'], 'Crouch')}${k(['Shift'], S.moveMode === 'sprint' ? 'Sprint' : 'Walk')}${k(['B'], 'Buy')}${k(['Tab'], 'Scores')}${k(['Esc'], 'Pause')}</div>`
        + '<div class="hide">Press <kbd>H</kbd> to hide</div>';
      E.intro.classList.remove('hidden', 'out');
      introLive = 0;
    },
    hideIntro(now) {
      if (introLive < 0) { if (now) E.intro.classList.add('hidden'); return; }
      introLive = -1;
      try { localStorage.setItem('sandstorm_seen_intro', '1'); } catch (e) { /* private mode */ }
      if (now) E.intro.classList.add('hidden');
      else { E.intro.classList.add('out'); setTimeout(() => { if (introLive < 0) E.intro.classList.add('hidden'); }, 600); }
    },
    introSeen() { try { return localStorage.getItem('sandstorm_seen_intro') === '1'; } catch (e) { return false; } },
    get buyOpen() { return buyOpen; },

    drawCrosshair(extra, hide) {
      const S = Settings.data;
      const key = [S.crossSize, S.crossGap, S.crossThick, S.crossColor, S.crossDot, S.crossOutline, Math.round(extra * 2), hide].join('|');
      if (key === crossKey) return;
      crossKey = key;
      const c = E.crosshair, g = E.cctx, dpr = Math.min(2, devicePixelRatio || 1);
      const size = S.crossSize, th = S.crossThick, gap = Math.max(0, S.crossGap + extra);
      const R = Math.ceil(gap + size + 4);
      c.width = c.height = Math.ceil(R * 2 * dpr);
      c.style.width = c.style.height = R * 2 + 'px';
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, R * 2, R * 2);
      if (hide) return;
      const cx = R, cy = R, h = th / 2;
      const rects = [];
      if (size > 0) {
        rects.push([cx - h, cy - gap - size, th, size], [cx - h, cy + gap, th, size], [cx - gap - size, cy - h, size, th], [cx + gap, cy - h, size, th]);
      }
      if (S.crossDot) rects.push([cx - h, cy - h, th, th]);
      if (S.crossOutline) { g.fillStyle = 'rgba(0,0,0,0.85)'; for (const r of rects) g.fillRect(r[0] - 1, r[1] - 1, r[2] + 2, r[3] + 2); }
      g.fillStyle = S.crossColor;
      for (const r of rects) g.fillRect(r[0], r[1], r[2], r[3]);
    },

    hitmarker(kill) {
      if (!Settings.data.hitmarker) return;
      E.hitmarker.classList.toggle('kill', !!kill);
      E.hitmarker.style.opacity = 1; hitT = kill ? 0.35 : 0.15;
    },
    damageFrom(angleRad) {
      const d = document.createElement('div'); d.className = 'arc';
      d.style.transform = `rotate(${angleRad}rad)`;
      E.dmgdir.appendChild(d);
      setTimeout(() => { d.style.opacity = 0; }, 700);
      setTimeout(() => d.remove(), 1000);
    },
    center(text, cls = '', dur = 3, sub = '') {
      E.center.className = cls; E.center.textContent = text; E.center.style.opacity = 1;
      E.subcenter.textContent = sub; E.subcenter.style.opacity = 1;
      centerT = dur;
    },
    killfeed(o) {
      const el = document.createElement('div');
      el.className = 'kf' + (o.mine ? ' mine' : '');
      const nm = (a) => a ? `<span class="c${a.team}">${a.name}</span>` : '';
      el.innerHTML = `${o.killer ? nm(o.killer) : ''}<span class="w">${o.weapon}</span>${o.wallbang ? '<span class="wb">WB</span>' : ''}${o.hs ? '<span class="hs">HS</span>' : ''}${nm(o.victim)}`;
      E.killfeed.prepend(el);
      feed.push({ el, t: o.mine ? 9 : 6 });
      while (E.killfeed.children.length > 6) E.killfeed.lastChild.remove();
    },
    moneyFlash() { E.money.classList.remove('flash'); void E.money.offsetWidth; E.money.classList.add('flash'); },

    // Friend/foe markers: teammates get a team-colored marker + name overhead; name turns red when the crosshair is on a visible enemy
    drawTags(g) {
      const c = E.tags, ctx = E.tctx, dpr = Math.min(2, devicePixelRatio || 1);
      const W = innerWidth, H = innerHeight;
      if (c.width !== Math.round(W * dpr) || c.height !== Math.round(H * dpr)) { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      const P = g.player, view = g.viewTarget || P, cam = g.camera;
      if (!P.alive && !g.spectating) return;
      const team = view.team, col = team === 'CT' ? '#6cb4ff' : '#ffbf4d';
      const v = _hv, eye = cam.position;
      ctx.textAlign = 'center'; ctx.font = '600 12px "Segoe UI", "Microsoft YaHei", sans-serif';
      for (const a of g.actors) {
        if (!a.alive || a === view || a.team !== team) continue;
        g.aimPoint(a, 'head', v); v.y += 0.32;
        const d = v.distanceTo(eye);
        v.project(cam);
        if (v.z > 1 || v.x < -1.1 || v.x > 1.1 || v.y < -1.1 || v.y > 1.1) continue;
        const x = (v.x * 0.5 + 0.5) * W, y = (-v.y * 0.5 + 0.5) * H;
        const al = clamp(1.25 - d / 45, 0.45, 1);
        ctx.globalAlpha = al;
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.beginPath(); ctx.moveTo(x - 7, y - 9); ctx.lineTo(x + 7, y - 9); ctx.lineTo(x, y + 1); ctx.closePath(); ctx.fill();
        ctx.fillStyle = col;
        ctx.beginPath(); ctx.moveTo(x - 5.5, y - 8); ctx.lineTo(x + 5.5, y - 8); ctx.lineTo(x, y - 0.5); ctx.closePath(); ctx.fill();
        if (d < 30) { ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillText(a.name, x + 1, y - 12); ctx.fillStyle = col; ctx.fillText(a.name, x, y - 13); }
      }
      ctx.globalAlpha = 1;
      // Enemy under the crosshair
      if (P.alive) {
        const f = dirFromAngles(P.yaw, P.pitch, _hd), e = P.eyePos(_he);
        const wh = g.world.raycast(e.x, e.y, e.z, f.x, f.y, f.z, 80, {});
        const ah = g.rayActors(e.x, e.y, e.z, f, wh ? wh.t : 80, new Set([P]));
        if (ah && ah.actor.team !== P.team && !Effects.smokeBlocks(e, _hv.copy(e).addScaledVector(f, ah.t))) {
          ctx.font = '700 13px "Segoe UI", "Microsoft YaHei", sans-serif';
          ctx.fillStyle = 'rgba(0,0,0,0.75)'; ctx.fillText('Enemy  ' + ah.actor.name, W / 2 + 1, H / 2 + 41);
          ctx.fillStyle = '#ff5a4a'; ctx.fillText('Enemy  ' + ah.actor.name, W / 2, H / 2 + 40);
        }
      }
    },

    update(dt, g) {
      const P = g.player, view = g.viewTarget || P;
      api.drawTags(g);
      // Timer
      if (centerT > 0) { centerT -= dt; if (centerT <= 0) { E.center.style.opacity = 0; E.subcenter.style.opacity = 0; } }
      if (hitT > 0) { hitT -= dt; if (hitT <= 0) E.hitmarker.style.opacity = 0; }
      if (introLive >= 0 && g.mode.phase === 'live') { introLive += dt; if (introLive > 7) api.hideIntro(); }
      for (let i = feed.length - 1; i >= 0; i--) { feed[i].t -= dt; if (feed[i].t <= 0) { feed[i].el.style.opacity = 0; const el = feed[i].el; setTimeout(() => el.remove(), 600); feed.splice(i, 1); } }

      // Health / armor
      const a = view;
      setText('hp', String(Math.max(0, Math.ceil(a.hp))));
      setText('armor', String(Math.ceil(a.armor)));
      E.hpbar.style.width = clamp(a.hp, 0, 100) + '%';
      E.armorbar.style.width = clamp(a.armor, 0, 100) + '%';
      setText('armorIco', a.helmet ? '⛑' : '⛉');
      E.hpbox.classList.toggle('low', a.hp <= 25);
      // Weapon
      const w = a.weapon, def = w ? w.def : null;
      setText('wname', def ? def.name : '');
      if (def && def.mag) {
        setText('mag', String(w.mag)); setText('reserve', '/ ' + (g.infiniteAmmo ? '∞' : w.reserve));
        E.mag.classList.toggle('low', w.mag <= Math.ceil(def.mag * 0.2));
      } else if (def && def.type === 'grenade') { setText('mag', String(a.inv.nades[def.id])); setText('reserve', ''); E.mag.classList.remove('low'); }
      else { setText('mag', '—'); setText('reserve', ''); E.mag.classList.remove('low'); }
      // Weapon bar
      const I = a.inv; const rows = [];
      const ws = (k, n, on) => `<div class="ws${on ? ' on' : ''}"><b>${k}</b>${n}</div>`;
      if (I.primary) rows.push(ws(1, I.primary.def.name, a.slot === 'primary'));
      if (I.secondary) rows.push(ws(2, I.secondary.def.name, a.slot === 'secondary'));
      rows.push(ws(3, I.knife.def.name, a.slot === 'knife'));
      const nd = GRENADE_ORDER.filter((k) => I.nades[k] > 0).map((k) => WEAPONS[k].short + (I.nades[k] > 1 ? '×' + I.nades[k] : '')).join(' ');
      if (nd) rows.push(ws(4, nd, a.slot === 'nade'));
      if (I.c4) rows.push(ws(5, 'C4', a.slot === 'c4'));
      if (I.defuser) rows.push(`<div class="ws"><b>✂</b>Defuse Kit</div>`);
      setHTML('weaponbar', rows.join(''));
      // Money / buy
      const md = g.mode;
      setText('money', md.infiniteMoney ? '$ ∞' : '$' + P.money);
      const canBuy = !!(md.canBuy && md.canBuy(P)) && !buyOpen;
      show('buyhint', canBuy);
      if (canBuy) setHTML('buyhint', '<kbd>B</kbd>Buy menu' + (md.buyTimeLeft ? ' · ' + fmtTime(md.buyTimeLeft()) : ''));
      // Top bar
      const tl = md.timeLeft != null ? md.timeLeft() : null;
      setText('timer', tl == null ? '--:--' : fmtTime(tl));
      E.timer.classList.toggle('low', tl != null && tl <= 10 && md.phase === 'live');
      setText('scoreCT', String(md.score ? md.score.CT : 0)); setText('scoreT', String(md.score ? md.score.T : 0));
      const alive = (t) => g.actors.filter((x) => x.team === t).map((x) => `<i class="${x.alive ? '' : 'dead'}"></i>`).join('');
      setHTML('aliveCT', alive('CT')); setHTML('aliveT', alive('T'));
      show('bombIcon', !!(md.bomb && md.bomb.planted && !md.bomb.exploded && !md.bomb.defused));
      // Crosshair
      const S = Settings.data;
      let extra = 0;
      if (S.crossStyle === 'dynamic' && a.alive) {
        const inacc = a.inaccuracy() / 1000;
        const px = Math.tan(inacc) / Math.tan(g.camera.fov * 0.5 * DEG) * innerHeight * 0.5;
        extra = Math.min(60, px * 0.6);
      }
      const hideX = !a.alive || (def && def.scope && !a.scoped) || (def && def.scope && a.scoped) || g.spectating;
      api.drawCrosshair(extra, hideX);
      show('scope', !!(a.alive && a.scoped && def && def.scope));
      // Progress bar (plant / defuse)
      let prog = null;
      if (a.planting) prog = ['Planting bomb…', a.plantT / 3.2];
      else if (a.defusing) prog = [a.inv.defuser ? 'Defusing bomb (kit)…' : 'Defusing bomb…', a.defuseT / (a.inv.defuser ? 5 : 10)];
      show('progress', !!prog);
      if (prog) { setText('progressLabel', prog[0]); E.progressBar.style.width = clamp(prog[1] * 100, 0, 100) + '%'; }
      // Net graph
      if (S.showFps) {
        const sp = Math.round(a.hspeed() / U);
        let s = `${g.fps.toFixed(0)} fps   ${sp} u/s`;
        if (g.client) s += g.net.rtt != null ? `   Ping ${g.net.rtt}ms` : '   Connecting…';
        if (md.id === 'range') s += `\nSpread ${a.inaccuracy().toFixed(1)} mrad\nRecoil index ${a.recoilIdx.toFixed(1)}\n${a.sliding ? 'Sliding' : a.sprinting ? 'Sprinting' : a.ducked ? 'Crouching' : a.onGround ? '' : 'Airborne'}`;
        setText('netgraph', s);
      } else setText('netgraph', '');
      // Radar
      radarT -= dt;
      if (radarT <= 0) { radarT = 1 / 30; api.drawRadar(g, a); }
      api.updateBuy(g);
    },

    drawRadar(g, a) {
      const c = E.rctx, W = 400, map = g.map;
      const ppm = 200 / 34, k = ppm / map.radarScale;
      const yaw = a.yaw, px = a.renderPos.x, pz = a.renderPos.z;
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.clearRect(0, 0, W, W);
      c.save(); c.translate(200, 200); c.rotate(yaw); c.scale(k, k);
      c.globalAlpha = 0.92;
      c.drawImage(map.radar, -(px - map.origin) * map.radarScale, -(pz - map.origin) * map.radarScale);
      c.restore();
      const cs = Math.cos(yaw), sn = Math.sin(yaw);
      const toS = (x, z) => { const rx = x - px, rz = z - pz; return [200 + (rx * cs - rz * sn) * ppm, 200 + (rx * sn + rz * cs) * ppm]; };
      const dot = (x, z, col, r, ring) => {
        let [sx, sy] = toS(x, z);
        const dx = sx - 200, dy = sy - 200, d = Math.hypot(dx, dy);
        if (d > 192) { sx = 200 + dx / d * 192; sy = 200 + dy / d * 192; r *= 0.75; }
        c.beginPath(); c.arc(sx, sy, r, 0, 7); c.fillStyle = col; c.fill();
        if (ring) { c.lineWidth = 2; c.strokeStyle = 'rgba(0,0,0,0.7)'; c.stroke(); }
      };
      const md = g.mode;
      if (md.bomb && (md.bomb.dropped || md.bomb.planted) && (g.player.team === 'T' || md.bomb.planted)) {
        const b = md.bomb.pos; const [sx, sy] = toS(b.x, b.z);
        c.fillStyle = md.bomb.planted ? '#ff3b30' : '#ffb43a'; c.fillRect(sx - 7, sy - 5, 14, 10);
        c.fillStyle = '#000'; c.font = 'bold 9px sans-serif'; c.textAlign = 'center'; c.fillText('C4', sx, sy + 3.5);
      }
      for (const o of g.actors) {
        if (o === a || !o.alive) continue;
        if (o.team === g.player.team) dot(o.renderPos.x, o.renderPos.z, o.team === 'CT' ? '#8ab8ff' : '#ffc94d', 7, true);
        else if (g.time - (o.spottedT || -9) < 0.6) dot(o.renderPos.x, o.renderPos.z, '#ff4a3d', 7, true);
      }
      // Self arrow
      c.beginPath(); c.moveTo(200, 189); c.lineTo(208, 208); c.lineTo(200, 203); c.lineTo(192, 208); c.closePath();
      c.fillStyle = '#ffffff'; c.fill(); c.lineWidth = 1.5; c.strokeStyle = '#000'; c.stroke();
      const area = api.areaName(g, a.pos);
      setText('radarLabel', area);
    },
    areaName(g, p) {
      const pts = g.map.points; let best = '', bd = 1e9;
      const names = { t_spawn: 'Attacker Spawn', ct_spawn: 'Defender Spawn', top_mid: 'Attacker Mid', mid: 'Mid', xbox: 'Mid Crates', mid_doors: 'Mid Doors', ct_mid: 'Defender Mid',
        outside_long: 'A Outside', long_doors: 'A Long Doors', long: 'A Long', long_corner: 'A Long Corner', a_ramp: 'A Ramp', a_site: 'A Site', a_short: 'A Short End', short: 'A Short', ct_to_a: 'Defender → A',
        upper_tunnel: 'B Outer', b_tunnel: 'B Tunnel', lower_tunnel: 'Sewers', b_exit: 'B Tunnel Exit', b_site: 'B Site', b_plat: 'B Platform', b_doors: 'B Doors', b_window: 'B Window' };
      for (const k in pts) { const d = pts[k].distanceToSquared(p); if (d < bd) { bd = d; best = names[k] || k; } }
      return best;
    },

    showDeath(text, sub) { E.deathinfo.innerHTML = text + (sub ? `<small>${sub}</small>` : ''); show('deathinfo', true); },
    hideDeath() { show('deathinfo', false); },
    spectate(text) { if (text) { setText('spectate', text); show('spectate', true); } else show('spectate', false); },

    scoreboard(on, g) {
      show('scoreboard', on);
      if (!on) return;
      const md = g.mode, P = g.player;
      const row = (a) => `<tr class="${a === P ? 'me' : ''} ${a.alive ? '' : 'dead'}"><td><span class="c${a.team}">${a.name}</span>${a.inv.c4 && a.team === P.team ? ' 💣' : ''}${a.inv.defuser && a.team === P.team ? ' ✂' : ''}</td><td class="n">${a.kills}</td><td class="n">${a.assists}</td><td class="n">${a.deaths}</td><td class="n">${'★'.repeat(Math.min(a.mvp, 5))}${a.mvp > 5 ? a.mvp : ''}</td><td class="n">${a.team === P.team && !md.infiniteMoney ? '$' + a.money : ''}</td><td class="n">${a.isBot ? 'BOT' : a.ping != null ? a.ping + 'ms' : g.net ? (a === P ? 'You' : 'Player') : 'Local'}</td></tr>`;
      const tbl = (t) => {
        const list = g.actors.filter((x) => x.team === t).sort((x, y) => y.kills - x.kills || x.deaths - y.deaths);
        return `<h3><span class="c${t}">${t === 'CT' ? 'Defenders' : 'Attackers'}</span><span class="c${t}">${md.score ? md.score[t] : ''}</span></h3><table><tr><th>Player</th><th class="n">Kills</th><th class="n">Assists</th><th class="n">Deaths</th><th class="n">MVP</th><th class="n">Money</th><th class="n">Ping</th></tr>${list.map(row).join('')}</table>`;
      };
      setHTML('scoreboard', `<div style="text-align:center;color:#a9a49a;font-size:13px;letter-spacing:2px;margin-bottom:6px">${md.title} · Sunscorch · Bot skill: ${DIFFS[g.opts.diff].label}</div>` + tbl('CT') + tbl('T'));
    },

    // ---------------- Buy menu ----------------
    // Built once per opening (only your side's items), then only classes and labels change, so the
    // nodes under the cursor stay put and clicks are never lost to a re-render.
    openBuy(g) {
      buyOpen = true; buyCat = -1;
      api.renderBuy(g);
      show('buymenu', true);
      Input.freeCursor();
    },
    // resume: the player is going back to the match (relock the pointer); otherwise it's a teardown
    closeBuy(resume) {
      if (!buyOpen && !Input.uiCursor) return;
      buyOpen = false; show('buymenu', false);
      Input.releaseCursor(!!resume);
    },
    renderBuy(g) {
      const P = g.player, md = g.mode;
      buyCats = BUY_MENU.map((cat) => ({ title: cat.title, items: cat.items.filter((id) => { const it = WEAPONS[id] || EQUIP[id]; return !it.team || it.team === P.team; }) }));
      const role = (id) => {
        const d = WEAPONS[id];
        if (!d) return id === 'defuser' ? 'Defuses the bomb in 5s instead of 10s' : id === 'helmet' ? 'Body armor and a helmet against headshots' : 'Body armor';
        if (d.type === 'grenade') return id === 'he' ? 'Explosive damage' : id === 'flash' ? 'Blinds anyone looking at it' : 'Blocks vision';
        return { pistol: 'Pistol', smg: 'SMG', rifle: 'Rifle', sniper: 'Sniper rifle' }[d.type] + ' · ' + d.mag + ' rounds';
      };
      const cols = buyCats.map((cat, ci) => `<div class="col" data-cat="${ci}"><h4><kbd>${ci + 1}</kbd>${cat.title}</h4>` + cat.items.map((id, ii) => {
        const it = WEAPONS[id] || EQUIP[id];
        return `<button class="it" tabindex="-1" data-buy="${id}"><kbd>${ii + 1}</kbd><span class="nm">${it.name}</span><span class="pr"></span><span class="rl">${role(id)}</span><span class="st"></span></button>`;
      }).join('') + '</div>').join('');
      E.buymenu.innerHTML = `<div class="bm"><div class="bmh"><div class="t">Buy</div><div class="bt"></div><div class="m"></div><button class="x" tabindex="-1" data-close title="Close (B or Esc)">Close <kbd>B</kbd></button></div>`
        + `<div class="cols">${cols}</div><div class="foot"></div></div>`;
      E.bm = { cols: E.buymenu.querySelectorAll('.col'), items: E.buymenu.querySelectorAll('[data-buy]'), money: E.buymenu.querySelector('.m'), time: E.buymenu.querySelector('.bt'), foot: E.buymenu.querySelector('.foot') };
      for (const k in cache) if (k.startsWith('bm')) delete cache[k];
      api.updateBuyState(g);
    },
    updateBuyState(g) {
      const P = g.player, md = g.mode, B = E.bm;
      const put = (k, el, v, html) => { if (cache[k] !== v) { cache[k] = v; if (html) el.innerHTML = v; else el.textContent = v; } };
      put('bmMoney', B.money, md.infiniteMoney ? '$ ∞' : '$' + P.money);
      const bt = md.buyTimeLeft ? Math.ceil(md.buyTimeLeft()) : null;
      put('bmTime', B.time, bt == null ? '' : 'Buy time ' + fmtTime(bt));
      put('bmFoot', B.foot, buyCat < 0
        ? 'Click an item to buy it · Quick buy: a category number, then an item number · <kbd>B</kbd> or <kbd>Esc</kbd> closes'
        : `<b>${buyCats[buyCat].title}</b>: press <kbd>1</kbd>–<kbd>${buyCats[buyCat].items.length}</kbd> to buy · <kbd>0</kbd> to go back · <kbd>B</kbd> or <kbd>Esc</kbd> closes`, true);
      B.cols.forEach((c, ci) => { const v = buyCat < 0 ? 'col' : buyCat === ci ? 'col hot' : 'col dim', k = 'bmCol' + ci; if (cache[k] !== v) { cache[k] = v; c.className = v; } });
      for (const el of B.items) {
        const id = el.dataset.buy, st = g.buyState(P, id), it = WEAPONS[id] || EQUIP[id];
        let price = st.price; if (id === 'helmet' && P.armor >= 100 && !P.helmet && !md.infiniteMoney) price = 350;
        const state = st.own ? 'own' : st.ok ? 'ok' : !md.infiniteMoney && P.money < price ? 'poor' : 'max';
        const label = state === 'own' ? 'Owned' : state === 'poor' ? `Need $${price - P.money} more` : state === 'max' ? (it.type === 'grenade' ? 'Grenade limit' : 'Unavailable') : '';
        const k = 'bmIt' + id, v = state + label + price;
        if (cache[k] === v) continue;
        cache[k] = v;
        el.className = 'it ' + state; el.setAttribute('aria-disabled', String(state !== 'ok'));
        el.querySelector('.st').textContent = label;
        el.querySelector('.pr').textContent = md.infiniteMoney ? 'Free' : '$' + price;
      }
    },
    updateBuy(g) {
      if (!buyOpen) return;
      if (!(g.mode.canBuy && g.mode.canBuy(g.player)) || !g.player.alive) { api.closeBuy(true); return; }
      api.updateBuyState(g);
    },
    buyKey(g, n) {
      if (buyCat < 0) { if (n >= 1 && n <= buyCats.length) { buyCat = n - 1; Sound.play('ui_click'); } return; }
      const id = buyCats[buyCat].items[n - 1];
      if (!id) { Sound.play('ui_deny'); return; }
      g.buy(g.player, id, true);
      buyCat = -1;
    },
    buyBack() { if (buyCat >= 0) { buyCat = -1; Sound.play('ui_click'); } },
  };
  return api;
})();
