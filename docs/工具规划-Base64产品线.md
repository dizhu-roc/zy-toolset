# 工具规划：Base64 产品线

> **范围**：围绕 Base64 **编解码**（及 Data URL）的纯前端能力；含你曾列举的 Text / HTML / CSS / Image / Audio / Video / PDF / File / Hex / URL 等方向。  
> **原则**：算法侧均为「字节 ↔ Base64」；产品侧在 **SEO 与维护成本** 之间取平衡（见 §2）。  
> **状态**：规划文档；**不**绑定当前仓库路由。

---

## 1. 能力与边界（纯前端）

| 维度 | 说明 |
| --- | --- |
| 编码 | `Blob` / `ArrayBuffer` / UTF-8 文本 → Base64；可再包装为 `data:{mime};base64,...`。 |
| 解码 | Base64 / Data URL → 文本预览或触发下载；需校验填充与非法字符。 |
| 大文件 | 视频、大 PDF 受内存与主线程限制；规划上需**明确体积上限**与「可能卡顿」说明。 |
| URL | **字符串转 Base64** 与 **fetch 资源再转 Base64** 是两种产品；后者受 **CORS** 与混合内容限制，须在页面说明。 |
| Hex | 先 hex → bytes，再 Base64；独立价值是「格式桥接」。 |

---

## 2. SEO 与信息架构（slug 策略）

**不推荐**：为「Audio / Video / Image … to Base64」各做一个**正文几乎相同**的独立落地页（易被判定薄内容、关键词内耗）。

**推荐组合**：

| 层级 | 做法 |
| --- | --- |
| **主入口（1～2 个 slug）** | **Base64 工作台**：多 Tab 覆盖「文本」「任意文件」「Hex」「Data URL 解析」等；单页内锚点可辅助 SEO。 |
| **长尾 slug（可选、少而精）** | 仅当某意图搜索量高且**能写独立价值段落**（示例、限制、MIME 表、FAQ 不同）时再拆，例如：`image-to-base64`（与通用文件页 canonical 互指或主次分明）。 |
| **解码** | 与编码对称：同一工作台内 Tab「解码 / Data URL → 文件」；或单独 `base64-decoder` 若已与站内习惯一致。 |

**硬约束**：无实质内容的 slug 不要上线；规划中占位需控制数量，避免大量空壳 URL。

---

## 3. 工具清单（建议 slug 与合并关系）

### 3.1 首推：聚合工作台（P0）

| 规划名 | 建议 slug | 覆盖场景 | 备注 |
| --- | --- | --- | --- |
| Base64 工作台（编码） | `base64-encoder` 或沿用 `text-base64-encoder` 升级为工作台 | 文本、HTML、CSS（UTF-8 文本）、粘贴内容 | 文本类统一为「源码」输入，不必为 HTML/CSS 各一 slug。 |
| Base64 工作台（文件） | `file-to-base64` 或扩展现有 `image-base64-encoder` 为「文件 / Data URL」 | Image / Audio / Video / PDF / 任意文件 | MIME 由文件或用户选择；**一套逻辑**。 |
| Base64 解码 / Data URL | `base64-decoder` 或与上同页 Tab | Base64 → 文本；Data URL → 预览与下载 | 与编码同页或同域内便于切换。 |

### 3.2 独立子能力（P1，仅在内容可差异化时建页）

| 规划名 | 建议 slug | 意图差异 | 与主工作台关系 |
| --- | --- | --- | --- |
| Hex ↔ Base64 | `hex-base64-converter` | Hex 解析规则、错误提示、奇数位处理 | 主工作台可跳转此页或内嵌 Tab。 |
| URL → Base64（字符串） | 可不单独 slug | 与文本相同 | 并入「文本」说明即可。 |
| URL → Base64（拉取资源） | `url-to-base64` | CORS 说明、失败态、仅同源建议 | **独立价值在说明与交互**，非算法；可与文件 Tab 合并并醒目标注限制。 |

### 3.3 你曾列举项 → 映射（不必一页一个）

| 你的想法 | 建议归属 | 说明 |
| --- | --- | --- |
| Text to Base64 | 工作台 · 文本 Tab | 已有能力方向。 |
| HTML / CSS to Base64 | 工作台 · 文本 Tab | 仍属 UTF-8 字节流；可加「语言模式」仅高亮，不增加 slug。 |
| Image / Audio / Video / PDF / File | 工作台 · 文件 Tab | 同一套 FileReader + 编码；MIME 区分。 |
| Hex to Base64 | 独立 Tab 或 P1 子页 | 见上表。 |
| URL to Base64 | 工作台子区 + 文档 | 区分仅编码 URL 字符串 vs fetch body。 |

### 3.4 解码对称（P0～P1）

| 规划名 | 建议 slug | 说明 |
| --- | --- | --- |
| Base64 → 文本 | 工作台 Tab 或 `text-base64-decoder` | Unicode 安全。 |
| Base64 / Data URL → 文件下载 | 工作台 Tab 或 `image-base64-decoder` 扩展 | 与「仅图片」命名若冲突，长期可改名为 `base64-to-file`。 |

### 3.5 可选扩展（P2）

| 规划名 | 建议 slug | 说明 |
| --- | --- | --- |
| Base64URL（JWT 用） | `base64url-tool` 或并入 JWT 工具 | `-_` 字母表、无 padding 变体。 |
| 分行 / PEM 粘贴清理 | 工作台内选项 | 不必独立 slug。 |
| 批量多文件 ZIP 内嵌 | `batch-base64-zip` | 复杂度高，纯前端可做但优先级低。 |

---

## 4. 与站内现有命名的关系（对齐用）

若保留历史 slug，建议在文档层约定：

- `text-base64-encoder` / `text-base64-decoder`：**文本向**主入口或重定向到工作台文本 Tab。  
- `image-base64-encoder` / `image-base64-decoder`：**二进制向**主入口或扩展为文件向；与「仅图片」文案若不一致，后续改版统一品牌表述。

具体是否合并路由，由路由与 SEO（301、canonical）另文定稿。

---

## 5. 验收与文案要点（落地时）

- 每页声明：**默认本地处理、不上传**；大文件风险提示。  
- **URL 拉取**：显著说明 CORS 与失败原因。  
- **解码**：非法 Base64、错误 MIME 的容错提示。

---

文档版本：规划初稿。
