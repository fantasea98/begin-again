/* =========================================================
   SFX —— 纯 Web Audio 合成音效（零素材、零依赖）
   - 必须在用户手势里调用 SFX.init()（浏览器自动播放策略）
   - 所有节拍用 ctx.currentTime 前瞻调度，不用 setTimeout
   - 不支持 AudioContext 时全部静默 no-op，不影响主逻辑
   ========================================================= */
window.SFX = (function(){
"use strict";

var MUTE_KEY = "beginAgain.muted";
var VOLUME   = 1.5;           // 主音量（2026-10-20 再上调：0.525 → 0.79 → 1.0 → 1.5）

var ctx = null, master = null, ready = false, dead = false;
var muted = false;
var lastAt = {};              // 节流时间戳
var _nb = null, _wavUrl = null;
var _gestureUntil = 0;        // 手势后允许排程的短暂窗口（毫秒戳）

try{ muted = localStorage.getItem(MUTE_KEY) === "1"; }catch(e){}

function supported(){ return !!(window.AudioContext || window.webkitAudioContext); }
function can(){ return ready && !dead && !muted && ctx && ctx.state !== "closed"; }

/* 关键：AudioContext 处于 suspended 时 currentTime 是冻结的。
   此时排程的音符会被钉在同一个"现在"，等用户第一次触摸恢复音频后，
   它们会在同一瞬间集中炸出来 —— 这就是开场音效"卡几秒后一次性播放"的原因。
   所以：suspended 期间一律不排程（直接丢弃），只有这两种情况才发声：
     ① ctx 已 running（正常）
     ② 刚刚发生过用户手势（resume 生效前的 ~500ms 宽限窗，保证点击声能响） */
function live(){
  if(!can()) return false;
  if(ctx.state === "running") return true;
  if(ctx.state === "suspended" || ctx.state === "interrupted"){
    try{ var p = ctx.resume(); if(p && p.catch) p.catch(function(){}); }catch(e){}
    return Date.now() < _gestureUntil;
  }
  return false;
}
function markGesture(){ _gestureUntil = Date.now() + 500; }
var _audEl = null;
var _lastWav = 0;
var _diag = [];
function dlog(msg){
  try{
    var d = new Date();
    var ts = String(d.getMinutes()).padStart(2,"0") + ":" + String(d.getSeconds()).padStart(2,"0") + "." + String(d.getMilliseconds()).padStart(3,"0");
    _diag.push(ts + " " + msg);
    if(_diag.length > 90) _diag.shift();
  }catch(e){}
}
var _lastResume = 0;
var _rebuilds = 0;
var _lastRebuild = 0;
var _lastCreate = 0;

/* iOS 静音拨杆打开时 Web Audio 会被系统静音。
   办法：在手势里播一段极短的静音 wav（走 <audio> 通道），
   把音频会话切到 playback 类别，之后 Web Audio 就能正常出声。 */
function silentWavUrl(){
  if(_wavUrl) return _wavUrl;
  try{
    var sr = 8000, n = 800;                 // 0.1 秒
    var buf = new ArrayBuffer(44 + n * 2);
    var dv = new DataView(buf);
    function s(o, str){ for(var i = 0; i < str.length; i++) dv.setUint8(o + i, str.charCodeAt(i)); }
    s(0,"RIFF");  dv.setUint32(4, 36 + n*2, true);  s(8,"WAVE");
    s(12,"fmt "); dv.setUint32(16, 16, true);       dv.setUint16(20, 1, true);
    dv.setUint16(22, 1, true);                      dv.setUint32(24, sr, true);
    dv.setUint32(28, sr * 2, true);                 dv.setUint16(32, 2, true);
    dv.setUint16(34, 16, true);
    s(36,"data"); dv.setUint32(40, n * 2, true);
    /* 注意：全是 0 的「静音」在 iOS 上有被判为「无播放」的风险，音频会话激活不了。
       这里改成前 40ms 静音 + 后 40ms 一声极轻的 1kHz 衰减滴声（约 -30dB，几乎听不见）。 */
    for(var i = 0; i < n; i++){
      var v = 0;
      if(i > 320){
        var k = (i - 320) / 320;
        v = Math.sin(2 * Math.PI * 1000 * (i - 320) / sr) * 900 * (1 - k);
      }
      dv.setInt16(44 + i * 2, v, true);
    }
    _wavUrl = URL.createObjectURL(new Blob([buf], { type:"audio/wav" }));
  }catch(e){ _wavUrl = null; }
  return _wavUrl;
}

/* ---------- 上下文管理 ----------
   原则：只有「浏览器不支持」和「new AudioContext() 抛错」才算 dead。
   其它任何小问题（resume 失败、静音 wav 播不动、visibilitychange 注册失败）
   一律单独 try/catch 吞掉，绝不能让 dead 变 true —— 否则整局永远没声音。 */

function createCtx(){
  var AC = window.AudioContext || window.webkitAudioContext;
  var c = new AC();
  var m = c.createGain();
  m.gain.value = VOLUME;
  // 音量整体调大后加一级「只削峰不压整体」的软限幅
  try{
    var comp = c.createDynamicsCompressor();
    comp.threshold.value = -6;
    comp.knee.value = 12;
    comp.ratio.value = 4;
    comp.attack.value = 0.002;
    comp.release.value = 0.18;
    m.connect(comp);
    comp.connect(c.destination);
  }catch(e){ try{ m.connect(c.destination); }catch(e2){} }
  ctx = c; master = m;
  return c;
}

function closeCtx(){
  try{ if(ctx && ctx.state !== "closed") ctx.close(); }catch(e){}
  ctx = null; master = null; ready = false; _nb = null;
}

/* 播放静音 wav：iOS 上它能把音频会话切到 playback（顺带绕过静音拨杆的一部分限制）。
   注意三点：①绝对不能设 muted（muted 播放不算解锁）；
   ②元素要插进 DOM 才稳定；③任何失败都不许影响 dead。 */
function playSilentWav(tag){
  try{
    // 600ms 内不重复播，避免每个手势都滴一声
    var now = Date.now();
    if(now - _lastWav < 600) return;
    _lastWav = now;

    if(!_audEl){
      var url = silentWavUrl();
      if(!url){ dlog("wav: no url"); return; }
      _audEl = new Audio();
      _audEl.src = url;
      _audEl.preload = "auto";
      _audEl.loop = false;
      _audEl.volume = 0.5;              // 波形本身已经很轻（约 -30dB）
      try{
        _audEl.setAttribute("playsinline", "");
        _audEl.style.cssText = "position:fixed;left:0;top:0;width:1px;height:1px;opacity:0;pointer-events:none;";
        document.body.appendChild(_audEl);
      }catch(e){ dlog("wav: append failed"); }
    }
    try{ _audEl.currentTime = 0; }catch(e){}
    var pr = _audEl.play();
    if(pr && pr.then){
      pr.then(function(){ dlog("wav play OK (" + (tag||"") + ")"); },
              function(err){
                dlog("wav play REJECT " + ((err && (err.name + ":" + err.message)) || "?") + " (" + (tag||"") + ")");
                // 被拒了就把元素丢掉，下次重建重试
                try{ _audEl = null; }catch(e){}
              });
    } else if(pr && pr.catch){ pr.catch(function(){}); }
  }catch(e){ dlog("wav THROW " + (e && e.name)); }
}

function registerVisibility(){
  try{
    if(document.__baVis) return;
    document.__baVis = true;
    document.addEventListener("visibilitychange", function(){
      if(document.hidden) return;
      try{ if(ctx && ctx.state !== "running"){ _lastResume = Date.now(); ctx.resume(); } }catch(e){}
    });
  }catch(e){}
}

/* 对外唯一解锁入口，可放心重复调用：
   - force=false：温和补 resume（不重建，避免打断异步 resume）
   - force=true ：允许「关掉再重建」（iOS 上被污染的 ctx 只能靠重建救活），
                  但总共最多 3 次、且两次之间至少间隔 250ms，避免抖动 */
function ensure(force, noCreate){
  markGesture();
  if(dead){ dlog("ensure: dead"); return false; }
  if(!supported()){ dead = true; dlog("ensure: unsupported"); return false; }

  if(ctx && ctx.state === "closed"){ ctx = null; master = null; ready = false; }

  var before = ctx ? ctx.state : "none";

  if(!ctx && noCreate){
    dlog("ensure: no ctx & noCreate -> skip");
    return false;
  }

  var createdNow = false;
  if(!ctx){
    /* 顺序很重要：先用 <audio> 争到「媒体播放」许可，再建 AudioContext。
       两个都在同一个手势的同步栈里，iOS 上这样成功率最高。 */
    playSilentWav("beforeCreate");
    try{ createCtx(); }
    catch(e){ dead = true; ctx = null; master = null; dlog("createCtx THROW " + (e && e.name)); return false; }
    ready = true;
    createdNow = true;
    _lastCreate = Date.now();
    dlog("created ctx");
    registerVisibility();
  }

  if(ctx.state !== "running"){
    /* 关键防护：刚建出来的上下文 150ms 内绝不重建。
       否则「document 上的 net」和「锁屏自己的处理」会在同一个事件里先后各调一次
       hardUnlock，第二次就把第一次刚建好、正在 resume 的那只关掉重建，
       白白浪费掉这次用户手势（真机日志里就是这样：none->suspended rb=1 紧接着又重建）。
       150ms 足够挡住同一事件里的重复调用，又不会误伤 300ms 后才到的 click 重试。 */
    var canRebuild = !!force && !createdNow && (Date.now() - _lastCreate) > 150
                     && _rebuilds < 3 && (Date.now() - _lastRebuild) > 250;
    if(canRebuild){
      closeCtx();
      playSilentWav("beforeRebuild");
      try{ createCtx(); }
      catch(e){ dead = true; dlog("rebuild THROW"); return false; }
      ready = true;
      _rebuilds++;
      _lastRebuild = Date.now();
      registerVisibility();
    }
    if(ctx.state !== "running") playSilentWav("beforeResume");
    _lastResume = Date.now();
    try{
      var pr = ctx.resume();
      if(pr && pr.then){
        pr.then(function(){ dlog("resume OK -> " + (ctx && ctx.state)); },
                function(err){ dlog("resume REJECT " + ((err && err.name) || "?")); });
      } else { dlog("resume (no promise)"); }
    }catch(e){ dlog("resume THROW " + (e && e.name)); }
  }

  ping();                     // 真手势里 start 一个 1 采样 source —— iOS 解锁的关键
  var after = ctx ? ctx.state : "none";
  dlog("ensure force=" + (force ? 1 : 0) + " " + before + "->" + after + " rb=" + _rebuilds);
  return after === "running";
}

/* 兼容旧调用 */
function init(){ return ensure(false); }

/* 温和唤醒：只对「已经存在的」上下文补一次 resume + ping，
   绝不新建、也绝不标手势窗口 —— 因为它是被 setTimeout 反复调的，
   一旦标了窗口，suspended 期间排下的音符会堆在冻结的 currentTime 上，
   等音频真的醒了就一次性炸出来（就是之前那个"卡几秒后集中播放"的毛病）。 */
function nudge(){
  if(dead) return false;
  if(!ctx) return false;
  if(ctx.state === "closed"){ ctx = null; master = null; ready = false; return false; }
  if(ctx.state === "running") return true;
  _lastResume = Date.now();
  try{
    var p = ctx.resume();
    if(p && p.then){
      p.then(function(){ dlog("nudge resume OK -> " + (ctx && ctx.state)); },
             function(err){ dlog("nudge resume REJECT " + ((err && err.name) || "?")); });
    }
  }catch(e){ dlog("nudge resume THROW " + (e && e.name)); }
  try{ ping(); }catch(e){}
  return ctx.state === "running";
}

/* 立刻启动一个 1 采样的静音源 —— iOS 真正「解锁」Web Audio 靠的就是
   在用户手势里 start() 一个 source，光 resume() 有时不够。 */
function ping(){
  try{
    if(!ctx) return;
    var b = ctx.createBuffer(1, 1, ctx.sampleRate || 44100);
    var src = ctx.createBufferSource();
    src.buffer = b;
    src.connect(master || ctx.destination);
    src.start(0);
  }catch(e){}
}

/* ---------- 基础合成 ---------- */
function tone(o){
  if(!live()) return;
  try{
    var t0 = ctx.currentTime + (o.delay || 0);
    var dur = o.dur || 0.12;
    var osc = ctx.createOscillator();
    var g   = ctx.createGain();
    osc.type = o.type || "sine";
    osc.frequency.setValueAtTime(o.freq, t0);
    if(o.to) osc.frequency.exponentialRampToValueAtTime(Math.max(1, o.to), t0 + dur);
    var peak = (o.gain == null ? 0.25 : o.gain);
    var atk  = o.attack || 0.006;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak, t0 + atk);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g); g.connect(o.bus || master);
    osc.start(t0); osc.stop(t0 + dur + 0.03);
  }catch(e){}
}
function noise(o){
  if(!live()) return;
  try{
    if(!_nb){
      var len = Math.floor(ctx.sampleRate * 0.5);
      _nb = ctx.createBuffer(1, len, ctx.sampleRate);
      var d = _nb.getChannelData(0);
      for(var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    var t0 = ctx.currentTime + (o.delay || 0);
    var dur = o.dur || 0.1;
    var src = ctx.createBufferSource();
    src.buffer = _nb; src.loop = true;
    var f = ctx.createBiquadFilter();
    f.type = o.filter || "highpass";
    f.frequency.setValueAtTime(o.freq || 2000, t0);
    if(o.to) f.frequency.exponentialRampToValueAtTime(Math.max(20, o.to), t0 + dur);
    var g = ctx.createGain();
    var peak = (o.gain == null ? 0.2 : o.gain);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak, t0 + (o.attack || 0.004));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f); f.connect(g); g.connect(o.bus || master);
    src.start(t0); src.stop(t0 + dur + 0.03);
  }catch(e){}
}
/* 同名音效在 ms 内只响一次，防止连点爆音叠加 */
function gate(k, ms){
  var n = Date.now();
  if(lastAt[k] && n - lastAt[k] < ms) return false;
  lastAt[k] = n;
  return true;
}

