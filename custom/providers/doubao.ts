/**
 * 豆包（网页对话）媒体供应商
 *
 * 把豆包网页版的出图/出片能力接进 ToonFlow 的「媒体模型」：
 * 在视频生成节点里选择「豆包 · 视频生成（网页对话）」并点击生成后，
 * 会自动打开本机浏览器的豆包对话，把提示词与参考图一并写入并提交，
 * 等豆包出片后把素材下载回来，保存进工作区并挂回节点。
 *
 * 前置条件：
 *   1. 本地中继已启动（relay-server.js，默认端口 7788）；
 *   2. 浏览器已加载「豆包助手」扩展；
 *   3. 豆包网页处于登录状态。
 */

const rules = [
  {
    type: "input" as const,
    field: "relayUrl" as const,
    title: "桥接中继地址",
    value: "http://127.0.0.1:7788",
    props: { placeholder: "http://127.0.0.1:7788", clearable: true },
  },
  {
    type: "select" as const,
    field: "autoOpen" as const,
    title: "生成方式",
    value: "auto",
    options: [
      { label: "自动打开浏览器并发送", value: "auto" },
      { label: "只填入内容，人工确认后发送", value: "manual" },
    ],
  },
  {
    type: "input" as const,
    field: "timeoutMinutes" as const,
    title: "最长等待（分钟）",
    value: "20",
    props: { clearable: true, placeholder: "豆包排队较久时可调大，默认 20" },
  },
  {
    type: "select" as const,
    field: "targetModel" as const,
    title: "模型",
    value: "2.0 Fast",
    options: [
      { label: "豆包 2.0 Fast", value: "2.0 Fast" },
      { label: "豆包 2.1 Pro", value: "2.1 Pro" },
      { label: "不指定（用网页当前模型）", value: "" },
    ],
  },
  {
    type: "select" as const,
    field: "durationSec" as const,
    title: "视频时长",
    value: "15",
    options: [
      { label: "5 秒", value: "5" },
      { label: "10 秒", value: "10" },
      { label: "15 秒", value: "15" },
    ],
  },
  {
    type: "select" as const,
    field: "autoConfirm" as const,
    title: "反问确认",
    value: "auto",
    options: [
      { label: "自动确认生成", value: "auto" },
      { label: "等人工确认", value: "manual" },
    ],
  },
];

const DEFAULT_RELAY = "http://127.0.0.1:7788";
const POLL_INTERVAL = 3000;
/**
 * 中继不在时的诊断提示。
 *
 * 注意：这里不能写死任何绝对路径 —— 换电脑后路径会变，
 * 照着提示去找一个不存在的文件只会让用户更困惑。
 * 统一给「与当前电脑无关」的可执行动作。
 */
const RELAY_DOWN_HINT =
  "本地桥接中继未运行（豆包桥接是一个独立的后台进程，不会随扩展或画布插件自动启动）。\n" +
  "请按顺序尝试：\n" +
  "  1. 重启 ToonFlow —— 「豆包桥接」Agent 工具会在启动时自动把中继拉起来（推荐）；\n" +
  "  2. 双击整合包里的 doubao-extension/bridge/启动豆包桥接.cmd；\n" +
  "  3. 在整合包目录执行：node doubao-extension/bridge/watchdog.js start\n" +
  "（启动后访问 http://127.0.0.1:7788/ 查看任务看板；若 7788 端口被占用可改配置里的中继地址）";

function relayOf(config: Record<string, unknown>) {
  const raw = typeof config.relayUrl === "string" ? config.relayUrl.trim() : "";
  return (raw || DEFAULT_RELAY).replace(/\/+$/, "");
}

/**
 * 中继探活。
 *
 * ToonFlow 的 provider 只能通过 tool.fetch 访问网络，没有 exec 权限，
 * 所以这里无法自己拉起进程；但至少能区分「中继没跑」和「其它错误」，
 * 避免用户只看到一个没有信息量的 "fetch failed"。
 */
async function relayAlive(context: ProviderContext, relay: string): Promise<boolean> {
  try {
    const res = await context.tool.fetch(`${relay}/health`, {
      method: "GET",
      signal: AbortSignal.timeout(4000),
    });
    await res.text();
    return res.ok;
  } catch {
    return false;
  }
}

function toBase64(input: MediaInput) {
  if (input.type === "base64") return { base64: input.data, mimeType: input.mimeType, name: (input as { name?: string }).name };
  return {
    base64: Buffer.from(input.data).toString("base64"),
    mimeType: input.mimeType,
    name: (input as { name?: string }).name,
  };
}

