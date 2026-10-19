# Realmforge import, bosses: build src/rf/boss_gen.js from the user's Realmforge boss engine (engine.js). Every boss's
# phases, attacks, movement, special rules, minions, allies, puzzles, speech and death run as written; this script only
# cuts the seams where the Armory's showcase stood in for a game: the page (its DOM, its phase buttons, its HUD), the
# test player (its auto-dodge bot, auto-fire, HP and regeneration) and the timer that cycled the phases. Those calls go
# to HOST (src/rf/boss.js), which is our game: our player moves through their arena, our shots hit, their hits hurt us,
# and phases turn on the boss's HP. Every patch must match exactly once.
#   py -I tools/rf_build_bosses.py
import os, sys
here = os.path.dirname(os.path.abspath(__file__)); root = os.path.dirname(here)
src = os.path.join(root, 'realmforge-project', 'realmforge')
s = open(os.path.join(src, 'engine.js'), encoding='utf8').read()

def patch(a, b, count=1):
    global s
    n = s.count(a)
    if n != count: sys.exit(f'rf_build_bosses: expected {count} of {a[:90]!r}, found {n}')
    s = s.replace(a, b)

# the module; the page's helpers (template.html) come from HOST
patch("(function(){\n  const pick=document.getElementById('bosspick'),view=document.getElementById('bossview');",
      "export function makeBoss(DATA,HOST){\n  const DPR=HOST.DPR,reduce=false,el=HOST.el,spriteCanvas=HOST.spriteCanvas,drawSprite=HOST.drawSprite;\n  const pick=HOST.stub,view=HOST.stub;")
# the page's own wiring (resize, keys, pointer, the boss picker, the effects gallery) is not ours: cut to the end
a = s.index("  window.addEventListener('resize',()=>{if(A.cv){sizeArena();if(reduce)draw();}});")
s = s[:a] + r"""
  // ---------- hosted (src/rf/boss.js) ----------
  // the arena at a fixed scale: TP of their pixels to a tile (their art was drawn for about this), DPR from the host
  const TP=30;
  function hostSize(){if(A.room){A.tpx=TP;A.cw=TP*A.room.cols;A.ch=TP*A.room.rows;A.W=TP*A.room.iw;A.H=TP*A.room.ih;A.ox=TP;A.oy=TP*2;}
    else{A.tpx=TP;A.cw=TP*18;A.W=A.cw;A.H=A.cw*0.75;A.ch=A.H;A.ox=0;A.oy=0;}A.cv.width=Math.round(A.cw*DPR);A.cv.height=Math.round(A.ch*DPR);buildSolids();renderRoom();}
  function hostStart(B){A.B=B;A.manual=true;A.hz=[];A.swapIdx=0;A.hud=HOST.stub;A.log=null;A.ps=null;A.cv=document.createElement('canvas');A.t=0;A.last=0;A.rockImg=null;A.pimg=null;
    A.F1=frames(B.frames,B.atk,B.pal,74);A.F2=B.twin?frames(B.frames2,B.atk2,B.pal2,74):null;A.shots={};A.allies=null;A.AF={};A.stars=null;(B.allies||[]).forEach(al=>{A.AF[al.id]=frames(al.frames,al.atk,al.pal,52);});
    A.segs=null;A.segImg=B.shots.seg&&B.shots.seg.grid?spriteCanvas(B.shots.seg.grid,B.shots.seg.pal,40):null;
    A.anim={};for(const k in B.shots)if(B.shots[k].grid){A.shots[k]=spriteCanvas(B.shots[k].grid,B.shots[k].pal,B.shots[k].minion?22:shotCss(B.shots[k].grid));if(B.shots[k].anim)A.anim[k]=B.shots[k].anim.map(g=>spriteCanvas(g,B.shots[k].pal,22));}
    setupRoom(B);hostSize();A.b1=body();A.b2=body();A.b2.x=A.W*0.62;A.bub=[];A.dying=null;A.pl=newPlayer();A.player=A.pl;A.stat=newStat();A.fl=[];A.mode='you';A.keys={};A.ts=1;A.sim=false;setPhase(0,false);return A;}
  // one of our shots, at (x, y) in the arena: does it hit, by their rules (snares, crystals, the true clone, the boss)?
  function hostShot(x,y,a){A.pbul=[{x,y,a,v:0,life:1,age:0}];stepPlayerShots(0);const hit=!A.pbul.length;A.pbul=[];return hit;}
  function hostBossAt(x,y){const T=tile();if(A.th)return false;return A.b1.alpha>0.6&&!A.dying&&Math.hypot(x-A.b1.x,y-A.b1.y)<T*1.0;}
  return {A,start:hostStart,step,draw,setPhase,startTrans,startDeath,fakeDeath,bossInvuln,phaseHP,tile,shot:hostShot,bossAt:hostBossAt,solidAt,shotBlocked};
}
"""
# the test player: our player's input moves it (in the world's directions), at our speed; no bot, no auto-fire
patch("    if(A.mode==='bot'){p.plan-=dt;if(p.plan<=0){p.plan=A.pz&&A.pz.st==='still'?0.12:0.2;botPlan();}}\n    else{const k=A.keys;let ux=(k.r?1:0)-(k.l?1:0),uy=(k.d?1:0)-(k.u?1:0);",
      "    {const q=HOST.input();let ux=q[0],uy=q[1];")
