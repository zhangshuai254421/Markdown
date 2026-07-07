# WPF CollectionView 详细使用指南

## 目录

1. [概述](#概述)
2. [CollectionView 的核心概念](#collectionview-的核心概念)
3. [获取 CollectionView](#获取-collectionview)
4. [排序 (Sorting)](#排序-sorting)
5. [分组 (Grouping)](#分组-grouping)
6. [过滤 (Filtering)](#过滤-filtering)
7. [当前项管理 (Current Item)](#当前项管理-current-item)
8. [Live Shaping 动态整形](#live-shaping-动态整形)
9. [CollectionView 类型对比](#collectionview-类型对比)
10. [MVVM 中的最佳实践](#mvvm-中的最佳实践)
11. [常见问题与解决方案](#常，，，见问题与解决方案)
12. [完整实战示例](#完整实战示例)

---

## 概述

### 什么是 CollectionView？

`CollectionView` 是 WPF 数据绑定系统中的**视图层**，它位于数据源（如 `ObservableCollection<T>`）和 UI 控件（如 `ListBox`、`DataGrid`、`ComboBox`）之间，提供对数据的**排序**、**分组**、**过滤**和**当前项跟踪**功能，而**不修改原始数据源**。

```
┌─────────────────┐     ┌─────────────────────┐     ┌─────────────────┐
│  数据源          │ ──→ │  CollectionView     │ ──→ │  UI 控件        │
│ (ObservableColl) │     │ (排序/分组/过滤/导航) │     │ (ListBox/DataGrid)│
└─────────────────┘     └─────────────────────┘     └─────────────────┘
```

### 为什么需要 CollectionView？

- **关注点分离**：排序、分组、过滤逻辑与数据模型分离
- **不修改源数据**：所有变换只在视图层生效，原始集合保持不变
- **多视图支持**：同一个数据源可以创建多个不同的视图
- **当前项同步**：多个控件可以共享同一个当前项（如 Master-Detail 模式）

```csharp
// 核心思想：CollectionView 是数据源的"镜头"
var products = new ObservableCollection<Product>();  // 原始数据
ICollectionView view = CollectionViewSource.GetDefaultView(products);
// view 可以排序、过滤，但 products 本身不变
```

---

## CollectionView 的核心概念

### 类层次结构

```
ICollectionView (接口)
├── CollectionView (抽象基类)
│   ├── ListCollectionView        ← 最常用，用于 IList 数据源
│   ├── BindingListCollectionView ← 用于 IBindingList 数据源
│   └── ItemCollection            ← 用于 ItemsControl.Items 直接添加
└── ICollectionViewLiveShaping (接口，.NET 4.5+)
```

### 核心接口

| 接口/类 | 用途 |
|---------|------|
| `ICollectionView` | 定义排序、过滤、分组、当前项的核心功能 |
| `IEditableCollectionView` | 支持添加/删除/编辑项 |
| `ICollectionViewLiveShaping` | 支持属性值变化时自动重新排序/过滤/分组 |
| `IPagedCollectionView` | Silverlight 遗留，WPF 中一般不使用 |

---

## 获取 CollectionView

### 方式一：通过 CollectionViewSource.GetDefaultView()（推荐）

```csharp
// 直接在代码中获取默认视图
ICollectionView view = CollectionViewSource.GetDefaultView(myCollection);

// 设置排序
view.SortDescriptions.Add(new SortDescription("Name", ListSortDirection.Ascending));

// 设置分组
view.GroupDescriptions.Add(new PropertyGroupDescription("Category"));

// 设置过滤
view.Filter = item => (item as Product)?.Price > 100;
```

### 方式二：在 XAML 中通过 CollectionViewSource 声明

```xml
<Window.Resources>
    <CollectionViewSource x:Key="ProductView" Source="{Binding Products}">
        <CollectionViewSource.SortDescriptions>
            <scm:SortDescription PropertyName="Name" Direction="Ascending"/>
        </CollectionViewSource.SortDescriptions>
        <CollectionViewSource.GroupDescriptions>
            <PropertyGroupDescription PropertyName="Category"/>
        </CollectionViewSource.GroupDescriptions>
    </CollectionViewSource>
</Window.Resources>

<!-- 使用 -->
<ListBox ItemsSource="{Binding Source={StaticResource ProductView}}"/>
```

### 方式三：代码中创建 CollectionViewSource

```csharp
var cvs = new CollectionViewSource
{
    Source = myCollection
};
cvs.SortDescriptions.Add(new SortDescription("Name", ListSortDirection.Ascending));
cvs.GroupDescriptions.Add(new PropertyGroupDescription("Category"));

// 获取其 View
ICollectionView view = cvs.View;
myListBox.ItemsSource = view;
```

### 重要提示

> ⚠️ `GetDefaultView()` 总是返回**同一个**视图实例。如果多处同时修改同一个默认视图，会相互影响。需要独立视图时，应显式创建新的 `CollectionViewSource`。

```csharp
// 这两个变量指向同一个 ListCollectionView 实例！
var view1 = CollectionViewSource.GetDefaultView(myCollection);
var view2 = CollectionViewSource.GetDefaultView(myCollection);
// view1 == view2 → true
```

---

## 排序 (Sorting)

### 单属性排序

```csharp
ICollectionView view = CollectionViewSource.GetDefaultView(products);
view.SortDescriptions.Clear();
view.SortDescriptions.Add(new SortDescription("Name", ListSortDirection.Ascending));
```

### 多属性排序

```csharp
view.SortDescriptions.Clear();
view.SortDescriptions.Add(new SortDescription("Category", ListSortDirection.Ascending));   // 先按分类
view.SortDescriptions.Add(new SortDescription("Price", ListSortDirection.Descending));     // 再按价格
view.SortDescriptions.Add(new SortDescription("Name", ListSortDirection.Ascending));       // 最后按名称
```

### 自定义排序规则

当默认的属性排序不满足需求时，可以实现 `IComparer`：

```csharp
public class NaturalStringComparer : IComparer
{
    [DllImport("shlwapi.dll", CharSet = CharSet.Unicode)]
    private static extern int StrCmpLogicalW(string x, string y);

    public int Compare(object? x, object? y)
    {
        return StrCmpLogicalW(x?.ToString(), y?.ToString());
    }
}

// 使用自定义排序
var listCollectionView = view as ListCollectionView;
listCollectionView.CustomSort = new NaturalStringComparer();
```

### 清除排序

```csharp
// 方式1：清除所有排序描述
view.SortDescriptions.Clear();

// 方式2：如果使用了 CustomSort
var lcv = view as ListCollectionView;
lcv.CustomSort = null;
```

### 排序性能注意

- `CustomSort` 和 `SortDescriptions` **互斥**：设置一个会清空另一个
- 每次修改 `SortDescriptions` 都会触发完整刷新（`Refresh()`）
- 大量数据排序时，应批量添加 `SortDescription`，避免逐个添加触发多次刷新：

```csharp
// ❌ 不好：每次 Add 触发一次刷新
view.SortDescriptions.Add(new SortDescription("A", ...));
view.SortDescriptions.Add(new SortDescription("B", ...));

// ✅ 好：使用 DeferRefresh 延迟刷新
using (view.DeferRefresh())
{
    view.SortDescriptions.Add(new SortDescription("A", ...));
    view.SortDescriptions.Add(new SortDescription("B", ...));
}
// 离开 using 块时统一刷新一次
```

---

## 分组 (Grouping)

### 基本分组

```csharp
ICollectionView view = CollectionViewSource.GetDefaultView(products);
view.GroupDescriptions.Clear();
view.GroupDescriptions.Add(new PropertyGroupDescription("Category"));
```

### XAML 中的分组样式

```xml
<ListBox ItemsSource="{Binding Products}">
    <ListBox.GroupStyle>
        <GroupStyle>
            <GroupStyle.HeaderTemplate>
                <DataTemplate>
                    <TextBlock FontWeight="Bold" FontSize="14" 
                               Text="{Binding Name}"/>
                </DataTemplate>
            </GroupStyle.HeaderTemplate>
            <GroupStyle.ContainerStyle>
                <Style TargetType="GroupItem">
                    <Setter Property="Margin" Value="0,0,0,10"/>
                </Style>
            </GroupStyle.ContainerStyle>
        </GroupStyle>
    </ListBox.GroupStyle>
</ListBox>
```

### 自定义分组逻辑

通过继承 `GroupDescription` 或使用 `PropertyGroupDescription.Converter`：

```csharp
// 方法一：使用 IValueConverter 自定义分组键
public class PriceRangeConverter : IValueConverter
{
    public object Convert(object value, Type targetType, object parameter, CultureInfo culture)
    {
        if (value is decimal price)
        {
            return price switch
            {
                < 50 => "低价（< 50）",
                < 200 => "中价（50 - 200）",
                _ => "高价（> 200）"
            };
        }
        return "未知";
    }

    public object ConvertBack(object value, Type targetType, object parameter, CultureInfo culture)
        => throw new NotSupportedException();
}

// 使用
view.GroupDescriptions.Add(new PropertyGroupDescription("Price", new PriceRangeConverter()));
```

```csharp
// 方法二：继承 GroupDescription 实现完全自定义分组
public class CustomGroupDescription : GroupDescription
{
    public override object GroupNameFromItem(object item, int level, CultureInfo culture)
    {
        if (item is Product p)
        {
            // 返回分组键
            return p.Name?.FirstOrDefault().ToString()?.ToUpper() ?? "#";
        }
        return "#";
    }
}

view.GroupDescriptions.Add(new CustomGroupDescription());
```

### 多层分组

```csharp
using (view.DeferRefresh())
{
    view.GroupDescriptions.Clear();
    view.GroupDescriptions.Add(new PropertyGroupDescription("Category"));   // 一级分组
    view.GroupDescriptions.Add(new PropertyGroupDescription("Supplier"));   // 二级分组
}
```

### 分组数据访问

```csharp
foreach (var group in view.Groups)
{
    if (group is CollectionViewGroup cvGroup)
    {
        Console.WriteLine($"分组: {cvGroup.Name}, 项数: {cvGroup.ItemCount}");
        foreach (var item in cvGroup.Items)
        {
            Console.WriteLine($"  - {item}");
        }
    }
}
```

---

## 过滤 (Filtering)

### 基本过滤

```csharp
ICollectionView view = CollectionViewSource.GetDefaultView(products);
view.Filter = item =>
{
    if (item is Product p)
    {
        return p.Price > 100 && p.IsInStock;
    }
    return false;
};
```

### 动态过滤（搜索框场景）

```csharp
private string _searchText;
public string SearchText
{
    get => _searchText;
    set
    {
        if (_searchText != value)
        {
            _searchText = value;
            OnPropertyChanged();
            _productView.Refresh(); // 触发重新过滤
        }
    }
}

// 在 ViewModel 初始化时设置过滤
_productView.Filter = item =>
{
    if (string.IsNullOrEmpty(SearchText)) return true;
    if (item is Product p)
    {
        return p.Name.Contains(SearchText, StringComparison.OrdinalIgnoreCase)
            || p.Category.Contains(SearchText, StringComparison.OrdinalIgnoreCase);
    }
    return false;
};
```

### 组合过滤条件

```csharp
// 多条件过滤模式
public class ProductFilter
{
    public string? SearchText { get; set; }
    public decimal? MinPrice { get; set; }
    public decimal? MaxPrice { get; set; }
    public string? Category { get; set; }
    public bool? InStockOnly { get; set; }
}

_productView.Filter = item =>
{
    if (item is not Product p) return false;
    
    // 文本搜索
    if (!string.IsNullOrEmpty(filter.SearchText))
    {
        if (!p.Name.Contains(filter.SearchText, StringComparison.OrdinalIgnoreCase))
            return false;
    }
    
    // 价格范围
    if (filter.MinPrice.HasValue && p.Price < filter.MinPrice.Value)
        return false;
    if (filter.MaxPrice.HasValue && p.Price > filter.MaxPrice.Value)
        return false;
    
    // 分类筛选
    if (!string.IsNullOrEmpty(filter.Category) && p.Category != filter.Category)
        return false;
    
    // 库存筛选
    if (filter.InStockOnly.HasValue && p.IsInStock != filter.InStockOnly.Value)
        return false;
    
    return true;
};
```

### 清除过滤

```csharp
view.Filter = null; // 显示所有项
```

---

## 当前项管理 (Current Item)

### 核心概念

CollectionView 维护一个"当前项"指针，用于：
- **Master-Detail 模式**：列表选中项驱动详情面板
- **同步选择**：多个控件共享同一选中项

### 核心成员

| 成员 | 类型 | 说明 |
|------|------|------|
| `CurrentItem` | `object?` | 当前选中项 |
| `CurrentPosition` | `int` | 当前项索引（-1 表示无选中） |
| `IsCurrentBeforeFirst` | `bool` | 是否在第一个项之前 |
| `IsCurrentAfterLast` | `bool` | 是否在最后一个项之后 |
| `MoveCurrentTo(object)` | `bool` | 移动到指定项 |
| `MoveCurrentToFirst()` | `bool` | 移动到第一项 |
| `MoveCurrentToLast()` | `bool` | 移动到最后一项 |
| `MoveCurrentToPrevious()` | `bool` | 移动到上一项 |
| `MoveCurrentToNext()` | `bool` | 移动到下一项 |
| `MoveCurrentToPosition(int)` | `bool` | 移动到指定索引 |
| `CurrentChanged` | `event` | 当前项变化事件 |
| `CurrentChanging` | `event` | 当前项即将变化事件（可取消） |

### Master-Detail 模式示例

```xml
<!-- View -->
<Grid>
    <Grid.ColumnDefinitions>
        <ColumnDefinition Width="*"/>
        <ColumnDefinition Width="2*"/>
    </Grid.ColumnDefinitions>
    
    <!-- Master: 产品列表 -->
    <ListBox Grid.Column="0" 
             ItemsSource="{Binding Products}"
             IsSynchronizedWithCurrentItem="True">
        <ListBox.ItemTemplate>
            <DataTemplate>
                <TextBlock Text="{Binding Name}" FontWeight="Bold"/>
            </DataTemplate>
        </ListBox.ItemTemplate>
    </ListBox>
    
    <!-- Detail: 产品详情 -->
    <Grid Grid.Column="1" DataContext="{Binding Products/}">
        <StackPanel Margin="20">
            <TextBlock Text="{Binding Name}" FontSize="20" FontWeight="Bold"/>
            <TextBlock Text="{Binding Price, StringFormat=价格: ¥{0:N2}}"/>
            <TextBlock Text="{Binding Category, StringFormat=分类: {0}}"/>
            <TextBlock Text="{Binding Description}" TextWrapping="Wrap"/>
        </StackPanel>
    </Grid>
</Grid>
```

### 关键点：`IsSynchronizedWithCurrentItem`

```xml
<!-- True: ListBox 的选择与 CollectionView.CurrentItem 双向同步 -->
<ListBox IsSynchronizedWithCurrentItem="True" 
         ItemsSource="{Binding Products}"/>

<!-- False (默认): ListBox 有独立的选中项，不更新 CollectionView -->
<ListBox IsSynchronizedWithCurrentItem="False" 
         ItemsSource="{Binding Products}"/>
```

### 在 ViewModel 中导航

```csharp
public class ProductListViewModel : ObservableObject
{
    private readonly ICollectionView _productView;
    
    public ICommand MoveNextCommand { get; }
    public ICommand MovePreviousCommand { get; }
    public ICommand MoveFirstCommand { get; }
    public ICommand MoveLastCommand { get; }
    
    public ProductListViewModel()
    {
        _productView = CollectionViewSource.GetDefaultView(Products);
        
        MoveNextCommand = new DelegateCommand(
            () => _productView.MoveCurrentToNext(),
            () => !_productView.IsCurrentAfterLast);
        
        MovePreviousCommand = new DelegateCommand(
            () => _productView.MoveCurrentToPrevious(),
            () => !_productView.IsCurrentBeforeFirst);
        
        // 当 CurrentItem 变化时，重新评估 CanExecute
        _productView.CurrentChanged += (_, _) =>
        {
            ((DelegateCommand)MoveNextCommand).RaiseCanExecuteChanged();
            ((DelegateCommand)MovePreviousCommand).RaiseCanExecuteChanged();
        };
    }
}
```

### CurrentChanging 事件：确认导航

```csharp
_productView.CurrentChanging += (sender, e) =>
{
    if (HasUnsavedChanges)
    {
        var result = MessageBox.Show("有未保存的更改，是否继续？", "确认", 
            MessageBoxButton.YesNo);
        if (result == MessageBoxResult.No)
        {
            e.Cancel = true; // 取消导航
        }
    }
};
```

---

## Live Shaping 动态整形

### 什么是 Live Shaping？

.NET 4.5 引入的 `ICollectionViewLiveShaping` 接口，使 CollectionView 能够**在数据项属性值变化时自动重新排序、过滤和分组**，无需手动调用 `Refresh()`。

### 启用条件

1. 数据源必须是支持属性变更通知的集合（如 `ObservableCollection<T>`）
2. 数据项必须实现 `INotifyPropertyChanged`
3. 启用相应的 Live Shaping 功能并指定监视属性

### 启用 Live Sorting

```csharp
var view = CollectionViewSource.GetDefaultView(products) as ICollectionViewLiveShaping;

if (view?.CanChangeLiveSorting == true)
{
    view.IsLiveSorting = true;
    view.LiveSortingProperties.Add("Price");
    view.LiveSortingProperties.Add("Name");
}

// 之后任何 Product 的 Price 或 Name 变化，排序自动更新
```

### 启用 Live Filtering

```csharp
if (view?.CanChangeLiveFiltering == true)
{
    view.IsLiveFiltering = true;
    view.LiveFilteringProperties.Add("IsInStock");
    view.LiveFilteringProperties.Add("Price");
}

view.Filter = item => (item as Product)?.IsInStock == true;
// 当 IsInStock 或 Price 变化时，自动重新评估过滤条件
```

### 启用 Live Grouping

```csharp
if (view?.CanChangeLiveGrouping == true)
{
    view.IsLiveGrouping = true;
    view.LiveGroupingProperties.Add("Category");
}

view.GroupDescriptions.Add(new PropertyGroupDescription("Category"));
// 当 Category 变化时，自动重新分组
```

### 完整 Live Shaping 示例

```csharp
public void ConfigureLiveShaping(ICollectionView view)
{
    var liveView = view as ICollectionViewLiveShaping;
    if (liveView == null) return;
    
    using (view.DeferRefresh())
    {
        // 排序
        if (liveView.CanChangeLiveSorting)
        {
            liveView.IsLiveSorting = true;
            liveView.LiveSortingProperties.Add("Price");
        }
        
        // 过滤
        if (liveView.CanChangeLiveFiltering)
        {
            liveView.IsLiveFiltering = true;
            liveView.LiveFilteringProperties.Add("IsInStock");
            liveView.LiveFilteringProperties.Add("Price");
        }
        
        // 分组
        if (liveView.CanChangeLiveGrouping)
        {
            liveView.IsLiveGrouping = true;
            liveView.LiveGroupingProperties.Add("Category");
        }
    }
}
```

### Live Shaping 的局限

- 每次属性值变化都触发重排，**大数据量时性能开销显著**
- `LiveSortingProperties` 中监视的属性越多，开销越大
- 数据量 > 1000 时建议关闭 Live Shaping，改用手动刷新

---

## CollectionView 类型对比

| 特性 | ListCollectionView | BindingListCollectionView | ItemCollection |
|------|-------------------|--------------------------|----------------|
| 数据源 | `IList`（含 `ObservableCollection`） | `IBindingList`（含 `DataView`） | `ItemsControl.Items` |
| 排序 | ✅ 支持 | ❌ 不支持（依赖数据源） | ❌ |
| 分组 | ✅ 支持 | ❌ | ❌ |
| 过滤 | ✅ 支持 | ❌（使用 DataView.RowFilter） | ❌ |
| 添加/删除 | ✅ `IEditableCollectionView` | ✅ | ✅ |
| 使用场景 | 最常用，MVVM 首选 | DataTable/DataView 场景 | 直接添加 Items 场景 |

### 判断当前使用的类型

```csharp
ICollectionView view = CollectionViewSource.GetDefaultView(mySource);

if (view is ListCollectionView lcv)
{
    // ObservableCollection<T> → 功能最全
    lcv.CustomSort = myComparer;
}
else if (view is BindingListCollectionView blcv)
{
    // DataTable.DefaultView → 功能受限
    // 排序/过滤应通过 DataView.Sort / DataView.RowFilter 实现
}
```

---

## MVVM 中的最佳实践

### 1. 在 ViewModel 中管理 CollectionView

```csharp
public class ProductListViewModel : ObservableObject
{
    private readonly ObservableCollection<Product> _products;
    private readonly ICollectionView _productView;
    private string _searchText = string.Empty;
    
    public ICollectionView ProductView => _productView;
    
    public string SearchText
    {
        get => _searchText;
        set
        {
            if (SetProperty(ref _searchText, value))
            {
                _productView.Refresh(); // Live Filtering 可用时不需要此行
            }
        }
    }
    
    // 排序选项
    public List<string> SortOptions { get; } = new()
    {
        "名称 (A-Z)", "名称 (Z-A)", "价格 (低→高)", "价格 (高→低)"
    };
    
    private string _selectedSort;
    public string SelectedSort
    {
        get => _selectedSort;
        set
        {
            if (SetProperty(ref _selectedSort, value))
            {
                ApplySorting(value);
            }
        }
    }
    
    public ProductListViewModel()
    {
        _products = new ObservableCollection<Product>();
        _productView = CollectionViewSource.GetDefaultView(_products);
        
        // 设置过滤
        _productView.Filter = FilterProducts;
        
        // 配置 Live Shaping
        ConfigureLiveShaping();
    }
    
    private bool FilterProducts(object item)
    {
        if (item is not Product p) return false;
        if (string.IsNullOrEmpty(SearchText)) return true;
        
        return p.Name.Contains(SearchText, StringComparison.OrdinalIgnoreCase)
            || p.Description.Contains(SearchText, StringComparison.OrdinalIgnoreCase);
    }
    
    private void ApplySorting(string sortOption)
    {
        using (_productView.DeferRefresh())
        {
            _productView.SortDescriptions.Clear();
            
            switch (sortOption)
            {
                case "名称 (A-Z)":
                    _productView.SortDescriptions.Add(
                        new SortDescription("Name", ListSortDirection.Ascending));
                    break;
                case "名称 (Z-A)":
                    _productView.SortDescriptions.Add(
                        new SortDescription("Name", ListSortDirection.Descending));
                    break;
                case "价格 (低→高)":
                    _productView.SortDescriptions.Add(
                        new SortDescription("Price", ListSortDirection.Ascending));
                    break;
                case "价格 (高→低)":
                    _productView.SortDescriptions.Add(
                        new SortDescription("Price", ListSortDirection.Descending));
                    break;
            }
        }
    }
    
    private void ConfigureLiveShaping()
    {
        if (_productView is ICollectionViewLiveShaping liveView)
        {
            if (liveView.CanChangeLiveFiltering)
            {
                liveView.IsLiveFiltering = true;
                liveView.LiveFilteringProperties.Add("Name");
                liveView.LiveFilteringProperties.Add("Description");
            }
        }
    }
}
```

### 2. XAML 绑定 CollectionView

```xml
<Window x:Class="MyApp.Views.ProductListView"
        xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml">
    
    <DockPanel>
        <!-- 搜索和排序工具栏 -->
        <StackPanel DockPanel.Dock="Top" Orientation="Horizontal" Margin="10">
            <TextBox Text="{Binding SearchText, UpdateSourceTrigger=PropertyChanged}" 
                     Width="200" Margin="0,0,10,0"
                     ToolTip="搜索产品"/>
            
            <ComboBox ItemsSource="{Binding SortOptions}" 
                      SelectedItem="{Binding SelectedSort}"
                      Width="150"/>
        </StackPanel>
        
        <!-- 产品列表 -->
        <ListBox ItemsSource="{Binding ProductView}"
                 IsSynchronizedWithCurrentItem="True"
                 DisplayMemberPath="Name">
            <ListBox.GroupStyle>
                <GroupStyle>
                    <GroupStyle.HeaderTemplate>
                        <DataTemplate>
                            <TextBlock FontWeight="Bold" 
                                       Text="{Binding Name}"/>
                        </DataTemplate>
                    </GroupStyle.HeaderTemplate>
                </GroupStyle>
            </ListBox.GroupStyle>
        </ListBox>
    </DockPanel>
</Window>
```

### 3. `DeferRefresh` 的正确使用

```csharp
// ✅ 批量修改时使用 DeferRefresh
using (view.DeferRefresh())
{
    view.SortDescriptions.Clear();
    view.SortDescriptions.Add(new SortDescription("Category", ListSortDirection.Ascending));
    view.SortDescriptions.Add(new SortDescription("Name", ListSortDirection.Ascending));
    view.GroupDescriptions.Clear();
    view.GroupDescriptions.Add(new PropertyGroupDescription("Category"));
}
// 离开 using 块时自动调用一次 Refresh()

// ❌ 没有 DeferRefresh：每次修改都触发一次完整刷新
view.SortDescriptions.Clear();        // 刷新 1
view.SortDescriptions.Add(...);       // 刷新 2
view.SortDescriptions.Add(...);       // 刷新 3
```

---

## 常见问题与解决方案

### 1. UI 不更新

**问题**：修改了数据项属性，但列表没有反映变化。

**原因和解决**：

```csharp
// 原因 1：数据模型未实现 INotifyPropertyChanged
// ❌ 错误的模型
public class Product
{
    public string Name { get; set; }  // 属性变化不会通知 UI
}

// ✅ 正确的模型
public class Product : ObservableObject
{
    private string _name;
    public string Name
    {
        get => _name;
        set => SetProperty(ref _name, value);
    }
}

// 原因 2：使用普通 List<T> 代替 ObservableCollection<T>
// ❌ 添加/删除不会通知 UI
var products = new List<Product>();

// ✅ 使用 ObservableCollection
var products = new ObservableCollection<Product>();
```

### 2. 过滤后排序失效

**问题**：调用 `Refresh()` 后排序不生效。

**解决**：确保排序描述在 `Refresh()` 前已设置。如果需要重建排序：

```csharp
public void ReapplyAll()
{
    using (view.DeferRefresh())
    {
        // 先清除再重新设置
        view.SortDescriptions.Clear();
        view.SortDescriptions.Add(new SortDescription("Name", ...));
        view.GroupDescriptions.Clear();
        view.GroupDescriptions.Add(new PropertyGroupDescription("Category"));
        // Filter 不需要重新设置，但需要 Refresh
    }
    view.Refresh(); // DeferRefresh 外再加一次确保过滤也刷新
}
```

### 3. 多线程访问异常

**问题**：在后台线程修改集合导致 `NotSupportedException`。

**解决**：始终在 UI 线程操作 CollectionView。

```csharp
// ❌ 在后台线程修改
Task.Run(() =>
{
    products.Add(new Product()); // 可能抛出异常
});

// ✅ 通过 Dispatcher 回到 UI 线程
Application.Current.Dispatcher.Invoke(() =>
{
    products.Add(new Product());
});

// ✅ 使用 BindingOperations.EnableCollectionSynchronization（推荐）
private readonly object _lock = new object();
BindingOperations.EnableCollectionSynchronization(_products, _lock);
// 之后可以在任意线程安全地修改集合
```

### 4. CollectionView 在 DataGrid 中的行为差异

```csharp
// DataGrid 自动使用 ItemCollection 或 ListCollectionView
// 但 DataGrid 的排序与 CollectionView 的排序会冲突

// 推荐：使用 DataGrid 自带的排序功能
// 或统一由 CollectionView 管理，关闭 DataGrid 排序：
myDataGrid.CanUserSortColumns = false;
```

### 5. 分组后空组显示

**问题**：过滤后出现空分组头。

**解决**：可以过滤空分组，或使用 `HasItems` 属性判断：

```xml
<GroupStyle>
    <GroupStyle.ContainerStyle>
        <Style TargetType="GroupItem">
            <Style.Triggers>
                <DataTrigger Binding="{Binding ItemCount}" Value="0">
                    <Setter Property="Visibility" Value="Collapsed"/>
                </DataTrigger>
            </Style.Triggers>
        </Style>
    </GroupStyle.ContainerStyle>
</GroupStyle>
```

---

## 完整实战示例

### 场景：产品管理系统

一个完整的产品管理界面，包含搜索、排序、分组、CRUD 操作。

#### Model

```csharp
public class Product : ObservableObject
{
    private string _name = string.Empty;
    public string Name
    {
        get => _name;
        set => SetProperty(ref _name, value);
    }
    
    private string _category = string.Empty;
    public string Category
    {
        get => _category;
        set => SetProperty(ref _category, value);
    }
    
    private decimal _price;
    public decimal Price
    {
        get => _price;
        set => SetProperty(ref _price, value);
    }
    
    private bool _isInStock = true;
    public bool IsInStock
    {
        get => _isInStock;
        set => SetProperty(ref _isInStock, value);
    }
    
    private DateTime _createdDate = DateTime.Now;
    public DateTime CreatedDate
    {
        get => _createdDate;
        set => SetProperty(ref _createdDate, value);
    }
}
```

#### ViewModel

```csharp
public class ProductManagementViewModel : ObservableObject
{
    private readonly ObservableCollection<Product> _products = new();
    private readonly ICollectionView _productView;
    
    // ========== 搜索 ==========
    private string _searchText = string.Empty;
    public string SearchText
    {
        get => _searchText;
        set
        {
            if (SetProperty(ref _searchText, value))
                _productView.Refresh();
        }
    }
    
    // ========== 过滤 ==========
    private bool _showInStockOnly;
    public bool ShowInStockOnly
    {
        get => _showInStockOnly;
        set
        {
            if (SetProperty(ref _showInStockOnly, value))
                _productView.Refresh();
        }
    }
    
    private string? _selectedCategory;
    public string? SelectedCategory
    {
        get => _selectedCategory;
        set
        {
            if (SetProperty(ref _selectedCategory, value))
                _productView.Refresh();
        }
    }
    
    // ========== 排序 ==========
    private string _sortMode = "名称 (A-Z)";
    public string SortMode
    {
        get => _sortMode;
        set
        {
            if (SetProperty(ref _sortMode, value))
                ApplySort(value);
        }
    }
    
    // ========== 分组 ==========
    private bool _isGroupedByCategory;
    public bool IsGroupedByCategory
    {
        get => _isGroupedByCategory;
        set
        {
            if (SetProperty(ref _isGroupedByCategory, value))
                ApplyGrouping(value);
        }
    }
    
    // ========== 产品列表（暴露给 View） ==========
    public ICollectionView ProductView => _productView;
    
    // 分类列表（用于筛选下拉框）
    public List<string> Categories { get; }
    
    // 排序选项
    public List<string> SortModes { get; } = new()
    {
        "名称 (A-Z)", "名称 (Z-A)", 
        "价格 (低→高)", "价格 (高→低)",
        "日期 (新→旧)", "日期 (旧→新)"
    };
    
    // ========== 命令 ==========
    public DelegateCommand AddProductCommand { get; }
    public DelegateCommand<Product> DeleteProductCommand { get; }
    public DelegateCommand ClearSearchCommand { get; }
    
    // ========== 构造函数 ==========
    public ProductManagementViewModel()
    {
        _productView = CollectionViewSource.GetDefaultView(_products);
        _productView.Filter = FilterProducts;
        
        Categories = new List<string> { "全部", "电子产品", "食品", "服装", "图书" };
        
        AddProductCommand = new DelegateCommand(AddProduct);
        DeleteProductCommand = new DelegateCommand<Product>(DeleteProduct);
        ClearSearchCommand = new DelegateCommand(() => SearchText = string.Empty);
        
        // 加载示例数据
        LoadSampleData();
        
        // 初始化排序
        ApplySort("名称 (A-Z)");
        
        // 配置 Live Shaping
        ConfigureLiveShaping();
    }
    
    // ========== 过滤逻辑 ==========
    private bool FilterProducts(object item)
    {
        if (item is not Product p) return false;
        
        // 文本搜索
        if (!string.IsNullOrEmpty(SearchText))
        {
            if (!p.Name.Contains(SearchText, StringComparison.OrdinalIgnoreCase)
                && !p.Category.Contains(SearchText, StringComparison.OrdinalIgnoreCase))
                return false;
        }
        
        // 仅显示有库存
        if (ShowInStockOnly && !p.IsInStock)
            return false;
        
        // 按分类筛选
        if (!string.IsNullOrEmpty(SelectedCategory) && SelectedCategory != "全部")
        {
            if (p.Category != SelectedCategory)
                return false;
        }
        
        return true;
    }
    
    // ========== 排序逻辑 ==========
    private void ApplySort(string mode)
    {
        using (_productView.DeferRefresh())
        {
            _productView.SortDescriptions.Clear();
            
            switch (mode)
            {
                case "名称 (A-Z)":
                    _productView.SortDescriptions.Add(
                        new SortDescription("Name", ListSortDirection.Ascending));
                    break;
                case "名称 (Z-A)":
                    _productView.SortDescriptions.Add(
                        new SortDescription("Name", ListSortDirection.Descending));
                    break;
                case "价格 (低→高)":
                    _productView.SortDescriptions.Add(
                        new SortDescription("Price", ListSortDirection.Ascending));
                    break;
                case "价格 (高→低)":
                    _productView.SortDescriptions.Add(
                        new SortDescription("Price", ListSortDirection.Descending));
                    break;
                case "日期 (新→旧)":
                    _productView.SortDescriptions.Add(
                        new SortDescription("CreatedDate", ListSortDirection.Descending));
                    break;
                case "日期 (旧→新)":
                    _productView.SortDescriptions.Add(
                        new SortDescription("CreatedDate", ListSortDirection.Ascending));
                    break;
            }
        }
    }
    
    // ========== 分组逻辑 ==========
    private void ApplyGrouping(bool grouped)
    {
        using (_productView.DeferRefresh())
        {
            _productView.GroupDescriptions.Clear();
            if (grouped)
            {
                _productView.GroupDescriptions.Add(
                    new PropertyGroupDescription("Category"));
            }
        }
    }
    
    // ========== CRUD 操作 ==========
    private void AddProduct()
    {
        var newProduct = new Product
        {
            Name = "新产品",
            Category = "电子产品",
            Price = 99.99m,
            IsInStock = true,
            CreatedDate = DateTime.Now
        };
        _products.Add(newProduct);
        
        // 导航到新添加的项
        _productView.MoveCurrentTo(newProduct);
    }
    
    private void DeleteProduct(Product? product)
    {
        if (product != null && _products.Contains(product))
        {
            _products.Remove(product);
        }
    }
    
    // ========== Live Shaping ==========
    private void ConfigureLiveShaping()
    {
        if (_productView is ICollectionViewLiveShaping liveView)
        {
            if (liveView.CanChangeLiveFiltering)
            {
                liveView.IsLiveFiltering = true;
                liveView.LiveFilteringProperties.Add("Name");
                liveView.LiveFilteringProperties.Add("Category");
            }
            
            if (liveView.CanChangeLiveSorting)
            {
                liveView.IsLiveSorting = true;
                liveView.LiveSortingProperties.Add("Name");
                liveView.LiveSortingProperties.Add("Price");
                liveView.LiveSortingProperties.Add("CreatedDate");
            }
            
            if (liveView.CanChangeLiveGrouping)
            {
                liveView.IsLiveGrouping = true;
                liveView.LiveGroupingProperties.Add("Category");
            }
        }
    }
    
    private void LoadSampleData()
    {
        _products.Add(new Product { Name = "iPhone 15", Category = "电子产品", 
            Price = 7999, IsInStock = true, CreatedDate = DateTime.Now.AddDays(-30) });
        _products.Add(new Product { Name = "MacBook Pro", Category = "电子产品", 
            Price = 14999, IsInStock = true, CreatedDate = DateTime.Now.AddDays(-60) });
        _products.Add(new Product { Name = "可口可乐", Category = "食品", 
            Price = 3.5m, IsInStock = true, CreatedDate = DateTime.Now.AddDays(-5) });
        _products.Add(new Product { Name = "T恤", Category = "服装", 
            Price = 199, IsInStock = false, CreatedDate = DateTime.Now.AddDays(-90) });
        _products.Add(new Product { Name = "C# 编程指南", Category = "图书", 
            Price = 89, IsInStock = true, CreatedDate = DateTime.Now.AddDays(-120) });
    }
}
```

#### View

```xml
<Window x:Class="MyApp.Views.ProductManagementView"
        xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        Title="产品管理系统" Height="600" Width="900">
    
    <Grid Margin="10">
        <Grid.RowDefinitions>
            <RowDefinition Height="Auto"/>
            <RowDefinition Height="*"/>
            <RowDefinition Height="Auto"/>
        </Grid.RowDefinitions>
        
        <!-- 工具栏 -->
        <Border Grid.Row="0" Padding="10" Background="#F5F5F5" 
                BorderBrush="#DDD" BorderThickness="1" CornerRadius="4">
            <StackPanel>
                <!-- 第一行：搜索和过滤 -->
                <WrapPanel Margin="0,0,0,8">
                    <TextBox Text="{Binding SearchText, UpdateSourceTrigger=PropertyChanged}" 
                             Width="200" Margin="0,0,8,0" ToolTip="搜索产品..."/>
                    <Button Content="清除" Command="{Binding ClearSearchCommand}" 
                            Width="50" Margin="0,0,15,0"/>
                    
                    <CheckBox Content="仅显示有库存" IsChecked="{Binding ShowInStockOnly}" 
                              VerticalAlignment="Center" Margin="0,0,15,0"/>
                    
                    <TextBlock Text="分类:" VerticalAlignment="Center" Margin="0,0,5,0"/>
                    <ComboBox ItemsSource="{Binding Categories}" 
                              SelectedItem="{Binding SelectedCategory}" Width="120" Margin="0,0,15,0"/>
                    
                    <TextBlock Text="排序:" VerticalAlignment="Center" Margin="0,0,5,0"/>
                    <ComboBox ItemsSource="{Binding SortModes}" 
                              SelectedItem="{Binding SortMode}" Width="120" Margin="0,0,15,0"/>
                    
                    <CheckBox Content="按分类分组" IsChecked="{Binding IsGroupedByCategory}" 
                              VerticalAlignment="Center"/>
                </WrapPanel>
                
                <!-- 第二行：操作按钮 -->
                <StackPanel Orientation="Horizontal">
                    <Button Content="+ 添加产品" Command="{Binding AddProductCommand}" 
                            Width="100" Background="#4CAF50" Foreground="White"/>
                </StackPanel>
            </StackPanel>
        </Border>
        
        <!-- 主体内容 -->
        <Grid Grid.Row="1" Margin="0,10,0,0">
            <Grid.ColumnDefinitions>
                <ColumnDefinition Width="*"/>
                <ColumnDefinition Width="2*"/>
            </Grid.ColumnDefinitions>
            
            <!-- 产品列表 -->
            <ListBox Grid.Column="0" 
                     ItemsSource="{Binding ProductView}"
                     IsSynchronizedWithCurrentItem="True"
                     DisplayMemberPath="Name">
                <ListBox.GroupStyle>
                    <GroupStyle>
                        <GroupStyle.HeaderTemplate>
                            <DataTemplate>
                                <TextBlock FontWeight="Bold" FontSize="13" 
                                           Text="{Binding Name}" 
                                           Background="#E8E8E8" Padding="8,4"/>
                            </DataTemplate>
                        </GroupStyle.HeaderTemplate>
                    </GroupStyle>
                </ListBox.GroupStyle>
                
                <ListBox.ItemContainerStyle>
                    <Style TargetType="ListBoxItem">
                        <Setter Property="Padding" Value="10,6"/>
                    </Style>
                </ListBox.ItemContainerStyle>
            </ListBox>
            
            <!-- 产品详情 -->
            <Border Grid.Column="1" Margin="15,0,0,0" Padding="20" 
                    BorderBrush="#DDD" BorderThickness="1" CornerRadius="4"
                    DataContext="{Binding ProductView/}">
                <StackPanel>
                    <TextBlock Text="产品详情" FontSize="18" FontWeight="Bold" 
                               Margin="0,0,0,20"/>
                    
                    <TextBlock Text="名称:" FontWeight="Bold"/>
                    <TextBlock Text="{Binding Name}" Margin="0,0,0,10"/>
                    
                    <TextBlock Text="分类:" FontWeight="Bold"/>
                    <TextBlock Text="{Binding Category}" Margin="0,0,0,10"/>
                    
                    <TextBlock Text="价格:" FontWeight="Bold"/>
                    <TextBlock Text="{Binding Price, StringFormat=¥{0:N2}}" Margin="0,0,0,10"/>
                    
                    <TextBlock Text="库存状态:" FontWeight="Bold"/>
                    <TextBlock Text="{Binding IsInStock, Converter={StaticResource BoolToStatusConverter}}" 
                               Margin="0,0,0,10"/>
                    
                    <TextBlock Text="创建日期:" FontWeight="Bold"/>
                    <TextBlock Text="{Binding CreatedDate, StringFormat=yyyy-MM-dd}" 
                               Margin="0,0,0,20"/>
                    
                    <Button Content="删除此产品" 
                            Command="{Binding DataContext.DeleteProductCommand, 
                                RelativeSource={RelativeSource AncestorType=Window}}"
                            CommandParameter="{Binding}"
                            Background="#F44336" Foreground="White" Width="120"
                            HorizontalAlignment="Left"/>
                </StackPanel>
            </Border>
        </Grid>
        
        <!-- 状态栏 -->
        <StatusBar Grid.Row="2" Margin="0,8,0,0">
            <StatusBarItem>
                <TextBlock>
                    <Run Text="共 "/>
                    <Run Text="{Binding ProductView.Count, Mode=OneWay}"/>
                    <Run Text=" 项"/>
                </TextBlock>
            </StatusBarItem>
            <Separator/>
            <StatusBarItem>
                <TextBlock>
                    <Run Text="当前: "/>
                    <Run Text="{Binding ProductView.CurrentPosition, Mode=OneWay}"/>
                </TextBlock>
            </StatusBarItem>
        </StatusBar>
    </Grid>
</Window>
```

---

## 性能优化总结

| 场景 | 建议 |
|------|------|
| 大数据量（> 10,000 条） | 使用虚拟化 + 分页，避免一次性加载 |
| 频繁修改过滤条件 | 使用 `DeferRefresh` 批量修改后统一刷新 |
| 属性值频繁变化 | 评估 Live Shaping 开销，必要时改为手动刷新 |
| 多线程环境 | 使用 `BindingOperations.EnableCollectionSynchronization` |
| 多个控件共享数据 | 使用同一个 CollectionView，避免创建多个视图 |
| DataGrid 大数据量 | 启用行虚拟化 `EnableRowVirtualization = True` |

---

## 关键要点速查

```csharp
// ===== 获取视图 =====
ICollectionView view = CollectionViewSource.GetDefaultView(collection);

// ===== 批量修改 =====
using (view.DeferRefresh()) { /* ... */ }

// ===== 排序 =====
view.SortDescriptions.Add(new SortDescription("Prop", ListSortDirection.Ascending));

// ===== 分组 =====
view.GroupDescriptions.Add(new PropertyGroupDescription("Prop"));

// ===== 过滤 =====
view.Filter = item => /* bool */;
view.Refresh(); // 手动触发过滤重评估

// ===== 导航 =====
view.MoveCurrentToFirst();
view.MoveCurrentToLast();
view.MoveCurrentToNext();
view.MoveCurrentToPrevious();

// ===== 同步选择 =====
// XAML: IsSynchronizedWithCurrentItem="True"

// ===== Live Shaping =====
if (view is ICollectionViewLiveShaping live)
{
    live.IsLiveSorting = true;
    live.LiveSortingProperties.Add("Prop");
}

// ===== 清除所有变换 =====
view.SortDescriptions.Clear();
view.GroupDescriptions.Clear();
view.Filter = null;
```

---

> **参考资源**
> - [MSDN: CollectionView 类](https://docs.microsoft.com/en-us/dotnet/api/system.windows.data.collectionview)
> - [MSDN: 数据绑定概述](https://docs.microsoft.com/en-us/dotnet/desktop/wpf/data/data-binding-overview)
