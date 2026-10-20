# 《begin again》音效问题交接文档（2026-10-20 整理）

> 面向下一个执行模型的交接说明：本文档**只保留音效问题**，锁屏 UI 方案已移除（v5 已上线，新方案由作者另写）。
> 项目目录：`C:\Users\Administrator\Desktop\begin-again`
> 线上地址：https://fantasea98.github.io/begin-again/
> 文件：`index.html` / `style.css` / `main.js` / `sfx.js`（纯原生，无框架、无外部素材，音效全部由 Web Audio 合成）
> 另有两个内嵌子集字体：`fonts-playfair-subset.woff2`（时间数字 3.8KB）、`fonts-greatvibes-subset.woff2`（花体字标 2KB）

---

## 〇、最终结论（由真机日志确定，动代码前先看这段）

真机（iPhone · iOS 18.7 · Safari）诊断面板的日志：

```
51:31.630 ACTION touchend
51:31.632 ensure force=1 none->suspended rb=1
51:31.632 wav play REJECT NotAllowedError:The request is not allowed by the user agent
         or the platform in the current context, possibly because the user denied permission.
51:31.632 ensure force=0 suspended->suspended rb=1
```

三条事实：

1. `touchend` 确实触发了（事件没丢）；
2. 上下文能建出来，但一建出来就是 `suspended`；
3. **连 `<audio>.play()` 都被 `NotAllowedError` 拒了** —— 这不是「resume 失败」，而是**这一整个手势根本没拿到用户激活**。

结论：**滑动 / 拖拽这个动作在 iOS 上不给媒体权限**，即使它结束时会补一个 `touchend`。
所以「滑一下就把声音叫醒」在 iOS Safari / Chrome 上**做不到**，不是代码写得不对，是浏览器规则如此。
（微信 WebView 能通是因为它整个关掉了 `mediaPlaybackRequiresUserAction`，它验证不了任何东西。）

**因此最终方案 = 改成「点一下」解锁**：只有 `touchend` / `click` 这种干净的轻触才可能拿到授权。
为了让这一下不至于太生硬，点下去会弹一个**假的面容 ID 识别框**（见第三节），
顺便用这 1.5 秒动画把「拿到授权」和「开场第一声」之间的时间差撑开。

### 补充：为什么 Chrome 上「滑一下」就有声，Safari 不行？

两边用的「激活」模型根本不是一回事：

| | Chrome / Edge（Chromium） | iOS Safari / iOS Chrome（WebKit） |
|---|---|---|
| 判定方式 | **sticky activation**：页面只要被任何一次输入「碰过」（包括拖拽、滚轮），就永久算「已激活」 | **transient activation**：每一次播放都要挂在一个被认可的事件上（`touchend` / `click`），而且窗口只有几秒 |
| 拖拽算不算 | 算 | 不算 |

所以在 Chrome 上，**滑动解锁本来就足以唤醒音频**——之前之所以还是没声，是因为开场聊天动画在解锁的同一帧就开始了，
那句「叮」排在 `suspended`（`currentTime` 冻结）的上下文里，被 `live()` 网关直接丢掉；
现在多了 1.46 秒的识别动画 + 期间 7 次 `resume()` 重试，等聊天开始时音频早就是 `running` 了，第一声自然就出来了。
换句话说：**Chrome 是「延时」修好的，iOS 必须靠「点按」**。

---

## 一、音效在 iOS Chrome / Safari 仍需「轻触」——成因分析（历史推演，保留备查）


### 1. 现象与已知事实

| 环境 | 结果 |
|---|---|
| 微信内置浏览器（iOS / Android） | ✅ 滑动解锁后立刻有声 |
| 电脑浏览器（PC Chrome/Edge） | ✅ 正常 |
| iOS 上的 Safari App、Chrome App | ❌ 弹出「🔊 轻触一下，开启声音」，需要再点一次才响 |

关键推论：**iOS 上的 Chrome 用的也是 WebKit 内核**，两者同时失败 = 就是 iOS WebKit 的自动播放策略问题；
而微信 WebView 之所以一路畅通，是因为微信把 `mediaPlaybackRequiresUserAction` 关掉了（等于系统层面允许自动播放），它并不代表我们的解锁逻辑是对的。所以现在的判断标准是：**只有 iOS Safari/Chrome 能过，才算真正修好。**

### 2. 相关代码位置