patch("drift(p.x,p.y,p.dvx*PL_SPD*(p.slow||1)+p.kx,p.dvy*PL_SPD*(p.slow||1)+p.ky)", "drift(p.x,p.y,p.dvx*HOST.spd()*(p.slow||1)+p.kx,p.dvy*HOST.spd()*(p.slow||1)+p.ky)")
patch("function playerShoot(dt){", "function playerShoot(dt){return;")
# their hits hurt our player (the same-instant volley rule kept); statuses stay theirs
patch("function hurt(d,src,x,y){const p=A.pl;if(!d||p.inv>0)return;",
      "function hurt(d,src,x,y){const p=A.pl;if(!d||p.inv>0)return;{p.st=p.st||{};if(p.st.curse>0)d=Math.round(d*1.25);const sh=A.B.shots[src];if(sh&&sh.inflict)inflict(sh.inflict.k,sh.inflict.t);"
      "if(p.lastHitT!=null&&A.t-p.lastHitT<0.15){if(d<=p.lastHitD)return;const ex=d-p.lastHitD;p.lastHitD=d;d=ex;}else{p.lastHitT=A.t;p.lastHitD=d;}HOST.hurt(d,src);return;}")
# no test-player health bar over our player
patch("{const bw=T*1.1,f=Math.max(0,p.hp/PL_HP);", "if(0){const bw=T*1.1,f=Math.max(0,p.hp/PL_HP);")
# speech goes to our chat as well as the bubbles
patch("    if(A.log&&!A.sim){const row=el(", "    if(HOST.say)HOST.say(nm,ln.t,who);if(0){const row=el(")

# our camera turns, their arena turns with it (it is laid on the floor), but what stands up must stay upright: the boss
# (and its twin, decoys, clones, the thousand copies), its minions and its allies turn back against the camera
# (HOST.th: the camera's angle, set before each draw). Their floating text and speech bubbles are drawn by our game.
U = "c.rotate(-(HOST.th||0));"
patch("const drawBody=(o,F,fl,alpha)=>{if(A.dying&&!A.dying.pre)return;", "const drawBody=(o,F,fl,alpha)=>{if(A.dying&&!A.dying.pre)return;c.save();c.translate(o.x,o.y);" + U + "c.translate(-o.x,-o.y);")
patch("Math.round(o.y-h/2+Math.sin(t*2.4)*2),w,h);c.globalAlpha=1;};", "Math.round(o.y-h/2+Math.sin(t*2.4)*2),w,h);c.globalAlpha=1;c.restore();};")
patch("c.translate(Math.round(q.x),Math.round(q.y));if(cl.mode==='mx'", "c.translate(Math.round(q.x),Math.round(q.y));" + U + "if(cl.mode==='mx'")
patch("c.translate(Math.round(q.x),Math.round(q.y+Math.sin(t*2.4+i)*2));", "c.translate(Math.round(q.x),Math.round(q.y+Math.sin(t*2.4+i)*2));" + U)
patch("c.save();c.translate(m.x,m.y);if((m.behave==='charge'", "c.save();c.translate(m.x,m.y);" + U + "if((m.behave==='charge'")
patch("c.translate(Math.round(a.x),Math.round(a.y));", "c.translate(Math.round(a.x),Math.round(a.y));" + U)
patch("drawBlind(c);drawBubbles(c);", "drawBlind(c);")
patch("for(const f of A.fl||[]){c.globalAlpha=1-f.age/0.9;", "for(const f of (HOST.ownText?[]:A.fl||[])){c.globalAlpha=1-f.age/0.9;")

out = os.path.join(root, 'src', 'rf'); os.makedirs(out, exist_ok=True)
head = ("// Generated by tools/rf_build_bosses.py from the user's Realmforge project (engine.js). Do not edit by hand: change\n"
        "// Realmforge and rebuild. The seams to our game are the HOST calls (src/rf/boss.js).\n/* eslint-disable */\n")
open(os.path.join(out, 'boss_gen.js'), 'w', encoding='utf8', newline='\n').write(head + s)
print(f'src/rf/boss_gen.js: {len(s)} chars')