/* ---------- 具体音效 ---------- */

/* 通用按钮 */
function tap(){
  if(!gate("tap", 40)) return;
  tone({ freq:880, type:"triangle", dur:0.05, gain:0.16 });
}

/* 拨号：DTMF 双音多频（行频 + 列频，两个振荡器同时响） */
var DTMF_ROW = { "1":697,"2":697,"3":697, "4":770,"5":770,"6":770, "7":852,"8":852,"9":852, "*":941,"0":941,"#":941 };
var DTMF_COL = { "1":1209,"4":1209,"7":1209,"*":1209, "2":1336,"5":1336,"8":1336,"0":1336, "3":1477,"6":1477,"9":1477,"#":1477 };
function dial(k){
  var r = DTMF_ROW[k], c = DTMF_COL[k];
  if(!r || !c) return;
  tone({ freq:r, type:"sine", dur:0.17, gain:0.13 });
  tone({ freq:c, type:"sine", dur:0.17, gain:0.13 });
}
/* 接通：A 大三和弦三连音 */
function connected(){
  tone({ freq:440,  type:"sine", dur:0.14, gain:0.2, delay:0    });
  tone({ freq:554.4,type:"sine", dur:0.14, gain:0.2, delay:0.09 });
  tone({ freq:659.3,type:"sine", dur:0.24, gain:0.2, delay:0.18 });
}
/* 打错：标准电话忙音（480+620Hz 双音，响 0.4 停 0.35 再响 0.4） */
function wrong(){
  [0, 0.75].forEach(function(d){
    tone({ freq:480, type:"square", dur:0.4, gain:0.10, delay:d });
    tone({ freq:620, type:"square", dur:0.4, gain:0.10, delay:d });
  });
}
/* 拨号后的回铃音「嘟……嘟……」（440+480Hz，响 1s 停 0.4s 再响 1s） */
function ringback(){
  [0, 1.4].forEach(function(d){
    tone({ freq:440, type:"sine", dur:1.0, gain:0.15, delay:d });
    tone({ freq:480, type:"sine", dur:1.0, gain:0.15, delay:d });
  });
}
/* 敲键盘（音高随机 ±10%，避免机械重复） */
function key(){
  if(!gate("key", 28)) return;
  var f = 1150 * (0.9 + Math.random() * 0.2);
  noise({ dur:0.018, filter:"highpass", freq:2400, gain:0.13 });
  tone({ freq:f, type:"square", dur:0.012, gain:0.1 });
}
/* 倒计时滴答；urgent=true 时更高更响 */
function tick(urgent){
  tone({ freq: urgent ? 1400 : 1000, type:"sine", dur:0.045, gain: urgent ? 0.3 : 0.18 });
}