- `sfx.js` `init()`（约 66–124 行）：创建/重建 AudioContext、resume、播放静音 wav
- `sfx.js` `can()`（22 行）：`return ready && !dead && !muted && ctx && ctx.state !== "closed";`
- `sfx.js` `live()`（30–38 行）：是否允许排程
- `sfx.js` `ensure()` / `ping()`（约 126–200 行）：对外解锁入口
- `main.js` `armAudioUnlock()` / `audioNet()`：全局手势网，挂在 8 种事件上（含 touchend/click），未 running 不摘网
- `main.js` `unlockPhone()`：滑动解锁成功后调用 `SFX.ensure()` + `[0,150,700,1400]ms` 补解锁 + `armSoundNudge()`
- `main.js` `armSoundNudge()`：轮询 8 次（约 3.2s），仍未 running 才显示「轻触」按钮

### 3. 可能的根因（按概率从高到低）

#### H1（最可疑）：`init()` 里的 `catch(e){ dead = true; }` 把音频「永久判死」

```js
try{
  ...
  var pr = a.play();          // ← iOS 严格策略下可能同步抛 NotAllowedError
  if(pr && pr.catch) pr.catch(function(){});
}catch(e){ dead = true; }     // ← 任何异常都会让 dead 永久为 true
```

`can()` 里 `!dead` 是硬条件，一旦 `dead === true`，**此后所有音效永远静默**，且重试、手势全都救不回来（因为 `init()` 开头 `if(dead) return;`）。
在 iOS Safari 里，`HTMLMediaElement.play()` 未获授权时，历史上存在**同步抛异常**（不只是 reject promise）的实现；只要抛一次就 `dead = true`。微信里 play() 直接成功 → 不抛 → 一切正常。这正好复现了「微信好、Safari/Chrome 不行」的现象。

**验证方法（真机，最重要的一步）**：解锁后在页面上执行 `SFX._debug()`，看返回的 `dead` 字段（已暴露）。若 `dead === true` → 确认 H1。

**修法**：
1. `dead = true` 只保留给「浏览器不支持 AudioContext」和「new AudioContext() 失败」两种情况；
2. 静音 wav 播放、visibilitychange 注册等一律单独 `try/catch`，失败不影响 `dead`；
3. `play()` 的 promise rejection 也单独吞掉，不要冒泡到外层 catch；
4. 建议 `ready` 与 `dead` 解耦：`ready` 只表示 ctx 已创建。

#### H2：真手势里没有做「硬重建」，退化成了对「被污染 ctx」的 resume

iOS WebKit 的经典问题：**在非手势环境创建的 AudioContext 有时永远无法 resume**。
为此我们加了重建逻辑，但带了节流守卫：

```js
var stuck = Date.now() - _lastResume > 1200;
if(ctx && ctx.state !== "running" && stuck){ close + 重建 }
```

问题：页面加载时 `armAudioUnlock()` 已经调过一次 `ensure()` → `_lastResume = 加载时刻`。用户通常在 1.2 秒内就滑动解锁，此时 `stuck === false` → **不重建**，只对一个「加载期创建、被污染的 ctx」做 resume → iOS 上失败。
而之后的重建只能发生在 `unlockPhone()` 里 1400ms 的 `setTimeout` 中，那时已不在手势的同步任务内，WebKit 可能直接拒绝 resume → 依旧哑火，最终弹出「轻触」。

**修法（两条一起做）**：
1. **惰性创建**：页面加载时**不要创建 AudioContext**（`armAudioUnlock()` 只注册监听，不调 `SFX.ensure()`），让第一次 `new AudioContext()` 就发生在真手势里；
2. 新增 `SFX.hardUnlock()`：**无条件** `close → new → resume → ping → play 静音 wav`，全部同步执行，只在 `unlockPhone()` 和 `audioNet()` 捕获到 `touchend/click` 的真手势里调用（不要用 setTimeout 包）。

#### H3：事件顺序导致手势被浪费

`bindLock()` 的 `finish()` 同时绑了 `pointerup/pointercancel/pointerleave/touchend`。在 iOS 上触摸的 `pointerup` **不算用户激活事件**（只有 `touchend` / `click` 算），而 `pointerup` 先触发并把 `done = true`、`dragging = false` 置位，随后的 `touchend` 里的 `finish()` 直接 `return`，等于浪费了这次真手势（全局 `audioNet` 仍会触发，但会撞上 H2 的 `stuck === false`）。

**修法**：在 `finish()` 里，只要判定为解锁成功，就调用 `SFX.hardUnlock()`（与 H2 的 2 是同一处）；或干脆让 `unlockPhone()` 在 `touchend` / `click` 分支里也执行一次硬解锁。

