/*! toonflowTool:{"name":"doubaoBridge","version":"1.1.0","displayName":"豆包桥接","description":"把提示词与参考图投递到本机浏览器的豆包对话，自动发送、等待生成并把素材下载回工作区。启动时自动确保本地中继在运行。","prompt":"需要用豆包网页生成图片或视频时使用本工具。先用 doubaoHealth 确认本地中继在运行，再用 doubaoSubmit 提交任务（提示词 + 工作区内的参考图），最后用 doubaoCollect 等待结果并取回文件。\n参考图使用工作区相对路径；等待生成期间不要重复提交，避免重复消耗豆包额度。生成结果以文件路径形式返回，直接引用该路径，不要返回 Base64。","readme":"# 豆包桥接\n\n把 ToonFlow 与豆包网页对话连起来的 Agent 工具。\n\n## 工作方式\n\n1. 本地中继运行在 `http://127.0.0.1:7788`（由本工具在 ToonFlow 启动时自动拉起，无需手动操作）。\n2. 提交任务后会自动打开本机浏览器的豆包对话，「豆包助手」扩展负责把提示词和参考图写进输入框并提交。\n3. 豆包出图/出片后，扩展回收素材地址，工具把素材下载进工作区并返回文件路径。\n\n## 三个动作\n\n- `doubaoHealth`：检查中继与扩展是否就绪。\n- `doubaoSubmit`：提交任务，返回 taskId。\n- `doubaoCollect`：等待任务完成并把素材保存到工作区，返回文件路径。\n\n## 注意\n\n- 浏览器必须已登录豆包，否则扩展会报「未找到对话输入框」。\n- 视频生成可能排队较久，`doubaoCollect` 的 timeoutSeconds 建议给到 900。\n- 一次只提交用户明确要求的任务，不要批量消耗额度。","components":[],"author":"Doubao Bridge","github":"","configRules":[{"type":"input","field":"relayUrl","title":"桥接中继地址","value":"http://127.0.0.1:7788","props":{"clearable":true,"placeholder":"http://127.0.0.1:7788"}},{"type":"input","field":"bridgeDir","title":"桥接程序目录","value":"","props":{"clearable":true,"placeholder":"留空自动探测；也可填写 relay-server.js 所在目录"}}]} */
import { z } from "toonflow:tool-zod";
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, appendFileSync, readFileSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const RELAY_FALLBACK = "http://127.0.0.1:7788";
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/* ============================================================
 * 中继自愈（关键）
 *
 * 中继 relay-server.js 是一个独立的常驻进程，不在 ToonFlow 进程里。
 * 只要它没跑，provider 与本工具的所有请求都会得到 ECONNREFUSED，
 * 用户只看到一句没有信息量的 "fetch failed"。
 *
 * 这个文件是真正的 Bun 模块（不是沙箱），拥有完整系统权限，
 * 而 ToonFlow 启动时会预加载所有启用的工具插件 —— 所以模块顶层
 * 就可以顺手把中继拉起来。
 *
 * 这一段刻意放在 createTools 之外：只要插件被加载就会执行，
 * 不依赖用户是否真的调用了 doubaoHealth。
 * ============================================================ */

const SELF_DIR = dirname(fileURLToPath(import.meta.url));
const LOG_DIR = join(SELF_DIR, ".data");
const LOG_FILE = join(LOG_DIR, "selfheal.log");

function logSelfHeal(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  try {
    // 日志失败绝不能影响主流程
    mkdirSync(LOG_DIR, { recursive: true });
    appendFileSync(LOG_FILE, line + "\n", "utf8");
  } catch {
    /* 忽略 */
  }
}

/** 探活：只判断端口有没有在应答，不关心是谁起的 */
async function relayReachable(relay, timeout = 2500) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      const res = await fetch(relay + "/health", { signal: controller.signal });
      return res.ok;
    } finally {
      clearTimeout(timer);
    }
  } catch {
    return false;
  }
}

/**
 * 找出 relay-server.js 所在目录。
 * 探测顺序：
 *   1. 环境变量 DBB_BRIDGE_DIR
 *   2. 插件配置里的 bridgeDir（安装时由安装器写入，最准）
 *   3. ToonFlow 的 settings.json 里 toolConfigs.doubaoBridge.bridgeDir
 *      （顶层自愈没有 ctx，只能从这里读）
 *   4. 插件所在目录向上两级（解压包里 doubao-extension/bridge/）
 *   5. 常见安装位置的 bridge 目录
 */
