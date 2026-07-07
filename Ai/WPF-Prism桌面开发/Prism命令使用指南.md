# Prism WPF 命令使用指南

## 目录

1. [Prism 命令概览](#1-prism-命令概览)
2. [DelegateCommand——基础命令](#2-delegatecommand基础命令)
3. [DelegateCommand\<T\>——带参数命令](#3-delegatecommandt带参数命令)
4. [ObservesProperty——属性变化自动刷新 CanExecute](#4-observesproperty属性变化自动刷新-canexecute)
5. [ObservesCanExecute——观察外部命令状态](#5-observescanexecute观察外部命令状态)
6. [Async DelegateCommand——异步命令（重点）](#6-async-delegatecommand异步命令重点)
7. [CompositeCommand——复合命令](#7-compositecommand复合命令)
8. [命令与区域导航](#8-命令与区域导航)
9. [命令与 EventAggregator 配合](#9-命令与-eventaggregator-配合)
10. [完整实战示例](#10-完整实战示例)
11. [最佳实践与常见问题](#11-最佳实践与常见问题)

---

## 1. Prism 命令概览

Prism 提供了 `Prism.Commands` 命名空间下的命令体系，相比原生 WPF `ICommand`，核心优势包括：

| 特性 | 原生 ICommand | Prism DelegateCommand |
|------|-------------|----------------------|
| 创建方式 | 需手写 RelayCommand 类 | 内置，开箱即用 |
| CanExecute 刷新 | 依赖 CommandManager | `RaiseCanExecuteChanged()` 手动控制 |
| 属性观察 | 不支持 | `ObservesProperty()` 自动关联 |
| 异步支持 | 需自行实现 | 内置 `AsyncDelegateCommand`（Prism 8+）或社区模式 |
| 复合命令 | 不支持 | `CompositeCommand` 一行注册 |
| 弱引用 | 无 | 支持 `ObservesProperty` 弱引用 |

### 核心类一览

```
┌─────────────────────────────────────────────────────────────┐
│                  Prism.Commands 命名空间                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  DelegateCommand          → 无参同步命令（最常用）             │
│  DelegateCommand<T>       → 带参同步命令                      │
│  AsyncDelegateCommand     → 无参异步命令（Prism 9+）          │
│  AsyncDelegateCommand<T>  → 带参异步命令（Prism 9+）          │
│  CompositeCommand         → 复合命令（组合多个子命令）          │
│                                                             │
│  关键方法：                                                   │
│  .ObservesProperty(() => Prop)  → 属性变化时刷新 CanExecute   │
│  .ObservesCanExecute(cmd)       → 观察另一个命令的状态         │
│  .RaiseCanExecuteChanged()      → 手动刷新可用性              │
│  .RegisterCommand(cmd)          → CompositeCommand 注册子命令  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. DelegateCommand——基础命令

### 2.1 最简示例

```csharp
using Prism.Commands;
using Prism.Mvvm;

public class MainViewModel : BindableBase
{
    // 声明命令属性（只读，XAML 绑定用）
    public DelegateCommand SaveCommand { get; }

    public MainViewModel()
    {
        // 构造时传入 Execute 委托
        SaveCommand = new DelegateCommand(Save);
    }

    private void Save()
    {
        // 保存逻辑...
    }
}
```

```xml
<!-- XAML 绑定 -->
<Button Command="{Binding SaveCommand}" Content="保存" />
```

### 2.2 带 CanExecute 的命令

```csharp
public class MainViewModel : BindableBase
{
    private bool _isDirty;
    public bool IsDirty
    {
        get => _isDirty;
        set => SetProperty(ref _isDirty, value);
    }

    public DelegateCommand SaveCommand { get; }

    public MainViewModel()
    {
        SaveCommand = new DelegateCommand(
            executeMethod: Save,
            canExecuteMethod: CanSave    // ← CanExecute 委托
        );
    }

    private void Save()
    {
        // 保存数据...
        IsDirty = false;

        // ⭐ 关键：属性变化后手动刷新命令可用状态
        SaveCommand.RaiseCanExecuteChanged();
    }

    private bool CanSave()
    {
        return IsDirty;  // 只有数据变更后才能保存
    }
}
```

```xml
<Button Command="{Binding SaveCommand}" Content="保存" />
<!-- IsDirty=false 时按钮自动灰掉 -->
```

> **注意**：Prism 的 `DelegateCommand` 不会像原生 `CommandManager` 那样自动监听 UI 事件来刷新。你必须在 ViewModel 属性变化后**主动调用** `RaiseCanExecuteChanged()`。

---

## 3. DelegateCommand\<T\>——带参数命令

### 3.1 基本用法

```csharp
public class UserListViewModel : BindableBase
{
    public DelegateCommand<UserModel> DeleteUserCommand { get; }

    public UserListViewModel()
    {
        DeleteUserCommand = new DelegateCommand<UserModel>(
            executeMethod: user => DeleteUser(user),
            canExecuteMethod: user => user != null && user.CanDelete
        );
    }

    private void DeleteUser(UserModel user)
    {
        Users.Remove(user);
    }
}
```

```xml
<ListBox ItemsSource="{Binding Users}">
    <ListBox.ItemTemplate>
        <DataTemplate>
            <StackPanel>
                <TextBlock Text="{Binding Name}" />
                <!-- CommandParameter 传递当前 DataContext 的 UserModel -->
                <Button Command="{Binding DataContext.DeleteUserCommand, 
                                  RelativeSource={RelativeSource AncestorType=ListBox}}"
                        CommandParameter="{Binding .}"
                        Content="删除" />
            </StackPanel>
        </DataTemplate>
    </ListBox.ItemTemplate>
</ListBox>
```

### 3.2 传递简单值

```csharp
public DelegateCommand<string> NavigateCommand { get; }

public MainViewModel()
{
    NavigateCommand = new DelegateCommand<string>(
        executeMethod: viewName => Navigate(viewName),
        canExecuteMethod: viewName => !string.IsNullOrEmpty(viewName)
    );
}
```

```xml
<Button Command="{Binding NavigateCommand}" 
        CommandParameter="SettingsView" 
        Content="设置" />
<Button Command="{Binding NavigateCommand}" 
        CommandParameter="HomeView" 
        Content="首页" />
```

---

## 4. ObservesProperty——属性变化自动刷新 CanExecute

这是 Prism 命令最实用的特性之一：**不用手动调用 `RaiseCanExecuteChanged()`**，只需关联属性即可。

### 4.1 基本用法

```csharp
public class EditorViewModel : BindableBase
{
    private string _content;
    public string Content
    {
        get => _content;
        set => SetProperty(ref _content, value);
    }

    private bool _isBusy;
    public bool IsBusy
    {
        get => _isBusy;
        set => SetProperty(ref _isBusy, value);
    }

    public DelegateCommand SaveCommand { get; }

    public EditorViewModel()
    {
        SaveCommand = new DelegateCommand(Save, CanSave)
            .ObservesProperty(() => Content)   // ← Content 变化时自动检查 CanSave
            .ObservesProperty(() => IsBusy);   // ← IsBusy 变化时自动检查 CanSave
    }

    private void Save()
    {
        IsBusy = true;
        // 保存逻辑...
        IsBusy = false;
    }

    private bool CanSave()
    {
        return !string.IsNullOrEmpty(Content) && !IsBusy;
    }
}
```

### 4.2 链式观察多个属性

```csharp
SaveCommand = new DelegateCommand(Save, CanSave)
    .ObservesProperty(() => FileName)
    .ObservesProperty(() => FilePath)
    .ObservesProperty(() => IsModified)
    .ObservesProperty(() => IsConnected);
```

> `ObservesProperty` 使用**弱引用**观察属性，不会导致内存泄漏。

### 4.3 带参数命令的 ObservesProperty

```csharp
public DelegateCommand<UserModel> DeleteCommand { get; }

public EditorViewModel()
{
    DeleteCommand = new DelegateCommand<UserModel>(
        executeMethod: user => Delete(user),
        canExecuteMethod: user => user != null && IsAdmin
    ).ObservesProperty(() => IsAdmin);  // IsAdmin 变化时刷新所有按钮
}
```

---

## 5. ObservesCanExecute——观察外部命令状态

当你希望当前命令的 `CanExecute` 依赖另一个命令的状态时：

```csharp
public class MainViewModel : BindableBase
{
    public DelegateCommand StartCommand { get; }
    public DelegateCommand StopCommand { get; }

    public MainViewModel()
    {
        StartCommand = new DelegateCommand(Start, CanStart);
        StopCommand = new DelegateCommand(Stop, CanStop)
            .ObservesCanExecute(StartCommand);  // ← StartCommand 状态变化时刷新
    }

    private bool CanStart() => !_isRunning;
    private bool CanStop() => _isRunning;

    private void Start()
    {
        _isRunning = true;
        StartCommand.RaiseCanExecuteChanged();  // 这会触发 StopCommand 也刷新
    }

    private void Stop()
    {
        _isRunning = false;
        StartCommand.RaiseCanExecuteChanged();
    }
}
```

---

## 6. Async DelegateCommand——异步命令（重点）

异步命令是 Prism 命令系统中最实用也最容易出错的部分。下面从简单到复杂逐步讲解。

### 6.1 版本说明

| Prism 版本 | 异步命令支持 |
|-----------|------------|
| Prism 7.x | 无内置，需手动实现 |
| Prism 8.x | `DelegateCommand` 支持 `async void`（不推荐） |
| Prism 9.x | 内置 `AsyncDelegateCommand` / `AsyncDelegateCommand<T>` |

> 如果你的项目还在用 Prism 7/8，本章也提供了手动封装方案。

### 6.2 Prism 9+ AsyncDelegateCommand（推荐）

```csharp
using Prism.Commands;

public class DataViewModel : BindableBase
{
    public AsyncDelegateCommand LoadDataCommand { get; }

    public DataViewModel()
    {
        LoadDataCommand = new AsyncDelegateCommand(
            executeMethod: LoadDataAsync,
            canExecuteMethod: CanLoadData
        );
    }

    private async Task LoadDataAsync()
    {
        IsLoading = true;
        try
        {
            var data = await _apiService.GetDataAsync();
            Items.AddRange(data);
        }
        finally
        {
            IsLoading = false;
            // AsyncDelegateCommand 会自动在任务执行期间禁用按钮
        }
    }

    private bool CanLoadData()
    {
        return !IsLoading;
    }
}
```

```xml
<Button Command="{Binding LoadDataCommand}" Content="加载数据" />
<!-- 任务执行期间按钮自动禁用，任务完成自动恢复 -->
```

### 6.3 带参数的异步命令

```csharp
public AsyncDelegateCommand<int> ProcessItemCommand { get; }

public DataViewModel()
{
    ProcessItemCommand = new AsyncDelegateCommand<int>(
        executeMethod: id => ProcessItemAsync(id),
        canExecuteMethod: id => id > 0 && !IsBusy
    ).ObservesProperty(() => IsBusy);
}

private async Task ProcessItemAsync(int itemId)
{
    IsBusy = true;
    try
    {
        await _service.ProcessAsync(itemId);
    }
    finally
    {
        IsBusy = false;
    }
}
```

### 6.4 异常处理

```csharp
LoadDataCommand = new AsyncDelegateCommand(async () =>
{
    try
    {
        var data = await _apiService.GetDataAsync();
        Items.AddRange(data);
    }
    catch (HttpRequestException ex)
    {
        // 在 UI 线程上显示错误
        ErrorMessage = $"网络错误: {ex.Message}";
    }
    catch (Exception ex)
    {
        ErrorMessage = $"未知错误: {ex.Message}";
    }
});
```

### 6.5 Prism 7/8 手动封装异步命令

如果你的项目使用旧版 Prism，可按以下方式封装：

```csharp
using System;
using System.Threading.Tasks;
using System.Windows.Input;
using Prism.Commands;

/// <summary>
/// 手动封装的异步命令（适用于 Prism 7.x / 8.x）
/// </summary>
public class AsyncCommand : ICommand
{
    private readonly Func<Task> _execute;
    private readonly Func<bool> _canExecute;
    private bool _isExecuting;

    public AsyncCommand(Func<Task> execute, Func<bool> canExecute = null)
    {
        _execute = execute ?? throw new ArgumentNullException(nameof(execute));
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

/// <summary>
/// 带参数的异步命令
/// </summary>
public class AsyncCommand<T> : ICommand
{
    private readonly Func<T, Task> _execute;
    private readonly Func<T, bool> _canExecute;
    private bool _isExecuting;

    public AsyncCommand(Func<T, Task> execute, Func<T, bool> canExecute = null)
    {
        _execute = execute ?? throw new ArgumentNullException(nameof(execute));
        _canExecute = canExecute;
    }

    public bool CanExecute(object parameter)
    {
        if (_isExecuting) return false;
        if (_canExecute == null) return true;
        if (parameter is T typedParam)
            return _canExecute(typedParam);
        return true;
    }

    public async void Execute(object parameter)
    {
        if (_isExecuting) return;
        if (!(parameter is T typedParam)) return;

        _isExecuting = true;
        RaiseCanExecuteChanged();

        try
        {
            await _execute(typedParam);
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

**使用方式：**

```csharp
public class LegacyViewModel : BindableBase
{
    public ICommand SaveAsyncCommand { get; }
    public ICommand DeleteAsyncCommand { get; }

    public LegacyViewModel()
    {
        SaveAsyncCommand = new AsyncCommand(SaveAsync, CanSave);
        DeleteAsyncCommand = new AsyncCommand<int>(id => DeleteAsync(id));
    }

    private async Task SaveAsync()
    {
        await Task.Delay(2000); // 模拟耗时操作
        // 保存逻辑...
    }

    private async Task DeleteAsync(int id)
    {
        await _apiService.DeleteUserAsync(id);
    }

    private bool CanSave() => !string.IsNullOrEmpty(UserName);
}
```

### 6.6 异步命令关键注意点

```
┌────────────────────────────────────────────────────────────┐
│           ⚠️ 异步命令常见陷阱与解决方案                       │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  1. 不要用 async void（除事件处理外）                         │
│     ✗ private async void Save() { ... }                    │
│     ✓ private async Task SaveAsync() { ... }               │
│     原因：async void 无法 await，异常无法捕获                 │
│                                                            │
│  2. 执行期间必须禁用按钮                                     │
│     ✓ AsyncDelegateCommand 自动禁用                          │
│     ✓ 手动封装用 _isExecuting 标志位                        │
│     ✗ 不这样做会导致用户连续点击触发多次                      │
│                                                            │
│  3. 异常必须在异步方法内部捕获                                │
│     ✗ 依赖外部 try-catch（async void 异常会崩溃）            │
│     ✓ 在 Task 内部 try-catch-finally                       │
│                                                            │
│  4. finally 中恢复状态                                      │
│     ✓ 确保 IsBusy / _isExecuting 在 finally 中重置          │
│     ✗ 只在 try 中重置（异常时状态永远卡住）                   │
│                                                            │
│  5. UI 线程安全                                             │
│     ✓ Prism 的 ObservableObject 已做线程调度                 │
│     ✓ await 后自动回到 UI 线程                              │
│     ✗ Task.Run 后直接修改绑定属性（需要 Dispatcher）         │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

## 7. CompositeCommand——复合命令

复合命令让你把多个子命令组合成一个命令，**一个按钮触发，多个 ViewModel 同时响应**。

### 7.1 典型场景

```
┌──────────────────────────────────────────────────────┐
│                    工具栏 "全部保存" 按钮                │
│                    CompositeCommand                   │
│                         │                             │
│          ┌──────────────┼──────────────┐              │
│          ▼              ▼              ▼              │
│    EditorViewModel  FileViewModel  SettingsViewModel │
│    .SaveCommand     .SaveCommand   .SaveCommand      │
│    (保存文档)        (保存文件列表)   (保存设置)        │
└──────────────────────────────────────────────────────┘
```

### 7.2 基本用法

**步骤一：在容器中注册全局 CompositeCommand**

```csharp
// App.xaml.cs
protected override void RegisterTypes(IContainerRegistry containerRegistry)
{
    // 注册为全局单例，名称为 "SaveAll"
    containerRegistry.RegisterSingleton<IApplicationCommands, ApplicationCommands>();
}
```

```csharp
// ApplicationCommands.cs —— 全局命令容器
public interface IApplicationCommands
{
    CompositeCommand SaveAllCommand { get; }
}

public class ApplicationCommands : IApplicationCommands
{
    public CompositeCommand SaveAllCommand { get; } = new CompositeCommand();
}
```

**步骤二：各 ViewModel 注册子命令**

```csharp
public class EditorViewModel : BindableBase
{
    public DelegateCommand SaveCommand { get; }

    public EditorViewModel(IApplicationCommands appCommands)
    {
        SaveCommand = new DelegateCommand(Save, CanSave)
            .ObservesProperty(() => IsDirty);

        // ⭐ 将本地命令注册到全局复合命令
        appCommands.SaveAllCommand.RegisterCommand(SaveCommand);
    }

    private void Save() { /* 保存文档 */ }
    private bool CanSave() => IsDirty;
}

public class FileManagerViewModel : BindableBase
{
    public DelegateCommand SaveFileListCommand { get; }

    public FileManagerViewModel(IApplicationCommands appCommands)
    {
        SaveFileListCommand = new DelegateCommand(SaveFileList);
        appCommands.SaveAllCommand.RegisterCommand(SaveFileListCommand);
    }

    private void SaveFileList() { /* 保存文件列表 */ }
}
```

**步骤三：Shell 或主窗口绑定**

```xml
<!-- ShellView.xaml -->
<ToolBar>
    <Button Command="{Binding SaveAllCommand}" Content="💾 全部保存" />
</ToolBar>
```

```csharp
// ShellViewModel.cs
public class ShellViewModel : BindableBase
{
    public CompositeCommand SaveAllCommand { get; }

    public ShellViewModel(IApplicationCommands appCommands)
    {
        SaveAllCommand = appCommands.SaveAllCommand;
    }
}
```

### 7.3 取消注册（防止内存泄漏）

```csharp
public class EditorViewModel : BindableBase, IDestructible
{
    private readonly IApplicationCommands _appCommands;

    public EditorViewModel(IApplicationCommands appCommands)
    {
        _appCommands = appCommands;
        _appCommands.SaveAllCommand.RegisterCommand(SaveCommand);
    }

    // 实现 IDestructible，在 ViewModel 销毁时取消注册
    public void Destroy()
    {
        _appCommands.SaveAllCommand.UnregisterCommand(SaveCommand);
    }
}
```

### 7.4 复合命令的 CanExecute 行为

`CompositeCommand` 的 `CanExecute` 是 **AND 逻辑**：

- 所有子命令都返回 `true` → 复合命令 `CanExecute = true`
- 任一子命令返回 `false` → 复合命令 `CanExecute = false`

```csharp
// 场景：只有所有模块都"有数据可保存"时，"全部保存"按钮才可用
// Editor: IsDirty = true  → CanSave = true
// Files:  HasChanges = false → CanSave = false
// 结果: "全部保存"按钮灰色不可点击
```

---

## 8. 命令与区域导航

Prism 命令常与区域导航配合使用，注意命令参数的传递：

### 8.1 导航命令

```csharp
public class MainViewModel : BindableBase
{
    private readonly IRegionManager _regionManager;

    public DelegateCommand<string> NavigateCommand { get; }

    public MainViewModel(IRegionManager regionManager)
    {
        _regionManager = regionManager;
        NavigateCommand = new DelegateCommand<string>(Navigate);
    }

    private void Navigate(string viewName)
    {
        _regionManager.RequestNavigate("ContentRegion", viewName);
    }
}
```

```xml
<Button Command="{Binding NavigateCommand}" 
        CommandParameter="UserListView" 
        Content="用户管理" />
<Button Command="{Binding NavigateCommand}" 
        CommandParameter="SettingsView" 
        Content="系统设置" />
```

### 8.2 带导航参数的异步命令

```csharp
public AsyncDelegateCommand NavigateWithParamsCommand { get; }

public MainViewModel(IRegionManager regionManager)
{
    NavigateWithParamsCommand = new AsyncDelegateCommand(async () =>
    {
        var parameters = new NavigationParameters
        {
            { "userId", SelectedUser.Id }
        };

        // 先异步加载数据，再导航
        await LoadUserDetailsAsync(SelectedUser.Id);
        _regionManager.RequestNavigate("ContentRegion", "UserDetailView", parameters);
    });
}
```

---

## 9. 命令与 EventAggregator 配合

命令执行后常需要通知其他模块，EventAggregator 是最佳拍档：

```csharp
public class EditorViewModel : BindableBase
{
    private readonly IEventAggregator _eventAggregator;

    public AsyncDelegateCommand SaveCommand { get; }

    public EditorViewModel(IEventAggregator eventAggregator)
    {
        _eventAggregator = eventAggregator;

        SaveCommand = new AsyncDelegateCommand(SaveAsync, CanSave)
            .ObservesProperty(() => IsDirty);
    }

    private async Task SaveAsync()
    {
        try
        {
            await _apiService.SaveAsync(CurrentDocument);

            // ⭐ 保存成功后发布事件，通知其他模块刷新
            _eventAggregator.GetEvent<DocumentSavedEvent>()
                .Publish(new DocumentSavedPayload { DocumentId = CurrentDocument.Id });
        }
        catch (Exception ex)
        {
            // 发布错误事件
            _eventAggregator.GetEvent<ErrorOccurredEvent>()
                .Publish(ex.Message);
        }
    }
}
```

---

## 10. 完整实战示例

以下是一个完整的用户管理模块，涵盖同步/异步命令、参数传递、复合命令：

### 10.1 ViewModel

```csharp
using System.Collections.ObjectModel;
using System.Threading.Tasks;
using Prism.Commands;
using Prism.Events;
using Prism.Mvvm;

public class UserManagementViewModel : BindableBase
{
    private readonly IUserService _userService;
    private readonly IEventAggregator _eventAggregator;

    // ========== 属性 ==========
    private ObservableCollection<UserModel> _users = new();
    public ObservableCollection<UserModel> Users
    {
        get => _users;
        set => SetProperty(ref _users, value);
    }

    private UserModel _selectedUser;
    public UserModel SelectedUser
    {
        get => _selectedUser;
        set => SetProperty(ref _selectedUser, value);
    }

    private bool _isLoading;
    public bool IsLoading
    {
        get => _isLoading;
        set => SetProperty(ref _isLoading, value);
    }

    private string _searchKeyword;
    public string SearchKeyword
    {
        get => _searchKeyword;
        set => SetProperty(ref _searchKeyword, value);
    }

    // ========== 命令 ==========

    // 异步：加载用户列表
    public AsyncDelegateCommand LoadUsersCommand { get; }

    // 异步：搜索用户
    public AsyncDelegateCommand SearchCommand { get; }

    // 同步+参数：删除用户
    public DelegateCommand<UserModel> DeleteUserCommand { get; }

    // 同步：打开新建弹框
    public DelegateCommand AddUserCommand { get; }

    // 异步：保存全部
    public AsyncDelegateCommand SaveAllCommand { get; }

    public UserManagementViewModel(
        IUserService userService,
        IEventAggregator eventAggregator,
        IApplicationCommands appCommands)
    {
        _userService = userService;
        _eventAggregator = eventAggregator;

        // ---- 异步命令 ----
        LoadUsersCommand = new AsyncDelegateCommand(LoadUsersAsync,
            canExecuteMethod: () => !IsLoading)
            .ObservesProperty(() => IsLoading);

        SearchCommand = new AsyncDelegateCommand(SearchAsync,
            canExecuteMethod: () => !string.IsNullOrEmpty(SearchKeyword) && !IsLoading)
            .ObservesProperty(() => SearchKeyword)
            .ObservesProperty(() => IsLoading);

        // ---- 带参数同步命令 ----
        DeleteUserCommand = new DelegateCommand<UserModel>(
            executeMethod: user => DeleteUser(user),
            canExecuteMethod: user => user != null && user.CanDelete
        ).ObservesProperty(() => SelectedUser);

        // ---- 无参同步命令 ----
        AddUserCommand = new DelegateCommand(AddUser);

        // ---- 异步复合命令（注册到全局） ----
        SaveAllCommand = new AsyncDelegateCommand(SaveAllAsync);
        appCommands.SaveAllCommand.RegisterCommand(SaveAllCommand);
    }

    // ========== 命令实现 ==========

    private async Task LoadUsersAsync()
    {
        IsLoading = true;
        try
        {
            var users = await _userService.GetAllUsersAsync();
            Users = new ObservableCollection<UserModel>(users);

            _eventAggregator.GetEvent<StatusUpdatedEvent>()
                .Publish($"加载完成，共 {users.Count} 个用户");
        }
        catch (Exception ex)
        {
            _eventAggregator.GetEvent<ErrorOccurredEvent>()
                .Publish($"加载用户失败: {ex.Message}");
        }
        finally
        {
            IsLoading = false;
        }
    }

    private async Task SearchAsync()
    {
        IsLoading = true;
        try
        {
            var users = await _userService.SearchUsersAsync(SearchKeyword);
            Users = new ObservableCollection<UserModel>(users);
        }
        finally
        {
            IsLoading = false;
        }
    }

    private void DeleteUser(UserModel user)
    {
        _userService.DeleteUser(user.Id);
        Users.Remove(user);
    }

    private void AddUser()
    {
        // 通常配合 IDialogService 打开弹框
        _eventAggregator.GetEvent<OpenDialogEvent>()
            .Publish("AddUserDialog");
    }

    private async Task SaveAllAsync()
    {
        IsLoading = true;
        try
        {
            await _userService.BatchSaveAsync(Users);
            _eventAggregator.GetEvent<StatusUpdatedEvent>()
                .Publish("全部用户保存成功");
        }
        finally
        {
            IsLoading = false;
        }
    }
}
```

### 10.2 XAML

```xml
<UserControl x:Class="Demo.Views.UserManagementView"
             xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
             xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
             xmlns:prism="http://prismlibrary.com/">

    <Grid Margin="10">
        <Grid.RowDefinitions>
            <RowDefinition Height="Auto" />
            <RowDefinition Height="*" />
            <RowDefinition Height="Auto" />
        </Grid.RowDefinitions>

        <!-- ===== 工具栏 ===== -->
        <ToolBar Grid.Row="0">
            <Button Command="{Binding LoadUsersCommand}" 
                    Content="🔄 刷新" />
            <TextBox Text="{Binding SearchKeyword, UpdateSourceTrigger=PropertyChanged}" 
                     Width="200" />
            <Button Command="{Binding SearchCommand}" 
                    Content="🔍 搜索" />
            <Separator />
            <Button Command="{Binding AddUserCommand}" 
                    Content="➕ 新增" />
            <Button Command="{Binding SaveAllCommand}" 
                    Content="💾 全部保存" />
        </ToolBar>

        <!-- ===== 加载指示器 ===== -->
        <ProgressBar Grid.Row="0" Height="3" 
                     IsIndeterminate="{Binding IsLoading}" />

        <!-- ===== 用户列表 ===== -->
        <ListBox Grid.Row="1" ItemsSource="{Binding Users}"
                 SelectedItem="{Binding SelectedUser}">
            <ListBox.ItemTemplate>
                <DataTemplate>
                    <Grid Margin="3">
                        <Grid.ColumnDefinitions>
                            <ColumnDefinition Width="*" />
                            <ColumnDefinition Width="Auto" />
                        </Grid.ColumnDefinitions>
                        <TextBlock Text="{Binding Name}" VerticalAlignment="Center" />
                        <Button Grid.Column="1"
                                Command="{Binding DataContext.DeleteUserCommand, 
                                    RelativeSource={RelativeSource AncestorType=ListBox}}"
                                CommandParameter="{Binding .}"
                                Content="🗑 删除" />
                    </Grid>
                </DataTemplate>
            </ListBox.ItemTemplate>
        </ListBox>

        <!-- ===== 状态栏 ===== -->
        <StatusBar Grid.Row="2">
            <TextBlock Text="{Binding Users.Count, StringFormat='共 {0} 个用户'}" />
        </StatusBar>
    </Grid>
</UserControl>
```

---

## 11. 最佳实践与常见问题

### 11.1 命令声明规范

```csharp
// ✅ 推荐：声明为只读属性，构造函数中初始化
public DelegateCommand SaveCommand { get; }

// ❌ 不推荐：使用 get-only 属性每次返回新实例（性能差、事件绑定丢失）
public DelegateCommand SaveCommand => new DelegateCommand(Save);

// ✅ 推荐：异步命令用 Task 返回值
public AsyncDelegateCommand LoadCommand { get; }

// ❌ 不推荐：异步命令用 async void
public DelegateCommand LoadCommand { get; } // 内部用 async void
```

### 11.2 CanExecute 刷新时机

```csharp
// ✅ 方式一：使用 ObservesProperty（推荐）
SaveCommand = new DelegateCommand(Save, CanSave)
    .ObservesProperty(() => IsDirty)
    .ObservesProperty(() => FileName);

// ✅ 方式二：属性 setter 中手动刷新
private bool _isDirty;
public bool IsDirty
{
    get => _isDirty;
    set
    {
        SetProperty(ref _isDirty, value);
        SaveCommand.RaiseCanExecuteChanged();
    }
}

// ❌ 方式三：依赖 CommandManager（Prism 中不可靠，不要用）
```

### 11.3 组合多个条件

```csharp
private bool CanSave()
{
    // 在 CanExecute 方法中组合所有条件，而不是分散在各地
    return !string.IsNullOrEmpty(FileName)
        && !string.IsNullOrEmpty(Content)
        && !IsSaving
        && IsConnected;
}

// 然后观察所有相关属性
SaveCommand = new DelegateCommand(Save, CanSave)
    .ObservesProperty(() => FileName)
    .ObservesProperty(() => Content)
    .ObservesProperty(() => IsSaving)
    .ObservesProperty(() => IsConnected);
```

### 11.4 测试命令

`DelegateCommand` 可以直接在单元测试中调用：

```csharp
[Test]
public void SaveCommand_WhenDirty_ShouldBeEnabled()
{
    var vm = new EditorViewModel();
    
    // 初始状态：不可保存
    Assert.IsFalse(vm.SaveCommand.CanExecute());

    // 修改内容后：可以保存
    vm.Content = "New Content";
    // 注意：需要手动触发 RaiseCanExecuteChanged 或使用 ObservesProperty
    Assert.IsTrue(vm.SaveCommand.CanExecute());

    // 执行命令
    vm.SaveCommand.Execute();
    // 验证结果...
}
```

### 11.5 异步命令单元测试

```csharp
[Test]
public async Task LoadCommand_ShouldPopulateUsers()
{
    var vm = new UserManagementViewModel(mockService, mockEventAggregator, mockAppCommands);

    // 执行异步命令
    await ((AsyncDelegateCommand)vm.LoadUsersCommand).ExecuteAsync(null);

    // 验证结果
    Assert.AreEqual(10, vm.Users.Count);
}
```

### 11.6 常见错误速查

| 症状 | 原因 | 解决方案 |
|------|------|---------|
| 按钮永远灰色 | 没调用 `RaiseCanExecuteChanged` | 加 `ObservesProperty` 或手动刷新 |
| 点击按钮没反应 | ViewModel 未绑定 / 命令为 null | 检查 DataContext 和命令初始化 |
| 连续点击触发多次 | 异步命令未防重入 | 使用 `AsyncDelegateCommand` 或用 `_isExecuting` 标记 |
| 异步异常崩溃 | `async void` 异常未捕获 | 改用 `async Task`，在方法内 `try-catch` |
| 内存泄漏 | `ObservesProperty` 强引用 | Prism 9+ 已用 WeakReference，或手动 `UnregisterCommand` |
| 变更后按钮状态不更新 | `SetProperty` 的 `nameof` 与 `ObservesProperty` 属性不一致 | 使用 `nameof()` 对齐 |

---

> **参考**：本文档基于 Prism 9.x，部分特性（如 `AsyncDelegateCommand`）在 Prism 8.x 中需手动封装。升级到最新 Prism 版本以获得最佳异步体验。