#### H4：静音 wav 的播放方式在 iOS 上不够稳

当前是 `new Audio(blobURL)`，元素**没有插入 DOM**，且用的是 Blob URL。iOS 上未挂载的 `<audio>` 有时不生效，blob: 源也偶发失败。

**修法**：`document.body.appendChild(a)`（样式 `position:fixed;width:1px;height:1px;opacity:0;pointer-events:none`），并准备 data-URI（`data:audio/wav;base64,...`）作为 Blob 失败时的兜底；播放失败绝不影响 `dead`。

#### H5：iOS 静音拨杆（硬件，非代码问题）

若手机侧边静音键打开，WebAudio 会被系统静音，此时 `state` 仍是 `running` 但听不见。用户微信能响说明硬件正常，可基本排除。但「轻触」提示无法区分这种情况 —— 建议把兜底文案改成「若仍无声，请检查手机侧边静音键」。

#### H6：重建次数过多

WebKit 历史上对同时存在的 AudioContext 数量有上限。现在 `_rebuilds` 无上限。建议加上限（≤3 次），超出后只 resume 不再重建。

### 4. 建议的「取证」步骤（请下一个模型先做这一步，别盲改）

在真机（iOS Safari 或 iOS Chrome）打开页面 → 滑动解锁 → 用 Safari 的「检查网页」（Mac 上 Safari → 开发 → 选设备）或页面内临时调试面板执行：

```js
SFX._debug()
// 关注：state（running/suspended/closed）、ready、dead、rebuilds
```

- `dead === true` → 直接按 H1 修；
- `state === "suspended"` 且 `rebuilds === 0` → 按 H2/H3 修；
- `state === "running"` 但仍无声 → H5（硬件静音）或 master 增益问题。

建议顺手加一个隐藏诊断入口（连点「begin again」标题 5 次 → 弹一个浮层显示 `SFX._debug()` 的实时值和最近 10 次 ensure 的时间/状态），方便后续远程取证，发布前不影响正常使用。

### 5. 最小改动清单

| 文件 | 位置 | 改动 |
|---|---|---|
| `sfx.js` | `init()` | 拆开 `try/catch`，`dead` 只在不支持/创建失败时置位；wav 播放独立 try；加 `_rebuilds` 上限 |
| `sfx.js` | 新增 `hardUnlock()` | 无条件 close→new→resume→ping→play，同步执行；导出 |
| `sfx.js` | `silentWavUrl()` | Blob 失败时回落 data-URI；`<audio>` 插入 DOM |
| `main.js` | `armAudioUnlock()` | 加载时不再创建 ctx，只注册监听 |
| `main.js` | `unlockPhone()` | 首帧同步调用 `SFX.hardUnlock()` |
| `main.js` | `bindLock()` `finish()` | 解锁成功分支改调 `hardUnlock()` |
| `main.js` | `armSoundNudge()` | 文案加「请检查手机侧边静音键」 |

**兜底设计（若以上都修不好，最后的保底方案）**：把开场聊天动画的启动条件改为「音频真的 running 之后」再开始（最多等 1.5s），等待期间在页面中间显示「轻触屏幕开始」的引导。这样即便某台机器就是解不开，也不会漏掉任何一句开场音效 —— 这是绝大多数 H5 的做法，体验上完全可接受。

---

## 二、真机取证面板（新增，2026-10-20）

iOS Safari / Chrome 仍失败，现已在页面内置诊断面板，用来定位到底卡在哪一步：

**打开方式**：在锁屏上连点左上角状态栏（No Service 那行）5 次。
（**已取消 `?diag=1` 自动弹出** —— 老链接会一直带着这个参数，每次打开都弹面板，看着像 bug。现在只有显式 5 连点才会出现。）
面板只覆盖上半屏，**可以直接在下方滑动解锁条**，边滑边看日志。

面板展示：
- UA、是否微信环境、是否 PWA
- `state / ready / dead / rebuilds / muted`
- 时间线日志，逐条记录：
  - `INTENT pointerdown|touchstart`（是否触发）
  - `ACTION touchend|click|mousedown...`（iOS 只认这几个）
  - `ensure force=? before->after rb=?`（上下文状态变化）
  - `ensure: no ctx & noCreate -> skip`（确认没有在非激活事件里创建）
  - `resume OK -> running` / `resume REJECT NotAllowedError`（resume 是否被 WebKit 拒绝）
  - `wav play OK / wav play REJECT ...`（静音 wav 是否播成功）
- 三个按钮：播测试音 / 重试解锁 / 复制（复制全部文本发回来）