/* 鼓组 */
function kick(delay){  tone({ freq:150, to:48,  type:"sine",     dur:0.16, gain:0.34, delay:delay||0 }); }
function snare(delay){
  noise({ dur:0.13, filter:"bandpass", freq:1800, gain:0.2,  delay:delay||0 });
  tone ({ freq:190, to:120, type:"triangle", dur:0.09, gain:0.12, delay:delay||0 });
}
function hihat(delay){ noise({ dur:0.035, filter:"highpass", freq:8000, gain:0.1, delay:delay||0 }); }

/* 第 3 关：一个动作窗口的伴奏。
   durMs=窗口总时长，centerMs=完美判定中心，全部用 ctx 时钟调度，不受主线程卡顿影响 */
function l3Action(durMs, centerMs){
  var D = (durMs || 1500) / 1000, C = (centerMs || 960) / 1000;
  kick(0);
  hihat(D * 0.25); hihat(D * 0.5); hihat(D * 0.75);
  snare(C);                       // 重拍正好落在完美判定点上
}
/* 开场数拍：4 个 hihat 后接第一拍 */
function l3CountIn(){ hihat(0); hihat(0.22); hihat(0.44); hihat(0.66); }

/* 判定 */
function perfect(){
  tone({ freq:784,  type:"square", dur:0.07, gain:0.2,  delay:0    });
  tone({ freq:1046.5,type:"square", dur:0.16, gain:0.2,  delay:0.07 });
  tone({ freq:1568, type:"sine",   dur:0.22, gain:0.09, delay:0.07 });
}
function miss(){
  tone({ freq:220, to:105, type:"sawtooth", dur:0.22, gain:0.18 });
}
/* 碎片到手：上行琶音 */
function fragment(){
  [523.3, 659.3, 784, 1046.5].forEach(function(f, i){
    tone({ freq:f, type:"sine", dur:0.3, gain:0.2, delay:i * 0.075 });
  });
}
/* 碎片落入手中：清脆上行 + 金属铃感（在「获得 xx 碎片」那一行出现时响） */
function fragmentDrop(){
  tone({ freq:1318.5, type:"sine", dur:0.5, gain:0.22, delay:0    });
  tone({ freq:1760,   type:"sine", dur:0.6, gain:0.18, delay:0.09 });
  tone({ freq:2637,   type:"sine", dur:0.5, gain:0.07, delay:0.09 });
  noise({ dur:0.16, filter:"highpass", freq:5000, gain:0.10, delay:0.02 });
}

