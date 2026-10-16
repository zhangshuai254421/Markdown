# WPF 命令使用指南

## 目录

1. [命令概述](#命令概述)
2. [命令四要素](#命令四要素)
3. [内置命令](#内置命令)
4. [自定义命令](#自定义命令)
5. [命令绑定 (CommandBinding)](#命令绑定-commandbinding)
6. [MVVM 中的命令模式](#mvvm-中的命令模式)
7. [带参数的命令](#带参数的命令)
8. [复合命令 / 事件聚合](#复合命令--事件聚合)
9. [最佳实践](#最佳实践)

---

## 命令概述

WPF 命令系统提供了一种将**用户操作（UI 输入）**与**业务逻辑**解耦的机制。与直接使用 `Click` 事件不同，命令具有以下优势：

| 特性 | 事件 (Click) | 命令 (Command) |
|------|-------------|----------------|
| 解耦 | UI 与逻辑紧密耦合 | UI 与逻辑完全分离 |
| 可用性控制 | 需手动 Enable/Disable | 自动通过 `CanExecute` 控制 |
| 多处触发 | 需为每个控件绑定事件 | 一个命令可被多个控件共享 |
| 快捷键 | 需额外处理 | 内置 `InputGesture` 支持 |
| 可测试性 | 难以单元测试 | 易于单独测试 |

---

## 命令四要素

WPF 命令系统由四个核心部分组成：

```
┌──────────────────────────────────────────────────────────┐
│                    WPF Command System                     │
├──────────────┬───────────────┬──────────────┬────────────┤
│   Command    │ CommandSource │ CommandTarget│CommandBinding│
│   (命令)     │  (命令源)     │  (命令目标)  │ (命令绑定)  │
├──────────────┼───────────────┼──────────────┼────────────┤
│ 定义"做什么" │ 触发命令的    │ 命令作用于   │ 关联命令与  │
│ ICommand     │ UI 控件       │ 哪个元素     │ 执行逻辑    │
│              │ Button,       │ 获得焦点的   │ Executed +  │
│              │ MenuItem,     │ 元素,或指    │ CanExecute  │
│              │ KeyBinding    │ 定的目标     │             │
└──────────────┴───────────────┴──────────────┴────────────┘
```

### 1. Command（命令）

实现 `ICommand` 接口的对象，包含两个核心方法：

```csharp
public interface ICommand
{
    event EventHandler CanExecuteChanged;
    bool CanExecute(object parameter);   // 判断命令是否可执行
    void Execute(object parameter);      // 执行命令逻辑
}
```

### 2. CommandSource（命令源）

触发命令的 UI 元素，任何实现 `ICommandSource` 接口的控件都可以作为命令源：

- `Button`、`ToggleButton`、`RadioButton`
- `MenuItem`、`Hyperlink`
- `KeyBinding`、`MouseBinding`

```xml
<!-- Button 是最常用的命令源 -->
<Button Command="{Binding SaveCommand}" Content="保存" />

<!-- 通过 Command 属性关联命令 -->
<MenuItem Command="ApplicationCommands.Copy" />
```

### 3. CommandTarget（命令目标）

命令作用的对象。WPF 通过**路由事件**机制，从命令源沿元素树向上冒泡查找 `CommandBinding`：

```xml
<!-- 指定命令目标为某个 TextBox -->
<Button Command="ApplicationCommands.Paste" 
        CommandTarget="{Binding ElementName=targetTextBox}" 
        Content="粘贴到此" />
<TextBox x:Name="targetTextBox" />
```

### 4. CommandBinding（命令绑定）

将命令与实际的执行逻辑（`Executed` 和 `CanExecute` 处理程序）关联起来：

```xml
<Window.CommandBindings>
    <CommandBinding Command="ApplicationCommands.Open" 
                    Executed="OpenCommand_Executed"
                    CanExecute="OpenCommand_CanExecute" />
</Window.CommandBindings>
```

---

## 内置命令

WPF 提供了五组内置静态命令类，封装了常见的应用程序操作。

### ApplicationCommands（应用程序命令）

| 命令 | 默认快捷键 | 说明 |
|------|-----------|------|
| `New` | Ctrl+N | 新建 |
| `Open` | Ctrl+O | 打开 |
| `Save` | Ctrl+S | 保存 |
| `SaveAs` | — | 另存为 |
| `Print` | Ctrl+P | 打印 |
| `PrintPreview` | — | 打印预览 |
| `Close` | — | 关闭 |
| `Cut` | Ctrl+X | 剪切 |
| `Copy` | Ctrl+C | 复制 |
| `Paste` | Ctrl+V | 粘贴 |
| `Delete` | Del | 删除 |
| `Undo` | Ctrl+Z | 撤销 |
| `Redo` | Ctrl+Y | 重做 |
| `Find` | Ctrl+F | 查找 |
| `Replace` | Ctrl+H | 替换 |
| `SelectAll` | Ctrl+A | 全选 |
| `Stop` | Esc | 停止 |
| `Help` | F1 | 帮助 |

### NavigationCommands（导航命令）

| 命令 | 默认快捷键 | 说明 |
|------|-----------|------|
| `BrowseBack` | — | 后退 |
| `BrowseForward` | — | 前进 |
| `Refresh` | F5 | 刷新 |
| `Search` | — | 搜索 |
| `FirstPage` | — | 首页 |
| `LastPage` | — | 末页 |
| `NextPage` | — | 下一页 |
| `PreviousPage` | — | 上一页 |
| `GoToPage` | — | 跳转到页 |

### EditingCommands（编辑命令）

提供丰富的文本编辑命令，如 `ToggleBold`、`ToggleItalic`、`AlignLeft`、`AlignCenter`、`IncreaseFontSize` 等。

### ComponentCommands（组件命令）

| 命令 | 说明 |
|------|------|
| `MoveLeft` / `MoveRight` / `MoveUp` / `MoveDown` | 移动选中项 |
| `ScrollPageUp` / `ScrollPageDown` | 滚动 |
| `SelectToEnd` / `SelectToHome` | 选择范围 |
| `ExtendSelectionLeft` / `ExtendSelectionRight` | 扩展选择 |

### MediaCommands（媒体命令）

播放控制命令：`Play`、`Pause`、`Stop`、`Record`、`NextTrack`、`PreviousTrack`、`IncreaseVolume` 等。

### 内置命令使用示例

```xml
<Window x:Class="Demo.MainWindow"
        xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        Title="内置命令示例">

    <!-- 定义命令绑定 -->
    <Window.CommandBindings>
        <CommandBinding Command="ApplicationCommands.Open" 
                        Executed="OpenCommand_Executed"
                        CanExecute="OpenCommand_CanExecute" />
        <CommandBinding Command="ApplicationCommands.Save" 
                        Executed="SaveCommand_Executed"
                        CanExecute="SaveCommand_CanExecute" />
    </Window.CommandBindings>

    <DockPanel>
        <!-- 工具栏按钮直接关联内置命令 -->
        <ToolBar DockPanel.Dock="Top">
            <Button Command="ApplicationCommands.Open" Content="打开" />
            <Button Command="ApplicationCommands.Save" Content="保存" />
        </ToolBar>

        <!-- 菜单关联内置命令 -->
        <Menu DockPanel.Dock="Top">
            <MenuItem Header="文件">
                <MenuItem Command="ApplicationCommands.Open" />
                <MenuItem Command="ApplicationCommands.Save" />
                <Separator />
                <MenuItem Command="ApplicationCommands.Close" />
            </MenuItem>
        </Menu>

        <TextBox AcceptsReturn="True" />
    </DockPanel>
</Window>
```

```csharp
// 后台代码
private void OpenCommand_Executed(object sender, ExecutedRoutedEventArgs e)
{
    var dialog = new OpenFileDialog();
    if (dialog.ShowDialog() == true)
    {
        // 打开文件逻辑
    }
}

private void OpenCommand_CanExecute(object sender, CanExecuteRoutedEventArgs e)
{
    e.CanExecute = true;  // 或根据条件判断
}
```

> **注意**：部分控件（如 `TextBox`、`RichTextBox`）已为常用编辑命令内置了 `CommandBinding`，无需额外绑定即可使用 `Ctrl+C`、`Ctrl+V` 等快捷键。

---

## 自定义命令

### 方式一：实现 ICommand 接口

```csharp
using System;
using System.Windows.Input;

/// <summary>
/// 最简 RelayCommand：将 Execute 和 CanExecute 委托给外部方法
/// </summary>
public class RelayCommand : ICommand
{
    private readonly Action<object> _execute;
    private readonly Predicate<object> _canExecute;

    public RelayCommand(Action<object> execute, Predicate<object> canExecute = null)
    {
        _execute = execute ?? throw new ArgumentNullException(nameof(execute));
        _canExecute = canExecute;
    }

    public bool CanExecute(object parameter)
    {
        return _canExecute == null || _canExecute(parameter);
    }

    public void Execute(object parameter)
    {
        _execute(parameter);
    }

    public event EventHandler CanExecuteChanged
    {
        add => CommandManager.RequerySuggested += value;
        remove => CommandManager.RequerySuggested -= value;
    }

    /// <summary>
    /// 手动触发 CanExecuteChanged，强制重新查询 CanExecute 状态
    /// </summary>
    public void RaiseCanExecuteChanged()
    {
        CommandManager.InvalidateRequerySuggested();
    }
}
```

### 方式二：无参数版本（常用）

```csharp
public class RelayCommand : ICommand
{
    private readonly Action _execute;
    private readonly Func<bool> _canExecute;

    public RelayCommand(Action execute, Func<bool> canExecute = null)
    {
        _execute = execute;
        _canExecute = canExecute;
    }

    public bool CanExecute(object parameter) => _canExecute?.Invoke() ?? true;
    public void Execute(object parameter) => _execute();

    public event EventHandler CanExecuteChanged
    {
        add => CommandManager.RequerySuggested += value;
        remove => CommandManager.RequerySuggested -= value;
    }

    public void RaiseCanExecuteChanged()
    {
        CommandManager.InvalidateRequerySuggested();
    }
}
```

### 方式三：泛型 RelayCommand（带参数）

```csharp
public class RelayCommand<T> : ICommand
{
    private readonly Action<T> _execute;
    private readonly Predicate<T> _canExecute;

    public RelayCommand(Action<T> execute, Predicate<T> canExecute = null)
    {
        _execute = execute ?? throw new ArgumentNullException(nameof(execute));
        _canExecute = canExecute;
    }

    public bool CanExecute(object parameter)
    {
        if (parameter is T typedParam)
            return _canExecute?.Invoke(typedParam) ?? true;
        return _canExecute == null; // 无参数时允许
    }

    public void Execute(object parameter)
    {
        if (parameter is T typedParam)
            _execute(typedParam);
    }

    public event EventHandler CanExecuteChanged
    {
        add => CommandManager.RequerySuggested += value;
        remove => CommandManager.RequerySuggested -= value;
    }

    public void RaiseCanExecuteChanged()
    {
        CommandManager.InvalidateRequerySuggested();
    }
}
```

### 方式四：异步命令（推荐用于 MVVM）

```csharp
using System;
using System.Threading.Tasks;
using System.Windows.Input;

public class AsyncRelayCommand : ICommand
{
    private readonly Func<Task> _execute;
    private readonly Func<bool> _canExecute;
    private bool _isExecuting;

    public AsyncRelayCommand(Func<Task> execute, Func<bool> canExecute = null)
    {
        _execute = execute;
        _canExecute = canExecute;
    }

    public bool CanExecute(object parameter)
    {
        return !_isExecuting && (_canExecute?.Invoke() ?? true);
    }

    public async void Execute(object parameter)
    {
        if (_isExecuting) return;
        
        _isExecuting = true;
        RaiseCanExecuteChanged();
        
        try
        {
            await _execute();
        }
        finally
        {
            _isExecuting = false;
            RaiseCanExecuteChanged();
        }
    }

    public event EventHandler CanExecuteChanged;

    public void RaiseCanExecuteChanged()
    {
        CanExecuteChanged?.Invoke(this, EventArgs.Empty);
    }
}
```

---

## 命令绑定 (CommandBinding)

### XAML 声明方式

```xml
<Window x:Class="Demo.MainWindow"
        xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        xmlns:local="clr-namespace:Demo">

    <Window.CommandBindings>
        <!-- 绑定内置命令 -->
        <CommandBinding Command="ApplicationCommands.New" 
                        Executed="NewCommand_Executed"
                        CanExecute="NewCommand_CanExecute" />
        
        <!-- 绑定自定义命令 -->
        <CommandBinding Command="{x:Static local:AppCommands.ExportData}" 
                        Executed="ExportCommand_Executed" />
    </Window.CommandBindings>

    <StackPanel>
        <Button Command="ApplicationCommands.New" Content="新建" />
        <Button Command="{x:Static local:AppCommands.ExportData}" Content="导出" />
    </StackPanel>
</Window>
```

### C# 代码方式

```csharp
// 创建自定义命令
public static class AppCommands
{
    public static readonly RoutedUICommand ExportData = new RoutedUICommand(
        "导出数据",           // 显示文本
        "ExportData",         // 命令名称
        typeof(AppCommands),  // 所有者类型
        new InputGestureCollection
        {
            new KeyGesture(Key.E, ModifierKeys.Control | ModifierKeys.Shift)
        }
    );
}

// 在代码中注册绑定
public MainWindow()
{
    InitializeComponent();

    var exportBinding = new CommandBinding(
        AppCommands.ExportData,
        (s, e) => ExportData();           // Executed
        (s, e) => e.CanExecute = true     // CanExecute
    );

    this.CommandBindings.Add(exportBinding);
}
```

---

## MVVM 中的命令模式

### 基础 ViewModel 示例

```csharp
using System.ComponentModel;
using System.Runtime.CompilerServices;
using System.Windows.Input;

public class MainViewModel : INotifyPropertyChanged
{
    private string _userName;
    private bool _isDirty;

    public string UserName
    {
        get => _userName;
        set { _userName = value; OnPropertyChanged(); }
    }

    public bool IsDirty
    {
        get => _isDirty;
        set { _isDirty = value; OnPropertyChanged(); }
    }

    // ===== 命令定义 =====
    public ICommand SaveCommand { get; }
    public ICommand ResetCommand { get; }
    public ICommand OpenUrlCommand { get; }

    public MainViewModel()
    {
        SaveCommand = new RelayCommand(
            execute: () => SaveData(),
            canExecute: () => IsDirty  // 只在有未保存更改时可执行
        );

        ResetCommand = new RelayCommand(
            execute: ResetData,
            canExecute: () => IsDirty
        );

        OpenUrlCommand = new RelayCommand<string>(
            execute: url => System.Diagnostics.Process.Start(url)
        );
    }

    private void SaveData()
    {
        // 保存逻辑...
        IsDirty = false;
        // CanExecute 会自动更新，因为 CommandManager 监听了 UI 事件
    }

    private void ResetData()
    {
        UserName = string.Empty;
        IsDirty = false;
    }

    // INotifyPropertyChanged 实现
    public event PropertyChangedEventHandler PropertyChanged;
    protected void OnPropertyChanged([CallerMemberName] string name = null)
    {
        PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(name));
    }
}
```

### XAML 绑定

```xml
<Window x:Class="Demo.MainWindow"
        xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        xmlns:local="clr-namespace:Demo">

    <Window.DataContext>
        <local:MainViewModel />
    </Window.DataContext>

    <StackPanel Margin="20">
        <TextBox Text="{Binding UserName, UpdateSourceTrigger=PropertyChanged}" 
                 Margin="0,0,0,10" />

        <!-- 普通命令绑定 -->
        <Button Command="{Binding SaveCommand}" Content="保存" Margin="0,5" />
        <Button Command="{Binding ResetCommand}" Content="重置" Margin="0,5" />

        <!-- 带参数的命令绑定：使用 CommandParameter -->
        <Button Command="{Binding OpenUrlCommand}"
                CommandParameter="https://learn.microsoft.com/"
                Content="打开文档" Margin="0,5" />

        <!-- 按钮自动禁用：当 CanExecute 返回 false 时 -->
        <!-- 保存/重置按钮在 IsDirty 为 false 时会自动灰掉 -->
    </StackPanel>
</Window>
```

### CommandManager 原理

`CommandManager.RequerySuggested` 是一个静态事件，当 WPF 检测到可能影响命令可用性的 **UI 交互**（焦点变化、按键、鼠标点击等）时触发。MVVM 中常见的问题是：纯数据变更（如修改属性）不会自动触发 `CanExecute` 重新查询。

**解决方案**：

```csharp
// 方案一：在属性变更时手动通知
set 
{ 
    _isDirty = value; 
    OnPropertyChanged();
    // 注意：RelayCommand 需要暴露 RaiseCanExecuteChanged
    ((RelayCommand)SaveCommand).RaiseCanExecuteChanged();
}

// 方案二：使用更现代的实现（不在构造函数中创建，改为属性 getter）
// 每次都返回新 RelayCommand（不推荐，有性能损耗）

// 方案三：使用 CommunityToolkit.Mvvm（推荐，见下文）
```

---

## 带参数的命令

### CommandParameter 的多种用法

```xml
<!-- 1. 静态字符串参数 -->
<Button Command="{Binding MyCommand}" 
        CommandParameter="Hello" />

<!-- 2. 绑定到其他控件的属性 -->
<Button Command="{Binding SearchCommand}"
        CommandParameter="{Binding Text, ElementName=searchBox}" />
<TextBox x:Name="searchBox" />

<!-- 3. 绑定到 DataContext 的属性 -->
<Button Command="{Binding DeleteCommand}"
        CommandParameter="{Binding SelectedItem}" />

<!-- 4. 使用 MarkupExtension 传递复杂值 -->
<Button Command="{Binding NavigateCommand}">
    <Button.CommandParameter>
        <local:NavInfo Page="Settings" Id="123" />
    </Button.CommandParameter>
</Button>
```

### MultiCommandParameter（多个参数）

```csharp
/// <summary>
/// 使用 Tuple 传递多个参数（C# 7.0+）
/// </summary>
public ICommand DeleteUserCommand { get; }

public MainViewModel()
{
    DeleteUserCommand = new RelayCommand<(int UserId, string UserName)>(
        execute: tuple => DeleteUser(tuple.UserId, tuple.UserName),
        canExecute: tuple => !string.IsNullOrEmpty(tuple.UserName)
    );
}

private void DeleteUser(int userId, string userName)
{
    // 删除逻辑
}
```

```xml
<!-- XAML 中使用 x:Array 组合参数（不推荐，仅作参考） -->
<!-- 更好的做法是在 ViewModel 中组合参数 -->
```

---

## 常用 MVVM 框架的命令支持

### CommunityToolkit.Mvvm（微软官方）

```csharp
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;

public partial class MainViewModel : ObservableObject
{
    [ObservableProperty]
    private string _userName;

    [ObservableProperty]
    [NotifyCanExecuteChangedFor(nameof(SaveCommand))]
    private bool _isDirty;

    /// <summary>
    /// [RelayCommand] 自动生成 SaveCommand 属性
    /// </summary>
    [RelayCommand(CanExecute = nameof(CanSave))]
    private void Save()
    {
        // 保存逻辑
        IsDirty = false;
    }

    private bool CanSave() => IsDirty;

    /// <summary>
    /// 异步命令
    /// </summary>
    [RelayCommand]
    private async Task LoadDataAsync()
    {
        // await ...
    }

    /// <summary>
    /// 带参数的命令
    /// </summary>
    [RelayCommand]
    private void DeleteItem(string itemId)
    {
        // 删除指定项
    }
}
```

### Prism（DelegateCommand）

```csharp
using Prism.Commands;
using Prism.Mvvm;

public class MainViewModel : BindableBase
{
    public DelegateCommand SaveCommand { get; }
    public DelegateCommand<string> NavigateCommand { get; }

    public MainViewModel()
    {
        SaveCommand = new DelegateCommand(
            () => Save(),
            () => IsDirty
        );

        // 观察属性变化自动刷新 CanExecute
        SaveCommand.ObservesProperty(() => IsDirty);

        NavigateCommand = new DelegateCommand<string>(
            viewName => Navigate(viewName),
            viewName => !string.IsNullOrEmpty(viewName)
        );
    }
}
```

---

## 路由事件与命令路由（深入详解）

### 1. 什么是路由事件（Routed Event）

WPF 的路由事件不同于 .NET 普通事件（CLR Event）。普通事件只在**拥有者**身上触发，而路由事件可以在**整棵元素树**中向上或向下传播，沿途任意节点都能响应。

```
┌──────────────────────────────────────────────────────────┐
│              逻辑树 (Logical Tree)                         │
│                                                          │
│                        Window                             │
│                        │    ↑                             │
│                ┌───────┴────┴───────┐                     │
│                │       Grid         │                     │
│                │    │         ↑     │                     │
│                │  ┌─┴────┐ ┌──┴───┐ │                     │
│                │  │Stack │ │Dock  │ │                     │
│                │  │Panel │ │Panel │ │                     │
│                │  │ │ ↑  │ │      │ │                     │
│                │  │Button│ │      │ │                     │
│                │  └──────┘ └──────┘ │                     │
│                └───────────────────┘                      │
│                                                          │
│   ←  Tunnel（隧道/预览）：从根向下，沿途触发 Preview 事件    │
│   →  Bubble（冒泡）：从源头向上，沿途触发普通事件            │
└──────────────────────────────────────────────────────────┘
```

### 2. 三种路由策略

| 策略 | 枚举值 | 传播方向 | 用途 |
|------|--------|---------|------|
| **Tunneling（隧道）** | `RoutingStrategy.Tunnel` | 根元素 → 事件源 | 预览/拦截/预处理（事件名前加 `Preview`） |
| **Bubbling（冒泡）** | `RoutingStrategy.Bubble` | 事件源 → 根元素 | 默认行为，命令执行的主要策略 |
| **Direct（直接）** | `RoutingStrategy.Direct` | 仅事件源自己 | 不传播，等同 CLR 事件 |

> **命名惯例**：隧道事件以 `Preview` 开头（如 `PreviewMouseDown`），冒泡事件不加前缀（如 `MouseDown`）。

### 3. WPF 命令如何利用路由事件

命令系统内部使用了**两个**路由事件来驱动整个机制：

| 路由事件 | 路由策略 | 触发时机 | 作用 |
|----------|---------|---------|------|
| `CommandManager.PreviewExecutedEvent` | Tunneling | 命令即将执行前 | 给上层元素**拦截**的机会 |
| `CommandManager.ExecutedEvent` | Bubbling | 命令执行时 | 沿树向上查找 `CommandBinding` 处理 |
| `CommandManager.PreviewCanExecuteEvent` | Tunneling | 查询可执行状态前 | 预览级别的状态查询 |
| `CommandManager.CanExecuteEvent` | Bubbling | 查询可执行状态时 | 沿树向上确定命令是否可用 |

#### 完整执行流程

```
用户点击 Button (Command="Copy")
         │
         ▼
┌─────────────────────────────────────────────────────┐
│  阶段一：PreviewExecuted（隧道，Tunnel）              │
│  Window ──→ Grid ──→ StackPanel ──→ Button          │
│  每层都触发 PreviewExecuted，高层可以 e.Handled=true │
│  来阻止命令继续传播                                   │
└────────────────────────────────┬────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────┐
│  阶段二：Executed（冒泡，Bubble）                     │
│  Button ──→ StackPanel ──→ Grid ──→ Window          │
│  沿途查找第一个匹配的 CommandBinding                 │
│  找到后执行 CanExecute → Executed                   │
│  若 e.Handled=true，停止继续冒泡                     │
└─────────────────────────────────────────────────────┘
```

#### 图解：冒泡查找 CommandBinding

```
┌──────────────────────────────────────────────────────────┐
│  Window (CommandBindings)                                 │
│  ┌────────────────────────────────────────────────────┐  │
│  │  "Copy" → WindowCopyHandler()    ← ③ 如果下层都没处理 │
│  │  "Paste" → WindowPasteHandler()      最终在此处理      │
│  └────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Grid (CommandBindings)                            │  │
│  │  ┌──────────────────────────────────────────────┐  │  │
│  │  │  "Copy" → GridCopyHandler()    ← ② Grid 绑定   │  │
│  │  │  如果在此处理并设置 e.Handled=true，            │  │
│  │  │  则 Window 的绑定不会被调用                    │  │
│  │  └──────────────────────────────────────────────┘  │  │
│  │  ┌──────────────────────────────────────────────┐  │  │
│  │  │  Button (Command="Copy")  ← ① 命令执行起点   │  │
│  │  │  没有自己的 CommandBinding                    │  │
│  │  │  事件开始向上冒泡                              │  │
│  │  └──────────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

### 4. 实战：利用路由机制实现集中式命令管理

#### 场景一：在 Window 层统一管理命令

```xml
<Window x:Class="Demo.MainWindow"
        xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        Title="集中式命令管理">

    <!-- ============================================
         所有命令绑定集中在 Window 层
         ============================================ -->
    <Window.CommandBindings>
        <CommandBinding Command="ApplicationCommands.Copy" 
                        Executed="Copy_Executed"
                        CanExecute="Copy_CanExecute" />
        <CommandBinding Command="ApplicationCommands.Paste" 
                        Executed="Paste_Executed"
                        CanExecute="Paste_CanExecute" />
        <CommandBinding Command="ApplicationCommands.Cut" 
                        Executed="Cut_Executed"
                        CanExecute="Cut_CanExecute" />
    </Window.CommandBindings>

    <DockPanel>
        <!-- 工具栏 -->
        <ToolBar DockPanel.Dock="Top">
            <Button Command="ApplicationCommands.Copy" Content="复制" />
            <Button Command="ApplicationCommands.Paste" Content="粘贴" />
            <Button Command="ApplicationCommands.Cut" Content="剪切" />
        </ToolBar>

        <!-- 右键菜单 -->
        <Grid>
            <Grid.ContextMenu>
                <ContextMenu>
                    <MenuItem Command="ApplicationCommands.Copy" />
                    <MenuItem Command="ApplicationCommands.Paste" />
                    <MenuItem Command="ApplicationCommands.Cut" />
                </ContextMenu>
            </Grid.ContextMenu>

            <!-- 多个文本框，无需单独绑定命令 -->
            <StackPanel>
                <TextBox x:Name="txt1" Margin="5" />
                <TextBox x:Name="txt2" Margin="5" />
                <TextBox x:Name="txt3" Margin="5" />
            </StackPanel>
        </Grid>
    </DockPanel>
</Window>
```

```csharp
public partial class MainWindow : Window
{
    public MainWindow()
    {
        InitializeComponent();
    }

    /// <summary>
    /// 统一的复制处理：根据当前焦点元素决定复制什么
    /// </summary>
    private void Copy_Executed(object sender, ExecutedRoutedEventArgs e)
    {
        // sender 是当前获得焦点的元素（或事件源）
        if (e.OriginalSource is TextBox textBox)
        {
            if (!string.IsNullOrEmpty(textBox.SelectedText))
            {
                Clipboard.SetText(textBox.SelectedText);
                e.Handled = true;  // 标记已处理，不再冒泡
            }
        }
    }

    private void Copy_CanExecute(object sender, CanExecuteRoutedEventArgs e)
    {
        // 只有焦点在 TextBox 且选中了文本时才可用
        if (e.OriginalSource is TextBox textBox)
            e.CanExecute = !string.IsNullOrEmpty(textBox.SelectedText);
        else
            e.CanExecute = false;
    }

    private void Paste_Executed(object sender, ExecutedRoutedEventArgs e)
    {
        if (e.OriginalSource is TextBox textBox)
        {
            if (Clipboard.ContainsText())
            {
                textBox.Paste();
                e.Handled = true;
            }
        }
    }
}
```

#### 场景二：分层拦截——子容器截获命令

```xml
<Window x:Class="Demo.MainWindow"
        xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml">

    <!-- Window 层：全局默认行为 -->
    <Window.CommandBindings>
        <CommandBinding Command="ApplicationCommands.Delete" 
                        Executed="WindowDelete_Executed" />
    </Window.CommandBindings>

    <Grid>
        <Grid.ColumnDefinitions>
            <ColumnDefinition Width="*" />
            <ColumnDefinition Width="*" />
        </Grid.ColumnDefinitions>

        <!-- 左侧面板：有自己的删除逻辑 -->
        <GroupBox Header="文件列表" Grid.Column="0">
            <GroupBox.CommandBindings>
                <!-- 截获 Delete 命令，使用文件删除逻辑 -->
                <CommandBinding Command="ApplicationCommands.Delete" 
                                Executed="FileListDelete_Executed" />
            </GroupBox.CommandBindings>
            <ListBox x:Name="fileListBox">
                <ListBoxItem>文件A.txt</ListBoxItem>
                <ListBoxItem>文件B.txt</ListBoxItem>
            </ListBox>
        </GroupBox>

        <!-- 右侧面板：没有自己的 CommandBinding，冒泡到 Window -->
        <GroupBox Header="日志" Grid.Column="1">
            <TextBox x:Name="logBox" />
        </GroupBox>

        <!-- 两个 Delete 按钮：点击后命令从各自的按钮出发冒泡 -->
    </Grid>
</Window>
```

```csharp
private void FileListDelete_Executed(object sender, ExecutedRoutedEventArgs e)
{
    // 左侧面板专用的删除逻辑
    if (fileListBox.SelectedItem != null)
    {
        // ... 删除文件逻辑
        e.Handled = true;  // ⭐ 阻止继续冒泡到 Window
        logBox.AppendText($"文件已删除\n");
    }
}

private void WindowDelete_Executed(object sender, ExecutedRoutedEventArgs e)
{
    // 全局删除逻辑（只有未被子元素处理时才到达此层）
    logBox.AppendText("Window 层收到 Delete 命令\n");
    e.Handled = true;
}
```

### 5. CommandTarget——精确指定命令目标

默认情况下，WPF 通过焦点来确定命令目标。但你可以通过 `CommandTarget` 属性**显式指定**目标元素：

```xml
<Window x:Class="Demo.MainWindow"
        xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml">

    <Window.CommandBindings>
        <CommandBinding Command="ApplicationCommands.Paste" 
                        Executed="Paste_Executed" />
    </Window.CommandBindings>

    <StackPanel>
        <!-- TextBox A：接收正常焦点粘贴 -->
        <TextBox x:Name="textBoxA" Margin="5" />

        <!-- TextBox B：被锁定，不允许粘贴 -->
        <TextBox x:Name="textBoxB" Margin="5" IsReadOnly="True" />

        <!-- ============================================
             关键：CommandTarget 强制将命令路由到指定的 TextBox
             ============================================ -->
        <Button Command="ApplicationCommands.Paste" 
                CommandTarget="{Binding ElementName=textBoxA}"
                Content="粘贴到 A" Margin="5" />

        <Button Command="ApplicationCommands.Paste" 
                CommandTarget="{Binding ElementName=textBoxB}"
                Content="粘贴到 B（失败，因为只读）" Margin="5" />

        <!-- 不指定 CommandTarget：使用当前焦点元素 -->
        <Button Command="ApplicationCommands.Paste" 
                Content="粘贴到焦点元素" Margin="5" />
    </StackPanel>
</Window>
```

```csharp
private void Paste_Executed(object sender, ExecutedRoutedEventArgs e)
{
    // e.Source：命令源（Button）
    // e.OriginalSource：事件的原始发起者
    // CommandTarget 会改变命令的路由目标

    if (e.Source is Button btn && btn.CommandTarget is TextBox target)
    {
        // CommandTarget 指定的目标
        if (!target.IsReadOnly)
            target.Paste();
    }
}
```

### 6. 预览事件：在隧道阶段拦截命令

```csharp
// 使用 PreviewCanExecute 和 PreviewExecuted 在命令到达目标前拦截
public MainWindow()
{
    InitializeComponent();

    // 在 Window 层注册预览事件（隧道方向，Window 最先收到）
    CommandManager.AddPreviewCanExecuteHandler(this, OnPreviewCanExecute);
    CommandManager.AddPreviewExecutedHandler(this, OnPreviewExecuted);
}

/// <summary>
/// 预览 CanExecute：可以在命令状态查询阶段直接决定结果
/// </summary>
private void OnPreviewCanExecute(object sender, CanExecuteRoutedEventArgs e)
{
    // 例如：全局禁用所有粘贴操作（隧道阶段拦截，任何子元素都无法执行粘贴）
    if (e.Command == ApplicationCommands.Paste)
    {
        e.CanExecute = false;
        e.Handled = true;  // 阻止后续的冒泡 CanExecute 查询
    }
}

/// <summary>
/// 预览 Executed：在命令实际执行前拦截
/// </summary>
private void OnPreviewExecuted(object sender, ExecutedRoutedEventArgs e)
{
    // 例如：记录所有命令执行的日志（不阻止命令）
    Debug.WriteLine($"[命令日志] {e.Command} 即将执行, 源: {e.OriginalSource}");

    // 或者：拦截特定命令
    if (e.Command == ApplicationCommands.Delete && !HasDeletePermission())
    {
        MessageBox.Show("你没有删除权限！");
        e.Handled = true;  // 阻止命令实际执行
    }
}
```

### 7. 自定义 RoutedCommand 的高级路由

```csharp
/// <summary>
/// 自定义路由命令：支持 InputGesture、拥有者类型声明
/// </summary>
public static class EditorCommands
{
    public static readonly RoutedUICommand FormatCode = new RoutedUICommand(
        "格式化代码",          // 显示文本
        "FormatCode",          // 命令名称（唯一标识）
        typeof(EditorCommands),// 所有者类型
        new InputGestureCollection
        {
            new KeyGesture(Key.K, ModifierKeys.Control | ModifierKeys.Shift),
            new KeyGesture(Key.F, ModifierKeys.Control, "Ctrl+F")  // 备用快捷键
        }
    );

    public static readonly RoutedUICommand CommentSelection = new RoutedUICommand(
        "注释选中行",
        "CommentSelection",
        typeof(EditorCommands),
        new InputGestureCollection
        {
            new KeyGesture(Key.OemQuestion, ModifierKeys.Control)  // Ctrl+/
        }
    );
}
```

```xml
<Window x:Class="Demo.EditorWindow"
        xmlns:local="clr-namespace:Demo">

    <!-- 在顶层统一绑定所有自定义命令 -->
    <Window.CommandBindings>
        <CommandBinding Command="{x:Static local:EditorCommands.FormatCode}"
                        Executed="FormatCode_Executed"
                        CanExecute="FormatCode_CanExecute" />
        <CommandBinding Command="{x:Static local:EditorCommands.CommentSelection}"
                        Executed="CommentSelection_Executed" />
    </Window.CommandBindings>

    <Window.InputBindings>
        <!-- 全局快捷键：即使焦点在 TextBox 内也能触发 -->
        <KeyBinding Key="K" Modifiers="Ctrl+Shift"
                    Command="{x:Static local:EditorCommands.FormatCode}" />
    </Window.InputBindings>

    <DockPanel>
        <ToolBar DockPanel.Dock="Top">
            <Button Command="{x:Static local:EditorCommands.FormatCode}"
                    Content="格式化 (Ctrl+Shift+K)" />
            <Button Command="{x:Static local:EditorCommands.CommentSelection}"
                    Content="注释 (Ctrl+/)" />
        </ToolBar>
        <RichTextBox x:Name="editor" AcceptsReturn="True" />
    </DockPanel>
</Window>
```

### 8. 路由行为速查表

| 场景 | 行为 | 如何实现 |
|------|------|----------|
| 全局统一处理 | Window 层绑定，所有子元素的命令冒泡到最上层 | `Window.CommandBindings` 添加绑定 |
| 子容器专属逻辑 | 子容器截获命令，阻止冒泡 | 子容器添加 `CommandBinding`，`e.Handled = true` |
| 全局禁用某命令 | 隧道阶段拦截 | `CommandManager.AddPreviewCanExecuteHandler` |
| 全局日志/监控 | 隧道阶段记录，不阻止命令 | `CommandManager.AddPreviewExecutedHandler` |
| 指定非焦点目标 | 绕过焦点系统 | 设置 `CommandTarget` 属性 |
| 多层级优先级 | 冒泡过程中第一个匹配的绑定生效 | 子元素的 `CommandBinding` > 父元素的 |

### 9. 路由事件与 ICommand 的区别

```
┌────────────────────────────────────────────────────────────┐
│  RoutedCommand (RoutedUICommand)                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  • 继承自 RoutedCommand → ICommand                   │  │
│  │  • 依赖路由事件（ExecutedEvent / CanExecuteEvent）    │  │
│  │  • 需要在元素树中注册 CommandBinding 才能工作         │  │
│  │  • 适合：UI 层的命令，如内置 ApplicationCommands     │  │
│  │  • 不支持直接绑定到 ViewModel（需 CommandBinding）    │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                            │
│  对比                                                       │
│                                                            │
│  RelayCommand (ICommand 直接实现)                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  • 直接实现 ICommand，不依赖路由事件                  │  │
│  │  • 命令逻辑封装在 ViewModel 中                        │  │
│  │  • 绑定方式：{Binding MyCommand}                      │  │
│  │  • 适合：MVVM 模式下的业务命令                        │  │
│  │  • CanExecute 依赖 CommandManager.RequerySuggested    │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

> **总结**：`RoutedCommand` 是 WPF 原生机制，利用路由事件在元素树中传播，适合 UI 层面的命令分发；`RelayCommand` 是 MVVM 层的 ICommand 实现，不参与路由，通过 Binding 直接连接 ViewModel。两种方式可以共存，根据场景选择。

---

## InputBindings：键盘和鼠标快捷方式

```xml
<Window x:Class="Demo.MainWindow"
        xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml">

    <Window.InputBindings>
        <!-- 绑定内置命令的快捷键 -->
        <KeyBinding Key="S" Modifiers="Ctrl" 
                    Command="ApplicationCommands.Save" />

        <!-- 绑定自定义 ViewModel 命令 -->
        <KeyBinding Key="F5" 
                    Command="{Binding RefreshCommand}" />

        <!-- 复杂组合键 -->
        <KeyBinding Key="D" Modifiers="Ctrl+Shift" 
                    Command="{Binding DebugCommand}" />

        <!-- 鼠标绑定 -->
        <MouseBinding Gesture="Control+WheelClick" 
                      Command="{Binding CloseTabCommand}" />
    </Window.InputBindings>

    <Grid>
        <!-- 仅在此 Grid 内生效的快捷键 -->
        <Grid.InputBindings>
            <KeyBinding Key="Delete" 
                        Command="{Binding DeleteSelectedCommand}" />
        </Grid.InputBindings>
    </Grid>
</Window>
```

---

## 最佳实践

### 1. 命令命名规范

```csharp
// ✅ 推荐：命令属性以 "Command" 结尾
public ICommand SaveCommand { get; }
public ICommand DeleteUserCommand { get; }
public ICommand RefreshDataCommand { get; }

// ❌ 避免
public ICommand Save { get; }        // 容易与普通方法混淆
public ICommand Cmd { get; }        // 过于简略
```

### 2. CanExecute 的合理使用

```csharp
// ✅ 推荐：明确的业务条件
private bool CanSave()
{
    return IsDirty && !HasErrors && IsConnected;
}

// ❌ 避免：过于宽松
private bool CanSave() => true;  // 无法利用命令系统的 UI 反馈能力
```

### 3. 避免内存泄漏

```csharp
// ❌ 问题代码：CommandManager 持有强引用
// RelayCommand 订阅了 CommandManager.RequerySuggested（静态事件）
// 如果 ViewModel 频繁创建，会导致内存泄漏

// ✅ 解决方案一：使用 WeakReference 包装
// ✅ 解决方案二：使用 WeakEvent 模式
// ✅ 解决方案三：使用 CommunityToolkit.Mvvm（内部已处理）
```

### 4. 异步命令的正确姿势

```csharp
// ✅ 推荐的做法
[RelayCommand]
private async Task SaveAsync()
{
    try
    {
        IsBusy = true;
        await _apiService.SaveDataAsync(Data);
        IsDirty = false;
    }
    catch (Exception ex)
    {
        // 错误处理
    }
    finally
    {
        IsBusy = false;
    }
}
```

### 5. 何时使用事件 vs 命令

| 场景 | 推荐方式 |
|------|----------|
| Button / MenuItem 点击 | 命令 (Command) |
| 文本框内容变化 | 事件 (TextChanged) / 绑定 |
| 选择变更 (ComboBox, ListBox) | 绑定 (SelectedItem) / 事件 |
| 窗口生命周期 (Loaded, Closing) | 事件 |
| 拖放操作 | 事件 (DragOver, Drop) |
| 纯 UI 动画 | 事件 / Trigger |

### 6. 完整的 MVVM 命令项目结构

```
DemoApp/
├── Models/
│   └── UserModel.cs
├── ViewModels/
│   ├── Base/
│   │   ├── RelayCommand.cs
│   │   ├── AsyncRelayCommand.cs
│   │   └── RelayCommand{T}.cs
│   ├── MainViewModel.cs
│   └── SettingsViewModel.cs
├── Views/
│   ├── MainWindow.xaml
│   └── SettingsView.xaml
└── Commands/
    └── AppCommands.cs        // 自定义 RoutedUICommand 定义
```

---

## 总结

| 要点 | 说明 |
|------|------|
| **核心接口** | `ICommand`：`Execute` + `CanExecute` + `CanExecuteChanged` |
| **内置命令** | ApplicationCommands / NavigationCommands / EditingCommands 等 5 组 |
| **命令绑定** | XAML `CommandBinding` 或后台代码 `CommandBindings.Add()` |
| **MVVM 基础** | `RelayCommand` 实现 `ICommand`，绑定到 View 的 `Command` 属性 |
| **命令参数** | 通过 `CommandParameter` 传递上下文（静态值或 Binding） |
| **异步命令** | 封装 `Func<Task>`，执行期间禁用按钮防重复点击 |
| **推荐框架** | CommunityToolkit.Mvvm（`[RelayCommand]`）或 Prism（`DelegateCommand`） |
| **快捷键** | `KeyBinding` / `MouseBinding` 关联命令 |

---

> **参考资源**
> - [Microsoft Docs: Commanding Overview](https://docs.microsoft.com/en-us/dotnet/desktop/wpf/advanced/commanding-overview)
> - [CommunityToolkit.Mvvm](https://github.com/CommunityToolkit/dotnet)
> - [Prism Library](https://prismlibrary.com/)
