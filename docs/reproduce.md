# 证据与复现说明

证据实验室读取随仓库发布的 JSON。浏览器展示结果回放及公开参考校验器，不在访客设备上重新运行花令服务或私有 185 篇原文。

## 公开可运行部分

Node.js 20+ 可运行：

```bash
npm test
npm run build
npm run dev
```

Python 3.10+ 的标准库可运行候选档案守卫的独立测试：

```bash
python -B -m unittest discover -s tests -p "test_*.py"
```

`demos/story-lab/validator.mjs` 是本次新增的公开参考实现，`data/story-sample.json` 是本次新写的完整夹具。两者不包含第三方正文。私有原校验器与公开实现不完全等价，具体差异在案例中列出。

## 私有源码持有者复跑花令

需要现有花令源码，以及 Python 的 `aiohttp`、`pydantic`。源代码应为可信的项目代码；审计器在本机执行它，仅替换应用导入、模型和工具执行边界。

```bash
python -B tools/audit-hualing.py --source-root /path/to/Hualing --output data/hualing-audit.json
python -B tools/audit-hualing.py --source-root /path/to/Hualing --output data/hualing-guard-audit.json --candidate-guard
```

前端解析检查需要完整前端源码、npm 和 `tsx`：

```bash
node tools/audit-hualing-routing.mjs /path/to/Hualing data/hualing-routing-audit.json
```

此命令重用原来的 21 条断言，只调整导入地址与临时输出目录。它不覆盖历史报告，不调用模型、数据库或全站构建。本次从原始项目归档恢复缺失配置后执行成功。

## 私有语料持有者复跑批次

需要原有 `duanju-factors` 工作目录、冻结批次和清单所指向的原始文件。仅使用 Python 标准库：

```bash
python -B tools/audit-story-batch.py --pipeline-root /path/to/duanju-factors --output data/story-audit.json
python -B tools/audit-story-retrieval.py --batch /path/to/duanju-factors/outputs/sample_test_20261016 --output data/story-retrieval-audit.json
python -B tools/export-story-schema.py --pipeline-root /path/to/duanju-factors --output data/story-record.schema.json
```

批次审计只调用已有校验函数，不执行原脚本的写出主流程。报告按白名单输出哈希与计数，不写出正文、书名、来源链接和本机路径。

## 如何解读证据强度

| 证据 | 可以支持 | 不足以支持 |
| --- | --- | --- |
| 公开页面截图 | 某日期入口和页面可访问 | 全部后台功能或宣传文案有效 |
| 本次原代码隔离执行 | 指定输入与依赖替身下的控制流行为 | 真实模型质量、数据库权限与线上可靠性 |
| 原测试脚本重跑 | 21 条配置断言在该快照通过 | 67 个互动流程全部通过 |
| 原文、摘录与行号重核 | 引文存在且定位一致 | 机制解释和情绪判断正确 |
| 文件哈希 | 源快照和报告之间的版本关联 | 作者身份、个人分工、商业效果 |
| 新增候选守卫通过 | 参考修复覆盖了这些回归场景 | 修复已合入生产环境 |

## 报告更新

变更公开 JSON 后运行 `node tools/prepare-evidence.mjs` 更新浏览器证据包；`npm run build` 会执行此步骤。原始报告、候选报告和历史记录分别保留，避免把候选修复的结果覆盖为原产品结果。
