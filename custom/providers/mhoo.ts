const rules = [
  {
    type: "input" as const,
    field: "apiKey" as const,
    title: "API Key",
    value: "",
    props: { type: "password", showPassword: true, autocomplete: "off" },
  },
];

const apiUrl = "https://api.mhoo.cc/v1";
const version = "1.0.0";

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("出图接口响应格式错误");
  return value as Record<string, unknown>;
}

function dataUrl(input: MediaInput) {
  if (input.type === "url") return input.url;
  const data = input.type === "binary" ? Buffer.from(input.data).toString("base64") : input.data;
  return data.startsWith("data:") ? data : `data:${input.mimeType};base64,${data}`;
}

/** 官方三档尺寸，兼容只认 OpenAI 原生尺寸的中转。 */
function officialSize(ratio: string) {
  if (ratio === "9:16" || ratio === "3:4" || ratio === "2:3") return "1024x1536";
  if (ratio === "1:1") return "1024x1024";
  return "1536x1024";
}

/** 按画幅与清晰度换算像素尺寸；长边随 1K/2K 变化。 */
function pixelSize(size: string, ratio: string) {
  const tier = /^2/i.test(size) ? 2048 : /^4/i.test(size) ? 3072 : 1536;
  const table: Record<string, [number, number]> = {
    "1:1": [1, 1],
    "16:9": [16, 9],
    "9:16": [9, 16],
    "4:3": [4, 3],
    "3:4": [3, 4],
    "3:2": [3, 2],
    "2:3": [2, 3],
    "21:9": [21, 9],
  };
  const ratioPair = table[ratio] ?? table["16:9"];
  const scale = tier / Math.max(ratioPair[0], ratioPair[1]);
  const round = (value: number) => Math.max(256, Math.round((value * scale) / 16) * 16);
  return `${round(ratioPair[0])}x${round(ratioPair[1])}`;
}

export default {
  id: "mhoo" as const,
  label: "出图（mhoo）",
  version,
  apiUrl,
  protocol: "openai-completions",
  readme: "## 出图（mhoo 中转）\n\nOpenAI 兼容图片接口，模型 gpt-image-2.5 / gpt-image-2.5-flare。\n\n在「媒体模型」里填入 api.mhoo.cc 的 API Key 即可用于资产图生成。",
  rules,
  models: [
    {
      "id": "gpt-image-2.5",
      "label": "gpt-image-2.5",
      "type": "image",
      "imageSizes": [
        "1K",
        "2K"
      ],
      "imageRatios": [
        "1:1",
        "16:9",
        "9:16",
        "4:3",
        "3:4",
        "3:2",
        "2:3",
        "21:9"
      ],
      "mode": [
        "text"
      ]
    },
    {
      "id": "gpt-image-2.5-flare",
      "label": "gpt-image-2.5-flare",
      "type": "image",
      "imageSizes": [
        "1K",
        "2K"
      ],
      "imageRatios": [
        "1:1",
        "16:9",
        "9:16",
        "4:3",
        "3:4",
        "3:2",
        "2:3",
        "21:9"
      ],
      "mode": [
        "text"
      ]
    },
    {
      "id": "nano-banana-2.1",
      "label": "图像编辑（可加参考图）",
      "type": "image",
      "mode": [
        "multiReference",
        "singleImage"
      ]
    }
  ],
  async generateImage(request: ImageRequest): Promise<MediaAsset[]> {
    const apiKey =
      typeof this.config.apiKey === "string"
        ? this.config.apiKey
            .trim()
            .replace(/^Bearer\s+/i, "")
            .trim()
        : "";
    if (!apiKey) throw new Error("请填写出图（mhoo）API Key");
    // ACT: 单张图最多等待 10 分钟；中转出图通常 30 秒到 3 分钟。
    const signal = AbortSignal.any([AbortSignal.timeout(10 * 60_000), ...(this.signal ? [this.signal] : [])]);
    const images = (request.images ?? []).map(dataUrl);
    const ratio = request.ratio ?? "16:9";
    const base = {
      model: request.model,
      prompt: request.prompt,
      n: 1,
      ...(images.length ? { image: images } : {}),
    };
    const send = async (size: string) => {
      signal.throwIfAborted();
      const response = await this.tool.fetch(`${apiUrl}/images/generations`, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ ...base, size }),
        signal,
      });
      const text = await response.text();
      if (!response.ok) throw new Error(`出图请求失败（HTTP ${response.status}）：${text.slice(0, 300)}`);
      try {
        return object(JSON.parse(text));
      } catch {
        throw new Error(`出图返回内容无法解析：${text.slice(0, 200)}`);
      }
    };
    const wanted = pixelSize(request.size ?? "2K", ratio);
    const fallback = officialSize(ratio);
    let data: Record<string, unknown>;
    try {
      data = await send(wanted);
    } catch (error) {
      // ACT: 中转不一定放开自定义分辨率，失败后退回官方三档重试一次。
      if (wanted === fallback) throw error;
      data = await send(fallback);
    }
    const first = Array.isArray(data.data) ? object(data.data[0]) : undefined;
    if (!first) throw new Error("出图未返回结果");
    if (typeof first.url === "string" && first.url.trim()) {
      return [{ mediaType: "image", type: "url", url: first.url.trim() }];
    }
    if (typeof first.b64_json === "string" && first.b64_json.trim()) {
      return [{ mediaType: "image", type: "base64", mimeType: "image/png", data: first.b64_json.trim() }];
    }
    throw new Error("出图既未返回图片地址，也未返回 base64 数据");
  },
} satisfies ProviderDefinition<typeof rules>;