/** 把节点传来的素材转成中继能接收的描述 */
function toRelayImage(input: MediaInput | undefined) {
  if (!input) return null;
  if (input.type === "url") {
    const url = input.url || "";
    if (!url) return null;
    if (/^data:/i.test(url)) {
      const match = /^data:([^;]+);base64,(.*)$/s.exec(url);
      if (match) return { base64: match[2], mimeType: match[1], name: "ref.png" };
    }
    return { url };
  }
  return toBase64(input);
}

/** 画幅与时长在网页端由豆包自己决定，这里转成提示词里的自然语言约束 */
function decoratePrompt(request: VideoRequest | ImageRequest) {
  const parts: string[] = [];
  const duration = (request as VideoRequest).duration;
  if (duration) parts.push(`视频时长 ${Math.round(duration)} 秒`);
  const resolution = (request as VideoRequest).resolution;
  if (resolution) parts.push(`画面分辨率 ${resolution}`);
  const ratio = request.ratio;
  if (ratio) parts.push(`画面比例 ${ratio}`);
  const base = request.prompt.trim();
  if (!parts.length) return base;
  return `${base}\n\n（生成要求：${parts.join("，")}）`;
}

function wait(signal: AbortSignal, ms: number) {
  signal.throwIfAborted();
  return new Promise<void>((resolve, reject) => {
    const abort = () => {
      clearTimeout(timer);
      reject(signal.reason);
    };
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", abort);
      resolve();
    }, ms);
    signal.addEventListener("abort", abort, { once: true });
  });
}

async function submit(
  context: ProviderContext,
  request: VideoRequest | ImageRequest,
  expect: "video" | "image",
): Promise<{ taskId: string; relay: string }> {
  const relay = relayOf(context.config);

  // 先探活：中继没跑时给出可执行的提示，而不是裸的 "fetch failed"
  if (!(await relayAlive(context, relay))) {
    throw new Error(`豆包桥接中继无法连接（${relay}）。\n${RELAY_DOWN_HINT}`);
  }
  const autoOpen = String(context.config.autoOpen ?? "auto") !== "manual";
  const autoConfirm = String(context.config.autoConfirm ?? "auto") !== "manual";
  const timeoutMinutes = Math.max(2, Number(context.config.timeoutMinutes || 20) || 20);
  const durationSec = Math.max(1, Number(context.config.durationSec || 15) || 15);
  const targetModel = String(context.config.targetModel ?? "2.0 Fast").trim();
  const signal = AbortSignal.any([AbortSignal.timeout(timeoutMinutes * 60_000), ...(context.signal ? [context.signal] : [])]);

  const images = [
    ...(request.images ?? []).map(toRelayImage),
    toRelayImage(request.firstFrame),
    toRelayImage(request.lastFrame),
  ].filter(Boolean) as { url?: string; base64?: string; mimeType?: string; name?: string }[];

  let response: Response;
  try {
    response = await context.tool.fetch(`${relay}/task`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: decoratePrompt(request),
      images,
      expect,
      autoSend: autoOpen,
      autoConfirm,
      openBrowser: autoOpen,
      timeoutSec: timeoutMinutes * 60,
      durationSec,
      targetModel,
      meta: {
        source: "toonflow-provider",
        provider: "doubao",
        model: request.model,
        label: request.model,
      },
    }),
    signal,
    });
  } catch (err) {
    // 连接层失败：这里几乎必然是中继进程不在了
    throw new Error(
      `豆包桥接中继连接失败（${relay}）：${(err as Error)?.message || String(err)}\n${RELAY_DOWN_HINT}`,
    );
  }

  const text = await response.text();
  if (!response.ok) throw new Error(`豆包桥接拒绝任务：${text.slice(0, 300)}`);
  let task: { id?: string };
  try {
    task = JSON.parse(text);
  } catch {
    throw new Error(`豆包桥接返回内容无法解析：${text.slice(0, 200)}`);
  }
  if (!task.id) throw new Error("豆包桥接未返回任务 ID");
  return { taskId: task.id, relay };
}

