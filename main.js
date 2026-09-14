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
      actions: ["🙋‍♂️", "💁‍♂️", "🙆‍♂️", "🙅‍♂️"],
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
function loadProgress(){
  try{
    const raw = localStorage.getItem(STORE_KEY);
    if(!raw) return defaultProgress();
    const p = JSON.parse(raw);
    return Object.assign(defaultProgress(), p);
  }catch(e){ return defaultProgress(); }
}
function saveProgress(p){
  try{ localStorage.setItem(STORE_KEY, JSON.stringify(p)); }catch(e){}
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
}
function backToHall(){ renderHall(); showView("hall"); }

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
    if(b) b.addEventListener("click", () => { renderHall(); showView("hall"); });
  }, guideAt);
}

/* ==================== ⑨ 页面 B：回忆大厅 ==================== */
function renderHall(){
  const p = progress;
  let html = `
    <div class="hall">
      <div class="hall-glow"></div>
      <div class="hall-glow g2"></div>
      <div class="hall-glow g3"></div>
      <div class="hall-decor">${hallDecorDots()}</div>
      <div class="hall-title t-h1">${CONFIG.hallTitle}</div>
      <div class="hall-sub t-caption">${CONFIG.hallSubtitle}</div>
      <div class="lvl-grid">`;

  CONFIG.levels.forEach(lvl => {
    const key = "level" + lvl.id;
    const st = p[key];
    const unlocked = lvl.id === 1 || p["level" + (lvl.id - 1)].done;
    const done = st.done;

    let cls = "level-card";
    if(!unlocked) cls += " locked";
    else if(done) cls += " done";
    else cls += " open";

    const emoji = unlocked ? lvl.emoji : "🔒";
    const fragEl = done ? `<span class="lc-frag">🧩 ${lvl.fragmentName}：${lvl.fragment}</span>` : "";

    html += `
      <div class="${cls}" data-lv="${lvl.id}" style="--lv-accent:${accentOf(lvl)}">
        <span class="lc-year">${lvl.year}</span>
        <span class="lc-emoji">${emoji}</span>
        <span class="lc-title">${lvl.title}</span>
        ${fragEl}
      </div>`;
  });

  const ready = allDone(p);
  html += `</div>`;
  html += `
    <div class="hall-door ${ready ? "ready" : ""}" id="hall-pw" role="button" ${ready ? 'tabindex="0"' : ''}>
      <div class="door-ico">${ready ? "🔓" : "🔐"}</div>
      <div class="door-title">${ready ? CONFIG.hallPassword.readyTitle : CONFIG.hallPassword.lockedTitle}</div>
      <div class="door-sub">${ready ? CONFIG.hallPassword.readySub : CONFIG.hallPassword.lockedSub}</div>
    </div>
  </div>`;

  $("view-hall").innerHTML = html;

  // 卡片点击
  document.querySelectorAll(".level-card").forEach(card => {
    const lvId = parseInt(card.dataset.lv, 10);
    card.addEventListener("click", (e) => {
      if(card.classList.contains("locked")){ showLockedHint(); return; }
      enterLevel(lvId, e.clientX, e.clientY);
    });
  });
  // 密码入口
  const pw = $("hall-pw");
  const tryOpenPassword = () => { if(allDone(progress)) openPasswordModal(); };
  pw.addEventListener("click", tryOpenPassword);
  // div 模拟的按钮不会自动响应回车 / 空格，需手动补
  pw.addEventListener("keydown", (e) => {
    if(e.key === "Enter" || e.key === " "){ e.preventDefault(); tryOpenPassword(); }
  });

  // 刚通关的闪灰动画（一次性）
  if(justCompleted){
    const card = document.querySelector(`.level-card[data-lv="${justCompleted}"]`);
    if(card){ card.classList.add("just-done"); setTimeout(()=>card.classList.remove("just-done"), 650); }
    justCompleted = null;
  }
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
    s += `<i class="memo" style="left:${x}%;font-size:${size}px;animation-duration:${dur}s;animation-delay:${delay}s;opacity:${op}">${e}</i>`;
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
    $("result-tail").innerHTML = `
      <hr class="popup-divider">
      <div class="frag-big">🧩 ${"获得"}${lvl.fragmentName}：${lvl.fragment}</div>
      <button class="btn btn-accent btn-block" id="btn-collect">${CONFIG.collectLabel}</button>`;
    $("btn-collect").addEventListener("click", ()=> collect(lvl.id));
  }, 450 + lines.length * 900 + 500);
}
function collect(id){
  const lvl = levelById(id);
  const p = loadProgress();
  p["level" + id] = { done:true, fragment: lvl.fragment };
  saveProgress(p);
  progress = p;
  justCompleted = id;
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
  lv1 = { entered:"", dialJudging:false, judgeTimer:null, wrongTimer:null };
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
  if(keyEl) spawnEffectAt(keyEl, "tap-wave");  // 拨号声波反馈
  renderL1Number(lvl);
  if(lv1.entered.length === lvl.digitLength){
    lv1.dialJudging = true;
    $("l1-hint").textContent = "正在拨号……";
    lv1.judgeTimer = setTimeout(()=>{ lv1.judgeTimer = null; judgeL1(lvl); }, 500);
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
    $("l1-hint").textContent = "嘟……接通 ✓";
    // 显示接通提示后等 1s 再弹成功窗
    lv1.judgeTimer = setTimeout(()=>{ lv1.judgeTimer = null; runLevelSuccess(lvl, {}); }, 1000);
  } else {
    lv1.dialJudging = false;
    failCounts[1]++;
    $("l1-hint").textContent = "嘟……嘟……";
    vibrate(40);
    lv1.wrongTimer = setTimeout(()=>{
      lv1.wrongTimer = null;
      if(currentView !== "level1") return;
      const funny = lvl.wrongLines[randi(0, lvl.wrongLines.length - 1)];
      const cheatBtn = failCounts[1] >= 3 ? `<button class="btn btn-accent btn-block" id="btn-cheat" style="margin-top:10px">${CONFIG.cheat.label}</button>` : "";
      openModal(`
        <div class="popup-head">📞</div>
        <div class="popup-title" style="color:var(--danger)">嘟…… ❌ 好像打错了。</div>
        <div class="popup-body">${funny}</div>
        <div class="popup-actions">
          <button class="btn btn-primary btn-block" id="btn-again">好的，再试一次</button>
          ${cheatBtn}
        </div>`);
      $("btn-again").addEventListener("click", ()=>{ closeModal(); lv1.entered = ""; $("l1-hint").textContent = ""; renderL1Number(lvl); });
      if(failCounts[1] >= 3){
        $("btn-cheat").addEventListener("click", ()=> cheatToSuccess(1));
      }
    }, 1000);
  }
}
/* 电话簿浮窗（便签 + 3 秒限时） */
let pbTimer = null;
function openPhonebook(lvl){
  // 每次打开随机打乱顺序，增加记忆难度
  const entries = shuffle(lvl.phonebook);
  const rows = entries.map(p => `<div class="nr"><span>${p.dept}</span><span>${p.num}</span></div>`).join("");
  $("modal").innerHTML = `
    <div class="note">
      <span class="tape"></span>
      <span class="pin">📌</span>
      <button class="note-close" id="pb-close">×</button>
      <div class="note-title">${lvl.phonebookTitle}</div>
      <div class="note-timer" id="pb-timer">
        <div class="timer-ring" id="timer-ring"></div>
        <span class="timer-num" id="timer-num">${lvl.phonebookTimeout}</span>
      </div>
      <div class="note-list">${rows}</div>
    </div>`;
  $("modal").classList.add("note-mode");
  openModal();
  startPbTimer(lvl);
  $("pb-close").addEventListener("click", closePhonebook);
}
function startPbTimer(lvl){
  if(pbTimer) clearInterval(pbTimer);
  const total = lvl.phonebookTimeout * 1000;
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
      <div class="play-card">
        <div class="paper" id="l2-paper">
          <div class="paper-title">${lvl.paperTitle}</div>
          <div class="paper-body" id="l2-body">${cursorHTML()}</div>
        </div>
        <div class="cd" id="l2-cd">${fmtCd(lvl.countdownSeconds)}</div>
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
  lv2.cdTimer = setInterval(()=>{
    const el = (performance.now() - lv2.t0) / 1000;
    const remain = Math.max(0, lvl.countdownSeconds - el);
    $("l2-cd").textContent = fmtCd(remain);
    // 天色随倒计时从午后蓝转向五点金
    if(bg) bg.style.setProperty("--warm", Math.min(1, el / lvl.countdownSeconds).toFixed(3));
    if(remain <= 1 && bg) bg.classList.add("danger");
    if(remain <= 0){ lv2Fail(); }
  }, 30);
}
function lv2Win(){
  clearInterval(lv2.cdTimer);
  lv2.state = "done";
  $("l2-cd").textContent = "🎉";
  // 准点下班：太阳正好沉底、满屏金色
  const bg = $("l2-bg");
  if(bg){ bg.classList.remove("danger"); bg.classList.add("dawn"); bg.style.setProperty("--warm","1"); }
  // "已提交"出现后等 1.4s 再弹成功结算
  setTimeout(()=> runLevelSuccess(levelById(2), {}), 1400);
}
function lv2Fail(){
  clearInterval(lv2.cdTimer);
  lv2.state = "fail";
  failCounts[2]++;
  $("l2-cd").textContent = fmtCd(0);
  // 错过五点：天色一沉，暗示要加班
  const bg0 = $("l2-bg");
  if(bg0){ bg0.classList.remove("danger"); bg0.classList.add("overtime","sun-freeze"); }
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
  backToHall();
}

