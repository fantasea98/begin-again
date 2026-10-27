/* =========================================================
   《begin again》主逻辑
   - 所有文案 / 参数 / 颜色集中在 CONFIG 对象
   - 进度保存在 localStorage（键 beginAgain.progress）
   - 原生 HTML + CSS + JS，无框架、无第三方库
   - 外部资源只有三件：两个内嵌子集字体（style.css 里的 @font-face）+ 终页的 id-photo.svg
   ========================================================= */
(function(){
"use strict";

/* ==================== ① 全局配置区 ==================== */
const CONFIG = {

  // 主题：暖棕描边 + 米卡其纸感（手绘插画风）。改这里即可整体换视觉。
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
    deep: ["#E0BC2A", "#2691A8", "#E23C79", "#16352A"],  // 各关主题色的「稍微深一点」版本
    fragInk: ["#6B4520", "#2691A8", "#E23C79", "#16352A"],  // 「获得xx碎片」文字色
    fragBtn: ["#6B4520", "#38B2C8", "#D8448F", "#16352A"],  // 「收下碎片」按钮底色
    success: "#3DDC84",
    danger: "#E45D54",
    frame: "#26262b",       // 手机外框机身色
    frameRadius: 44,
    radiusSm: 12,
    radiusLg: 18,
    softShadow: "0 6px 20px rgba(26,26,26,0.08)",
    liftShadow: "0 14px 34px rgba(26,26,26,0.16)",
  },

  password: [5, 1, 4, 7],   // 最终密码（按关卡顺序 = 工号 5147）
  workDays: 1122,           // 在岗天数
  workDates: { start: "2023.10.05", end: "2026.10.30" },

  groupName: "中山大家庭(500)",
  hallTitle: "记忆房间",
  hallSubtitle: "找回 4 枚记忆碎片，修复时间线",
  lockHint: "请按照正确的时间线获取碎片",

  cheat: { label: "😏 我要作弊" },
  collectLabel: "收下碎片",
  backLabel: "← 回到房间",

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
    guide: "到底发生什么事了？\n勇敢智慧的你，请点击下方按钮，进入房间，\n找回 4 枚<b class=\"glow-word\">【碎片】</b>修复时间线！",
    likeCount: "24人已点赞",
    enterLabel: "🏢 进入房间 🏢",
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
      guideDelay: 4000,   // 「我穿越了」完全浮现后再等 4s 才出虚线框（比原来慢 0.5s）
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
    desc: ["你已经集齐所有碎片，试着输入密码吧！"],
    unlockLabel: "解锁",
    wrong: "密码不正确，看看碎片再想想",
    retry: "再试一次",
    correct: "密码正确。",
  },

  // 页面 D
  finalPage: {
    fileLabel: "员工档案",
    fileNo: "NO. 5147",
    fields: [
      { k: "姓名", v: "🐘🐏", big: true },
      { k: "工号", v: "5147" },
      { k: "部门", v: "组织部（统战部）" },
    ],
    dateLabel: "在职日期",
    daysLabel: "在职天数",
    unit: "天",
    sign: "🐘🐏",
    seal: "已离职",
  },

  // 最终留言（逐段淡入；每段停多久由「渲染出来的行数」自动决定，见 runFinalSequence）
  finalMessage: [
    "终于到了告别的时候。",
    "总觉得这一天来得又快又慢。从起心动念到付诸行动，其实只差一个开口的勇气，也恰恰是最难的部分；一旦做了决定，心里反而轻快许多。",
    "作为曾经的理科生，后又转型为文科生，独独不曾是医学生，我从来没想过会在医院工作。毕业的时候阴差阳错得到机会，便这样走进了这里。如今看来，这是一段不错的起点，我对此心怀感激。",
    "承蒙指导与关照，三年里我开始了解职场的运作逻辑，熟悉工作的节奏和方法，学会如何与人共事。许多事情都是在此逐渐领悟的，这些经历都会成为我的一部分。",
    "当然，这份工作也有一些我始终无法忽略的矛盾之处。常言道，言为心声，但我时常觉得，自己说出口的更像是「回声」，明明并非心中所想，却要说得妥帖；有些事即使不认同，也要做得周全。",
    "我不看朋友圈，不大关心他人的日常。某种程度上，我像《人生切割术》的人物一样，将工作与生活割开，让它们各自运行，互不打扰。于是，许多与我共事的人认识的是工作中的我，而生活中的我，则留在了工作之外。",
    "说到底，我始终是个见猎心喜的人。世界于我，有一种不会过时的诱惑力。遇见新鲜的事物，听闻遥远的故事，偶尔窥见生活的另一种可能，我还是忍不住心生向往。",
    "我们的社会正走在对世界不断祛魅的路上，习惯用理性和逻辑解读万物。年初读到李诞写南极看似矫情的一幕：烂船，骸骨，炼油罐，破房子，鲸鱼跃出水面的巨响，蓝色的鬼火……科学当然能够解释，鬼火是白磷，鲸跃则是因为痒。可解释完了，眼前的触动和浪漫并未随之消失。祛魅让世界变得容易理解，却没有让世界变得不再复杂。",
    "所以，我不想总是走在所谓「正确」的路上。我想被陌生吸引，被未知牵引，想保留一点不合时宜的好奇。我想知道更多，却也不愿让每一个答案都成为想象的终点。",
    "我想对世界重新「入魅」，并带着敬畏甜蜜地拥入其怀中。这算不算一种新的罗曼·罗兰式的英雄主义？",
    "感谢这三年里所有给予我帮助、支持与关照的人，也感谢单位和同事们对我这个决定的理解与成全。",
    "祝各位幸福，也祝各位偶尔入魅。",
    "下次见，在更广阔的天地。",
  ],

  // 四个关卡
  levels: [
    {
      id: 1, year: 2023, emoji: "📞", title: "初来乍到",
      fragment: 5, fragmentName: "入职碎片",
      tagline: "入职第一天，猜猜他是谁？",
      accentIndex: 0,
      intro: ["👂 听说<b class=\"deep-red-flash\">组织部</b>来了个年轻人。", "📞 快打电话问问看是谁吧。"],
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
      dialLines: ["嘟……接通📞", "「您好，组织部。」", "「听说你们来了个年轻人？」"],
      success: "<b class=\"glow-word\">🎉 联系成功！</b>",
      /* 彩蛋：这四个号码也会「接通」，但弹出的是专属文案。
         排版、逐句出现、音效都跟成功弹窗一致，结尾按钮仍然是「好的，再试一次」，
         而且照样计入失败次数（三次后照样出作弊按钮）。 */
      easterEggs: [
        {
          dept: "宣传部", num: "88374900",
          lines: [
            "嘟……接通📞",
            "「宣传部。」",
            "「中午健身吗？跳舞吗？」",
            "「都不。」",
            "「那食堂牛肉粉，我来叫你们。」",
          ],
        },
        {
          dept: "神经内科", num: "88888888",
          lines: [
            "「神内科。」",
            "「抱歉，我打错了。」",
            "「呵呵呵呵呵呵呵呵」",
            "背景里传来一阵<i class=\"egg-strong\">爽</i>朗的笑声。",
          ],
        },
        {
          dept: "消化内科", num: "88393583",
          lines: [
            "「……」",
            "「大医生在吗？」",
            "「……」",
            "「大医生 aka Rain 老师在吗？」",
            "「……」",
            "奇怪，怎么没声音？",
          ],
        },
        {
          dept: "质管部", num: "88374923",
          lines: [
            "「你好，%&@*#部。」",
            "「哪里？」",
            "「*&%#@#%*$！」",
            "「说啥？」",
            "「#%*&...#@$...！」",
            "「听不懂。秀？」",
            "「对哒。」",
          ],
        },
      ],
    },
    {
      id: 2, year: 2024, emoji: "💻", title: "好的，收到",
      fragment: 1, fragmentName: "牛马碎片",
      tagline: "你成长了，开始独当一面。",
      accentIndex: 1,
      intro: [
        "一个风平浪静的下午。🍵",
        "下班前一小时，领导叫住了你：",
        "<b class=\"red-flash\">「这份材料，今天内交给我。」🧨</b>",
        "既然如此，我和你拼了！💪",
      ],
      targetHits: 30,
      countdownSeconds: 5,
      blockChar: "█",
      paperTitle: "████████████",
      achievementName: "“先进个人”最速传说",
      success: "🎉 任务完成，恭喜准点下班！",
    },
    {
      id: 3, year: 2025, emoji: "🕺", title: "像你这样的朋友",
      fragment: 4, fragmentName: "唱跳碎片",
      tagline: "时光偷走遇见转角送来错过，四季飞快像坐过山车。",
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
      fragment: 7, fragmentName: "未来碎片",
      tagline: "离开以前，替我做选择。",
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
      thanksTail: "你的选择就是<b class=\"hl-word\">唯一的正确答案</b>。🎯",
      dropText: "最后一个碎片缓缓掉落。",
    },
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
const deepOf   = (lvl) => T.deep[lvl.accentIndex] || accentOf(lvl);
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
const VIEWS = ["lock","opening","hall","level1","level2","level3","level4","password","final"];
let currentView = null;
function showView(name){
  VIEWS.forEach(v => $("view-" + v).classList.remove("active"));
  const target = $("view-" + name);
  target.classList.add("active");
  target.scrollTop = 0;
  currentView = name;
  // 音效开关只在非开场页出现（开场页右上角是群聊「…」）
  const sc = $("screen");
  if(sc) sc.classList.toggle("sfx-show", name !== "opening" && name !== "lock");
  // 告别信的音乐只属于终页：离开就淡出，回来再从第一段重新起
  if(name !== "final"){ try{ SFX.letterMusicStop(); }catch(e){} }
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

/* ==================== ⑥ 背景碎屑（纯装饰的几何/emoji 粒子） ==================== */
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

/* ==================== ⑦ 锁屏页（滑动解锁 + 假面容 ID） ==================== */
/* 解锁只有一条路：把滑块拖过 70%。轻触 / 长按都不再生效。
   音频这边不受影响：`audioNet()` 的全局手势网一直挂在 document 上（touchend / click），
   滑块松手那一下同样会走到它；万一某些机型（iOS Safari 对拖拽不给用户激活）
   真没叫醒声音，开场 3.2 秒后会出现「轻触开启」的兜底按钮，点一下就通。
   面容 ID 动画保留，它既是仪式感，也把「松手」和「第一声」之间撑开 1.46 秒。 */
let phoneUnlocked = false;
function lockDateText(){
  const d = (CONFIG.workDates.end || "").split(".");
  return d.length === 3 ? `${d[0]}年${+d[1]}月${+d[2]}日` : (CONFIG.workDates.end || "");
}
function renderLock(){
  $("view-lock").innerHTML = `
    <div class="lock">
      <svg class="lock-bg" viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <defs>
          <linearGradient id="lgSky2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#F6B27B"/><stop offset=".3" stop-color="#F49A5F"/>
            <stop offset=".52" stop-color="#EE7F4C"/><stop offset="1" stop-color="#E5673F"/>
          </linearGradient>
          <linearGradient id="lgSea2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#DE8048"/><stop offset=".4" stop-color="#C06339"/>
            <stop offset="1" stop-color="#93452A"/>
          </linearGradient>
          <radialGradient id="lgSunGlow" cx=".5" cy=".5" r=".5">
            <stop offset="0" stop-color="#FFEFC8" stop-opacity=".8"/>
            <stop offset=".55" stop-color="#FFDF9E" stop-opacity=".32"/>
            <stop offset="1" stop-color="#FFDF9E" stop-opacity="0"/>
          </radialGradient>
          <linearGradient id="lgCol" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#FFE9BC" stop-opacity=".75"/>
            <stop offset=".6" stop-color="#FFDFa0" stop-opacity=".28"/>
            <stop offset="1" stop-color="#FFDF9E" stop-opacity="0"/>
          </linearGradient>
          <filter id="lb18" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="18"/></filter>
          <filter id="lb26" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="26"/></filter>
          <filter id="lb10" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="10"/></filter>
          <filter id="lb7"  x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="7"/></filter>
          <linearGradient id="lgHorizon" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#FFE9C2" stop-opacity="0"/>
            <stop offset=".5" stop-color="#FFEBC6" stop-opacity=".38"/>
            <stop offset="1" stop-color="#FFDCA8" stop-opacity="0"/>
          </linearGradient>
        </defs>
        <rect width="390" height="844" fill="url(#lgSky2)"/>
        <ellipse cx="110" cy="84" rx="190" ry="30" fill="#F4B49C" opacity=".32" filter="url(#lb26)"/>
        <ellipse cx="290" cy="158" rx="150" ry="24" fill="#FFDDB8" opacity=".5" filter="url(#lb26)"/>
        <ellipse cx="120" cy="228" rx="160" ry="26" fill="#FFD3A6" opacity=".42" filter="url(#lb26)"/>
        <ellipse cx="260" cy="320" rx="190" ry="22" fill="#FAC294" opacity=".34" filter="url(#lb26)"/>
        <circle cx="330" cy="418" r="102" fill="url(#lgSunGlow)"/>
        <circle cx="330" cy="418" r="30" fill="#FFEEC6"/>
        <circle cx="330" cy="418" r="30" fill="#FFEEC6" opacity=".55" filter="url(#lb7)"/>
        <rect y="520" width="390" height="328" fill="url(#lgSea2)" filter="url(#lb10)"/>
        <rect x="-20" y="502" width="430" height="38" fill="url(#lgHorizon)" filter="url(#lb10)"/>
        <ellipse cx="196" cy="612" rx="150" ry="9" fill="#FFDCA8" opacity=".22" filter="url(#lb10)"/>
        <ellipse cx="206" cy="664" rx="122" ry="7" fill="#FFD29A" opacity=".16" filter="url(#lb10)"/>
        <ellipse cx="214" cy="716" rx="96" ry="6" fill="#FFC993" opacity=".12" filter="url(#lb10)"/>
      </svg>

      <div class="lock-status">
        <span class="ls-op">Off the Grid</span>
        <span class="ls-right">
          <span class="ls-bat"><i style="width:78%"></i></span>
          <b>78%</b>
        </span>
      </div>

      <div class="lock-head">
        <div class="lock-date">10月30日 星期五</div>
        <div class="lock-time">17:00</div>
        <div class="lock-sub">丙午年九月廿一 · 宜告别，宜启程</div>
      </div>

      <div class="lock-cards">
        <div class="lc lc-weather">
          <span class="lc-row1">
            <!-- 天气图标：外框和内联尺寸与原来的 svg 完全一致（27×27、同样 -11px 下移），
                 所以「21°」「晚霞满天」的位置一点不动；emoji 自己在里面单独绝对定位，
                 想调它的高低只改 .lc-emoji 里的 translateY，不会牵动同一行的文字 -->
            <span class="lc-ico lc-emoji" aria-hidden="true"><span>🌤️</span></span>
            <b>21°</b>
            <span class="lc-mid">晚霞满天</span>
          </span>
          <em>最高 24° / 最低 15°</em>
        </div>
        <div class="lc lc-face">
          <b class="face">( ˘‿˘ )</b>
          <span>心情晴朗</span>
        </div>
      </div>

      <div class="lock-word">
        <div class="lw-script">begin again</div>
        <svg class="lw-swash" viewBox="0 0 300 42" aria-hidden="true">
          <path d="M8 30 C 92 8, 188 36, 250 17 q15 -5 28 3" stroke="#FFF6E4" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".85"/>
          <path d="M60 24 C 120 14, 190 26, 236 18" stroke="#FFF6E4" stroke-width="1.1" fill="none" stroke-linecap="round" opacity=".4"/>
        </svg>
      </div>

      <div class="lock-bottom">
        <div class="lock-bar" id="lock-bar">
          <div class="lock-fill" id="lock-fill"></div>
          <div class="lock-hint" id="lock-hint">滑动解锁</div>
          <i class="lock-chev">››</i>
          <div class="lock-knob" id="lock-knob">🔓</div>
        </div>
        <div class="lock-tip">建议关闭静音模式</div>
      </div>

      <!-- 假的面容 ID 识别框：真正的作用是让用户「点一下」——
           iOS 只认点按（touchend / click）这一下为用户激活，滑动不算。
           顺手也把解锁做成一整套仪式：识别框 → 打勾 → 开锁。 -->
      <div class="faceid" id="faceid" aria-hidden="true">
        <div class="fid-card">
          <div class="fid-glyph">
            <span class="fid-ring"></span>
            <svg class="fid-svg" viewBox="0 0 120 120" fill="none" stroke="currentColor"
                 stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <g class="fid-corners">
                <path pathLength="100" d="M20 46V32a12 12 0 0 1 12-12h14"/>
                <path pathLength="100" d="M74 20h14a12 12 0 0 1 12 12v14"/>
                <path pathLength="100" d="M100 74v14a12 12 0 0 1-12 12H74"/>
                <path pathLength="100" d="M46 100H32a12 12 0 0 1-12-12V74"/>
              </g>
              <g class="fid-face">
                <path d="M45 43v11"/>
                <path d="M75 43v11"/>
                <path d="M60 51v16"/>
                <path d="M47 78c3.2 5.6 7.8 8.6 13 8.6s9.8-3 13-8.6"/>
              </g>
              <path class="fid-check" pathLength="100" d="M42 62l13 13 25-28"/>
            </svg>
          </div>
          <div class="fid-title">面容 ID</div>
          <div class="fid-sub" id="fid-sub">正在识别…</div>
        </div>
      </div>
    </div>`;
  bindLock();
}
function bindLock(){
  const bar = $("lock-bar"), knob = $("lock-knob"), fill = $("lock-fill");
  if(!bar) return;
  const maxX = () => Math.max(1, bar.clientWidth - knob.offsetWidth);
  let dragging = false, startX = 0, x = 0, moved = false, done = false;
  const setX = (v) => {
    knob.style.transform = "translateX(" + v + "px)";
    fill.style.width = (v + knob.offsetWidth) + "px";
    $("lock-hint").style.opacity = String(Math.max(0, 1 - v / (maxX() * 0.6)));
  };
  setX(0);
  const onDown = (e) => {
    if(done) return;
    dragging = true; moved = false; startX = e.clientX;
    try{ if(e.pointerId != null) bar.setPointerCapture(e.pointerId); }catch(err){}
  };
  const onMove = (e) => {
    if(!dragging || done) return;
    const dx = e.clientX - startX;
    if(Math.abs(dx) > 4) moved = true;
    x = Math.max(0, Math.min(maxX(), dx));
    setX(x);
  };
  if(window.PointerEvent){
    bar.addEventListener("pointerdown", onDown);
    bar.addEventListener("pointermove", onMove);
  } else {                                   // 老设备没有 PointerEvent，退回 touch
    bar.addEventListener("touchstart", (e) => onDown(e.touches[0]), { passive:true });
    bar.addEventListener("touchmove", (e) => onMove(e.touches[0]), { passive:true });
  }
  const finish = () => {
    if(!dragging || done) return;
    dragging = false;
    if(x > maxX() * 0.7){
      done = true;
      knob.style.transition = "transform .18s ease";
      setX(maxX());
      unlockPhone();                       // 拖动解锁：仍走同一条「面容 ID」动画
      return;
    }
    if(!moved) return;                     // 原地轻触不解锁，也不回弹（让滑块留在原地）
    knob.style.transition = "transform .3s cubic-bezier(.3,1.5,.5,1)";
    fill.style.transition = "width .3s ease";
    setX(0);
    setTimeout(()=>{ knob.style.transition = ""; fill.style.transition = ""; }, 340);
  };
  ["pointerup","pointercancel","pointerleave"].forEach(ev => bar.addEventListener(ev, finish));
  ["touchend","touchcancel"].forEach(ev => bar.addEventListener(ev, finish));
}

/* 解锁音效可能会在「上下文还没建好」时被调用。
   所以这里挂一个待播标记：等音频真正 running 的那一刻再补一声，绝不丢。 */
let unlockChimePending = false;
function tryUnlockChime(){
  if(!unlockChimePending) return false;
  let st = null;
  try{ st = SFX._debug && SFX._debug(); }catch(e){}
  if(st && st.state === "running"){
    unlockChimePending = false;
    try{ SFX.unlock(); }catch(e){}
    return true;
  }
  return false;
}

/* 假的「面容 ID」：0 → 1.0s 识别，1.0s 打勾 + 鸣响，1.46s 收起并进入开场。
   这套动画还把「点按」和「真正出声」之间撑开了一小段缓冲，
   等识别框收起来的时候音频早已 running，开场的第一声绝不会丢。 */
let faceIdOn = false;
function runFaceId(){
  const ov = $("faceid");
  if(!ov || faceIdOn) return;
  faceIdOn = true;
  ov.classList.add("on");
  const beep = () => {
    try{ if(SFX._debug().state === "running") SFX.tick(false); }catch(e){}
  };
  beep();
  setTimeout(beep, 430);                    // 识别中再轻轻滴一下
  setTimeout(() => {
    ov.classList.add("ok");
    const sub = $("fid-sub");
    if(sub) sub.textContent = "已识别";
    unlockChimePending = true;              // 现在才允许响「开锁」那一声
    tryUnlockChime();
  }, 1000);
  setTimeout(() => {
    ov.classList.remove("on");
    beginStory();
  }, 1460);
}

/* 真正进入故事：解锁动画放完才渲染开场，音效时间点才对得上 */
let storyBegun = false;
function beginStory(){
  if(storyBegun) return;
  storyBegun = true;
  renderOpening();            // 解锁后才开始微信开场动画，音效不会丢
  showView("opening");
  armSoundNudge();            // 兜底：真没醒就给个一键开启的按钮
}

function unlockPhone(){
  if(phoneUnlocked) return;
  phoneUnlocked = true;
  /* 这一下是「松手」的那个事件栈（pointerup → touchend），
     仍然尽力解锁：建上下文 / 重建 / resume / start 一个 1 采样 source / 播静音 wav。
     iOS 对拖拽可能不给用户激活，那就靠下面的温和续命 + 兜底按钮，不影响其它机型。 */
  try{ SFX.hardUnlock(); }catch(e){}
  /* 激活只在这一瞬间有效，之后靠温和的 resume 续命；不用重建，免得打断异步 resume。 */
  [80, 260, 620, 1100, 1800, 2600, 3600].forEach(ms => setTimeout(() => {
    try{ SFX.wake(); }catch(e){}
    tryUnlockChime();
  }, ms));
  runFaceId();
}

/* ==================== ⑧ 穿越预示动画（闪现 + 扭曲） ==================== */

function playGlitch(){
  const flash = $("flash");
  const frame = document.querySelector(".phone-frame");
  frame.classList.add("glitch");
  flash.style.opacity = "1";
  setTimeout(()=>{ flash.style.opacity = "0"; }, 220);
  setTimeout(()=>{ frame.classList.remove("glitch"); }, 760);
}

/* ==================== ⑨ 页面 A：开场微信群聊叙事 ==================== */
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
  setTimeout(()=>{ add(`
    <div class="msg self pop">
      <div class="avatar">${c.player.avatar}</div>
      <div class="bubble">${c.player.text}</div>
    </div>`); SFX.bubble(true); }, t.firstMsg);

  // 2. 时空乱流：剧烈扭曲（画面 + 声音同帧）
  setTimeout(()=>{ playGlitch(); SFX.glitch(); }, t.glitch);

  // 3. 系统提示（粉红闪烁）
  setTimeout(()=>{ add(`
    <div class="sys-alert"><span class="pill">${c.sysAlert}</span></div>`); SFX.sysalert(); }, t.sysAlert);

  // 4. 穿越后的他人消息（白色气泡；点赞框不在渲染时占位）
  c.messages.forEach((m, i) => {
    setTimeout(()=>{ add(`
      <div class="msg pop">
        <div class="avatar">${m.avatar}</div>
        <div class="bubble">${m.text}</div>
      </div>`); SFX.bubble(false); }, t.othersStart + i * t.othersGap);
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
        SFX.like();
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

  setTimeout(()=>{ add(`<div class="mono pop" id="mono-box"><p>${th1}</p></div>`); SFX.thought(); }, th1At);
  setTimeout(()=>{
    const box = $("mono-box");
    if(box) box.insertAdjacentHTML("beforeend", `<p>${th2.a}<span class="mono-b fade-in">${th2.b}</span></p>`);
  }, th2At);
  setTimeout(()=>{
    const el = document.querySelector(".mono-b");
    if(el){ el.classList.add("on"); }
    try{ SFX.fragment(); }catch(e){}      // 「我穿越了？」浮出来的那一下
  }, th2At + 900);

  // 7. 引导 + 按钮
  setTimeout(()=>{
    add(`
    <div class="guide guide-in">
      <div class="guide-box">
        <div class="guide-text">${c.guide}</div>
        <button class="btn btn-primary btn-block no-tap" id="btn-enter">${c.enterLabel}</button>
      </div>
    </div>`);
    SFX.announce();          // 隆重登场的提示框音效（低沉一记 + 铺开的光）
    const b = $("btn-enter");
    if(b) b.addEventListener("click", () => {
      SFX.hardUnlock();         // 这是真点击，允许重建，务必把音频叫醒
      SFX.portal();             // 进入房间的仪式音效
      initHallYear();           // 落在第一个还没通关的年份
      renderHall(); showView("hall");
    });
  }, guideAt);
}

/* ==================== ⑩ 页面 B：回忆大厅（同一间办公室 · 四年） ==================== */
/* 设计要点：
   - 四屏共用同一套「墙 / 窗 / 门 / 桌 / 椅 / 地板」，这是「同一间房」的锚点
   - 年份靠两条隐藏线索读出来：墙上挂钟的时刻 + 窗外的天色
   - 可点物带暖黄柔光呼吸（.hs-hot），未解锁的物不发光
   - 椅子统一背对玩家、在桌子前面；2026 推回桌下只露矮椅背
   - 全通关后，年份条下方出现「最后的门」按钮 → 房间切换成居中密码门 */
let hallYear = 2023;
let hallDoorView = false;

/* 把标题开头的 emoji 拆出来单独放大（例如「🏢 记忆房间」） */
function splitEmoji(t){
  const m = /^(\p{Extended_Pictographic}(?:\u200d\p{Extended_Pictographic})*)\s*([\s\S]*)$/u.exec(t || "");
  return m ? `<span class="title-emoji">${m[1]}</span>${m[2]}` : t;
}
function levelByYear(y){ return CONFIG.levels.find(l => l.year === y) || CONFIG.levels[0]; }
function isLevelUnlocked(id){
  const p = progress;
  return p["level" + id].done || id === 1 || p["level" + (id - 1)].done;
}
/* 进大厅时落在「第一个还没通关的年份」 */
function initHallYear(){
  const un = CONFIG.levels.find(l => !progress["level" + l.id].done);
  hallYear = (un || CONFIG.levels[CONFIG.levels.length - 1]).year;
  hallDoorView = false;
}
function curHallLevel(){ return levelByYear(hallYear); }
/* 深色主题色上的文字要反白 */
function isDarkColor(hex){
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return (r * .299 + g * .587 + b * .114) < 150;
}
/* 把浅色主题色压深一点，好让白色文字站得住 */
function mixDark(hex, k){
  const n = parseInt(hex.slice(1), 16);
  const t = parseInt("6B4520", 16);
  const mix = (a, b) => Math.round(a * (1 - k) + b * k);
  const r = mix((n >> 16) & 255, (t >> 16) & 255);
  const g = mix((n >> 8) & 255, (t >> 8) & 255);
  const b = mix(n & 255, t & 255);
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

/* 挂钟：四年指四个时刻 —— 8:00 / 16:30 / 21:00 / 5:00 */
const HALL_CLOCK = { 2023: [8, 0], 2024: [16, 30], 2025: [21, 0], 2026: [5, 0] };
function clockHands(y){
  const t = HALL_CLOCK[y] || [8, 0];
  const cx = 118, cy = 50, R = 13;
  const ha = ((t[0] % 12) + t[1] / 60) * Math.PI / 6;
  const ma = t[1] * Math.PI / 30;
  const hx = cx + Math.sin(ha) * R * 0.5, hy = cy - Math.cos(ha) * R * 0.5;
  const mx = cx + Math.sin(ma) * R * 0.82, my = cy - Math.cos(ma) * R * 0.82;
  return `<line x1="${cx}" y1="${cy}" x2="${hx.toFixed(1)}" y2="${hy.toFixed(1)}" stroke="#7A5A38" stroke-width="1.8" stroke-linecap="round"/>`
       + `<line x1="${cx}" y1="${cy}" x2="${mx.toFixed(1)}" y2="${my.toFixed(1)}" stroke="#7A5A38" stroke-width="1.1" stroke-linecap="round"/>`;
}

/* 窗外：白天 → 下午的太阳 → 夜里的礼堂灯 → 黄昏（内容被裁剪在窗框内，不会穿模） */
function windowSky(y){
  const box = 'x="22" y="24" width="62" height="56"';
  if(y === 2023) return `<rect ${box} fill="#DDEEFB"/>
    <ellipse cx="42" cy="40" rx="11" ry="5" fill="#FFFFFF" opacity=".95"/>
    <ellipse cx="56" cy="46" rx="9" ry="4.5" fill="#FFFFFF" opacity=".9"/>
    <ellipse cx="70" cy="34" rx="7" ry="3.5" fill="#FFFFFF" opacity=".8"/>`;
  if(y === 2024) return `<rect ${box} fill="#FFE2B4"/>
    <circle cx="66" cy="40" r="13" fill="#FFD166" opacity=".35"/>
    <circle cx="66" cy="40" r="7.5" fill="#FFC24D"/>`;
  if(y === 2025) return `<rect ${box} fill="#3A2350"/>
    <rect x="22" y="62" width="62" height="18" fill="#2A1840" opacity=".8"/>
    <rect x="56" y="56" width="22" height="12" rx="1.5" fill="#241436"/>
    <circle cx="61" cy="61" r="1.6" fill="#FFDE59"/><circle cx="66" cy="61" r="1.6" fill="#FFDE59"/><circle cx="71" cy="61" r="1.6" fill="#FFDE59"/>
    <circle cx="36" cy="38" r="1.8" fill="#FFDE59"/>
    <circle cx="48" cy="33" r="1.4" fill="#FF9BB5"/>
    <circle cx="58" cy="43" r="1.4" fill="#5DCAA5"/>
    <circle cx="44" cy="50" r="1.2" fill="#FFDE59"/>`;
  return `<rect ${box} fill="#F7BE8A"/>
    <circle cx="52" cy="76" r="14" fill="#FFD9A0" opacity=".4"/>
    <circle cx="52" cy="76" r="8.5" fill="#FFB067"/>
    <rect x="22" y="72" width="62" height="8" fill="#E08A4A" opacity=".35"/>`;
}

/* 门：圆拱顶木门。2024 挂白大褂；2025 挂演出服（绿色连帽卫衣，同一套衣架） */
function doorSVG(y, ready){
  /* 衣架：两种衣服共用（钩 + 三角架） */
  const hanger = `
    <line x1="296" y1="60" x2="296" y2="66" stroke="#B4B2A9" stroke-width="1.4"/>
    <path d="M296 66 L286 76 L306 76 Z" fill="none" stroke="#B4B2A9" stroke-width="1.3"/>`;
  const coat = (y === 2024) ? `
    ${hanger}
    <path d="M296 74 Q283 80 282 92 L280 148 Q296 156 312 148 L310 92 Q309 80 296 74 Z" fill="#FFFFFF" stroke="#D8CDB8" stroke-width="1.3"/>
    <path d="M291 76 L296 88 L301 76 Q296 73 291 76 Z" fill="#FFFDF4" stroke="#D8CDB8" stroke-width="1.2"/>
    <rect x="286" y="112" width="9" height="9" rx="2" fill="#F3EDE1" stroke="#D8CDB8" stroke-width="1"/>
    <rect x="297" y="112" width="9" height="9" rx="2" fill="#F3EDE1" stroke="#D8CDB8" stroke-width="1"/>
    <line x1="296" y1="92" x2="296" y2="142" stroke="#E4DFD2" stroke-width="1"/>` : "";
  /* 绿色连帽卫衣：帽子挂在领子后面、抽绳垂下、正面两个口袋 */
  const hoodie = (y === 2025) ? `
    ${hanger}
    <path d="M296 74 Q283 80 282 92 L280 148 Q296 156 312 148 L310 92 Q309 80 296 74 Z" fill="#7FBF8A" stroke="#4F8F60" stroke-width="1.3"/>
    <path d="M286 80 Q296 68 306 80 Q306 92 296 95 Q286 92 286 80 Z" fill="#6AAF77" stroke="#4F8F60" stroke-width="1.2"/>
    <path d="M291 76 L296 90 L301 76 Q296 72 291 76 Z" fill="#EAF7EE" stroke="#4F8F60" stroke-width="1.2"/>
    <line x1="292" y1="90" x2="291" y2="100" stroke="#EAF7EE" stroke-width="1.4" stroke-linecap="round"/>
    <line x1="300" y1="90" x2="301" y2="100" stroke="#EAF7EE" stroke-width="1.4" stroke-linecap="round"/>
    <circle cx="291" cy="101" r="1.6" fill="#EAF7EE" stroke="#4F8F60" stroke-width=".8"/>
    <circle cx="301" cy="101" r="1.6" fill="#EAF7EE" stroke="#4F8F60" stroke-width=".8"/>
    <rect x="286" y="122" width="11" height="11" rx="2.5" fill="#6AAF77" stroke="#4F8F60" stroke-width="1"/>
    <rect x="301" y="122" width="11" height="11" rx="2.5" fill="#6AAF77" stroke="#4F8F60" stroke-width="1"/>
    <line x1="296" y1="106" x2="296" y2="150" stroke="#5FA36C" stroke-width="1"/>` : "";
  return `
    <ellipse cx="296" cy="193" rx="34" ry="5" fill="rgba(120,80,40,.10)"/>
    <path d="M268 194 L268 70 Q268 54 284 54 L308 54 Q324 54 324 70 L324 194 Z" fill="#EDCB92" stroke="#C98F5A" stroke-width="1.8"/>
    <rect x="276" y="64" width="40" height="48" rx="6" fill="#F7E3BC" stroke="#C98F5A" stroke-width="1.1"/>
    <rect x="276" y="122" width="40" height="56" rx="6" fill="#F7E3BC" stroke="#C98F5A" stroke-width="1.1"/>
    <circle cx="316" cy="128" r="2.6" fill="#E5A83B" stroke="#C98F5A" stroke-width="1"/>
    ${coat}${hoodie}`;
}

/* 椅子：四个年份完全一致 —— 背对玩家、拉在桌子前面 */
function chairSVG(){
  return `<g>
    <ellipse cx="120" cy="194" rx="26" ry="4.5" fill="rgba(120,80,40,.10)"/>
    <rect x="100" y="151" width="40" height="37" rx="10" fill="#FFD9A8" stroke="#C98F5A" stroke-width="1.6"/>
    <rect x="105" y="156" width="30" height="24" rx="7" fill="#FFEDCB"/>
    <rect x="104" y="188" width="5" height="8" rx="1.5" fill="#C98F5A"/>
    <rect x="131" y="188" width="5" height="8" rx="1.5" fill="#C98F5A"/>
  </g>`;
}
/* 垃圾桶：椅子右边、桌下。2024 满满当当（纸团略微堆出来），2026 空 */
function binSVG(y){
  const full = (y === 2024);
  const junk = full ? `
    <path d="M154 172 q5 -7 10 -2 q6 -6 10 2 l1 6 Z" fill="#F3EDE1" stroke="#C98F5A" stroke-width="1"/>
    <circle cx="159" cy="168" r="4" fill="#FFFDF4" stroke="#C98F5A" stroke-width="1"/>
    <circle cx="169" cy="171" r="3.4" fill="#FFFDF4" stroke="#C98F5A" stroke-width="1"/>` : "";
  return `<g>
    ${junk}
    <rect x="151" y="170" width="22" height="6" rx="2" fill="#EFE7D8" stroke="#C98F5A" stroke-width="1.2"/>
    <path d="M154 176 h16 l-2.5 18 h-11 Z" fill="#E7DDC9" stroke="#C98F5A" stroke-width="1.2"/>
  </g>`;
}
/* 2026：墙上的离职倒计时日历，上边缘是被撕掉的不整齐锯齿 */
function calendarSVG(){
  let zig = "M168 26";
  for(let x = 168; x < 232; x += 8) zig += ` q4 ${(x / 8) % 2 ? 4 : -5} 8 0`;
  return `<g>
    <path d="${zig} L232 26 L232 86 L168 86 Z" fill="#FFFDF6" stroke="#D8CDB8" stroke-width="1.3"/>
    <rect x="168" y="26" width="64" height="13" fill="#E5735A"/>
    <text x="200" y="36" text-anchor="middle" font-size="10" font-weight="700" fill="#FFFFFF">离职倒计时</text>
    <text x="200" y="64" text-anchor="middle" font-size="17" font-weight="800" fill="#E5735A">0 天</text>
    <line x1="174" y1="71" x2="226" y2="71" stroke="#EADFC6" stroke-width="1"/>
    <line x1="174" y1="79" x2="214" y2="79" stroke="#EADFC6" stroke-width="1"/>
  </g>`;
}
/* 2024：墙上的白板，写着工作日历 */
function whiteboardSVG(){
  return `<g>
    <rect x="150" y="14" width="100" height="72" rx="5" fill="#FFFDF6" stroke="#C98F5A" stroke-width="1.8"/>
    <text x="200" y="30" text-anchor="middle" font-size="11" font-weight="700" fill="#6B4520">工作日历</text>
    <line x1="156" y1="35" x2="244" y2="35" stroke="#EADFC6" stroke-width="1.2"/>
    <rect x="160" y="41" width="34" height="11" rx="3" fill="#FFE08A"/>
    <rect x="200" y="41" width="40" height="11" rx="3" fill="#BFE6C9"/>
    <rect x="160" y="56" width="50" height="11" rx="3" fill="#FFD1DC"/>
    <rect x="216" y="56" width="24" height="11" rx="3" fill="#BFE6C9" opacity=".7"/>
    <rect x="160" y="71" width="70" height="8" rx="3" fill="#EADFC6"/>
  </g>`;
}

/* 整个房间的矢量图（随容器宽度等比缩放，天然适配竖屏） */
function roomSVG(){
  const lv = curHallLevel(), y = lv.year, p = progress;
  const halo = (x, b, w, h, r) => `<rect class="hs-halo" x="${x}" y="${b}" width="${w}" height="${h}" rx="${r == null ? 6 : r}"/>`;
  let hot = "", props = "", stamp = "";

  if(y === 2023){
    stamp = "2023.10";
    hot = `<g class="hs-hot${isLevelUnlocked(1) ? "" : " is-locked"}" data-lv="1" role="button" aria-label="特别的物品">
      ${halo(26, 109, 50, 46, 9)}
      <rect x="33" y="130" width="36" height="20" rx="5" fill="#FFF8E8" stroke="#C98F5A" stroke-width="1.8"/>
      <circle cx="42" cy="138" r="1.8" fill="#C98F5A"/><circle cx="51" cy="138" r="1.8" fill="#C98F5A"/><circle cx="60" cy="138" r="1.8" fill="#C98F5A"/>
      <circle cx="42" cy="145" r="1.8" fill="#C98F5A"/><circle cx="51" cy="145" r="1.8" fill="#C98F5A"/><circle cx="60" cy="145" r="1.8" fill="#C98F5A"/>
      <rect x="31" y="119" width="40" height="8" rx="4" fill="#C98F5A"/>
      <rect x="35" y="114" width="7" height="7" rx="3" fill="#C98F5A"/>
      <rect x="60" y="114" width="7" height="7" rx="3" fill="#C98F5A"/>
    </g>`;
    props = `
      <rect x="186" y="133" width="16" height="17" rx="3" fill="#BFE6C9" stroke="#7FBF9A" stroke-width="1.5"/>
      <path d="M202 137 q6.5 0 6.5 4.6 q0 4.6 -6.5 4.6" fill="none" stroke="#7FBF9A" stroke-width="1.6"/>
      <ellipse cx="194" cy="134" rx="6.6" ry="1.9" fill="#8FCBA8" opacity=".55"/>
      <g class="tea-steam" fill="none" stroke="#7FC3A4" stroke-width="1.8" stroke-linecap="round">
        <path d="M190.5 129 c3.4 -5.2 -3.4 -7.2 0 -11.8"/>
        <path d="M197 128.5 c3.4 -4.6 -3.4 -6.6 0 -10.8"/>
      </g>`;
  } else if(y === 2024){
    stamp = "2024.06";
    hot = `<g class="hs-hot${isLevelUnlocked(2) ? "" : " is-locked"}" data-lv="2" role="button" aria-label="特别的物品">
      ${halo(81, 85, 78, 70, 8)}
      <rect x="86" y="90" width="68" height="52" rx="6" fill="#FFF8E8" stroke="#C98F5A" stroke-width="1.8"/>
      <rect x="92" y="96" width="56" height="40" rx="4" fill="#F2EFE6"/>
      <line x1="98" y1="105" x2="138" y2="105" stroke="#CFC9BB" stroke-width="2.6" stroke-linecap="round"/>
      <line x1="98" y1="113" x2="142" y2="113" stroke="#CFC9BB" stroke-width="2.6" stroke-linecap="round"/>
      <line x1="98" y1="121" x2="130" y2="121" stroke="#CFC9BB" stroke-width="2.6" stroke-linecap="round"/>
      <path d="M115 142 h12 l4 8 h-20 Z" fill="#C98F5A"/>
      <rect x="144" y="95" width="10" height="10" rx="2" fill="#FFE08A" transform="rotate(-6 149 100)"/>
      <rect x="145" y="108" width="8" height="8" rx="2" fill="#FFD1DC" transform="rotate(7 149 112)"/>
    </g>`;
    props = `
      ${whiteboardSVG()}
      <rect x="26" y="143" width="48" height="7" rx="2.5" fill="#E58BB0" stroke="#C98F5A" stroke-width="1"/>
      <rect x="28" y="136" width="44" height="7" rx="2.5" fill="#8AD1FF" stroke="#C98F5A" stroke-width="1"/>
      <rect x="26" y="129" width="46" height="7" rx="2.5" fill="#FFDE59" stroke="#C98F5A" stroke-width="1"/>
      <rect x="32" y="122" width="36" height="7" rx="2" fill="#FFFDF4" stroke="#C98F5A" stroke-width="1"/>
      <line x1="36" y1="126" x2="62" y2="126" stroke="#DCD6C9" stroke-width="1.2"/>
      <path d="M186 130 q4 -4 1 -8 q-3 -4 1 -7" fill="none" stroke="#D8CDB8" stroke-width="1.4" stroke-linecap="round"/>
      <path d="M194 132 q4 -4 1 -8" fill="none" stroke="#D8CDB8" stroke-width="1.4" stroke-linecap="round"/>
      <rect x="176" y="148" width="28" height="2.5" rx="1.2" fill="#EADFC6"/>
      <rect x="180" y="136" width="20" height="12" rx="3" fill="#FFFDF4" stroke="#C98F5A" stroke-width="1.4"/>
      <rect x="180" y="136" width="20" height="4" rx="2" fill="#B98A4E"/>
      <path d="M200 139 q6 2 4 7 q-2 4 -6 3" fill="none" stroke="#C98F5A" stroke-width="1.4"/>
`;
  } else if(y === 2025){
    stamp = "2025.02";
    hot = `<g class="hs-hot${isLevelUnlocked(3) ? "" : " is-locked"}" data-lv="3" role="button" aria-label="特别的物品">
      ${halo(145, 11, 110, 80, 9)}
      <rect x="150" y="16" width="100" height="70" rx="7" fill="#FBEAF0" stroke="#E39AB5" stroke-width="2.4"/>
      <path d="M158 16 l7 8 l7 -8 l7 8 l7 -8 l7 8 l7 -8 l7 8 l7 -8 l7 8 l7 -8 l7 8 l7 -8" fill="none" stroke="#E39AB5" stroke-width="1.6"/>
      <text x="200" y="47" text-anchor="middle" font-size="19" font-weight="800" fill="#993556">中山春晚</text>
      <path d="M176 76 L200 56 L224 76 Z" fill="#C77DFF" opacity=".92"/>
      <circle cx="184" cy="66" r="2" fill="#FFDE59"/>
      <circle cx="216" cy="68" r="2" fill="#FF9BB5"/>
      <line x1="172" y1="80" x2="228" y2="80" stroke="#E4A9BE" stroke-width="1.6"/>
    </g>`;
    props = `
      <path d="M18 12 Q50 25 82 12 Q114 25 146 12" fill="none" stroke="#FF9BB5" stroke-width="1.3"/>
      <circle cx="50" cy="22" r="2.2" fill="#FFDE59"/>
      <circle cx="82" cy="14" r="2.2" fill="#5DCAA5"/>
      <circle cx="114" cy="22" r="2.2" fill="#C77DFF"/>
      <path d="M44 122 h16 v15 h-16 Z" fill="#F5C64F" stroke="#C98F5A" stroke-width="1.4"/>
      <path d="M44 126 Q36 128 38 134 Q39 138 44 138" fill="none" stroke="#C98F5A" stroke-width="1.5"/>
      <path d="M60 126 Q68 128 66 134 Q65 138 60 138" fill="none" stroke="#C98F5A" stroke-width="1.5"/>
      <rect x="49" y="137" width="6" height="8" fill="#C98F5A"/>
      <rect x="42" y="145" width="20" height="5" rx="2" fill="#C98F5A"/>
      <path d="M72 150 L86 120 L100 150 Z" fill="#FF9BB5" stroke="#E5768F" stroke-width="1.2"/>
      <path d="M79 141 q7 3 14 0" fill="none" stroke="#FFF3D6" stroke-width="2.4"/>
      <ellipse cx="86" cy="150" rx="14" ry="2.5" fill="#E5768F"/>
      <circle cx="86" cy="117" r="4" fill="#FFDE59"/>
      <rect x="176" y="139" width="30" height="11" rx="5.5" fill="#565049" stroke="#3A352F" stroke-width="1"/>
      <line x1="188" y1="139" x2="188" y2="150" stroke="#3A352F" stroke-width="1"/>
      <rect x="164" y="137" width="13" height="15" rx="6.5" fill="#6E665C" stroke="#3A352F" stroke-width="1"/>
      <line x1="166" y1="141" x2="175" y2="141" stroke="#9C948A" stroke-width=".9"/>
      <line x1="166" y1="145" x2="175" y2="145" stroke="#9C948A" stroke-width=".9"/>
      <line x1="166" y1="149" x2="175" y2="149" stroke="#9C948A" stroke-width=".9"/>
      <path d="M206 145 q6 1 6 5" fill="none" stroke="#3A352F" stroke-width="1.2"/>
      ${[[226,148,13,"#FF9BB5"],[244,126,11,"#FFDE59"],[252,164,10,"#C77DFF"]].map(([bx,by,r,c]) => `
        <line x1="${bx}" y1="${by + r}" x2="${bx + 3}" y2="194" stroke="#B4B2A9" stroke-width="1"/>
        <circle cx="${bx}" cy="${by}" r="${r}" fill="${c}"/>
        <ellipse cx="${bx - r * .35}" cy="${by - r * .35}" rx="${r * .28}" ry="${r * .22}" fill="#FFFFFF" opacity=".55"/>`).join("")}`;
  } else {
    stamp = "2026.10";
    hot = `<g class="hs-hot${isLevelUnlocked(4) ? "" : " is-locked"}" data-lv="4" role="button" aria-label="地上的手提箱">
      ${halo(208, 154, 56, 42, 9)}
      <rect x="206" y="152" width="60" height="44" fill="#fff" opacity="0"/>
      <ellipse cx="236" cy="194" rx="24" ry="3.2" fill="rgba(120,80,40,.12)"/>
      <rect x="228" y="158" width="16" height="9" rx="4.5" fill="none" stroke="#8A6031" stroke-width="1.8"/>
      <rect x="216" y="166" width="40" height="25" rx="4" fill="#B98A4E" stroke="#8A6031" stroke-width="1.6"/>
      <line x1="216" y1="178.5" x2="256" y2="178.5" stroke="#8A6031" stroke-width="1.1" opacity=".55"/>
      <rect x="231" y="175" width="10" height="8" rx="2" fill="#E5C79A" stroke="#8A6031" stroke-width=".9"/>
      <rect x="220" y="191" width="6" height="3" rx="1.2" fill="#8A6031"/>
      <rect x="249" y="191" width="6" height="3" rx="1.2" fill="#8A6031"/>
    </g>`;
    props = `
      ${calendarSVG()}
      <rect x="52" y="128" width="36" height="22" rx="2" fill="#E5C79A" stroke="#C98F5A" stroke-width="1.4"/>
      <line x1="52" y1="134" x2="88" y2="134" stroke="#D3B183" stroke-width="1" opacity=".8"/>
      <line x1="70" y1="128" x2="70" y2="150" stroke="#A98A5C" stroke-width="1.6"/>
      <line x1="52" y1="139" x2="88" y2="139" stroke="#A98A5C" stroke-width="1.6"/>
      <path d="M70 139 q-7 -4 -9 -1 q-2 3 4 4 q5 1 5 -3 Z" fill="#C98F5A"/>
      <path d="M70 139 q7 -4 9 -1 q2 3 -4 4 q-5 1 -5 -3 Z" fill="#C98F5A"/>
      <circle cx="70" cy="139" r="1.8" fill="#E5C79A" stroke="#A98A5C" stroke-width=".8"/>
      <path d="M74 141 q6 3 9 8" fill="none" stroke="#A98A5C" stroke-width="1"/>
      <circle cx="182" cy="143" r="3.4" fill="none" stroke="#C98F5A" stroke-width="1.6"/>
      <line x1="185.6" y1="143" x2="198" y2="143" stroke="#C98F5A" stroke-width="1.6" stroke-linecap="round"/>
      <line x1="194" y1="140" x2="196" y2="140" stroke="#C98F5A" stroke-width="1.6" stroke-linecap="round"/>
      <line x1="195" y1="146" x2="197" y2="146" stroke="#C98F5A" stroke-width="1.6" stroke-linecap="round"/>`;
  }

  const withBin = (y === 2024 || y === 2026);
  const locked = !isLevelUnlocked(lv.id);
  const roomBody = `
    <rect x="0" y="0" width="340" height="194" fill="#FBF3E4"/>
    <rect x="0" y="138" width="340" height="56" fill="#F6ECD9"/>
    <line x1="0" y1="138" x2="340" y2="138" stroke="#EADFC6" stroke-width="1.6"/>
    <rect x="0" y="194" width="340" height="30" fill="#EBD9BC"/>
    <line x1="0" y1="203" x2="340" y2="203" stroke="#DEC9A8" stroke-width="1"/>
    <line x1="0" y1="213" x2="340" y2="213" stroke="#DEC9A8" stroke-width="1"/>

    <clipPath id="hsWinClip"><rect x="22" y="24" width="62" height="56" rx="3"/></clipPath>
    <g clip-path="url(#hsWinClip)">${windowSky(y)}</g>
    <rect x="22" y="24" width="62" height="56" rx="3" fill="none" stroke="#C98F5A" stroke-width="2.6"/>
    <line x1="53" y1="24" x2="53" y2="80" stroke="#C98F5A" stroke-width="1.6"/>
    <line x1="22" y1="52" x2="84" y2="52" stroke="#C98F5A" stroke-width="1.6"/>

    <circle cx="118" cy="50" r="14" fill="#FFFDF4" stroke="#C98F5A" stroke-width="2"/>
    ${clockHands(y)}
    <circle cx="118" cy="50" r="1.5" fill="#7A5A38"/>

    ${doorSVG(y, allDone(p))}
    ${props}

    <ellipse cx="117" cy="194" rx="95" ry="6" fill="rgba(120,80,40,.08)"/>
    <rect x="22" y="150" width="190" height="9" rx="3.5" fill="#F0C987" stroke="#C98F5A" stroke-width="1.4"/>
    <rect x="28" y="159" width="7" height="35" rx="2.5" fill="#D9A56A"/>
    <rect x="199" y="159" width="7" height="35" rx="2.5" fill="#D9A56A"/>

    ${hot}
    ${chairSVG()}
    ${withBin ? binSVG(y) : ""}

    <text x="333" y="218" text-anchor="end" font-size="12" font-family="ui-monospace,monospace" fill="#C8834A" opacity=".85">${stamp}</text>
  `;
  /* 未解锁：整间房套一层高斯模糊 + 奶白半透层（毛玻璃），再压一个锁牌 */
  if(locked){
    return `<svg class="hs-svg is-frosted" viewBox="0 0 340 224" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${y} 年的办公室（未解锁）">
      <defs>
        <filter id="hsFrost" x="-8%" y="-8%" width="116%" height="116%" color-interpolation-filters="sRGB">
          <feGaussianBlur stdDeviation="4.2"/>
        </filter>
        <filter id="hsSoft" x="-60%" y="-60%" width="220%" height="220%" color-interpolation-filters="sRGB">
          <feGaussianBlur stdDeviation="3.2"/>
        </filter>
      </defs>
      <g filter="url(#hsFrost)">${roomBody}</g>
      <rect x="0" y="0" width="340" height="224" fill="#FBF4E6" opacity=".65" pointer-events="none"/>
      <g class="hs-lock" pointer-events="none">
        <circle cx="170" cy="112" r="47" fill="#FFFDF6" opacity=".5" filter="url(#hsSoft)"/>
        <circle cx="170" cy="112" r="40" fill="#FFFDF6" opacity=".74" filter="url(#hsSoft)"/>
        <circle cx="170" cy="112" r="34" fill="#FFFDF6" opacity=".82"/>
        <text x="170" y="110" text-anchor="middle" font-size="26.5">🔒</text>
        <text x="170" y="135" text-anchor="middle" font-size="13.5" font-weight="700" fill="#8A7258">未解锁</text>
      </g>
    </svg>`;
  }
  return `<svg class="hs-svg" viewBox="0 0 340 224" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${y} 年的办公室">
    ${roomBody}
  </svg>`;
}

/* 密码门专属场景：房间消失，一扇门居中 */
function doorViewSVG(){
  return `<svg class="hs-svg" viewBox="0 0 340 230" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="最后的门">
    <rect x="0" y="0" width="340" height="196" fill="#FBF3E4"/>
    <rect x="0" y="140" width="340" height="56" fill="#F6ECD9"/>
    <line x1="0" y1="140" x2="340" y2="140" stroke="#EADFC6" stroke-width="1.6"/>
    <rect x="0" y="196" width="340" height="34" fill="#EBD9BC"/>
    <line x1="0" y1="206" x2="340" y2="206" stroke="#DEC9A8" stroke-width="1"/>
    <line x1="0" y1="217" x2="340" y2="217" stroke="#DEC9A8" stroke-width="1"/>

    <g class="hs-hot" id="dv-door" role="button" aria-label="最后的门">
      <rect class="hs-halo" x="112" y="38" width="116" height="164" rx="12"/>
      <ellipse cx="170" cy="193" rx="66" ry="6" fill="rgba(120,80,40,.10)"/>
      <path d="M118 196 L118 64 Q118 44 138 44 L202 44 Q222 44 222 64 L222 196 Z" fill="#EDCB92" stroke="#C98F5A" stroke-width="2.4"/>
      <rect x="128" y="58" width="84" height="52" rx="8" fill="#F7E3BC" stroke="#C98F5A" stroke-width="1.3"/>
      <rect x="128" y="150" width="84" height="38" rx="8" fill="#F7E3BC" stroke="#C98F5A" stroke-width="1.3"/>
      <rect x="139" y="112" width="62" height="34" rx="6" fill="#FFFDF4" stroke="#C98F5A" stroke-width="1.6"/>
      ${[0,1,2,3].map(i => `<rect x="${145.5 + i * 13}" y="119" width="8" height="20" rx="2.5" fill="#C98F5A" opacity=".9"/>`).join("")}
      <circle cx="212" cy="126" r="3.6" fill="#E5A83B" stroke="#C98F5A" stroke-width="1.2"/>
    </g>

    <g>
      <path d="M88 196 v-11 a11 11 0 0 1 22 0 v11 Z" fill="#E58BB0"/>
      <circle cx="94" cy="172" r="5" fill="#7FBF8A"/><circle cx="103" cy="166" r="6" fill="#5DAF6B"/><circle cx="110" cy="174" r="4.5" fill="#7FBF8A"/>
    </g>
    <g>
      <path d="M230 196 v-11 a11 11 0 0 1 22 0 v11 Z" fill="#8AD1FF"/>
      <circle cx="236" cy="174" r="5" fill="#7FBF8A"/><circle cx="245" cy="167" r="6" fill="#5DAF6B"/><circle cx="252" cy="175" r="4.5" fill="#7FBF8A"/>
    </g>
  </svg>`;
}

/* 提示语：四关一致，不剧透具体是哪件东西 */
function hallHintText(){
  return "找一找工位上特别的物品";
}

function renderHall(){
  const lv = curHallLevel();
  const ready = allDone(progress);

  /* —— 密码门专属场景 —— */
  if(hallDoorView){
    const c = CONFIG.passwordPage;
    $("view-hall").innerHTML = `
      <div class="hall2 dv">
        <button class="dv-back" id="dv-back" type="button">← 回到房间</button>
        <div class="hall2-head">
          <div class="hall2-title">🔐 ${c.title}</div>
          <div class="hall2-sub">${c.desc.join("　")}</div>
        </div>
        <div class="hall2-room dv-room">${doorViewSVG()}</div>
        <div class="otp-row" id="otp-row">
          <input class="otp" maxlength="1" inputmode="numeric" pattern="[0-9]*" />
          <input class="otp" maxlength="1" inputmode="numeric" pattern="[0-9]*" />
          <input class="otp" maxlength="1" inputmode="numeric" pattern="[0-9]*" />
          <input class="otp" maxlength="1" inputmode="numeric" pattern="[0-9]*" />
        </div>
        <button class="btn btn-primary btn-block" id="btn-unlock" disabled>${c.unlockLabel}</button>
        <div class="pw-msg" id="pw-msg"></div>
      </div>`;
    bindOTP();
    $("dv-back").addEventListener("click", () => { SFX.turn(); hallDoorView = false; renderHall(); });
    $("btn-unlock").addEventListener("click", checkPassword);
    const d = $("dv-door");
    if(d) d.addEventListener("click", () => { const f = document.querySelector("#otp-row .otp"); if(f) f.focus(); });
    return;
  }

  /* —— 房间视图 —— */
  const st = progress["level" + lv.id];
  const done = st.done;
  const darkFrag = isDarkColor(accentOf(lv));

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
        <div class="hall2-title">${splitEmoji(CONFIG.hallTitle)}</div>
        <div class="hall2-sub">${CONFIG.hallSubtitle}</div>
      </div>

      <div class="hall2-room ${justCompleted ? "just-done" : ""}">
        ${roomSVG()}
      </div>
      <div class="hall2-hint">💡 ${hallHintText()}</div>

      <div class="hall2-info">
        <div class="hall2-line1">
          <span class="hall2-y">${lv.year}</span>
          <span class="hall2-name">${lv.title}</span>
          <span class="hall2-emoji">${lv.emoji}</span>
        </div>
        <div class="hall2-tag">${lv.tagline}</div>
        <div class="hall2-frag${done ? " on" : ""}"${done ? ` style="background:${accentOf(lv)}"` : ""}>🧩 ${done ? lv.fragmentName + "：" + lv.fragment : "碎片：未获得"}</div>
      </div>

      <div class="hall2-tabs">${tabs}</div>
      <button class="hall2-doorbtn${ready ? " ready" : ""}" id="hall-door-btn" type="button">🔒最终密码</button>
    </div>`;

  /* 年份切换 */
  document.querySelectorAll(".hall2-tab").forEach(btn => {
    btn.addEventListener("click", () => {
      const y = parseInt(btn.dataset.y, 10);
      if(y === hallYear) return;
      SFX.turn();
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
      const id = parseInt(g.dataset.lv, 10);
      if(!isLevelUnlocked(id)){ showLockedHint(); return; }
      SFX.reveal();                 // 「找到你了」的音效
      enterLevel(id, e.clientX, e.clientY);
    });
  });

  /* 最后的门 */
  $("hall-door-btn").addEventListener("click", () => {
    if(!allDone(progress)){ showLockedHint(); return; }
    SFX.flip();
    hallDoorView = true;
    renderHall();
    $("view-hall").scrollTop = 0;
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

/* 第 4 关：深绿夜幕 + 极淡的前三关回忆浮标（透明度 .11） */
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

/* ==================== ⑪ 关卡渲染与进入 ==================== */
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
function playResult(lvl, lines, opts){
  const o = opts || {};
  const card = $("modal");
  card.innerHTML = `<div id="result-lines"></div><div id="result-tail" style="display:none"></div>`;
  const box = $("result-lines");
  // 空弹窗先出来，停 1 秒；之后每 1 秒说一句（逐句淡入 + 每句一记音）
  const GAP = 1000, LEAD = 1000;
  let extra = 0;
  lines.forEach((ln, i) => {
    const isLast = i === lines.length - 1;
    const isStagger = o.stagger === i;
    const at = LEAD + i * GAP + extra;
    setTimeout(()=>{
      const d = document.createElement("div");
      d.className = "result-line" + (o.slowLast && isLast ? " slow" : "") + (isStagger ? " stagger" : "");
      d.innerHTML = ln;
      box.appendChild(d);
      requestAnimationFrame(()=> d.classList.add("on"));
      // 「挨个出现」的行：整行和第一个物品同帧出现，之后每 GAP 亮一组
      if(isStagger){
        const items = d.querySelectorAll(".g1,.g2,.g3");
        items.forEach((el, n) => setTimeout(()=>{
          el.classList.add("in");
          try{ SFX.pick(); }catch(e){}
        }, n * GAP));
      } else {
        try{ (o.slowLast && isLast) ? SFX.fragment() : SFX.flip(); }catch(e){}
      }
    }, at);
    // 这一行要占三拍（物品一 / 、二 / 和三），后面的行整体顺延两拍
    if(isStagger) extra += 2 * GAP;
  });
  setTimeout(()=>{
    $("result-tail").style.display = "block";
    SFX.fragmentDrop();   // 碎片落入手中：就在「获得 xx 碎片」出现这一刻
    $("result-tail").innerHTML = `
      <hr class="popup-divider">
      <div class="frag-big" style="color:${T.fragInk[lvl.accentIndex]}">🧩 获得${lvl.fragmentName}：${lvl.fragment}</div>
      <button class="btn btn-block frag-collect" id="btn-collect" style="background:${T.fragBtn[lvl.accentIndex]}">${CONFIG.collectLabel}</button>`;
    $("btn-collect").addEventListener("click", ()=> collect(lvl.id));
  }, LEAD + lines.length * GAP + 600 + extra);
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

/* ==================== ⑫ 关卡 1：拨号 ==================== */
let lv1 = { entered:"", dialJudging:false, judgeTimer:null, wrongTimer:null, ringTimer:null };
function renderLevel1(lvl){
  setLevelAccent("level1", lvl);
  lv1 = { entered:"", dialJudging:false, judgeTimer:null, wrongTimer:null, ringTimer:null, pbOpens:0 };
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
    $("l1-hint").textContent = "☎️ 拨号中……";
    // 按完最后一个数字先静一秒（像真的在等线路），再起回铃音
    if(lv1.ringTimer) clearTimeout(lv1.ringTimer);
    lv1.ringTimer = setTimeout(()=>{
      lv1.ringTimer = null;
      $("l1-hint").textContent = "☎️ 正在拨号……";
      SFX.ringback();   // 嘟—— 停 ——嘟——，整段 2.4 秒
      // 回铃音响完（2.4s）再留 1s 呼吸，然后才判定
      lv1.judgeTimer = setTimeout(()=>{ lv1.judgeTimer = null; judgeL1(lvl); }, 3400);
    }, 1000);
  }
}
function deleteKey(lvl){
  if(lv1.dialJudging) return;
  lv1.entered = lv1.entered.slice(0, -1);
  renderL1Number(lvl);
}
/* 返回大厅前取消尚未执行的拨号判定和错误弹窗延时 */
function stopLv1AndBack(){
  if(lv1.ringTimer){ clearTimeout(lv1.ringTimer); lv1.ringTimer = null; }
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
    // 先看是不是彩蛋号码：彩蛋也是「打错了」，提示和忙音与乱拨一模一样，
    // 只是等忙音响完弹出的不是随机文案，而是那一段专属对话
    const egg = (lvl.easterEggs || []).find(e => e.num === lv1.entered);
    if(egg){
      $("l1-hint").textContent = "📵 嘟——嘟—— 打错了";
      vibrate(40);
      SFX.wrong();
      lv1.wrongTimer = setTimeout(()=>{
        lv1.wrongTimer = null;
        if(currentView !== "level1") return;
        playEggResult(lvl, egg);
      }, 1350);
      return;
    }
    $("l1-hint").textContent = "📵 嘟——嘟—— 打错了";
    vibrate(40);
    SFX.wrong();      // 忙音「响 0.4 停 0.35 再响 0.4」= 1.15 秒
    lv1.wrongTimer = setTimeout(()=>{
      lv1.wrongTimer = null;
      if(currentView !== "level1") return;
      const funny = lvl.wrongLines[randi(0, lvl.wrongLines.length - 1)];
      const cheatBtn = failCounts[1] >= 3 ? `<button class="btn btn-accent btn-block" id="btn-cheat" style="margin-top:10px">${CONFIG.cheat.label}</button>` : "";
      SFX.failPop();                // 失败结算弹窗的音效
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
/* 彩蛋弹窗：排版、逐句出现、音效都对齐成功弹窗（playResult），
   只是没有碎片、结尾换回「好的，再试一次」，并且照样算一次失败。 */
function playEggResult(lvl, egg){
  openModal("");
  SFX.failPop();          // 与「打错了」的弹窗同一个音效
  const card = $("modal");
  card.innerHTML = `<div id="result-lines"></div><div id="result-tail" style="display:none"></div>`;
  const box = $("result-lines");
  const GAP = 1000, LEAD = 1000;
  egg.lines.forEach((ln, i) => {
    setTimeout(()=>{
      const d = document.createElement("div");
      d.className = "result-line";
      d.innerHTML = ln;
      box.appendChild(d);
      requestAnimationFrame(()=> d.classList.add("on"));
      try{ SFX.flip(); }catch(e){}
    }, LEAD + i * GAP);
  });
  setTimeout(()=>{
    const tail = $("result-tail");
    if(!tail) return;
    tail.style.display = "block";
    try{ SFX.pop(); }catch(e){}
    const cheatBtn = failCounts[1] >= 3
      ? `<button class="btn btn-accent btn-block" id="btn-cheat" style="margin-top:10px">${CONFIG.cheat.label}</button>`
      : "";
    tail.innerHTML = `<hr class="popup-divider">
      <button class="btn btn-block frag-collect" id="btn-egg-again" style="background:${T.fragBtn[lvl.accentIndex]};color:#fff">好的，再试一次</button>${cheatBtn}`;
    $("btn-egg-again").addEventListener("click", ()=>{
      closeModal();
      lv1.entered = "";
      $("l1-hint").textContent = "";
      renderL1Number(lvl);
    });
    if(cheatBtn) $("btn-cheat").addEventListener("click", ()=> cheatToSuccess(1));
  }, LEAD + egg.lines.length * GAP + 600);
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

/* ==================== ⑬ 关卡 2：敲键盘 ==================== */
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
            <span class="crt-name">【初稿】240628申报材料.docx</span>
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
  SFX.failPop();                    // 失败结算弹窗的音效
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

/* ==================== ⑭ 关卡 3：节拍点击 ==================== */
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
  // 八个亮色（红 / 黄 / 蓝 / 绿 / 粉 / 米白 / 橙 / 薰衣草），深色舞台上要跳得出来
  const colors = ["#FF5A5F", "#FFD93D", "#4D9BFF", "#5BE37D", "#FF8FC7", "#FFF3D6", "#FF9F45", "#9B8CFF"];
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
    SFX.failPop();                  // 失败结算弹窗的音效
    openModal(`
      <div class="popup-head">🚷</div>
      <div class="popup-body">${his}</div>
      <div class="popup-actions">
        <button class="btn btn-primary btn-block" id="btn-ok">时光倒流</button>
        ${cheatBtn}
      </div>`);
    $("btn-ok").addEventListener("click", ()=>{ closeModal(); l3ResetToIntro(); });
    if(lv3.fails >= 3){
      $("btn-cheat").addEventListener("click", ()=> cheatToSuccess(3));
    }
  }, 650);
}
/* 失败后回到「开幕前」：幕布重新拉上，动作清零，等玩家再点 MUSIC */
function l3ResetToIntro(){
  cancelAnimationFrame(lv3.raf);
  if(lv3.timeout){ clearTimeout(lv3.timeout); lv3.timeout = null; }
  if(lv3.stepTimer){ clearTimeout(lv3.stepTimer); lv3.stepTimer = null; }
  if(lv3.startTimer){ clearTimeout(lv3.startTimer); lv3.startTimer = null; }
  lv3.running = false;
  lv3.phase = "intro";
  lv3.actionIdx = 0;
  lv3.combo = 0;
  lv3.results = [];
  const stage = $("l3-stage");
  if(stage) stage.classList.remove("opened");     // 幕布落下
  const bg = $("l3-bg");
  if(bg){ bg.classList.remove("live"); bg.classList.remove("beam"); }
  const v = $("l3-verdict");
  if(v){ v.className = "verdict"; v.textContent = ""; v.style.background = ""; v.style.color = ""; v.style.boxShadow = ""; }
  const ring = $("l3-ring"); if(ring) ring.style.transform = "";
  const emo = $("l3-emoji"); if(emo){ emo.classList.remove("dance"); emo.textContent = "🕺"; }
  updateL3Hud();
  const prog = $("l3-progress"); if(prog) prog.textContent = "准备";
  // MUSIC 按钮在舞台下面，幕布落回后把它滚进视野，免得玩家找不到
  const mb = $("l3-music");
  if(mb) setTimeout(()=>{ try{ mb.scrollIntoView({ behavior:"smooth", block:"center" }); }catch(e){} }, 420);
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

/* ==================== ⑮ 关卡 4：打包 ==================== */
let lv4 = {};
function renderLevel4(lvl){
  setLevelAccent("level4", lvl);
  lv4 = { chosen:[], phase:"intro" };
  // 背景音乐等玩家点「开始」再进（见下面的 l4-start 回调）
  $("view-level4").innerHTML = `
    ${bgLevel4()}
    <div class="view-scroll">
      ${levelHeader(lvl)}
      <div class="story-card">${lvl.intro.map(t=>`<div class="t-body">${t}</div>`).join("")}</div>
      <div style="text-align:center;margin:2px 0 6px;position:relative;z-index:1"><button class="btn l4-start-btn" id="l4-start">${lvl.startLabel}</button></div>
      <div id="l4-game" style="display:none"></div>
    </div>`;

  const back = $("btn-back"); back.addEventListener("click", backToHall);
  $("l4-start").addEventListener("click", ()=>{
    lv4.phase = "play";
    $("l4-game").style.display = "block";
    $("l4-start").closest("div").style.display = "none";
    SFX.musicBoxStart();   // 音乐跟着「开始」一起进来，前面读文案时是安静的
    buildLv4Game(lvl);
  });
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
  try{ SFX.pick(); }catch(e){}
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
  // 三个选中的东西都要绿色高亮闪烁（hl-word = 绿字 + wordGlow）
  const nameStr = names.length === 3
    ? `<span class="g1"><b class="hl-word">${names[0]}</b></span>`
      + `<span class="g2">、<b class="hl-word">${names[1]}</b></span>`
      + `<span class="g3">和<b class="hl-word">${names[2]}</b></span>`
    : names.map((n, i) => `<span class="g${i+1}"><b class="hl-word">${n}</b></span>`).join("、");
  // 第一行只到「谢谢你留给我」，三个东西单独一行，避免一行太长
  const lines = [ lvl.thanksPrefix, nameStr, lvl.thanksTail, lvl.dropText ];
  openModal("");
  playResult(lvl, lines, { slowLast:true, stagger:1, staggerHold:1500 });
}

/* ---------- 关卡成功统一入口 ---------- */
function runLevelSuccess(lvl, opts){
  openModal("");
  SFX.winPop();                     // 成功结算弹窗的音效
  if(lvl.id === 1){
    const lines = [...lvl.dialLines, lvl.success];
    playResult(lvl, lines);
  } else if(lvl.id === 2){
    const lines = [ "🏆恭喜准点下班！", "这一年，因为你的才华和努力，", "成功解锁成就", `<b class="blue-glow">🏅【${lvl.achievementName}】🏅</b>` ];
    playResult(lvl, lines);
  } else if(lvl.id === 3){
    const lines = [
      "🎉 完美的演出！",
      "全开麦真唱真跳",
      "拳打爱豆 脚踢歌手",
      `恭喜获得<b class="pink-glow">「${lvl.awardName}」</b>`,
      "实至名归！🏆"
    ];
    playResult(lvl, lines);
  } else if(lvl.id === 4){
    // 作弊不会出现在第 4 关（无失败机制），此分支仅供兜底
    lv4Success(lvl);
  }
}

/* ==================== ⑯ 页面 C：终极密码 ==================== */
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
  // 不自动 focus：先让玩家看清这一页，点数字框再唤出键盘
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
      if($("overlay").classList.contains("show")) closeModal();
      if(hallDoorView) hallDoorView = false;
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

/* ==================== ⑰ 页面 D：终页 · 员工档案（工牌版） ==================== */
/* 一页「员工档案」：抬头 → 横线 → 天数 / 日期 / 元信息 → 三格字段 → 印章 → 留言 → 落款。
   出场顺序按时间轴排（见 runFinalSequence），每一段都配一个音。 */
function renderFinal(){
  const c = CONFIG.finalPage;
  const lines = CONFIG.finalMessage;
  const fields = c.fields.map((f, i) => `
        <div class="fin-f" id="fin-f-${i}"><span>${f.k}</span><b${f.big ? ' class="big"' : ""}>${f.v}</b></div>`).join("");

  $("view-final").innerHTML = `
    <div class="final-decor">${finalDecor()}</div>
    <div class="fin-wrap">
      <div class="fin-card" id="fin-card">
        <div class="fin-top fin-head" id="fin-head"><b>${c.fileLabel}</b><span>${c.fileNo}</span></div>
        <div class="fin-rule fin-head" id="fin-rule"></div>

        <div class="fin-body">
          <div class="fin-fields">${fields}</div>
          <div class="fin-photo" id="fin-photo">
            <div class="cap">ID PHOTO</div>
            <img src="id-photo.svg?v=2" alt="工牌照" draggable="false" />
          </div>
        </div>

        <div class="fin-cells">
          <div class="fin-cell date" id="fin-cell-date"><span>${c.dateLabel}</span><b class="fin-v" id="fin-v-date">${CONFIG.workDates.start} — ${CONFIG.workDates.end}</b></div>
          <div class="fin-cell days" id="fin-cell-days"><span>${c.daysLabel}</span><b class="fin-v" id="fin-v-days">${CONFIG.workDays}<i>${c.unit}</i></b></div>
        </div>

        <div class="fin-msg">
          ${lines.map((l, i) => `<p id="fin-line-${i}">${l}</p>`).join("")}
        </div>
        <div class="fin-sign" id="fin-sign">—— ${c.sign}</div>
        <div class="fin-seal" id="fin-seal"><b>${c.seal}</b><small>${CONFIG.workDates.end}</small></div>
      </div>
      <div class="fin-actions" id="fin-actions">
        <button class="btn btn-ghost" id="btn-back-lobby">${CONFIG.backLabel}</button>
        <button class="btn btn-ghost" id="btn-replay">↺ 再玩一次</button>
      </div>
    </div>`;

  showView("final");
  // 让工牌照片的高度和左边「姓名~部门」那一块完全一致（上沿对姓名、下沿对部门）
  const fitPhoto = () => {
    const f = document.querySelector(".fin-fields"), p = $("fin-photo");
    if(f && p) p.style.height = Math.round(f.getBoundingClientRect().height) + "px";
  };
  fitPhoto();
  setTimeout(fitPhoto, 60);
  window.addEventListener("resize", fitPhoto);
  runFinalSequence();

  // 返回大厅：进度保留
  $("btn-back-lobby").addEventListener("click", ()=>{ SFX.tap(); backToHall(); });
  // 再玩一次：清档 → 回到锁屏，从头解锁
  $("btn-replay").addEventListener("click", ()=>{
    SFX.tap();
    clearRaw();
    progress = defaultProgress();
    failCounts = { 1:0, 2:0, 3:0 };  // 失败计数也必须清零，否则新一局首次失败就会出现作弊按钮
    SFX.tensionStop(); SFX.musicBoxStop();
    phoneUnlocked = false; faceIdOn = false; storyBegun = false; unlockChimePending = false;
    hallDoorView = false; hallYear = 2023;
    renderLock();
    showView("lock");
  });
}

/* 只上下滚：不能用 scrollIntoView —— 红章从小放大时盒子超出右边，
   scrollIntoView 会连带把横向滚动条拉开，整页就「往右一抽」 */
function finScrollTo(el){
  const view = $("view-final");
  if(!el || !view) return;
  const r = el.getBoundingClientRect(), v = view.getBoundingClientRect();
  const pad = 14;
  if(r.bottom > v.bottom - pad) view.scrollTop += (r.bottom - v.bottom + pad);
  else if(r.top < v.top + pad) view.scrollTop -= (v.top + pad - r.top);
  view.scrollLeft = 0;
}

/* 终页出场时间轴。
   前半段（档案卡）还是一样一个一个落；到告别信这里换了做法：
   整篇一次性出现（每段错开 80ms 淡入），然后页面从上往下自动滚动，
   像有人替你慢慢把信读下去。手指 / 滚轮一碰就暂停 4 秒，停手后从你停的地方接着走。 */
function runFinalSequence(){
  const view = $("view-final");
  if(view) view.scrollLeft = 0;
  const show = (id, sy) => {
    const e = $(id);
    if(!e) return;
    e.classList.add("on");
    if(sy !== false) setTimeout(()=> finScrollTo(e), 300);
  };
  const snd = (fn) => { try{ fn(); }catch(e){} };
  const popSnd = () => snd(()=>SFX.pop());

  const steps = [];
  const step = (wait, fn) => steps.push({ wait, fn });

  // 礼花先飘一会儿，「员工档案」和横线一起出来，再停一下才开始落字段
  step(2600, null);
  step(1400, () => { show("fin-head"); show("fin-rule"); popSnd(); });
  step(1300, () => { show("fin-f-0"); popSnd(); });
  step(1300, () => { show("fin-f-1"); popSnd(); });
  step(1300, () => { show("fin-f-2"); popSnd(); });
  // 部门之后才出现工牌照片
  step(1500, () => { show("fin-photo"); popSnd(); });
  // 两个小框一起出现，里面的数据再依次落
  step(1600, () => { show("fin-cell-date"); show("fin-cell-days"); popSnd(); });
  step(1300, () => { show("fin-v-date"); popSnd(); });
  step(1300, () => { show("fin-v-days"); popSnd(); });
  step(2200, null);          // 空一拍，再开始读信

  let i = 0;
  const run = () => {
    if(i >= steps.length){ startLetter(); return; }
    const s = steps[i++];
    if(s.fn) s.fn();
    setTimeout(run, s.wait);
  };
  run();

  /* 信：全部段落一次性铺出来 */
  function startLetter(){
    if(currentView !== "final") return;
    const box = document.querySelector(".fin-msg");
    const ps = box ? Array.prototype.slice.call(box.querySelectorAll("p")) : [];
    ps.forEach((p, n) => {
      p.style.animationDelay = (n * 200) + "ms";
      p.classList.add("on");
    });
    snd(()=>SFX.fragment());          // 四音铃声：信开始了
    snd(()=>SFX.letterMusicStart());  // 配乐同时起来
    setTimeout(autoScrollLetter, 2500);   // 信铺完先停 2.5 秒再开始走
  }

  /* 自动滚动：按 15px/s 往下走（约每秒 14 个字），碰到就暂停 4 秒 */
  function autoScrollLetter(){
    if(currentView !== "final" || !view){ afterLetter(); return; }
    const bottom = Math.max(0, view.scrollHeight - view.clientHeight);
    let pos = view.scrollTop;
    if(bottom - pos < 6){ afterLetter(); return; }
    const SPEED = 15;
    let lastT = 0, pausedUntil = 0;
    const pause = () => { pausedUntil = performance.now() + 4000; };
    const stop = () => {
      view.removeEventListener("touchstart", pause);
      view.removeEventListener("wheel", pause);
      view.removeEventListener("mousedown", pause);
      view.removeEventListener("keydown", pause);
    };
    view.addEventListener("touchstart", pause, { passive:true });
    view.addEventListener("wheel", pause, { passive:true });
    view.addEventListener("mousedown", pause, { passive:true });
    view.addEventListener("keydown", pause);
    const tick = (now) => {
      if(currentView !== "final"){ stop(); return; }
      if(!lastT) lastT = now;
      const dt = Math.min(80, now - lastT);
      lastT = now;
      if(now > pausedUntil){
        pos += SPEED * dt / 1000;
        view.scrollTop = Math.min(bottom, pos);
      } else {
        pos = view.scrollTop;          // 让玩家自己翻，停手后从这里接着走
      }
      if(pos >= bottom - 2){ stop(); afterLetter(); return; }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  /* 读到底：落款 → 停一下盖章 → 再出两个按钮 */
  function afterLetter(){
    if(currentView !== "final") return;
    show("fin-sign"); popSnd();
    setTimeout(()=>{
      if(currentView !== "final") return;
      show("fin-seal", false);
      snd(()=>SFX.stamp());
    }, 1600);
    setTimeout(()=>{
      if(currentView !== "final") return;
      show("fin-actions");
      finScrollTo($("fin-actions"));
    }, 3000);
  }
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

/* ==================== ⑱ 启动 ==================== */
/* 工牌照预热：终页才用到，但图有 160KB，开局就悄悄拉下来 */
setTimeout(()=>{ try{ const im = new Image(); im.src = "id-photo.svg?v=2"; }catch(e){} }, 1200);


/* 全局按钮音：所有 .btn 点击都出一声轻响（各关自己的音效另外叠加） */
document.addEventListener("click", (e) => {
  const b = e.target.closest && e.target.closest(".btn");
  // .no-tap：这一下自己带专属音效（比如进房间的「坠落」），不要再叠一记通用按键声
  if(b && !b.disabled && !b.classList.contains("no-tap")) SFX.tap();
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
    SFX.hardUnlock();           // 真点击里兜底再解锁一次
    SFX.toggle();
    paint();
    if(!SFX.isMuted()) SFX.tap();   // 打开时给一声确认
  });
}

/* 浏览器策略：音频必须在用户手势里解锁。
   开场动画是自动播放的，所以早先尝试一次 init（多数环境会被挂起），
   再挂一次性监听 —— 用户第一次触摸/点击屏幕时立刻解锁，
   之后的每一条气泡、点赞、乱码音效就都能响出来了。 */
/* 音频解锁「大网」：
   iOS 里只有 touchend / click / mousedown 这类才算真正的用户激活，pointerdown 不算；
   而微信 WebView、安卓 X5 又各有脾气。所以这里把所有可能的手势事件全挂上，
   并且 —— 关键 —— 只要音频还没真正 running，就绝不摘掉监听，一次失败下次接着试。 */
/* 这里把事件分成两类，是本次修复的核心：
   ① INTENT（pointerdown / touchstart）只用来标记「刚发生手势」，
      绝对不在这些事件里创建 AudioContext —— iOS 上这样建出来的上下文是「被污染的」，
      之后怎么 resume 都叫不醒；
   ② ACTION（touchend / click / mousedown / mouseup / keydown）才是浏览器认可的
      用户激活事件（iOS 上触摸只认 touchend / click），音频只在这里创建 / 重建。 */
const INTENT_EV = ["pointerdown", "touchstart"];
const ACTION_EV = ["touchend", "click", "mousedown", "mouseup", "keydown"];

function onIntent(e){
  try{ SFX.gesture(); }catch(err){}
  try{ if(SFX.log) SFX.log("INTENT " + (e && e.type)); }catch(err){}
}

function audioNet(e){
  // 已经 running 就立刻放行（监听常驻，不再摘除）：
  // 切后台 / 锁屏 / 插拔耳机之后上下文可能被挂起，留着监听才能在玩家下次一点时秒救回来。
  let st = null;
  try{ st = SFX._debug && SFX._debug(); }catch(err){}
  if(st && st.state === "running"){ hideSoundNudge(); return true; }
  try{ if(SFX.log) SFX.log("ACTION " + (e && e.type)); }catch(err){}
  try{
    SFX.hardUnlock();                       // 真激活事件里允许重建，成功率最高
    st = SFX._debug && SFX._debug();
    if(st && st.state === "running"){
      tryUnlockChime();
      hideSoundNudge();
      return true;
    }
  }catch(e){}
  return false;
}

function armAudioUnlock(){
  // 注意：加载时不再创建 AudioContext（惰性创建），只挂监听
  INTENT_EV.forEach(ev => document.addEventListener(ev, onIntent, { capture:true, passive:true }));
  ACTION_EV.forEach(ev => document.addEventListener(ev, audioNet, { capture:true, passive:true }));
  // 微信内置浏览器：JSBridge 就绪后可以免手势尝试解锁一次（微信本身不禁自动播放）
  try{
    if(window.WeixinJSBridge && window.WeixinJSBridge.invoke){
      window.WeixinJSBridge.invoke("getNetworkType", {}, () => { try{ SFX.ensure(false); }catch(e){} });
    } else {
      document.addEventListener("WeixinJSBridgeReady", () => { try{ SFX.ensure(false); }catch(e){} }, false);
    }
  }catch(e){}
}

/* 兜底：万一解锁之后音频还是没醒（某些机型 / 静音拨杆 / 被系统打断），
   给一个明显的一触即开按钮；音频正常时它根本不会出现。 */
function hideSoundNudge(){
  const el = document.getElementById("sound-nudge");
  if(el) el.remove();
}
function armSoundNudge(){
  let tries = 0;
  const check = () => {
    tries++;
    let ok = false;
    try{ const st = SFX._debug && SFX._debug(); ok = !!(st && st.state === "running"); }catch(e){}
    if(ok){ hideSoundNudge(); return; }
    if(tries >= 8){                      // 约 3.2 秒后仍未解锁才显示
      if(document.getElementById("sound-nudge")) return;
      const host = $("screen") || document.body;
      const el = document.createElement("div");
      el.id = "sound-nudge";
      el.className = "sound-nudge";
      el.innerHTML = '<span class="sn-ic">🔊</span><span>音频未就绪 轻触开启</span>';
      el.addEventListener("click", () => {
        let ok = false;
        try{ ok = SFX.hardUnlock(); }catch(e){}
        if(!ok){ try{ SFX.ensure(false); }catch(e){} }
        setTimeout(() => {
          let st = null;
          try{ st = SFX._debug && SFX._debug(); }catch(e){}
          if(st && st.state === "running"){
            try{ SFX.bubble(false); }catch(e){}
            hideSoundNudge();
          } else {
            // 还是没醒：多半是设备侧边静音键 / 音量问题，给一句明确提示
            el.innerHTML = '<span class="sn-ic">🔇</span><span>请检查手机侧边静音键与音量</span>';
            el.classList.add("is-hint");
          }
        }, 120);
      }, { passive:true });
      host.appendChild(el);
      return;
    }
    setTimeout(check, 400);
  };
  setTimeout(check, 400);
}

/* ==================== 附录：真机音频诊断面板（锁屏状态栏连点 5 次打开） ==================== */
/* 打开方式：在锁屏上连点左上角状态栏 5 次。
   面板会把「事件是否触发 / 上下文状态 / resume 是否被拒 / 静音 wav 是否播成功」
   全部列出来，用来定位 iOS Safari 这类严格内核到底卡在哪一步。 */
function initDiag(){
  const show = () => {
    if(document.getElementById("ba-diag")) return;
    const el = document.createElement("div");
    el.id = "ba-diag";
    el.innerHTML = '<div class="dg-head"><b>音频诊断</b><span id="dg-x" class="dg-x">✕</span></div>'
      + '<pre class="dg-body" id="dg-body"></pre>'
      + '<div class="dg-acts"><button id="dg-test" type="button">播测试音</button>'
      + '<button id="dg-retry" type="button">重试解锁</button>'
      + '<button id="dg-copy" type="button">复制</button></div>';
    document.body.appendChild(el);

    const body = document.getElementById("dg-body");
    const render = () => {
      let st = {}, log = [];
      try{ st = (SFX._debug && SFX._debug()) || {}; }catch(e){ st = { err: String(e) }; }
      try{ log = (SFX._log && SFX._log()) || []; }catch(e){}
      const ua = navigator.userAgent.replace(/\s+/g, " ");
      body.textContent =
        "UA: " + ua + "\n" +
        "WeixinJSBridge: " + (!!window.WeixinJSBridge) + "   standalone: " + (window.navigator.standalone ? 1 : 0) + "\n" +
        "state: " + st.state + "  ready: " + st.ready + "  dead: " + st.dead +
        "  rebuilds: " + st.rebuilds + "  muted: " + st.muted + "\n" +
        "---------------- 日志（新→旧在最下） ----------------\n" +
        log.slice(-40).join("\n");
    };
    render();
    setInterval(render, 700);

    document.getElementById("dg-x").onclick = () => el.remove();
    document.getElementById("dg-test").onclick = () => { try{ SFX.hardUnlock(); SFX.unlock(); }catch(e){} };
    document.getElementById("dg-retry").onclick = () => { try{ SFX.hardUnlock(); }catch(e){} };
    document.getElementById("dg-copy").onclick = () => {
      try{ navigator.clipboard.writeText(body.textContent); }catch(e){}
      try{ const r = document.createRange(); r.selectNode(body); const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r); }catch(e){}
    };
  };

  // 注意：不再支持 ?diag=1 自动弹出（旧链接会一直带着参数，看着像 bug）。
  // 只保留「连点状态栏 5 次」这一种显式操作。
  let taps = 0;
  document.addEventListener("click", (e) => {
    if(!e.target || !e.target.closest || !e.target.closest(".lock-status")) return;
    taps++;
    if(taps >= 5) show();
  }, true);
}

function init(){
  initSfxToggle();
  armAudioUnlock();
  renderLock();
  showView("lock");
  initDiag();
}
document.addEventListener("DOMContentLoaded", init);

})();