**判读方法**：
| 日志特征 | 结论 |
|---|---|
| 完全没有 `ACTION touchend` | 事件没绑上/被别的东西拦了 |
| 有 `ACTION touchend` 但 `ensure ... suspended->suspended` | WebKit 拒绝了 resume（需要换解锁策略） |
| `resume REJECT NotAllowedError` | 同上，且能拿到确切错误名 |
| `state: running` 但没声音 | 设备静音拨杆/音量，非代码问题 |
| `dead: true` | AudioContext 创建失败 |

**本轮同时改掉的实质问题**：
1. 静音 wav 从「全 0」改成「40ms 静音 + 40ms 极轻滴声」——全 0 音频在 iOS 上可能被判为「无播放」，从而激活不了音频会话。
2. 解锁顺序改为「先 `<audio>.play()` 争媒体权限 → 再 `new AudioContext()`」，两步在同一手势同步栈内。
3. `unlockPhone()` 里的重试改为 `SFX.wake()`（只唤醒已存在的上下文，不新建），确保第一个 AudioContext 一定诞生在 `touchend`/`click` 里。
4. 事件监听只挂 `document` 捕获阶段，避免 window+document 双重触发。

## 三、轻触解锁 + 假「面容 ID」（2026-10-20 已实施）

### 1. 交互

| 时刻 | 发生什么 |
|---|---|
| 用户点一下锁屏（任意位置，状态栏除外） | `.faceid` 浮层淡入，圆角方框 + 面容图标 + 「面容 ID / 正在识别…」 |
| +1000ms | 图标换成对勾、外圈脉冲一次、文案变「已识别」，同时响「开锁」那一声 |
| +1460ms | 浮层淡出，进入微信开场（`view-opening`） |

拖滑块解锁仍然可用（拖过 70% 即触发同一套动画），只是文案改成「轻触屏幕解锁」——把点按作为主路径。

### 2. 代码位置

| 文件 | 位置 | 说明 |
|---|---|---|
| `main.js` | `renderLock()` | 新增 `.faceid` 浮层 DOM（SVG 面容图标 + `#fid-sub`），`#lock-hint` 文案改为「轻触屏幕解锁」 |
| `main.js` | `bindLockTap()` | 新增。整块 `.lock` 都是轻触区：`touchstart/mousedown` 记起点，`touchend/click` 结算；位移 >14px 或按住 >900ms 不算轻触；`.lock-status` 与诊断面板除外（留给 5 连点开诊断） |
| `main.js` | `bindLock()` `finish()` | 拖过 70% 直接 `unlockPhone()`；原地轻触不再在这里抢（交给 `bindLockTap`） |
| `main.js` | `runFaceId()` / `beginStory()` | 动画时间轴；`beginStory()` 才 `renderOpening()` + `showView("opening")` + `armSoundNudge()` |
| `main.js` | `unlockPhone()` | 第一句就是 `SFX.hardUnlock()`（同步、在点按的事件栈里）；之后 `[80,260,620,1100,1800,2600,3600]ms` 用 `SFX.wake()` 温和续命 |
| `style.css` | `.faceid / .fid-*` | 浮层样式与动画（`fidDraw` 画线、`fidRing` 脉冲） |
| `sfx.js` | `ensure()` | 新增 `_lastCreate` 守卫：新建出来的上下文 **150ms 内不许重建**（详见下条） |
| `sfx.js` | `nudge()`（对外仍叫 `SFX.wake()`） | 只对已存在的 ctx 做 resume + ping，**不再 `markGesture()`** |

### 3. 两个容易踩的坑（都已修）

1. **同一次点按会被解锁两次。**
   `document` 捕获层的 `audioNet` 先 `hardUnlock()` 建好 ctx，紧接着 `unlockPhone()` 又 `hardUnlock()`；
   旧逻辑里第二次看到 `state` 还是 `suspended`（resume 是异步的）就 `close + 重建` —— 把刚建好、正在 resume 的那只关掉了，这次手势白给。
   → `sfx.js` 加 `_lastCreate`，150ms 内不重建。真机日志里的 `none->suspended rb=1` 就是这个坑的化石。
   （取 150ms 而不是更长，是为了不误伤 300ms 后才到的 `click` 重试。）
2. **`wake()` 不能标手势窗口。**
   它被 `setTimeout` 反复调用，一标窗口，`suspended` 期间排下的音符就堆在冻结的 `currentTime` 上，等音频真醒了会一次性炸出来（之前的「卡几秒后集中播放」）。
   → `wake()` 改成独立的 `nudge()`，不碰 `_gestureUntil`。