/* ==================== ⑬ 关卡 3：节拍点击 ==================== */
let lv3 = {};
function renderLevel3(lvl){
  setLevelAccent("level3", lvl);
  lv3 = { phase:"intro", actionIdx:0, fails:0, raf:null, running:false, results:[], token:0, timeout:null, stepTimer:null };
  $("view-level3").innerHTML = `
    ${bgLevel3()}
    <div class="view-scroll">
      ${levelHeader(lvl)}
      <div class="story-card" id="l3-intro"></div>
      <div class="play-card lv3-play">
        <div class="lv3-hint">${lvl.hint}</div>
        <div class="stage" id="l3-stage">
          <div class="bull" id="l3-bull"></div>
          <div class="ring" id="l3-ring"></div>
          <div class="action-emoji" id="l3-emoji">🕺</div>
          <div class="verdict" id="l3-verdict"></div>
        </div>
        <div class="lv3-progress" id="l3-progress">准备</div>
        <div class="lv3-actions">
          <button class="btn btn-accent l3-music" id="l3-music">${lvl.musicBtn}</button>
        </div>
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
  const bg = $("l3-bg");
  if(bg) bg.classList.add("live");  // 灯光进入节拍模式
  l3BeginAction();
}
function l3BeginAction(){
  const lvl = levelById(3);
  if(lv3.actionIdx >= lvl.actions.length){ l3Win(); return; }
  const emoji = lvl.actions[lv3.actionIdx];
  // 四个动作四种环色 + 四个角的气泡位置（颜色走 THEME，换肤同步）
  const colors = [T.accents[0], T.cyan, T.accents[2], T.neon];
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
}
const L3_DUR = 1500, L3_MIN = 0.51, L3_MAX = 0.77;
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
  l3PerfectFx();  // 舞台光波 + 音符飞起
  const v = $("l3-verdict");
  v.className = "verdict " + (lv3.corner || "corner-tr") + " perfect"; v.textContent = "✨ PERFECT";
  lv3.actionIdx++;
  if(lv3.stepTimer) clearTimeout(lv3.stepTimer);
  lv3.stepTimer = setTimeout(()=>{
    lv3.stepTimer = null;
    if(lv3.phase !== "done") l3BeginAction();
  }, 650);
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
  const v = $("l3-verdict");
  v.className = "verdict " + (lv3.corner || "corner-tr") + " miss"; v.textContent = "💥 MISS";

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
  lv3.running = false;
}

/* ==================== ⑭ 关卡 4：打包 ==================== */
let lv4 = {};
function renderLevel4(lvl){
  setLevelAccent("level4", lvl);
  lv4 = { chosen:[], phase:"intro" };
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
    return `<span class="suit-item">${o.e} ${o.n}<span class="rm" data-i="${i}">×</span></span>`;
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
    const p = loadProgress();
    p.finalVisited = true;
    saveProgress(p); progress = p;
    vibrate([30, 40, 30, 40, 60]);
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
    try{ localStorage.removeItem(STORE_KEY); }catch(e){}
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
function init(){
  renderOpening();
  showView("opening");
}
document.addEventListener("DOMContentLoaded", init);

})();
