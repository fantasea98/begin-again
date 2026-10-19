/* =========================================================
   SFX —— 纯 Web Audio 合成音效（零素材、零依赖）
   - 必须在用户手势里调用 SFX.init()（浏览器自动播放策略）
   - 所有节拍用 ctx.currentTime 前瞻调度，不用 setTimeout
   - 不支持 AudioContext 时全部静默 no-op，不影响主逻辑
   ========================================================= */
window.SFX = (function(){
"use strict";

var MUTE_KEY = "beginAgain.muted";
var VOLUME   = 0.35;          // 主音量（默认开，静音的页面等于没做音效）

var ctx = null, master = null, ready = false, dead = false;
var muted = false;
var lastAt = {};              // 节流时间戳
var _nb = null, _wavUrl = null;

try{ muted = localStorage.getItem(MUTE_KEY) === "1"; }catch(e){}

function supported(){ return !!(window.AudioContext || window.webkitAudioContext); }
function can(){ return ready && !dead && !muted && ctx && ctx.state !== "closed"; }

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
    for(var i = 0; i < n; i++) dv.setInt16(44 + i * 2, 0, true);
    _wavUrl = URL.createObjectURL(new Blob([buf], { type:"audio/wav" }));
  }catch(e){ _wavUrl = null; }
  return _wavUrl;
}

function init(){
  if(dead) return;
  if(!supported()){ dead = true; return; }
  try{
    if(!ctx){
      var AC = window.AudioContext || window.webkitAudioContext;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = VOLUME;
      master.connect(ctx.destination);
    }
    if(ctx.state === "suspended") ctx.resume();
    ready = true;
    var url = silentWavUrl();
    if(url){
      var a = new Audio(url);
      a.muted = true;               // 内容本来就是静音，只为切换音频会话
      var pr = a.play();
      if(pr && pr.catch) pr.catch(function(){});
    }
  }catch(e){ dead = true; }
}

/* ---------- 基础合成 ---------- */
function tone(o){
  if(!can()) return;
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
    osc.connect(g); g.connect(master);
    osc.start(t0); osc.stop(t0 + dur + 0.03);
  }catch(e){}
}
function noise(o){
  if(!can()) return;
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
    src.connect(f); f.connect(g); g.connect(master);
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
/* 打错：忙音下滑 */
function wrong(){
  tone({ freq:200, to:110, type:"square", dur:0.26, gain:0.16 });
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
/* 彩带：长噪声扫频 + 5 声随机小爆 */
function confetti(){
  noise({ dur:0.9, filter:"bandpass", freq:600, to:3600, gain:0.14 });
  for(var i = 0; i < 5; i++){
    noise({ dur:0.05, filter:"highpass", freq:5200, gain:0.1, delay:0.15 + Math.random() * 1.1 });
  }
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
  isMuted: function(){ return muted; },
  setMuted: setMuted,
  toggle: toggle,
  isDead: function(){ return dead; },
  tap: tap, dial: dial, connected: connected, wrong: wrong,
  key: key, tick: tick,
  kick: kick, snare: snare, hihat: hihat,
  l3Action: l3Action, l3CountIn: l3CountIn,
  perfect: perfect, miss: miss,
  fragment: fragment, flip: flip,
  unlock: unlock, confetti: confetti
};
})();
