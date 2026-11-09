/*! toonflowTool:{"name":"jianying","version":"1.0.0","displayName":"\u5bfc\u51fa\u526a\u6620\u8349\u7a3f","description":"\u628a\u753b\u5e03\u4e0a\u7684\u89c6\u9891\u7247\u6bb5\u6309\u987a\u5e8f\u5bfc\u51fa\u4e3a\u526a\u6620\u4e13\u4e1a\u7248\u8349\u7a3f\uff0c\u6253\u5f00\u526a\u6620\u5373\u53ef\u7ee7\u7eed\u526a\u8f91\u3002","prompt":"\u9700\u8981\u628a\u89c6\u9891\u4ea4\u7ed9\u7528\u6237\u5728\u526a\u6620\u91cc\u4e8c\u6b21\u526a\u8f91\u65f6\u4f7f\u7528\u672c\u5de5\u5177\u3002\n\u4f20\u5165\u7684\u89c6\u9891\u6309\u6570\u7ec4\u987a\u5e8f\u94fa\u5728\u65f6\u95f4\u7ebf\u4e0a\uff0c\u987a\u5e8f\u5373\u6700\u7ec8\u526a\u8f91\u987a\u5e8f\uff1b\u5148\u4e0e\u7528\u6237\u786e\u8ba4\u987a\u5e8f\u518d\u8c03\u7528\u3002\nurl \u53ef\u4ee5\u662f\u753b\u5e03\u7d20\u6750\u7684\u76f8\u5bf9\u5730\u5740\uff08\u5982 assets/<\u8282\u70b9ID>/xxx.mp4\uff09\uff0c\u4e5f\u53ef\u4ee5\u662f\u672c\u673a\u7edd\u5bf9\u8def\u5f84\u3002\n\u751f\u6210\u540e\u8349\u7a3f\u51fa\u73b0\u5728\u526a\u6620\u300c\u8349\u7a3f\u300d\u5217\u8868\u91cc\uff0c\u7528\u6237\u6253\u5f00\u5373\u53ef\u770b\u5230\u5168\u90e8\u7247\u6bb5\uff0c\u65e0\u9700\u624b\u52a8\u62d6\u5165\u65f6\u95f4\u7ebf\u3002\n\u4e0d\u8981\u7528\u5b83\u751f\u6210\u6700\u7ec8\u6210\u7247\uff0c\u672c\u5de5\u5177\u53ea\u4ea7\u51fa\u53ef\u7f16\u8f91\u7684\u5de5\u7a0b\u6587\u4ef6\u3002","readme":"# \u5bfc\u51fa\u526a\u6620\u8349\u7a3f\r\n\r\n\u628a\u591a\u4e2a\u89c6\u9891\u6309\u987a\u5e8f\u5199\u6210\u4e00\u4e2a\u526a\u6620\u4e13\u4e1a\u7248\u8349\u7a3f\u3002\r\n\r\n## \u7528\u6cd5\r\n\r\n\u544a\u8bc9 Agent\u300c\u628a\u8fd9\u51e0\u6bb5\u89c6\u9891\u5bfc\u51fa\u5230\u526a\u6620\u8349\u7a3f\u300d\uff0c\u6216\u5728\u753b\u5e03\u6846\u9009\u89c6\u9891\u540e\u70b9\u51fb\u5bfc\u51fa\u6309\u94ae\u3002\r\n\u89c6\u9891\u4f1a\u6309\u4f60\u7ed9\u7684\u987a\u5e8f\u94fa\u5728\u540c\u4e00\u6761\u65f6\u95f4\u7ebf\u4e0a\uff0c\u8349\u7a3f\u540d\u53ef\u81ea\u5b9a\u4e49\u3002\r\n\r\n## \u8bf4\u660e\r\n\r\n- \u8349\u7a3f\u5199\u5230\u672c\u673a\u526a\u6620\u7684\u8349\u7a3f\u76ee\u5f55\uff08\u9ed8\u8ba4 `D:/JianyingPro/Drafts`\uff09\uff0c\u6253\u5f00\u526a\u6620\u5373\u53ef\u770b\u5230\u3002\r\n- \u7d20\u6750\u4ee5\u7edd\u5bf9\u8def\u5f84\u5f15\u7528\uff1b\u79fb\u52a8\u6216\u5220\u9664\u6e90\u89c6\u9891\u4f1a\u5bfc\u81f4\u8349\u7a3f\u5931\u6548\u3002\r\n- \u4ec5\u652f\u6301\u672a\u52a0\u5bc6\u8349\u7a3f\u7684\u526a\u6620\u7248\u672c\uff089.x \u660e\u6587 JSON\uff09\u3002\r\n","components":[],"author":"local","github":"","configRules":[]} */