function findBridgeDir(configured) {
  const env = process.env.DBB_BRIDGE_DIR;
  if (env && existsSync(join(env, "relay-server.js"))) return resolve(env);

  if (configured && existsSync(join(configured, "relay-server.js"))) return resolve(configured);

  const fromSettings = bridgeDirFromSettings();
  if (fromSettings && existsSync(join(fromSettings, "relay-server.js"))) return resolve(fromSettings);

  // 插件在 <ToonFlow>/data/tools/，桥接在别处；先试插件目录的祖先
  const ancestors = [];
  let cur = SELF_DIR;
  for (let i = 0; i < 6; i += 1) {
    ancestors.push(cur);
    const parent = dirname(cur);
    if (parent === cur) break;
    cur = parent;
  }
  for (const dir of ancestors) {
    if (existsSync(join(dir, "relay-server.js"))) return dir;
    if (existsSync(join(dir, "bridge", "relay-server.js"))) return join(dir, "bridge");
  }

  for (const base of ["D:/stable", "C:/stable", "C:/Program Files/ToonFlow", "D:/Program Files/ToonFlow"]) {
    const candidate = join(base, "bridge");
    if (existsSync(join(candidate, "relay-server.js"))) return candidate;
  }
  return null;
}

/**
 * 从 ToonFlow 的 settings.json 里读 bridgeDir。
 * 插件装在 <ToonFlow>/data/tools/，settings.json 就在它的上一级。
 */
function bridgeDirFromSettings() {
  try {
    const settingsPath = join(SELF_DIR, "..", "settings.json");
    const raw = readFileSync(settingsPath, "utf8");
    const settings = JSON.parse(raw);
    const dir = settings?.toolConfigs?.doubaoBridge?.bridgeDir;
    return typeof dir === "string" && dir.trim() ? dir.trim() : "";
  } catch {
    return "";
  }
}

/** 找一个能跑 relay-server.js 的运行时 */
function findRuntime() {
  // 首选 ToonFlow 自带的 bun：稳定，不依赖 PATH
  const bunCandidates = [];
  for (const base of ["D:/stable", "C:/stable", "C:/Program Files/ToonFlow", "D:/Program Files/ToonFlow"]) {
    bunCandidates.push(join(base, "app", "bin", "bun.exe"));
  }
  // 插件自身由 bun 运行时加载时，process.execPath 就是 bun
  if (process.execPath && /bun(\.exe)?$/i.test(process.execPath)) {
    bunCandidates.unshift(process.execPath);
  }
  for (const bun of bunCandidates) {
    if (existsSync(bun)) return bun;
  }
  // 退回 node
  const node = process.execPath;
  if (node && /node(\.exe)?$/i.test(node)) return node;
  for (const p of [
    join(process.env.LOCALAPPDATA || "", "Microsoft", "WindowsApps", "node.exe"),
    "C:/Program Files/nodejs/node.exe",
  ]) {
    if (existsSync(p)) return p;
  }
  return null;
}

/**
 * 拉起中继。
 * 用 detached + unref 让它脱离 ToonFlow 进程树，随 ToonFlow 关闭也不死。
 */
function spawnRelay(bridgeDir) {
  const relay = join(bridgeDir, "relay-server.js");
  if (!existsSync(relay)) return false;
  const runtime = findRuntime();
  if (!runtime) {
    logSelfHeal("no runtime found (bun/node) - cannot start relay");
    return false;
  }
  try {
    const child = spawn(runtime, [relay], {
      cwd: bridgeDir,
      detached: true,
      stdio: "ignore",
      windowsHide: true,
      env: process.env,
    });
    child.unref();
    logSelfHeal(`relay spawned: runtime=${runtime} pid=${child.pid} dir=${bridgeDir}`);
    return true;
  } catch (err) {
    logSelfHeal(`spawn failed: ${err.message}`);
    return false;
  }
}

/**
 * 确保中继在跑。
 * 已经有就什么都不做；没有就拉起来并等它就绪。
 */
async function ensureRelay(relay, configuredDir) {
  if (await relayReachable(relay)) return true;
  const bridgeDir = findBridgeDir(configuredDir);
  if (!bridgeDir) {
    logSelfHeal(`bridge dir not found (configured=${configuredDir || "none"}) - skipping auto start`);
    return false;
  }
  logSelfHeal(`relay not reachable at ${relay}, starting from ${bridgeDir}`);
  if (!spawnRelay(bridgeDir)) return false;
  for (let i = 0; i < 12; i += 1) {
    await sleep(600);
    if (await relayReachable(relay)) {
      logSelfHeal("relay is up");
      return true;
    }
  }
  logSelfHeal("relay did not become reachable in time");
  return false;
}

