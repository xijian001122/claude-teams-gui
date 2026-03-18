> ## Documentation Index
> Fetch the complete documentation index at: https://code.claude.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# 使用技能扩展 Claude

> 在 Claude Code 中创建、管理和共享技能以扩展 Claude 的功能。包括自定义斜杠命令。

技能扩展了 Claude 能做的事情。创建一个包含说明的 `SKILL.md` 文件，Claude 就会将其添加到其工具包中。Claude 在相关时使用技能，或者你可以使用 `/skill-name` 直接调用一个技能。

<Note>
  对于内置命令（如 `/help` 和 `/compact`），请参阅[交互模式](/zh-CN/interactive-mode#built-in-commands)。

**自定义斜杠命令已合并到技能中。** `.claude/commands/review.md` 中的文件和 `.claude/skills/review/SKILL.md` 中的技能都会创建 `/review` 并以相同方式工作。你现有的 `.claude/commands/` 文件继续工作。技能添加了可选功能：支持文件的目录、[控制你或 Claude 是否调用它们](#control-who-invokes-a-skill)的前置元数据，以及 Claude 在相关时自动加载它们的能力。
</Note>

Claude Code 技能遵循 [Agent Skills](https://agentskills.io) 开放标准，该标准适用于多个 AI 工具。Claude Code 使用额外功能扩展了该标准，如[调用控制](#control-who-invokes-a-skill)、[子代理执行](#run-skills-in-a-subagent)和[动态上下文注入](#inject-dynamic-context)。

## 入门

### 创建你的第一个技能

此示例创建一个教 Claude 使用视觉图表和类比来解释代码的技能。由于它使用默认前置元数据，Claude 可以在你询问某事如何工作时自动加载它，或者你可以使用 `/explain-code` 直接调用它。

<Steps>
  <Step title="创建技能目录">
    在你的个人技能文件夹中为技能创建一个目录。个人技能在所有项目中都可用。

    ```bash  theme={null}
    mkdir -p ~/.claude/skills/explain-code
    ```
  </Step>

  <Step title="编写 SKILL.md">
    每个技能都需要一个 `SKILL.md` 文件，包含两部分：YAML 前置元数据（在 `---` 标记之间）告诉 Claude 何时使用该技能，以及包含 Claude 在调用技能时遵循的说明的 markdown 内容。`name` 字段变成 `/slash-command`，`description` 帮助 Claude 决定何时自动加载它。

    创建 `~/.claude/skills/explain-code/SKILL.md`：

    ```yaml  theme={null}
    ---
    name: explain-code
    description: Explains code with visual diagrams and analogies. Use when explaining how code works, teaching about a codebase, or when the user asks "how does this work?"
    ---

    When explaining code, always include:

    1. **Start with an analogy**: Compare the code to something from everyday life
    2. **Draw a diagram**: Use ASCII art to show the flow, structure, or relationships
    3. **Walk through the code**: Explain step-by-step what happens
    4. **Highlight a gotcha**: What's a common mistake or misconception?

    Keep explanations conversational. For complex concepts, use multiple analogies.
    ```
  </Step>

  <Step title="测试技能">
    你可以通过两种方式测试它：

    **让 Claude 自动调用它**，通过询问与描述匹配的内容：

    ```
    How does this code work?
    ```

    **或直接使用技能名称调用它**：

    ```
    /explain-code src/auth/login.ts
    ```

    无论哪种方式，Claude 都应该在其解释中包含类比和 ASCII 图表。
  </Step>
</Steps>

### 技能存放位置

你存储技能的位置决定了谁可以使用它：

| 位置 | 路径                                       | 适用于        |
| :- | :--------------------------------------- | :--------- |
| 企业 | 参阅[托管设置](/zh-CN/iam#managed-settings)    | 你的组织中的所有用户 |
| 个人 | `~/.claude/skills/<skill-name>/SKILL.md` | 你的所有项目     |
| 项目 | `.claude/skills/<skill-name>/SKILL.md`   | 仅此项目       |
| 插件 | `<plugin>/skills/<skill-name>/SKILL.md`  | 启用插件的位置    |

项目技能覆盖具有相同名称的个人技能。如果你在 `.claude/commands/` 中有文件，它们的工作方式相同，但技能优先于具有相同名称的命令。

#### 从嵌套目录自动发现

当你在子目录中处理文件时，Claude Code 会自动从嵌套的 `.claude/skills/` 目录中发现技能。例如，如果你在 `packages/frontend/` 中编辑文件，Claude Code 也会在 `packages/frontend/.claude/skills/` 中查找技能。这支持单仓库设置，其中包有自己的技能。

每个技能都是一个以 `SKILL.md` 作为入口点的目录：

```
my-skill/
├── SKILL.md           # 主要说明（必需）
├── template.md        # Claude 要填写的模板
├── examples/
│   └── sample.md      # 显示预期格式的示例输出
└── scripts/
    └── validate.sh    # Claude 可以执行的脚本
```

`SKILL.md` 包含主要说明并且是必需的。其他文件是可选的，让你构建更强大的技能：Claude 要填写的模板、显示预期格式的示例输出、Claude 可以执行的脚本或详细的参考文档。从你的 `SKILL.md` 中引用这些文件，以便 Claude 知道它们包含什么以及何时加载它们。有关更多详细信息，请参阅[添加支持文件](#add-supporting-files)。

<Note>
  `.claude/commands/` 中的文件仍然有效并支持相同的[前置元数据](#frontmatter-reference)。建议使用技能，因为它们支持支持文件等其他功能。
</Note>

## 配置技能

技能通过 `SKILL.md` 顶部的 YAML 前置元数据和随后的 markdown 内容进行配置。

### 技能内容类型

技能文件可以包含任何说明，但思考你想如何调用它们有助于指导包含的内容：

**参考内容**添加 Claude 应用于你当前工作的知识。约定、模式、风格指南、领域知识。此内容内联运行，以便 Claude 可以将其与你的对话上下文一起使用。

```yaml  theme={null}
---
name: api-conventions
description: API design patterns for this codebase
---

When writing API endpoints:
- Use RESTful naming conventions
- Return consistent error formats
- Include request validation
```

**任务内容**为 Claude 提供特定操作的分步说明，如部署、提交或代码生成。这些通常是你想使用 `/skill-name` 直接调用的操作，而不是让 Claude 决定何时运行它们。添加 `disable-model-invocation: true` 以防止 Claude 自动触发它。

```yaml  theme={null}
---
name: deploy
description: Deploy the application to production
context: fork
disable-model-invocation: true
---

Deploy the application:
1. Run the test suite
2. Build the application
3. Push to the deployment target
```

你的 `SKILL.md` 可以包含任何内容，但思考你想如何调用技能（由你、由 Claude 或两者）以及你想在哪里运行它（内联或在子代理中）有助于指导包含的内容。对于复杂的技能，你也可以[添加支持文件](#add-supporting-files)以保持主技能专注。

### 前置元数据参考

除了 markdown 内容外，你可以使用 `SKILL.md` 文件顶部 `---` 标记之间的 YAML 前置元数据字段来配置技能行为：

```yaml  theme={null}
---
name: my-skill
description: What this skill does
disable-model-invocation: true
allowed-tools: Read, Grep
---

Your skill instructions here...
```

所有字段都是可选的。只建议使用 `description`，以便 Claude 知道何时使用该技能。

| 字段                         | 必需 | 描述                                                                 |
| :------------------------- | :- | :----------------------------------------------------------------- |
| `name`                     | 否  | 技能的显示名称。如果省略，使用目录名称。仅小写字母、数字和连字符（最多 64 个字符）。                       |
| `description`              | 推荐 | 技能的作用以及何时使用它。Claude 使用它来决定何时应用该技能。如果省略，使用 markdown 内容的第一段。         |
| `argument-hint`            | 否  | 自动完成期间显示的提示，指示预期的参数。示例：`[issue-number]` 或 `[filename] [format]`。   |
| `disable-model-invocation` | 否  | 设置为 `true` 以防止 Claude 自动加载此技能。用于你想使用 `/name` 手动触发的工作流。默认值：`false`。 |
| `user-invocable`           | 否  | 设置为 `false` 以从 `/` 菜单中隐藏。用于用户不应直接调用的背景知识。默认值：`true`。               |
| `allowed-tools`            | 否  | 此技能处于活动状态时 Claude 可以使用而无需请求权限的工具。                                  |
| `model`                    | 否  | 此技能处于活动状态时要使用的模型。                                                  |
| `context`                  | 否  | 设置为 `fork` 以在分叉的子代理上下文中运行。                                         |
| `agent`                    | 否  | 设置 `context: fork` 时要使用的子代理类型。                                     |
| `hooks`                    | 否  | 限定于此技能生命周期的钩子。有关配置格式，请参阅[钩子](/zh-CN/hooks)。                        |

#### 可用的字符串替换

技能支持技能内容中动态值的字符串替换：

| 变量                     | 描述                                                                |
| :--------------------- | :---------------------------------------------------------------- |
| `$ARGUMENTS`           | 调用技能时传递的所有参数。如果内容中不存在 `$ARGUMENTS`，参数将作为 `ARGUMENTS: <value>` 追加。 |
| `${CLAUDE_SESSION_ID}` | 当前会话 ID。用于日志记录、创建特定于会话的文件或将技能输出与会话关联。                             |

**使用替换的示例：**

```yaml  theme={null}
---
name: session-logger
description: Log activity for this session
---

Log the following to logs/${CLAUDE_SESSION_ID}.log:

$ARGUMENTS
```

### 添加支持文件

技能可以在其目录中包含多个文件。这使 `SKILL.md` 专注于要点，同时让 Claude 仅在需要时访问详细的参考材料。大型参考文档、API 规范或示例集合不需要在每次技能运行时加载到上下文中。

```
my-skill/
├── SKILL.md (required - overview and navigation)
├── reference.md (detailed API docs - loaded when needed)
├── examples.md (usage examples - loaded when needed)
└── scripts/
    └── helper.py (utility script - executed, not loaded)
```

从 `SKILL.md` 中引用支持文件，以便 Claude 知道每个文件包含什么以及何时加载它：

```markdown  theme={null}
## Additional resources

- For complete API details, see [reference.md](reference.md)
- For usage examples, see [examples.md](examples.md)
```

<Tip>保持 `SKILL.md` 在 500 行以下。将详细的参考材料移到单独的文件。</Tip>

### 控制谁调用技能

默认情况下，你和 Claude 都可以调用任何没有设置 `disable-model-invocation: true` 的技能。你可以键入 `/skill-name` 直接调用它，Claude 可以在与你的对话相关时自动加载它。两个前置元数据字段让你限制这一点：

* **`disable-model-invocation: true`**：只有你可以调用该技能。用于有副作用或你想控制时间的工作流，如 `/commit`、`/deploy` 或 `/send-slack-message`。你不希望 Claude 因为你的代码看起来准备好了就决定部署。

* **`user-invocable: false`**：只有 Claude 可以调用该技能。用于不可作为命令操作的背景知识。`legacy-system-context` 技能解释了旧系统的工作原理。Claude 在相关时应该知道这一点，但 `/legacy-system-context` 对用户来说不是一个有意义的操作。

此示例创建一个只有你可以触发的部署技能。`disable-model-invocation: true` 字段防止 Claude 自动运行它：

```yaml  theme={null}
---
name: deploy
description: Deploy the application to production
disable-model-invocation: true
---

Deploy $ARGUMENTS to production:

1. Run the test suite
2. Build the application
3. Push to the deployment target
4. Verify the deployment succeeded
```

以下是两个字段如何影响调用和上下文加载：

| 前置元数据                            | 你可以调用 | Claude 可以调用 | 何时加载到上下文            |
| :------------------------------- | :---- | :---------- | :------------------ |
| （默认）                             | 是     | 是           | 描述始终在上下文中，调用时加载完整技能 |
| `disable-model-invocation: true` | 是     | 否           | 描述不在上下文中，你调用时加载完整技能 |
| `user-invocable: false`          | 否     | 是           | 描述始终在上下文中，调用时加载完整技能 |

<Note>
  在常规会话中，技能描述被加载到上下文中，以便 Claude 知道什么可用，但完整的技能内容仅在调用时加载。[预加载技能的子代理](/zh-CN/sub-agents#preload-skills-into-subagents)的工作方式不同：完整的技能内容在启动时注入。
</Note>

### 限制工具访问

使用 `allowed-tools` 字段来限制技能处于活动状态时 Claude 可以使用哪些工具。此技能创建一个只读模式，其中 Claude 可以浏览文件但不能修改它们：

```yaml  theme={null}
---
name: safe-reader
description: Read files without making changes
allowed-tools: Read, Grep, Glob
---
```

### 将参数传递给技能

你和 Claude 都可以在调用技能时传递参数。参数可通过 `$ARGUMENTS` 占位符获得。

此技能通过编号修复 GitHub 问题。`$ARGUMENTS` 占位符被替换为技能名称后面的任何内容：

```yaml  theme={null}
---
name: fix-issue
description: Fix a GitHub issue
disable-model-invocation: true
---

Fix GitHub issue $ARGUMENTS following our coding standards.

1. Read the issue description
2. Understand the requirements
3. Implement the fix
4. Write tests
5. Create a commit
```

当你运行 `/fix-issue 123` 时，Claude 收到"按照我们的编码标准修复 GitHub 问题 123..."

如果你使用参数调用技能但技能不包含 `$ARGUMENTS`，Claude Code 会将 `ARGUMENTS: <your input>` 追加到技能内容的末尾，以便 Claude 仍然看到你键入的内容。

## 高级模式

### 注入动态上下文

`` !`command`` \`\` 语法在技能内容发送给 Claude 之前运行 shell 命令。命令输出替换占位符，所以 Claude 接收实际数据，而不是命令本身。

此技能通过使用 GitHub CLI 获取实时 PR 数据来总结拉取请求。`` !`gh pr diff`` \`\` 和其他命令首先运行，它们的输出被插入到提示中：

```yaml  theme={null}
---
name: pr-summary
description: Summarize changes in a pull request
context: fork
agent: Explore
allowed-tools: Bash(gh:*)
---

## Pull request context
- PR diff: !`gh pr diff`
- PR comments: !`gh pr view --comments`
- Changed files: !`gh pr diff --name-only`

## Your task
Summarize this pull request...
```

当此技能运行时：

1. 每个 `` !`command`` \`\` 立即执行（在 Claude 看到任何内容之前）
2. 输出替换技能内容中的占位符
3. Claude 接收具有实际 PR 数据的完全呈现的提示

这是预处理，不是 Claude 执行的东西。Claude 只看到最终结果。

<Tip>
  要在技能中启用[扩展思考](/zh-CN/common-workflows#use-extended-thinking-thinking-mode)，在你的技能内容中的任何地方包含单词"ultrathink"。
</Tip>

### 在子代理中运行技能

当你想让技能在隔离中运行时，在前置元数据中添加 `context: fork`。技能内容成为驱动子代理的提示。它将无法访问你的对话历史。

<Warning>
  `context: fork` 仅对具有明确说明的技能有意义。如果你的技能包含"使用这些 API 约定"之类的指南而没有任务，子代理会收到指南但没有可操作的提示，并返回而不产生有意义的输出。
</Warning>

技能和[子代理](/zh-CN/sub-agents)在两个方向上协同工作：

| 方法                     | 系统提示                       | 任务           | 也加载                |
| :--------------------- | :------------------------- | :----------- | :----------------- |
| 带有 `context: fork` 的技能 | 来自代理类型（`Explore`、`Plan` 等） | SKILL.md 内容  | CLAUDE.md          |
| 带有 `skills` 字段的子代理     | 子代理的 markdown 正文           | Claude 的委派消息 | 预加载的技能 + CLAUDE.md |

使用 `context: fork`，你在技能中编写任务并选择代理类型来执行它。对于反向操作（定义使用技能作为参考材料的自定义子代理），请参阅[子代理](/zh-CN/sub-agents#preload-skills-into-subagents)。

#### 示例：使用 Explore 代理的研究技能

此技能在分叉的 Explore 代理中运行研究。技能内容成为任务，代理提供针对代码库探索优化的只读工具：

```yaml  theme={null}
---
name: deep-research
description: Research a topic thoroughly
context: fork
agent: Explore
---

Research $ARGUMENTS thoroughly:

1. Find relevant files using Glob and Grep
2. Read and analyze the code
3. Summarize findings with specific file references
```

当此技能运行时：

1. 创建一个新的隔离上下文
2. 子代理接收技能内容作为其提示（"彻底研究 \$ARGUMENTS..."）
3. `agent` 字段确定执行环境（模型、工具和权限）
4. 结果被总结并返回到你的主对话

`agent` 字段指定要使用的子代理配置。选项包括内置代理（`Explore`、`Plan`、`general-purpose`）或来自 `.claude/agents/` 的任何自定义子代理。如果省略，使用 `general-purpose`。

### 限制 Claude 的技能访问

默认情况下，Claude 可以调用任何没有设置 `disable-model-invocation: true` 的技能。内置命令如 `/compact` 和 `/init` 不能通过技能工具获得。

控制 Claude 可以调用哪些技能的三种方法：

**通过在 `/permissions` 中拒绝技能工具来禁用所有技能**：

```
# Add to deny rules:
Skill
```

**使用[权限规则](/zh-CN/iam)允许或拒绝特定技能**：

```
# Allow only specific skills
Skill(commit)
Skill(review-pr:*)

# Deny specific skills
Skill(deploy:*)
```

权限语法：`Skill(name)` 用于精确匹配，`Skill(name:*)` 用于带有任何参数的前缀匹配。

**通过在其前置元数据中添加 `disable-model-invocation: true` 来隐藏单个技能**。这会从 Claude 的上下文中完全删除该技能。

<Note>
  `user-invocable` 字段仅控制菜单可见性，不控制技能工具访问。使用 `disable-model-invocation: true` 来阻止程序化调用。
</Note>

## 共享技能

技能可以根据你的受众在不同范围内分发：

* **项目技能**：将 `.claude/skills/` 提交到版本控制
* **插件**：在你的[插件](/zh-CN/plugins)中创建 `skills/` 目录
* **托管**：通过[托管设置](/zh-CN/iam#managed-settings)部署组织范围内

### 生成视觉输出

技能可以捆绑并运行任何语言的脚本，给 Claude 超越单个提示中可能的功能。一个强大的模式是生成视觉输出：在浏览器中打开的交互式 HTML 文件，用于探索数据、调试或创建报告。

此示例创建一个代码库浏览器：一个交互式树视图，你可以在其中展开和折叠目录、一目了然地查看文件大小，并按颜色识别文件类型。

创建技能目录：

```bash  theme={null}
mkdir -p ~/.claude/skills/codebase-visualizer/scripts
```

创建 `~/.claude/skills/codebase-visualizer/SKILL.md`。描述告诉 Claude 何时激活此技能，说明告诉 Claude 运行捆绑的脚本：

````yaml  theme={null}
---
name: codebase-visualizer
description: Generate an interactive collapsible tree visualization of your codebase. Use when exploring a new repo, understanding project structure, or identifying large files.
allowed-tools: Bash(python:*)
---

# Codebase Visualizer

Generate an interactive HTML tree view that shows your project's file structure with collapsible directories.

## Usage

Run the visualization script from your project root:

```bash
python ~/.claude/skills/codebase-visualizer/scripts/visualize.py .
```

This creates `codebase-map.html` in the current directory and opens it in your default browser.

## What the visualization shows

- **Collapsible directories**: Click folders to expand/collapse
- **File sizes**: Displayed next to each file
- **Colors**: Different colors for different file types
- **Directory totals**: Shows aggregate size of each folder
````

创建 `~/.claude/skills/codebase-visualizer/scripts/visualize.py`。此脚本扫描目录树并生成一个自包含的 HTML 文件，具有：

* 一个**摘要侧边栏**，显示文件计数、目录计数、总大小和文件类型数量
* 一个**条形图**，按文件类型（按大小排名前 8）分解代码库
* 一个**可折叠树**，你可以在其中展开和折叠目录，带有颜色编码的文件类型指示器

该脚本需要 Python，但仅使用内置库，因此无需安装包：

```python expandable theme={null}
#!/usr/bin/env python3
"""Generate an interactive collapsible tree visualization of a codebase."""

import json
import sys
import webbrowser
from pathlib import Path
from collections import Counter

IGNORE = {'.git', 'node_modules', '__pycache__', '.venv', 'venv', 'dist', 'build'}

def scan(path: Path, stats: dict) -> dict:
    result = {"name": path.name, "children": [], "size": 0}
    try:
        for item in sorted(path.iterdir()):
            if item.name in IGNORE or item.name.startswith('.'):
                continue
            if item.is_file():
                size = item.stat().st_size
                ext = item.suffix.lower() or '(no ext)'
                result["children"].append({"name": item.name, "size": size, "ext": ext})
                result["size"] += size
                stats["files"] += 1
                stats["extensions"][ext] += 1
                stats["ext_sizes"][ext] += size
            elif item.is_dir():
                stats["dirs"] += 1
                child = scan(item, stats)
                if child["children"]:
                    result["children"].append(child)
                    result["size"] += child["size"]
    except PermissionError:
        pass
    return result

def generate_html(data: dict, stats: dict, output: Path) -> None:
    ext_sizes = stats["ext_sizes"]
    total_size = sum(ext_sizes.values()) or 1
    sorted_exts = sorted(ext_sizes.items(), key=lambda x: -x[1])[:8]
    colors = {
        '.js': '#f7df1e', '.ts': '#3178c6', '.py': '#3776ab', '.go': '#00add8',
        '.rs': '#dea584', '.rb': '#cc342d', '.css': '#264de4', '.html': '#e34c26',
        '.json': '#6b7280', '.md': '#083fa1', '.yaml': '#cb171e', '.yml': '#cb171e',
        '.mdx': '#083fa1', '.tsx': '#3178c6', '.jsx': '#61dafb', '.sh': '#4eaa25',
    }
    lang_bars = "".join(
        f'<div class="bar-row"><span class="bar-label">{ext}</span>'
        f'<div class="bar" style="width:{(size/total_size)*100}%;background:{colors.get(ext,"#6b7280")}"></div>'
        f'<span class="bar-pct">{(size/total_size)*100:.1f}%</span></div>'
        for ext, size in sorted_exts
    )
    def fmt(b):
        if b < 1024: return f"{b} B"
        if b < 1048576: return f"{b/1024:.1f} KB"
        return f"{b/1048576:.1f} MB"

    html = f'''<!DOCTYPE html>
<html><head>
  <meta charset="utf-8"><title>Codebase Explorer</title>
  <style>
    body {{ font: 14px/1.5 system-ui, sans-serif; margin: 0; background: #1a1a2e; color: #eee; }}
    .container {{ display: flex; height: 100vh; }}
    .sidebar {{ width: 280px; background: #252542; padding: 20px; border-right: 1px solid #3d3d5c; overflow-y: auto; flex-shrink: 0; }}
    .main {{ flex: 1; padding: 20px; overflow-y: auto; }}
    h1 {{ margin: 0 0 10px 0; font-size: 18px; }}
    h2 {{ margin: 20px 0 10px 0; font-size: 14px; color: #888; text-transform: uppercase; }}
    .stat {{ display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #3d3d5c; }}
    .stat-value {{ font-weight: bold; }}
    .bar-row {{ display: flex; align-items: center; margin: 6px 0; }}
    .bar-label {{ width: 55px; font-size: 12px; color: #aaa; }}
    .bar {{ height: 18px; border-radius: 3px; }}
    .bar-pct {{ margin-left: 8px; font-size: 12px; color: #666; }}
    .tree {{ list-style: none; padding-left: 20px; }}
    details {{ cursor: pointer; }}
    summary {{ padding: 4px 8px; border-radius: 4px; }}
    summary:hover {{ background: #2d2d44; }}
    .folder {{ color: #ffd700; }}
    .file {{ display: flex; align-items: center; padding: 4px 8px; border-radius: 4px; }}
    .file:hover {{ background: #2d2d44; }}
    .size {{ color: #888; margin-left: auto; font-size: 12px; }}
    .dot {{ width: 8px; height: 8px; border-radius: 50%; margin-right: 8px; }}
  </style>
</head><body>
  <div class="container">
    <div class="sidebar">
      <h1>📊 Summary</h1>
      <div class="stat"><span>Files</span><span class="stat-value">{stats["files"]:,}</span></div>
      <div class="stat"><span>Directories</span><span class="stat-value">{stats["dirs"]:,}</span></div>
      <div class="stat"><span>Total size</span><span class="stat-value">{fmt(data["size"])}</span></div>
      <div class="stat"><span>File types</span><span class="stat-value">{len(stats["extensions"])}</span></div>
      <h2>By file type</h2>
      {lang_bars}
    </div>
    <div class="main">
      <h1>📁 {data["name"]}</h1>
      <ul class="tree" id="root"></ul>
    </div>
  </div>
  <script>
    const data = {json.dumps(data)};
    const colors = {json.dumps(colors)};
    function fmt(b) {{ if (b < 1024) return b + ' B'; if (b < 1048576) return (b/1024).toFixed(1) + ' KB'; return (b/1048576).toFixed(1) + ' MB'; }}
    function render(node, parent) {{
      if (node.children) {{
        const det = document.createElement('details');
        det.open = parent === document.getElementById('root');
        det.innerHTML = `<summary><span class="folder">📁 ${{node.name}}</span><span class="size">${{fmt(node.size)}}</span></summary>`;
        const ul = document.createElement('ul'); ul.className = 'tree';
        node.children.sort((a,b) => (b.children?1:0)-(a.children?1:0) || a.name.localeCompare(b.name));
        node.children.forEach(c => render(c, ul));
        det.appendChild(ul);
        const li = document.createElement('li'); li.appendChild(det); parent.appendChild(li);
      }} else {{
        const li = document.createElement('li'); li.className = 'file';
        li.innerHTML = `<span class="dot" style="background:${{colors[node.ext]||'#6b7280'}}"></span>${{node.name}}<span class="size">${{fmt(node.size)}}</span>`;
        parent.appendChild(li);
      }}
    }}
    data.children.forEach(c => render(c, document.getElementById('root')));
  </script>
</body></html>'''
    output.write_text(html)

if __name__ == '__main__':
    target = Path(sys.argv[1] if len(sys.argv) > 1 else '.').resolve()
    stats = {"files": 0, "dirs": 0, "extensions": Counter(), "ext_sizes": Counter()}
    data = scan(target, stats)
    out = Path('codebase-map.html')
    generate_html(data, stats, out)
    print(f'Generated {out.absolute()}')
    webbrowser.open(f'file://{out.absolute()}')
```

要测试，在任何项目中打开 Claude Code 并询问"可视化此代码库。"Claude 运行脚本，生成 `codebase-map.html`，并在浏览器中打开它。

此模式适用于任何视觉输出：依赖关系图、测试覆盖率报告、API 文档或数据库架构可视化。捆绑的脚本完成繁重工作，而 Claude 处理编排。

## 故障排除

### 技能未触发

如果 Claude 在预期时不使用你的技能：

1. 检查描述是否包含用户会自然说的关键字
2. 验证技能是否出现在"有哪些技能可用？"中
3. 尝试重新表述你的请求以更接近描述
4. 如果技能是用户可调用的，使用 `/skill-name` 直接调用它

### 技能触发过于频繁

如果 Claude 在你不想要的时候使用你的技能：

1. 使描述更具体
2. 如果你只想手动调用，添加 `disable-model-invocation: true`

### Claude 看不到我的所有技能

技能描述被加载到上下文中，以便 Claude 知道什么可用。如果你有很多技能，它们可能会超过字符预算（默认 15,000 个字符）。运行 `/context` 以检查有关排除的技能的警告。

要增加限制，设置 `SLASH_COMMAND_TOOL_CHAR_BUDGET` 环境变量。

## 相关资源

* **[子代理](/zh-CN/sub-agents)**：将任务委派给专门的代理
* **[插件](/zh-CN/plugins)**：打包和分发技能与其他扩展
* **[钩子](/zh-CN/hooks)**：围绕工具事件自动化工作流
* **[内存](/zh-CN/memory)**：管理 CLAUDE.md 文件以获得持久上下文
* **[交互模式](/zh-CN/interactive-mode#built-in-commands)**：内置命令和快捷方式
* **[权限](/zh-CN/iam)**：控制工具和技能访问