async function waitForResult(context: ProviderContext, relay: string, taskId: string) {
  const timeoutMinutes = Math.max(2, Number(context.config.timeoutMinutes || 20) || 20);
  const signal = AbortSignal.any([AbortSignal.timeout(timeoutMinutes * 60_000), ...(context.signal ? [context.signal] : [])]);
  while (true) {
    await wait(signal, POLL_INTERVAL);
    let response: Response;
    try {
      response = await context.tool.fetch(`${relay}/task/${taskId}`, { signal });
    } catch (err) {
      // 轮询途中中继挂了：重试几次，避免误报「生成失败」
      let alive = false;
      for (let i = 0; i < 3 && !alive; i += 1) {
        await new Promise((r) => setTimeout(r, 2000));
        alive = await relayAlive(context, relay);
      }
      if (!alive) {
        throw new Error(
          `豆包桥接中继在等待生成结果时断开（${relay}）：${(err as Error)?.message || String(err)}\n${RELAY_DOWN_HINT}`,
        );
      }
      continue;
    }
    const text = await response.text();
    let task: {
      status?: string;
      error?: string;
      progress?: { detail?: string }[];
      result?: { media?: { type?: string; url?: string }[] };
    };
    try {
      task = JSON.parse(text);
    } catch {
      throw new Error(`豆包桥接状态无法解析：${text.slice(0, 200)}`);
    }
    if (task.status === "succeeded") return task;
    if (task.status === "failed") {
      const detail = task.error || task.progress?.[task.progress.length - 1]?.detail || "未知原因";
      throw new Error(`豆包生成失败：${detail}`);
    }
  }
}

export default {
  id: "doubao" as const,
  label: "豆包（网页对话）",
  version: "1.0.0",
  apiUrl: DEFAULT_RELAY,
  readme: `## 豆包（网页对话）

把豆包网页版的出图 / 出片能力接入 ToonFlow 的媒体模型。

- 选择「豆包 · 视频生成（网页对话）」或「豆包 · 图片生成（网页对话）」后，节点生成时会自动打开本机浏览器的豆包对话，把**提示词与参考图一并写入并提交**，出片后自动把素材下载回工作区并挂回节点。
- 时长、分辨率、画幅会转成提示词里的自然语言要求；豆包网页端的能力上限由豆包自身决定。
- 需要本机中继在运行（\`relay-server.js\`，默认端口 7788；「豆包桥接」Agent 工具会在 ToonFlow 启动时自动拉起它），并已加载「豆包助手」扩展、保持豆包登录态。
- 「生成方式」选「只填入内容，人工确认后发送」时，桥接只把内容写进输入框，由人工点发送；发送后仍会自动回收结果。
- 参考图按节点里的顺序作为第 1、2、3… 张图发送；首尾帧也会一并作为参考图提交。`,
  rules,
  models: [
    {
      id: "doubao-video",
      label: "豆包 · 视频生成（网页对话）",
      type: "video",
      durationResolutionMap: [
        {
          duration: [5, 10, 15],
          resolution: ["480p", "720p", "1080p"],
        },
      ],
      mode: ["text", ["imageReference:9"]],
    },
    {
      id: "doubao-image",
      label: "豆包 · 图片生成（网页对话）",
      type: "image",
      imageSizes: ["1K", "2K"],
      imageRatios: ["1:1", "16:9", "9:16", "4:3", "3:4", "3:2", "2:3", "21:9"],
      mode: ["text", ["imageReference:9"]],
    },
  ],
  async generateVideo(this: ProviderContext, request: VideoRequest): Promise<MediaAsset[]> {
    const { taskId, relay } = await submit(this, request, "video");
    await this.saveTaskData?.({ kind: "media", taskId, model: request.model });
    const task = await waitForResult(this, relay, taskId);
    const media = task.result?.media ?? [];
    const assets: MediaAsset[] = [];
    media.forEach((item, index) => {
      if (item.type !== "video") return;
      assets.push({
        mediaType: "video",
        type: "url",
        url: `${relay}/media/${taskId}/${index}`,
        mimeType: "video/mp4",
      });
    });
    if (!assets.length) throw new Error("豆包任务完成但未捕获到视频素材");
    return assets;
  },
  async generateImage(this: ProviderContext, request: ImageRequest): Promise<MediaAsset[]> {
    const { taskId, relay } = await submit(this, request, "image");
    await this.saveTaskData?.({ kind: "media", taskId, model: request.model });
    const task = await waitForResult(this, relay, taskId);
    const media = task.result?.media ?? [];
    const assets: MediaAsset[] = [];
    media.forEach((item, index) => {
      if (item.type !== "image") return;
      assets.push({
        mediaType: "image",
        type: "url",
        url: `${relay}/media/${taskId}/${index}`,
        mimeType: "image/jpeg",
      });
    });
    if (!assets.length) throw new Error("豆包任务完成但未捕获到图片素材");
    return assets;
  },
} satisfies ProviderDefinition<typeof rules>;
