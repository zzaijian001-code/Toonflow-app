const rules = [
  {
    type: "input",
    field: "apiKey" as const,
    title: "ComfyUI Token",
    value: "",
    props: { type: "password", showPassword: true, autocomplete: "off" },
  },
  {
    type: "input",
    field: "baseUrl" as const,
    title: "接口地址",
    value: "https://autodl.art",
    props: { placeholder: "https://autodl.art，可只填域名", clearable: true },
  },
  {
    type: "select",
    field: "mode" as const,
    title: "生成模式",
    value: "auto",
    options: [
      { label: "跟随工作流默认", value: "auto" },
      { label: "高质模式", value: "高质模式" },
      { label: "高速模式", value: "高速模式" },
    ],
  },
  {
    type: "input",
    field: "timeoutMinutes" as const,
    title: "最长等待（分钟）",
    value: "45",
    props: { clearable: true, placeholder: "排队较久时可调大，默认 45" },
  },
] as const;

const version = "2.0.0";
const DEFAULT_BASE = "https://autodl.art";
const WORKFLOW_API = "/api/v1/comfyui";
/** 工作流参数规则缓存：同一工作流的 input_rules 在会话内复用，避免每次生成都拉取。 */
const detailCache = new Map<string, { at: number; detail: WorkflowDetail }>();
const DETAIL_TTL = 10 * 60_000;
const POLL_INTERVAL = 5000;

type WorkflowOption = { label?: string; values?: unknown };
type WorkflowField = {
  required?: boolean;
  type?: string;
  default?: unknown;
  min?: number;
  max?: number;
  max_length?: number;
  options?: WorkflowOption[];
};
type WorkflowDetail = {
  uuid: string;
  name: string;
  input_rules?: Record<string, WorkflowField>;
  endpoint_info?: { endpoints?: { name?: string; url?: string }[] };
};