### 4. 验证（headless Chrome + 真实触摸事件）

| 路径 | 结果 |
|---|---|
| 轻触锁屏 | 解锁前 `state=null` → `ACTION touchend` → `ensure force=1 none->running rb=0` → `wav play OK` → 浮层 `on`→`ok` → `view-opening`，`state=running` |
| 拖滑块 | 同样进入浮层 → `view-opening`，`rb=0`（没有浪费重建） |
| 状态栏 5 连点 | 诊断面板正常弹出，且**不会**触发解锁 |

**仍需真机确认**：iOS Safari / Chrome 上点一下锁屏后，开场第一句是否有声。若仍无声，连点左上角状态栏 5 次打开面板，把日志发回来 —— 重点看 `wav play OK/REJECT`。

---

## 四、推送方式（本机环境备注）

- 仓库：`fantasea98/begin-again`，走 REST API：`GET /contents/{file}` 拿 `sha` → `PUT` 带 `sha` + base64 `content`
- `curl` 必须加 `--noproxy "*"`（本机有代理 `http_proxy=127.0.0.1:8092`）；Python `urllib` 走 api.github.com 会偶发 SSL 错误，不要用
- base64 内容不要走命令行参数（会 `Argument list too long`），用 Python 写临时 JSON 文件再 `curl -d @file`
- GitHub MCP 连接器只有**读**权限，写操作会 403，别走 MCP

---

## 五、终页「员工档案」+ 锁屏间距（2026-10-20 第二轮，已上线 `?v=20261020f`）

### 1. 终页改版（方案 A · 员工档案）

进入密码 1122 正确后：800ms → `confettiBurst()`（礼花 + 新音效）→ `renderFinal()`。
卡片是一张「档案卡」：双线边框 + 烫角阴影，下面挂两个按钮。

出场时间轴（`runFinalSequence()`，全部 setTimeout 排队）：

| 时刻 | 出现 | 音 |
|---|---|---|
| 0 | 档案卡（员工档案：🐘🐏 / NO. 5147 / 横线） | — |
| 420 | `1122 天` | flip |
| 820 | `2023.10.05 — 2026.10.30` | flip |
| 1120 | `4 段记忆 · 全部归档` | flip |
| 1480 | 部门 / 在职 / 状态 三格同时 | flip |
| 1880 | 「组织部」 | tap |
| 2180 | 「1122 天」 | tap |
| 2880 | 状态格盖上「已离职」印章（顿 700ms） | **stamp** |
| 4100 起 | 留言逐行，每行 +1200ms | flip |
| 末行 +300 | 落款 `—— 🐘🐏` | fragment |
| 末行 +950 | 两个按钮 | — |

- 印章：56px 双圈，`right:1px / bottom:-7px`，`rotate(-11deg)`，`stampHit` 弹性落章（2.2 → 0.9 → 1.05 → 1），透明度收到 .92 显得像油墨。
- 礼花音 `SFX.confetti()`：whoosh → bang + 4 个铃 + 7 个随机高频 sparkle。
- 印章音 `SFX.stamp()`：带通噪声（1500→170Hz）+ 低频 sine（165→48Hz）+ 一点高频「纸面」噪声，共 0.28s。
- 「再玩一次」= 清档 → `renderLock()` → `showView("lock")`，回到锁屏从头解锁（不再直接回开场）。

### 2. 锁屏间距

- `.lock-head{padding-top:66px}`：日期「10月30日 星期五」整体下移 24px（正好一个 20px 字号的行高）。原先 34px 时 `.lock-status` 被 flex 挤压了 8px，所以同时给 `.lock-status / .lock-cards / .lock-bottom` 加 `flex:none`，把余量全部留给 `.lock-word`。
- `.lock-cards{padding-top:22px → 14px}`：腾出 8px，避免挤压。
- `.lc-ico{margin-bottom:-9px → -11px}`：天气云朵再下移 2px，云底正好落在「21°」基线上。
- 矮屏媒体查询同步：`max-height:720px` 下 `.lock-head{padding-top:30px}`。
- 375×667 实测：date 65→86.8、bar 560→622、无溢出（`scrollHeight === 667`）。

### 3. 全局音量

`sfx.js` 的 `VOLUME = 1.0`（0.525 → 0.79 → 1.0），主输出后仍挂 `DynamicsCompressor` 软限幅，不会削波。

### 4. 待办

- 留言文案由作者补齐（当前 4 行占位：`CONFIG.finalMessage`）。
- 密码页 → 终页还差「碎片合体」过渡（A1 方案，尚未做）。

