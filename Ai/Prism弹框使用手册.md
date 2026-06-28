# Prism 弹框使用手册

## 目录

1. [弹框系统概览](#1-弹框系统概览)
2. [快速入门——第一个弹框](#2-快速入门第一个弹框)
3. [弹框 ViewModel](#3-弹框-viewmodel)
4. [弹框 View](#4-弹框-view)
5. [打开与关闭弹框](#5-打开与关闭弹框)
6. [传参与返回结果](#6-传参与返回结果)
7. [确认弹框——内置实现](#7-确认弹框内置实现)
8. [通知弹框——内置实现](#8-通知弹框内置实现)
9. [自定义弹框窗口样式](#9-自定义弹框窗口样式)
10. [非模态弹框](#10-非模态弹框)
11. [弹框的注册方式](#11-弹框的注册方式)
12. [完整实战示例](#12-完整实战示例)
13. [最佳实践与常见问题](#13-最佳实践与常见问题)

---

## 1. 弹框系统概览

Prism 弹框系统的核心组件：

```
┌──────────────────────────────────────────────────┐
│                   IDialogService                  │
│  ShowDialog() / ShowDialogAsync()                │
│  打开展示、接收返回结果                               │
└──────────────────────┬───────────────────────────┘
                       │
         ┌─────────────┴──────────────┐
         │                            │
┌────────┴──────────┐    ┌───────────┴──────────┐
│   Dialog View     │    │   Dialog ViewModel    │
│   (UserControl)    │    │   : IDialogAware      │
│   展示 UI          │    │   处理逻辑、关闭通知     │
└───────────────────┘    └──────────────────────┘
```

| 组件 | 角色 |
|------|------|
| `IDialogService` | 调用方使用，打开/关闭弹框 |
| `IDialogAware` | ViewModel 实现，接管弹框生命周期 |
| `IDialogParameters` | 调用方 ↔ 弹框之间的数据传递 |
| `IDialogResult` | 弹框返回的结果 |
| `IDialogWindow` | 弹框窗口容器（可自定义外观） |

---

## 2. 快速入门——第一个弹框

### 2.1 最小代码示例

**注册**（App.xaml.cs）：

```csharp
protected override void RegisterTypes(IContainerRegistry containerRegistry)
{
    // 注册弹框：View 类型 → ViewModel 类型 或 自动匹配
    containerRegistry.RegisterDialog<UserEditDialog, UserEditDialogViewModel>();
    containerRegistry.RegisterDialog<ConfirmDialog, ConfirmDialogViewModel>();
}
```

**调用**（在任意 ViewModel 中）：

```csharp
public class MainViewModel : BindableBase
{
    private readonly IDialogService _dialogService;

    public MainViewModel(IDialogService dialogService)
    {
        _dialogService = dialogService;
    }

    public DelegateCommand OpenDialogCommand => new DelegateCommand(() =>
    {
        _dialogService.ShowDialog("UserEditDialog");
        // 或异步
        // await _dialogService.ShowDialogAsync("UserEditDialog");
    });
}
```

**弹框 ViewModel**：

```csharp
public class UserEditDialogViewModel : BindableBase, IDialogAware
{
    public string Title => "编辑用户";

    public event Action<IDialogResult> RequestClose;

    public bool CanCloseDialog() => true;

    public void OnDialogOpened(IDialogParameters parameters) { }

    public void OnDialogClosed() { }
}
```

3 个文件、20 行代码，弹框就跑起来了。

---

## 3. 弹框 ViewModel

### 3.1 IDialogAware 接口详解

```csharp
public interface IDialogAware
{
    // ========== 属性 ==========

    /// 弹框标题（显示在窗口标题栏）
    string Title { get; }

    /// 关闭事件：ViewModel 通过它通知窗口关闭
    event Action<IDialogResult> RequestClose;

    // ========== 方法 ==========

    /// 是否可以关闭（窗口点 X 时也会调用）
    bool CanCloseDialog();

    /// 弹框打开时回调（接收调用方传入的参数）
    void OnDialogOpened(IDialogParameters parameters);

    /// 弹框关闭时回调（无论以什么方式关闭都会调用）
    void OnDialogClosed();
}
```

### 3.2 完整实现示例

```csharp
public class UserEditDialogViewModel : BindableBase, IDialogAware
{
    // ==================== 绑定属性 ====================

    private string _userName;
    public string UserName
    {
        get => _userName;
        set => SetProperty(ref _userName, value);
    }

    private string _email;
    public string Email
    {
        get => _email;
        set => SetProperty(ref _email, value);
    }

    private string _phone;
    public string Phone
    {
        get => _phone;
        set => SetProperty(ref _phone, value);
    }

    private bool _isEditMode;
    public bool IsEditMode
    {
        get => _isEditMode;
        set => SetProperty(ref _isEditMode, value);
    }

    // ==================== IDialogAware ====================

    private string _title = "用户编辑";
    public string Title
    {
        get => _title;
        set => SetProperty(ref _title, value);
    }

    public event Action<IDialogResult> RequestClose;

    /// 接收调用方传入的数据
    public void OnDialogOpened(IDialogParameters parameters)
    {
        // 获取调用方传的参数
        if (parameters.ContainsKey("User"))
        {
            var user = parameters.GetValue<UserModel>("User");
            UserName = user.Name;
            Email = user.Email;
            Phone = user.Phone;
            IsEditMode = true;
            Title = $"编辑用户 - {user.Name}";
        }

        if (parameters.ContainsKey("Mode"))
        {
            var mode = parameters.GetValue<string>("Mode");
            IsEditMode = (mode == "Edit");
        }
    }

    /// 关闭前检查
    public bool CanCloseDialog()
    {
        // 有未保存修改时弹出确认
        if (HasUnsavedChanges())
        {
            var result = System.Windows.MessageBox.Show(
                "有未保存的修改，确定关闭？",
                "确认",
                MessageBoxButton.YesNo,
                MessageBoxImage.Question);
            return result == MessageBoxResult.Yes;
        }
        return true;
    }

    /// 清理资源
    public void OnDialogClosed()
    {
        // 取消订阅、释放资源等
    }

    // ==================== 命令 ====================

    public DelegateCommand SaveCommand => new DelegateCommand(() =>
    {
        // 准备好返回数据
        var parameters = new DialogParameters
        {
            { "UserName", UserName },
            { "Email", Email },
            { "Phone", Phone },
            { "IsSaved", true }
        };

        // 关闭弹框并返回 OK
        RequestClose?.Invoke(new DialogResult(ButtonResult.OK, parameters));
    });

    public DelegateCommand CancelCommand => new DelegateCommand(() =>
    {
        // 关闭弹框并返回 Cancel
        RequestClose?.Invoke(new DialogResult(ButtonResult.Cancel));
    });

    private bool HasUnsavedChanges()
    {
        // 判断是否有未保存修改的逻辑
        return false;
    }
}
```

### 3.3 RequestClose 必须调用

```
ViewModel 通过 RequestClose 通知窗户关闭：

RequestClose?.Invoke(new DialogResult(ButtonResult.OK));       // 确认
RequestClose?.Invoke(new DialogResult(ButtonResult.Cancel));   // 取消
RequestClose?.Invoke(new DialogResult(ButtonResult.Yes));      // 是
RequestClose?.Invoke(new DialogResult(ButtonResult.No));       // 否
RequestClose?.Invoke(new DialogResult(ButtonResult.None));     // 自定义
```

> ⚠️ **如果不调用 RequestClose，弹框永远不会关闭！**

---

## 4. 弹框 View

### 4.1 基本 View

```xml
<!-- UserEditDialog.xaml -->
<UserControl x:Class="MyApp.Views.UserEditDialog"
             xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
             xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
             xmlns:prism="http://prismlibrary.com/"
             prism:ViewModelLocator.AutoWireViewModel="True"
             Width="400" Height="350">

    <Grid Margin="20">
        <Grid.RowDefinitions>
            <RowDefinition Height="Auto"/>
            <RowDefinition Height="Auto"/>
            <RowDefinition Height="Auto"/>
            <RowDefinition Height="*"/>
            <RowDefinition Height="Auto"/>
        </Grid.RowDefinitions>

        <!-- 标题 -->
        <TextBlock Grid.Row="0" 
                   Text="{Binding Title}" 
                   FontSize="18" 
                   FontWeight="Bold"
                   Margin="0,0,0,20"/>

        <!-- 姓名 -->
        <Grid Grid.Row="1" Margin="0,8">
            <Grid.ColumnDefinitions>
                <ColumnDefinition Width="80"/>
                <ColumnDefinition Width="*"/>
            </Grid.ColumnDefinitions>
            <TextBlock Text="姓名：" VerticalAlignment="Center"/>
            <TextBox Grid.Column="1" 
                     Text="{Binding UserName, UpdateSourceTrigger=PropertyChanged}"/>
        </Grid>

        <!-- 邮箱 -->
        <Grid Grid.Row="2" Margin="0,8">
            <Grid.ColumnDefinitions>
                <ColumnDefinition Width="80"/>
                <ColumnDefinition Width="*"/>
            </Grid.ColumnDefinitions>
            <TextBlock Text="邮箱：" VerticalAlignment="Center"/>
            <TextBox Grid.Column="1" 
                     Text="{Binding Email, UpdateSourceTrigger=PropertyChanged}"/>
        </Grid>

        <!-- 按钮 -->
        <StackPanel Grid.Row="4" 
                    Orientation="Horizontal" 
                    HorizontalAlignment="Right"
                    Margin="0,15,0,0">
            <Button Content="保存"
                    Command="{Binding SaveCommand}"
                    Width="80" Height="32"
                    Margin="0,0,10,0"
                    IsDefault="True"/>
            <Button Content="取消"
                    Command="{Binding CancelCommand}"
                    Width="80" Height="32"
                    IsCancel="True"/>
        </StackPanel>
    </Grid>
</UserControl>
```

```csharp
// UserEditDialog.xaml.cs —— 通常什么都不用写
public partial class UserEditDialog : UserControl
{
    public UserEditDialog()
    {
        InitializeComponent();
    }
}
```

### 4.2 使用 Prism 内置样式

```xml
<!-- 引用 Prism 内置弹框样式 -->
<UserControl x:Class="MyApp.Views.MyDialog"
             xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
             xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
             xmlns:prism="http://prismlibrary.com/"
             prism:ViewModelLocator.AutoWireViewModel="True"
             Width="450" Height="300">

    <UserControl.Resources>
        <!-- Prism 弹框常用样式 -->
        <Style TargetType="Button" BasedOn="{StaticResource MaterialDesignRaisedButton}"/>
    </UserControl.Resources>

    <Grid Margin="20">
        <!-- 内容... -->
    </Grid>
</UserControl>
```

---

## 5. 打开与关闭弹框

### 5.1 基本打开方式

```csharp
// 引入
private readonly IDialogService _dialogService;

// ========== 方式 1：同步（阻塞 UI 线程，不推荐） ==========
public void ShowSync()
{
    _dialogService.ShowDialog("UserEditDialog");
}

// ========== 方式 2：异步（推荐） ==========
public async void ShowAsync()
{
    var result = await _dialogService.ShowDialogAsync("UserEditDialog");
    
    if (result.Result == ButtonResult.OK)
    {
        // 用户点了确认
        var name = result.Parameters.GetValue<string>("UserName");
        // 使用返回的数据...
    }
    else if (result.Result == ButtonResult.Cancel)
    {
        // 用户点了取消
    }
}

// ========== 方式 3：带参数打开 ==========
public async void ShowWithParameters()
{
    var parameters = new DialogParameters
    {
        { "User", _selectedUser },
        { "Mode", "Edit" }
    };

    var result = await _dialogService.ShowDialogAsync(
        "UserEditDialog",    // 弹框名称
        parameters,          // 传入参数
        callback: r =>       // 关闭后回调（可选，替代 await 方式）
        {
            if (r.Result == ButtonResult.OK)
            {
                RefreshList();
            }
        });
}
```

### 5.2 ButtonResult 枚举

| 值 | 含义 | 使用场景 |
|----|------|---------|
| `None` | 无/自定义 | 不需要标准按钮的场景 |
| `OK` | 确定 | 确认/保存操作 |
| `Cancel` | 取消 | 取消操作 |
| `Yes` | 是 | 二选一确认 |
| `No` | 否 | 二选一拒绝 |
| `Abort` | 中止 | 中断操作 |
| `Retry` | 重试 | 失败重试 |
| `Ignore` | 忽略 | 忽略问题继续 |

### 5.3 关闭时的完整流程

```
调用方                          弹框 ViewModel
  │                                  │
  │── ShowDialogAsync("MyDialog") ──→│
  │                                  │ OnDialogOpened(params)
  │                                  │
  │                              ┌───┤ 用户点击"保存"
  │                              │   │
  │                              │   │ RequestClose?.Invoke(
  │                              │   │   new DialogResult(OK, params))
  │                              │   │
  │ ←── 返回 IDialogResult ──────┘   │
  │                                  │ OnDialogClosed()
  │ result.Result == OK              │
  │ result.Parameters["UserName"]    │
```

---

## 6. 传参与返回结果

### 6.1 调用方 → 弹框（传入参数）

```csharp
// 调用方构造参数
var parameters = new DialogParameters
{
    { "UserId", 123 },
    { "Mode", "Edit" },
    { "Entity", selectedUser },
    { "ReadOnly", false }
};

await _dialogService.ShowDialogAsync("UserEditDialog", parameters);
```

```csharp
// 弹框 ViewModel 接收参数
public void OnDialogOpened(IDialogParameters parameters)
{
    // 方式 1：GetValue<T>（推荐）
    int userId = parameters.GetValue<int>("UserId");
    string mode = parameters.GetValue<string>("Mode");
    UserModel entity = parameters.GetValue<UserModel>("Entity");
    bool readOnly = parameters.GetValue<bool>("ReadOnly");

    // 方式 2：TryGetValue（安全获取）
    if (parameters.TryGetValue<string>("Mode", out var modeValue))
    {
        // 找到了
    }

    // 方式 3：ContainsKey + GetValue
    if (parameters.ContainsKey("Entity"))
    {
        // 有就拿来用
    }

    // 方式 4：索引器
    var mode = parameters["Mode"] as string;
}
```

### 6.2 弹框 → 调用方（返回结果）

```csharp
// 弹框 ViewModel 中构造返回值
public DelegateCommand SaveCommand => new DelegateCommand(() =>
{
    var resultParams = new DialogParameters
    {
        { "IsSaved", true },
        { "UserName", UserName },
        { "Email", Email },
        { "Phone", Phone },
        { "UpdatedAt", DateTime.Now }
    };

    RequestClose?.Invoke(new DialogResult(ButtonResult.OK, resultParams));
});
```

```csharp
// 调用方读取返回结果
var result = await _dialogService.ShowDialogAsync("UserEditDialog", inputParams);

if (result.Result == ButtonResult.OK)
{
    bool isSaved = result.Parameters.GetValue<bool>("IsSaved");
    string userName = result.Parameters.GetValue<string>("UserName");
    string email = result.Parameters.GetValue<string>("Email");
    DateTime updatedAt = result.Parameters.GetValue<DateTime>("UpdatedAt");

    // 更新 UI
    this.UserName = userName;
    this.Email = email;
}
```

### 6.3 传递复杂对象

```csharp
// 传整个对象
var parameters = new DialogParameters
{
    { "User", new UserModel { Id = 1, Name = "张三" } }
};

// 传集合
var parameters = new DialogParameters
{
    { "SelectedUsers", new List<UserModel> { user1, user2 } },
    { "Options", new Dictionary<string, object> { { "key1", value1 } } }
};
```

---

## 7. 确认弹框——内置实现

Prism 自带确认弹框，不需要自己写 View 和 ViewModel。

### 7.1 基本用法

```csharp
public class MainViewModel : BindableBase
{
    private readonly IDialogService _dialogService;

    public DelegateCommand DeleteCommand => new DelegateCommand(async () =>
    {
        var result = await _dialogService.ShowDialogAsync(
            "ConfirmationDialog",
            new DialogParameters
            {
                { "Title", "删除确认" },
                { "Message", "确定要删除选中的用户吗？此操作不可撤销。" }
            });

        if (result.Result == ButtonResult.Yes)
        {
            // 执行删除
        }
    });
}
```

### 7.2 可自定义的确认弹框参数

```csharp
var parameters = new DialogParameters
{
    { "Title", "退出确认" },
    { "Message", "有未保存的修改，确定退出吗？" },
    { "OKButtonText", "保存并退出" },    // 自定义确定按钮文字
    { "CancelButtonText", "继续编辑" }   // 自定义取消按钮文字
};

var result = await _dialogService.ShowDialogAsync("ConfirmationDialog", parameters);

if (result.Result == ButtonResult.OK)  // 点了"保存并退出"
{
    // ...
}
```

### 7.3 确认弹框的 ButtonResult

```
MessageBoxButton.YesNo    → ButtonResult.Yes 或 ButtonResult.No
MessageBoxButton.OKCancel → ButtonResult.OK 或 ButtonResult.Cancel
```

---

## 8. 通知弹框——内置实现

### 8.1 基本用法

```csharp
// 信息通知
var parameters = new DialogParameters
{
    { "Title", "提示" },
    { "Message", "操作成功完成！" }
};
await _dialogService.ShowDialogAsync("NotificationDialog", parameters);

// 不需要任何返回值，用户点确认就关闭
```

### 8.2 警告弹框

```csharp
// 警告通知
var parameters = new DialogParameters
{
    { "Title", "警告" },
    { "Message", "电池电压过低，即将断电关机！" }
};
await _dialogService.ShowDialogAsync("WarningDialog", parameters);
```

### 8.3 错误弹框

```csharp
// 错误通知
try
{
    await SaveDataAsync();
}
catch (Exception ex)
{
    var parameters = new DialogParameters
    {
        { "Title", "错误" },
        { "Message", $"保存失败：{ex.Message}" }
    };
    await _dialogService.ShowDialogAsync("ErrorDialog", parameters);
}
```

---

## 9. 自定义弹框窗口样式

### 9.1 自定义窗口外观

```csharp
// 1. 定义自定义窗口类
public class CustomDialogWindow : Window, IDialogWindow
{
    public IDialogResult Result { get; set; }

    public CustomDialogWindow()
    {
        // 去掉默认窗口边框
        WindowStyle = WindowStyle.None;
        AllowsTransparency = True;
        
        // 圆角、阴影
        // 在 XAML 中等价设置
    }
}
```

```xml
<!-- 2. 在 App.xaml 中注册样式 -->
<Application.Resources>
    <Style TargetType="{x:Type Window}" x:Key="CustomDialogWindowStyle">
        <Setter Property="WindowStyle" Value="None"/>
        <Setter Property="AllowsTransparency" Value="True"/>
        <Setter Property="Background" Value="Transparent"/>
        <Setter Property="ResizeMode" Value="NoResize"/>
        <Setter Property="WindowStartupLocation" Value="CenterOwner"/>
        <Setter Property="ShowInTaskbar" Value="False"/>
        <Setter Property="SizeToContent" Value="WidthAndHeight"/>
    </Style>
</Application.Resources>
```

```csharp
// 3. App.xaml.cs 中注册自定义窗口
protected override void RegisterTypes(IContainerRegistry containerRegistry)
{
    containerRegistry.RegisterDialogWindow<CustomDialogWindow>("CustomDialog");
    // 或者不命名，作为默认的弹框窗口
    containerRegistry.RegisterDialogWindow<CustomDialogWindow>();
}
```

### 9.2 自定义弹框窗口模板（XAML）

```xml
<!-- CustomDialogWindow.xaml -->
<Window x:Class="MyApp.Dialogs.CustomDialogWindow"
        xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        WindowStyle="None"
        AllowsTransparency="True"
        Background="Transparent"
        ResizeMode="NoResize"
        WindowStartupLocation="CenterOwner"
        ShowInTaskbar="False">

    <Border Background="White" 
            CornerRadius="8" 
            BorderBrush="#E0E0E0" 
            BorderThickness="1">
        <Border.Effect>
            <DropShadowEffect BlurRadius="15" 
                              ShadowDepth="3" 
                              Opacity="0.3"/>
        </Border.Effect>

        <Grid>
            <Grid.RowDefinitions>
                <RowDefinition Height="36"/>
                <RowDefinition Height="*"/>
            </Grid.RowDefinitions>

            <!-- 自定义标题栏 -->
            <Border Grid.Row="0" 
                    Background="#0078D4" 
                    CornerRadius="8,8,0,0"
                    MouseLeftButtonDown="OnTitleBarMouseDown">
                <Grid Margin="12,0">
                    <TextBlock Text="{Binding Title, RelativeSource={RelativeSource AncestorType=Window}}"
                               Foreground="White"
                               VerticalAlignment="Center"
                               FontSize="13"/>
                    <Button Content="✕"
                            HorizontalAlignment="Right"
                            Width="30" Height="30"
                            Background="Transparent"
                            Foreground="White"
                            BorderThickness="0"
                            Click="OnCloseClick"/>
                </Grid>
            </Border>

            <!-- 弹框内容区域 -->
            <ContentPresenter Grid.Row="1"/>
        </Grid>
    </Border>
</Window>
```

```csharp
// CustomDialogWindow.xaml.cs
public partial class CustomDialogWindow : Window, IDialogWindow
{
    public IDialogResult Result { get; set; }

    public CustomDialogWindow()
    {
        InitializeComponent();
    }

    private void OnTitleBarMouseDown(object sender, MouseButtonEventArgs e)
    {
        if (e.ButtonState == MouseButtonState.Pressed)
            DragMove();
    }

    private void OnCloseClick(object sender, RoutedEventArgs e)
    {
        // 触发 CanCloseDialog，并设置 Cancel 结果
        Result = new DialogResult(ButtonResult.Cancel);
        Close();
    }
}
```

---

## 10. 非模态弹框

### 10.1 与模态弹框的区别

| 特性 | ShowDialog（模态） | Show（非模态） |
|------|:----------------:|:------------:|
| 阻塞调用方 | 是 | 否 |
| 用户能操作主窗口 | 否 | 是 |
| 返回值 | IDialogResult | 不支持 |
| 典型场景 | 编辑/确认/表单 | 浮动工具窗/日志/属性面板 |

### 10.2 打开非模态弹框

```csharp
public class MainViewModel : BindableBase
{
    private readonly IDialogService _dialogService;

    // 打开非模态弹框
    public DelegateCommand OpenToolWindowCommand => new DelegateCommand(() =>
    {
        _dialogService.Show("LogViewerDialog", parameters, result =>
        {
            // result 为非模态弹框关闭后的返回值
            if (result.Result == ButtonResult.OK)
            {
                // ...
            }
        });
    });
}
```

### 10.3 非模态弹框 ViewModel

```csharp
public class LogViewerDialogViewModel : BindableBase, IDialogAware
{
    public string Title => "日志查看器";

    public event Action<IDialogResult> RequestClose;

    public bool CanCloseDialog() => true;

    public void OnDialogOpened(IDialogParameters parameters) { }

    public void OnDialogClosed() { }

    // 非模态弹框关闭时请求
    public DelegateCommand CloseCommand => new DelegateCommand(() =>
    {
        RequestClose?.Invoke(new DialogResult(ButtonResult.OK));
    });
}
```

---

## 11. 弹框的注册方式

### 11.1 三种注册方式

```csharp
protected override void RegisterTypes(IContainerRegistry containerRegistry)
{
    // ====== 方式 1：自动匹配 ViewModel（同名约定） ======
    containerRegistry.RegisterDialog<MyDialog>();
    // Prism 自动找 MyDialogViewModel

    // ====== 方式 2：手动指定 ViewModel（推荐，明确） ======
    containerRegistry.RegisterDialog<UserEditDialog, UserEditDialogViewModel>();

    // ====== 方式 3：自定义弹框名称 ======
    containerRegistry.RegisterDialog<UserEditDialog, UserEditDialogViewModel>("UserEdit");
    // 调用时用 ShowDialog("UserEdit")
}
```

### 11.2 注册自定义弹框窗口

```csharp
protected override void RegisterTypes(IContainerRegistry containerRegistry)
{
    // 全局默认弹框窗口
    containerRegistry.RegisterDialogWindow<CustomDialogWindow>();

    // 命名弹框窗口
    containerRegistry.RegisterDialogWindow<CustomDialogWindow>("CorneredWindow");

    // 不同弹框用不同窗口
    containerRegistry.RegisterDialogWindow<RoundedDialogWindow>("Rounded");
    containerRegistry.RegisterDialogWindow<FullScreenDialogWindow>("FullScreen");
}
```

### 11.3 完整注册示例

```csharp
protected override void RegisterTypes(IContainerRegistry containerRegistry)
{
    // 自定义弹框窗口
    containerRegistry.RegisterDialogWindow<CustomDialogWindow>();

    // 用户相关弹框
    containerRegistry.RegisterDialog<UserEditDialog, UserEditDialogViewModel>();
    containerRegistry.RegisterDialog<UserDetailDialog, UserDetailDialogViewModel>();

    // 确认/通知弹框（使用 Prism 内置）
    containerRegistry.RegisterDialog<ConfirmationDialog, ConfirmationDialogViewModel>();
    containerRegistry.RegisterDialog<NotificationDialog, NotificationDialogViewModel>();
    containerRegistry.RegisterDialog<WarningDialog, WarningDialogViewModel>();
    containerRegistry.RegisterDialog<ErrorDialog, ErrorDialogViewModel>();

    // 设置弹框
    containerRegistry.RegisterDialog<SettingsDialog, SettingsDialogViewModel>();

    // 批量导入弹框
    containerRegistry.RegisterDialog<ImportDialog, ImportDialogViewModel>();
}
```

---

## 12. 完整实战示例

### 场景：用户管理页面 → 编辑弹框 → 确认后刷新列表

```csharp
// ==================== 1. MainViewModel：用户列表页 ====================
public class UserListViewModel : BindableBase
{
    private readonly IDialogService _dialogService;
    private readonly IUserService _userService;

    private ObservableCollection<UserModel> _users;
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

    public UserListViewModel(IDialogService dialogService, IUserService userService)
    {
        _dialogService = dialogService;
        _userService = userService;
        LoadUsers();
    }

    // ---------- 新增用户 ----------
    public DelegateCommand AddUserCommand => new DelegateCommand(async () =>
    {
        var parameters = new DialogParameters
        {
            { "Mode", "Add" }
        };

        var result = await _dialogService.ShowDialogAsync(
            "UserEditDialog", parameters);

        if (result.Result == ButtonResult.OK)
        {
            LoadUsers();  // 刷新列表
        }
    });

    // ---------- 编辑用户 ----------
    public DelegateCommand EditUserCommand => new DelegateCommand(async () =>
    {
        if (SelectedUser == null) return;

        var parameters = new DialogParameters
        {
            { "Mode", "Edit" },
            { "User", SelectedUser }
        };

        var result = await _dialogService.ShowDialogAsync(
            "UserEditDialog", parameters);

        if (result.Result == ButtonResult.OK)
        {
            LoadUsers();
        }
    });

    // ---------- 删除用户 ----------
    public DelegateCommand DeleteUserCommand => new DelegateCommand(async () =>
    {
        if (SelectedUser == null) return;

        // 先弹出确认框
        var confirmResult = await _dialogService.ShowDialogAsync(
            "ConfirmationDialog",
            new DialogParameters
            {
                { "Title", "删除确认" },
                { "Message", $"确定要删除用户「{SelectedUser.Name}」吗？此操作不可撤销。" }
            });

        if (confirmResult.Result != ButtonResult.Yes) return;

        // 执行删除
        await _userService.DeleteAsync(SelectedUser.Id);
        LoadUsers();
    });

    private void LoadUsers()
    {
        Users = new ObservableCollection<UserModel>(_userService.GetAll());
    }
}
```

```csharp
// ==================== 2. UserEditDialogViewModel：编辑弹框 ====================
public class UserEditDialogViewModel : BindableBase, IDialogAware
{
    private readonly IUserService _userService;

    private string _userName;
    public string UserName
    {
        get => _userName;
        set => SetProperty(ref _userName, value, () =>
        {
            SaveCommand.RaiseCanExecuteChanged();
        });
    }

    private string _email;
    public string Email
    {
        get => _email;
        set => SetProperty(ref _email, value, () =>
        {
            SaveCommand.RaiseCanExecuteChanged();
        });
    }

    private string _phone;
    public string Phone
    {
        get => _phone;
        set => SetProperty(ref _phone, value);
    }

    private string _mode;
    public string Mode
    {
        get => _mode;
        set => SetProperty(ref _mode, value);
    }

    private int _userId;

    // ---- IDialogAware ----
    private string _title = "用户编辑";
    public string Title
    {
        get => _title;
        set => SetProperty(ref _title, value);
    }

    public event Action<IDialogResult> RequestClose;

    public UserEditDialogViewModel(IUserService userService)
    {
        _userService = userService;
    }

    public void OnDialogOpened(IDialogParameters parameters)
    {
        Mode = parameters.GetValue<string>("Mode");

        if (Mode == "Edit" && parameters.ContainsKey("User"))
        {
            var user = parameters.GetValue<UserModel>("User");
            _userId = user.Id;
            UserName = user.Name;
            Email = user.Email;
            Phone = user.Phone;
            Title = $"编辑用户 - {user.Name}";
        }
        else
        {
            Title = "新增用户";
        }
    }

    public bool CanCloseDialog()
    {
        if (HasUnsavedChanges)
        {
            var result = System.Windows.MessageBox.Show(
                "有未保存的修改，确定关闭？",
                "确认",
                MessageBoxButton.YesNo);
            return result == MessageBoxResult.Yes;
        }
        return true;
    }

    public void OnDialogClosed()
    {
        // 清理
    }

    // ---- 命令 ----

    private bool _hasUnsavedChanges = true;
    public bool HasUnsavedChanges
    {
        get => _hasUnsavedChanges;
        set => SetProperty(ref _hasUnsavedChanges, value);
    }

    public DelegateCommand SaveCommand => new DelegateCommand(async () =>
    {
        var user = new UserModel
        {
            Id = _userId,
            Name = UserName,
            Email = Email,
            Phone = Phone
        };

        if (Mode == "Add")
        {
            await _userService.CreateAsync(user);
        }
        else
        {
            await _userService.UpdateAsync(user);
        }

        HasUnsavedChanges = false;

        var resultParams = new DialogParameters
        {
            { "SavedUser", user }
        };

        RequestClose?.Invoke(new DialogResult(ButtonResult.OK, resultParams));
    },
    () => !string.IsNullOrWhiteSpace(UserName) 
          && !string.IsNullOrWhiteSpace(Email))
    .ObservesProperty(() => UserName)
    .ObservesProperty(() => Email);

    public DelegateCommand CancelCommand => new DelegateCommand(() =>
    {
        RequestClose?.Invoke(new DialogResult(ButtonResult.Cancel));
    });
}
```

### XAML 列表页——调用弹框的按钮

```xml
<!-- UserListView.xaml -->
<UserControl x:Class="MyApp.Views.UserListView"
             xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
             xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
             xmlns:prism="http://prismlibrary.com/"
             prism:ViewModelLocator.AutoWireViewModel="True">

    <Grid Margin="10">
        <Grid.RowDefinitions>
            <RowDefinition Height="Auto"/>
            <RowDefinition Height="*"/>
        </Grid.RowDefinitions>

        <!-- 工具栏 -->
        <StackPanel Grid.Row="0" Orientation="Horizontal" Margin="0,0,0,10">
            <Button Content="新增" Command="{Binding AddUserCommand}"
                    Width="80" Margin="0,0,5,0"/>
            <Button Content="编辑" Command="{Binding EditUserCommand}"
                    Width="80" Margin="0,0,5,0"/>
            <Button Content="删除" Command="{Binding DeleteUserCommand}"
                    Width="80"/>
        </StackPanel>

        <!-- 用户列表 -->
        <DataGrid Grid.Row="1" ItemsSource="{Binding Users}"
                  SelectedItem="{Binding SelectedUser, Mode=TwoWay}"
                  AutoGenerateColumns="False">
            <DataGrid.Columns>
                <DataGridTextColumn Header="姓名" Binding="{Binding Name}"/>
                <DataGridTextColumn Header="邮箱" Binding="{Binding Email}"/>
                <DataGridTextColumn Header="电话" Binding="{Binding Phone}"/>
            </DataGrid.Columns>
        </DataGrid>
    </Grid>
</UserControl>
```

---

## 13. 最佳实践与常见问题

### 13.1 最佳实践

| 实践 | 说明 |
|------|------|
| **用 ShowDialogAsync** | 同步 `ShowDialog` 会阻塞 UI |
| **传参用强类型 GetValue\<T\>** | 避免装箱拆箱和手动类型转换 |
| **在 OnDialogClosed 中清理资源** | 取消订阅、释放非托管资源 |
| **RequestClose 必须调用** | 别忘了，否则弹框不关闭 |
| **复杂的弹框拆分为多个小程序** | 别在 OnDialogOpened 里写 200 行 |
| **弹框 ViewModel 也做依赖注入** | 用构造函数注入服务，不直接 new |
| **弹框宽度高度写在 View 上** | 不要在 ViewModel 里操控窗口尺寸 |
| **CanCloseDialog 用于防误关闭** | 有未保存修改时返回 false |

### 13.2 常见问题

#### 问题 1：弹框不关闭

```csharp
// ❌ 原因：忘了调用 RequestClose
public DelegateCommand CloseCommand => new DelegateCommand(() =>
{
    // 啥都没写！弹框不会关闭
});

// ✅ 正确
public DelegateCommand CloseCommand => new DelegateCommand(() =>
{
    RequestClose?.Invoke(new DialogResult(ButtonResult.OK));
});
```

#### 问题 2：弹框一闪就消失了

```csharp
// ❌ 在构造函数中就调用了 RequestClose
public MyDialogViewModel()
{
    RequestClose?.Invoke(new DialogResult(ButtonResult.OK)); // 打开瞬间关闭
}

// ✅ RequestClose 只在用户操作（点击按钮等）时调用
```

#### 问题 3：OnDialogOpened 中参数取不到

```csharp
// ❌ 键名大小写不一致
// 调用方：{ "UserName", "张三" }
// 弹框方：parameters.GetValue<string>("username");  // 小写 u，取不到！

// ✅ 使用常量定义键名
public static class DialogKeys
{
    public const string UserName = "UserName";
    public const string Mode = "Mode";
}
```

#### 问题 4：弹框关闭后调用方数据没刷新

```csharp
// ❌ 在 ShowDialogAsync 外面调用 LoadUsers
public async void OpenDialog()
{
    await _dialogService.ShowDialogAsync("EditDialog");
    LoadUsers();  // 在 await 之后，肯定在弹框关闭后才执行 ✅
}

// ❌ 用同步 ShowDialog 不 await
public void OpenDialog()
{
    _dialogService.ShowDialog("EditDialog"); // 阻塞到弹框关闭
    LoadUsers(); // ✅ 弹框关闭后才执行，但 UI 被阻塞了
}

// ✅ 推荐：异步 + await
public async void OpenDialog()
{
    var result = await _dialogService.ShowDialogAsync("EditDialog");
    if (result.Result == ButtonResult.OK)
        LoadUsers();
}
```

#### 问题 5：弹框窗口样式不生效

```csharp
// 确保注册了自定义窗口
containerRegistry.RegisterDialogWindow<CustomDialogWindow>();

// 如果还是不生效，检查：
// 1. CustomDialogWindow 是不是实现了 IDialogWindow？
// 2. 有没有在弹框 View 上设置了 SizeToContent？
// 3. App.xaml 的全局 Window 样式有没有覆盖你自定义的样式？
```

### 13.3 弹框测试技巧

```csharp
// 用 Moq 模拟 IDialogService 做单元测试

[Test]
public async Task SaveCommand_ShouldCloseDialogWithOK()
{
    // Arrange
    var mockDialogService = new Mock<IDialogService>();
    mockDialogService
        .Setup(d => d.ShowDialogAsync("MyDialog", It.IsAny<IDialogParameters>(), null))
        .ReturnsAsync(new DialogResult(ButtonResult.OK));

    var vm = new MyViewModel(mockDialogService.Object);

    // Act & Assert
    // ...
}
```

---

## 参考资源

- [Prism 官方文档 - Dialog Service](https://prismlibrary.com/docs/dialog-service)
- [Prism GitHub - Dialog 示例](https://github.com/PrismLibrary/Prism-Samples-Wpf)