// @bun
import { z } from "toonflow:tool-zod";
import fs from "node:fs";
import path from "node:path";

const SKEL = {"canvas_config":{"height":1080,"ratio":"original","width":1920},"color_space":0,"config":{"adjust_max_index":1,"attachment_info":[],"combination_max_index":1,"export_range":null,"extract_audio_last_index":1,"lyrics_recognition_id":"","lyrics_sync":true,"lyrics_taskinfo":[],"maintrack_adsorb":true,"material_save_mode":0,"multi_language_current":"none","multi_language_list":[],"multi_language_main":"none","multi_language_mode":"none","original_sound_last_index":1,"record_audio_last_index":1,"sticker_max_index":1,"subtitle_keywords_config":null,"subtitle_recognition_id":"","subtitle_sync":true,"subtitle_taskinfo":[],"system_font_list":[],"video_mute":false,"zoom_info_params":null},"cover":null,"create_time":0,"duration":0,"extra_info":null,"fps":30.0,"free_render_index_mode_on":false,"group_container":null,"id":"91E08AC5-22FB-47e2-9AA0-7DC300FAEA2B","keyframe_graph_list":[],"keyframes":{"adjusts":[],"audios":[],"effects":[],"filters":[],"handwrites":[],"stickers":[],"texts":[],"videos":[]},"last_modified_platform":{"app_id":3704,"app_source":"lv","app_version":"5.9.0","os":"windows"},"platform":{"app_id":3704,"app_source":"lv","app_version":"5.9.0","os":"windows"},"materials":{"ai_translates":[],"audio_balances":[],"audio_effects":[],"audio_fades":[],"audio_track_indexes":[],"audios":[],"beats":[],"canvases":[],"chromas":[],"color_curves":[],"digital_humans":[],"drafts":[],"effects":[],"flowers":[],"green_screens":[],"handwrites":[],"hsl":[],"images":[],"log_color_wheels":[],"loudnesses":[],"manual_deformations":[],"masks":[],"material_animations":[],"material_colors":[],"multi_language_refs":[],"placeholders":[],"plugin_effects":[],"primary_color_wheels":[],"realtime_denoises":[],"shapes":[],"smart_crops":[],"smart_relights":[],"sound_channel_mappings":[],"speeds":[],"stickers":[],"tail_leaders":[],"text_templates":[],"texts":[],"time_marks":[],"transitions":[],"video_effects":[],"video_trackings":[],"videos":[],"vocal_beautifys":[],"vocal_separations":[]},"mutable_config":null,"name":"","new_version":"110.0.0","relationships":[],"render_index_track_mode_on":false,"retouch_cover":null,"source":"default","static_cover_image_path":"","time_marks":null,"tracks":[],"update_time":0,"version":360000};
const META_TPL = {"cloud_package_completed_time":"","draft_cloud_capcut_purchase_info":"","draft_cloud_last_action_download":false,"draft_cloud_materials":[],"draft_cloud_purchase_info":"","draft_cloud_template_id":"","draft_cloud_tutorial_info":"","draft_cloud_videocut_purchase_info":"","draft_cover":"","draft_deeplink_url":"","draft_enterprise_info":{"draft_enterprise_extra":"","draft_enterprise_id":"","draft_enterprise_name":"","enterprise_material":[]},"draft_fold_path":"","draft_id":"BC69C7CD-7C5E-4185-B284-AF3E1047A664","draft_is_ai_packaging_used":false,"draft_is_ai_shorts":false,"draft_is_ai_translate":false,"draft_is_article_video_draft":false,"draft_is_from_deeplink":"false","draft_is_invisible":false,"draft_materials":[{"type":0,"value":[]},{"type":1,"value":[]},{"type":2,"value":[]},{"type":3,"value":[]},{"type":6,"value":[]},{"type":7,"value":[]},{"type":8,"value":[]}],"draft_materials_copied_info":[],"draft_name":"","draft_new_version":"","draft_removable_storage_device":"","draft_root_path":"","draft_segment_extra_info":[],"draft_type":"","tm_draft_cloud_completed":"","tm_draft_cloud_modified":0,"tm_draft_removed":0,"tm_duration":0};
const PROTO = null; // 已废弃：素材/片段改为按标准结构现构造

// ACT: ffprobe 跟随插件所在的数据目录，整个应用目录搬走后依然可用。
const DATA_DIR = (() => {
  try { return path.resolve(import.meta.dir, ".."); } catch (_) { return "D:/stable/data"; }
})();
const FFPROBE = (() => {
  const candidates = [path.join(DATA_DIR, "ffmpeg", "win32-x64", "ffprobe.exe"), "D:/stable/data/ffmpeg/win32-x64/ffprobe.exe"];
  for (const c of candidates) if (fs.existsSync(c)) return c;
  return candidates[0];
})();
const DEFAULT_ROOT = "D:/JianyingPro/Drafts";

