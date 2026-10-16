# VS Code 中开发 C# 项目完整指南

---

## 一、环境准备

### 1. 安装 .NET SDK

前往 [dotnet.microsoft.com](https://dotnet.microsoft.com/download) 下载安装。

```powershell
# 安装后验证
dotnet --version
dotnet --list-sdks
```

### 2. 安装 VS Code 扩展

在 VS Code 左侧扩展面板（`Ctrl+Shift+X`）搜索安装：

| 扩展名 | 用途 | 必装 |
|--------|------|:--:|
| **C# Dev Kit** | 官方 C# 开发套件（智能提示、调试、项目管理） | ⭐ |
| **C#** | 基础语法高亮和代码补全 | ⭐ |
| **.NET Install Tool** | 管理 .NET SDK 版本 | 推荐 |
| **NuGet Gallery** | 可视化管理 NuGet 包 | 推荐 |
| **SQLite Viewer** | 查看 SQLite 数据库（如用到） | 可选 |

> **注意**：C# Dev Kit 安装后会自动装上 C# 扩展，两个都要启用。

---

## 二、创建项目

### 方式一：终端命令（推荐）

```powershell
# 1. 打开 VS Code 终端 Ctrl+`
# 2. 创建解决方案和项目

# Web API 项目
dotnet new webapi -n MyApi

# 控制台项目
dotnet new console -n MyApp

# Blazor WebAssembly
dotnet new blazorwasm -n MyBlazorApp

# 类库
dotnet new classlib -n MyLibrary

# 查看所有模板
dotnet new list
```

### 方式二：VS Code 界面创建

1. `Ctrl+Shift+P` → 输入 `.NET: New Project`
2. 选择项目模板
3. 输入项目名称和路径
4. 自动生成并打开

### 常用项目模板速查

```powershell
dotnet new webapi       # Web API（RESTful 后端）
dotnet new mvc          # MVC Web 应用
dotnet new blazor       # Blazor 全栈
dotnet new console      # 控制台应用
dotnet new classlib     # 类库
dotnet new xunit        # xUnit 测试项目
dotnet new sln          # 解决方案文件
```

---

## 三、解决方案管理

### 典型项目结构

```
MySolution/
├── MySolution.sln              # 解决方案文件
├── src/
│   ├── MyApp.Web/              # Web API 项目
│   │   ├── Controllers/
│   │   ├── Program.cs
│   │   └── MyApp.Web.csproj
│   ├── MyApp.Core/             # 核心业务层
│   │   └── MyApp.Core.csproj
│   └── MyApp.Data/             # 数据访问层
│       └── MyApp.Data.csproj
└── tests/
    └── MyApp.Tests/            # 单元测试
        └── MyApp.Tests.csproj
```

### 常用命令

```powershell
# 创建解决方案
dotnet new sln -n MySolution

# 将项目添加到解决方案
dotnet sln add src/MyApp.Web/MyApp.Web.csproj
dotnet sln add src/MyApp.Core/MyApp.Core.csproj

# 项目间添加引用
dotnet add src/MyApp.Web/MyApp.Web.csproj reference src/MyApp.Core/MyApp.Core.csproj

# 安装 NuGet 包
dotnet add package Microsoft.EntityFrameworkCore.SqlServer
```

---

## 四、运行与调试

### 运行项目

```powershell
# 在项目目录下
dotnet run

# 热重载（文件保存自动刷新）
dotnet watch run

# 指定环境
dotnet run --environment Development
```

### 调试项目

**方法一：F5 一键调试**
1. 打开 `.cs` 文件
2. 按 `F5` → 选择 `C#`
3. 自动生成 `.vscode/launch.json`
4. 设断点（单击行号左侧）→ 再按 `F5`

**方法二：解决方案视图调试**
1. 左侧点击 C# Dev Kit 的 **解决方案资源管理器**
2. 右键项目 → **调试** → **启动新实例**

### launch.json 示例

```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "Launch WebAPI",
            "type": "dotnet",
            "request": "launch",
            "projectPath": "${workspaceFolder}/src/MyApp.Web/MyApp.Web.csproj",
            "launchBrowser": {
                "enabled": true,
                "args": "${auto-detect-url}",
                "windows": {
                    "command": "cmd.exe",
                    "args": "/C start ${auto-detect-url}"
                }
            }
        }
    ]
}
```

### 调试快捷键

| 快捷键 | 功能 |
|--------|------|
| `F5` | 开始调试 |
| `Shift+F5` | 停止调试 |
| `F9` | 切换断点 |
| `F10` | 逐过程（Step Over） |
| `F11` | 逐语句（Step Into） |
| `Shift+F11` | 跳出（Step Out） |
| `F5`（调试中） | 继续执行到下一个断点 |

---

## 五、代码编辑高效技巧

### IntelliSense 智能提示

- `.` 自动弹出成员列表
- `Ctrl+Space` 手动触发补全
- 输入 `ctor` + Tab → 自动生成构造函数
- 输入 `prop` + Tab → 自动生成属性

### 代码导航

| 快捷键 | 功能 |
|--------|------|
| `F12` | 跳转到定义 |
| `Alt+F12` | 速览定义（不跳转） |
| `Shift+F12` | 查找所有引用 |
| `Ctrl+-` | 返回上一个位置 |
| `Ctrl+T` | 搜索符号（类/方法/变量） |
| `Ctrl+Shift+O` | 当前文件符号导航 |

### 重构快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl+.` 或 `Alt+Enter` | 快速修复/重构建议 |
| `F2` | 重命名符号 |
| `Ctrl+R, M` | 提取方法 |

### 多光标编辑

| 快捷键 | 功能 |
|--------|------|
| `Alt+Click` | 添加光标 |
| `Ctrl+Alt+↑/↓` | 向上/下添加光标 |
| `Ctrl+Shift+L` | 选中所有相同文本 |
| `Ctrl+D` | 选中下一个相同文本 |

---

## 六、NuGet 包管理

### 命令行方式

```powershell
# 安装包
dotnet add package Newtonsoft.Json

# 安装指定版本
dotnet add package Microsoft.EntityFrameworkCore --version 8.0.0

# 列出已安装的包
dotnet list package

# 移除包
dotnet remove package Newtonsoft.Json

# 更新所有包
dotnet list package --outdated
dotnet outdated --upgrade
```

### GUI 方式（NuGet Gallery 扩展）

1. `Ctrl+Shift+P` → `NuGet: Open NuGet Gallery`
2. 搜索包 → 选择版本 → 点击安装

---

## 七、常用 VS Code 设置

### 推荐 settings.json

```json
{
    // C# 相关
    "editor.formatOnSave": true,
    "[csharp]": {
        "editor.defaultFormatter": "ms-dotnettools.csharp",
        "editor.tabSize": 4
    },
    // 自动 using
    "dotnet.completion.showCompletionItemsFromUnimportedNamespaces": true,
    // 代码风格
    "omnisharp.enableRoslynAnalyzers": true,
    "omnisharp.organizeImportsOnFormat": true,
    // 终端
    "terminal.integrated.defaultProfile.windows": "PowerShell"
}
```

---

## 八、EF Core 数据库操作

### 常用命令

```powershell
# 安装 EF Core 工具
dotnet tool install --global dotnet-ef

# 添加迁移
dotnet ef migrations add InitialCreate

# 更新数据库
dotnet ef database update

# 删除最后一条迁移
dotnet ef migrations remove

# 生成 SQL 脚本
dotnet ef migrations script

# 列出所有迁移
dotnet ef migrations list
```

### VS Code 中查看数据库

1. 安装 **SQLite Viewer** 扩展
2. 右键 `.db` 文件 → `Open Database`
3. 直接在 VS Code 里浏览表和数据

---

## 九、Git 版本控制

VS Code 内置 Git 支持，左侧第三个图标即源代码管理：

| 操作 | 方式 |
|------|------|
| 提交 | 左侧 Git 面板 → 输入消息 → 点 ✅ |
| 推送 | 左下角状态栏点 `↑` 图标 |
| 拉取 | 左下角状态栏点 `↓` 图标 |
| 查看差异 | 双击修改过的文件 |
| 解决冲突 | 点击冲突文件 → 选择保留版本 |

### .gitignore 模板（C# 项目）

```gitignore
bin/
obj/
.vs/
*.user
*.suo
*.DotSettings
*.db
appsettings.*.json
!appsettings.json
```

> 生成方式：`dotnet new gitignore`

---

## 十、快捷工作流总结

```
创建项目   →  dotnet new webapi -n MyApp
打开项目   →  code MyApp
安装依赖   →  dotnet add package xxx
编写代码   →  Ctrl+. 善用重构
运行       →  dotnet watch run
调试       →  F5 打断点
提交代码   →  Git 面板一键提交
```

---

## 十一、常见问题排查

| 问题 | 解决 |
|------|------|
| 没智能提示 | `Ctrl+Shift+P` → `Restart OmniSharp` |
| 调试报错找不到 SDK | 确认 `dotnet --list-sdks` 不为空 |
| IntelliSense 卡顿 | `Ctrl+Shift+P` → `Developer: Reload Window` |
| NuGet 包恢复失败 | `dotnet restore` 手动恢复 |
| C# Dev Kit 不工作 | 检查是否登录了 GitHub 账号（Dev Kit 需要） |