/* ---------- 持续型音源 ---------- */
var _beatBus = null;
/* 第 2 关：倒计时期间的紧张感 —— 不用鼓组，改用越来越密的「滴滴」秒针声，
   四拍一顿（重音更高更亮），整体节奏从 300ms 一路收紧到 95ms。
   全部一次性音源、用 ctx 时钟一次性排完，中途离场时把总线切掉即可全静音。 */
function tensionStart(seconds){
  if(!live()) return;
  try{
    tensionStop();
    _beatBus = ctx.createGain();
    _beatBus.gain.value = 1;
    _beatBus.connect(master);
    var bus = _beatBus;
    var t0 = ctx.currentTime + 0.05;
    var total = Math.max(1, seconds || 5);
    var end = t0 + total;
    var t = t0, i = 0;
    while(t < end - 0.02){
      var frac = Math.min(1, (t - t0) / total);          // 0 → 1，越接近结束越快
      var d  = t - ctx.currentTime;
      var hi = frac > 0.55;                              // 后半程整体音高抬上去，更焦躁
      if(i % 4 === 0){                                   // 每 4 下一记重音
        tone({ freq: hi ? 2093 : 1760, type:"square", dur:0.034, gain:0.20, delay:d, bus:bus });
        tone({ freq: hi ? 3136 : 2640, type:"sine",   dur:0.030, gain:0.10, delay:d, bus:bus });
      } else {                                           // 普通的「滴」
        tone({ freq: hi ? 1568 : 1320, type:"square", dur:0.026, gain:0.13, delay:d, bus:bus });
      }
      t += 0.30 - 0.205 * frac;                          // 300ms → 95ms
      i++;
    }
  }catch(e){}
}
function tensionStop(){
  if(!_beatBus) return;
  var b = _beatBus; _beatBus = null;
  try{
    var t = ctx.currentTime;
    b.gain.cancelScheduledValues(t);
    b.gain.setValueAtTime(b.gain.value, t);
    b.gain.linearRampToValueAtTime(0, t + 0.08);
    setTimeout(function(){ try{ b.disconnect(); }catch(e){} }, 240);
  }catch(e){}
}

