# 工具规划：JSON 工具产品线

> **范围**：围绕 **JSON 的编辑、格式化、校验、压缩、与异构格式互转、以及「造数据 / 假接口」** 的一整条能力线；**不**假设与当前站内任何具体路由一致。  
> **原则**：先按**用户任务**分层，再决定「单页多 Tab」还是「多 slug」；大文档需 **体积上限、Worker、流式** 等策略说明。  
> **状态**：规划文档。

---

## 1. 竞品与能力地图（检索摘要，2026）

下列为国际市场常见形态，用于**校准**「JSON 工具」应覆盖哪些层级，而非照搬某一家的功能清单。

### 1.1 编辑 / 格式化 / 校验

| 参考对象 | URL（公开入口） | 典型能力 |
| --- | --- | --- |
| JSON Editor Online | https://jsoneditoronline.org/ | 文本 / 树 / 表视图、校验、Schema、对比、查询类能力，**重编辑与协作心智** |
| JSONFormatter.org | https://jsonformatter.org/ | 美化、压缩、校验、多格式互转（XML、CSV、YAML 等）**一站式** |
| JSONLint | https://jsonlint.com/ | **极简校验 + 错误定位**，适合「粘贴即查」 |
| Toptal JSON Formatter | https://www.toptal.com/developers/json-formatter | 基于成熟校验实现的**轻量格式化页** |
| Curious Concept JSON Formatter | https://jsonformatter.curiousconcept.com/ | 多规范校验说明、**修复常见语法错误** 等差异化段落 |

**启示**：市场分层清晰——**「快检」**（Lint）、**「深度编辑」**（树/表）、**「转换工厂」**（多格式）三类意图；若只做一个小站，应用 **Tab 或清晰子区** 覆盖，避免三个完全重复的落地页。

### 1.2 假数据 / Mock API / 联调

| 参考对象 | 说明 |
| --- | --- |
| JSONPlaceholder | https://jsonplaceholder.typicode.com/ | **固定假 REST 资源**，适合教学与前端占位 |
| Mocky、Beeceptor、Faux API 等 | 多篇 2025–2026 对比类文章常列 | **可配置响应、延迟、CORS** 等——多数依赖**服务端或账号**，与「纯浏览器内造 JSON」不同 |

**启示**：**「浏览器内生成 JSON 样本」**与**「公网可访问 Mock 端点」**是两种产品；前者可归本产品线 P0；后者需单独定义 **隐私、日志、合规**（往往超出纯静态站）。

---

## 2. 用户任务分层（建议作为信息架构主轴）

| 层级 | 用户说人话 | 能力要点 | 竞品对应 |
| --- | --- | --- | --- |
| **L0 快检** | 「这段是不是合法 JSON？」 | 语法错误行列、最小 UI | JSONLint、各站 validator Tab |
| **L1 可读** | 「帮我排版 / 压成一行」 | Pretty、Minify、复制 | JSONFormatter、各站 format Tab |
| **L2 结构化编辑** | 「我要改嵌套字段」 | 树/表视图、路径复制、折叠 | JSON Editor Online |
| **L3 规则与契约** | 「按 Schema 校验 / 补全」 | JSON Schema 导入、错误路径 | 高阶编辑器向 |
| **L4 互转** | 「JSON ↔ YAML / CSV / …」 | 展平规则、表头、数组语义 | JSONFormatter 类 |
| **L5 造数** | 「给我一批测试 JSON」 | 模板、随机字段、约束 | 竞品常单独「Mock / Sample」 |

---

## 3. 路由与 slug 策略（草案）

| 策略 | 做法 |
| --- | --- |
| **主工作台（推荐 P0）** | 单 slug 如 `json-workbench`：内分 Tab——**校验 | 格式化 | 压缩 |（可选）树编辑**。SEO 用长文覆盖「json formatter」「json validator」同页 H2。 |
| **长尾（可选）** | 仅当能写**独立价值**时拆：`json-to-yaml`、`json-to-csv`（展平规则文档不同） |
| **Hub** | `json-tools` 类路径：只负责**索引**，避免与主工作台正文重复 |

**不推荐**：多个落地页共用同一段说明 + 同一 iframe，仅替换 H1 关键词。

---

## 4. 安全与体验（落地必写）

- **粘贴即解析**：默认声明数据**不上传**；若未来接服务端，需单独同意与用途说明。  
- **大文件**：主线程解析上限；超限提示用 Worker 或拒绝。  
- **XSS**：若存在「渲染 JSON 为 HTML」类功能，必须 **DOMPurify / 仅文本** 策略写清。  
- **Schema 与 `$ref`**：远程引用是否允许、超时与 SSRF 风险（若服务端代拉取）。

---

## 5. 规划工具清单（与竞品对齐的「能力清单」，非本站路由表）

| 优先级 | 能力 | 说明 |
| --- | --- | --- |
| P0 | 语法校验 + 错误位置 | L0 |
| P0 | Pretty + Minify | L1 |
| P1 | 树 / 表视图编辑 | L2 |
| P1 | JSON ↔ YAML（及对称） | L4 |
| P2 | JSON ↔ CSV（展平规则可选） | L4 |
| P2 | JSON Schema 校验 | L3 |
| P2 | 文档对比 / Diff | 配置审阅场景 |
| P3 | Mock 端点、协作、云端存储 | 通常非纯静态；另立项 |

---

文档版本：初稿；竞品与博客链接仅供产品调研，实施前请复核。