---

## 六、第三轮细节修正（2026-10-20，`?v=20261020g`）

### 1. 锁屏
- 日期「10月30日 星期五」保持在 101px（+24px）不动，但**下面不再跟着下移**：时间 `margin-top:-12px`、农历 `margin-top:7px`、天气组件 `padding-top:10px`，整组收紧。
- 时间字号 26vw→**28vw**（390 宽下 109px）。
- 底部上移：`.lock-bottom{padding-bottom:38px}`（原 26）。
- ⚠️ 坑：`.lock-status` 的真实高度是 35.2px，之前量的 43.2px 是字体未加载完的假值，导致多挪了 8px。

### 2. 终页
- 配色改深棕：卡片描边/横线 `#6B4520`、正文 `#4A3320`、编号 `#8C6A45`、卡片投影 `#CBB08C`，按钮描边也走 `#6B4520`。
- 删掉「4 段记忆 · 全部归档」（`finalPage.meta` 与 `.fin-meta` 一并删除）。
- 节奏全部拉成 **1 秒一个**：1000 天数 → 2000 日期 → 3000 三格 → 4000 组织部 → 5000 1122 天 → 5500 盖章（唯一加快的）→ 6500 起每行留言 +1000 → 落款 +500 → 按钮 +600。
- 过渡时长 .45s → **.95s**（`cubic-bezier(.22,.61,.36,1)`），印章动画 .34s。
- 留言临时复制成 8 行（`CONFIG.finalMessage`），844 高下 `scrollHeight 851`，可滚动，按钮能滚到。

### 3. 文案 / 音效 / 弹窗
- 大厅标题去掉 🏢 → 「记忆房间」。
- `VOLUME = 1.5`（软限幅仍生效）。
- 第 4 关 BGM 重写：C 大调 3/4 拍抒情小曲（`BOX_MELODY` 11 音 / `BOX_BASS` 4 个长音），走独立 `_boxBus`（0.52），比全局音效明显轻；循环用 `setTimeout` 接 `ctx` 时钟。
- 每关成功弹窗：空卡片先出 → 1s 后第一句 → 之后每秒一句；`.result-line` 用新的 `lineIn .8s` 淡入。
- 第一关导语「组织部」→ `.orange-flash`（#FF7A18 + 橙色光晕呼吸）。
- 第三关 miss：不再原地重开 → `l3ResetToIntro()` 落幕布、清 verdict/HUD、进度回「准备」，并把 MUSIC 滚进视野（按钮在 848px，默认在 844 视口外）。
- 第三关成功文案改为 5 行，「最受观众喜爱节目奖」保持 `glow-word` 金色闪烁。
- 第四关成功文案合并成一句「💘谢谢你留给我A、B和C」，三个选项各自 `hl-word`（绿 + wordGlow）。

### 4. 验证
| 项 | 结果 |
|---|---|
| 大厅标题 | 「记忆房间」31px |
| 第一关导语 | `.orange-flash` = 组织部 |
| 结算弹窗 | 行出现 5042 / 5924 / 6977 …，间隔 ≈1s |
| 第三关 miss | 弹窗→时光倒流→`opened:false`、进度「准备」、verdict 清空 |
| 第三关成功 | 5 行文案齐全，奖名在 `.glow-word` |
| 第四关成功 | 「💘谢谢你留给我热爱、朋友和回忆」，3 个 `hl-word` |
| 终页 | 深棕 #6B4520 / #4A3320；8 行可滚动（851 vs 844） |
| 音频 | `musicBoxStart/Stop` 重复调用无异常 |

---

## 七、第四轮修正（2026-10-20，`?v=20261020h`）

### 1. 锁屏
- 农历行 `margin-top:7→18px`，天气/心情组件跟着下移；`.lc` 毛玻璃更透（底 .20/.05/.12、描边 .28、blur 7px）。
- `begin again` 字号 21vw/84 → **22.5vw/92**。
- `.lock-bottom` 底距 38 → **54px**，滑条和静音提示一起上移。

### 2. 微信页
- 「我穿越了？⚡」延迟 900ms 出现，过渡 .5s → **1.15s**，配 `SFX.fragment()`。
- `.guide` 上边距 9 → 2px。

### 3. 第一关
- 标题 / 年份 / 返回按钮统一 `#6B4520`（`#view-level1` 作用域）。
- 拨号节奏：按满 8 位 → **静 1 秒** → 回铃音 2.4s → **再静 1 秒** → 判定 →（1.2s 音效收尾）→ 弹窗。新增 `lv1.ringTimer`，离开本关时一并清理。