/* 第 4 关：一段缓慢抒情的音乐盒小曲（C 大调五声，3/4 拍），
   单独走一条 0.5 的支线总线，比全局音效明显轻；
   整段用 ctx 时钟一次性排完，再来一遍时整体后移一个循环长度。 */
var _box = null, _boxBus = null;
var BOX_BEAT = 0.78;                 // 一拍 0.78s ≈ 77 BPM
var BOX_LEN  = 9;                    // 每循环 9 拍
/* [第几拍, 频率, 余音秒数] */
var BOX_MELODY = [
  [0.00, 659.26, 1.70],   // E5
  [0.75, 880.00, 1.40],   // A5
  [1.50, 783.99, 1.20],   // G5
  [2.25, 659.26, 1.90],   // E5
  [3.00, 587.33, 1.00],   // D5
  [3.75, 523.25, 2.10],   // C5
  [4.75, 587.33, 0.95],   // D5
  [5.25, 659.26, 1.60],   // E5
  [6.00, 783.99, 1.10],   // G5
  [6.75, 880.00, 2.00],   // A5
  [7.75, 783.99, 2.30]    // G5
];
/* 低音只做一点暖底，音量极小，长音铺开 */
var BOX_BASS = [
  [0.00, 130.81, 3.10],   // C3
  [3.75, 110.00, 2.60],   // A2
  [5.25,  87.31, 2.40],   // F2
  [6.75,  98.00, 2.60]    // G2
];
function musicBoxStart(){
  if(!can() || _box || _boxBus) return;
  try{
    _boxBus = ctx.createGain();
    // 第 4 关 BGM 单独压到五成，并且缓缓淡入（3.6 秒）
    _boxBus.gain.setValueAtTime(0.0001, ctx.currentTime);
    _boxBus.gain.linearRampToValueAtTime(0.26, ctx.currentTime + 3.6);
    _boxBus.connect(master);
  }catch(e){ _boxBus = null; return; }
  var bus = _boxBus;
  function phrase(){
    if(!_boxBus || !live()){ return; }
    BOX_MELODY.forEach(function(n){
      var at = 0.06 + n[0] * BOX_BEAT;
      tone({ freq:n[1],     type:"sine",     dur:n[2],      gain:0.115, attack:0.016, delay:at,        bus:bus });
      tone({ freq:n[1] * 2, type:"sine",     dur:n[2] * 0.5, gain:0.028, attack:0.012, delay:at + 0.012, bus:bus });
      tone({ freq:n[1] * 3, type:"triangle", dur:0.13,      gain:0.010, attack:0.006, delay:at,        bus:bus });
    });
    BOX_BASS.forEach(function(n){
      tone({ freq:n[1], type:"sine", dur:n[2], gain:0.030, attack:0.42, delay:0.06 + n[0] * BOX_BEAT, bus:bus });
    });
    _box = setTimeout(phrase, BOX_LEN * BOX_BEAT * 1000);
  }
  phrase();
}
function musicBoxStop(){
  if(_box){ clearTimeout(_box); _box = null; }
  if(!_boxBus) return;
  var b = _boxBus; _boxBus = null;
  try{
    var t = ctx.currentTime;
    b.gain.cancelScheduledValues(t);
    b.gain.setValueAtTime(b.gain.value, t);
    b.gain.linearRampToValueAtTime(0, t + 0.5);
    setTimeout(function(){ try{ b.disconnect(); }catch(e){} }, 2400);
  }catch(e){}
}
/* 选中物品：一声轻快的木琴「叮」，带一点木头味 */
function pick(){
  if(!gate("pick", 55)) return;
  tone({ freq:1318.5, type:"triangle", dur:0.13, gain:0.15, attack:0.004 });
  tone({ freq:1975.5, type:"sine",     dur:0.09, gain:0.05, delay:0.012 });
}
/* 终页：一声简单的「啵」，不升调、不拖尾 */
function pop(){
  if(!gate("pop", 80)) return;
  tone({ freq:640, to:430, type:"sine", dur:0.17, gain:0.17, attack:0.004 });
  tone({ freq:1280, type:"sine", dur:0.06, gain:0.035, attack:0.002 });
}
/* 终页：柔和的风铃，一级一级往上走（慢进慢出，不抢不脆） */
var SOFT_SCALE = [523.25, 587.33, 659.26, 783.99, 880, 1046.5];
function soft(step){
  if(!gate("soft", 110)) return;
  var k = Math.max(0, Math.min(SOFT_SCALE.length - 1, step | 0));
  var f = SOFT_SCALE[k];
  tone({ freq:f,       type:"sine", dur:1.7, gain:0.130, attack:0.055 });
  tone({ freq:f * 2,   type:"sine", dur:1.0, gain:0.034, attack:0.070, delay:0.02 });
  tone({ freq:f * 1.5, type:"sine", dur:1.3, gain:0.028, attack:0.090, delay:0.07 });
}
/* 翻牌：纸张声 */
function flip(){
  if(!gate("flip", 60)) return;
  noise({ dur:0.03, filter:"highpass", freq:3000, to:1200, gain:0.16 });
}
/* 密码解锁：上行扫频 */
function unlock(){
  tone({ freq:300, to:1200, type:"sine", dur:0.42, gain:0.22 });
  tone({ freq:600, to:2400, type:"sine", dur:0.42, gain:0.08, delay:0.05 });
}
/* 彩带：礼花炸开 —— 先一声「咻」，再一记闷响 + 高频碎屑，后面几颗铃声零星飘落 */
function confetti(){
  noise({ dur:0.42, filter:"bandpass", freq:380, to:3600, gain:0.13 });          // 咻——
  tone ({ freq:160, to:760, type:"sine", dur:0.28, gain:0.10 });
  noise({ dur:0.26, filter:"highpass", freq:2200, gain:0.15, delay:0.16 });      // 炸开
  tone ({ freq:120, to:46, type:"sine", dur:0.36, gain:0.22, delay:0.16 });
  [1046.5, 1318.5, 1568, 2093].forEach(function(f, i){                            // 四颗小铃
    tone({ freq:f, type:"sine", dur:0.55, gain:0.085, delay:0.22 + i * 0.075 });
  });
  for(var i = 0; i < 7; i++){                                                     // 零星的碎屑
    noise({ dur:0.05, filter:"highpass", freq:5200, gain:0.075, delay:0.45 + Math.random() * 1.5 });
  }
}
/* 盖章：一记闷响 + 纸面摩擦，收尾很短促 */
function stamp(){
  if(!gate("stamp", 300)) return;
  noise({ dur:0.11, filter:"lowpass", freq:1500, to:170, gain:0.26 });
  tone ({ freq:165, to:48, type:"sine", dur:0.24, gain:0.36 });
  noise({ dur:0.045, filter:"highpass", freq:3200, gain:0.10, delay:0.035 });
}