// 读取剪映「设置 → 草稿位置」里的真实目录。
// 剪映重装或用户改过草稿位置后自动跟随，读不到才退回 DEFAULT_ROOT。
function jianyingDraftRoot() {
  try {
    const localApp = process.env.LOCALAPPDATA || ((process.env.USERPROFILE || "C:/Users/Administrator") + "/AppData/Local");
    const ini = path.join(localApp, "JianyingPro", "User Data", "Config", "globalSetting");
    if (fs.existsSync(ini)) {
      const s = fs.readFileSync(ini, "utf8");
      const m = s.match(/^currentCustomDraftPath=(.*)$/m);
      if (m && m[1].trim()) {
        const p = m[1].trim().replace(/\\\\/g, "\\");
        if (p) {
          fs.mkdirSync(p, { recursive: true });
          return p;
        }
      }
    }
  } catch (_) {}
  return DEFAULT_ROOT;
}

const CANVAS_PRESETS = {
  "9:16": [1080, 1920],
  "16:9": [1920, 1080],
  "1:1": [1080, 1080],
  "3:4": [1080, 1440],
  "4:3": [1440, 1080],
};

const isObj = (v) => v && typeof v === "object" && !Array.isArray(v);
const clone = (v) => JSON.parse(JSON.stringify(v));
const nid = () => crypto.randomUUID().toUpperCase();
const oid = () => crypto.randomUUID().replace(/-/g, "");

function probe(file) {
  const p = Bun.spawnSync([
    FFPROBE, "-v", "error", "-print_format", "json",
    "-show_format", "-show_streams", file,
  ]);
  if (p.exitCode !== 0) throw new Error("无法读取视频：" + file);
  const info = JSON.parse(p.stdout.toString() || "{}");
  const dur = Number(info.format?.duration || 0);
  let w = 0, h = 0, fps = 0, hasAudio = false;
  for (const s of info.streams || []) {
    if (s.codec_type === "video" && !w) {
      w = Number(s.width) || 0;
      h = Number(s.height) || 0;
      const [n, d] = String(s.avg_frame_rate || "0/1").split("/");
      fps = Number(n) / Number(d || 1) || 0;
    } else if (s.codec_type === "audio") {
      hasAudio = true;
    }
  }
  return {
    durationUs: Math.max(1, Math.round(dur * 1e6)),
    width: w, height: h, fps: fps || 30, hasAudio,
    durationS: dur, size: Number(info.format?.size || 0),
  };
}

function guessRatio(w, h) {
  if (!w || !h) return "9:16";
  const r = w / h;
  let best = "9:16", bd = 9;
  for (const [k, [cw, ch]] of Object.entries(CANVAS_PRESETS)) {
    const d = Math.abs(r - cw / ch);
    if (d < bd) { best = k; bd = d; }
  }
  return bd < 0.06 ? best : "auto";
}