/** 从插件配置里取桥接目录 */
function bridgeDirOf(ctx) {
  const raw = typeof ctx?.config?.bridgeDir === "string" ? ctx.config.bridgeDir.trim() : "";
  return raw || "";
}

// 顶层立即执行一次自愈（不 await，避免阻塞插件加载）。
// 此时还没有 ctx，用环境变量与常见路径探测即可；
// 真正带配置的自愈在 doubaoHealth / doubaoSubmit 调用时再跑一次。
ensureRelay(RELAY_FALLBACK, "").catch(() => {});

const imageSchema = z.strictObject({
  path: z.string().min(1).max(4096).describe("工作区相对路径，例如 assets/abc/shot.jpg"),
  name: z.string().max(200).optional().describe("显示给豆包的文件名，默认取文件名"),
});

function relayOf(ctx) {
  const raw = typeof ctx?.config?.relayUrl === "string" ? ctx.config.relayUrl.trim() : "";
  return (raw || RELAY_FALLBACK).replace(/\/+$/, "");
}

async function call(ctx, pathname, init = {}) {
  const relay = relayOf(ctx);
  const res = await fetch(relay + pathname, {
    ...init,
    headers: { "content-type": "application/json", ...(init.headers || {}) },
  });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }
  if (!res.ok) throw new Error(data.error || `中继返回 HTTP ${res.status}`);
  return data;
}