/* ---------- 开场微信群聊专用 ---------- */

/* 气泡弹出：自己的消息偏亮上行，别人的消息偏低短促（微信气泡感） */
function bubble(self){
  if(!gate("bubble", 45)) return;
  if(self){
    tone({ freq:622.3, type:"triangle", dur:0.07, gain:0.15 });
    tone({ freq:1046.5,type:"triangle", dur:0.10, gain:0.11, delay:0.055 });
    noise({ dur:0.03, filter:"highpass", freq:4200, gain:0.06, delay:0.02 });
  } else {
    tone({ freq:523.3, type:"sine", dur:0.09, gain:0.16 });
    tone({ freq:392,   type:"sine", dur:0.12, gain:0.11, delay:0.05 });
    noise({ dur:0.025, filter:"highpass", freq:2400, gain:0.05, delay:0.02 });
  }
}
/* 系统提示 pill：两声轻警示 */
function sysalert(){
  tone({ freq:1244.5, type:"square", dur:0.10, gain:0.09, delay:0    });
  tone({ freq:1244.5, type:"square", dur:0.10, gain:0.09, delay:0.20 });
}
/* 时空乱流：下扫 + 宽频噪声 + 回弹上行（画面 glitch 同帧触发） */
function glitch(){
  tone({ freq:1200, to:110, type:"sawtooth", dur:0.55, gain:0.15 });
  tone({ freq:1760, to:660, type:"square",   dur:0.55, gain:0.05, delay:0.04 });
  noise({ dur:0.5, filter:"bandpass", freq:400, to:4200, gain:0.13 });
  noise({ dur:0.3, filter:"highpass", freq:3200, gain:0.07, delay:0.5 });
  tone({ freq:160, to:1500, type:"sine", dur:0.34, gain:0.13, delay:0.52 });
}
/* 点赞：清脆小铃（连点时逐个错开，不糊成一团） */
function like(){
  if(!gate("like", 55)) return;
  tone({ freq:1318.5, type:"sine", dur:0.13, gain:0.14 });
  tone({ freq:2093,   type:"sine", dur:0.22, gain:0.07, delay:0.04 });
}
/* 内心 OS：柔和气声 + 一个悬空单音 */
function thought(){
  noise({ dur:0.45, filter:"lowpass", freq:1100, to:380, gain:0.07 });
  tone({ freq:493.9, type:"sine", dur:0.60, gain:0.09 });
}
/* 进入结界：whoosh + 上行扫频 + 三连高音（入场仪式感） */
function portal(){
  noise({ dur:0.9, filter:"bandpass", freq:260, to:5200, gain:0.17 });
  tone ({ freq:160, to:1500, type:"sine", dur:0.9, gain:0.17 });
  [523.3, 784, 1046.5].forEach(function(f, i){
    tone({ freq:f, type:"triangle", dur:0.55, gain:0.14, delay:0.52 + i * 0.09 });
  });
}