// 把画布相对地址解析成本机绝对路径
function resolveFile(url, cwd) {
  let u = String(url || "").trim();
  if (!u) throw new Error("视频地址为空");
  if (/^file:\/\//i.test(u)) u = decodeURIComponent(u.replace(/^file:\/\//i, ""));
  if (/^[a-zA-Z]:[\\/]/.test(u)) return u.replace(/\//g, "\\");
  const rel = u.replace(/^\.?\//, "");
  const base = cwd || "";
  const cand = path.isAbsolute(rel) ? rel : path.join(base, rel);
  if (fs.existsSync(cand)) return cand;
  // 退化：按 assets/<id>/<file> 结构在当前工作区里找
  const alt = path.join(base, "assets", rel);
  if (fs.existsSync(alt)) return alt;
  return cand;
}

// 从画布节点收集视频地址：优先 nodeIds，其次画布选中的节点
async function collectUrls(args, canvas, signal) {
  if (Array.isArray(args.urls) && args.urls.length) return args.urls;
  if (!canvas) throw new Error("\u753B\u5E03\u4E0D\u53EF\u7528\uFF0C\u8BF7\u76F4\u63A5\u4F20\u5165\u89C6\u9891\u5730\u5740");
  let ids = Array.isArray(args.nodeIds) ? args.nodeIds.slice() : [];
  const nodes = [];
  if (ids.length) {
    const r = await canvas.call({ name: "getCanvasNodes", args: { nodeIds: ids, fields: ["outputs"] } }, signal);
    nodes.push(...(r?.nodes || []));
  } else if (args.selectedOnly) {
    const r = await canvas.call({ name: "findCanvasNodes", args: { selectedOnly: true } }, signal);
    const found = r?.nodes || [];
    ids = found.map((n) => n.id);
    if (ids.length) {
      const r2 = await canvas.call({ name: "getCanvasNodes", args: { nodeIds: ids, fields: ["outputs"] } }, signal);
      nodes.push(...(r2?.nodes || []));
    }
  } else {
    throw new Error("\u8BF7\u5148\u5728\u753B\u5E03\u4E0A\u6846\u9009\u89C6\u9891\u8282\u70B9\uFF0C\u6216\u4F20\u5165 nodeIds");
  }
  const list = [];
  for (const n of nodes) {
    const v = n?.outputs?.video?.value;
    const url = typeof v === "string" ? v : v?.url;
    if (url) list.push({ url, label: n.label || n.id, pos: n.position || { x: 0, y: 0 } });
  }
  if (!list.length) throw new Error("\u9009\u4E2D\u7684\u8282\u70B9\u91CC\u6CA1\u6709\u5DF2\u751F\u6210\u7684\u89C6\u9891");
  // 顺序：若 label 带“片段NN”按编号，否则按画布位置（上→下、左→右）
  const num = (s) => {
    const m = String(s || "").match(/(?:片段|\u7247\u6BB5)\s*0*(\d{1,3})/);
    return m ? Number(m[1]) : NaN;
  };
  const allNum = list.every((i) => !Number.isNaN(num(i.label)));
  if (allNum) list.sort((a, b) => num(a.label) - num(b.label));
  else list.sort((a, b) => (a.pos.y - b.pos.y) || (a.pos.x - b.pos.x));
  return list.map((i) => i.url);
}

// \u628A\u8349\u7A3F\u767B\u8BB0\u5230\u526A\u6620\u8349\u7A3F\u7D22\u5F15\uFF0C\u5426\u5219\u91CD\u542F\u540E\u5217\u8868\u91CC\u770B\u4E0D\u5230
function registerDraft(folder, name, meta) {
  try {
    const idx = path.join(jianyingDraftRoot(), "root_meta_info.json");
    if (!fs.existsSync(idx)) return false;
    const db = JSON.parse(fs.readFileSync(idx, "utf8"));
    let store = Array.isArray(db.all_draft_store) ? db.all_draft_store : [];
    store = store.filter((e) => e && e.draft_fold_path && fs.existsSync(e.draft_fold_path));
    const f = folder.replace(/\\/g, "/");
    const entry = {
      cloud_draft_cover: false, cloud_draft_sync: false,
      draft_cloud_last_action_download: false,
      draft_cloud_purchase_info: "", draft_cloud_template_id: "",
      draft_cloud_tutorial_info: "", draft_cloud_videocut_purchase_info: "",
      draft_cover: f + "/draft_cover.jpg",
      draft_fold_path: f,
      draft_id: meta.draft_id,
      draft_is_ai_shorts: false, draft_is_cloud_temp_draft: false,
      draft_is_invisible: false, draft_is_web_article_video: false,
      draft_json_file: f + "/draft_content.json",
      draft_name: name, draft_new_version: "",
      draft_root_path: String(meta.draft_root_path || "").replace(/\\/g, "/"),
      draft_timeline_materials_size: meta.draft_timeline_materials_size_ || 0,
      draft_type: "", draft_web_article_video_enter_from: "",
      streaming_edit_draft_ready: true,
      tm_draft_cloud_completed: "", tm_draft_cloud_entry_id: -1,
      tm_draft_cloud_modified: 0, tm_draft_cloud_parent_entry_id: -1,
      tm_draft_cloud_space_id: -1, tm_draft_cloud_user_id: -1,
      tm_draft_create: meta.tm_draft_create,
      tm_draft_modified: meta.tm_draft_modified,
      tm_draft_removed: 0,
      tm_duration: meta.tm_duration || 0,
    };
    store = store.filter((e) => e.draft_fold_path !== f);
    store.push(entry);
    db.all_draft_store = store;
    db.draft_ids = store.length;
    fs.writeFileSync(idx, JSON.stringify(db));
    return true;
  } catch (e) {
    return false;
  }
}

function buildDraft(items, opts) {
  const cwd = opts.cwd || "";
  const root = opts.root || jianyingDraftRoot();
  const files = items.map((it) => ({ ...it, abs: resolveFile(it.url, cwd) }));
  for (const f of files) {
    if (!fs.existsSync(f.abs)) throw new Error("找不到视频文件：" + f.abs);
  }
  const infos = files.map((f) => ({ ...f, ...probe(f.abs) }));

  let ratio = opts.ratio && opts.ratio !== "auto" ? opts.ratio : guessRatio(infos[0].width, infos[0].height);
  const [cw, ch] = CANVAS_PRESETS[ratio] || [infos[0].width || 1080, infos[0].height || 1920];
  const fpsSet = new Set(infos.map((i) => i.fps.toFixed(2)));
  const fps = fpsSet.size === 1 ? Number([...fpsSet][0]) : 30;

  const timelineId = nid();
  const nowUs = Date.now() * 1000;

  const mats = { videos: [], speeds: [] };
  const segments = [];
  let cursor = 0;

  infos.forEach((i, idx) => {
    // 视频素材：字段集与剪映自己写入的完全一致（不写 has_audio / has_sound_separated）
    const mid = oid();
    const v = {
      audio_fade: null,
      category_id: "",
      category_name: "local",
      check_flag: 63487,
      crop: {
        upper_left_x: 0.0, upper_left_y: 0.0,
        upper_right_x: 1.0, upper_right_y: 0.0,
        lower_left_x: 0.0, lower_left_y: 1.0,
        lower_right_x: 1.0, lower_right_y: 1.0,
      },
      crop_ratio: "free",
      crop_scale: 1.0,
      duration: i.durationUs,
      height: i.height,
      id: mid,
      local_material_id: "",
      material_id: mid,
      material_name: path.basename(i.abs),
      media_path: "",
      path: i.abs,
      type: "video",
      width: i.width,
    };
    mats.videos.push(v);

    const spd = { curve_speed: null, id: oid(), mode: 0, speed: 1.0, type: "speed" };
    mats.speeds.push(spd);

    const frames = Math.max(1, Math.round((i.durationUs * fps) / 1e6));
    const durUs = Math.round((frames / fps) * 1e6);

    const s = {
      enable_adjust: true,
      enable_color_correct_adjust: false,
      enable_color_curves: true,
      enable_color_match_adjust: false,
      enable_color_wheels: true,
      enable_lut: true,
      enable_smart_color_adjust: false,
      last_nonzero_volume: 1.0,
      reverse: false,
      track_attribute: 0,
      track_render_index: 0,
      visible: true,
      id: oid(),
      material_id: v.id,
      target_timerange: { start: cursor, duration: durUs },
      common_keyframes: [],
      keyframe_refs: [],
      source_timerange: { start: 0, duration: i.durationUs },
      speed: 1.0,
      volume: i.hasAudio ? 1.0 : 0.0,
      extra_material_refs: [spd.id],
      is_tone_modify: false,
      clip: {
        alpha: 1.0,
        flip: { horizontal: false, vertical: false },
        rotation: 0.0,
        scale: { x: 1.0, y: 1.0 },
        transform: { x: 0.0, y: 0.0 },
      },
      uniform_scale: { on: true, value: 1.0 },
      hdr_settings: { intensity: 1.0, mode: 1, nits: 1000 },
      render_index: idx,
    };
    segments.push(s);
    cursor += durUs;
  });

  const d = clone(SKEL);
  d.id = timelineId;
  d.duration = cursor;
  d.fps = fps;
  d.canvas_config = { ratio: ratio in CANVAS_PRESETS ? ratio : "original", width: cw, height: ch };
  d.name = "";
  d.tracks = [{
    attribute: 0, flag: 0, id: oid(),
    is_default_name: false, name: "main", type: "video",
    segments: segments,
  }];
  for (const k of Object.keys(d.materials)) d.materials[k] = [];
  d.materials.videos = mats.videos;
  d.materials.speeds = mats.speeds;

  const baseName = String(opts.draftName || "").trim() ||
    new Date().toISOString().slice(5, 16).replace(/[-:T]/g, "").replace(/(\d{4})(\d{2})/, "$1_$2");
  fs.mkdirSync(root, { recursive: true });
  let name = baseName, k = 2;
  while (fs.existsSync(path.join(root, name))) { name = baseName + " (" + k + ")"; k++; }
  const folder = path.join(root, name);
  fs.mkdirSync(path.join(folder, "Timelines", timelineId), { recursive: true });
  fs.mkdirSync(path.join(folder, "Timelines", timelineId, "common_attachment"), { recursive: true });

  const raw = JSON.stringify(d);
  fs.writeFileSync(path.join(folder, "draft_content.json"), raw);
  fs.writeFileSync(path.join(folder, "draft_content.json.bak"), raw);
  fs.writeFileSync(path.join(folder, "Timelines", timelineId, "draft_content.json"), raw);

  fs.writeFileSync(path.join(folder, "Timelines", "project.json"), JSON.stringify({
    config: { color_space: -1, hdr_vivid: false, mixed_track_mode_on: false, render_index_track_mode_on: false, use_float_render: false },
    create_time: nowUs, id: nid(), main_timeline_id: timelineId,
    timelines: [{ create_time: nowUs, id: timelineId, is_marked_delete: false, name: "\u65F6\u95F4\u7EBF01", update_time: nowUs }],
    update_time: nowUs, version: 0,
  }));

  const metaTpl = clone(META_TPL);
  const folderSlash = folder.replace(/\\/g, "/");
  const meta = Object.assign(metaTpl, {
    draft_name: name,
    draft_fold_path: folderSlash,
    draft_json_file: folderSlash + "/draft_content.json",
    draft_id: nid(),
    draft_root_path: root.replace(/\\/g, "/"),
    draft_cover: "draft_cover.jpg",
    draft_removable_storage_device: (root.match(/^[a-zA-Z]:/) || ["C:"])[0],
    tm_duration: cursor,
    tm_draft_create: nowUs,
    tm_draft_modified: nowUs,
    draft_materials_copied_info: [],
    draft_timeline_materials_size_: infos.reduce((a, b) => a + b.size, 0),
    draft_need_rename_folder: false,
    draft_new_version: "",
  });
  fs.writeFileSync(path.join(folder, "draft_meta_info.json"), JSON.stringify(meta));

  const sec = Math.floor(nowUs / 1e6);
  fs.writeFileSync(path.join(folder, "draft_settings"),
    "[General]\ndraft_create_time=" + sec + "\ndraft_last_edit_time=" + sec + "\nreal_edit_seconds=1\nreal_edit_keys=1\n");
  fs.writeFileSync(path.join(folder, "draft_virtual_store.json"), JSON.stringify({ draft_materials: [], draft_virtual_store: [] }));
  fs.writeFileSync(path.join(folder, "draft_agency_config.json"), JSON.stringify({
    is_auto_agency_enabled: false, is_auto_agency_popup: false, is_single_agency_mode: false,
    marterials: null, use_converter: false, video_resolution: 720,
  }));
  fs.writeFileSync(path.join(folder, "attachment_pc_common.json"), JSON.stringify({
    ai_packaging_infos: [], ai_packaging_report_info: { caption_id_list: [], commercial_material: "", material_source: "", method: "", page_from: "", style: "", task_id: "", text_style: "", tos_id: "", video_category: "" },
    broll: { ai_packaging_infos: [], ai_packaging_report_info: { caption_id_list: [], commercial_material: "", material_source: "", method: "", page_from: "", style: "", task_id: "", text_style: "", tos_id: "", video_category: "" } },
    commercial_music_category_ids: [], pc_feature_flag: 0, recognize_tasks: [],
    reference_lines_config: { horizontal_lines: [], is_lock: false, is_visible: false, vertical_lines: [] },
    safe_area_type: 0, template_item_infos: [], unlock_template_ids: [],
  }));
  fs.writeFileSync(path.join(folder, "timeline_layout.json"), JSON.stringify({
    dockItems: [{ dockIndex: 0, ratio: 1, timelineIds: [timelineId], timelineNames: ["\u65F6\u95F4\u7EBF01"] }], layoutOrientation: 1,
  }));

  // 封面：抽首帧
  try {
    Bun.spawnSync([
      path.join(DATA_DIR, "ffmpeg", "win32-x64", "ffmpeg.exe"), "-y", "-v", "error",
      "-ss", "1", "-i", infos[0].abs, "-frames:v", "1", "-vf", "scale=360:-1",
      "-q:v", "4", path.join(folder, "draft_cover.jpg"),
    ]);
  } catch (_) {}

  try { registerDraft(folder, name, meta); } catch (_) {}

  return { folder, name, ratio, fps, count: infos.length, durationS: cursor / 1e6 };
}

const paramSchema = z.object({
  nodeIds: z.array(z.string().min(1).max(96)).max(200).optional().describe("\u8981\u5BFC\u51FA\u7684\u753B\u5E03\u8282\u70B9 ID\uFF0C\u6309\u4F20\u5165\u987A\u5E8F\u5EFA\u7ACB\u65F6\u95F4\u7EBF"),
  selectedOnly: z.boolean().optional().describe("\u5BFC\u51FA\u753B\u5E03\u4E0A\u5F53\u524D\u9009\u4E2D\u7684\u89C6\u9891\u8282\u70B9"),
  urls: z.array(z.string().min(1).max(2048)).max(200).optional().describe("\u76F4\u63A5\u6307\u5B9A\u89C6\u9891\u5730\u5740\uFF0C\u6309\u65F6\u95F4\u7EBF\u987A\u5E8F\uFF1B\u53EF\u4E3A\u753B\u5E03\u76F8\u5BF9\u5730\u5740\u6216\u672C\u673A\u7EDD\u5BF9\u8DEF\u5F84"),
  draftName: z.string().max(64).optional().describe("\u8349\u7A3F\u540D\uFF0C\u9ED8\u8BA4\u7528\u5F53\u524D\u65F6\u95F4"),
  ratio: z.enum(["auto", "9:16", "16:9", "1:1", "3:4", "4:3"]).optional().describe("\u753B\u5E45\uFF0Cauto \u8868\u793A\u8DDF\u968F\u9996\u6BB5\u89C6\u9891"),
  root: z.string().max(512).optional().describe("剪映草稿根目录，默认跟随剪映「设置→草稿位置」，读不到时用 D:/JianyingPro/Drafts"),
}).strict();

// ---------- 给界面按钮用的本地端点 ----------
const JY_PORT = 10597;

function findRuntime() {
  // ACT: 插件自身所在的数据目录优先，整套目录搬走后依然能找到运行时。
  const dirs = [DATA_DIR, "D:/stable/data", "C:/stable/data"];
  const found = [];
  for (const d of dirs) {
    try {
      for (const f of fs.readdirSync(d)) {
        if (!/^mcpRuntime\d+\.json$/.test(f)) continue;
        const p = path.join(d, f);
        const j = JSON.parse(fs.readFileSync(p, "utf8"));
        if (j && j.url && j.token) found.push({ ...j, mtime: fs.statSync(p).mtimeMs });
      }
    } catch (_) {}
  }
  // ACT: 多次启动会留下多个运行时文件，取最近修改的那个，避免连到已退出的端口。
  found.sort((a, b) => b.mtime - a.mtime);
  return found[0] || null;
}

async function callMcp(name, args, directory) {
  const rt = findRuntime();
  if (!rt) throw new Error("\u672A\u627E\u5230 MCP \u8FD0\u884C\u4FE1\u606F\uFF0C\u8BF7\u5728\u8BBE\u7F6E\u2192MCP \u4E2D\u5F00\u542F\u670D\u52A1");
  const base = { "Content-Type": "application/json", "Accept": "application/json, text/event-stream", Authorization: "Bearer " + rt.token };
  const initRes = await fetch(rt.url, {
    method: "POST", headers: base,
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "jy-ui", version: "1.0" } } }),
  });
  const sid = initRes.headers.get("mcp-session-id");
  const callRes = await fetch(rt.url, {
    method: "POST", headers: sid ? { ...base, "mcp-session-id": sid } : base,
    // ACT: MCP 工具靠 target.directory 定位工作区与画布连接，界面上直接导出时由界面传入。
    body: JSON.stringify({ jsonrpc: "2.0", id: 2, method: "tools/call", params: { name, arguments: { target: directory ? { directory } : {}, args } } }),
  });
  const text = await callRes.text();
  let payload = null;
  for (const line of text.split(/\r?\n/)) {
    if (line.startsWith("data: ")) { try { payload = JSON.parse(line.slice(6)); } catch (_) {} }
  }
  if (!payload) { try { payload = JSON.parse(text); } catch (_) { payload = null; } }
  if (!payload) throw new Error("\u8FD4\u56DE\u65E0\u6CD5\u89E3\u6790");
  if (payload.error) throw new Error(payload.error.message || "\u8C03\u7528\u5931\u8D25");
  const r = payload.result || {};
  const plain = (r.content || []).filter((c) => c.type === "text").map((c) => c.text).join("");
  // ACT: 工具执行失败时 MCP 会用 isError + 文本回传，这里要当成失败抛出，别把错误当成结果。
  if (r.isError) throw new Error(plain.replace(/^导出失败：/, "") || "导出失败");
  if (r.structuredContent) return r.structuredContent;
  const t = plain;
  try { return JSON.parse(t); } catch (_) { return { text: t }; }
}