export default {
  createTools(ctx) {
    const healthParameters = z.strictObject({});
    const submitParameters = z.strictObject({
      prompt: z.string().min(1).max(100000).describe("要提交给豆包的完整提示词，原文发送"),
      images: z.array(imageSchema).max(9).optional().describe("参考图，按顺序发送"),
      expect: z.enum(["image", "video"]).optional().describe("期望的结果类型，默认 image"),
      autoSend: z.boolean().optional().describe("是否自动点击发送，默认 true；false 时只填入内容由人工确认"),
      openBrowser: z.boolean().optional().describe("是否自动打开浏览器，默认 true"),
      timeoutSeconds: z.number().int().min(30).max(3600).optional().describe("任务最长等待秒数，默认 480"),
      label: z.string().max(200).optional().describe("任务备注，方便在看板上辨认"),
    });
    const statusParameters = z.strictObject({
      taskId: z.string().min(1).max(128).describe("doubaoSubmit 返回的任务 ID"),
    });
    const collectParameters = z.strictObject({
      taskId: z.string().min(1).max(128).describe("doubaoSubmit 返回的任务 ID"),
      outputDirectory: z.string().min(1).max(1024).optional().describe("工作区内输出目录，默认 assets/generated/doubao"),
      timeoutSeconds: z.number().int().min(30).max(3600).optional().describe("最长等待秒数，默认 900"),
    });

    return [
      {
        name: "doubaoHealth",
        label: "检查豆包桥接",
        description: "检查本地豆包桥接中继是否在运行，并返回最近的桥接任务概览。",
        promptGuidelines: ["中继未运行时本工具会自动尝试拉起，稍等几秒再重试。"],
        parameters: z.toJSONSchema(healthParameters, { io: "input", target: "draft-07" }),
        async execute(_toolContext, args, signal) {
          const relay = relayOf(ctx);
          // 探活失败时先自愈一次，再报错
          if (!(await relayReachable(relay))) {
            await ensureRelay(relay, bridgeDirOf(ctx));
          }
          const data = await call(ctx, "/health");
          const tasks = await call(ctx, "/tasks?limit=5");
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  ok: true,
                  relay: relayOf(ctx),
                  port: data.port,
                  tasks: data.tasks,
                  queued: data.queued,
                  recent: tasks.tasks.map((t) => ({ id: t.id, status: t.status, label: t.meta?.label || "" })),
                }),
              },
            ],
            details: data,
          };
        },
      },
      {
        name: "doubaoSubmit",
        label: "提交豆包任务",
        description: "把提示词与参考图投递到豆包对话。会自动打开浏览器并由扩展写入内容后发送，返回 taskId 供 doubaoCollect 收取结果。",
        promptGuidelines: ["先 doubaoHealth 确认中继可用，再 doubaoSubmit，最后 doubaoCollect 取回文件。"],
        parameters: z.toJSONSchema(submitParameters, { io: "input", target: "draft-07" }),
        async execute(_toolContext, args, signal) {
          signal?.throwIfAborted();
          const relay = relayOf(ctx);
          if (!(await relayReachable(relay))) {
            await ensureRelay(relay, bridgeDirOf(ctx));
          }
          const images = [];
          for (const image of args.images || []) {
            const buffer = await ctx.files.readFile(image.path);
            let mimeType = "image/png";
            try {
              mimeType = await ctx.files.detectImageMimeType(image.path);
            } catch {}
            images.push({
              base64: Buffer.from(buffer).toString("base64"),
              mimeType,
              name: image.name || image.path.split("/").pop() || "ref.png",
            });
          }
          const task = await call(ctx, "/task", {
            method: "POST",
            body: JSON.stringify({
              prompt: args.prompt,
              images,
              expect: args.expect || "image",
              autoSend: args.autoSend !== false,
              openBrowser: args.openBrowser !== false,
              timeoutSec: args.timeoutSeconds || 480,
              meta: { source: "toonflow-tool", label: args.label || "" },
            }),
          });
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  ok: true,
                  taskId: task.id,
                  pageUrl: task.pageUrl,
                  images: (task.images || []).length,
                  status: task.status,
                }),
              },
            ],
            details: task,
          };
        },
      },
      {
        name: "doubaoStatus",
        label: "查询豆包任务",
        description: "查询一个豆包桥接任务的当前阶段、进度与已回收的结果。",
        parameters: z.toJSONSchema(statusParameters, { io: "input", target: "draft-07" }),
        async execute(_toolContext, args, signal) {
          signal?.throwIfAborted();
          const task = await call(ctx, `/task/${args.taskId}`);
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  taskId: task.id,
                  status: task.status,
                  statusLabel: task.statusLabel,
                  detail: task.progress?.[task.progress.length - 1]?.detail || "",
                  media: task.result?.media?.length || 0,
                  error: task.error,
                }),
              },
            ],
            details: task,
          };
        },
      },
      {
        name: "doubaoCollect",
        label: "收取豆包结果",
        description: "等待豆包任务完成，把生成的图片或视频下载进工作区并返回文件路径。",
        promptGuidelines: ["只引用返回的工作区文件路径，不要返回 Base64 或外部临时链接。"],
        parameters: z.toJSONSchema(collectParameters, { io: "input", target: "draft-07" }),
        async execute(_toolContext, args, signal) {
          const timeoutSeconds = args.timeoutSeconds || 900;
          const deadline = Date.now() + timeoutSeconds * 1000;
          let task = null;
          while (Date.now() < deadline) {
            signal?.throwIfAborted();
            task = await call(ctx, `/task/${args.taskId}`);
            if (task.status === "succeeded" || task.status === "failed") break;
            await sleep(3000);
          }
          if (!task) throw new Error("未获取到任务状态");
          if (task.status === "failed") {
            throw new Error(`豆包任务失败：${task.error || task.progress?.[task.progress.length - 1]?.detail || "未知原因"}`);
          }
          if (task.status !== "succeeded") {
            throw new Error(`等待豆包结果超时（${timeoutSeconds}s），可用 doubaoStatus 继续查看`);
          }
          const dir = args.outputDirectory || "assets/generated/doubao";
          const files = [];
          const media = task.result?.media || [];
          for (let i = 0; i < media.length; i += 1) {
            const item = media[i];
            const source = item.localUrl || item.url;
            const res = await fetch(source);
            if (!res.ok) continue;
            const buffer = Buffer.from(await res.arrayBuffer());
            const contentType = (res.headers.get("content-type") || "").split(";")[0];
            const ext = contentType.includes("mp4") ? ".mp4" : contentType.includes("webp") ? ".webp" : contentType.includes("png") ? ".png" : ".jpg";
            const target = `${dir.replace(/\/+$/, "")}/${task.id}-${i + 1}${ext}`;
            await ctx.writeFile(target, buffer, true);
            files.push({ type: item.type, path: target, bytes: buffer.length });
          }
          if (!files.length) throw new Error("豆包任务完成但没有可下载的素材");
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  taskId: task.id,
                  files,
                  text: task.result?.text || "",
                  conversationUrl: task.result?.conversationUrl || "",
                }),
              },
            ],
            details: { files, taskId: task.id },
          };
        },
      },
    ];
  },
  validateConfig(config) {
    return config || {};
  },
};
