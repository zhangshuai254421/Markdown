# Prism MVVM 属性绑定学习指南

## 目录

1. [Prism MVVM 概览](#1-prism-mvvm-概览)
2. [ViewModelLocator——View 与 ViewModel 的自动绑定](#2-viewmodellocatorview-与-viewmodel-的自动绑定)
3. [BindableBase——属性变更通知的基石](#3-bindablebase属性变更通知的基石)
4. [基础属性绑定](#4-基础属性绑定)
5. [集合绑定](#5-集合绑定)
6. [Command 绑定](#6-command-绑定)
7. [复合命令 CompositeCommand](#7-复合命令-compositecommand)
8. [EventAggregator——跨模块通信](#8-eventaggregator跨模块通信)
9. [Region 导航与参数传递](#9-region-导航与参数传递)
10. [IDialogAware——弹窗的绑定](#10-idialogaware弹窗的绑定)
11. [最佳实践与常见问题](#11-最佳实践与常见问题)

---

## 1. Prism MVVM 概览

### 1.1 Prism 中 MVVM 的核心关系

```
┌──────────┐  DataContext  ┌──────────────┐  绑定  ┌─────────┐
│   View   │ ←──────────→ │  ViewModel   │ ←───→ │  Model  │
│ (.xaml)  │  自动注入       │  (.cs)        │        │  (.cs)   │
└──────────┘              └──────────────┘       └─────────┘
     ↑                         ↑
     │  Prism 自动完成          │  INotifyPropertyChanged
     │  ViewModelLocator       │  BindableBase
```

### 1.2 安装

```bash
# NuGet
Install-Package Prism.Wpf          # WPF
Install-Package Prism.Unity        # 或 Prism.DryIoc

# .NET CLI
dotnet add package Prism.Wpf
dotnet add package Prism.DryIoc
```

### 1.3 最小 Prism 应用骨架

```xml
<!-- App.xaml -->
<prism:PrismApplication x:Class="MyApp.App"
                         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
                         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
                         xmlns:prism="http://prismlibrary.com/">
</prism:PrismApplication>
```

```csharp
// App.xaml.cs
public partial class App : PrismApplication
{
    protected override Window CreateShell()
    {
        return Container.Resolve<MainWindow>();
    }

    protected override void RegisterTypes(IContainerRegistry containerRegistry)
    {
        // 注册导航
        containerRegistry.RegisterForNavigation<HomeView>("HomeView");
        containerRegistry.RegisterForNavigation<SettingsView>("SettingsView");
        
        // 注册服务
        containerRegistry.RegisterSingleton<IUserService, UserService>();
    }
}
```

---

## 2. ViewModelLocator——View 与 ViewModel 的自动绑定

### 2.1 默认约定

Prism 通过 **命名约定** 自动把 View 和 ViewModel 关联起来：

```
View 文件夹:  Views/  →  ViewModels/
View 类:      HomeView.xaml  →  HomeViewModel.cs

或：
View 文件夹:  Views/HomeView.xaml
ViewModel 文件夹: ViewModels/HomeViewModel.cs
```

### 2.2 自动绑定 vs 手动绑定

```csharp
// ❌ 老式写法：手动设置 DataContext
public partial class HomeView : UserControl
{
    public HomeView()
    {
        InitializeComponent();
        this.DataContext = new HomeViewModel(new UserService());
    }
}
```

```xml
<!-- ✅ Prism 方式：自动绑定，无需写代码 -->
<UserControl x:Class="MyApp.Views.HomeView"
             xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
             xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
             xmlns:prism="http://prismlibrary.com/"
             prism:ViewModelLocator.AutoWireViewModel="True">
    <!-- DataContext 自动设为 HomeViewModel -->
    <Grid>
        <TextBlock Text="{Binding Title}"/>
    </Grid>
</UserControl>
```

### 2.3 违反命名约定时的手动注册

```csharp
// 当 ViewModel 不在默认路径/不同命名时，手动注册

// 方法 1：在 App.RegisterTypes 中注册
protected override void RegisterTypes(IContainerRegistry containerRegistry)
{
    // 将 HomeView 绑定到指定的 ViewModel 类型
    containerRegistry.RegisterForNavigation<HomeView, HomePageViewModel>();
}

// 方法 2：在 ViewModelLocationProvider 中直接设定
protected override void ConfigureViewModelLocator()
{
    base.ConfigureViewModelLocator();
    
    ViewModelLocationProvider.Register<HomeView, HomePageViewModel>();
    
    // 或用工厂方法
    ViewModelLocationProvider.Register<HomeView>(() =>
    {
        var service = Container.Resolve<IUserService>();
        return new HomePageViewModel(service);
    });
}
```

---

## 3. BindableBase——属性变更通知的基石

### 3.1 为什么需要它

WPF 的数据绑定依赖 `INotifyPropertyChanged.PropertyChanged` 事件。不实现这个接口，当 ViewModel 的属性值变了，UI 不会更新。

### 3.2 基本写法

```csharp
using Prism.Mvvm;

public class UserViewModel : BindableBase
{
    private string _name;
    
    public string Name
    {
        get => _name;
        set => SetProperty(ref _name, value);
    }
}
```

`SetProperty` 做了什么：
```csharp
// SetProperty 等价于：
set
{
    if (_name != value)           // 1. 值不同才触发
    {
        _name = value;            // 2. 更新字段
        RaisePropertyChanged();   // 3. 通知 UI 更新
    }
}
```

### 3.3 带回调的 SetProperty

```csharp
private string _status;

public string Status
{
    get => _status;
    set => SetProperty(ref _status, value, OnStatusChanged);
}

private void OnStatusChanged()
{
    // Status 值改变后自动回调
    RefreshCommand.RaiseCanExecuteChanged();
}
```

### 3.4 手动通知其他属性

当一个属性的改变影响另一个属性时：

```csharp
private string _firstName;
private string _lastName;

public string FirstName
{
    get => _firstName;
    set => SetProperty(ref _firstName, value, () =>
    {
        RaisePropertyChanged(nameof(FullName));  // 通知 FullName 也变了
    });
}

public string LastName
{
    get => _lastName;
    set => SetProperty(ref _lastName, value, () =>
    {
        RaisePropertyChanged(nameof(FullName));
    });
}

// 计算属性（无字段，只读）
public string FullName => $"{FirstName} {LastName}";
```

### 3.5 使用 ObservesProperty（更高级的依赖通知）

```csharp
public class UserViewModel : BindableBase
{
    private string _firstName;
    private string _lastName;

    // ObservesProperty 自动在被观察属性变更时触发通知
    [DependsOn(nameof(FirstName))]
    [DependsOn(nameof(LastName))]
    public string FullName => $"{FirstName} {LastName}";
}
```

---

## 4. 基础属性绑定

### 4.1 四种绑定方向

| Mode | 说明 | 典型场景 |
|------|------|---------|
| **OneWay** | ViewModel → View | 显示/标签/只读 |
| **TwoWay** | 双向 | 输入框、下拉框 |
| **OneWayToSource** | View → ViewModel | 极少用 |
| **OneTime** | 仅初始化一次 | 静态文本 |

```xml
<!-- OneWay：只显不写（默认） -->
<TextBlock Text="{Binding Name}"/>

<!-- TwoWay：双向 -->
<TextBox Text="{Binding Name, Mode=TwoWay, UpdateSourceTrigger=PropertyChanged}"/>

<!-- OneTime：只初始化读一次 -->
<TextBlock Text="{Binding AppVersion, Mode=OneTime}"/>
```

### 4.2 UpdateSourceTrigger——什么时候把值写回 ViewModel

```xml
<!-- PropertyChanged：每敲一个字符就回写 → 适合实时验证 -->
<TextBox Text="{Binding SearchText, UpdateSourceTrigger=PropertyChanged}"/>

<!-- LostFocus：焦点离开时才回写 → 适合表单（默认） -->
<TextBox Text="{Binding Name, UpdateSourceTrigger=LostFocus}"/>

<!-- Explicit：代码手动调用才回写 -->
<TextBox Text="{Binding Note, UpdateSourceTrigger=Explicit}"/>
```

```csharp
// Explicit 模式下手动触发
var bindingExpression = myTextBox.GetBindingExpression(TextBox.TextProperty);
bindingExpression?.UpdateSource();
```

### 4.3 格式化绑定——StringFormat

```xml
<!-- 日期格式化 -->
<TextBlock Text="{Binding CreateTime, StringFormat='{0:yyyy-MM-dd HH:mm:ss}'}"/>

<!-- 数字格式化 -->
<TextBlock Text="{Binding Price, StringFormat='{0:C}'}"/>        <!-- ￥12.50 -->
<TextBlock Text="{Binding Ratio, StringFormat='{0:P1}'}"/>      <!-- 12.5% -->
<TextBlock Text="{Binding Count, StringFormat='{0:N0}'}"/>      <!-- 1,234 -->

<!-- 多重格式化 -->
<TextBlock>
    <TextBlock.Text>
        <MultiBinding StringFormat="姓名{0}，年龄{1}">
            <Binding Path="Name"/>
            <Binding Path="Age"/>
        </MultiBinding>
    </TextBlock.Text>
</TextBlock>
```

### 4.4 值转换器（IValueConverter）

```csharp
// 布尔 → 可见性
public class BoolToVisibilityConverter : IValueConverter
{
    public object Convert(object value, Type targetType, object parameter, CultureInfo culture)
    {
        bool boolValue = (bool)value;
        bool invert = parameter?.ToString() == "Invert";
        return boolValue ^ invert ? Visibility.Visible : Visibility.Collapsed;
    }

    public object ConvertBack(object value, Type targetType, object parameter, CultureInfo culture)
    {
        return (Visibility)value == Visibility.Visible;
    }
}

// 布尔 → 颜色（在线/离线）
public class BoolToColorConverter : IValueConverter
{
    public object Convert(object value, Type targetType, object parameter, CultureInfo culture)
    {
        return (bool)value 
            ? new SolidColorBrush(Colors.Green) 
            : new SolidColorBrush(Colors.Gray);
    }

    public object ConvertBack(object value, Type targetType, object parameter, CultureInfo culture)
    {
        throw new NotImplementedException();
    }
}
```

```xml
<!-- 使用转换器 -->
<Window.Resources>
    <local:BoolToVisibilityConverter x:Key="BoolToVis"/>
    <local:BoolToColorConverter x:Key="BoolToColor"/>
</Window.Resources>

<Border Visibility="{Binding IsConnected, Converter={StaticResource BoolToVis}}"/>
<Border Visibility="{Binding IsLoading, Converter={StaticResource BoolToVis}, ConverterParameter=Invert}"/>
<Ellipse Fill="{Binding IsOnline, Converter={StaticResource BoolToColor}}"/>
```

---

## 5. 集合绑定

### 5.1 ObservableCollection

```csharp
// ❌ 不能用 List（不通知 UI）
public List<string> Items { get; set; } = new List<string>();

// ✅ 用 ObservableCollection（增删自动通知 UI）
public ObservableCollection<UserModel> Users { get; } 
    = new ObservableCollection<UserModel>();
```

```xml
<ListBox ItemsSource="{Binding Users}"
         DisplayMemberPath="Name"
         SelectedItem="{Binding SelectedUser, Mode=TwoWay}"/>
```

### 5.2 批量更新集合

```csharp
// ❌ 循环添加会导致 UI 刷新 N 次
foreach (var user in newUsers)
    Users.Add(user);

// ✅ 先构造列表，再用 AddRange（Prism 扩展）
Users.AddRange(newUsers);
```

### 5.3 ViewModel 中更新集合项的属性

```csharp
// Model 也必须实现 INotifyPropertyChanged
public class UserModel : BindableBase
{
    private string _name;
    public string Name
    {
        get => _name;
        set => SetProperty(ref _name, value);
    }

    private bool _isSelected;
    public bool IsSelected
    {
        get => _isSelected;
        set => SetProperty(ref _isSelected, value);
    }
}
```

```xml
<DataGrid ItemsSource="{Binding Users}" AutoGenerateColumns="False">
    <DataGrid.Columns>
        <DataGridCheckBoxColumn Binding="{Binding IsSelected, Mode=TwoWay, 
            UpdateSourceTrigger=PropertyChanged}"/>
        <DataGridTextColumn Header="名称" Binding="{Binding Name}"/>
    </DataGrid.Columns>
</DataGrid>
```

### 5.4 ICollectionView——筛选与排序

```csharp
public class UserListViewModel : BindableBase
{
    private ICollectionView _usersView;
    private string _filterText;

    public ObservableCollection<UserModel> Users { get; } 
        = new ObservableCollection<UserModel>();

    public ICollectionView UsersView
    {
        get => _usersView;
        private set => SetProperty(ref _usersView, value);
    }

    public string FilterText
    {
        get => _filterText;
        set
        {
            SetProperty(ref _filterText, value);
            UsersView?.Refresh();  // 过滤文本改变时刷新
        }
    }

    public UserListViewModel()
    {
        UsersView = CollectionViewSource.GetDefaultView(Users);
        UsersView.Filter = OnFilterUser;
    }

    private bool OnFilterUser(object obj)
    {
        if (string.IsNullOrWhiteSpace(FilterText)) return true;
        var user = (UserModel)obj;
        return user.Name.Contains(FilterText, StringComparison.OrdinalIgnoreCase);
    }
}
```

```xml
<TextBox Text="{Binding FilterText, UpdateSourceTrigger=PropertyChanged}"
         PlaceholderText="搜索..."/>
<ListBox ItemsSource="{Binding UsersView}"/>
```

---

## 6. Command 绑定

### 6.1 DelegateCommand——最常用的命令

```csharp
public class LoginViewModel : BindableBase
{
    public DelegateCommand LoginCommand { get; }

    public LoginViewModel()
    {
        // 无参数命令
        LoginCommand = new DelegateCommand(OnLogin, CanLogin);
    }

    private void OnLogin()
    {
        // 执行登录逻辑
    }

    private bool CanLogin()
    {
        return !string.IsNullOrWhiteSpace(UserName) 
            && !string.IsNullOrWhiteSpace(Password);
    }

    // 当条件变化时手动刷新 CanExecute
    private string _userName;
    public string UserName
    {
        get => _userName;
        set
        {
            SetProperty(ref _userName, value);
            LoginCommand.RaiseCanExecuteChanged();  // ← 关键！
        }
    }
}
```

```xml
<Button Content="登录" Command="{Binding LoginCommand}"/>
```

### 6.2 带参数的命令

```csharp
public DelegateCommand<UserModel> DeleteCommand { get; }

public UserListViewModel()
{
    DeleteCommand = new DelegateCommand<UserModel>(OnDelete, CanDelete);
}

private void OnDelete(UserModel user)
{
    Users.Remove(user);
}

private bool CanDelete(UserModel user)
{
    return user != null && !user.IsAdmin;
}
```

```xml
<!-- 传递 CommandParameter -->
<Button Content="删除" 
        Command="{Binding DeleteCommand}" 
        CommandParameter="{Binding ElementName=userList, Path=SelectedItem}"/>
```

### 6.3 ObserveProperty——自动刷新 CanExecute

```csharp
public class LoginViewModel : BindableBase
{
    private string _userName;
    private string _password;

    public string UserName
    {
        get => _userName;
        set => SetProperty(ref _userName, value);
    }

    public string Password
    {
        get => _password;
        set => SetProperty(ref _password, value);
    }

    public DelegateCommand LoginCommand { get; }

    public LoginViewModel()
    {
        // ObservesProperty：当 UserName 或 Password 变化时，自动调用 CanLogin
        LoginCommand = new DelegateCommand(OnLogin, CanLogin)
            .ObservesProperty(() => UserName)
            .ObservesProperty(() => Password);
    }

    private void OnLogin() { /* ... */ }

    private bool CanLogin()
    {
        return !string.IsNullOrWhiteSpace(UserName) 
            && !string.IsNullOrWhiteSpace(Password);
    }
}
```

### 6.4 DelegateCommand vs DelegateCommand\<T\>

```csharp
// 无参数：最常见的按钮点击
public DelegateCommand SaveCommand { get; }

// 带参数：列表项操作
public DelegateCommand<UserModel> EditCommand { get; }
public DelegateCommand<int> SelectTabCommand { get; }
```

---

## 7. 复合命令 CompositeCommand

当一个按钮需要同时触发多个 ViewModel 的命令时：

```csharp
// App.xaml.cs 中注册全局复合命令
protected override void RegisterTypes(IContainerRegistry containerRegistry)
{
    var saveAllCommand = new CompositeCommand();
    saveAllCommand.RegisterCommand(
        Container.Resolve<DocumentViewModel>().SaveCommand);
    saveAllCommand.RegisterCommand(
        Container.Resolve<SettingsViewModel>().SaveCommand);
}
```

```csharp
// 多个 ViewModel 各自注册自己的命令
public class DocumentViewModel : BindableBase
{
    public DelegateCommand SaveCommand { get; }

    public DocumentViewModel(IApplicationCommands applicationCommands)
    {
        SaveCommand = new DelegateCommand(OnSave);
        applicationCommands.SaveAllCommand.RegisterCommand(SaveCommand);
    }
}
```

```xml
<!-- Shell 菜单栏点击一次，所有注册的 ViewModel 的 Save 都执行 -->
<MenuItem Header="全部保存" Command="{Binding SaveAllCommand}"/>
```

---

## 8. EventAggregator——跨模块通信

### 8.1 为什么需要它

ViewModel 之间的通信不应该互相引用。EventAggregator 是发布-订阅模式的中介者。

```
ViewModel A                             ViewModel B
    │                                       │
    │  Publish("UserChanged")              │ Subscribe("UserChanged")
    │                                       │
    └─────────→ EventAggregator ──────────→┘
                  (中介者)
```

### 8.2 定义事件消息

```csharp
// 消息类继承 PubSubEvent<T>，T 是传递的数据类型
public class UserChangedEvent : PubSubEvent<UserModel> { }

public class StatusUpdatedEvent : PubSubEvent<string> { }

// 不带数据的消息
public class RefreshRequestEvent : PubSubEvent { }
```

### 8.3 发布——Publish

```csharp
public class UserEditViewModel : BindableBase
{
    private readonly IEventAggregator _eventAggregator;

    public UserEditViewModel(IEventAggregator eventAggregator)
    {
        _eventAggregator = eventAggregator;
    }

    public DelegateCommand SaveCommand { get; }

    private void OnSave()
    {
        // 保存完成后，通知其他模块
        _eventAggregator.GetEvent<UserChangedEvent>().Publish(CurrentUser);
        
        // 也可以发布不带数据的消息
        _eventAggregator.GetEvent<RefreshRequestEvent>().Publish();
    }
}
```

### 8.4 订阅——Subscribe

```csharp
public class UserListViewModel : BindableBase
{
    private readonly IEventAggregator _eventAggregator;
    
    public UserListViewModel(IEventAggregator eventAggregator)
    {
        _eventAggregator = eventAggregator;

        // 订阅 UserChangedEvent
        _eventAggregator.GetEvent<UserChangedEvent>()
            .Subscribe(OnUserChanged, ThreadOption.UIThread);
    }

    private void OnUserChanged(UserModel changedUser)
    {
        // 收到通知，刷新列表
        RefreshList();
    }

    // ⚠️ 记得在页面离开时取消订阅，防止内存泄漏
    public void OnNavigatedFrom(NavigationContext navigationContext)
    {
        _eventAggregator.GetEvent<UserChangedEvent>().Unsubscribe(OnUserChanged);
    }
}
```

### 8.5 ThreadOption——在哪个线程接收

| ThreadOption | 说明 |
|-------------|------|
| `PublisherThread` | 在发布者线程接收（默认） |
| `UIThread` | 在 UI 线程接收（大多数情况用这个） |
| `BackgroundThread` | 在后台线程接收 |

### 8.6 过滤器

```csharp
// 只接收满足条件的消息
_eventAggregator.GetEvent<UserChangedEvent>()
    .Subscribe(OnUserChanged, ThreadOption.UIThread, 
        filter: user => user.Department == "研发部");
```

---

## 9. Region 导航与参数传递

### 9.1 导航基础

```csharp
public class MainViewModel : BindableBase
{
    private readonly IRegionManager _regionManager;

    public MainViewModel(IRegionManager regionManager)
    {
        _regionManager = regionManager;
    }

    public DelegateCommand NavigateToHomeCommand => 
        new DelegateCommand(() =>
        {
            _regionManager.RequestNavigate("ContentRegion", "HomeView");
        });

    public DelegateCommand NavigateToDetailCommand => 
        new DelegateCommand(() =>
        {
            var parameters = new NavigationParameters
            {
                { "UserId", SelectedUserId },
                { "Mode", "Edit" }
            };
            _regionManager.RequestNavigate("ContentRegion", "DetailView", parameters);
        });
}
```

### 9.2 INavigationAware——接收导航参数

```csharp
public class DetailViewModel : BindableBase, INavigationAware
{
    private int _userId;
    private string _mode;

    public int UserId
    {
        get => _userId;
        set => SetProperty(ref _userId, value);
    }

    // 导航到此页面时调用
    public void OnNavigatedTo(NavigationContext navigationContext)
    {
        if (navigationContext.Parameters.ContainsKey("UserId"))
            UserId = int.Parse(navigationContext.Parameters["UserId"].ToString());

        if (navigationContext.Parameters.ContainsKey("Mode"))
            _mode = navigationContext.Parameters["Mode"].ToString();
        
        LoadData();
    }

    // 是否可以导航到此页面（权限检查等）
    public bool IsNavigationTarget(NavigationContext navigationContext)
    {
        return true;
    }

    // 从此页面导航离开时调用
    public void OnNavigatedFrom(NavigationContext navigationContext)
    {
        // 清理资源、取消订阅等
    }
}
```

### 9.3 IConfirmNavigationRequest——导航前确认

```csharp
public class EditViewModel : BindableBase, IConfirmNavigationRequest
{
    public void ConfirmNavigationRequest(NavigationContext navigationContext, 
        Action<bool> continuationCallback)
    {
        if (HasUnsavedChanges)
        {
            // 弹出确认框
            var result = MessageBox.Show("有未保存的修改，确定离开？", 
                "确认", MessageBoxButton.YesNo);
            continuationCallback(result == MessageBoxResult.Yes);
        }
        else
        {
            continuationCallback(true);
        }
    }
}
```

---

## 10. IDialogAware——弹窗的绑定

### 10.1 弹窗 ViewModel

```csharp
public class ConfirmDialogViewModel : BindableBase, IDialogAware
{
    private string _message;
    private string _title;

    public string Title
    {
        get => _title;
        set => SetProperty(ref _title, value);
    }

    public string Message
    {
        get => _message;
        set => SetProperty(ref _message, value);
    }

    // 对话框关闭事件
    public DialogCloseListener RequestClose { get; }

    // 是否可以关闭
    public bool CanCloseDialog() => true;

    // 对话框打开时
    public void OnDialogOpened(IDialogParameters parameters)
    {
        // 接收传递的参数
        Message = parameters.GetValue<string>("Message");
        Title = parameters.GetValue<string>("Title");
    }

    // 对话框关闭时
    public void OnDialogClosed()
    {
        // 清理
    }

    // 点击确认
    public DelegateCommand ConfirmCommand => new DelegateCommand(() =>
    {
        var result = new DialogResult(ButtonResult.OK);
        RequestClose.Invoke(result);
    });

    // 点击取消
    public DelegateCommand CancelCommand => new DelegateCommand(() =>
    {
        var result = new DialogResult(ButtonResult.Cancel);
        RequestClose.Invoke(result);
    });
}
```

### 10.2 调用弹窗

```csharp
public class MainViewModel : BindableBase
{
    private readonly IDialogService _dialogService;

    public MainViewModel(IDialogService dialogService)
    {
        _dialogService = dialogService;
    }

    public DelegateCommand ShowConfirmCommand => new DelegateCommand(async () =>
    {
        var parameters = new DialogParameters
        {
            { "Title", "删除确认" },
            { "Message", "确定要删除该用户吗？" }
        };

        var result = await _dialogService.ShowDialogAsync(
            "ConfirmDialog", parameters);

        if (result.Result == ButtonResult.OK)
        {
            DeleteUser();
        }
    });
}
```

```csharp
// 在 App.xaml.cs 中注册
protected override void RegisterTypes(IContainerRegistry containerRegistry)
{
    containerRegistry.RegisterDialog<ConfirmDialog, ConfirmDialogViewModel>();
}
```

---

## 11. 最佳实践与常见问题

### 11.1 最佳实践

| 实践 | 说明 |
|------|------|
| **ViewModel 不引用 View** | 永远不要让 ViewModel 知道 View 的具体类型 |
| **构造函数注入依赖** | 用 DI 注入服务、EventAggregator、RegionManager |
| **命令用 ObserveProperty** | 自动刷新 CanExecute，少写 `RaiseCanExecuteChanged` |
| **集合用 ObservableCollection** | List 不会通知 UI 增删 |
| **导航离开时清理订阅** | `OnNavigatedFrom` 中 Unsubscribe |
| **复杂属性用 SetProperty 回调** | 第二参数传回调，避免手动调用 |
| **Model 也要实现 INotifyPropertyChanged** | 否则 UI 上绑定 Model 属性不会更新 |
| **大列表用虚拟化** | `VirtualizingStackPanel.IsVirtualizing="True"` |

### 11.2 常见问题

#### 问题 1：UI 不更新

```csharp
// 常见原因排查清单：

// 1. 属性没有调用 SetProperty
public string Name { get; set; }  // ❌

public string Name { get => _name; set => SetProperty(ref _name, value); }  // ✅

// 2. 集合没用 ObservableCollection
public List<UserModel> Users { get; set; }  // ❌

public ObservableCollection<UserModel> Users { get; }  // ✅

// 3. DataContext 没绑定上
// 检查 AutoWireViewModel="True"，检查命名约定

// 4. Model 属性变更不通知（集合中的子项）
// Model 也要实现 BindableBase

// 5. 在非 UI 线程更新属性 → 用 ThreadOption.UIThread 或
// Application.Current.Dispatcher.Invoke(() => { ... });
```

#### 问题 2：命令按钮一直是灰的

```csharp
// 排查：
// 1. CanExecute 方法返回了 false
// 2. 没有调用 RaiseCanExecuteChanged()
// 3. 没有用 ObservesProperty

// 修复：
SaveCommand = new DelegateCommand(OnSave, CanSave)
    .ObservesProperty(() => Name)
    .ObservesProperty(() => Email);
```

#### 问题 3：内存泄漏

```csharp
// EventAggregator 订阅后忘记取消 → 最典型泄漏

// 解决：INavigationAware 中取消
public void OnNavigatedFrom(NavigationContext navigationContext)
{
    _eventAggregator.GetEvent<UserChangedEvent>().Unsubscribe(OnUserChanged);
}

// 或使用弱引用订阅
_eventAggregator.GetEvent<UserChangedEvent>()
    .Subscribe(OnUserChanged, ThreadOption.UIThread, keepSubscriberReferenceAlive: false);
```

### 11.3 ViewModel 生命周期

```
创建 → OnNavigatedTo → (用户交互) → OnNavigatedFrom → 销毁

关键节点：
  - 构造函数：注入依赖、初始化命令、订阅事件
  - OnNavigatedTo：接收参数、加载数据
  - OnNavigatedFrom：取消订阅、保存临时状态
```

### 11.4 ViewModel 单例 vs 瞬时

```csharp
// 单例：只有一个实例（Shell、全局菜单）
containerRegistry.RegisterSingleton<ShellViewModel>();

// 瞬时（每次导航新建）：大多数页面都是这个
containerRegistry.Register<HomeViewModel>();  // Transient 默认

// 作用域：一组相关页面共享（不常用）
containerRegistry.RegisterScoped<WizardViewModel>();
```

---

## 参考资源

- [Prism 官方文档](https://prismlibrary.com/docs/)
- [Prism GitHub](https://github.com/PrismLibrary/Prism)
- [Prism 示例项目](https://github.com/PrismLibrary/Prism-Samples-Wpf)
