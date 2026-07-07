# Prism 区域导航详细使用指南

## 目录

1. [概述](#概述)
2. [核心概念](#核心概念)
3. [环境准备与配置](#环境准备与配置)
4. [区域注册方式](#区域注册方式)
5. [导航请求方法](#导航请求方法)
6. [导航参数传递](#导航参数传递)
7. [导航生命周期](#导航生命周期)
8. [导航结果处理](#导航结果处理)
9. [高级用法](#高级用法)
10. [常见问题与解决方案](#常见问题与解决方案)
11. [最佳实践](#最佳实践)
12. [完整示例](#完整示例)

---

## 概述

Prism 区域导航（Region Navigation）是 Prism 框架的核心功能之一，它提供了一种灵活、可维护的方式来管理应用程序中视图的动态切换。通过区域导航，开发者可以将应用程序划分为多个区域（Region），每个区域可以独立地加载和切换不同的视图（View），而无需修改宿主窗口或页面的代码。

### 主要优势

- **松耦合**：视图和视图模型之间通过导航机制解耦
- **可测试性**：导航逻辑可以在单元测试中验证
- **灵活性**：支持多种导航模式和参数传递方式
- **可维护性**：集中管理导航逻辑，便于维护和扩展

---

## 核心概念

### 区域（Region）

区域是应用程序中的一个逻辑容器，用于承载和管理视图。区域可以是任何实现了 `IRegion` 接口的控件，如 `ContentControl`、`ItemsControl`、`TabControl` 等。

```xml
<!-- 在 XAML 中定义区域 -->
<ContentControl prism:RegionManager.RegionName="MainRegion" />
```

### 区域管理器（RegionManager）

`RegionManager` 是 Prism 中管理区域的核心服务，负责区域的注册、发现和导航协调。

### 视图（View）

视图是用户界面的组成部分，通常是一个 UserControl 或 Page。视图通过区域导航机制加载到区域中。

### 视图模型（ViewModel）

视图模型是视图的数据上下文，包含视图的状态和行为逻辑。视图模型通常实现 `INavigationAware` 接口以参与导航生命周期。

---

## 环境准备与配置

### 1. 安装 NuGet 包

```xml
<!-- WPF 项目 -->
<PackageReference Include="Prism.DryIoc" Version="8.1.97" />
<!-- 或使用 Unity -->
<PackageReference Include="Prism.Unity" Version="8.1.97" />

<!-- .NET MAUI 项目 -->
<PackageReference Include="Prism.DryIoc.Maui" Version="8.1.97" />
```

### 2. 应用程序入口配置

```csharp
// WPF App.xaml.cs
public partial class App : PrismApplication
{
    protected override Window CreateShell()
    {
        return Container.Resolve<MainWindow>();
    }

    protected override void RegisterTypes(IContainerRegistry containerRegistry)
    {
        // 注册导航页面
        containerRegistry.RegisterForNavigation<ViewA, ViewAViewModel>();
        containerRegistry.RegisterForNavigation<ViewB, ViewBViewModel>();
        containerRegistry.RegisterForNavigation<ViewC, ViewCViewModel>();
    }

    protected override void ConfigureModuleCatalog(IModuleCatalog moduleCatalog)
    {
        // 可选：配置模块
        moduleCatalog.AddModule<MainModule>();
    }
}
```

### 3. MainWindow XAML 配置

```xml
<Window x:Class="MyApp.MainWindow"
        xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        xmlns:prism="http://prismlibrary.com"
        prism:ViewModelLocator.AutoWireViewModel="True">
    <Grid>
        <Grid.ColumnDefinitions>
            <ColumnDefinition Width="200" />
            <ColumnDefinition Width="*" />
        </Grid.ColumnDefinitions>

        <!-- 导航菜单 -->
        <StackPanel Grid.Column="0">
            <Button Content="View A" Command="{Binding NavigateCommand}" CommandParameter="ViewA" />
            <Button Content="View B" Command="{Binding NavigateCommand}" CommandParameter="ViewB" />
            <Button Content="View C" Command="{Binding NavigateCommand}" CommandParameter="ViewC" />
        </StackPanel>

        <!-- 主内容区域 -->
        <ContentControl Grid.Column="1"
                        prism:RegionManager.RegionName="MainRegion" />
    </Grid>
</Window>
```

---

## 区域注册方式

### 1. XAML 声明式注册

```xml
<!-- ContentControl 区域（单视图） -->
<ContentControl prism:RegionManager.RegionName="MainRegion" />

<!-- ItemsControl 区域（多视图） -->
<ItemsControl prism:RegionManager.RegionName="MultiRegion" />

<!-- TabControl 区域（选项卡式） -->
<TabControl prism:RegionManager.RegionName="TabRegion" />

<!-- ListBox 区域 -->
<ListBox prism:RegionManager.RegionName="ListRegion" />
```

### 2. 代码动态注册

```csharp
// 在视图代码中注册区域
public partial class MainWindow : Window
{
    public MainWindow()
    {
        InitializeComponent();
    }
}

// 或者在视图模型中注册
public class MainWindowViewModel : BindableBase
{
    private readonly IRegionManager _regionManager;

    public MainWindowViewModel(IRegionManager regionManager)
    {
        _regionManager = regionManager;
    }

    // 动态注册区域
    public void RegisterRegion(ContentControl contentControl)
    {
        RegionManager.SetRegionName(contentControl, "DynamicRegion");
        RegionManager.SetRegionManager(contentControl, _regionManager);
    }
}
```

### 3. 自定义区域适配器

```csharp
// 为自定义控件创建区域适配器
public class MyCustomRegionAdapter : RegionAdapterBase<MyCustomControl>
{
    public MyCustomRegionAdapter(IRegionBehaviorFactory regionBehaviorFactory)
        : base(regionBehaviorFactory)
    {
    }

    protected override void Adapt(IRegion region, MyCustomControl regionTarget)
    {
        region.ActiveViews.CollectionChanged += (s, e) =>
        {
            if (e.Action == NotifyCollectionChangedAction.Add)
            {
                foreach (FrameworkElement item in e.NewItems)
                {
                    regionTarget.Content = item;
                }
            }
        };
    }

    protected override IRegion CreateRegion()
    {
        return new SingleActiveRegion();
    }
}

// 注册适配器
protected override void ConfigureRegionAdapterMappings(RegionAdapterMappings regionAdapterMappings)
{
    base.ConfigureRegionAdapterMappings(regionAdapterMappings);
    regionAdapterMappings.RegisterMapping<MyCustomControl, MyCustomRegionAdapter>();
}
```

---

## 导航请求方法

### 1. 使用 RegionManager.RequestNavigate

```csharp
public class MainWindowViewModel : BindableBase
{
    private readonly IRegionManager _regionManager;

    public MainWindowViewModel(IRegionManager regionManager)
    {
        _regionManager = regionManager;
        NavigateCommand = new DelegateCommand<string>(Navigate);
    }

    public DelegateCommand<string> NavigateCommand { get; }

    private void Navigate(string viewName)
    {
        _regionManager.RequestNavigate("MainRegion", viewName, NavigationCompleted);
    }

    private void NavigationCompleted(NavigationResult result)
    {
        if (result.Result == true)
        {
            // 导航成功
            Console.WriteLine($"导航到 {result.Context.Uri} 成功");
        }
        else
        {
            // 导航失败
            Console.WriteLine($"导航失败: {result.Error?.Message}");
        }
    }
}
```

### 2. 使用 URI 导航

```csharp
// 基本 URI 导航
_regionManager.RequestNavigate("MainRegion", new Uri("ViewA", UriKind.Relative));

// 带查询参数的 URI 导航
_regionManager.RequestNavigate("MainRegion", new Uri("ViewA?id=123&name=test", UriKind.Relative));

// 使用字符串 URI
_regionManager.RequestNavigate("MainRegion", "ViewA?id=123");
```

### 3. 使用泛型方法导航

```csharp
// 泛型导航
_regionManager.RequestNavigate<ViewA>("MainRegion");

// 带参数的泛型导航
_regionManager.RequestNavigate<ViewA>("MainRegion", new NavigationParameters
{
    { "id", 123 },
    { "name", "test" }
});
```

### 4. 在视图模型中注入 IRegionManager

```csharp
public class SomeViewModel : BindableBase, INavigationAware
{
    private readonly IRegionManager _regionManager;

    public SomeViewModel(IRegionManager regionManager)
    {
        _regionManager = regionManager;
    }

    public void OnNavigatedTo(NavigationContext navigationContext)
    {
        // 可以在这里进行导航
        _regionManager.RequestNavigate("SubRegion", "SubView");
    }

    public bool IsNavigationTarget(NavigationContext navigationContext)
    {
        return true;
    }

    public void OnNavigatedFrom(NavigationContext navigationContext)
    {
        // 离开时的清理逻辑
    }
}
```

---

## 导航参数传递

### 1. 创建 NavigationParameters

```csharp
// 方式一：使用集合初始化器
var parameters = new NavigationParameters
{
    { "id", 123 },
    { "name", "test" },
    { "date", DateTime.Now }
};

// 方式二：使用 Add 方法
var parameters = new NavigationParameters();
parameters.Add("id", 123);
parameters.Add("name", "test");

// 方式三：使用 URI 查询字符串
var parameters = new NavigationParameters("id=123&name=test");

// 方式四：从现有 URI 创建
var uri = new Uri("ViewA?id=123&name=test", UriKind.Relative);
var parameters = new NavigationParameters(uri.OriginalString);
```

### 2. 在目标视图模型中获取参数

```csharp
public class ViewAViewModel : BindableBase, INavigationAware
{
    private int _id;
    private string _name;

    public void OnNavigatedTo(NavigationContext navigationContext)
    {
        // 获取参数
        if (navigationContext.Parameters.ContainsKey("id"))
        {
            _id = navigationContext.Parameters.GetValue<int>("id");
        }

        if (navigationContext.Parameters.ContainsKey("name"))
        {
            _name = navigationContext.Parameters.GetValue<string>("name");
        }

        // 或者使用泛型获取
        var id = navigationContext.Parameters.GetValue<int>("id");
        var name = navigationContext.Parameters.GetValue<string>("name");
    }

    public bool IsNavigationTarget(NavigationContext navigationContext)
    {
        // 可以根据参数决定是否重用现有实例
        var requestedId = navigationContext.Parameters.GetValue<int>("id");
        return requestedId == _id;
    }

    public void OnNavigatedFrom(NavigationContext navigationContext)
    {
        // 清理逻辑
    }
}
```

### 3. 传递复杂对象

```csharp
// 传递自定义对象
public class User
{
    public int Id { get; set; }
    public string Name { get; set; }
    public string Email { get; set; }
}

// 导航时传递
var user = new User { Id = 1, Name = "John", Email = "john@example.com" };
var parameters = new NavigationParameters
{
    { "user", user }
};

_regionManager.RequestNavigate("MainRegion", "UserDetail", parameters);

// 在目标视图模型中获取
public class UserDetailViewModel : BindableBase, INavigationAware
{
    private User _user;

    public void OnNavigatedTo(NavigationContext navigationContext)
    {
        _user = navigationContext.Parameters.GetValue<User>("user");
    }
}
```

### 4. 参数验证

```csharp
public class ViewAViewModel : BindableBase, INavigationAware
{
    public void OnNavigatedTo(NavigationContext navigationContext)
    {
        // 验证必需参数
        if (!navigationContext.Parameters.ContainsKey("id"))
        {
            throw new NavigationException(navigationContext, "缺少必需参数: id");
        }

        var id = navigationContext.Parameters.GetValue<int>("id");
        if (id <= 0)
        {
            throw new NavigationException(navigationContext, "无效的 ID 值");
        }
    }
}
```

---

## 导航生命周期

### INavigationAware 接口

```csharp
public interface INavigationAware
{
    // 导航到此视图时调用
    void OnNavigatedTo(NavigationContext navigationContext);

    // 判断是否重用现有实例
    bool IsNavigationTarget(NavigationContext navigationContext);

    // 从此视图离开时调用
    void OnNavigatedFrom(NavigationContext navigationContext);
}
```

### IConfirmNavigationRequest 接口

```csharp
public interface IConfirmNavigationRequest : INavigationAware
{
    // 在导航请求前确认
    void ConfirmNavigationRequest(NavigationContext navigationContext, Action<bool> continuationCallback);
}
```

### IJournalAware 接口

```csharp
public interface IJournalAware
{
    // 控制是否将导航添加到日志
    bool PersistInHistory();
}
```

### 完整生命周期示例

```csharp
public class ViewAViewModel : BindableBase, IConfirmNavigationRequest, IJournalAware
{
    private bool _hasUnsavedChanges;

    public void OnNavigatedTo(NavigationContext navigationContext)
    {
        // 1. 初始化视图
        LoadData(navigationContext.Parameters);
    }

    public bool IsNavigationTarget(NavigationContext navigationContext)
    {
        // 2. 判断是否重用实例
        // 返回 true 表示重用现有实例，返回 false 表示创建新实例
        return true;
    }

    public void OnNavigatedFrom(NavigationContext navigationContext)
    {
        // 3. 清理资源
        SaveState();
    }

    public void ConfirmNavigationRequest(NavigationContext navigationContext, Action<bool> continuationCallback)
    {
        // 4. 确认是否允许导航
        if (_hasUnsavedChanges)
        {
            // 显示确认对话框
            var result = MessageBox.Show(
                "有未保存的更改，是否继续？",
                "确认导航",
                MessageBoxButton.YesNo);

            continuationCallback(result == MessageBoxResult.Yes);
        }
        else
        {
            continuationCallback(true);
        }
    }

    public bool PersistInHistory()
    {
        // 5. 控制是否持久化到导航历史
        return true;
    }
}
```

### 导航流程图

```
┌─────────────────────────────────────────────────────────────┐
│                    导航请求发起                               │
│                    RequestNavigate                           │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              查找目标视图 (View Discovery)                    │
│              根据 URI 或类型查找注册的视图                     │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│         检查当前视图: IConfirmNavigationRequest               │
│         调用 ConfirmNavigationRequest 确认是否允许离开         │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              调用当前视图: OnNavigatedFrom                    │
│              执行离开前的清理逻辑                              │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│         检查目标视图: IsNavigationTarget                     │
│         判断是否重用现有实例或创建新实例                       │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              调用目标视图: OnNavigatedTo                      │
│              执行初始化逻辑，加载数据                          │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    导航完成                                   │
│                    触发 NavigationCompleted 回调              │
└─────────────────────────────────────────────────────────────┘
```

---

## 导航结果处理

### NavigationResult 类

```csharp
public class NavigationResult
{
    // 导航是否成功
    public bool Result { get; }

    // 导航上下文
    public NavigationContext Context { get; }

    // 如果失败，包含错误信息
    public Exception Error { get; }
}
```

### 处理导航结果

```csharp
public class MainWindowViewModel : BindableBase
{
    private readonly IRegionManager _regionManager;

    public MainWindowViewModel(IRegionManager regionManager)
    {
        _regionManager = regionManager;
    }

    private void NavigateWithResult(string viewName)
    {
        _regionManager.RequestNavigate("MainRegion", viewName, result =>
        {
            if (result.Result == true)
            {
                // 导航成功
                Console.WriteLine($"成功导航到: {result.Context.Uri}");

                // 可以获取导航参数
                var parameters = result.Context.Parameters;
                if (parameters.ContainsKey("id"))
                {
                    var id = parameters.GetValue<int>("id");
                    Console.WriteLine($"传递的 ID: {id}");
                }
            }
            else
            {
                // 导航失败
                if (result.Error != null)
                {
                    Console.WriteLine($"导航失败: {result.Error.Message}");
                }
                else
                {
                    Console.WriteLine("导航被取消或拒绝");
                }
            }
        });
    }
}
```

### 异步导航

```csharp
public class MainWindowViewModel : BindableBase
{
    private readonly IRegionManager _regionManager;

    public MainWindowViewModel(IRegionManager regionManager)
    {
        _regionManager = regionManager;
    }

    private async Task NavigateAsync(string viewName)
    {
        var tcs = new TaskCompletionSource<bool>();

        _regionManager.RequestNavigate("MainRegion", viewName, result =>
        {
            if (result.Result == true)
            {
                tcs.SetResult(true);
            }
            else
            {
                tcs.SetException(result.Error ?? new Exception("导航失败"));
            }
        });

        try
        {
            await tcs.Task;
            Console.WriteLine("导航完成");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"导航错误: {ex.Message}");
        }
    }
}
```

---

## 高级用法

### 1. 导航日志（Navigation Journal）

```csharp
public class ViewAViewModel : BindableBase, INavigationAware
{
    private IRegionNavigationJournal _journal;

    public void OnNavigatedTo(NavigationContext navigationContext)
    {
        // 获取导航日志
        _journal = navigationContext.NavigationService.Journal;
    }

    // 后退
    public void GoBack()
    {
        if (_journal != null && _journal.CanGoBack)
        {
            _journal.GoBack();
        }
    }

    // 前进
    public void GoForward()
    {
        if (_journal != null && _journal.CanGoForward)
        {
            _journal.GoForward();
        }
    }

    // 检查是否可以后退/前进
    public bool CanGoBack => _journal?.CanGoBack ?? false;
    public bool CanGoForward => _journal?.CanGoForward ?? false;
}
```

### 2. 多区域导航

```csharp
public class MainWindowViewModel : BindableBase
{
    private readonly IRegionManager _regionManager;

    public MainWindowViewModel(IRegionManager regionManager)
    {
        _regionManager = regionManager;
        NavigateMultipleCommand = new DelegateCommand(NavigateMultiple);
    }

    public DelegateCommand NavigateMultipleCommand { get; }

    private void NavigateMultiple()
    {
        // 同时导航多个区域
        _regionManager.RequestNavigate("HeaderRegion", "HeaderView");
        _regionManager.RequestNavigate("LeftRegion", "LeftMenuView");
        _regionManager.RequestNavigate("MainRegion", "ContentView");
        _regionManager.RequestNavigate("FooterRegion", "FooterView");
    }
}
```

### 多区域导航与导航日志行为

> **核心要点**：每个区域拥有**独立的导航日志（Navigation Journal）**，调用 `GoBack` 或 `GoForward` 时，**只影响指定区域**，不会联动其他区域。

#### 架构图示

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           应用程序窗口                                    │
├──────────────┬──────────────────────────────────┬───────────────────────┤
│              │                                  │                       │
│  Header      │        MainRegion                │    Sidebar            │
│  Region      │                                  │    Region             │
│              │                                  │                       │
│  ┌────────┐  │  ┌────────────────────────────┐  │  ┌─────────────────┐  │
│  │HeaderA │  │  │        ViewA               │  │  │   SidebarA      │  │
│  │→HeaderB│  │  │        →ViewB              │  │  │   →SidebarB     │  │
│  │→HeaderC│  │  │        →ViewC              │  │  │   →SidebarC     │  │
│  └────────┘  │  └────────────────────────────┘  │  └─────────────────┘  │
│              │                                  │                       │
│  Journal:    │  Journal:                        │  Journal:             │
│  [A,B,C]     │  [A,B,C]                        │  [A,B,C]              │
│  ↑ 当前C     │  ↑ 当前C                        │  ↑ 当前C              │
│              │                                  │                       │
└──────────────┴──────────────────────────────────┴───────────────────────┘

调用 HeaderRegion.GoBack():
  - HeaderRegion: C → B ✓ (只影响此区域)
  - MainRegion:   C    (不变)
  - SidebarRegion: C   (不变)
```

#### 关键行为说明

| 场景 | 行为 | 说明 |
|------|------|------|
| 调用 `MainRegion` 的 `GoBack()` | 只有 `MainRegion` 后退 | 其他区域不受影响 |
| 调用 `HeaderRegion` 的 `GoBack()` | 只有 `HeaderRegion` 后退 | 其他区域不受影响 |
| 多个区域同时调用 `GoBack()` | 各自独立执行 | 按调用顺序执行，互不干扰 |
| 一个区域导航失败 | 不影响其他区域 | 各区域导航完全独立 |

#### 示例代码

```csharp
public class MainWindowViewModel : BindableBase
{
    private readonly IRegionManager _regionManager;
    private IRegionNavigationJournal _mainJournal;
    private IRegionNavigationJournal _headerJournal;
    private IRegionNavigationJournal _sidebarJournal;

    public MainWindowViewModel(IRegionManager regionManager)
    {
        _regionManager = regionManager;

        GoBackMainCommand = new DelegateCommand(GoBackMain, CanGoBackMain);
        GoBackHeaderCommand = new DelegateCommand(GoBackHeader, CanGoBackHeader);
        GoBackAllCommand = new DelegateCommand(GoBackAll, CanGoBackAll);
    }

    public DelegateCommand GoBackMainCommand { get; }
    public DelegateCommand GoBackHeaderCommand { get; }
    public DelegateCommand GoBackAllCommand { get; }

    // 初始化：获取各区域的日志引用
    private void InitializeJournals()
    {
        _mainJournal = _regionManager.Regions["MainRegion"]?.NavigationService?.Journal;
        _headerJournal = _regionManager.Regions["HeaderRegion"]?.NavigationService?.Journal;
        _sidebarJournal = _regionManager.Regions["SidebarRegion"]?.NavigationService?.Journal;
    }

    // 只让 MainRegion 后退
    private void GoBackMain()
    {
        if (_mainJournal?.CanGoBack == true)
        {
            _mainJournal.GoBack();
            // HeaderRegion 和 SidebarRegion 保持不变
        }
    }

    private bool CanGoBackMain() => _mainJournal?.CanGoBack ?? false;

    // 只让 HeaderRegion 后退
    private void GoBackHeader()
    {
        if (_headerJournal?.CanGoBack == true)
        {
            _headerJournal.GoBack();
            // MainRegion 和 SidebarRegion 保持不变
        }
    }

    private bool CanGoBackHeader() => _headerJournal?.CanGoBack ?? false;

    // 让所有区域同时后退（各自独立执行）
    private void GoBackAll()
    {
        // 注意：这是分别调用，不是联动操作
        // 每个区域只后退自己的历史记录
        if (_mainJournal?.CanGoBack == true)
            _mainJournal.GoBack();

        if (_headerJournal?.CanGoBack == true)
            _headerJournal.GoBack();

        if (_sidebarJournal?.CanGoBack == true)
            _sidebarJournal.GoBack();
    }

    private bool CanGoBackAll()
    {
        return (_mainJournal?.CanGoBack ?? false)
            || (_headerJournal?.CanGoBack ?? false)
            || (_sidebarJournal?.CanGoBack ?? false);
    }
}
```

#### 在视图模型中获取当前区域的日志

```csharp
public class ContentViewModel : BindableBase, INavigationAware
{
    private IRegionNavigationJournal _journal;

    public void OnNavigatedTo(NavigationContext navigationContext)
    {
        // 获取当前所在区域的导航日志
        _journal = navigationContext.NavigationService.Journal;
    }

    // 后退：只影响当前区域
    public void GoBack()
    {
        if (_journal?.CanGoBack == true)
        {
            _journal.GoBack();
        }
    }
}
```

#### 联动导航的实现方式

如果需要实现"一个操作触发多个区域同时变化"的效果，需要**手动协调**：

```csharp
public class CoordinatedNavigationService
{
    private readonly IRegionManager _regionManager;

    public CoordinatedNavigationService(IRegionManager regionManager)
    {
        _regionManager = regionManager;
    }

    // 联动导航：同时切换多个区域到指定视图
    public void NavigateTo(NavigationParameters parameters = null)
    {
        var viewName = parameters?.GetValue<string>("view") ?? "DefaultView";

        // 根据主视图决定其他区域显示什么
        switch (viewName)
        {
            case "Dashboard":
                _regionManager.RequestNavigate("MainRegion", "DashboardView", parameters);
                _regionManager.RequestNavigate("HeaderRegion", "DashboardHeaderView");
                _regionManager.RequestNavigate("SidebarRegion", "DashboardSidebarView");
                break;

            case "Settings":
                _regionManager.RequestNavigate("MainRegion", "SettingsView", parameters);
                _regionManager.RequestNavigate("HeaderRegion", "SettingsHeaderView");
                _regionManager.RequestNavigate("SidebarRegion", "SettingsSidebarView");
                break;
        }
    }

    // 联动后退：让所有区域同时回到上一个状态
    // 注意：这需要自定义实现，Prism 不提供内置支持
    public void GoBackCoordinated()
    {
        var mainJournal = _regionManager.Regions["MainRegion"]?.NavigationService?.Journal;
        var headerJournal = _regionManager.Regions["HeaderRegion"]?.NavigationService?.Journal;
        var sidebarJournal = _regionManager.Regions["SidebarRegion"]?.NavigationService?.Journal;

        // 同时触发各区域的后退
        // 注意：每个区域只后退自己的历史，不会同步到同一个"时间点"
        mainJournal?.GoBack();
        headerJournal?.GoBack();
        sidebarJournal?.GoBack();
    }
}
```

#### 常见误区

| 误区 | 正确理解 |
|------|----------|
| 调用一个区域的 `GoBack()` 会让所有区域后退 | ❌ 错误。只影响调用的那个区域 |
| 多区域导航是原子操作，要么全成功要么全失败 | ❌ 错误。每个区域独立执行，互不影响 |
| 区域之间会共享导航历史 | ❌ 错误。每个区域有独立的 `IRegionNavigationJournal` |
| 需要同步多区域变化时，调用一次 `GoBack()` 即可 | ❌ 错误。需要手动协调多个区域的导航 |

### 3. 区域行为（Region Behaviors）

```csharp
// 自动轮询行为
public class AutoPopulateRegionBehavior : RegionBehavior
{
    public const string BehaviorKey = "AutoPopulate";

    protected override void OnAttach()
    {
        Region.ActiveViews.CollectionChanged += OnActiveViewsChanged;
    }

    private void OnActiveViewsChanged(object sender, NotifyCollectionChangedEventArgs e)
    {
        // 处理视图变化
    }
}

// 注册行为
protected override void ConfigureDefaultRegionBehaviors(IRegionBehaviorFactory regionBehaviors)
{
    base.ConfigureDefaultRegionBehaviors(regionBehaviors);
    regionBehaviors.AddIfMissing(AutoPopulateRegionBehavior.BehaviorKey, typeof(AutoPopulateRegionBehavior));
}
```

### 4. 视图发现（View Discovery）

```csharp
// 自动注册视图到区域
public class MainModule : IModule
{
    private readonly IRegionManager _regionManager;

    public MainModule(IRegionManager regionManager)
    {
        _regionManager = regionManager;
    }

    public void OnInitialized(IContainerProvider containerProvider)
    {
        // 自动将视图添加到区域
        _regionManager.RegisterViewWithRegion("MainRegion", typeof(ViewA));
        _regionManager.RegisterViewWithRegion("SidebarRegion", typeof(SidebarView));
    }

    public void RegisterTypes(IContainerRegistry containerRegistry)
    {
        containerRegistry.RegisterForNavigation<ViewA, ViewAViewModel>();
    }
}
```

### 5. 条件导航

```csharp
public class SecureViewViewModel : BindableBase, IConfirmNavigationRequest
{
    private readonly IAuthenticationService _authService;

    public SecureViewViewModel(IAuthenticationService authService)
    {
        _authService = authService;
    }

    public void ConfirmNavigationRequest(NavigationContext navigationContext, Action<bool> continuationCallback)
    {
        // 检查用户是否已认证
        if (!_authService.IsAuthenticated)
        {
            // 重定向到登录页面
            var regionManager = navigationContext.NavigationService.Region.RegionManager;
            regionManager.RequestNavigate("MainRegion", "LoginView");
            continuationCallback(false);
            return;
        }

        continuationCallback(true);
    }

    // 其他接口实现...
    public void OnNavigatedTo(NavigationContext navigationContext) { }
    public bool IsNavigationTarget(NavigationContext navigationContext) => true;
    public void OnNavigatedFrom(NavigationContext navigationContext) { }
}
```

### 6. 深度链接（Deep Linking）

```csharp
public class DeepLinkHandler
{
    private readonly IRegionManager _regionManager;

    public DeepLinkHandler(IRegionManager regionManager)
    {
        _regionManager = regionManager;
    }

    public void HandleDeepLink(Uri uri)
    {
        // 解析深度链接
        var segments = uri.OriginalString.Split('/');

        if (segments.Length >= 2)
        {
            var viewName = segments[1];
            var parameters = new NavigationParameters();

            // 解析查询参数
            if (segments.Length > 2)
            {
                var queryString = segments[2];
                var pairs = queryString.Split('&');
                foreach (var pair in pairs)
                {
                    var keyValue = pair.Split('=');
                    if (keyValue.Length == 2)
                    {
                        parameters.Add(keyValue[0], keyValue[1]);
                    }
                }
            }

            _regionManager.RequestNavigate("MainRegion", viewName, parameters);
        }
    }
}

// 使用示例
// myapp://main/UserDetail?id=123
```

---

## 常见问题与解决方案

### 问题 1：导航到视图时出现空白

**症状**：导航请求发出，但区域显示空白，没有视图加载。

**可能原因**：
1. 视图未注册
2. 视图模型未正确绑定
3. 区域名称拼写错误

**解决方案**：

```csharp
// 1. 确保视图已注册
protected override void RegisterTypes(IContainerRegistry containerRegistry)
{
    containerRegistry.RegisterForNavigation<ViewA, ViewAViewModel>();
}

// 2. 确保 XAML 中设置了自动绑定
// <UserControl prism:ViewModelLocator.AutoWireViewModel="True" ...>

// 3. 检查区域名称是否一致
// XAML: prism:RegionManager.RegionName="MainRegion"
// 代码: _regionManager.RequestNavigate("MainRegion", ...)
```

### 问题 2：IsNavigationTarget 不生效

**症状**：每次导航都创建新实例，`IsNavigationTarget` 返回 true 但未重用。

**可能原因**：
1. 区域类型不支持重用
2. 返回值逻辑错误

**解决方案**：

```csharp
// 确保使用 SingleActiveRegion（ContentControl 默认）
// 如果使用 AllActiveRegion（ItemsControl），每个视图都是活跃的

public bool IsNavigationTarget(NavigationContext navigationContext)
{
    // 根据业务逻辑决定是否重用
    var requestedId = navigationContext.Parameters.GetValue<int>("id");
    return requestedId == _currentId;
}
```

### 问题 3：导航参数丢失

**症状**：导航成功，但目标视图模型收不到参数。

**可能原因**：
1. 参数键名拼写错误
2. 参数类型不匹配

**解决方案**：

```csharp
// 1. 使用常量避免拼写错误
public static class NavigationParameterKeys
{
    public const string UserId = "userId";
    public const string UserName = "userName";
}

// 2. 使用泛型方法确保类型安全
var userId = navigationContext.Parameters.GetValue<int>(NavigationParameterKeys.UserId);
```

### 问题 4：导航冲突

**症状**：多个导航请求同时执行，导致视图状态混乱。

**解决方案**：

```csharp
public class MainWindowViewModel : BindableBase
{
    private bool _isNavigating;

    private async Task NavigateAsync(string viewName)
    {
        if (_isNavigating)
        {
            return; // 防止重复导航
        }

        _isNavigating = true;
        try
        {
            // 执行导航
            _regionManager.RequestNavigate("MainRegion", viewName);
        }
        finally
        {
            _isNavigating = false;
        }
    }
}
```

### 问题 5：内存泄漏

**症状**：应用程序内存持续增长，导航后旧视图未被释放。

**解决方案**：

```csharp
public class ViewAViewModel : BindableBase, INavigationAware
{
    private IDisposable _subscription;

    public void OnNavigatedTo(NavigationContext navigationContext)
    {
        // 订阅事件
        _subscription = SomeService.Subscribe(data =>
        {
            // 处理数据
        });
    }

    public void OnNavigatedFrom(NavigationContext navigationContext)
    {
        // 取消订阅，防止内存泄漏
        _subscription?.Dispose();
    }
}
```

---

## 最佳实践

### 1. 使用常量管理区域和视图名称

```csharp
public static class RegionNames
{
    public const string MainRegion = "MainRegion";
    public const string HeaderRegion = "HeaderRegion";
    public const string SidebarRegion = "SidebarRegion";
    public const string FooterRegion = "FooterRegion";
}

public static class ViewNames
{
    public const string HomeView = "HomeView";
    public const string UserListView = "UserListView";
    public const string UserDetailView = "UserDetailView";
    public const string SettingsView = "SettingsView";
}

// 使用
_regionManager.RequestNavigate(RegionNames.MainRegion, ViewNames.HomeView);
```

### 2. 创建导航服务封装

```csharp
public interface INavigationService
{
    Task NavigateToAsync(string viewName, NavigationParameters parameters = null);
    Task<bool> ConfirmNavigationAsync();
    void GoBack();
    void GoForward();
}

public class NavigationService : INavigationService
{
    private readonly IRegionManager _regionManager;
    private readonly IDialogService _dialogService;

    public NavigationService(IRegionManager regionManager, IDialogService dialogService)
    {
        _regionManager = regionManager;
        _dialogService = dialogService;
    }

    public Task NavigateToAsync(string viewName, NavigationParameters parameters = null)
    {
        var tcs = new TaskCompletionSource<bool>();

        _regionManager.RequestNavigate(RegionNames.MainRegion, viewName, result =>
        {
            if (result.Result == true)
            {
                tcs.SetResult(true);
            }
            else if (result.Error != null)
            {
                tcs.SetException(result.Error);
            }
            else
            {
                tcs.SetResult(false);
            }
        }, parameters);

        return tcs.Task;
    }

    public async Task<bool> ConfirmNavigationAsync()
    {
        return await _dialogService.ShowDialogAsync("确认", "是否继续导航？");
    }

    public void GoBack()
    {
        var journal = GetJournal();
        if (journal?.CanGoBack == true)
        {
            journal.GoBack();
        }
    }

    public void GoForward()
    {
        var journal = GetJournal();
        if (journal?.CanGoForward == true)
        {
            journal.GoForward();
        }
    }

    private IRegionNavigationJournal GetJournal()
    {
        var region = _regionManager.Regions[RegionNames.MainRegion];
        return region?.NavigationService?.Journal;
    }
}
```

### 3. 使用依赖注入管理导航

```csharp
// 在模块中注册导航服务
public class MainModule : IModule
{
    public void RegisterTypes(IContainerRegistry containerRegistry)
    {
        containerRegistry.RegisterSingleton<INavigationService, NavigationService>();
        containerRegistry.RegisterForNavigation<ViewA, ViewAViewModel>();
    }
}

// 在视图模型中注入
public class SomeViewModel : BindableBase
{
    private readonly INavigationService _navigationService;

    public SomeViewModel(INavigationService navigationService)
    {
        _navigationService = navigationService;
        NavigateCommand = new AsyncDelegateCommand<string>(NavigateAsync);
    }

    public AsyncDelegateCommand<string> NavigateCommand { get; }

    private async Task NavigateAsync(string viewName)
    {
        await _navigationService.NavigateToAsync(viewName);
    }
}
```

### 4. 单元测试导航

```csharp
[TestFixture]
public class MainWindowViewModelTests
{
    private Mock<IRegionManager> _regionManagerMock;
    private MainWindowViewModel _viewModel;

    [SetUp]
    public void Setup()
    {
        _regionManagerMock = new Mock<IRegionManager>();
        _viewModel = new MainWindowViewModel(_regionManagerMock.Object);
    }

    [Test]
    public void NavigateCommand_ShouldRequestNavigation()
    {
        // Arrange
        var viewName = "ViewA";

        // Act
        _viewModel.NavigateCommand.Execute(viewName);

        // Assert
        _regionManagerMock.Verify(
            rm => rm.RequestNavigate(
                "MainRegion",
                viewName,
                It.IsAny<Action<NavigationResult>>()),
            Times.Once);
    }

    [Test]
    public void NavigateWithParameters_ShouldPassParameters()
    {
        // Arrange
        var viewName = "ViewA";
        var parameters = new NavigationParameters { { "id", 123 } };

        // Act
        _viewModel.NavigateWithParameters(viewName, parameters);

        // Assert
        _regionManagerMock.Verify(
            rm => rm.RequestNavigate(
                "MainRegion",
                viewName,
                It.IsAny<Action<NavigationResult>>(),
                parameters),
            Times.Once);
    }
}
```

---

## 完整示例

### 项目结构

```
MyPrismApp/
├── App.xaml
├── App.xaml.cs
├── Models/
│   └── User.cs
├── ViewModels/
│   ├── MainWindowViewModel.cs
│   ├── HomeViewModel.cs
│   ├── UserListViewModel.cs
│   └── UserDetailViewModel.cs
├── Views/
│   ├── MainWindow.xaml
│   ├── HomeView.xaml
│   ├── UserListView.xaml
│   └── UserDetailView.xaml
├── Services/
│   ├── INavigationService.cs
│   └── NavigationService.cs
├── Constants/
│   ├── RegionNames.cs
│   └── ViewNames.cs
└── Modules/
    └── MainModule.cs
```

### Constants/RegionNames.cs

```csharp
namespace MyPrismApp.Constants
{
    public static class RegionNames
    {
        public const string MainRegion = "MainRegion";
        public const string HeaderRegion = "HeaderRegion";
        public const string SidebarRegion = "SidebarRegion";
    }

    public static class ViewNames
    {
        public const string Home = "HomeView";
        public const string UserList = "UserListView";
        public const string UserDetail = "UserDetailView";
    }
}
```

### Models/User.cs

```csharp
namespace MyPrismApp.Models
{
    public class User
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Email { get; set; }
        public DateTime CreatedDate { get; set; }
    }
}
```

### Services/NavigationService.cs

```csharp
namespace MyPrismApp.Services
{
    public interface INavigationService
    {
        Task NavigateAsync(string viewName, NavigationParameters parameters = null);
        void GoBack();
        void GoForward();
    }

    public class NavigationService : INavigationService
    {
        private readonly IRegionManager _regionManager;

        public NavigationService(IRegionManager regionManager)
        {
            _regionManager = regionManager;
        }

        public Task NavigateAsync(string viewName, NavigationParameters parameters = null)
        {
            var tcs = new TaskCompletionSource<bool>();

            _regionManager.RequestNavigate(
                RegionNames.MainRegion,
                viewName,
                result =>
                {
                    tcs.SetResult(result.Result == true);
                },
                parameters);

            return tcs.Task;
        }

        public void GoBack()
        {
            var region = _regionManager.Regions[RegionNames.MainRegion];
            if (region?.NavigationService?.Journal?.CanGoBack == true)
            {
                region.NavigationService.Journal.GoBack();
            }
        }

        public void GoForward()
        {
            var region = _regionManager.Regions[RegionNames.MainRegion];
            if (region?.NavigationService?.Journal?.CanGoForward == true)
            {
                region.NavigationService.Journal.GoForward();
            }
        }
    }
}
```

### ViewModels/MainWindowViewModel.cs

```csharp
namespace MyPrismApp.ViewModels
{
    public class MainWindowViewModel : BindableBase
    {
        private readonly INavigationService _navigationService;
        private string _title = "Prism Navigation Demo";

        public MainWindowViewModel(INavigationService navigationService)
        {
            _navigationService = navigationService;

            NavigateCommand = new AsyncDelegateCommand<string>(NavigateAsync);
            GoBackCommand = new DelegateCommand(GoBack, CanGoBack);
            GoForwardCommand = new DelegateCommand(GoForward, CanGoForward);
        }

        public string Title
        {
            get => _title;
            set => SetProperty(ref _title, value);
        }

        public AsyncDelegateCommand<string> NavigateCommand { get; }
        public DelegateCommand GoBackCommand { get; }
        public DelegateCommand GoForwardCommand { get; }

        private async Task NavigateAsync(string viewName)
        {
            await _navigationService.NavigateAsync(viewName);
            GoBackCommand.RaiseCanExecuteChanged();
            GoForwardCommand.RaiseCanExecuteChanged();
        }

        private void GoBack()
        {
            _navigationService.GoBack();
            GoBackCommand.RaiseCanExecuteChanged();
            GoForwardCommand.RaiseCanExecuteChanged();
        }

        private bool CanGoBack()
        {
            var region = _regionManager.Regions[RegionNames.MainRegion];
            return region?.NavigationService?.Journal?.CanGoBack ?? false;
        }

        private void GoForward()
        {
            _navigationService.GoForward();
            GoBackCommand.RaiseCanExecuteChanged();
            GoForwardCommand.RaiseCanExecuteChanged();
        }

        private bool CanGoForward()
        {
            var region = _regionManager.Regions[RegionNames.MainRegion];
            return region?.NavigationService?.Journal?.CanGoForward ?? false;
        }
    }
}
```

### ViewModels/UserListViewModel.cs

```csharp
namespace MyPrismApp.ViewModels
{
    public class UserListViewModel : BindableBase, INavigationAware
    {
        private readonly INavigationService _navigationService;
        private readonly IUserService _userService;
        private ObservableCollection<User> _users;

        public UserListViewModel(INavigationService navigationService, IUserService userService)
        {
            _navigationService = navigationService;
            _userService = userService;

            SelectUserCommand = new DelegateCommand<User>(SelectUser);
            Users = new ObservableCollection<User>();
        }

        public ObservableCollection<User> Users
        {
            get => _users;
            set => SetProperty(ref _users, value);
        }

        public DelegateCommand<User> SelectUserCommand { get; }

        public void OnNavigatedTo(NavigationContext navigationContext)
        {
            LoadUsers();
        }

        public bool IsNavigationTarget(NavigationContext navigationContext)
        {
            return true; // 重用实例
        }

        public void OnNavigatedFrom(NavigationContext navigationContext)
        {
            // 清理逻辑
        }

        private async void LoadUsers()
        {
            var users = await _userService.GetUsersAsync();
            Users = new ObservableCollection<User>(users);
        }

        private async void SelectUser(User user)
        {
            var parameters = new NavigationParameters
            {
                { "userId", user.Id }
            };

            await _navigationService.NavigateAsync(ViewNames.UserDetail, parameters);
        }
    }
}
```

### ViewModels/UserDetailViewModel.cs

```csharp
namespace MyPrismApp.ViewModels
{
    public class UserDetailViewModel : BindableBase, INavigationAware
    {
        private readonly IUserService _userService;
        private User _user;

        public UserDetailViewModel(IUserService userService)
        {
            _userService = userService;
        }

        public User User
        {
            get => _user;
            set => SetProperty(ref _user, value);
        }

        public void OnNavigatedTo(NavigationContext navigationContext)
        {
            var userId = navigationContext.Parameters.GetValue<int>("userId");
            LoadUser(userId);
        }

        public bool IsNavigationTarget(NavigationContext navigationContext)
        {
            var requestedUserId = navigationContext.Parameters.GetValue<int>("userId");
            return User?.Id == requestedUserId;
        }

        public void OnNavigatedFrom(NavigationContext navigationContext)
        {
            // 清理逻辑
        }

        private async void LoadUser(int userId)
        {
            User = await _userService.GetUserByIdAsync(userId);
        }
    }
}
```

### Views/MainWindow.xaml

```xml
<Window x:Class="MyPrismApp.Views.MainWindow"
        xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        xmlns:prism="http://prismlibrary.com"
        prism:ViewModelLocator.AutoWireViewModel="True"
        Title="{Binding Title}" Height="600" Width="800">
    <Grid>
        <Grid.RowDefinitions>
            <RowDefinition Height="Auto" />
            <RowDefinition Height="*" />
        </Grid.RowDefinitions>

        <!-- 导航栏 -->
        <StackPanel Grid.Row="0" Orientation="Horizontal" Margin="10">
            <Button Content="首页" Command="{Binding NavigateCommand}" CommandParameter="HomeView" Margin="5" />
            <Button Content="用户列表" Command="{Binding NavigateCommand}" CommandParameter="UserListView" Margin="5" />
            <Separator Width="10" />
            <Button Content="后退" Command="{Binding GoBackCommand}" Margin="5" />
            <Button Content="前进" Command="{Binding GoForwardCommand}" Margin="5" />
        </StackPanel>

        <!-- 主内容区域 -->
        <ContentControl Grid.Row="1"
                        prism:RegionManager.RegionName="MainRegion"
                        Margin="10" />
    </Grid>
</Window>
```

### Views/UserListView.xaml

```xml
<UserControl x:Class="MyPrismApp.Views.UserListView"
             xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
             xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
             xmlns:prism="http://prismlibrary.com"
             prism:ViewModelLocator.AutoWireViewModel="True">
    <Grid>
        <ListBox ItemsSource="{Binding Users}"
                 SelectedItem="{Binding SelectedUser}"
                 DisplayMemberPath="Name">
            <ListBox.InputBindings>
                <MouseBinding MouseAction="LeftDoubleClick"
                              Command="{Binding SelectUserCommand}"
                              CommandParameter="{Binding SelectedUser}" />
            </ListBox.InputBindings>
        </ListBox>
    </Grid>
</UserControl>
```

### Views/UserDetailView.xaml

```xml
<UserControl x:Class="MyPrismApp.Views.UserDetailView"
             xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
             xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
             xmlns:prism="http://prismlibrary.com"
             prism:ViewModelLocator.AutoWireViewModel="True">
    <Grid>
        <StackPanel DataContext="{Binding User}">
            <TextBlock Text="用户详情" FontSize="20" FontWeight="Bold" Margin="0,0,0,10" />
            <TextBlock Text="{Binding Name, StringFormat='姓名: {0}'}" Margin="0,5" />
            <TextBlock Text="{Binding Email, StringFormat='邮箱: {0}'}" Margin="0,5" />
            <TextBlock Text="{Binding CreatedDate, StringFormat='创建时间: {0:yyyy-MM-dd}'}" Margin="0,5" />
        </StackPanel>
    </Grid>
</UserControl>
```

### App.xaml.cs

```csharp
namespace MyPrismApp
{
    public partial class App : PrismApplication
    {
        protected override Window CreateShell()
        {
            return Container.Resolve<MainWindow>();
        }

        protected override void RegisterTypes(IContainerRegistry containerRegistry)
        {
            // 注册服务
            containerRegistry.RegisterSingleton<INavigationService, NavigationService>();
            containerRegistry.RegisterSingleton<IUserService, UserService>();

            // 注册视图
            containerRegistry.RegisterForNavigation<HomeView, HomeViewModel>();
            containerRegistry.RegisterForNavigation<UserListView, UserListViewModel>();
            containerRegistry.RegisterForNavigation<UserDetailView, UserDetailViewModel>();
        }

        protected override void ConfigureModuleCatalog(IModuleCatalog moduleCatalog)
        {
            moduleCatalog.AddModule<MainModule>();
        }
    }
}
```

---

## 总结

Prism 区域导航是一个强大且灵活的框架，可以帮助开发者构建可维护、可测试的 MVVM 应用程序。通过本文档，你应该能够：

1. 理解 Prism 区域导航的核心概念
2. 配置和初始化区域导航
3. 实现各种导航模式
4. 传递和处理导航参数
5. 处理导航生命周期事件
6. 解决常见问题
7. 遵循最佳实践

如需更多信息，请参考：
- [Prism 官方文档](https://prismlibrary.com/docs/)
- [Prism GitHub 仓库](https://github.com/PrismLibrary/Prism)
- [Prism 示例项目](https://github.com/PrismLibrary/Prism-Samples-Wpf)

---

**文档版本**：1.0
**最后更新**：2026-05-31
**适用框架版本**：Prism 8.x