/* 点中房间里的关键物品：温暖的「就是它」双音 + 一点气流 */
function reveal(){
  if(!gate("reveal", 200)) return;
  tone({ freq:659.3, type:"triangle", dur:0.12, gain:0.17 });
  tone({ freq:987.8, type:"triangle", dur:0.16, gain:0.14, delay:0.07 });
  tone({ freq:1318.5,type:"sine",     dur:0.24, gain:0.08, delay:0.14 });
  noise({ dur:0.12, filter:"highpass", freq:3600, gain:0.05, delay:0.02 });
}
/* 切换年份：柔和的翻页（替代原来偏刺耳的噪声「啧啧」声） */
function turn(){
  if(!gate("turn", 120)) return;
  noise({ dur:0.07, filter:"bandpass", freq:820, to:340, gain:0.085 });
  tone ({ freq:523.3, type:"sine", dur:0.11, gain:0.11 });
  tone ({ freq:783.9, type:"sine", dur:0.15, gain:0.09, delay:0.06 });
}
/* 成功结算弹窗：明亮上行琶音 + 一点点闪光 */
function winPop(){
  [523.3, 659.3, 784, 1046.5].forEach(function(f, i){
    tone({ freq:f, type:"triangle", dur:0.26, gain:0.17, delay:i * 0.08 });
  });
  noise({ dur:0.26, filter:"highpass", freq:6200, gain:0.05, delay:0.10 });
}
/* 失败结算弹窗：下行两音 + 一记闷响 */
function failPop(){
  tone({ freq:392,   type:"triangle", dur:0.16, gain:0.16 });
  tone({ freq:311.1, type:"triangle", dur:0.28, gain:0.16, delay:0.13 });
  tone({ freq:110, to:78, type:"sine", dur:0.32, gain:0.13, delay:0.13 });
}

