# 本机定制功能源码（Local Customizations）

本目录归档的是在这台电脑上的 Toonflow 桌面版（v2.0.9，安装目录 `D:\stable`）中
**新增或修改过的全部功能源码**，从已安装程序中提取。仓库主体的官方源码未做任何改动，
这些定制内容统一放在 `custom/` 下，避免与 `packages/` 的 TypeScript 构建源码冲突。

## 识别方法

安装版里同时存在两套文件：

- `D:\stable\app\Resources\app\` — 官方原版运行时文件（随安装包自带）
- `D:\stable\data\` — 用户数据与自定义扩展目录

把 `data\` 下的每个文件与 `Resources\app\` 中的同名文件做 MD5 比对：
内容不同 = 本机修改过；官方不存在同名文件 = 本机新增。
官方原版自带的 9 个节点、11 个工具、4 个 provider、3 个 skill、5 个 ext 均**未收录**，
它们在仓库 `packages/` 里已有对应源码。

## 清单

### 新增 Provider（3 个，可读 TypeScript 源码）

| 文件 | 功能 |
| --- | --- |
| `providers/autodl.ts` | AutoDL ComfyUI 媒体供应商。支持 17 个模型的出图/出片，含工作流提交、轮询取结果、Token 分组校验，约 23 KB |
| `providers/doubao.ts` | 豆包网页对话媒体供应商。通过本机中继 + 浏览器扩展，把提示词与参考图投递到豆包并自动取回素材 |
| `providers/mhoo.ts` | mhoo 出图供应商，对接 `https://api.mhoo.cc/v1` |

### 新增 Tool（3 个）

| 文件 | 功能 |
| --- | --- |
| `tools/doubaoBridge.tool.js` | 豆包桥接 v1.1.0，含 `doubaoHealth` / `doubaoSubmit` / `doubaoCollect`，启动时自动拉起本地中继 |
| `tools/jianying.tool.js` | 导出剪映草稿 v1.0.0，把画布视频片段按时间线顺序导出为剪映专业版草稿 |
| `tools/mediaGeneration.tool.js` | 媒体生成 v2.0.0，查询已配置模型并生成图片/视频/音频保存进工作区 |

### 修改的节点（1 个）

| 文件 | 说明 |
| --- | --- |
| `nodes/videoGenerationNode.umd.js` | 视频生成节点，与官方原版 MD5 不同，为本机修改版（UMD 编译产物，非 TS 源码） |

### 新增 Skill（1 套）

| 文件 | 说明 |
| --- | --- |
| `skills/h3-prompt-writing/` | MiniMax H3 视频提示词编写技能，覆盖 T2VA / I2VA / FL2VA / L2VA / Ref2VA，含 `SKILL.md`、`agents/openai.yaml` 与两份英文参考语料 |

### 修改的界面（1 个）

| 文件 | 说明 |
| --- | --- |
| `views/mainview/index.html` | 主窗口入口页面，本机做过补丁修改（官方原版同目录留存了多份 `.bak`） |

## 如何还原到另一台机器

把对应文件复制回安装目录即可（Toonflow 运行时动态加载 `data\` 下的扩展）：

```
custom/providers/*  ->  <安装目录>\data\providers\
custom/tools/*      ->  <安装目录>\data\tools\
custom/nodes/*      ->  <安装目录>\data\nodes\
custom/skills/*     ->  <安装目录>\data\skills\
custom/views/*      ->  <安装目录>\app\Resources\app\views\
```

API Key / Token 均在运行时从 `data\settings.json` 读取，源码内**没有硬编码任何密钥**，
还原后需在应用的媒体模型设置里重新填写。

## 未收录的内容（刻意排除）

- `data\settings.json` — 含个人 API Key、Token 与本地配置，不应进入公开仓库
- `data\assets\`、`data\workspaces\`、`data\mediaTasks\` — 约 520 MB 素材、工程与运行数据，不是源码
- 各目录下的 `*.bak` 备份 — 修改过程的历史版本，本机仍保留
- `app\Resources\app\bun\index.js` — 27.5 MB 的编译后主进程 bundle（2026-11-01 从 19.6 MB 被改动到 27.5 MB），
  属于构建产物而非源码；仓库 `apps/desktop`、`packages/*` 中已有对应 TypeScript 源码
- `app\bin\`、`app\Resources\*.dll` 等可执行文件与动态库

---

归档时间：2026-11-09 · 来源版本：Toonflow 2.0.9 (stable)