function text(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function object(value: unknown, label = "AutoDL 响应"): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${label}格式错误`);
  return value as Record<string, unknown>;
}

function errorText(context: ProviderContext, value: unknown, fallback: string): string {
  try {
    const message = context.tool.errorMessage(value);
    if (typeof message === "string" && message.trim()) return message.trim();
  } catch {
    /* 交由兜底文本处理 */
  }
  return fallback;
}

function settings(context: ProviderContext) {
  const config = context.config as Record<string, unknown>;
  const minutes = Number(text(config.timeoutMinutes, "45")) || 45;
  return {
    token: text(config.apiKey).replace(/^Bearer\s+/i, "").trim(),
    baseUrl: text(config.baseUrl, DEFAULT_BASE).replace(/\/+$/, ""),
    mode: text(config.mode, "auto"),
    timeoutMs: Math.min(Math.max(minutes, 5), 240) * 60_000,
  };
}

/** 兼容三种写法：纯工作流 ID、提交接口链接、官方工作流详情页链接。 */
function parseWorkflow(model: string, fallbackBase: string) {
  const raw = model.trim();
  if (!raw) throw new Error("请选择 AutoDL 工作流");
  let baseUrl = fallbackBase;
  let path = raw;
  const matched = /^https?:\/\/([^/]+)(\/.*)?$/i.exec(raw);
  if (matched) {
    baseUrl = `https://${matched[1]}`;
    path = matched[2] ?? "";
  }
  const endpoint = /comfyui_workflow\/([^/?#]+)/.exec(path);
  const id = (endpoint ? endpoint[1] : path.replace(/^\/+|\/+$/g, "").split("/").pop() ?? "").trim();
  if (!/^[A-Za-z0-9._-]+$/.test(id)) throw new Error(`无法从「${raw}」识别工作流 ID`);
  return { id, baseUrl };
}

async function readJson(context: ProviderContext, url: string, init: RequestInit, signal: AbortSignal): Promise<Record<string, unknown>> {
  signal.throwIfAborted();
  const response = await context.tool.fetch(url, { ...init, signal });
  const raw = await response.text();
  let body: Record<string, unknown>;
  try {
    body = raw.trim() ? object(JSON.parse(raw)) : {};
  } catch {
    throw new Error(`AutoDL 返回内容无法解析：${raw.slice(0, 200)}`);
  }
  if (!response.ok) {
    throw new Error(`AutoDL 请求失败（HTTP ${response.status}）：${errorText(context, body, raw.slice(0, 300))}`);
  }
  return body;
}

async function workflowDetail(context: ProviderContext, baseUrl: string, id: string, signal: AbortSignal): Promise<WorkflowDetail> {
  const key = `${baseUrl}|${id}`;
  const cached = detailCache.get(key);
  if (cached && Date.now() - cached.at < DETAIL_TTL) return cached.detail;
  const { token } = settings(context);
  const headers = token ? { Authorization: token } : undefined;
  const body = await readJson(context, `${baseUrl}${WORKFLOW_API}/workflows/${encodeURIComponent(id)}`, { method: "GET", headers }, signal);
  if (body.code !== "Success") throw new Error(`读取工作流「${id}」失败：${errorText(context, body, String(body.msg ?? body.code ?? ""))}`);
  const detail = object(body.data, "工作流详情") as unknown as WorkflowDetail;
  if (!detail.input_rules || typeof detail.input_rules !== "object") throw new Error(`工作流「${id}」未返回参数规则`);
  detailCache.set(key, { at: Date.now(), detail });
  return detail;
}

/** 把标签里的档位和画幅拆出来，用于匹配工作流真实的枚举文本。 */
function parseResolutions(field?: WorkflowField) {
  return (field?.options ?? []).flatMap(option => {
    const label = text(option.label);
    if (!label) return [];
    const tier = Number(/(\d{3,4})\s*p/i.exec(label)?.[1] ?? 0);
    const aspect = /竖|portrait/i.test(label) ? "portrait"
      : /横|landscape|wide/i.test(label) ? "landscape"
        : /1:1|方|square/i.test(label) ? "square" : "any";
    return [{ label, tier, aspect }];
  });
}

function aspectOf(ratio: string) {
  const [width, height] = ratio.split(":").map(Number);
  if (!width || !height || width === height) return "square";
  return width > height ? "landscape" : "portrait";
}

/** 按「档位 + 画幅」挑最接近的枚举，而不是拼字符串，避免各工作流标签格式不一致。 */
function pickResolution(field: WorkflowField | undefined, resolution: string, ratio: string) {
  const options = parseResolutions(field);
  if (!options.length) return "";
  const wantTier = Number(/(\d{3,4})\s*p/i.exec(resolution)?.[1] ?? 0);
  const wantAspect = aspectOf(ratio);
  let best = options[0];
  let bestScore = -Infinity;
  for (const option of options) {
    let score = 0;
    if (wantTier && option.tier === wantTier) score += 20;
    else if (wantTier && option.tier) score -= Math.abs(option.tier - wantTier) / 50;
    if (option.aspect === wantAspect) score += 5;
    else if (option.aspect === "any") score += 1;
    else score -= 4;
    if (score > bestScore) {
      bestScore = score;
      best = option;
    }
  }
  return best.label;
}

function mediaUrl(input: MediaInput) {
  if (input.type === "url") {
    if (!/^https?:\/\//i.test(input.url) && !input.url.startsWith("data:")) throw new Error("参考媒体需要 HTTP、HTTPS 或 data 地址");
    return input.url;
  }
  const data = input.type === "binary" ? Buffer.from(input.data).toString("base64") : input.data;
  return data.startsWith("data:") ? data : `data:${input.mimeType};base64,${data}`;
}

function slotsOf(fields: Record<string, WorkflowField>, prefix: string) {
  return Object.keys(fields)
    .filter(key => new RegExp(`^${prefix}_\\d+$`).test(key))
    .sort((left, right) => Number(left.split("_").pop()) - Number(right.split("_").pop()));
}

function fillSlots(fields: Record<string, WorkflowField>, prefix: string, label: string, list: MediaInput[], body: Record<string, unknown>) {
  const slots = slotsOf(fields, prefix);
  if (!slots.length) {
    if (list.length) throw new Error(`该工作流不接受${label}，请移除后再生成`);
    return;
  }
  if (list.length > slots.length) throw new Error(`该工作流最多支持 ${slots.length} 个${label}，当前 ${list.length} 个`);
  list.forEach((item, index) => {
    body[slots[index]] = mediaUrl(item);
  });
  const missing = slots.filter((key, index) => fields[key]?.required && !body[key] && index >= list.length);
  if (missing.length) throw new Error(`该工作流需要${label}：${missing.join("、")}`);
}

function buildBody(
  context: ProviderContext,
  detail: WorkflowDetail,
  request: VideoRequest,
  mode: string,
): Record<string, unknown> {
  const fields = detail.input_rules ?? {};
  const body: Record<string, unknown> = {};

  if (fields.prompt) {
    const prompt = request.prompt.trim();
    if (!prompt && fields.prompt.required) throw new Error("请输入视频提示词");
    if (prompt) {
      const max = Number(fields.prompt.max_length ?? 20000);
      if (prompt.length > max) throw new Error(`提示词超出该工作流上限（${max} 字符）`);
      body.prompt = prompt;
    }
  }

  if (fields.duration) {
    const min = Number(fields.duration.min ?? 1);
    const max = Number(fields.duration.max ?? 15);
    const fallback = Number(fields.duration.default ?? min) || min;
    const wanted = Math.round(Number(request.duration ?? fallback) || fallback);
    body.duration = Math.min(max, Math.max(min, wanted));
  }

  const resolution = pickResolution(fields.resolution, text(request.resolution, String(fields.resolution?.default ?? "")), text(request.ratio, "9:16"));
  if (resolution) body.resolution = resolution;

  const modeLabels = (fields.mode?.options ?? []).map(option => text(option.label)).filter(Boolean);
  if (modeLabels.length) {
    if (mode !== "auto" && modeLabels.includes(mode)) body.mode = mode;
    else if (typeof fields.mode?.default === "string" && modeLabels.includes(fields.mode.default)) body.mode = fields.mode.default;
  }

  if (fields.seed) body.seed = Math.floor(Math.random() * 999999999999);

  if (fields.first_frame || fields.last_frame) {
    if (request.firstFrame) body.first_frame = mediaUrl(request.firstFrame);
    if (request.lastFrame) body.last_frame = mediaUrl(request.lastFrame);
    if (!body.first_frame && request.images?.length) body.first_frame = mediaUrl(request.images[0]);
    if (!body.last_frame && request.images && request.images.length > 1) body.last_frame = mediaUrl(request.images[1]);
    if (fields.first_frame?.required && !body.first_frame) throw new Error("该工作流需要首帧图片");
    if (fields.last_frame?.required && !body.last_frame) throw new Error("该工作流需要尾帧图片");
  } else {
    fillSlots(fields, "ref_image", "参考图", request.images ?? [], body);
  }

  fillSlots(fields, "ref_audio", "参考音频", request.audios ?? [], body);
  fillSlots(fields, "ref_video", "参考视频", request.videos ?? [], body);

  for (const [key, field] of Object.entries(fields)) {
    if (!field?.required) continue;
    if (["prompt", "duration", "resolution", "mode", "seed"].includes(key)) continue;
    if (body[key] === undefined || body[key] === null || body[key] === "") {
      if (!fields.first_frame && !fields.last_frame) throw new Error(`该工作流缺少必填参数：${key}`);
    }
  }
  return body;
}

function assetsOf(data: Record<string, unknown>): MediaAsset[] {
  return (Array.isArray(data.results) ? data.results : [])
    .map(item => (item && typeof item === "object" ? object(item) : {}))
    .filter(item => typeof item.url === "string" && item.url.trim())
    .map(item => ({
      mediaType: "video" as const,
      type: "url" as const,
      url: String(item.url).trim(),
      mimeType: "video/mp4",
    }));
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

const SUCCESS = new Set(["success", "succeeded", "completed", "complete", "finished", "done"]);
const FAILED = new Set(["failed", "failure", "error", "cancelled", "canceled", "rejected", "timeout"]);

export default {
  id: "autodl" as const,
  label: "AutoDL ComfyUI",
  version,
  apiUrl: "https://autodl.art",
  readme: `## AutoDL ComfyUI 工作流

接入 autodl.art 的 ComfyUI 工作流 API（提交任务 + 异步轮询）。

- 令牌在 https://autodl.art/large-model/tokens 创建，**分组必须选 ComfyUI**；普通大模型令牌会返回 403。
- 分辨率与时长按工作流实际返回的参数规则发送，不再固定档位；不同工作流的画幅与档位差异会自动适配。
- 已内置官方目录中的 17 个多图参考视频工作流（纯文生视频与首尾帧工作流已剔除）；模型名称前的 801、v5、u30 就是工作流编号，与官方目录 ID 对应。新增工作流可在模型列表里把 ID 改成工作流 ID，或直接粘贴接口链接。
- 参考图按顺序映射到 ref_image_0 起的槽位，与提示词里的 <Picture N> 对应。
- 结果链接有效期很短，生成后请尽快保存到本地。`,
  rules,
  models: [
    {
      "id": "minimax_h3_801",
      "label": "801 · H3九图15s(无字幕版)",
      "type": "video",
      "durationResolutionMap": [
        {
          "duration": [
            1,
            15
          ],
          "resolution": [
            "480p",
            "768p",
            "1088p",
            "1440p"
          ]
        }
      ],
      "mode": [
        "text",
        [
          "imageReference:9"
        ]
      ]
    },
    {
      "id": "minimax_h3_802",
      "label": "802 · H3九图15s(画质增强版)",
      "type": "video",
      "durationResolutionMap": [
        {
          "duration": [
            1,
            15
          ],
          "resolution": [
            "480p",
            "768p",
            "1088p",
            "1440p"
          ]
        }
      ],
      "mode": [
        "text",
        [
          "imageReference:9"
        ]
      ]
    },
    {
      "id": "minimax_h3_803",
      "label": "803 · H3九图三音15s(画质增强版)",
      "type": "video",
      "durationResolutionMap": [
        {
          "duration": [
            1,
            15
          ],
          "resolution": [
            "480p",
            "768p",
            "1088p",
            "1440p"
          ]
        }
      ],
      "mode": [
        "text",
        [
          "imageReference:9",
          "audioReference:3"
        ]
      ],
      "audio": true
    },
    {
      "id": "minimax_h3_804",
      "label": "804 · H3九图15s(多模式版)",
      "type": "video",
      "durationResolutionMap": [
        {
          "duration": [
            1,
            15
          ],
          "resolution": [
            "480p",
            "768p",
            "1088p",
            "1440p"
          ]
        }
      ],
      "mode": [
        "text",
        [
          "imageReference:9"
        ]
      ]
    },
    {
      "id": "minimax_h3_805",
      "label": "805 · H3九图三音15s(多模式版)",
      "type": "video",
      "durationResolutionMap": [
        {
          "duration": [
            1,
            15
          ],
          "resolution": [
            "480p",
            "768p",
            "1088p",
            "1440p"
          ]
        }
      ],
      "mode": [
        "text",
        [
          "imageReference:9",
          "audioReference:3"
        ]
      ],
      "audio": true
    },
    {
      "id": "minimax_h3_b99_003_12s",
      "label": "b99_003 · H3多图生视频12秒",
      "type": "video",
      "durationResolutionMap": [
        {
          "duration": [
            1,
            15
          ],
          "resolution": [
            "736p"
          ]
        }
      ],
      "mode": [
        "text",
        [
          "imageReference:9"
        ]
      ]
    },
    {
      "id": "minimax_h3_image_audio_to_video_v2",
      "label": "v2 · H3多图多音频生视频",
      "type": "video",
      "durationResolutionMap": [
        {
          "duration": [
            1,
            10
          ],
          "resolution": [
            "480p",
            "768p",
            "1080p"
          ]
        }
      ],
      "mode": [
        "text",
        [
          "imageReference:9",
          "audioReference:3"
        ]
      ],
      "audio": true
    },
    {
      "id": "minimax_h3_image_audio_to_video_v2_15s",
      "label": "v2_15s · H3多图多音频生视频15秒",
      "type": "video",
      "durationResolutionMap": [
        {
          "duration": [
            1,
            15
          ],
          "resolution": [
            "480p",
            "768p"
          ]
        }
      ],
      "mode": [
        "text",
        [
          "imageReference:9",
          "audioReference:3"
        ]
      ],
      "audio": true
    },
    {
      "id": "minimax_h3_lightx2v_v5",
      "label": "v5 · H3多图参考生视频",
      "type": "video",
      "durationResolutionMap": [
        {
          "duration": [
            1,
            10
          ],
          "resolution": [
            "480p",
            "768p",
            "1080p"
          ]
        }
      ],
      "mode": [
        "text",
        [
          "imageReference:9"
        ]
      ]
    },
    {
      "id": "minimax_h3_lightx2v_v5_15s",
      "label": "v5_15s · H3多图生视频15秒",
      "type": "video",
      "durationResolutionMap": [
        {
          "duration": [
            1,
            15
          ],
          "resolution": [
            "480p",
            "768p"
          ]
        }
      ],
      "mode": [
        "text",
        [
          "imageReference:9"
        ]
      ]
    },
    {
      "id": "minimax_h3_z0902",
      "label": "z0902 · H3六图生视频（多图一致性创作）",
      "type": "video",
      "durationResolutionMap": [
        {
          "duration": [
            1,
            15
          ],
          "resolution": [
            "480p",
            "768p",
            "1088p",
            "1440p"
          ]
        }
      ],
      "mode": [
        "text",
        [
          "imageReference:6"
        ]
      ]
    },
    {
      "id": "minimax_h3_z0903",
      "label": "z0903 · H3六图三音频生视频（高质量音画融合）",
      "type": "video",
      "durationResolutionMap": [
        {
          "duration": [
            1,
            15
          ],
          "resolution": [
            "480p",
            "768p",
            "1088p",
            "1440p"
          ]
        }
      ],
      "mode": [
        "text",
        [
          "imageReference:6",
          "audioReference:3"
        ]
      ],
      "audio": true
    },
    {
      "id": "minimax_h3_zm_nono",
      "label": "nono · H3多图多音频生视频(影视画质)",
      "type": "video",
      "durationResolutionMap": [
        {
          "duration": [
            1,
            15
          ],
          "resolution": [
            "480p",
            "768p",
            "960p"
          ]
        }
      ],
      "mode": [
        "text",
        [
          "imageReference:9",
          "audioReference:3"
        ]
      ],
      "audio": true
    },
    {
      "id": "minimax_h3_zm_u08",
      "label": "u08 · H3多图多音频生视频(高速版)",
      "type": "video",
      "durationResolutionMap": [
        {
          "duration": [
            1,
            15
          ],
          "resolution": [
            "480p",
            "768p"
          ]
        }
      ],
      "mode": [
        "text",
        [
          "imageReference:9",
          "audioReference:3"
        ]
      ],
      "audio": true
    },
    {
      "id": "minimax_h3_zm_u22",
      "label": "u22 · H3多图多音频生视频(短剧带货版)",
      "type": "video",
      "durationResolutionMap": [
        {
          "duration": [
            1,
            15
          ],
          "resolution": [
            "480p",
            "768p"
          ]
        }
      ],
      "mode": [
        "text",
        [
          "imageReference:9",
          "audioReference:3"
        ]
      ],
      "audio": true
    },
    {
      "id": "minimax_h3_zm_u24",
      "label": "u24 · H3多图多音频生视频(升级画质)",
      "type": "video",
      "durationResolutionMap": [
        {
          "duration": [
            1,
            15
          ],
          "resolution": [
            "480p",
            "768p"
          ]
        }
      ],
      "mode": [
        "text",
        [
          "imageReference:9",
          "audioReference:3"
        ]
      ],
      "audio": true
    },
    {
      "id": "minimax_h3_zm_u30",
      "label": "u30 · H3多图多音频生视频(超清画质)",
      "type": "video",
      "durationResolutionMap": [
        {
          "duration": [
            1,
            15
          ],
          "resolution": [
            "480p",
            "768p",
            "960p"
          ]
        }
      ],
      "mode": [
        "text",
        [
          "imageReference:9",
          "audioReference:3"
        ]
      ],
      "audio": true
    }
  ],
  async generateVideo(this: ProviderContext, request: VideoRequest): Promise<MediaAsset[]> {
    const { token, baseUrl, mode, timeoutMs } = settings(this);
    if (!token) throw new Error("请填写 AutoDL ComfyUI Token");
    const { id, baseUrl: base } = parseWorkflow(request.model, baseUrl);
    // ACT: 排队加推理可能很久，单段最多等 timeoutMinutes 分钟。
    const signal = AbortSignal.any([AbortSignal.timeout(timeoutMs), ...(this.signal ? [this.signal] : [])]);
    const detail = await workflowDetail(this, base, id, signal);
    const body = buildBody(this, detail, request, mode);
    const submitUrl = `${base}${WORKFLOW_API}/comfyui_workflow/${encodeURIComponent(id)}`;
    const submitted = await readJson(this, submitUrl, {
      method: "POST",
      headers: { Authorization: token, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }, signal);
    if (submitted.code !== "Success") {
      throw new Error(`AutoDL 未接受任务：${errorText(this, submitted, String(submitted.msg ?? submitted.code ?? "未知原因"))}`);
    }
    const payload = object(submitted.data ?? {});
    const immediate = assetsOf(payload);
    if (immediate.length && SUCCESS.has(String(payload.status ?? "").toLowerCase())) return immediate;
    const taskId = String(payload.task_id ?? "").trim();
    if (!taskId) throw new Error("AutoDL 未返回任务 ID");
    await this.saveTaskData?.({ kind: "media", taskId, model: id });
    while (true) {
      await wait(signal, POLL_INTERVAL);
      const result = await readJson(this, `${base}${WORKFLOW_API}/comfyui_workflow/result/${encodeURIComponent(taskId)}`, { method: "GET", headers: { Authorization: token } }, signal);
      const data = object(result.data ?? {});
      const status = String(data.status ?? "").toLowerCase();
      if (SUCCESS.has(status)) {
        const assets = assetsOf(data);
        if (!assets.length) throw new Error("AutoDL 任务成功但未返回视频地址");
        return assets;
      }
      if (FAILED.has(status)) {
        throw new Error(`AutoDL 生成失败：${errorText(this, result, String(result.msg ?? data.message ?? status))}`);
      }
    }
  },
} satisfies ProviderDefinition<typeof rules>;