// ACT: 先按界面传来的工作目录定位画布；目录对不上时退回「当前唯一的 Toonflow 页面」。
async function callExport(body) {
  const args = {
    selectedOnly: body.selectedOnly !== false,
    nodeIds: body.nodeIds,
    draftName: body.draftName,
    ratio: body.ratio || "auto",
    root: body.root,
  };
  const attempts = body.directory ? [body.directory, undefined] : [undefined];
  let last = null;
  for (const directory of attempts) {
    try {
      const r = await callMcp("jianying", args, directory);
      const details = r && r.details ? r.details : null;
      if (details && details.error) { if (!last) last = new Error(details.error); continue; }
      const text = String((r && r.text) || "");
      if (text.indexOf("导出失败") === 0) { if (!last) last = new Error(text.replace(/^导出失败：/, "")); continue; }
      return r;
    } catch (e) { if (!last) last = e; }
  }
  throw last || new Error("导出失败");
}

function ensureEndpoint() {
  if (globalThis.__jyEndpoint || typeof Bun === "undefined" || !Bun.serve) return;
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "content-type",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    "Content-Type": "application/json; charset=utf-8",
  };
  try {
    globalThis.__jyEndpoint = Bun.serve({
      port: JY_PORT,
      hostname: "127.0.0.1",
      async fetch(req) {
        if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
        const u = new URL(req.url);
        if (u.pathname === "/ping") return new Response(JSON.stringify({ ok: true, port: JY_PORT }), { headers: cors });
        if (u.pathname !== "/export") return new Response(JSON.stringify({ ok: false, error: "not found" }), { status: 404, headers: cors });
        let body = {};
        try { body = await req.json(); } catch (_) {}
        try {
          const r = await callExport(body);
          return new Response(JSON.stringify({ ok: true, result: r }), { headers: cors });
        } catch (e) {
          return new Response(JSON.stringify({ ok: false, error: e && e.message ? e.message : String(e) }), { headers: cors });
        }
      },
    });
  } catch (e) {
    globalThis.__jyEndpointError = e && e.message ? e.message : String(e);
  }
}

