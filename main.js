/* =========================================================
   《begin again》主逻辑
   - 所有文案 / 参数 / 颜色集中在 CONFIG 对象
   - 进度保存在 localStorage（键 beginAgain.progress）
   - 原生 HTML + CSS + JS，无框架 / 引擎 / 外部素材
   ========================================================= */
(function(){
"use strict";

/* ==================== ① 全局配置区 ==================== */
const CONFIG = {

  // 主题（新野兽派主干 × 孟菲斯细节）。改这里即可整体换视觉。
  THEME: {
    bg: "#F4F0EA",          // 米卡其背景
    ink: "#1A1A1A",         // 文字主色
    note: "#FFF6D8",        // 便签黄
    muted: "#8a8377",       // 次要文字（灰暖）
    faint: "#b6afa3",       // 更淡的辅助文字
    card: "#ffffff",        // 卡片底
    chatBg: "#ededed",      // 聊天界面底（微信灰）
    chatHeaderBg: "#f6f6f6",
    selfBubble: "#95ec69",  // 微信「自己」气泡绿
    accents: ["#FFDE59", "#38B2C8", "#FF5E97", "#22463A"], // 高能黄 / 深电光蓝 / 芭比粉 / 深墨绿
    // 关卡内点缀色（与 CSS 变量 --cyan / --neon / --purple 对应，改这里换肤同步生效）
    cyan: "#5CE1E6",
    neon: "#A3FF73",
    purple: "#C77DFF",
    optionPalette: ["#E0A800","#0E8FA3","#D52E68","#2E9E4F","#DC5F7E","#6F52D6","#2775C9","#E5842A","#259E7B","#A449CC"],
    success: "#3DDC84",
    danger: "#E45D54",
    frame: "#26262b",       // 手机外框机身色
    frameRadius: 44,
    radiusSm: 12,
    radiusLg: 18,
    softShadow: "0 6px 20px rgba(26,26,26,0.08)",
    liftShadow: "0 14px 34px rgba(26,26,26,0.16)",
  },

  password: [1, 1, 2, 2],   // 最终密码（按关卡顺序）
  workDays: 1122,           // 在岗天数
  workDates: { start: "2023.10.05", end: "2026.10.30" },

  groupName: "中山大家庭(500)",
  hallTitle: "🏰 记忆结界",
  hallSubtitle: "找回 4 枚记忆碎片，修复时间线",
  lockHint: "请按照正确的时间线获取碎片",

  cheat: { label: "😏 我要作弊" },
  collectLabel: "收下碎片",
  backLabel: "← 返回结界",

  // 开场群聊脚本（定稿版）
  openingChat: {
    // 玩家（自己，绿色气泡）开场第一句，办公室女头像
    player: { avatar: "👩‍💼", text: "国庆假期过得好快啊！想念！😢" },
    // 时空乱流后的系统提示（参考 vivian 的粉色闪烁提示）
    sysAlert: "⚠️系统提示：遭遇时空乱流",
    // 穿越后看到的「过去」消息（白色气泡，别人发的）
    messages: [
      { avatar: "👨‍⚕️", text: "对啊！疫情过后的第一个国庆，居然哪儿也没去！🤷" },
      { avatar: "🤵", text: "俺也一样！" },
      { avatar: "👨‍🎓", text: "大家好，我是今天刚入职的🐘🐏，\n之后大家多多关照！🙏", likes: 3 },
    ],
    innerThought: ["咦？疫情？刚入职？这是哪一年？", { a:"难道……", b:"我<b class=\"hl\">穿越</b>了？⚡" }],
    guide: "到底发生什么事了？\n勇敢智慧的你，请点击下方按钮，进入结界，\n找回 4 枚<b class=\"glow-word\">【碎片】</b>修复时间线！",
    likeCount: "24人已点赞",
    enterLabel: "🧙‍♂️ 进入结界 🧙‍♂️",
    // 开场时序（毫秒）
    timing: {
      firstMsg: 1500,     // 打开后玩家第一句
      glitch: 3500,       // 时空乱流（第一句后 2s）
      sysAlert: 5500,     // 系统提示（乱流后 2s，慢一点）
      othersStart: 7500,  // 第二句（每条间隔 2s）
      othersGap: 2000,
      likeGap: 420,       // 每个点赞间隔
      likesDelay: 2000,   // 最后一句到点赞的间隔
      thoughtDelay: 2000, // 点赞完成到内心 OS 第一句
      thought2Delay: 2000,// 内心 OS 第一句到第二句
      guideDelay: 2000,   // 内心 OS 到引导的间隔
    },
  },

  // 大厅密码入口
  hallPassword: {
    lockedTitle: "终极密码",
    lockedSub: "收集全部碎片后解锁",
    readyTitle: "终极密码",
    readySub: "碎片已集齐，点击进入",
  },

  // 页面 C 文案
  passwordPage: {
    title: "最后的密码",
    desc: ["你已经收集齐了所有碎片。", "输入它们组成的密码。"],
    unlockLabel: "解锁",
    wrong: "密码不正确，看看碎片再想想",
    retry: "再试一次",
    correct: "密码正确。",
  },

  // 页面 D
  finalPage: {
    unit: "天",
  },

  // 四个关卡
  levels: [
    {
      id: 1, year: 2023, emoji: "📞", title: "初来乍到",
      fragment: 1, fragmentName: "入职碎片",
      tagline: "入职第一天，先打个电话报个到。",
      accentIndex: 0,
      intro: ["👂 听说组织部来了个年轻人。", "📞 快打电话问问看是谁吧。"],
      hint: "请拨通正确的电话号码",
      correctNumber: "88374924",
      digitLength: 8,
      phonebookTitle: "☎️中山医院通讯录",
      phonebookTimeout: 3, // 秒
      phonebook: [
        { dept: "医务科",       num: "88393518" },
        { dept: "组织部",       num: "88374924" },
        { dept: "宣传部",       num: "88374900" },
        { dept: "人力资源部",   num: "88393517" },
        { dept: "质管部",       num: "88374923" },
        { dept: "纪检监察室",   num: "88393503" },
        { dept: "门诊办公室",   num: "88393501" },
        { dept: "急诊科",       num: "88393555" },
        { dept: "信息中心",     num: "88393588" },
        { dept: "护理部",       num: "88393502" },
        { dept: "麻醉科",       num: "88393568" },
        { dept: "消化内科",     num: "88393583" },
        { dept: "骨伤科",       num: "88393543" },
        { dept: "临床药学",     num: "88374926" },
      ],
      wrongLines: [
        "您好，这里不是组织部。",
        "啊，是书记啊？对不起打错了！",
        "你这么一打，全院都听见了。",
        "这号码……是你编的吗？",
      ],
      dialLines: ["☎️ 正在拨号……", "嘟……接通📞", "「您好，组织部。」", "「听说你们来了个年轻人？」"],
      success: "<b class=\"glow-word\">🎉 联系成功！</b>",
    },
    {
      id: 2, year: 2024, emoji: "💻", title: "好的，收到",
      fragment: 1, fragmentName: "牛马碎片",
      tagline: "那一年，你独当一面。",
      accentIndex: 1,
      intro: [
        "一个风平浪静的下午。🍵",
        "下班前一小时，领导叫住了你：",
        "<b class=\"red-flash\">「这份材料，今天内交给我。」🧨</b>",
        "既然如此，我和你拼了！💪",
      ],
      targetHits: 25,
      countdownSeconds: 5,
      blockChar: "█",
      paperTitle: "████████████",
      achievementName: "“先进个人”最速传说",
      success: "🎉 任务完成，恭喜准点下班！",
    },
    {
      id: 3, year: 2025, emoji: "🕺", title: "像你这样的朋友",
      fragment: 2, fragmentName: "唱跳碎片",
      tagline: "同事，有一天变成了朋友。",
      accentIndex: 2,
      awardName: "最受观众喜爱节目奖",
      intro: [
        "「下一个表演，《像你这样的朋友》。」",
        "😖 你站在年会后台，突然有点紧张。",
        "🎵 音乐 ready，站位 check。",
        "💓 IT'S SHOW TIME.",
      ],
      actions: ["🙋‍♂️", "💁‍♂️", "🙆‍♂️", "🙅‍♂️", "🧏‍♂️", "🤷‍♂️", "👫", "🙇"],
      hint: "按MUSIC开始表演\n在完美的时机点击圆圈做出动作",
      musicBtn: "MUSIC!",
      missText: ["哎呀，不小心忘记动作了。", "没关系，你永远可以从头来过。"],
    },
    {
      id: 4, year: 2026, emoji: "🧳", title: "最终任务",
      fragment: 2, fragmentName: "未来碎片",
      tagline: "离开之前，最后的选择。",
      accentIndex: 3,
      intro: [
        "终于走到这一天了。🌅",
        "我即将离开这里。🚪",
        "请从下面十件东西中，",
        "选择我最重要的<b class=\"hl-word\">三样东西</b>带走吧。🤔",
      ],
      options: [
        { e: "❤️", n: "热爱" },
        { e: "👥", n: "朋友" },
        { e: "💭", n: "回忆" },
        { e: "🕊️", n: "自由" },
        { e: "💰", n: "金钱" },
        { e: "🧠", n: "经验" },
        { e: "🏆", n: "成就" },
        { e: "🚀", n: "执行力" },
        { e: "🎨", n: "创造力" },
        { e: "🛡️", n: "责任感" },
      ],
      maxSelect: 3,
      startLabel: "开始",
      confirmTitle: "确认带走？",
      thanksPrefix: "💘谢谢你留给我",
      thanksTail: "你的选择就是<b class=\"glow-word\">唯一的正确答案</b>。🎯",
      dropText: "最后一个碎片缓缓掉落。",
    },
  ],

  // 最终纪念文案（占位，作者替换 FINAL_MESSAGE 即可）
  finalMessage: [
    "这里是《begin again》的最终留言占位。作者把想对同事们说的话写在这里，逐段替换即可。",
    "三年，一千一百二十二天，我们从「好的，收到」写到了「像你这样的朋友」。",
    "谢谢你陪我走过这 1122 天。",
  ],
};

/* ==================== ② 主题注入 ==================== */
const T = CONFIG.THEME;
(function applyTheme(){
  const r = document.documentElement.style;
  r.setProperty("--bg", T.bg);
  r.setProperty("--ink", T.ink);
  r.setProperty("--note", T.note);
  r.setProperty("--muted", T.muted);
  r.setProperty("--faint", T.faint);
  r.setProperty("--card", T.card);
  r.setProperty("--chatbg", T.chatBg);
  r.setProperty("--chatheader", T.chatHeaderBg);
  r.setProperty("--self", T.selfBubble);
  r.setProperty("--success", T.success);
  r.setProperty("--danger", T.danger);
  r.setProperty("--frame", T.frame);
  r.setProperty("--frame-radius", T.frameRadius + "px");
  r.setProperty("--radius-sm", T.radiusSm + "px");
  r.setProperty("--radius-lg", T.radiusLg + "px");
  r.setProperty("--soft-shadow", T.softShadow);
  r.setProperty("--lift-shadow", T.liftShadow);
  T.accents.forEach((c, i) => r.setProperty("--a" + (i + 1), c));
  r.setProperty("--cyan", T.cyan);
  r.setProperty("--neon", T.neon);
  r.setProperty("--purple", T.purple);
})();

/* 辅助 */
const $ = (id) => document.getElementById(id);
const randi = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const levelById = (id) => CONFIG.levels.find(l => l.id === id);
const accentOf = (lvl) => T.accents[lvl.accentIndex];
const vibrate = (ms) => { try{ navigator.vibrate && navigator.vibrate(ms); }catch(e){} };
function shuffle(arr){
  const a = [...arr];
  for(let i = a.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ==================== ③ 进度存档 ==================== */
const STORE_KEY = "beginAgain.progress";
function defaultProgress(){
  return { level1:{done:false,fragment:null}, level2:{done:false,fragment:null},
           level3:{done:false,fragment:null}, level4:{done:false,fragment:null},
           finalVisited:false };
}
/* localStorage 可能被环境禁用（沙箱 iframe / file:// 限制 / 隐私模式）。
   原实现一旦 getItem 抛错就返回空白默认，于是「通关下一关时会把上一关的进度冲掉」。
   现在改成本地存储优先、内存兜底：存储不可用时至少同一会话内进度不丢。 */
let _memRaw = null, _storeOK = true;
function readRaw(){
  try{
    const v = localStorage.getItem(STORE_KEY);
    if(v !== null) return v;
  }catch(e){ _storeOK = false; }
  return _memRaw;
}
function writeRaw(v){
  _memRaw = v;                       // 先写内存，保证本会话一定在
  try{ localStorage.setItem(STORE_KEY, v); _storeOK = true; }
  catch(e){
    if(_storeOK){
      _storeOK = false;
      console.warn("[begin again] localStorage 不可用，进度只保存在当前会话（刷新会丢）。建议用本地 http 服务打开页面。");
    }
  }
}
function clearRaw(){
  _memRaw = null;
  try{ localStorage.removeItem(STORE_KEY); }catch(e){}
}
function loadProgress(){
  const raw = readRaw();
  if(!raw) return defaultProgress();
  try{
    return Object.assign(defaultProgress(), JSON.parse(raw));
  }catch(e){ return defaultProgress(); }
}
function saveProgress(p){
  writeRaw(JSON.stringify(p));
}
/* 以当前内存进度为底本，绝不重新读存储，避免存储异常时丢进度 */
function commitProgress(mut){
  const p = Object.assign({}, progress);
  mut(p);
  saveProgress(p);
  progress = p;
  return p;
}
const allDone = (p) => ["level1","level2","level3","level4"].every(k => p[k].done);
const fragsCollected = (p) => CONFIG.levels.filter(l => p["level"+l.id].done).length;

let progress = loadProgress();
let failCounts = { 1:0, 2:0, 3:0 };  // 失败计数（内存，作弊后清零）
let justCompleted = null;            // 刚通关的关卡，用于大厅闪灰动画

/* ==================== ④ 视图切换 ==================== */
const VIEWS = ["opening","hall","level1","level2","level3","level4","password","final"];
let currentView = null;
function showView(name){
  VIEWS.forEach(v => $("view-" + v).classList.remove("active"));
  const target = $("view-" + name);
  target.classList.add("active");
  target.scrollTop = 0;
  currentView = name;
  // 音效开关只在非开场页出现（开场页右上角是群聊「…」）
  const sc = $("screen");
  if(sc) sc.classList.toggle("sfx-show", name !== "opening");
}
function backToHall(){
  SFX.tensionStop(); SFX.musicBoxStop();   // 离开关卡，停掉所有持续音源
  renderHall(); showView("hall");
}

/* ==================== ⑤ 弹窗 ==================== */
function openModal(html){
  const m = $("modal");
  const o = $("overlay");
  if(html !== undefined) m.innerHTML = html;
  o.classList.add("show");
}
function closeModal(){
  $("overlay").classList.remove("show");
  $("modal").classList.remove("note-mode","otp-mode");
  $("modal").style.maxHeight = "";
  // 清理键盘监听
  if(_vvHandler && window.visualViewport){
    window.visualViewport.removeEventListener("resize", _vvHandler);
    window.visualViewport.removeEventListener("scroll", _vvHandler);
    _vvHandler = null;
  }
}

/* ==================== ⑥ 孟菲斯碎屑 ==================== */
(function decor(){
  const chars = ["〰","×","●","▲","◼","~","✦","·"];
  const box = $("decor");
  let html = "";
  for(let i=0;i<16;i++){
    const c = chars[randi(0,chars.length-1)];
    const s = randi(14,34);
    const x = randi(2,96);
    const y = randi(2,96);
    const rot = randi(-40,40);
    html += `<i style="left:${x}%;top:${y}%;font-size:${s}px;transform:rotate(${rot}deg)">${c}</i>`;
  }
  box.innerHTML = html;
})();

/* ==================== ⑦ 穿越预示动画 ==================== */
function playGlitch(){
  const flash = $("flash");
  const frame = document.querySelector(".phone-frame");
  frame.classList.add("glitch");
  flash.style.opacity = "1";
  setTimeout(()=>{ flash.style.opacity = "0"; }, 220);
  setTimeout(()=>{ frame.classList.remove("glitch"); }, 760);
}

/* ==================== ⑧ 页面 A：开场叙事 ==================== */
function renderOpening(){
  const c = CONFIG.openingChat;
  const html = `
    <div class="chat">
      <div class="chat-head">
        <span class="nav">‹</span>
        <span class="gc">${CONFIG.groupName}</span>
        <span class="more">···</span>
      </div>
      <div class="chat-body" id="chat-body"></div>
    </div>`;
  $("view-opening").innerHTML = html;
  runOpening();
}
function runOpening(){
  const c = CONFIG.openingChat;
  const body = $("chat-body");
  const t = c.timing;
  const V = $("view-opening");
  const add = (html) => { body.insertAdjacentHTML("beforeend", html); V.scrollTop = V.scrollHeight; };

  // 1. 玩家（办公室女，绿色自己）第一句
  setTimeout(()=> add(`
    <div class="msg self pop">
      <div class="avatar">${c.player.avatar}</div>
      <div class="bubble">${c.player.text}</div>
    </div>`), t.firstMsg);

  // 2. 时空乱流：剧烈扭曲
  setTimeout(()=> playGlitch(), t.glitch);

  // 3. 系统提示（粉红闪烁）
  setTimeout(()=> add(`
    <div class="sys-alert"><span class="pill">${c.sysAlert}</span></div>`), t.sysAlert);

  // 4. 穿越后的他人消息（白色气泡；点赞框不在渲染时占位）
  c.messages.forEach((m, i) => {
    setTimeout(()=> add(`
      <div class="msg pop">
        <div class="avatar">${m.avatar}</div>
        <div class="bubble">${m.text}</div>
      </div>`), t.othersStart + i * t.othersGap);
  });

  // 5. 点赞：随第一个赞一起出现气泡底部框（下一行），气泡自适应变宽
  const last = c.messages[c.messages.length - 1];
  if(last.likes){
    const likesAt = t.othersStart + (c.messages.length - 1) * t.othersGap + t.likesDelay;
    const totalLikes = parseInt(c.likeCount, 10) || last.likes;  // 24
    for(let k = 0; k < last.likes; k++){
      setTimeout(()=>{
        const bubbles = document.querySelectorAll("#chat-body .msg .bubble");
        const lastBubble = bubbles[bubbles.length - 1];
        if(!lastBubble) return;
        // 每蹦出一个👍，人数 +1：22 → 23 → 24
        const countNow = totalLikes - last.likes + 1 + k;
        let box = lastBubble.querySelector(".like-box");
        if(!box){
          lastBubble.insertAdjacentHTML("beforeend", `<div class="like-box"><span class="like-pop">👍</span><span class="like-count">${countNow}人已点赞</span></div>`);
        } else {
          const pop = document.createElement("span");
          pop.className = "like-pop"; pop.textContent = "👍";
          box.insertBefore(pop, box.querySelector(".like-count"));
          box.querySelector(".like-count").textContent = countNow + "人已点赞";
        }
        lastBubble.classList.add("has-likes");
        V.scrollTop = V.scrollHeight;
      }, likesAt + k * t.likeGap);
    }
  }

  // 6. 内心 OS（点赞完 → 2s → 第一句 → 2s → 第二句）
  const th1 = c.innerThought[0];
  const th2 = c.innerThought[1];
  const lastAt = t.othersStart + (c.messages.length - 1) * t.othersGap;
  const likesEnd = last.likes ? (lastAt + t.likesDelay + (last.likes - 1) * t.likeGap) : lastAt;
  const th1At = likesEnd + t.thoughtDelay;
  const th2At = th1At + t.thought2Delay;
  const guideAt = th2At + t.guideDelay;

  setTimeout(()=> add(`<div class="mono pop" id="mono-box"><p>${th1}</p></div>`), th1At);
  setTimeout(()=>{
    const box = $("mono-box");
    if(box) box.insertAdjacentHTML("beforeend", `<p>${th2.a}<span class="mono-b fade-in">${th2.b}</span></p>`);
  }, th2At);
  setTimeout(()=>{
    const el = document.querySelector(".mono-b"); if(el) el.classList.add("on");
  }, th2At + 700);

  // 7. 引导 + 按钮
  setTimeout(()=>{
    add(`
    <div class="guide pop">
      <div class="guide-box">
        <div class="guide-text">${c.guide}</div>
        <button class="btn btn-primary btn-block" id="btn-enter">${c.enterLabel}</button>
      </div>
    </div>`);
    const b = $("btn-enter");
    if(b) b.addEventListener("click", () => {
      SFX.init();               // 必须在用户手势里初始化（浏览器自动播放策略）
      SFX.tap();
      initHallYear();           // 落在第一个还没通关的年份
      renderHall(); showView("hall");
    });
  }, guideAt);
}

/* ==================== ⑨ 页面 B：回忆大厅（同一间办公室 · 四年） ==================== */
/* 设计要点：
   - 四屏共用同一套「墙 / 窗 / 门 / 桌 / 椅 / 地板」，这是「同一间房」的锚点
   - 年份靠两条隐藏线索读出来：墙上挂钟的时刻 + 窗外的天色
   - 可点物带暖黄柔光呼吸（.hs-hot），未解锁的物不发光 */
let hallYear = 2023;

function levelByYear(y){ return CONFIG.levels.find(l => l.year === y) || CONFIG.levels[0]; }
function isLevelUnlocked(id){
  const p = progress;
  return p["level" + id].done || id === 1 || p["level" + (id - 1)].done;
}
/* 进大厅时落在「第一个还没通关的年份」 */
function initHallYear(){
  const un = CONFIG.levels.find(l => !progress["level" + l.id].done);
  hallYear = (un || CONFIG.levels[CONFIG.levels.length - 1]).year;
}
function curHallLevel(){ return levelByYear(hallYear); }

/* 挂钟：四年指四个时刻 —— 8:00 / 16:30 / 21:00 / 5:00 */
const HALL_CLOCK = { 2023: [8, 0], 2024: [16, 30], 2025: [21, 0], 2026: [5, 0] };
function clockHands(y){
  const t = HALL_CLOCK[y] || [8, 0];
  const cx = 118, cy = 50, R = 13;
  const ha = ((t[0] % 12) + t[1] / 60) * Math.PI / 6;
  const ma = t[1] * Math.PI / 30;
  const hx = cx + Math.sin(ha) * R * 0.5, hy = cy - Math.cos(ha) * R * 0.5;
  const mx = cx + Math.sin(ma) * R * 0.82, my = cy - Math.cos(ma) * R * 0.82;
  return `<line x1="${cx}" y1="${cy}" x2="${hx.toFixed(1)}" y2="${hy.toFixed(1)}" stroke="#5F5E5A" stroke-width="1.8" stroke-linecap="round"/>`
       + `<line x1="${cx}" y1="${cy}" x2="${mx.toFixed(1)}" y2="${my.toFixed(1)}" stroke="#5F5E5A" stroke-width="1" stroke-linecap="round"/>`;
}

/* 窗外：白天 → 下午的太阳 → 夜里的礼堂灯 → 黄昏 */
function windowSky(y){
  const box = 'x="22" y="26" width="62" height="52"';
  if(y === 2023) return `<rect ${box} fill="#DDEEFB"/>
    <ellipse cx="42" cy="44" rx="11" ry="5" fill="#FFFFFF" opacity=".92"/>
    <ellipse cx="53" cy="46" rx="8" ry="4" fill="#FFFFFF" opacity=".92"/>
    <ellipse cx="72" cy="68" rx="9" ry="4" fill="#FFFFFF" opacity=".7"/>`;
  if(y === 2024) return `<rect ${box} fill="#FFE2B4"/>
    <circle cx="72" cy="44" r="16" fill="#FFD166" opacity=".28"/>
    <circle cx="72" cy="44" r="9" fill="#FFC24D"/>`;
  if(y === 2025) return `<rect ${box} fill="#3A2350"/>
    <rect x="22" y="58" width="62" height="20" fill="#2A1840" opacity=".72"/>
    <circle cx="36" cy="40" r="2" fill="#FFDE59"/>
    <circle cx="48" cy="35" r="1.5" fill="#FF9BB5"/>
    <circle cx="60" cy="43" r="1.5" fill="#5DCAA5"/>
    <circle cx="72" cy="37" r="1.8" fill="#FFDE59"/>`;
  return `<rect ${box} fill="#F7BE8A"/>
    <circle cx="52" cy="70" r="16" fill="#FFD9A0" opacity=".35"/>
    <circle cx="52" cy="70" r="10" fill="#FFB067"/>
    <rect x="22" y="74" width="62" height="4" fill="#E08A4A" opacity=".45"/>`;
}

/* 门：2024 挂白大褂，2026 露出四位数字锁 */
function doorSVG(y, ready){
  const lock = (y === 2026) ? `
    <rect x="278" y="64" width="38" height="24" rx="3" fill="#F6E7C1" stroke="#BA7517" stroke-width="1.2"/>
    ${[0,1,2,3].map(i => `<rect x="${283 + i * 8}" y="70" width="5" height="12" rx="1" fill="#BA7517" opacity="${ready ? .95 : .32}"/>`).join("")}
  ` : "";
  const coat = (y === 2024) ? `
    <path d="M286 74 Q297 64 308 74 L313 122 Q297 129 281 122 Z" fill="#FFFFFF" stroke="#B4B2A9" stroke-width="1"/>
    <path d="M292 71 L297 80 L302 71" fill="none" stroke="#B4B2A9" stroke-width="1"/>
    <line x1="297" y1="64" x2="297" y2="57" stroke="#B4B2A9" stroke-width="1.4"/>
  ` : "";
  return `
    <rect x="270" y="54" width="54" height="142" rx="2" fill="#FFFDF6" stroke="#B4B2A9" stroke-width="1.2"/>
    <rect x="276" y="62" width="42" height="52" rx="2" fill="none" stroke="#E7DFCF"/>
    <rect x="276" y="130" width="42" height="52" rx="2" fill="none" stroke="#E7DFCF"/>
    <circle cx="314" cy="122" r="2.4" fill="#B4B2A9"/>
    ${lock}${coat}`;
}

/* 椅子：2023 推向一边 · 2026 推回桌下（画在桌子后面，只露出椅背） */
function chairSVG(y){
  if(y === 2026){
    return `<g><rect x="146" y="124" width="7" height="34" rx="2" fill="#D9D2C4" stroke="#B4B2A9" stroke-width="1"/></g>`;
  }
  const g = `
    <rect x="196" y="158" width="34" height="11" rx="3" fill="#D9D2C4" stroke="#B4B2A9" stroke-width="1"/>
    <rect x="222" y="126" width="7" height="34" rx="2" fill="#D9D2C4" stroke="#B4B2A9" stroke-width="1"/>
    <rect x="200" y="169" width="5" height="27" fill="#B4B2A9"/>
    <rect x="222" y="169" width="5" height="27" fill="#B4B2A9"/>`;
  return y === 2023 ? `<g transform="rotate(-9 213 180)">${g}</g>` : `<g>${g}</g>`;
}

/* 整个房间的矢量图（随容器宽度等比缩放，天然适配竖屏） */
function roomSVG(){
  const lv = curHallLevel(), y = lv.year, p = progress;
  const ready = allDone(p);
  const glow = (cx, cy, rx, ry) => `<ellipse class="hs-glow" cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"/>`;
  let hot = "", props = "", stamp = "";

  if(y === 2023){
    stamp = "2023.10";
    hot = `<g class="hs-hot${isLevelUnlocked(1) ? "" : " is-locked"}" data-lv="1" role="button" aria-label="打电话">
      ${glow(51, 138, 30, 22)}
      <rect x="34" y="131" width="34" height="19" rx="3" fill="#F6E7C1" stroke="#BA7517" stroke-width="1.6"/>
      <circle cx="44" cy="140" r="1.7" fill="#BA7517"/><circle cx="51" cy="140" r="1.7" fill="#BA7517"/><circle cx="58" cy="140" r="1.7" fill="#BA7517"/>
      <circle cx="44" cy="146" r="1.7" fill="#BA7517"/><circle cx="51" cy="146" r="1.7" fill="#BA7517"/><circle cx="58" cy="146" r="1.7" fill="#BA7517"/>
      <rect x="32" y="123" width="38" height="8" rx="4" fill="#BA7517"/>
      <rect x="36" y="120" width="6" height="5" rx="2" fill="#BA7517"/>
      <rect x="60" y="120" width="6" height="5" rx="2" fill="#BA7517"/>
    </g>`;
    props = `
      <rect x="74" y="138" width="16" height="12" rx="1" fill="#FFFFFF" stroke="#B4B2A9" stroke-width="1"/>
      <line x1="77" y1="143" x2="87" y2="143" stroke="#B4B2A9" stroke-width=".8"/>
      <rect x="96" y="133" width="13" height="17" rx="2" fill="#EAF3DE" stroke="#97C459" stroke-width="1"/>
      <rect x="116" y="142" width="15" height="8" fill="#FFE08A"/>
      <rect x="268" y="150" width="54" height="46" fill="#EFE9DC" stroke="#B4B2A9" stroke-width="1"/>
      <line x1="268" y1="170" x2="322" y2="170" stroke="#D3D1C7"/>
      <rect x="40" y="206" width="50" height="50" fill="#EFE9DC" stroke="#B4B2A9" stroke-width="1"/>
      <line x1="65" y1="206" x2="65" y2="256" stroke="#D3D1C7"/>
      <rect x="96" y="218" width="38" height="38" fill="#EFE9DC" stroke="#B4B2A9" stroke-width="1"/>`;
  } else if(y === 2024){
    stamp = "2024.09";
    hot = `<g class="hs-hot${isLevelUnlocked(2) ? "" : " is-locked"}" data-lv="2" role="button" aria-label="敲键盘">
      ${glow(66, 118, 44, 34)}
      <rect x="30" y="92" width="66" height="50" rx="3" fill="#FFFDF6" stroke="#BA7517" stroke-width="1.8"/>
      <rect x="35" y="97" width="56" height="40" rx="2" fill="#F7F4EC"/>
      <line x1="41" y1="105" x2="80" y2="105" stroke="#CFC9BB" stroke-width="2.4"/>
      <line x1="41" y1="113" x2="86" y2="113" stroke="#CFC9BB" stroke-width="2.4"/>
      <line x1="41" y1="121" x2="72" y2="121" stroke="#CFC9BB" stroke-width="2.4"/>
      <rect x="57" y="142" width="12" height="8" fill="#BA7517"/>
      <rect x="88" y="97" width="9" height="9" fill="#FFE08A"/>
      <rect x="89" y="108" width="7" height="7" fill="#FFD166"/>
    </g>`;
    props = `
      <rect x="104" y="140" width="54" height="8" rx="2" fill="#FFFDF6" stroke="#B4B2A9" stroke-width="1"/>
      <line x1="110" y1="144" x2="152" y2="144" stroke="#DCD6C9" stroke-width="1.6"/>
      <rect x="160" y="132" width="26" height="16" fill="#F7F4EC" stroke="#B4B2A9" stroke-width="1"/>
      <line x1="163" y1="137" x2="183" y2="137" stroke="#CFC9BB"/>
      <line x1="163" y1="142" x2="181" y2="142" stroke="#CFC9BB"/>`;
  } else if(y === 2025){
    stamp = "2025.12";
    hot = `<g class="hs-hot${isLevelUnlocked(3) ? "" : " is-locked"}" data-lv="3" role="button" aria-label="点墙上的海报">
      ${glow(200, 52, 60, 44)}
      <rect x="150" y="18" width="100" height="68" rx="3" fill="#FBEAF0" stroke="#BA7517" stroke-width="2.2"/>
      <text x="200" y="41" text-anchor="middle" font-size="17" font-weight="700" fill="#993556">中山春晚</text>
      <path d="M176 74 L200 52 L224 74 Z" fill="#C77DFF" opacity=".92"/>
      <circle cx="184" cy="62" r="2" fill="#FFDE59"/>
      <circle cx="216" cy="64" r="2" fill="#FF9BB5"/>
      <line x1="176" y1="80" x2="224" y2="80" stroke="#E4A9BE" stroke-width="1.4"/>
    </g>`;
    props = `
      <path d="M18 14 Q50 26 82 14 Q114 26 146 14" fill="none" stroke="#FF9BB5" stroke-width="1.2"/>
      <circle cx="50" cy="24" r="2.2" fill="#FFDE59"/>
      <circle cx="82" cy="16" r="2.2" fill="#5DCAA5"/>
      <circle cx="114" cy="24" r="2.2" fill="#C77DFF"/>
      <rect x="44" y="120" width="16" height="16" rx="3" fill="#FAC775" stroke="#BA7517" stroke-width="1"/>
      <path d="M44 124 Q36 126 38 132 Q39 136 44 136" fill="none" stroke="#BA7517" stroke-width="1.4"/>
      <path d="M60 124 Q68 126 66 132 Q65 136 60 136" fill="none" stroke="#BA7517" stroke-width="1.4"/>
      <rect x="50" y="136" width="4" height="9" fill="#BA7517"/>
      <rect x="42" y="145" width="20" height="5" rx="1" fill="#BA7517"/>
      <path d="M40 224 Q66 212 92 224" fill="none" stroke="#C77DFF" stroke-width="2.6"/>
      <path d="M104 242 Q132 230 160 242" fill="none" stroke="#FFDE59" stroke-width="2.6"/>
      <circle cx="130" cy="92" r="9" fill="#FF9BB5"/>
      <line x1="130" y1="101" x2="130" y2="120" stroke="#B4B2A9"/>
      <circle cx="145" cy="74" r="7" fill="#5DCAA5"/>
      <line x1="145" y1="81" x2="145" y2="98" stroke="#B4B2A9"/>`;
  } else {
    stamp = "2026.10";
    hot = `<g class="hs-hot${ready ? "" : " is-locked"}" data-pw="1" role="button" aria-label="那扇门">
      ${ready ? glow(297, 125, 40, 84) : `<ellipse class="hs-glow" cx="297" cy="125" rx="40" ry="84" style="animation:none;opacity:0"/>`}
      <rect x="270" y="54" width="54" height="142" rx="2" fill="transparent"/>
    </g>
    <g class="hs-hot${ready ? "" : " is-locked"}" data-lv="4" role="button" aria-label="行李箱">
      ${ready ? glow(68, 228, 40, 42) : `<ellipse class="hs-glow" cx="68" cy="228" rx="40" ry="42" style="animation:none;opacity:0"/>`}
      <rect x="40" y="196" width="56" height="62" rx="5" fill="#F4F0EA" stroke="#BA7517" stroke-width="1.8"/>
      <rect x="56" y="186" width="24" height="11" rx="4" fill="none" stroke="#BA7517" stroke-width="1.8"/>
      <line x1="40" y1="226" x2="96" y2="226" stroke="#B4B2A9" stroke-width="1"/>
    </g>`;
    props = `
      <rect x="150" y="18" width="100" height="68" rx="3" fill="#F3EDE1" stroke="#DED7C8" stroke-width="1" stroke-dasharray="4 4"/>
      <circle cx="64" cy="146" r="3" fill="none" stroke="#8A8377" stroke-width="1.4"/>
      <line x1="67" y1="146" x2="78" y2="146" stroke="#8A8377" stroke-width="1.4"/>
      <rect x="110" y="210" width="44" height="48" fill="#EFE9DC" stroke="#B4B2A9" stroke-width="1"/>
      <line x1="132" y1="210" x2="132" y2="258" stroke="#D3D1C7"/>
      <text x="114" y="238" font-size="13" fill="#8A8377">谢谢</text>`;
  }

  const doorInHot = (y === 2026);

  return `<svg class="hs-svg" viewBox="0 0 340 262" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${y} 年的办公室">
    <rect x="0" y="0" width="340" height="196" fill="#FBF7F0"/>
    <rect x="0" y="196" width="340" height="66" fill="#F0EADD"/>
    <line x1="0" y1="196" x2="340" y2="196" stroke="#DED7C8" stroke-width="1"/>
    <line x1="0" y1="186" x2="268" y2="186" stroke="#E7E0D1" stroke-width="2"/>
    <line x1="0" y1="216" x2="340" y2="216" stroke="#E7E0D1" stroke-width="1" opacity=".55"/>
    <line x1="0" y1="238" x2="340" y2="238" stroke="#E7E0D1" stroke-width="1" opacity=".55"/>

    ${windowSky(y)}
    <rect x="22" y="26" width="62" height="52" fill="none" stroke="#B4B2A9" stroke-width="2.4"/>
    <line x1="53" y1="26" x2="53" y2="78" stroke="#B4B2A9" stroke-width="1.6"/>
    <line x1="22" y1="52" x2="84" y2="52" stroke="#B4B2A9" stroke-width="1.6"/>

    <circle cx="118" cy="50" r="13" fill="#FFFFFF" stroke="#B4B2A9" stroke-width="1.6"/>
    ${clockHands(y)}
    <circle cx="118" cy="50" r="1.4" fill="#5F5E5A"/>

    ${doorInHot ? "" : doorSVG(y, ready)}
    ${chairSVG(y)}

    <rect x="22" y="150" width="188" height="8" rx="1" fill="#E4DED1" stroke="#B4B2A9" stroke-width="1"/>
    <rect x="28" y="158" width="6" height="38" fill="#B4B2A9"/>
    <rect x="192" y="158" width="6" height="38" fill="#B4B2A9"/>
    ${props}
    ${hot}
    ${doorInHot ? doorSVG(y, ready) : ""}

    <text x="330" y="252" text-anchor="end" font-size="13" font-family="ui-monospace,monospace" fill="#C8834A" opacity=".85">${stamp}</text>
  </svg>`;
}

function hallHintText(lv, ready){
  const id = lv.id;
  if(id === 1) return "点那部发光的座机";
  if(id === 2) return "点那台发光的显示器";
  if(id === 3) return "点墙上那张《中山春晚》";
  if(ready) return "点那扇门，或行李箱";
  if(!isLevelUnlocked(4)) return "这个房间还空着 —— 先把前面的年份找回来";
  return "点发光的行李箱；集齐碎片后门也会亮";
}

function renderHall(){
  const lv = curHallLevel();
  const st = progress["level" + lv.id];
  const done = st.done;
  const ready = allDone(progress);

  const tabs = CONFIG.levels.map(l => {
    const lvSt = progress["level" + l.id];
    const un = lvSt.done || l.id === 1 || progress["level" + (l.id - 1)].done;
    let cls = "hall2-tab";
    if(l.year === hallYear) cls += " on";
    if(lvSt.done) cls += " done";
    if(!un) cls += " locked";
    if(justCompleted === l.id) cls += " pop";
    return `<button class="${cls}" data-y="${l.year}" type="button"><b>${l.year}</b></button>`;
  }).join("");

  $("view-hall").innerHTML = `
    <div class="hall2" style="--lv-accent:${accentOf(lv)}">
      <div class="hall2-head">
        <div class="hall2-title">${CONFIG.hallTitle}</div>
        <div class="hall2-sub">${CONFIG.hallSubtitle}</div>
      </div>

      <div class="hall2-room ${justCompleted ? "just-done" : ""}">
        ${roomSVG()}
      </div>
      <div class="hall2-hint">💡 ${hallHintText(lv, ready)}</div>

      <div class="hall2-info">
        <div class="hall2-line1">
          <span class="hall2-y">${lv.year}</span>
          <span class="hall2-name">${lv.title}</span>
        </div>
        <div class="hall2-tag">${lv.tagline}</div>
        <div class="hall2-frag${done ? " on" : ""}">🧩 ${lv.fragmentName}：${done ? lv.fragment : "未获得"}</div>
      </div>

      <div class="hall2-tabs">${tabs}</div>
    </div>`;

  /* 年份切换 */
  document.querySelectorAll(".hall2-tab").forEach(btn => {
    btn.addEventListener("click", () => {
      const y = parseInt(btn.dataset.y, 10);
      if(y === hallYear) return;
      SFX.flip();
      hallYear = y;
      const keep = $("view-hall").scrollTop;
      renderHall();
      $("view-hall").scrollTop = keep;
    });
  });

  /* 房间里的可点物 */
  document.querySelectorAll(".hs-hot").forEach(g => {
    g.addEventListener("click", (e) => {
      e.stopPropagation();
      if(g.dataset.pw){
        if(allDone(progress)) openPasswordModal();
        else showLockedHint();
        return;
      }
      const id = parseInt(g.dataset.lv, 10);
      if(!isLevelUnlocked(id)){ showLockedHint(); return; }
      enterLevel(id, e.clientX, e.clientY);
    });
  });

  if(justCompleted) justCompleted = null;
}

/* 未解锁关卡点击提示 */
function showLockedHint(){
  openModal(`
    <div class="popup-head">🔒</div>
    <div class="popup-title">还没解锁</div>
    <div class="popup-body">${CONFIG.lockHint}</div>
    <div class="popup-actions"><button class="btn btn-primary btn-block" id="btn-lock-ok">好的</button></div>`);
  $("btn-lock-ok").addEventListener("click", closeModal);
}

/* 大厅背景漂浮撞色圆点 */
function hallDecorDots(){
  const colors = T.accents;
  let s = "";
  for(let i = 0; i < 22; i++){
    const c = colors[i % colors.length];
    const size = randi(6, 18);
    const x = randi(3, 90);
    const y = randi(4, 94);
    const delay = (Math.random() * 5).toFixed(2);
    const dur = (4 + Math.random() * 4).toFixed(2);
    s += `<i style="left:${x}%;top:${y}%;width:${size}px;height:${size}px;background:${c};animation-delay:${delay}s;animation-duration:${dur}s"></i>`;
  }
  return s;
}

/* ==================== 关卡专属背景 ==================== */

/* 第 1 关：百叶窗晨光 + 缓慢漂浮的办公用品 + 阳光金色尘埃 */
function dustHTML(){
  let s = "";
  for(let i = 0; i < 30; i++){
    const x = (Math.random() * 100).toFixed(1);
    const y0 = (60 + Math.random() * 40).toFixed(1);   // 从下方生成
    const rise = Math.round(200 + Math.random() * 200); // 上升 200~400px
    const dur = (4 + Math.random() * 5).toFixed(1);    // 4~9 秒
    const delay = (Math.random() * 6).toFixed(1);
    const size = (1.5 + Math.random() * 2).toFixed(1);  // 1.5~3.5px
    s += `<i class="dust" style="left:${x}%;bottom:${y0}%;width:${size}px;height:${size}px;--rise:${rise}px;animation-duration:${dur}s;animation-delay:${delay}s"></i>`;
  }
  return s;
}
function bgLevel1(){
  const items = [
    { e:"☕", x:8,  y:34, s:24, d:0,   dur:9 },
    { e:"🖊️", x:78, y:12, s:28, d:1.5, dur:11 },
    { e:"📎", x:86, y:30, s:20, d:3,   dur:8 },
    { e:"📝", x:12, y:14, s:22, d:2,   dur:10 },
    { e:"💻", x:34, y:7,  s:24, d:4,   dur:12 },
    { e:"📓", x:58, y:30, s:22, d:2.5, dur:9.5 },
    { e:"📁", x:24, y:28, s:22, d:1,   dur:10.5 },
    { e:"✏️", x:48, y:18, s:20, d:3.5, dur:8.5 },
    { e:"📏", x:70, y:6,  s:22, d:2,   dur:11.5 },
    { e:"🖇️", x:6,  y:8,  s:19, d:4.5, dur:9 },
    { e:"📮", x:90, y:16, s:21, d:.8,  dur:10 },
    { e:"🗂️", x:40, y:36, s:21, d:2.8, dur:12.5 },
  ];
  const floats = items.map(it =>
    `<i class="float-item" style="left:${it.x}%;top:${it.y}%;font-size:${it.s}px;animation-delay:${it.d}s;animation-duration:${it.dur}s">${it.e}</i>`
  ).join("");
  return `<div class="level-bg bg-1"><div class="blinds"></div><div class="dust-field">${dustHTML()}</div>${floats}</div>`;
}

/* 第 2 关：午后天空——整屏天色从午后蓝转到五点金，太阳下沉、云朵飘过（--warm 0→1） */
function bgLevel2(){
  return `<div class="level-bg bg-2" id="l2-bg">
    <div class="sky sky-day"></div>
    <div class="sky sky-dusk"></div>
    <div class="win-sun"></div>
    <span class="cloud c1">☁️</span>
    <span class="cloud c2">☁️</span>
    <span class="cloud c3">☁️</span>
  </div>`;
}

/* 第 3 关：舞台幕布 + 三束摇摆追光 + 镜面地板 + 观众手机星光 */
function bgLevel3(){
  let aud = "";
  for(let i = 0; i < 22; i++){
    const size = randi(2, 4);
    const x = randi(2, 96), y = randi(84, 97);
    const delay = (Math.random() * 3).toFixed(2);
    const dur = (2.2 + Math.random() * 2.5).toFixed(2);
    aud += `<i class="aud-star" style="left:${x}%;top:${y}%;width:${size}px;height:${size}px;animation-delay:${delay}s;animation-duration:${dur}s"></i>`;
  }
  return `<div class="level-bg bg-3" id="l3-bg">
    <div class="curtain"></div>
    <div class="spots" id="l3-spots">
      <div class="spot spot-l"></div>
      <div class="spot spot-c"></div>
      <div class="spot spot-r"></div>
    </div>
    <div class="floor-glow g1"></div>
    <div class="floor-glow g2"></div>
    <div class="floor-glow g3"></div>
    <div class="stage-floor"></div>
    ${aud}
  </div>`;
}

/* 第 4 关：暖橙夕阳 + 极透明的前三关回忆（透明度 .08~.12） */
function bgLevel4(){
  const memos = ["📞","💻","🕺","🏆","🎤","☎️","⌨️","🎵","💃","🧳","📎","☕"];
  let s = "";
  for(let i = 0; i < 10; i++){
    const e = memos[i % memos.length];
    const x = randi(4, 90), size = randi(15, 22);
    const dur = (20 + Math.random() * 12).toFixed(1);
    const delay = (-Math.random() * dur).toFixed(1); // 负延迟：进场时画面里已有回忆在飘
    const op = (0.07 + Math.random() * 0.05).toFixed(2);
    s += `<i class="memo" style="left:${x}%;top:${randi(4, 88)}%;font-size:${size}px;animation-duration:${dur}s;animation-delay:${delay}s;opacity:${op}">${e}</i>`;
  }
  let dust = "";
  for(let i = 0; i < 12; i++){
    const size = randi(2, 4);
    dust += `<i class="dust" style="left:${randi(4,94)}%;top:${randi(15,90)}%;width:${size}px;height:${size}px;animation-delay:${(Math.random()*6).toFixed(1)}s"></i>`;
  }
  return `<div class="level-bg bg-4"><div class="sun"></div><div class="rays"></div>${s}${dust}</div>`;
}

/* 通用：在指定元素位置生成一次性特效（挂在 screen 上，不受滚动影响） */
function spawnEffectAt(el, cls, html){
  const screen = $("screen");
  const sr = screen.getBoundingClientRect(), er = el.getBoundingClientRect();
  const fx = document.createElement("div");
  fx.className = cls;
  if(html) fx.innerHTML = html;
  fx.style.left = (er.left - sr.left + er.width / 2) + "px";
  fx.style.top = (er.top - sr.top + er.height / 2) + "px";
  screen.appendChild(fx);
  setTimeout(()=> fx.remove(), 1200);
  return fx;
}

/* ==================== ⑩ 关卡渲染与进入 ==================== */
function setLevelAccent(name, lvl){
  $("view-" + name).style.setProperty("--lv-accent", accentOf(lvl));
}
function enterLevel(id, clickX, clickY){
  const lvl = levelById(id);
  const accent = accentOf(lvl);
  // 涟漪穿越效果
  const screen = $("screen");
  const rect = screen.getBoundingClientRect();
  const cx = clickX !== undefined ? clickX - rect.left : rect.width / 2;
  const cy = clickY !== undefined ? clickY - rect.top : rect.height / 2;
  // 直径取「点击点到最远角」和「屏幕对角线」两者的大值，两个圆心位置都能完全盖满
  const fromClick = Math.hypot(Math.max(cx, rect.width - cx), Math.max(cy, rect.height - cy)) * 2;
  const maxR = Math.max(fromClick, Math.hypot(rect.width, rect.height));

  const overlay = document.createElement("div");
  overlay.className = "ripple-overlay";
  // 两圈水波装饰环（在下层）
  for(let i = 1; i <= 2; i++){
    const w = document.createElement("div");
    w.className = "ripple-circle w" + i;
    w.style.cssText = `left:${cx}px;top:${cy}px;width:${maxR}px;height:${maxR}px;`;
    overlay.appendChild(w);
  }
  // 实心光圈（在上层，负责转场遮挡），起点圆心通过 --sx/--sy 交给 CSS 动画
  const iris = document.createElement("div");
  iris.className = "ripple-circle iris";
  iris.style.cssText = `left:50%;top:50%;width:${maxR}px;height:${maxR}px;background:${accent};--sx:${cx}px;--sy:${cy}px;`;
  overlay.appendChild(iris);
  screen.appendChild(overlay);

  // 光圈铺满的停顿阶段（约 450ms）：此时 CSS 动画已把圆心带到屏幕正中，切换视图
  setTimeout(()=>{
    // 清空其他关卡视图
    [1,2,3,4].forEach(i => { if(i !== id) $("view-level" + i).innerHTML = ""; });
    switch(id){
      case 1: renderLevel1(lvl); break;
      case 2: renderLevel2(lvl); break;
      case 3: renderLevel3(lvl); break;
      case 4: renderLevel4(lvl); break;
    }
    showView("level" + id);
  }, 450);

  // 光圈向中心收缩消失后移除遮罩，新页面完整呈现
  setTimeout(()=>{ overlay.remove(); }, 960);
}

function levelHeader(lvl){
  return `
    <div class="view-head">
      <button class="btn btn-sm btn-ghost" id="btn-back">${CONFIG.backLabel}</button>
      <span class="spacer"></span>
    </div>
    <div class="level-head">
      <div class="level-head-emoji">${lvl.emoji}</div>
      <div class="level-head-title">${lvl.title}</div>
      <div class="level-head-year">${lvl.year}</div>
    </div>`;
}

/* ---------- 通用：结算结果 + 碎片 + 收下 ---------- */
function playResult(lvl, lines){
  const card = $("modal");
  card.innerHTML = `<div id="result-lines"></div><div id="result-tail" style="display:none"></div>`;
  const box = $("result-lines");
  lines.forEach((ln, i) => {
    setTimeout(()=>{
      const d = document.createElement("div");
      d.className = "result-line";
      d.innerHTML = ln;
      box.appendChild(d);
      requestAnimationFrame(()=> d.classList.add("on"));
    }, 450 + i * 900);
  });
  setTimeout(()=>{
    $("result-tail").style.display = "block";
    SFX.fragmentDrop();   // 碎片落入手中：就在「获得 xx 碎片」出现这一刻
    $("result-tail").innerHTML = `
      <hr class="popup-divider">
      <div class="frag-big">🧩 ${"获得"}${lvl.fragmentName}：${lvl.fragment}</div>
      <button class="btn btn-accent btn-block" id="btn-collect">${CONFIG.collectLabel}</button>`;
    $("btn-collect").addEventListener("click", ()=> collect(lvl.id));
  }, 450 + lines.length * 900 + 500);
}
function collect(id){
  const lvl = levelById(id);
  commitProgress(p => { p["level" + id] = { done:true, fragment: lvl.fragment }; });
  justCompleted = id;
  // 收下碎片后，房间自动翻到下一年（最后一关留在 2026）
  const next = CONFIG.levels.find(l => l.id === id + 1);
  hallYear = next ? next.year : lvl.year;
  closeModal();
  backToHall();
}
/* 作弊：直达成功结算（弹窗文案与正常通关完全一致） */
function cheatToSuccess(id){
  failCounts[id] = 0;
  closeModal();
  runLevelSuccess(levelById(id), {});
}

/* ==================== ⑪ 关卡 1：拨号 ==================== */
let lv1 = { entered:"", dialJudging:false, judgeTimer:null, wrongTimer:null };
function renderLevel1(lvl){
  setLevelAccent("level1", lvl);
  lv1 = { entered:"", dialJudging:false, judgeTimer:null, wrongTimer:null, pbOpens:0 };
  const keys = ["1","2","3","4","5","6","7","8","9","*","0","#"];
  const keyHtml = keys.map(k =>
    `<button class="key${(k === "*" || k === "#") ? " ghost" : ""}" data-k="${k}">${k}</button>`
  ).join("");

  $("view-level1").innerHTML = `
    ${bgLevel1()}
    <div class="view-scroll">
      ${levelHeader(lvl)}
      <div class="story-card">
        ${lvl.intro.map(t => `<div class="t-body">${t}</div>`).join("")}
      </div>
      <div class="play-card">
        <div class="play-title">${lvl.hint}</div>
        <div class="digit-row" id="l1-digits"></div>
        <div class="dial-hint" id="l1-hint"></div>
        <div class="keypad">${keyHtml}</div>
        <button class="btn btn-ghost btn-block" id="l1-del" style="margin-bottom:10px">⌫ 删除</button>
        <button class="btn btn-accent btn-block" id="l1-pb">📖 查看电话簿</button>
      </div>
    </div>`;

  const back = $("btn-back"); back.addEventListener("click", stopLv1AndBack);

  document.querySelectorAll(".key").forEach(k => {
    k.addEventListener("click", () => pressKey(lvl, k.dataset.k, k));
  });
  $("l1-del").addEventListener("click", () => deleteKey(lvl));
  $("l1-pb").addEventListener("click", () => openPhonebook(lvl));
  renderL1Number(lvl);
}
function renderL1Number(lvl){
  const row = $("l1-digits");
  if(!row) return;
  const n = lv1.entered;
  let html = "";
  for(let i = 0; i < 8; i++){
    const ch = n[i] || "";
    html += `<span class="digit-box${ch ? " filled" : ""}">${ch}</span>`;
    if(i === 3) html += `<span class="digit-sep">-</span>`;
  }
  row.innerHTML = html;
}
function pressKey(lvl, k, keyEl){
  if(k === "*" || k === "#"){ vibrate(8); return; }
  if(lv1.dialJudging) return;
  if(lv1.entered.length >= lvl.digitLength) return;
  lv1.entered += k;
  vibrate(15);
  SFX.dial(k);   // 双音多频拨号音
  if(keyEl) spawnEffectAt(keyEl, "tap-wave");  // 拨号声波反馈
  renderL1Number(lvl);
  if(lv1.entered.length === lvl.digitLength){
    lv1.dialJudging = true;
    $("l1-hint").textContent = "☎️ 正在拨号……";
    SFX.ringback();   // 嘟—— 停 ——嘟——，整段 2.4 秒
    // 等回铃音彻底响完（2.4s）再多留 0.2s 呼吸，然后才判定，
    // 否则接通/错误提示音会和第二声「嘟——」叠在一起
    lv1.judgeTimer = setTimeout(()=>{ lv1.judgeTimer = null; judgeL1(lvl); }, 2600);
  }
}
function deleteKey(lvl){
  if(lv1.dialJudging) return;
  lv1.entered = lv1.entered.slice(0, -1);
  renderL1Number(lvl);
}
/* 返回大厅前取消尚未执行的拨号判定和错误弹窗延时 */
function stopLv1AndBack(){
  if(lv1.judgeTimer){ clearTimeout(lv1.judgeTimer); lv1.judgeTimer = null; }
  if(lv1.wrongTimer){ clearTimeout(lv1.wrongTimer); lv1.wrongTimer = null; }
  backToHall();
}
function judgeL1(lvl){
  if(lv1.entered === lvl.correctNumber){
    lv1.dialJudging = false;
    $("l1-hint").textContent = "📞 嘟——接通了 ✓";
    SFX.connected();
    // 等「叮」的三连音收尾再弹成功窗
    lv1.judgeTimer = setTimeout(()=>{ lv1.judgeTimer = null; runLevelSuccess(lvl, {}); }, 1200);
  } else {
    lv1.dialJudging = false;
    failCounts[1]++;
    $("l1-hint").textContent = "📵 嘟——嘟—— 是空号";
    vibrate(40);
    SFX.wrong();      // 忙音「响 0.4 停 0.35 再响 0.4」= 1.15 秒
    lv1.wrongTimer = setTimeout(()=>{
      lv1.wrongTimer = null;
      if(currentView !== "level1") return;
      const funny = lvl.wrongLines[randi(0, lvl.wrongLines.length - 1)];
      const cheatBtn = failCounts[1] >= 3 ? `<button class="btn btn-accent btn-block" id="btn-cheat" style="margin-top:10px">${CONFIG.cheat.label}</button>` : "";
      openModal(`
        <div class="popup-head">📞</div>
        <div class="popup-title" style="color:var(--danger)">📵 好像打错了。</div>
        <div class="popup-body">${funny}</div>
        <div class="popup-actions">
          <button class="btn btn-primary btn-block" id="btn-again">好的，再试一次</button>
          ${cheatBtn}
        </div>`);
      $("btn-again").addEventListener("click", ()=>{ closeModal(); lv1.entered = ""; $("l1-hint").textContent = ""; renderL1Number(lvl); });
      if(failCounts[1] >= 3){
        $("btn-cheat").addEventListener("click", ()=> cheatToSuccess(1));
      }
    }, 1350);   // 忙音 1.15s 响完再弹窗
  }
}
/* 电话簿浮窗（便签 + 3 秒限时） */
let pbTimer = null;
function openPhonebook(lvl){
  // 每次打开随机打乱顺序，增加记忆难度
  const entries = shuffle(lvl.phonebook);
  const rows = entries.map(p => `<div class="nr"><span>${p.dept}</span><span>${p.num}</span></div>`).join("");
  // 第一次看 3 秒，第二次起只剩 2 秒（越看越记不住）
  lv1.pbOpens = (lv1.pbOpens | 0) + 1;
  const limit = lv1.pbOpens === 1 ? lvl.phonebookTimeout : 2;
  const tip = lv1.pbOpens === 1 ? "记住它，只有一次机会" : "这次只有 2 秒！";
  $("modal").innerHTML = `
    <div class="note">
      <span class="tape"></span>
      <span class="pin">📌</span>
      <button class="note-close" id="pb-close">×</button>
      <div class="note-title">${lvl.phonebookTitle}</div>
      <div class="note-timer" id="pb-timer">
        <div class="timer-ring" id="timer-ring"></div>
        <span class="timer-num" id="timer-num">${limit}</span>
      </div>
      <div class="t-caption" style="text-align:center;margin:0 0 6px">${tip}</div>
      <div class="note-list">${rows}</div>
    </div>`;
  $("modal").classList.add("note-mode");
  openModal();
  startPbTimer(limit);
  $("pb-close").addEventListener("click", closePhonebook);
}
function startPbTimer(seconds){
  if(pbTimer) clearInterval(pbTimer);
  const total = seconds * 1000;
  const start = performance.now();
  const ring = $("timer-ring");
  const num = $("timer-num");
  pbTimer = setInterval(()=>{
    const el = performance.now() - start;
    const remain = Math.max(0, total - el);
    const pct = remain / total * 100;
    const sec = Math.ceil(remain / 1000);
    if(ring) ring.style.background = `conic-gradient(var(--lv-accent) ${pct}%, rgba(0,0,0,.08) 0)`;
    if(num) num.textContent = sec;
    if(remain <= 0) closePhonebook();
  }, 50);
}
function closePhonebook(){
  if(pbTimer){ clearInterval(pbTimer); pbTimer = null; }
  closeModal();
}

/* ==================== ⑫ 关卡 2：敲键盘 ==================== */
const LV2_CAP = 168; // 稿纸约 6 行方块字符（标题 1 行 + 正文 6 行 = 7 行）
const fmtCd = (sec) => "⏰ " + sec.toFixed(2) + "秒";
let lv2 = {};
function renderLevel2(lvl){
  setLevelAccent("level2", lvl);
  lv2 = { hits:0, running:false, t0:0, cd:lvl.countdownSeconds, cap:LV2_CAP, state:"ready" };
  // 预生成一整份稿纸文本，敲击按进度逐段揭示，第 25 击恰好写满
  lv2.full = genPaperText(lvl, LV2_CAP);

  $("view-level2").innerHTML = `
    ${bgLevel2()}
    <div class="view-scroll">
      ${levelHeader(lvl)}
      <div class="story-card" id="l2-intro"></div>
      <div class="play-card pc-crt">
        <div class="crt-frame" id="l2-crt">
          <div class="crt-bar">
            <span class="crt-dots"><i></i><i></i><i></i></span>
            <span class="crt-name">【初稿】240902申报材料.docx</span>
            <span id="l2-cd">${fmtCd(lvl.countdownSeconds)}</span>
          </div>
          <div class="crt-screen">
            <div class="paper" id="l2-paper">
              <div class="paper-title">${lvl.paperTitle}</div>
              <div class="paper-body" id="l2-body">${cursorHTML()}</div>
            </div>
          </div>
          <div class="crt-timebar"><div class="crt-timebar-fill" id="l2-timebar"></div></div>
        </div>
        <div class="pbar-wrap"><div class="pbar" id="l2-bar"></div></div>
        <div class="l2-count" id="l2-count">0 / ${lvl.targetHits}</div>
        <button class="btn btn-accent l2-keybtn" id="l2-key"><span class="kbd-emoji">⌨️</span> 敲一下键盘</button>
      </div>
    </div>`;

  const back = $("btn-back"); back.addEventListener("click", stopL2AndBack);
  // 导语直接显示（不再逐行）
  $("l2-intro").innerHTML = lvl.intro.map(t => `<div class="t-body">${t}</div>`).join("");

  const key = $("l2-key");
  const hit = () => {
    if(lv2.state === "done" || lv2.state === "fail") return;
    if(lv2.state === "ready"){ lv2.state = "run"; lv2.t0 = performance.now(); startL2Cd(); }
    lv2.hits++;
    renderL2Paper();
    pulseL2();
    SFX.key();           // 敲键声（自带节流，连点不爆音）
    spawnL2Sparks(key);  // 敲键迸出字符火星
    if(lv2.hits >= lvl.targetHits){ lv2Win(); }
  };
  key.addEventListener("click", hit);
  key.addEventListener("pointerdown", ()=>{ key.style.transform = "translate(4px,4px); box-shadow:0 0 0 var(--ink)"; });
  key.addEventListener("pointerup", ()=>{ key.style.transform = ""; });
}
function cursorHTML(){ return `<span class="cursor"></span>`; }
function genPaperText(lvl, cap){
  let s = "";
  const b = lvl.blockChar;
  // 用不同长度的 █ 段模拟真实段落（词长短不一，更自然）
  while(s.length < cap){
    for(let g = 0; g < randi(1,5); g++){
      if(s.length >= cap) break;
      if(g > 0) s += " ";
      s += b.repeat(randi(1,6));
    }
    if(s.length < cap) s += " ";
  }
  return s.slice(0, cap);
}
function renderL2Paper(){
  const lvl = levelById(2);
  const fraction = Math.min(1, lv2.hits / lvl.targetHits);
  const filled = Math.round(lv2.cap * fraction);
  const txt = lv2.full.slice(0, filled);
  const done = lv2.hits >= lvl.targetHits;
  $("l2-body").innerHTML = done
    ? txt + `<div class="done-stamp">已提交 ✔</div>`
    : txt + cursorHTML();
  $("l2-count").textContent = `${lv2.hits} / ${lvl.targetHits}`;
  $("l2-bar").style.width = (fraction * 100) + "%";
}
function pulseL2(){
  const paper = $("l2-paper");
  paper.classList.remove("shake");
  void paper.offsetWidth;
  paper.classList.add("shake");
}
/* 敲键迸溅：字符碎片向四周飞出 */
function spawnL2Sparks(el){
  const screen = $("screen");
  const sr = screen.getBoundingClientRect(), er = el.getBoundingClientRect();
  const box = document.createElement("div");
  box.style.cssText = `position:absolute;z-index:60;pointer-events:none;left:${er.left - sr.left + er.width/2}px;top:${er.top - sr.top + er.height/2}px`;
  const chars = ["█","█","·","*","✦","✚"];
  for(let i = 0; i < 6; i++){
    const s = document.createElement("span");
    s.className = "spark";
    s.textContent = chars[randi(0, chars.length - 1)];
    const ang = -Math.PI/2 + (Math.random() - .5) * Math.PI * 1.3; // 向上半圆方向
    const dist = randi(38, 90);
    s.style.setProperty("--dx", Math.cos(ang) * dist + "px");
    s.style.setProperty("--dy", Math.sin(ang) * dist + "px");
    box.appendChild(s);
  }
  screen.appendChild(box);
  setTimeout(()=> box.remove(), 700);
}
function startL2Cd(){
  const lvl = levelById(2);
  const bg = $("l2-bg");
  // 太阳开始沿弧线落山（动画时长与倒计时一致）
  if(bg){ bg.style.setProperty("--cd", lvl.countdownSeconds + "s"); bg.classList.add("sun-run"); }
  // 紧张感全靠鼓点：底鼓 + 军鼓 + 踩镲，越到后面节奏越密
  SFX.tensionStart(lvl.countdownSeconds);
  lv2.cdTimer = setInterval(()=>{
    const el = (performance.now() - lv2.t0) / 1000;
    const remain = Math.max(0, lvl.countdownSeconds - el);
    $("l2-cd").textContent = fmtCd(remain);
    // 天色随倒计时从午后蓝转向五点金（夕阳元素保留，显示器只是叠在上面）
    if(bg) bg.style.setProperty("--warm", Math.min(1, el / lvl.countdownSeconds).toFixed(3));
    // 屏幕下沿的时间条：倒计时是时间在消失，条从满到空
    const tf = $("l2-timebar");
    if(tf) tf.style.width = (remain / lvl.countdownSeconds * 100) + "%";
    // 最后 3 秒画面开始撕裂
    const cf = $("l2-crt");
    if(cf) cf.classList.toggle("tear", remain > 0 && remain <= 3);
    if(remain <= 1 && bg) bg.classList.add("danger");
    if(remain <= 0){ lv2Fail(); }
  }, 30);
}
function lv2Win(){
  clearInterval(lv2.cdTimer);
  SFX.tensionStop();
  lv2.state = "done";
  $("l2-cd").textContent = "🎉";
  // 准点下班：太阳正好沉底、满屏金色
  const bg = $("l2-bg");
  if(bg){ bg.classList.remove("danger"); bg.classList.add("dawn"); bg.style.setProperty("--warm","1"); }
  const crt = $("l2-crt"); if(crt) crt.classList.remove("tear");
  // "已提交"出现后等 1.4s 再弹成功结算
  setTimeout(()=> runLevelSuccess(levelById(2), {}), 1400);
}
function lv2Fail(){
  clearInterval(lv2.cdTimer);
  SFX.tensionStop();
  lv2.state = "fail";
  failCounts[2]++;
  $("l2-cd").textContent = fmtCd(0);
  // 错过五点：天色一沉，暗示要加班
  const bg0 = $("l2-bg");
  if(bg0){ bg0.classList.remove("danger"); bg0.classList.add("overtime","sun-freeze"); }
  const crt0 = $("l2-crt"); if(crt0) crt0.classList.remove("tear");
  const cheatBtn = failCounts[2] >= 3 ? `<button class="btn btn-accent btn-block" id="btn-cheat" style="margin-top:10px">${CONFIG.cheat.label}</button>` : "";
  openModal(`
    <div class="popup-head">⏰</div>
    <div class="popup-title" style="color:var(--danger)">时间到！</div>
    <div class="popup-body">🥀 材料还没写完，今天要加班了。</div>
    <div class="popup-actions">
      <button class="btn btn-primary btn-block" id="btn-retry">再试一次</button>
      ${cheatBtn}
    </div>`);
  $("btn-retry").addEventListener("click", ()=>{ closeModal(); resetLv2(); });
  if(failCounts[2] >= 3) $("btn-cheat").addEventListener("click", ()=> cheatToSuccess(2));
}
function resetLv2(){
  const lvl = levelById(2);
  lv2 = { hits:0, running:false, t0:0, cd:lvl.countdownSeconds, cap:LV2_CAP, state:"ready" };
  lv2.full = genPaperText(lvl, LV2_CAP);
  if(lv2.cdTimer) clearInterval(lv2.cdTimer);
  const bg = $("l2-bg");
  if(bg){
    bg.classList.remove("danger","dawn","overtime","sun-run","sun-freeze");
    bg.style.setProperty("--warm","0");
    void bg.offsetWidth;  // 强制回流，让太阳动画回到起点
  }
  $("l2-body").innerHTML = cursorHTML();
  $("l2-cd").textContent = fmtCd(lvl.countdownSeconds);
  $("l2-bar").style.width = "0%";
  $("l2-count").textContent = `0 / ${lvl.targetHits}`;
}
function stopL2AndBack(){
  if(lv2.cdTimer) clearInterval(lv2.cdTimer);
  SFX.tensionStop();
  backToHall();
}

/* ==================== ⑬ 关卡 3：节拍点击 ==================== */
let lv3 = {};
function renderLevel3(lvl){
  setLevelAccent("level3", lvl);
  lv3 = { phase:"intro", actionIdx:0, fails:0, raf:null, running:false, results:[], token:0, timeout:null, stepTimer:null, startTimer:null, combo:0 };
  $("view-level3").innerHTML = `
    ${bgLevel3()}
    <div class="view-scroll">
      ${levelHeader(lvl)}
      <div class="story-card" id="l3-intro"></div>
      <div class="l3-hud">
        <div class="l3-hud-item"><span class="l3-hud-k">COMBO</span><span class="l3-hud-v" id="l3-combo">0</span></div>
        <div class="l3-hud-item"><span class="l3-hud-k">RANK</span><span class="l3-hud-v" id="l3-rank">S</span></div>
        <div class="l3-hud-item"><span class="l3-hud-k">MISS</span><span class="l3-hud-v" id="l3-miss">0</span></div>
      </div>
      <div class="lv3-hint">${lvl.hint}</div>
      <div class="stage" id="l3-stage">
        <div class="bull" id="l3-bull"></div>
        <div class="ring" id="l3-ring"></div>
        <div class="action-emoji" id="l3-emoji">🕺</div>
        <div class="verdict" id="l3-verdict"></div>
        <div class="velvet-wrap"><div class="velvet vl"></div><div class="velvet vr"></div></div>
      </div>
      <div class="lv3-progress" id="l3-progress">准备</div>
      <div class="lv3-actions">
        <button class="btn btn-accent l3-music" id="l3-music">${lvl.musicBtn}</button>
      </div>
    </div>`;

  const back = $("btn-back"); back.addEventListener("click", ()=>{ cancelL3(); backToHall(); });
  // 导语直接显示（保留最后一句闪亮 showtime）
  $("l3-intro").innerHTML = lvl.intro.map((t, i) => {
    const isShow = i === lvl.intro.length - 1;
    return `<div class="t-body${isShow ? " showtime" : ""}">${t}</div>`;
  }).join("");

  $("l3-music").addEventListener("click", l3Start);
  $("l3-stage").addEventListener("click", l3Tap);
}
function l3Start(){
  lv3.actionIdx = 0;
  lv3.phase = "play";
  lv3.results = [];
  lv3.combo = 0;
  const bg = $("l3-bg");
  if(bg) bg.classList.add("live");   // 灯光进入节拍模式
  $("l3-stage").classList.add("opened");  // 幕布向两侧拉开，演出开始
  updateL3Hud();
  $("l3-progress").textContent = "数拍……";
  SFX.l3CountIn();                       // 4 个 hihat 数拍（走 ctx 时钟，不受主线程抖动影响）
  if(lv3.startTimer) clearTimeout(lv3.startTimer);
  lv3.startTimer = setTimeout(()=>{
    lv3.startTimer = null;
    if(lv3.phase === "play") l3BeginAction();
  }, 900);
}
function updateL3Hud(bump){
  const c = $("l3-combo"), r = $("l3-rank"), m = $("l3-miss");
  if(!c || !r || !m) return;
  c.textContent = lv3.combo || 0;
  m.textContent = lv3.fails || 0;
  const rank = (lv3.fails | 0) === 0 ? "S" : lv3.fails === 1 ? "A" : lv3.fails === 2 ? "B" : "C";
  r.textContent = rank;
  r.className = "l3-hud-v rank-" + rank;
  if(bump){
    [c, m].forEach(el => { el.classList.remove("bump"); void el.offsetWidth; el.classList.add("bump"); });
  }
}
function l3BeginAction(){
  const lvl = levelById(3);
  if(lv3.actionIdx >= lvl.actions.length){ l3Win(); return; }
  const emoji = lvl.actions[lv3.actionIdx];
  // 八个动作八种环色（色表走 THEME，换肤同步）；四个角的气泡位置循环复用
  const colors = [T.accents[0], T.cyan, T.accents[2], T.neon, T.purple, T.accents[3], "#FF9BB5", "#FFD08A"];
  const corners = ["corner-tr","corner-tl","corner-br","corner-bl"];
  const cur = colors[lv3.actionIdx % colors.length];
  lv3.corner = corners[lv3.actionIdx % corners.length];
  $("l3-stage").style.setProperty("--action-color", cur);
  $("l3-emoji").textContent = emoji;
  $("l3-emoji").classList.remove("dance");
  void $("l3-emoji").offsetWidth;
  $("l3-emoji").classList.add("dance");
  $("l3-verdict").className = "verdict " + lv3.corner;
  $("l3-progress").textContent = `动作 ${lv3.actionIdx + 1} / ${lvl.actions.length}`;
  lv3.running = true;
  lv3.startTime = performance.now();
  if(lv3.timeout) clearTimeout(lv3.timeout);
  cancelAnimationFrame(lv3.raf);
  // 超时 = MISS（用 setTimeout 而不是依赖 rAF，无需头浏览器判定也可靠）
  const myToken = ++lv3.token;
  lv3.timeout = setTimeout(()=>{ if(lv3.running && lv3.token === myToken) l3Miss(); }, L3_DUR + 60);
  lv3.raf = requestAnimationFrame(l3Tick);
  // 伴奏：底鼓起拍 + 三下 hihat + 军鼓正好落在完美判定中心（ctx 时钟调度）
  SFX.l3Action(L3_DUR, (L3_MIN + L3_MAX) / 2 * L3_DUR);
}
const L3_DUR = 1500;
/* 判定窗口：虚线圈 124px、收缩圈 150px，两者刚好重合在 p≈0.573。
   窗口围绕这个重合点基本对称（0.48~0.67），
   圈缩到虚线圈约 85% 时窗口即关闭——「圈明显更小」就一定判 MISS */
const L3_MIN = 0.48, L3_MAX = 0.67;
/* 命中时的随机喝彩（每次不同，避免八拍下来一直同一个词） */
/* 每个词一种颜色，避免整场都是同一个浅绿 */
const L3_PRAISE = [
  { e:"✨", t:"PERFECT",   c:"#FF5E97", tc:"#fff"    },
  { e:"🌟", t:"EXCELLENT", c:"#5CE1E6", tc:"#0A3A40" },
  { e:"🎯", t:"GREAT",     c:"#FFDE59", tc:"#3A2A00" },
  { e:"🔥", t:"AMAZING",   c:"#FF8A3D", tc:"#fff"    },
  { e:"👏", t:"BRAVO",     c:"#C77DFF", tc:"#fff"    },
  { e:"💯", t:"NICE",      c:"#A3FF73", tc:"#1E3B0A" },
];
const L3_MISS_WORD = ["MISS", "哎呀", "乱了"];
function pickPraise(){
  return L3_PRAISE[randi(0, L3_PRAISE.length - 1)];
}
function l3Tick(now){
  if(!lv3.running) return;
  const p = Math.min(1, (now - lv3.startTime) / L3_DUR);
  const scale = 1.6 - 1.35 * p;
  $("l3-ring").style.transform = `scale(${scale})`;
  if(p < 1) lv3.raf = requestAnimationFrame(l3Tick);
}
function l3Tap(){
  if(lv3.phase !== "play" || !lv3.running) return;
  const p = (performance.now() - lv3.startTime) / L3_DUR;
  if(p >= L3_MIN && p <= L3_MAX) l3Perfect();
  else l3Miss();
}
function l3Perfect(){
  lv3.running = false; cancelAnimationFrame(lv3.raf);
  if(lv3.timeout){ clearTimeout(lv3.timeout); lv3.timeout = null; }
  lv3.results.push("✓");
  lv3.combo = (lv3.combo || 0) + 1;
  l3PerfectFx();  // 舞台光波 + 音符飞起
  SFX.perfect();
  l3Beam();       // 地板光柱拔高
  updateL3Hud(true);
  const pr = pickPraise();
  const v = $("l3-verdict");
  v.className = "verdict " + (lv3.corner || "corner-tr") + " perfect";
  v.textContent = pr.e + " " + pr.t;
  v.style.background = pr.c;
  v.style.color = pr.tc;
  v.style.boxShadow = "0 6px 16px " + pr.c + "66, 0 2px 6px rgba(0,0,0,.25)";
  v.dataset.len = pr.t.length;   // 长词自动缩一点，保证小屏放得下
  lv3.actionIdx++;
  if(lv3.stepTimer) clearTimeout(lv3.stepTimer);
  lv3.stepTimer = setTimeout(()=>{
    lv3.stepTimer = null;
    if(lv3.phase !== "done") l3BeginAction();
  }, 650);
}
/* PERFECT 特效 2：地板三束光柱瞬间拔高爆闪 */
function l3Beam(){
  const bg = $("l3-bg");
  if(!bg) return;
  bg.classList.add("beam");
  setTimeout(()=> bg.classList.remove("beam"), 380);
}
/* PERFECT 特效：舞台中心白色光波扩散 + 音符斜飞 */
function l3PerfectFx(){
  const stage = $("l3-stage");
  if(!stage) return;
  const wave = document.createElement("div");
  wave.className = "stage-wave";
  stage.appendChild(wave);
  setTimeout(()=> wave.remove(), 750);
  ["🎵","✨","🎶"].forEach((n, i) => {
    const s = document.createElement("span");
    s.className = "note-fly";
    s.textContent = n;
    s.style.setProperty("--nx", ((i - 1) * 40) + "px");
    s.style.animationDelay = (i * .08) + "s";
    stage.appendChild(s);
    setTimeout(()=> s.remove(), 1200);
  });
}
function l3Miss(){
  cancelAnimationFrame(lv3.raf);
  if(lv3.timeout){ clearTimeout(lv3.timeout); lv3.timeout = null; }
  lv3.running = false;
  lv3.fails++;
  lv3.results = [];       // 时光倒流：全部重来
  lv3.actionIdx = 0;
  lv3.combo = 0;
  SFX.miss();
  updateL3Hud(true);
  const v = $("l3-verdict");
  v.className = "verdict " + (lv3.corner || "corner-tr") + " miss";
  v.style.background = ""; v.style.color = ""; v.style.boxShadow = "";
  v.textContent = "💥 " + L3_MISS_WORD[randi(0, L3_MISS_WORD.length - 1)];

  if(lv3.stepTimer) clearTimeout(lv3.stepTimer);
  lv3.stepTimer = setTimeout(()=>{
    lv3.stepTimer = null;
    // 返回大厅会把 phase 之外的运行态清掉；若已离开本关则不再弹窗
    if(currentView !== "level3") return;
    const lvl = levelById(3);
    const his = lvl.missText.map(t=>`<div class="popup-body-line">${t}</div>`).join("");
    const cheatBtn = lv3.fails >= 3 ? `<button class="btn btn-accent btn-block" id="btn-cheat" style="margin-top:12px">${CONFIG.cheat.label}</button>` : "";
    openModal(`
      <div class="popup-head">🚷</div>
      <div class="popup-body">${his}</div>
      <div class="popup-actions">
        <button class="btn btn-primary btn-block" id="btn-ok">时光倒流</button>
        ${cheatBtn}
      </div>`);
    $("btn-ok").addEventListener("click", ()=>{ closeModal(); l3BeginAction(); });
    if(lv3.fails >= 3){
      $("btn-cheat").addEventListener("click", ()=> cheatToSuccess(3));
    }
  }, 650);
}
function l3Win(){
  lv3.phase = "done";
  $("l3-progress").textContent = "演出结束 👏";
  // "演出结束"出现后等 0.8s 再弹成功结算
  setTimeout(()=> runLevelSuccess(levelById(3), {}), 800);
}
/* 离开第 3 关时，把「排队中」的回调全部撤掉 */
function cancelL3(){
  cancelAnimationFrame(lv3.raf);
  if(lv3.timeout){ clearTimeout(lv3.timeout); lv3.timeout = null; }
  if(lv3.stepTimer){ clearTimeout(lv3.stepTimer); lv3.stepTimer = null; }
  if(lv3.startTimer){ clearTimeout(lv3.startTimer); lv3.startTimer = null; }
  lv3.running = false;
  const bg = $("l3-bg");
  if(bg) bg.classList.remove("beam");
}

/* ==================== ⑭ 关卡 4：打包 ==================== */
let lv4 = {};
function renderLevel4(lvl){
  setLevelAccent("level4", lvl);
  lv4 = { chosen:[], phase:"intro" };
  SFX.musicBoxStart();   // 回忆氛围：音乐盒单音
  $("view-level4").innerHTML = `
    ${bgLevel4()}
    <div class="view-scroll">
      ${levelHeader(lvl)}
      <div class="story-card">${lvl.intro.map(t=>`<div class="t-body">${t}</div>`).join("")}</div>
      <div style="text-align:center;margin:2px 0 6px;position:relative;z-index:1"><button class="btn btn-primary" id="l4-start">${lvl.startLabel}</button></div>
      <div id="l4-game" style="display:none"></div>
    </div>`;

  const back = $("btn-back"); back.addEventListener("click", backToHall);
  $("l4-start").addEventListener("click", ()=>{ lv4.phase = "play"; $("l4-game").style.display = "block"; $("l4-start").closest("div").style.display = "none"; buildLv4Game(lvl); });
}
function buildLv4Game(lvl){
  // 三排：4 + 3 + 3，错落自由；十种不同底色（配色在 THEME.optionPalette）
  const rows = [[0,1,2,3],[4,5,6],[7,8,9]];
  const PALETTE = T.optionPalette;
  // 每张卡片的文字色：浅色调，与深色底色高对比
  const TEXT_COLORS = ["#FFFFFF","#FFFFFF","#FFFFFF","#FFFFFF","#FFFFFF","#FFFFFF","#FFFFFF","#FFFFFF","#FFFFFF","#FFFFFF"];
  const makeOpt = (i) => {
    const o = lvl.options[i];
    const rot = randi(-9,9);
    const fd = (2.8 + Math.random()*2.2).toFixed(2);
    const fdel = (Math.random()*1.5).toFixed(2);
    const tint = PALETTE[i % PALETTE.length];
    const textColor = TEXT_COLORS[i % TEXT_COLORS.length];
    return `<button class="opt" data-i="${i}" style="--rot:${rot}deg;--fd:${fd}s;--fdel:${fdel}s;--tint:${tint};--opt-color:${textColor}">
      <span class="opt-e">${o.e}</span><span class="opt-n">${o.n}</span></button>`;
  };
  const rowsHtml = rows.map((row, ri) => `<div class="opt-row${ri === 1 ? " mid" : ""}">${row.map(makeOpt).join("")}</div>`).join("");

  $("l4-game").innerHTML = `
    <div class="lv4-options" id="l4-opts">${rowsHtml}</div>
    <div class="pick-count" id="l4-count">已选择 0 / ${lvl.maxSelect}</div>
    <div class="suitcase">
      <div class="suitcase-handle"></div>
      <div class="suitcase-label">💕 最重要的三样东西</div>
      <div class="suitcase-items" id="l4-items"></div>
    </div>
    <div style="text-align:center;margin-top:14px"><button class="btn btn-accent btn-block l4-go-btn" id="l4-go" style="display:none">🙌 带走</button></div>`;

  document.querySelectorAll("#l4-opts .opt").forEach(b => {
    b.addEventListener("click", ()=> addChoice(lvl, parseInt(b.dataset.i,10)));
  });
  $("l4-go").addEventListener("click", ()=> confirmLv4(lvl));
}
function addChoice(lvl, i){
  if(lv4.chosen.length >= lvl.maxSelect) return;
  if(lv4.chosen.includes(i)) return;
  lv4.chosen.push(i);
  renderLv4(lvl);
}
function removeChoice(lvl, i){
  lv4.chosen = lv4.chosen.filter(x => x !== i);
  renderLv4(lvl);
}
function renderLv4(lvl){
  document.querySelectorAll("#l4-opts .opt").forEach(b => {
    const i = parseInt(b.dataset.i,10);
    b.disabled = lv4.chosen.includes(i) || (lv4.chosen.length >= lvl.maxSelect);
  });
  const items = lv4.chosen.map(i => {
    const o = lvl.options[i];
    const rot = randi(-7, 7);   // 贴纸歪粘进箱子
    return `<span class="suit-item" style="--rot:${rot}deg">${o.e} ${o.n}<span class="rm" data-i="${i}">×</span></span>`;
  }).join("") || `<span class="suit-empty">还空着……</span>`;
  $("l4-items").innerHTML = items;
  document.querySelectorAll("#l4-items .rm").forEach(r => {
    r.addEventListener("click", ()=> removeChoice(lvl, parseInt(r.dataset.i,10)));
  });
  $("l4-count").textContent = `已选择 ${lv4.chosen.length} / ${lvl.maxSelect}`;
  $("l4-go").style.display = lv4.chosen.length === lvl.maxSelect ? "inline-flex" : "none";
}
function confirmLv4(lvl){
  const names = lv4.chosen.map(i => lvl.options[i].n);
  const nameStr = names.map(n => `<b class="hl-word">${n}</b>`).join("、");
  openModal(`
    <div class="popup-head">🧳</div>
    <div class="popup-title">${lvl.confirmTitle}</div>
    <div class="popup-body">你确定要带走：${nameStr}？</div>
    <div class="popup-actions">
      <button class="btn btn-deep btn-block" id="btn-yes">决定了！</button>
      <button class="btn btn-ghost btn-block" id="btn-no">我再想想</button>
    </div>`);
  $("btn-yes").addEventListener("click", ()=> lv4Success(lvl));
  $("btn-no").addEventListener("click", closeModal);
}
function lv4Success(lvl){
  const names = lv4.chosen.map(i => lvl.options[i].n);
  const nameStr = names.length === 3
    ? `${names[0]}、${names[1]}和${names[2]}`
    : names.join("、");
  const lines = [ lvl.thanksPrefix, nameStr, lvl.thanksTail, lvl.dropText ];
  openModal("");
  playResult(lvl, lines);
}

/* ---------- 关卡成功统一入口 ---------- */
function runLevelSuccess(lvl, opts){
  openModal("");
  if(lvl.id === 1){
    const lines = [...lvl.dialLines, lvl.success];
    playResult(lvl, lines);
  } else if(lvl.id === 2){
    const lines = [ "🏆恭喜准点下班！", "这一年，因为你的才华和努力，", "成功解锁成就", `<b class="glow-word">🏅【${lvl.achievementName}】🏅</b>` ];
    playResult(lvl, lines);
  } else if(lvl.id === 3){
    const lines = [ "🎉 完美的演出！", `恭喜获得<b class="glow-word">「${lvl.awardName}」</b>`, "实至名归！🏆" ];
    playResult(lvl, lines);
  } else if(lvl.id === 4){
    // 作弊不会出现在第 4 关（无失败机制），此分支仅供兜底
    lv4Success(lvl);
  }
}

/* ==================== ⑮ 页面 C：终极密码（弹窗） ==================== */
function openPasswordModal(){
  const c = CONFIG.passwordPage;
  $("modal").innerHTML = `
    <button class="modal-close" id="pw-close">×</button>
    <div class="popup-head">🔐</div>
    <div class="popup-title">${c.title}</div>
    <div class="t-caption" style="text-align:center;margin-bottom:6px">${c.desc.join("<br>")}</div>
    <div class="otp-row" id="otp-row">
      <input class="otp" maxlength="1" inputmode="numeric" pattern="[0-9]*" />
      <input class="otp" maxlength="1" inputmode="numeric" pattern="[0-9]*" />
      <input class="otp" maxlength="1" inputmode="numeric" pattern="[0-9]*" />
      <input class="otp" maxlength="1" inputmode="numeric" pattern="[0-9]*" />
    </div>
    <button class="btn btn-primary btn-block" id="btn-unlock" disabled>${c.unlockLabel}</button>
    <div class="pw-msg" id="pw-msg"></div>`;
  openModal();
  $("modal").classList.add("otp-mode");
  bindOTP();
  $("pw-close").addEventListener("click", closeModal);
  $("btn-unlock").addEventListener("click", checkPassword);
}
let _vvHandler = null;
function adjustOtpForKeyboard(){
  if(!window.visualViewport) return;
  if(_vvHandler) window.visualViewport.removeEventListener("resize", _vvHandler);
  _vvHandler = () => {
    const card = $("modal");
    if(!card || !$("overlay").classList.contains("show")) return;
    const vv = window.visualViewport;
    const keyboardH = window.innerHeight - vv.height;
    if(keyboardH > 50){
      card.style.maxHeight = vv.height * 0.9 + "px";
    } else {
      card.style.maxHeight = "";
    }
  };
  window.visualViewport.addEventListener("resize", _vvHandler);
  window.visualViewport.addEventListener("scroll", _vvHandler);
}
function bindOTP(){
  const boxes = [...document.querySelectorAll("#otp-row .otp")];
  boxes[0].focus();
  boxes.forEach((b, i) => {
    b.addEventListener("input", (e)=>{
      b.value = b.value.replace(/\D/g, "").slice(0,1);
      if(b.value && i < boxes.length - 1) boxes[i + 1].focus();
      syncUnlockBtn();
    });
    b.addEventListener("keydown", (e)=>{
      if(e.key === "Backspace" && !b.value && i > 0){
        boxes[i - 1].focus();
        boxes[i - 1].value = "";
        syncUnlockBtn();
      }
      // 四格填满后，回车直接解锁
      if(e.key === "Enter" && boxes.every(x => x.value.length === 1)){
        e.preventDefault();
        checkPassword();
      }
    });
    b.addEventListener("focus", ()=> b.select());
  });
}
function syncUnlockBtn(){
  const boxes = [...document.querySelectorAll("#otp-row .otp")];
  const full = boxes.every(b => b.value.length === 1);
  $("btn-unlock").disabled = !full;
}
function checkPassword(){
  const boxes = [...document.querySelectorAll("#otp-row .otp")];
  const guess = boxes.map(b => b.value).join("");
  const c = CONFIG.passwordPage;
  if(guess === CONFIG.password.join("")){
    $("pw-msg").textContent = c.correct;
    commitProgress(p => { p.finalVisited = true; });
    vibrate([30, 40, 30, 40, 60]);
    SFX.unlock();
    setTimeout(()=>{
      closeModal();
      confettiBurst();
      renderFinal();
    }, 800);
  } else {
    $("pw-msg").textContent = c.wrong;
  }
}
/* 彩带：从顶部垂直飘落，铺满整个宽度 */
function confettiBurst(){
  SFX.confetti();
  const colors = [T.accents[0], T.cyan, T.accents[2], T.neon, T.purple, "#FFD08A", "#FFB3C1", "#B5EAD7", "#8AD1FF", "#F0C2FF"];
  const container = document.createElement("div");
  container.className = "confetti-container";
  for(let i = 0; i < 240; i++){
    const piece = document.createElement("div");
    piece.className = "confetti-piece";
    const size = randi(6, 13);
    const color = colors[randi(0, colors.length - 1)];
    const left = Math.random() * 100;  // 铺满 0~100%
    const delay = (Math.random() * 0.6).toFixed(2);
    const dur = (1.5 + Math.random() * 1.8).toFixed(2);
    const rot = randi(0, 360);
    piece.style.cssText = `left:${left}%;top:-20px;width:${size}px;height:${Math.round(size*0.6)}px;background:${color};--crot:${rot}deg;animation:confettiFall ${dur}s ease-in ${delay}s forwards`;
    container.appendChild(piece);
  }
  $("screen").appendChild(container);
  setTimeout(() => container.remove(), 4300);
}

/* ==================== ⑯ 页面 D：最终纪念 ==================== */
function renderFinal(){
  const c = CONFIG.finalPage;
  const lines = CONFIG.finalMessage;
  $("view-final").innerHTML = `
    <div class="final-decor">${finalDecor()}</div>
    <div class="final-num">${CONFIG.workDays}</div>
    <div class="final-unit">${c.unit}</div>
    <div class="final-date">${CONFIG.workDates.start} → ${CONFIG.workDates.end}</div>
    <hr class="rule">
    <div class="final-msg">
      ${lines.map((l,i)=>`<p class="fade-in" data-i="${i}">${l}</p>`).join("")}
    </div>
    <div class="final-replay" id="final-replay" style="display:none">
      <button class="btn btn-ghost" id="btn-back-lobby">← 返回结界</button>
      <button class="btn btn-ghost" id="btn-replay">↺ 再玩一次</button>
    </div>`;
  showView("final");
  // 逐段淡入，全部出现完再显示按钮组
  setTimeout(()=>{
    const ps = document.querySelectorAll(".final-msg .fade-in");
    ps.forEach((p,i)=>{
      setTimeout(()=>{
        p.classList.add("on");
        if(i === ps.length - 1){
          setTimeout(()=>{ $("final-replay").style.display = "flex"; }, 1000);
        }
      }, i * 2000);
    });
  }, 350);
  // 返回大厅：进度保留
  $("btn-back-lobby").addEventListener("click", backToHall);
  $("btn-replay").addEventListener("click", ()=>{
    clearRaw();
    progress = defaultProgress();
    failCounts = { 1:0, 2:0, 3:0 };  // 失败计数也必须清零，否则新一局首次失败就会出现作弊按钮
    renderOpening();
    showView("opening");
  });
}

/* 终页庆祝漂浮 emoji */
function finalDecor(){
  const emojis = ["🎉","🎊","✨","🎈","💐","🥂","🎂","🌟","🌸","🎇","🎁","💫","💖","🌈",
    "🕊️","🍀","🌻","🎵","🎶","💜","💙","🤍","🧡","🎀","🦋","🌸","🍀","🌟","💫","🎊","🎉","✨","💖"];
  let s = "";
  for(let i = 0; i < 56; i++){
    const e = emojis[i % emojis.length];
    const size = randi(10, 22);
    const x = randi(1, 95);
    const y = randi(1, 97);
    const delay = (Math.random() * 5).toFixed(2);
    const dur = (2.5 + Math.random() * 4).toFixed(2);
    s += `<i style="left:${x}%;top:${y}%;font-size:${size}px;animation-delay:${delay}s;animation-duration:${dur}s">${e}</i>`;
  }
  return s;
}

/* ==================== ⑰ 启动 ==================== */

/* 全局按钮音：所有 .btn 点击都出一声轻响（各关自己的音效另外叠加） */
document.addEventListener("click", (e) => {
  const b = e.target.closest && e.target.closest(".btn");
  if(b && !b.disabled) SFX.tap();
});

/* 音效开关 */
function initSfxToggle(){
  const btn = $("sfx-toggle");
  if(!btn) return;
  if(SFX.isDead()){ btn.style.display = "none"; return; }
  const paint = () => {
    btn.classList.toggle("muted", SFX.isMuted());
    btn.setAttribute("aria-pressed", SFX.isMuted() ? "false" : "true");
  };
  paint();
  btn.addEventListener("click", () => {
    SFX.init();                 // 万一还没初始化过
    SFX.toggle();
    paint();
    if(!SFX.isMuted()) SFX.tap();   // 打开时给一声确认
  });
}

function init(){
  initSfxToggle();
  renderOpening();
  showView("opening");
}
document.addEventListener("DOMContentLoaded", init);

})();