/* ---------- 开关 ---------- */
function setMuted(m){
  muted = !!m;
  try{ localStorage.setItem(MUTE_KEY, muted ? "1" : "0"); }catch(e){}
  if(master) master.gain.value = muted ? 0 : VOLUME;
  return muted;
}
function toggle(){ return setMuted(!muted); }

return {
  init: init,
  ensure: ensure,
  hardUnlock: function(){ return ensure(true); },
  wake: nudge,
  resume: nudge,
  gesture: markGesture,
  _log: function(){ return _diag.slice(); },
  log: dlog,
  ping: ping,
  isMuted: function(){ return muted; },
  setMuted: setMuted,
  toggle: toggle,
  isDead: function(){ return dead; },
  _debug: function(){ return { state: ctx ? ctx.state : null, ready: ready, dead: dead, muted: muted, rebuilds: _rebuilds, sinceResume: Date.now() - _lastResume }; },
  tap: tap, dial: dial, connected: connected, wrong: wrong, ringback: ringback,
  key: key, tick: tick,
  kick: kick, snare: snare, hihat: hihat,
  l3Action: l3Action, l3CountIn: l3CountIn,
  perfect: perfect, miss: miss,
  fragment: fragment, fragmentDrop: fragmentDrop, flip: flip,
  tensionStart: tensionStart, tensionStop: tensionStop,
  musicBoxStart: musicBoxStart, musicBoxStop: musicBoxStop,
  unlock: unlock, confetti: confetti, stamp: stamp, pick: pick, soft: soft, pop: pop,
  bubble: bubble, sysalert: sysalert, glitch: glitch,
  like: like, thought: thought, portal: portal,
  reveal: reveal, turn: turn, winPop: winPop, failPop: failPop
};
})();