### 4. 第二关
- 标题 / 返回按钮同上（`#view-level2`）。

### 5. 第三关
- 动作环颜色换成八个亮色：`#FF5A5F #FFD93D #4D9BFF #5BE37D #FF8FC7 #FFF3D6 #FF9F45 #9B8CFF`。

### 6. 第四关
- BGM 淡入 3.6s，总线 0.52 → **0.175**（三分之一）。
- 选中物品 `SFX.pick()`（三角波木琴「叮」）。
- 成功文案拆成 4 行：`💘谢谢你留给我` / `热爱、朋友和回忆` / `你的选择就是唯一的正确答案。🎯` / `最后一个碎片缓缓掉落。`，最后一行加 `.slow`（2.2s 淡入）+ `SFX.fragment()`。

### 7. 弹窗
- `playResult` 逐行配 `SFX.flip()`，最后一行（slowLast）配 `SFX.fragment()`。
- `.frag-big` 颜色 `var(--ink)` → `#6B4520`。

### 8. 工号 5147
- `password: [5,1,4,7]`；四关碎片 5 / 1 / 4 / 7。
- 大厅药丸文案 `碎片名 ×N` → `碎片名：N`（全角冒号），全部白字；浅色主题色（第一关黄）自动 `mixDark()` 压深到 #B5923D 保证可读。
- 关卡弹窗 `获得xx碎片 ×N` → `：N`。

### 9. 终页新设计（**仅样式稿，未接入游戏**）
- `mockup-final.html`：员工档案 / No. 5147 → 姓名·工号·部门 + 竖版工牌简笔画（卷发、大眼镜、咧嘴笑）→ 在职日期 / 在职天数两框 → 长信（自动下翻）→ 落款 → 停 2s 红章「已离职」+ 印章音 → 两个按钮。
- 打开方式：本地 `mockup-final.html`，或线上 `/begin-again/mockup-final.html`。

---

## 八、终页正式接入（2026-10-20，`?v=20261020i`）

- 新终页已并入 `main.js` 的 `renderFinal()` / `runFinalSequence()`，不再是独立页面：
  员工档案 · NO. 5147 → 横线 → 姓名 / 工号 / 部门 + 右侧工牌照片 → 在职日期 / 在职天数 → 长信 → 落款 → 停 2 秒盖红章 → 两个按钮。
- 工牌照：把 AI 出图用 VTracer 描摹的路径抽取成 `id-photo.svg`（约 50KB）。
  抽取规则：丢掉 `translate y < 100` 的（顶部 ID PHOTO 标题条与文字）、整幅背景、米色内卡片、`x > 440` 的右边框；
  viewBox 裁到 `60 110 400 530`；顶部一块碎屑用 `<mask>` 椭圆遮掉，左侧一条碎屑用同底色小色块盖掉。
- 节奏：字段 1.1s / 张，部门之后 1.2s 出照片，两个框 1.1s，信件每行 1.1s，落款 1.2s，**停 2s 盖章**，再 1s 出按钮。所有过渡 0.9~0.95s。
- 字段字号：姓名 19px（大），工号 / 部门 15.5px（用户要求小一点），字重 500 不加粗；NO. 5147 12.5px。
- 照片框宽 86px、`margin-right:7px`（往左挪）。
- **修横向抽动**：原来用 `scrollIntoView`，红章从 scale(2.3) 放大时盒子越出右边，连带把 `scrollLeft` 拉开；
  改成 `finScrollTo()` 只改 `scrollTop` 并把 `scrollLeft` 归零。

---

## 九、第五轮细节（2026-10-20，`?v=20261020j`）

1. **大厅**
   - 碎片药丸回到「原主题色底 + 深色字」，2023 恢复纯黄 `#FFDE59`；深色主题（2026 深绿）仍用白字（`.hall2-frag.on.white`）。
   - 关卡简介 `.hall2-tag` 颜色改成 `var(--muted)`，与「找一找工位上特别的物品」一致。
   - 第一关简介改为「入职第一天，猜猜他是谁？」。
