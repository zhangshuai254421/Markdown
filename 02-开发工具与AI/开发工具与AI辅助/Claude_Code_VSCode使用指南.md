# Claude Code for VSCode 使用指南

## 目录

1. [概述](#概述)
2. [安装与配置](#安装与配置)
3. [界面介绍](#界面介绍)
4. [核心功能](#核心功能)
5. [常用命令与快捷键](#常用命令与快捷键)
6. [对话交互方式](#对话交互方式)
7. [代码操作](#代码操作)
8. [终端集成](#终端集成)
9. [项目上下文管理](#项目上下文管理)
10. [高级功能](#高级功能)
11. [配置选项](#配置选项)
12. [常见问题与解决](#常见问题与解决)
13. [最佳实践](#最佳实践)
14. [资源链接](#资源链接)

---

## 概述

Claude Code 是 Anthropic 推出的 AI 编程助手，提供 **CLI（命令行）** 和 **VSCode 扩展** 两种使用方式。VSCode 扩展让你可以直接在编辑器内与 Claude 交互，完成代码编写、调试、重构、解释等任务。

### 主要特点

| 特点 | 说明 |
|------|------|
| **智能代码生成** | 根据自然语言描述生成代码 |
| **上下文理解** | 理解项目结构、文件关系、代码库语义 |
| **多语言支持** | 支持几乎所有主流编程语言 |
| **终端集成** | 在 VSCode 终端中直接使用 CLI |
| **代码解释** | 选中代码即可获取详细解释 |
| **重构建议** | 智能分析并提供代码优化方案 |
| **调试辅助** | 分析错误、定位问题、建议修复 |
| **文件操作** | 创建、编辑、搜索文件 |

---

## 安装与配置

### 前置条件

```bash
# 1. 安装 Node.js (版本 18 或更高)
# 下载地址: https://nodejs.org/

# 2. 验证 Node.js 安装
node --version
npm --version
```

### 方式一：通过 VSCode 扩展市场安装（推荐）

```
1. 打开 VSCode
2. 按 Ctrl+Shift+X 打开扩展面板
3. 搜索 "Claude Code"
4. 找到 Anthropic 官方发布的扩展
5. 点击 "Install" 安装
```

### 方式二：通过命令行安装 CLI

```bash
# 全局安装 Claude Code CLI
npm install -g @anthropic-ai/claude-code

# 验证安装
claude --version
```

### 方式三：通过 VSCode 命令面板安装

```
1. 按 Ctrl+Shift+P 打开命令面板
2. 输入 "Extensions: Install Extension"
3. 搜索 "Claude Code"
4. 安装
```

### 首次认证配置

```bash
# 方式一：使用 API Key
# 1. 访问 https://console.anthropic.com/
# 2. 创建 API Key
# 3. 在 VSCode 中设置

# 方式二：使用 Claude Pro/Max 订阅
# 直接通过扩展登录 Anthropic 账号
```

在 VSCode 中配置 API Key：

```
1. 按 Ctrl+Shift+P
2. 输入 "Claude Code: Set API Key"
3. 输入你的 Anthropic API Key
```

或者在 `settings.json` 中配置：

```json
{
  "claude-code.apiKey": "your-api-key-here",
  "claude-code.model": "claude-sonnet-4-6"
}
```

---

## 界面介绍

### VSCode 扩展界面布局

```
┌─────────────────────────────────────────────────────────────────────────┐
│  VSCode 窗口                                                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────┬────────────────────────────────────────────────────┐   │
│  │             │                    编辑器区域                       │   │
│  │   资源      │  ┌──────────────────────────────────────────────┐  │   │
│  │   管理      │  │                                              │  │   │
│  │   器        │  │           代码文件                             │  │   │
│  │             │  │                                              │  │   │
│  │   📁 src    │  │           (选中代码 → 右键 → Ask Claude)       │  │   │
│  │   📁 docs   │  │                                              │  │   │
│  │   📄 ...    │  └──────────────────────────────────────────────┘  │   │
│  │             │                                                    │   │
│  ├─────────────┼────────────────────────────────────────────────────┤   │
│  │             │  ┌──────────────────────────────────────────────┐  │   │
│  │   扩展      │  │         Claude Code 面板                     │  │   │
│  │   侧边栏    │  │  ┌────────────────────────────────────────┐  │  │   │
│  │             │  │  │  💬 对话历史                            │  │  │   │
│  │  🤖 Claude  │  │  │                                        │  │  │   │
│  │    Code     │  │  │  用户: 帮我写一个排序函数                │  │  │   │
│  │             │  │  │                                        │  │  │   │
│  │             │  │  │  Claude: 好的，这是一个快速排序...       │  │  │   │
│  │             │  │  │                                        │  │  │   │
│  │             │  │  └────────────────────────────────────────┘  │  │   │
│  │             │  │  ┌────────────────────────────────────────┐  │  │   │
│  │             │  │  │  📝 输入框                    [发送] ▶  │  │  │   │
│  │             │  │  └────────────────────────────────────────┘  │  │   │
│  │             │  └──────────────────────────────────────────────┘  │   │
│  └─────────────┴────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                     终端区域                                      │   │
│  │  $ claude   ← 在终端中直接使用 CLI                                │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 打开 Claude Code 面板

| 方式 | 操作 |
|------|------|
| 侧边栏图标 | 点击左侧活动栏中的 Claude 图标 |
| 快捷键 | `Ctrl+Shift+P` → 输入 "Claude Code" |
| 命令面板 | `Ctrl+Shift+P` → "Claude Code: Open Chat" |
| 终端 | 在集成终端中输入 `claude` |

---

## 核心功能

### 1. 代码生成

```
在 Claude 面板中输入：

"帮我写一个 Python 快速排序函数"
"创建一个 React 登录组件，包含表单验证"
"用 TypeScript 写一个防抖函数"
```

### 2. 代码解释

```
1. 在编辑器中选中一段代码
2. 右键 → "Ask Claude" → "Explain this code"
3. 或使用快捷键
```

### 3. 代码重构

```
选中代码后，在 Claude 面板输入：

"重构这段代码，提高可读性"
"将这个函数改为使用 async/await"
"提取这段代码为独立的工具函数"
```

### 4. 错误调试

```
1. 复制错误信息到 Claude 面板
2. 或选中出错的代码
3. 输入 "这段代码报错了，帮我修复"
```

### 5. 文件操作

```
"创建一个新的 utils.ts 文件"
"在 src 目录下创建 components 文件夹"
"读取 package.json 文件的内容"
```

### 6. 搜索与导航

```
"找到所有使用了 useState 的文件"
"搜索项目中所有的 API 端点"
"找到处理用户登录的代码"
```

---

## 常用命令与快捷键

### 命令面板命令 (Ctrl+Shift+P)

| 命令 | 说明 |
|------|------|
| `Claude Code: Open Chat` | 打开 Claude 对话面板 |
| `Claude Code: Set API Key` | 设置 API Key |
| `Claude Code: Clear Chat` | 清除当前对话历史 |
| `Claude Code: New Chat` | 开始新对话 |
| `Claude Code: Toggle Terminal` | 切换终端集成 |
| `Claude Code: Settings` | 打开 Claude Code 设置 |

### 右键菜单

```
选中代码 → 右键：

├── Ask Claude
│   ├── Explain this code          # 解释代码
│   ├── Refactor this code         # 重构代码
│   ├── Find bugs                  # 查找 bug
│   ├── Add comments               # 添加注释
│   ├── Write tests                # 编写测试
│   └── Optimize this code         # 优化代码
│
└── Claude Code
    ├── Send to Claude             # 发送到 Claude
    └── Apply Suggestion           # 应用建议
```

### 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl+Shift+P` | 命令面板 |
| `Ctrl+Shift+L` | 选中代码并询问 Claude（可自定义） |
| `Enter` | 在输入框中发送消息 |
| `Shift+Enter` | 输入框中换行 |
| `Ctrl+L` | 清除对话（在 Claude 面板中） |
| `↑` | 浏览历史输入 |
| `Esc` | 取消当前生成 |

### 自定义快捷键

```json
// keybindings.json
[
  {
    "key": "ctrl+shift+l",
    "command": "claude-code.askSelection",
    "when": "editorHasSelection"
  },
  {
    "key": "ctrl+shift+o",
    "command": "claude-code.openChat"
  }
]
```

---

## 对话交互方式

### 1. 直接对话

在 Claude 面板的输入框中直接输入问题或指令：

```
你: 帮我写一个函数，实现数组去重
Claude: 好的，以下是几种实现方式...

你: 这段代码有什么性能问题？
Claude: 分析这段代码，发现以下性能问题...
```

### 2. 使用 @ 引用文件

```
@src/utils.ts 解释这个文件中的所有函数
@package.json 这个项目的依赖有哪些
@README.md 根据这个文档创建一个快速开始指南
```

### 3. 引用选中代码

```
1. 在编辑器中选中代码
2. 打开 Claude 面板
3. 输入: "解释这段代码" 或 "重构这段代码"
4. Claude 会自动包含选中的代码作为上下文
```

### 4. 多轮对话

```
你: 创建一个用户注册表单组件
Claude: 好的，这是组件代码...

你: 添加邮箱验证功能
Claude: 已添加邮箱验证...

你: 再加上密码强度检测
Claude: 已添加密码强度检测...
```

### 5. 使用斜杠命令

```
/clear          - 清除对话历史
/new            - 开始新对话
/model          - 切换模型
/help           - 查看帮助
/compact        - 压缩对话上下文
```

---

## 代码操作

### 1. 生成代码并插入

```
步骤：
1. 在编辑器中定位光标
2. 在 Claude 面板输入需求
3. Claude 生成代码
4. 点击 "Apply" 或 "Insert" 按钮插入代码
```

### 2. 选中代码操作

```csharp
// 选中以下代码，右键 → Ask Claude → "添加错误处理"
public void ProcessData(string input)
{
    var data = Parse(input);
    var result = Transform(data);
    Save(result);
}

// Claude 建议：
public Result ProcessData(string input)
{
    try
    {
        if (string.IsNullOrEmpty(input))
            return Result.Error("输入不能为空");

        var data = Parse(input);
        if (data == null)
            return Result.Error("解析失败");

        var result = Transform(data);
        Save(result);
        
        return Result.Success();
    }
    catch (Exception ex)
    {
        Logger.Error(ex, "处理数据时发生错误");
        return Result.Error(ex.Message);
    }
}
```

### 3. 应用代码建议

```
┌─────────────────────────────────────────────────────────┐
│  Claude 建议                                             │
│  ┌─────────────────────────────────────────────────────┐│
│  │  public void ProcessData(string input)              ││
│  │  {                                                  ││
│  │      try                                           ││
│  │      {                                             ││
│  │          // ...                                    ││
│  │      }                                             ││
│  │      catch (Exception ex)                          ││
│  │      {                                             ││
│  │          // ...                                    ││
│  │      }                                             ││
│  │  }                                                  ││
│  └─────────────────────────────────────────────────────┘│
│                                                         │
│  [📋 Copy] [✅ Apply] [❌ Dismiss] [📝 Edit]           │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 4. Diff 视图对比

当应用代码修改时，VSCode 会显示 Diff 视图：

```
┌────────────────────────┬────────────────────────┐
│     原始代码            │     修改后代码          │
├────────────────────────┼────────────────────────┤
│  public void Process() │  public Result Process()│
│  {                     │  {                     │
│      var data = Parse();│     try              │
│      Save(data);       │     {                 │
│  }                     │        var data = Parse();│
│                        │        Save(data);    │
│                        │        return Result.OK();│
│                        │     }                 │
│                        │     catch (Exception) │
│                        │     {                 │
│                        │        // ...         │
│                        │     }                 │
│                        │  }                     │
└────────────────────────┴────────────────────────┘
         [Accept]              [Reject]
```

---

## 终端集成

### 在终端中使用 CLI

```bash
# 启动 Claude Code CLI
claude

# 直接提问
claude "解释什么是闭包"

# 管道输入
cat error.log | claude "分析这个错误日志"

# 处理文件
claude "分析 src/index.ts 文件的代码质量"
```

### 终端模式特点

```
┌─────────────────────────────────────────────────────────┐
│  VSCode 集成终端                                         │
│                                                         │
│  $ claude                                               │
│                                                         │
│  ╭─────────────────────────────────────────────────╮    │
│  │  Claude Code v1.x                               │    │
│  │  Type /help for commands, /exit to quit         │    │
│  ╰─────────────────────────────────────────────────╯    │
│                                                         │
│  > 帮我写一个快速排序                                     │
│                                                         │
│  好的，这是一个 TypeScript 实现的快速排序：               │
│                                                         │
│  function quickSort(arr: number[]): number[] {          │
│      if (arr.length <= 1) return arr;                   │
│      // ...                                            │
│  }                                                     │
│                                                         │
│  [Tab] 接受  [Esc] 拒绝  [↑↓] 浏览                      │
│                                                         │
│  > _                                                   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### CLI 常用命令

```bash
# 查看帮助
claude --help

# 指定模型
claude --model claude-sonnet-4-6

# 使用管道
echo "print hello" | claude "转成 Python 代码"

# 处理文件
claude "优化这个文件" --file src/utils.ts

# 交互模式
claude --interactive
```

---

## 项目上下文管理

### 1. CLAUDE.md 文件

在项目根目录创建 `CLAUDE.md` 文件，用于提供项目上下文：

```markdown
# CLAUDE.md - 项目指南

## 项目概述
这是一个基于 .NET 8 的 Web API 项目

## 技术栈
- C# 12
- ASP.NET Core 8
- Entity Framework Core
- PostgreSQL

## 代码规范
- 使用 PascalCase 命名类和方法
- 使用 camelCase 命名局部变量
- 每个文件只包含一个类
- 所有公共 API 必须有 XML 文档注释

## 项目结构
src/
├── Controllers/     # API 控制器
├── Services/        # 业务逻辑层
├── Models/          # 数据模型
├── Repositories/    # 数据访问层
└── Utils/           # 工具类

## 常用命令
- dotnet build      # 构建项目
- dotnet test       # 运行测试
- dotnet run        # 启动项目

## 注意事项
- 所有 API 端点必须有异常处理
- 使用依赖注入管理服务
- 数据库迁移使用 EF Core Migrations
```

### 2. 自动上下文识别

Claude Code 会自动识别：

```
✓ 打开的文件
✓ 当前编辑的文件
✓ 选中的代码
✓ 项目结构（package.json, *.csproj 等）
✓ Git 状态和历史
✓ 终端输出
✓ 错误信息
✓ 测试结果
```

### 3. 手动添加上下文

```
# 在对话中引用文件
@src/services/userService.ts 分析这个服务的代码

# 引用多个文件
@src/models/user.ts @src/services/userService.ts 
这两个文件之间的关系是什么

# 引用终端输出
@terminal 这个错误怎么解决
```

### 4. .claudeignore 文件

创建 `.claudeignore` 文件排除不需要的文件：

```gitignore
# 依赖目录
node_modules/
vendor/
packages/

# 构建输出
dist/
build/
bin/
obj/

# 环境文件
.env
.env.local

# 敏感文件
*.pem
*.key

# 大型文件
*.zip
*.tar.gz
```

---

## 高级功能

### 1. 多文件编辑

```
你: 重构 UserService，将数据库逻辑提取到 UserRepository

Claude 会：
1. 创建 UserRepository 类
2. 修改 UserService 注入 UserRepository
3. 更新相关依赖
4. 显示所有修改的 Diff
```

### 2. 测试生成

```
你: 为 UserService 编写单元测试

Claude 会：
1. 分析 UserService 的所有公共方法
2. 创建对应的测试文件
3. 为每个方法编写测试用例
4. 包含正常情况和边界情况
```

### 3. 代码审查

```
你: 审查这个 PR 的代码质量

Claude 会分析：
- 代码风格一致性
- 潜在的 bug
- 性能问题
- 安全漏洞
- 测试覆盖率
```

### 4. 文档生成

```
你: 为这个 API 生成 Swagger 文档

你: 根据代码生成 README 文档

你: 为这些函数添加 JSDoc 注释
```

### 5. 代码转换

```
你: 将这个 JavaScript 文件转换为 TypeScript

你: 将这个类组件转换为 React Hooks

你: 将这个 jQuery 代码转换为原生 JS
```

---

## 配置选项

### VSCode Settings.json 配置

```json
{
  // API 配置
  "claude-code.apiKey": "your-api-key",
  "claude-code.model": "claude-sonnet-4-6",
  
  // 界面配置
  "claude-code.theme": "auto",
  "claude-code.fontSize": 14,
  
  // 行为配置
  "claude-code.autoApply": false,
  "claude-code.confirmBeforeApply": true,
  "claude-code.showDiffBeforeApply": true,
  
  // 上下文配置
  "claude-code.maxContextFiles": 20,
  "claude-code.includeGitContext": true,
  
  // 代码生成配置
  "claude-code.defaultLanguage": "typescript",
  "claude-code.includeComments": true,
  "claude-code.codeStyle": "standard"
}
```

### 模型选择

| 模型 | 说明 | 适用场景 |
|------|------|----------|
| `claude-opus-4-8` | 最强模型，高质量输出 | 复杂任务、代码审查 |
| `claude-sonnet-4-6` | 平衡性能和速度（推荐） | 日常编程、快速问答 |
| `claude-haiku-4-5` | 最快响应 | 简单问题、快速查询 |

### 切换模型

```
方式一：命令面板
Ctrl+Shift+P → "Claude Code: Switch Model"

方式二：斜杠命令
/model claude-opus-4-8

方式三：settings.json
"claude-code.model": "claude-sonnet-4-6"
```

---

## 常见问题与解决

### 问题 1：API Key 无效

```
错误: "Invalid API Key"

解决方案:
1. 检查 API Key 是否正确复制
2. 确认 API Key 是否过期
3. 检查账户是否有足够的额度
4. 重新设置: Ctrl+Shift+P → "Claude Code: Set API Key"
```

### 问题 2：响应速度慢

```
原因分析:
- 网络延迟
- 请求的上下文过大
- 选择了较慢的模型

解决方案:
1. 检查网络连接
2. 减少引用的文件数量
3. 使用 /compact 压缩对话
4. 切换到更快的模型 (haiku)
```

### 问题 3：代码建议不准确

```
解决方案:
1. 提供更详细的描述
2. 引用相关的文件作为上下文
3. 分步骤请求
4. 指定编程语言和框架版本
```

### 问题 4：无法应用代码

```
错误: "Failed to apply changes"

解决方案:
1. 确保文件未被锁定
2. 检查文件是否有语法错误
3. 尝试手动复制代码
4. 重启 VSCode
```

### 问题 5：上下文丢失

```
原因: 对话过长导致上下文被截断

解决方案:
1. 使用 /new 开始新对话
2. 使用 /compact 压缩历史
3. 在新对话中重新引用关键文件
4. 使用 CLAUDE.md 持久化项目信息
```

---

## 最佳实践

### 1. 清晰的提问方式

```
❌ 不好的提问:
"这段代码有问题"

✅ 好的提问:
"这段代码在处理大数据集时内存溢出，请分析原因并提供优化方案"

✅ 更好的提问:
"这段代码在处理超过 10MB 的 CSV 文件时出现 OutOfMemoryException，
请分析内存使用问题，提供流式处理的优化方案，使用 C#"
```

### 2. 分步骤请求

```
步骤 1: "分析这个类的职责和依赖关系"
步骤 2: "建议如何重构这个类"
步骤 3: "按照建议进行重构"
步骤 4: "为重构后的代码编写测试"
```

### 3. 提供足够上下文

```
✅ 好的做法:

"我正在开发一个 ASP.NET Core 8 Web API 项目，
使用 Entity Framework Core 和 PostgreSQL。

@src/Services/UserService.cs 
@src/Models/User.cs

请为 UserService 添加分页查询功能，
支持按用户名和邮箱搜索，
返回 PagedResult<UserDto>"
```

### 4. 验证代码建议

```
1. 仔细阅读 Claude 生成的代码
2. 确保理解每行代码的作用
3. 运行测试验证功能
4. 检查边界情况
5. 确认符合项目规范
```

### 5. 使用 CLAUDE.md 维护项目信息

```markdown
# 定期更新 CLAUDE.md 文件
# 包含：
- 项目架构变化
- 新的技术决策
- 常见问题和解决方案
- 团队代码规范
```

### 6. 对话管理

```
- 一个任务一个对话
- 完成后使用 /clear 清除
- 复杂任务使用 /new 重新开始
- 定期使用 /compact 压缩历史
```

---

## 使用场景示例

### 场景 1：创建新功能

```
你: 我需要在用户管理系统中添加"用户角色管理"功能，包括：
1. 角色 CRUD API
2. 用户角色分配
3. 基于角色的权限控制
请帮我设计数据模型和 API 结构。

Claude: 好的，我来为你设计...

你: 好的，请先创建 Role 模型和相关的 Entity Framework 配置

Claude: [生成代码...]

你: 接下来创建 RoleController

Claude: [生成代码...]

你: 添加角色分配的服务层逻辑

Claude: [生成代码...]
```

### 场景 2：调试问题

```
你: @terminal 
这个错误怎么解决：System.NullReferenceException: Object reference not set to an instance of an object.

Claude: 这个空引用异常发生在第 45 行，原因是...

你: 请帮我修复这个问题

Claude: [提供修复代码...]
```

### 场景 3：代码审查

```
你: @src/services/paymentService.ts 
审查这个支付服务的代码，重点关注：
1. 安全性
2. 错误处理
3. 并发处理
4. 日志记录

Claude: 代码审查结果如下：
1. 安全问题：...
2. 错误处理问题：...
3. 并发问题：...
4. 日志建议：...
```

### 场景 4：学习新技术

```
你: 我想学习 React Hooks，请用示例代码解释：
1. useState
2. useEffect
3. useContext
4. 自定义 Hook

Claude: 好的，我来逐一解释...
```

---

## 资源链接

### 官方资源

| 资源 | 链接 |
|------|------|
| Anthropic 官网 | [https://www.anthropic.com](https://www.anthropic.com) |
| Claude Code 文档 | [https://docs.anthropic.com](https://docs.anthropic.com) |
| API 控制台 | [https://console.anthropic.com](https://console.anthropic.com) |
| GitHub 仓库 | [https://github.com/anthropics/claude-code](https://github.com/anthropics/claude-code) |

### 社区资源

| 资源 | 说明 |
|------|------|
| Stack Overflow | 搜索 "claude-code" 标签 |
| GitHub Issues | 报告 bug 和功能请求 |
| Discord | Anthropic 社区讨论 |

### 学习资源

- [Anthropic 官方教程](https://docs.anthropic.com)
- [Claude Code 示例项目](https://github.com/anthropics/claude-code-examples)
- [最佳实践指南](https://docs.anthropic.com/en/docs/claude-code/best-practices)

---

## 附录：快捷键速查表

### 通用快捷键

| 操作 | Windows/Linux | Mac |
|------|---------------|-----|
| 打开命令面板 | `Ctrl+Shift+P` | `Cmd+Shift+P` |
| 打开 Claude 面板 | `Ctrl+Shift+L` | `Cmd+Shift+L` |
| 发送消息 | `Enter` | `Enter` |
| 换行 | `Shift+Enter` | `Shift+Enter` |
| 清除对话 | `Ctrl+L` | `Cmd+L` |
| 取消生成 | `Esc` | `Esc` |
| 浏览历史 | `↑` / `↓` | `↑` / `↓` |

### 编辑器快捷键

| 操作 | Windows/Linux | Mac |
|------|---------------|-----|
| 选中并询问 | `Ctrl+Shift+L` | `Cmd+Shift+L` |
| 应用建议 | `Tab` | `Tab` |
| 拒绝建议 | `Esc` | `Esc` |
| 查看 Diff | `Ctrl+Shift+D` | `Cmd+Shift+D` |

### 终端快捷键

| 操作 | Windows/Linux | Mac |
|------|---------------|-----|
| 启动 CLI | `claude` | `claude` |
| 接受建议 | `Tab` | `Tab` |
| 拒绝建议 | `Esc` | `Esc` |
| 清除屏幕 | `Ctrl+L` | `Cmd+L` |

---

## 版本历史

| 版本 | 日期 | 更新内容 |
|------|------|----------|
| 1.0 | 2025-03 | 初始发布 |
| 1.1 | 2025-06 | 添加多文件编辑 |
| 1.2 | 2025-09 | 改进上下文管理 |
| 2.0 | 2026-01 | 重大更新，性能优化 |

---

**文档版本**：1.0
**最后更新**：2026-05-31
**适用版本**：Claude Code for VSCode 1.x+

**反馈与建议**：如有问题或建议，请访问 [GitHub Issues](https://github.com/anthropics/claude-code/issues)