ensureEndpoint();

const cfgSchema = z.object({}).strict();

export default {
  validateConfig(config) {
    cfgSchema.parse(config || {});
    return {};
  },
  createTools({ config, cwd, canvas }) {
    cfgSchema.parse(config || {});
    return [
      {
        name: "jianying",
        label: "\u5BFC\u51FA\u526A\u6620\u8349\u7A3F",
        description: "\u628A\u591A\u4E2A\u89C6\u9891\u6309\u987A\u5E8F\u5199\u6210\u4E00\u4E2A\u526A\u6620\u4E13\u4E1A\u7248\u8349\u7A3F\uFF0C\u6253\u5F00\u526A\u6620\u5373\u53EF\u5728\u65F6\u95F4\u7EBF\u4E0A\u770B\u5230\u5168\u90E8\u7247\u6BB5\u3002",
        promptSnippet: "\u628A\u9009\u4E2D\u7684\u89C6\u9891\u7247\u6BB5\u5BFC\u51FA\u4E3A\u53EF\u7F16\u8F91\u7684\u526A\u6620\u8349\u7A3F\u3002",
        promptGuidelines: [
          "\u4F18\u5148\u7528 selectedOnly \u5BFC\u51FA\u7528\u6237\u6846\u9009\u7684\u8282\u70B9\uFF1B\u8DE8\u5EA7\u6807\u4E0D\u53EF\u9760\u65F6\u7528 nodeIds \u6309\u7528\u6237\u786E\u8BA4\u7684\u987A\u5E8F\u4F20\u5165\u3002",
          "urls \u4F18\u5148\u4F20\u8282\u70B9\u8F93\u51FA\u91CC\u7684\u76F8\u5BF9\u5730\u5740\uFF08assets/...\uFF09\uFF0C\u4E5F\u53EF\u4F20\u7EDD\u5BF9\u8DEF\u5F84\u3002",
        ],
        parameters: z.toJSONSchema(paramSchema, { io: "input", target: "draft-07" }),
        executionMode: "sequential",
        async execute(callId, rawArgs, signal) {
          signal?.throwIfAborted?.();
          const args = paramSchema.parse(rawArgs || {});
          const dir = cwd || "";
          try {
            const urls = await collectUrls(args, canvas, signal);
            const r = buildDraft(urls.map((u) => ({ url: u })), {
              cwd: dir,
              root: args.root || DEFAULT_ROOT,
              draftName: args.draftName,
              ratio: args.ratio || "auto",
            });
            const text = "\u5DF2\u5BFC\u51FA\u526A\u6620\u8349\u7A3F\uFF1A" + r.name +
              "\uFF08" + r.count + "\u6BB5 / " + r.durationS.toFixed(2) + "s / " + r.ratio +
              "\uFF09\n\u76EE\u5F55\uFF1A" + r.folder + "\n\u6253\u5F00\u526A\u6620\u4E13\u4E1A\u7248\uFF0C\u5728\u8349\u7A3F\u5217\u8868\u91CC\u5373\u53EF\u770B\u5230\u3002";
            return { content: [{ type: "text", text }], details: r };
          } catch (e) {
            const msg = e && e.message ? e.message : String(e);
            return { content: [{ type: "text", text: "\u5BFC\u51FA\u5931\u8D25\uFF1A" + msg }], details: { error: msg }, isError: true };
          }
        },
      },
    ];
  },
};