2. **第二关**：标题 / 年份 / 返回按钮改太阳亮黄 `#F2A93B`。
3. **第四关**：标题 / 年份 / 返回按钮改近黑深绿 `#1B3A2E`；成功文案第二行的三个物品改逐个蹦出（`.stagger` + `.p1/.p2/.p3`，0.1 / 0.75 / 1.4 秒）。
4. **结算**：`获得xx碎片：X` 用各关主题色的加深版（`THEME.deep`：`#E0BC2A / #2691A8 / #E23C79 / #16352A`）；「收下碎片」按钮改成大厅棕 `#6B4520`。
5. **密码界面**：输入框数字与解锁按钮改深棕（`.otp-mode` 与 `#view-hall` 两条作用域都覆盖）。
6. **员工档案**
   - 节奏再放慢：字段 1.5s、照片 1.6s、两个框 1.4s、信件每行 1.4s、落款 1.5s；过渡 0.9 → 1.15~1.2s。
   - 音效换成新写的 `SFX.soft(n)`：慢起慢落的风铃，按音阶一级级往上走，替换原来的翻页「咔」。
   - 工牌照 86 → 95px，`.fin-body` 改 `align-items:flex-end`，底边与「组织部」那行平齐。
   - **描边**：VTracer 把人物描边和标题条同色合并成了一条路径，之前按 y<100 整条丢掉，导致描边消失。现在改用 SVG 滤镜补：`feMorphology(dilate 3.4)` → `feFlood #6A4520` → `feComposite in` → 与原图合并，得到均匀的深棕描边。
   - 顺手修：`prefers-reduced-motion` 下 `.hl-word` 的 `animation:none !important` 会把第四关三个物品停在 opacity:0 —— 在该媒体查询里补了 `opacity:1 !important`。

---

## 十、第六轮（2026-10-20，`?v=20261020k`）

1. 大厅：碎片药丸统一白字（黄底也白字）；2023 茶杯挪到桌子右侧并加了上升热气（`.tea-steam` + `steamRise`）；2025 简介改「时光偷走遇见转角送来错过，四季飞快像坐过山车。」
2. 「获得xx碎片」文字色与「收下碎片」底色按关分配：`THEME.fragInk` / `THEME.fragBtn`
   （1 棕棕 / 2 蓝字蓝底 / 3 粉字粉紫底 / 4 深绿深绿）。
3. 第二关标题、年份、返回按钮改纯白；「先进个人最速传说」改蓝色发光 `.blue-glow`。
4. 第三关奖名改亮粉发光 `.pink-glow`。
5. 第四关：背景换深绿渐变（.bg-4），太阳光晕改薄荷绿，标题/年份/返回全白；
   「唯一的正确答案」改 `.green-glow`；三个物品改成 **JS 依次加 `.in`**（380/900/1420ms），不再用 CSS 动画延迟，避免 reduced-motion 或时序问题导致同时出现。
6. 终页：
   - 「员工档案」整块（`.fin-head`）延后到 1.6s 才淡入，等礼花先飘一会儿；
   - 字号整体加大（姓名 23 / 工号·部门 18 / NO.5147 14 / 框内 13.5）；
   - 在职日期与在职天数两个框同时出现，里面的数字分别再晚 1 秒落（`.fin-v`）；
   - 音效换成 `SFX.pop()` 一声「啵」，不再用上行风铃；
   - 留言首行前多等 1 秒，且逐行不再配音，只有落款和盖章出声。
7. 工牌照换成作者新给的描摹图（`viewBox="111 273 814 963"`，自带黑色粗描边、透明底），直接作为 `id-photo.svg` 使用，不再需要滤镜补边。

---

## 十一、第七轮（2026-10-20，`?v=20261020l`）

1. 2023 茶杯真正落到桌面上：桌面矩形是 `x22 y150 w190`，之前放到 x=226 已经越出桌沿所以悬空；现在 `x=186..202`，杯底压在 y=150 上，热气条也加粗到 1.8（常驻半透明，不再是「闪一下就没」）。
2. 第四关选物品区 `#l4-game`：底改 `rgba(255,252,246,.9)` + 细白边 + 投影，不再一片绿；「已选择 0 / 3」加大加粗成 `#3E2B18`。
3. 第四关成功文案：`playResult` 新增 `staggerHold`，第二行三个物品挨个出完后再整体顺延 1.5 秒，第三行才出现（碎片尾行同样顺延）；「唯一的正确答案」改回 `.hl-word`，和第二行物品同一个绿。
4. 终页：姓名/工号/部门/在职日期/在职天数这些小标签 10/9.5 → 13/11.5px（颜色 #A98B68），数值 15.5/19/13.5 → 18/23/15；日期与 1122 之间 1 秒、淡入 1 秒。
5. 工牌照预加载：`<link rel="preload" as="image">` + 启动 1.2 秒后 `new Image()` 预热，避免走到终页才现拉 160KB。
