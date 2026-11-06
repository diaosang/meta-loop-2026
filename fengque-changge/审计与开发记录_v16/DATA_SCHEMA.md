# 当前状态与存档结构

固定内容：`world/world-data-v16.json`、原各JSON与XLSX。动态状态：`state`，包含原国库、地方、人物关系和新`world16`。历史：`world16.history`、原记事与经营实录。

| 路径 | 含义 |
| --- | --- |
| `state.version` | 旧完整状态兼容号3，保留旧加载约定 |
| 导出包`schemaVersion` | 16 |
| 导出包`format/data/checksum` | `fengque-save`、完整JSON文本、FNV-1a32误码校验；不是密码或防作弊签名 |
| `state.world16.schemaVersion` | 新世界子模型版本1 |
| `world16.seed` | 生成后持久保存的世界种子 |
| `world16.serial` | 统一递增编号序列；人物、家族、建筑、事件有不同类型前缀 |
| `world16.people[id]` | 姓名、性别、birthMonth、alive、父母和子女ID、配偶ID、家族ID、所学、性情、职业目标、记忆引用等 |
| `birthMonth` | 以游戏月序计的出生月份；未记的旧谱可为空，不补猜具体年龄 |
| `world16.families[id]` | 类型、来源、祖籍／地区、成员ID、家计、声望与主事人；原族谱用legacy来源保留 |
| `world16.relationships` | 以双方稳定ID组成的关系键，记录真实自主往来 |
| `world16.history` | 唯一事件ID、日序、类型、正文、相关人物及家族／建筑引用 |
| `world16.palace.buildings[id]` | 建筑类型、x/y、方向、等级、状态、完工日、住户ID |
| `world16.dynasty` | 在位人ID、代数、继承人、孕期／家事计划及历代在位记录 |
| `dynasty.rulers[].personalRelations` | 交位时归档的原君主私人关系，不覆盖国家公共历史 |

日序`tick = elapsed × 30 + day - 1`，与原经营规则相同。推进按日处理，预览和读档不新增一日。每月更新生涯，每年更新婚育与家计；不是每帧模拟所有人。

旧版原始state与旧`{game,savedAt,state}`下载包均可导入；只有经营实录的文件不是完整游戏档，明确拒绝。新人物原型会从世界记录恢复，原姓名可重复，人物不会凭姓名合并。固定故事内容仍保留在原数据层，未假称所有旧模块已完全统一。
