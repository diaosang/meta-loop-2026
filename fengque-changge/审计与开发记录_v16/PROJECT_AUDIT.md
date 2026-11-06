# 当前网页工程审计 · V16

审计基线是 Git 提交8299033的V15，随后在同一网页工程补齐V16。旧版独立试玩与原36张配表保持原样，仓库根目录的其他游戏未修改。本轮没有新建Godot工程，也没有锁定附件中的引擎版本。

## 技术栈和入口

- 游戏运行：原生HTML、CSS、JavaScript，单个内联脚本；未使用React或Vue。
- 构建：`源代码/build_web_demo.py`，用Python标准库读取XLSX里的对话表和JSON配表，拼接各JS层。
- 当前入口：`index.html`、`网页Demo/index.html`、`试玩_v16.html`，三者同内容；`试玩_v15.html`保留历史版本。
- 基础状态与事件派发：`源代码/demo-game.js`的`state`、`actions`及委托点击处理。
- 开发测试：Node.js内置模块和Playwright；玩家运行不需要Node、Python或测试依赖。
- 界面资源：内联CSS、SVG和程序化人物／地图，活动入口未引用外部脚本、字体或图片。浏览器断网测试覆盖实际操作，没有接入云端AI。

## 模块分工

| 模块 | 依据与职责 |
| --- | --- |
| 原人物、家世、婚姻 | `demo-game.js`、`cast-data.json`、`demo-cast-life.js` |
| 心态、相处、对白 | `demo-npc-mind.js`、`demo-court-voice.js`、`demo-social-talk.js`、`demo-everyday-talk.js` |
| 国家经营 | `simulation/realm-core.js`、`demo-simulation.js`，读取八地与原国库账 |
| 前朝、旧案 | `demo-frontcourt.js`、`demo-daliang-canon.js`，保留原大殿 |
| 新家族、寿命、婚育、宫室、传承 | `world/world-core-v16.js`，由`demo-world-v16.js`适配原界面与状态 |
| 完整存读档 | `save/save-codec-v16.js`、`save/save-bootstrap-v16.js`、`demo-save-v16.js` |

V15已有自动存档与导出，但没有真正的手动读档和多槽恢复；V16新增IndexedDB主存储、三格手动档、换日备份、导入预览、校验与恢复。V15的皇嗣入口原为“尚未开放”提示，V16新增基本子嗣与传位流程，没有把旧设计文案误算成原本已经实现。

## 存储和数据边界

旧`localStorage`键仍是`fengque-demo-v4`，保留完整旧状态兼容。V16用`fengque-vault-v16` IndexedDB保存完整档与备份；快速镜像达到配额后可从较新的数据库档恢复。启动前先捕获原始内容，旧层不得在校验前覆盖坏档。

固定故事数据不存进每一份档；已经发生的人物、家族、关系和历史实际写入存档，不在读档时重新随机生成。新NPC的父母、祖辈和隐情在生成阶段就已确定。固定人物原来的经历不由新家族生成器覆盖。
