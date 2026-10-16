# Prism 事件聚合器（Event Aggregator）订阅发布使用指南

## 目录

1. [概述](#概述)
2. [核心概念](#核心概念)
3. [环境配置](#环境配置)
4. [事件定义](#事件定义)
5. [事件发布](#事件发布)
6. [事件订阅](#事件订阅)
7. [事件过滤](#事件过滤)
8. [线程调度](#线程调度)
9. [事件生命周期管理](#事件生命周期管理)
10. [高级用法](#高级用法)
11. [常见问题与解决方案](#常见问题与解决方案)
12. [最佳实践](#最佳实践)
13. [完整示例](#完整示例)
14. [与 Region Navigation 结合使用](#与-region-navigation-结合使用)

---

## 概述

Prism 事件聚合器（Event Aggregator）是 Prism 框架提供的一种**松耦合的发布-订阅通信机制**。它允许应用程序中的不同组件（通常是视图模型）在不直接引用彼此的情况下进行通信。

### 主要优势

| 优势 | 说明 |
|------|------|
| **松耦合** | 发布者和订阅者无需直接引用对方 |
| **可测试性** | 事件逻辑易于单元测试 |
| **灵活性** | 支持同步/异步订阅、线程调度、事件过滤 |
| **可维护性** | 集中管理事件通信，便于追踪和调试 |
| **跨模块通信** | 不同模块之间可以轻松通信 |

### 适用场景

- 视图模型之间需要传递数据
- 模块之间需要通知状态变化
- 需要实现观察者模式但避免强依赖
- 需要跨线程安全地更新 UI

---

## 核心概念

### 事件聚合器（IEventAggregator）

事件聚合器是整个发布-订阅机制的核心服务，负责管理所有事件的注册、发布和订阅。

```csharp
public interface IEventAggregator
{
    // 获取或创建指定类型的事件实例
    TEvent GetEvent<TEvent>() where TEvent : EventBase, new();
}
```

### 事件基类

| 基类 | 用途 |
|------|------|
| `PubSubEvent<TPayload>` | 最常用的泛型事件基类，支持传递载荷数据 |
| `EventBase` | 所有事件的抽象基类 |

### 发布者（Publisher）

触发事件并传递数据的组件。

### 订阅者（Subscriber）

监听并响应事件的组件。

### 载荷（Payload）

事件传递的数据对象。

---

## 环境配置

### 1. 安装 NuGet 包

```xml
<!-- WPF 项目 -->
<PackageReference Include="Prism.DryIoc" Version="8.1.97" />
<!-- 或 -->
<PackageReference Include="Prism.Unity" Version="8.1.97" />

<!-- .NET MAUI 项目 -->
<PackageReference Include="Prism.DryIoc.Maui" Version="8.1.97" />
```

### 2. 注册事件聚合器

事件聚合器是 Prism 框架自动注册的服务，无需手动注册。

```csharp
// App.xaml.cs
public partial class App : PrismApplication
{
    protected override void RegisterTypes(IContainerRegistry containerRegistry)
    {
        // 事件聚合器会自动注册
        // 如果需要自定义实现，可以替换默认注册：
        // containerRegistry.RegisterSingleton<IEventAggregator, CustomEventAggregator>();
        
        // 注册其他服务
        containerRegistry.RegisterSingleton<ISomeService, SomeService>();
    }
}
```

### 3. 在视图模型中注入

```csharp
public class MyViewModel : BindableBase
{
    private readonly IEventAggregator _eventAggregator;

    public MyViewModel(IEventAggregator eventAggregator)
    {
        _eventAggregator = eventAggregator;
    }
}
```

---

## 事件定义

### 1. 基本事件定义

```csharp
// 简单事件（无载荷）
public class MessageSentEvent : PubSubEvent { }

// 带载荷的事件
public class UserLoggedInEvent : PubSubEvent<User> { }

// 带简单类型载荷的事件
public class StatusUpdatedEvent : PubSubEvent<string> { }

// 带复杂载荷的事件
public class OrderPlacedEvent : PubSubEvent<OrderEventArgs> { }
```

### 2. 事件载荷类

```csharp
// 定义事件参数类
public class OrderEventArgs
{
    public int OrderId { get; set; }
    public string CustomerName { get; set; }
    public decimal TotalAmount { get; set; }
    public DateTime OrderDate { get; set; }
    public List<OrderItem> Items { get; set; }
}

public class OrderItem
{
    public string ProductName { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
}
```

### 3. 事件组织结构

```
Events/
├── UserEvents/
│   ├── UserLoggedInEvent.cs
│   ├── UserLoggedOutEvent.cs
│   └── UserProfileUpdatedEvent.cs
├── OrderEvents/
│   ├── OrderCreatedEvent.cs
│   ├── OrderStatusChangedEvent.cs
│   └── OrderCancelledEvent.cs
├── NavigationEvents/
│   ├── NavigationRequestedEvent.cs
│   └── NavigationCompletedEvent.cs
└── SystemEvents/
    ├── ErrorMessageEvent.cs
    └── StatusUpdatedEvent.cs
```

---

## 事件发布

### 1. 基本发布

```csharp
public class LoginViewModel : BindableBase
{
    private readonly IEventAggregator _eventAggregator;

    public LoginViewModel(IEventAggregator eventAggregator)
    {
        _eventAggregator = eventAggregator;
        LoginCommand = new DelegateCommand(Login);
    }

    public DelegateCommand LoginCommand { get; }

    private void Login()
    {
        // 执行登录逻辑...
        var user = new User { Id = 1, Name = "John", Email = "john@example.com" };

        // 发布事件
        _eventAggregator.GetEvent<UserLoggedInEvent>().Publish(user);
    }
}
```

### 2. 发布无载荷事件

```csharp
public class LogoutViewModel : BindableBase
{
    private readonly IEventAggregator _eventAggregator;

    public LogoutViewModel(IEventAggregator eventAggregator)
    {
        _eventAggregator = eventAggregator;
        LogoutCommand = new DelegateCommand(Logout);
    }

    public DelegateCommand LogoutCommand { get; }

    private void Logout()
    {
        // 执行登出逻辑...

        // 发布无载荷事件
        _eventAggregator.GetEvent<UserLoggedOutEvent>().Publish();
    }
}
```

### 3. 发布复杂载荷事件

```csharp
public class OrderViewModel : BindableBase
{
    private readonly IEventAggregator _eventAggregator;

    public OrderViewModel(IEventAggregator eventAggregator)
    {
        _eventAggregator = eventAggregator;
        PlaceOrderCommand = new DelegateCommand(PlaceOrder);
    }

    public DelegateCommand PlaceOrderCommand { get; }

    private void PlaceOrder()
    {
        var orderArgs = new OrderEventArgs
        {
            OrderId = 12345,
            CustomerName = "John Doe",
            TotalAmount = 299.99m,
            OrderDate = DateTime.Now,
            Items = new List<OrderItem>
            {
                new OrderItem { ProductName = "Widget", Quantity = 2, UnitPrice = 49.99m },
                new OrderItem { ProductName = "Gadget", Quantity = 1, UnitPrice = 199.99m }
            }
        };

        _eventAggregator.GetEvent<OrderPlacedEvent>().Publish(orderArgs);
    }
}
```

---

## 事件订阅

### 1. 基本订阅

```csharp
public class MainViewModel : BindableBase
{
    private readonly IEventAggregator _eventAggregator;
    private SubscriptionToken _subscriptionToken;

    public MainViewModel(IEventAggregator eventAggregator)
    {
        _eventAggregator = eventAggregator;

        // 订阅事件
        _subscriptionToken = _eventAggregator.GetEvent<UserLoggedInEvent>().Subscribe(OnUserLoggedIn);
    }

    private void OnUserLoggedIn(User user)
    {
        // 处理用户登录事件
        Console.WriteLine($"用户已登录: {user.Name}");
        // 更新 UI 或执行其他逻辑
    }
}
```

### 2. 使用 lambda 表达式订阅

```csharp
public class MainViewModel : BindableBase
{
    public MainViewModel(IEventAggregator eventAggregator)
    {
        // 使用 lambda 表达式订阅
        eventAggregator.GetEvent<StatusUpdatedEvent>().Subscribe(status =>
        {
            StatusText = status;
        });
    }
}
```

### 3. 在 Prism 框架组件中订阅

```csharp
// 在视图模型中订阅（推荐方式）
public class DashboardViewModel : BindableBase
{
    private readonly IEventAggregator _eventAggregator;

    public DashboardViewModel(IEventAggregator eventAggregator)
    {
        _eventAggregator = eventAggregator;

        // 订阅多个事件
        _eventAggregator.GetEvent<UserLoggedInEvent>().Subscribe(OnUserLoggedIn);
        _eventAggregator.GetEvent<OrderPlacedEvent>().Subscribe(OnOrderPlaced);
        _eventAggregator.GetEvent<StatusUpdatedEvent>().Subscribe(OnStatusUpdated);
    }

    private void OnUserLoggedIn(User user) { /* ... */ }
    private void OnOrderPlaced(OrderEventArgs args) { /* ... */ }
    private void OnStatusUpdated(string status) { /* ... */ }
}
```

### 4. 订阅选项配置

```csharp
public class MainViewModel : BindableBase
{
    public MainViewModel(IEventAggregator eventAggregator)
    {
        // 使用 SubscribeOptions 配置订阅行为
        eventAggregator.GetEvent<UserLoggedInEvent>().Subscribe(
            OnUserLoggedIn,
            new SubscribeOptions
            {
                // 在 UI 线程上执行（WPF/MAUI）
                ThreadOption = ThreadOption.UIThread,
                // 保持订阅（即使发布者已销毁）
                KeepSubscriberReferenceAlive = true
            });
    }
}
```

---

## 事件过滤

### 1. 使用 Filter 参数

```csharp
public class AdminViewModel : BindableBase
{
    public AdminViewModel(IEventAggregator eventAggregator)
    {
        // 只订阅管理员用户的登录事件
        eventAggregator.GetEvent<UserLoggedInEvent>().Subscribe(
            OnAdminLoggedIn,
            filter: user => user.IsAdmin);
    }

    private void OnAdminLoggedIn(User user)
    {
        Console.WriteLine($"管理员已登录: {user.Name}");
    }
}
```

### 2. 复杂过滤条件

```csharp
public class OrderMonitorViewModel : BindableBase
{
    public OrderMonitorViewModel(IEventAggregator eventAggregator)
    {
        // 只订阅大额订单
        eventAggregator.GetEvent<OrderPlacedEvent>().Subscribe(
            OnLargeOrderPlaced,
            filter: order => order.TotalAmount > 1000);

        // 只订阅特定客户的订单
        eventAggregator.GetEvent<OrderPlacedEvent>().Subscribe(
            OnVipOrderPlaced,
            filter: order => order.CustomerName == "VIP Customer");
    }

    private void OnLargeOrderPlaced(OrderEventArgs order)
    {
        Console.WriteLine($"大额订单: #{order.OrderId}, 金额: {order.TotalAmount:C}");
    }

    private void OnVipOrderPlaced(OrderEventArgs order)
    {
        Console.WriteLine($"VIP 订单: #{order.OrderId}");
    }
}
```

### 3. 多条件过滤

```csharp
public class NotificationViewModel : BindableBase
{
    public NotificationViewModel(IEventAggregator eventAggregator)
    {
        eventAggregator.GetEvent<OrderPlacedEvent>().Subscribe(
            OnNotification,
            filter: order =>
                order.TotalAmount > 500 &&           // 金额大于 500
                order.Items.Count > 2 &&              // 超过 2 个商品
                order.OrderDate.Date == DateTime.Today // 今天下单
        );
    }

    private void OnNotification(OrderEventArgs order)
    {
        // 显示通知
    }
}
```

---

## 线程调度

### 1. ThreadOption 枚举

| 选项 | 说明 |
|------|------|
| `ThreadOption.PublisherThread` | 在发布者线程上执行（默认） |
| `ThreadOption.UIThread` | 在 UI 线程上执行 |
| `ThreadOption.BackgroundThread` | 在后台线程上执行 |

### 2. 在 UI 线程上执行

```csharp
public class DashboardViewModel : BindableBase
{
    private string _statusMessage;

    public DashboardViewModel(IEventAggregator eventAggregator)
    {
        // 订阅并在 UI 线程上执行回调
        eventAggregator.GetEvent<StatusUpdatedEvent>().Subscribe(
            OnStatusUpdated,
            ThreadOption.UIThread);  // 指定在 UI 线程执行
    }

    public string StatusMessage
    {
        get => _statusMessage;
        set => SetProperty(ref _statusMessage, value);
    }

    private void OnStatusUpdated(string status)
    {
        // 可以安全地更新 UI 绑定属性
        StatusMessage = status;
    }
}
```

### 3. 在后台线程上执行

```csharp
public class DataProcessorViewModel : BindableBase
{
    public DataProcessorViewModel(IEventAggregator eventAggregator)
    {
        // 订阅并在后台线程上执行回调
        eventAggregator.GetEvent<DataReceivedEvent>().Subscribe(
            OnDataReceived,
            ThreadOption.BackgroundThread);  // 指定在后台线程执行
    }

    private void OnDataReceived(Data data)
    {
        // 耗时操作在后台线程执行
        var result = ProcessData(data);

        // 如果需要更新 UI，需要切换到 UI 线程
        Application.Current.Dispatcher.Invoke(() =>
        {
            // 更新 UI
        });
    }

    private object ProcessData(Data data)
    {
        // 耗时处理逻辑
        Thread.Sleep(5000);
        return new { };
    }
}
```

### 4. PublisherThread（默认）

```csharp
public class MainViewModel : BindableBase
{
    public MainViewModel(IEventAggregator eventAggregator)
    {
        // 默认行为：在发布者线程上执行
        eventAggregator.GetEvent<SomeEvent>().Subscribe(OnEvent);
        
        // 等同于：
        eventAggregator.GetEvent<SomeEvent>().Subscribe(
            OnEvent,
            ThreadOption.PublisherThread);
    }

    private void OnEvent(Payload payload)
    {
        // 在发布者调用 Publish() 的同一线程上执行
    }
}
```

### 5. 线程调度对比

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         线程调度示意图                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  UI Thread          Background Thread        Publisher Thread           │
│  ┌─────────┐        ┌─────────────┐          ┌───────────────┐          │
│  │         │        │             │          │               │          │
│  │ ViewModel│        │  Worker     │          │   Service     │          │
│  │         │        │             │          │               │          │
│  └────┬────┘        └──────┬──────┘          └───────┬───────┘          │
│       │                    │                         │                  │
│       │                    │                         │                  │
│       │                    │                         │                  │
│       ▼                    ▼                         ▼                  │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                    Event Aggregator                             │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│       │                    │                         │                  │
│       │                    │                         │                  │
│       ▼                    ▼                         ▼                  │
│  ┌─────────────┐    ┌─────────────┐          ┌─────────────┐            │
│  │ UIThread    │    │ Background  │          │ Publisher   │            │
│  │ Subscriber  │    │ Subscriber  │          │ Subscriber  │            │
│  └─────────────┘    └─────────────┘          └─────────────┘            │
│                                                                         │
│  - 可更新 UI       - 耗时操作              - 同步执行                    │
│  - 安全访问控件    - 不阻塞 UI             - 与发布者同线程              │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 事件生命周期管理

### 1. 使用 SubscriptionToken 管理订阅

```csharp
public class ViewModelBase : BindableBase, IDisposable
{
    private readonly List<SubscriptionToken> _subscriptionTokens = new List<SubscriptionToken>();

    protected void SubscribeToEvent<TEvent>(Action<TEvent> handler, ThreadOption threadOption = ThreadOption.PublisherThread)
        where TEvent : PubSubEvent, new()
    {
        var token = EventAggregator.GetEvent<TEvent>().Subscribe(handler, threadOption);
        _subscriptionTokens.Add(token);
    }

    protected void SubscribeToEvent<TEvent, TPayload>(
        Action<TPayload> handler,
        ThreadOption threadOption = ThreadOption.PublisherThread,
        Predicate<TPayload> filter = null)
        where TEvent : PubSubEvent<TPayload>, new()
    {
        var token = EventAggregator.GetEvent<TEvent>().Subscribe(handler, threadOption, false, filter);
        _subscriptionTokens.Add(token);
    }

    public virtual void Dispose()
    {
        // 取消所有订阅
        foreach (var token in _subscriptionTokens)
        {
            token.Dispose();
        }
        _subscriptionTokens.Clear();
    }
}
```

### 2. 手动取消订阅

```csharp
public class MainViewModel : BindableBase
{
    private readonly IEventAggregator _eventAggregator;
    private SubscriptionToken _userLoggedInToken;

    public MainViewModel(IEventAggregator eventAggregator)
    {
        _eventAggregator = eventAggregator;
        SubscribeCommand = new DelegateCommand(Subscribe);
        UnsubscribeCommand = new DelegateCommand(Unsubscribe);
    }

    public DelegateCommand SubscribeCommand { get; }
    public DelegateCommand UnsubscribeCommand { get; }

    private void Subscribe()
    {
        if (_userLoggedInToken == null)
        {
            _userLoggedInToken = _eventAggregator.GetEvent<UserLoggedInEvent>()
                .Subscribe(OnUserLoggedIn);
        }
    }

    private void Unsubscribe()
    {
        _userLoggedInToken?.Dispose();
        _userLoggedInToken = null;
    }

    private void OnUserLoggedIn(User user)
    {
        Console.WriteLine($"用户登录: {user.Name}");
    }
}
```

### 3. 在视图关闭时取消订阅

```csharp
public class DetailViewModel : BindableBase, INavigationAware, IDisposable
{
    private readonly IEventAggregator _eventAggregator;
    private SubscriptionToken _subscriptionToken;

    public DetailViewModel(IEventAggregator eventAggregator)
    {
        _eventAggregator = eventAggregator;
    }

    public void OnNavigatedTo(NavigationContext navigationContext)
    {
        // 导航进入时订阅
        _subscriptionToken = _eventAggregator.GetEvent<DataChangedEvent>()
            .Subscribe(OnDataChanged, ThreadOption.UIThread);
    }

    public void OnNavigatedFrom(NavigationContext navigationContext)
    {
        // 导航离开时取消订阅
        _subscriptionToken?.Dispose();
        _subscriptionToken = null;
    }

    public bool IsNavigationTarget(NavigationContext navigationContext) => true;

    public void Dispose()
    {
        _subscriptionToken?.Dispose();
    }

    private void OnDataChanged(Data data)
    {
        // 处理数据变化
    }
}
```

### 4. KeepSubscriberReferenceAlive 选项

```csharp
public class LongRunningViewModel : BindableBase
{
    public LongRunningViewModel(IEventAggregator eventAggregator)
    {
        // 保持订阅者引用，防止被垃圾回收
        eventAggregator.GetEvent<ImportantEvent>().Subscribe(
            OnImportantEvent,
            new SubscribeOptions
            {
                ThreadOption = ThreadOption.UIThread,
                KeepSubscriberReferenceAlive = true  // 保持引用
            });
    }

    private void OnImportantEvent(Payload payload)
    {
        // 处理事件
    }
}
```

---

## 高级用法

### 1. 基类事件聚合

```csharp
// 定义基类事件
public abstract class EntityChangedEvent<T> : PubSubEvent<EntityChangedEventArgs<T>> { }

// 具体事件
public class UserChangedEvent : EntityChangedEvent<User> { }
public class OrderChangedEvent : EntityChangedEvent<Order> { }
public class ProductChangedEvent : EntityChangedEvent<Product> { }

// 事件参数
public class EntityChangedEventArgs<T>
{
    public T Entity { get; set; }
    public ChangeType ChangeType { get; set; }
}

public enum ChangeType
{
    Created,
    Updated,
    Deleted
}
```

### 2. 事件聚合器工厂

```csharp
public interface IEventAggregatorFactory
{
    IEventAggregator CreateEventAggregator();
}

public class EventAggregatorFactory : IEventAggregatorFactory
{
    public IEventAggregator CreateEventAggregator()
    {
        return new EventAggregator();
    }
}

// 用于模块化应用中的独立事件空间
public class ModuleA : IModule
{
    private readonly IEventAggregator _moduleEventAggregator;

    public ModuleA(IEventAggregatorFactory factory)
    {
        _moduleEventAggregator = factory.CreateEventAggregator();
    }
}
```

### 3. 异步事件处理

```csharp
public class AsyncEventViewModel : BindableBase
{
    public AsyncEventViewModel(IEventAggregator eventAggregator)
    {
        eventAggregator.GetEvent<LargeDataEvent>().Subscribe(
            OnLargeDataReceivedAsync,
            ThreadOption.BackgroundThread);
    }

    private async void OnLargeDataReceivedAsync(LargeData data)
    {
        try
        {
            // 异步处理大数据
            var result = await ProcessDataAsync(data);
            
            // 切换到 UI 线程更新界面
            Application.Current.Dispatcher.Invoke(() =>
            {
                // 更新 UI
            });
        }
        catch (Exception ex)
        {
            // 处理异常
        }
    }

    private Task<ProcessedData> ProcessDataAsync(LargeData data)
    {
        return Task.Run(() =>
        {
            // 耗时处理
            Thread.Sleep(5000);
            return new ProcessedData();
        });
    }
}
```

### 4. 事件装饰器模式

```csharp
// 日志装饰器
public class LoggingEventAggregator : IEventAggregator
{
    private readonly IEventAggregator _inner;
    private readonly ILogger _logger;

    public LoggingEventAggregator(IEventAggregator inner, ILogger logger)
    {
        _inner = inner;
        _logger = logger;
    }

    public TEvent GetEvent<TEvent>() where TEvent : EventBase, new()
    {
        var eventType = typeof(TEvent).Name;
        _logger.Debug($"获取事件: {eventType}");
        return _inner.GetEvent<TEvent>();
    }
}

// 性能监控装饰器
public class PerformanceEventAggregator : IEventAggregator
{
    private readonly IEventAggregator _inner;

    public PerformanceEventAggregator(IEventAggregator inner)
    {
        _inner = inner;
    }

    public TEvent GetEvent<TEvent>() where TEvent : EventBase, new()
    {
        var sw = Stopwatch.StartNew();
        var result = _inner.GetEvent<TEvent>();
        sw.Stop();
        
        Debug.WriteLine($"GetEvent<{typeof(TEvent).Name}> 耗时: {sw.ElapsedMilliseconds}ms");
        return result;
    }
}
```

### 5. 带优先级的事件订阅

```csharp
public class PriorityEventAggregator
{
    private readonly Dictionary<Type, List<PrioritySubscription>> _subscriptions = new();

    public void Subscribe<TEvent>(Action<TEvent> handler, int priority = 0)
    {
        var eventType = typeof(TEvent);
        if (!_subscriptions.ContainsKey(eventType))
        {
            _subscriptions[eventType] = new List<PrioritySubscription>();
        }

        _subscriptions[eventType].Add(new PrioritySubscription
        {
            Handler = handler,
            Priority = priority
        });

        // 按优先级排序
        _subscriptions[eventType].Sort((a, b) => b.Priority.CompareTo(a.Priority));
    }

    public void Publish<TEvent>(TEvent eventData)
    {
        var eventType = typeof(TEvent);
        if (_subscriptions.ContainsKey(eventType))
        {
            foreach (var subscription in _subscriptions[eventType])
            {
                ((Action<TEvent>)subscription.Handler)(eventData);
            }
        }
    }
}

public class PrioritySubscription
{
    public Delegate Handler { get; set; }
    public int Priority { get; set; }
}
```

---

## 常见问题与解决方案

### 问题 1：事件未触发

**症状**：发布事件后，订阅者的回调没有被调用。

**可能原因**：
1. 事件类型不匹配
2. 订阅发生在发布之后
3. 订阅者已被垃圾回收

**解决方案**：

```csharp
// 1. 确保事件类型完全一致
public class MyEvent : PubSubEvent<string> { }

// 发布和订阅必须使用同一个事件类
_eventAggregator.GetEvent<MyEvent>().Publish("data");  // ✓ 正确
_eventAggregator.GetEvent<MyEvent>().Subscribe(handler); // ✓ 正确

// 2. 确保订阅在发布之前完成
public class MainViewModel : BindableBase
{
    public MainViewModel(IEventAggregator eventAggregator)
    {
        // 先订阅
        eventAggregator.GetEvent<MyEvent>().Subscribe(OnMyEvent);
        
        // 后发布（或在其他地方发布）
    }
}

// 3. 保持订阅者引用
public class Subscriber : IDisposable
{
    private SubscriptionToken _token;
    
    public void Subscribe(IEventAggregator ea)
    {
        _token = ea.GetEvent<MyEvent>().Subscribe(OnMyEvent);
    }
    
    // 保持 _token 存活，防止被 GC
}
```

### 问题 2：跨线程访问异常

**症状**：在非 UI 线程上更新 UI 时抛出异常。

**解决方案**：

```csharp
// 使用 ThreadOption.UIThread
eventAggregator.GetEvent<StatusEvent>().Subscribe(
    OnStatusChanged,
    ThreadOption.UIThread);

// 或手动切换线程
eventAggregator.GetEvent<StatusEvent>().Subscribe(status =>
{
    Application.Current.Dispatcher.Invoke(() =>
    {
        StatusText = status;
    });
});
```

### 问题 3：内存泄漏

**症状**：订阅者无法被垃圾回收，内存持续增长。

**解决方案**：

```csharp
// 方式一：使用 SubscriptionToken 并在适当时机释放
public class MyViewModel : BindableBase, IDisposable
{
    private SubscriptionToken _token;

    public MyViewModel(IEventAggregator eventAggregator)
    {
        _token = eventAggregator.GetEvent<MyEvent>().Subscribe(OnMyEvent);
    }

    public void Dispose()
    {
        _token?.Dispose();
    }
}

// 方式二：在导航生命周期中管理
public class MyViewModel : BindableBase, INavigationAware
{
    private SubscriptionToken _token;

    public void OnNavigatedTo(NavigationContext context)
    {
        _token = context.GetEventAggregator().GetEvent<MyEvent>().Subscribe(OnMyEvent);
    }

    public void OnNavigatedFrom(NavigationContext context)
    {
        _token?.Dispose();
    }
}
```

### 问题 4：事件顺序不确定

**症状**：多个订阅者的执行顺序不确定。

**解决方案**：

```csharp
// 方案一：使用优先级（自定义实现）
// 参见"带优先级的事件订阅"部分

// 方案二：将顺序敏感的逻辑放在一个订阅者中
eventAggregator.GetEvent<MyEvent>().Subscribe(data =>
{
    // 先执行步骤 A
    StepA(data);
    
    // 再执行步骤 B
    StepB(data);
    
    // 最后执行步骤 C
    StepC(data);
});
```

### 问题 5：Filter 不生效

**症状**：Filter 条件满足但订阅者未被调用。

**解决方案**：

```csharp
// 确保 Filter 返回 bool
eventAggregator.GetEvent<UserEvent>().Subscribe(
    OnUserEvent,
    filter: user => user.IsActive);  // ✓ 必须返回 bool

// 注意 Filter 是在发布者线程执行的
// 如果有耗时操作，应放在回调中而不是 Filter 中
eventAggregator.GetEvent<UserEvent>().Subscribe(
    OnUserEvent,
    filter: user => 
    {
        // Filter 应该是轻量级的
        return user.Age > 18;  // ✓ 简单判断
        // return CheckDatabase(user);  // ✗ 避免在 Filter 中做 IO
    });
```

---

## 最佳实践

### 1. 集中管理事件定义

```csharp
// Events/UserEvents.cs
namespace MyApp.Events.User
{
    public class UserLoggedInEvent : PubSubEvent<User> { }
    public class UserLoggedOutEvent : PubSubEvent { }
    public class UserProfileUpdatedEvent : PubSubEvent<UserProfile> { }
}

// Events/OrderEvents.cs
namespace MyApp.Events.Order
{
    public class OrderCreatedEvent : PubSubEvent<Order> { }
    public class OrderStatusChangedEvent : PubSubEvent<OrderStatusChangedEventArgs> { }
}
```

### 2. 创建强类型事件服务

```csharp
public interface IUserEventService
{
    void PublishUserLoggedIn(User user);
    void PublishUserLoggedOut();
    SubscriptionToken SubscribeToUserLoggedIn(Action<User> handler, ThreadOption threadOption = ThreadOption.PublisherThread);
    SubscriptionToken SubscribeToUserLoggedOut(Action handler, ThreadOption threadOption = ThreadOption.PublisherThread);
}

public class UserEventService : IUserEventService
{
    private readonly IEventAggregator _eventAggregator;

    public UserEventService(IEventAggregator eventAggregator)
    {
        _eventAggregator = eventAggregator;
    }

    public void PublishUserLoggedIn(User user)
    {
        _eventAggregator.GetEvent<UserLoggedInEvent>().Publish(user);
    }

    public void PublishUserLoggedOut()
    {
        _eventAggregator.GetEvent<UserLoggedOutEvent>().Publish();
    }

    public SubscriptionToken SubscribeToUserLoggedIn(
        Action<User> handler,
        ThreadOption threadOption = ThreadOption.PublisherThread)
    {
        return _eventAggregator.GetEvent<UserLoggedInEvent>().Subscribe(handler, threadOption);
    }

    public SubscriptionToken SubscribeToUserLoggedOut(
        Action handler,
        ThreadOption threadOption = ThreadOption.PublisherThread)
    {
        return _eventAggregator.GetEvent<UserLoggedOutEvent>().Subscribe(handler, threadOption);
    }
}

// 注册服务
containerRegistry.RegisterSingleton<IUserEventService, UserEventService>();

// 使用
public class SomeViewModel : BindableBase
{
    private readonly IUserEventService _userEventService;

    public SomeViewModel(IUserEventService userEventService)
    {
        _userEventService = userEventService;
        _userEventService.SubscribeToUserLoggedIn(OnUserLoggedIn, ThreadOption.UIThread);
    }

    private void OnUserLoggedIn(User user)
    {
        // 处理用户登录
    }
}
```

### 3. 使用基类简化订阅管理

```csharp
public abstract class EventSubscriberViewModelBase : BindableBase, IDisposable
{
    protected readonly IEventAggregator EventAggregator;
    private readonly List<SubscriptionToken> _subscriptionTokens = new List<SubscriptionToken>();

    protected EventSubscriberViewModelBase(IEventAggregator eventAggregator)
    {
        EventAggregator = eventAggregator;
    }

    protected void Subscribe<TEvent>(
        Action handler,
        ThreadOption threadOption = ThreadOption.PublisherThread)
        where TEvent : PubSubEvent, new()
    {
        var token = EventAggregator.GetEvent<TEvent>().Subscribe(handler, threadOption);
        _subscriptionTokens.Add(token);
    }

    protected void Subscribe<TEvent, TPayload>(
        Action<TPayload> handler,
        ThreadOption threadOption = ThreadOption.PublisherThread,
        Predicate<TPayload> filter = null)
        where TEvent : PubSubEvent<TPayload>, new()
    {
        var token = EventAggregator.GetEvent<TEvent>().Subscribe(handler, threadOption, false, filter);
        _subscriptionTokens.Add(token);
    }

    protected void Publish<TEvent>() where TEvent : PubSubEvent, new()
    {
        EventAggregator.GetEvent<TEvent>().Publish();
    }

    protected void Publish<TEvent, TPayload>(TPayload payload) where TEvent : PubSubEvent<TPayload>, new()
    {
        EventAggregator.GetEvent<TEvent>().Publish(payload);
    }

    public virtual void Dispose()
    {
        foreach (var token in _subscriptionTokens)
        {
            token.Dispose();
        }
        _subscriptionTokens.Clear();
    }
}

// 使用示例
public class DashboardViewModel : EventSubscriberViewModelBase
{
    public DashboardViewModel(IEventAggregator eventAggregator)
        : base(eventAggregator)
    {
        // 订阅事件
        Subscribe<UserLoggedInEvent>(OnUserLoggedIn, ThreadOption.UIThread);
        Subscribe<OrderCreatedEvent, Order>(OnOrderCreated, ThreadOption.UIThread);
    }

    private void OnUserLoggedIn() { /* ... */ }
    private void OnOrderCreated(Order order) { /* ... */ }
}
```

### 4. 单元测试事件

```csharp
[TestFixture]
public class SomeViewModelTests
{
    private Mock<IEventAggregator> _eventAggregatorMock;
    private Mock<UserLoggedInEvent> _userLoggedInEventMock;
    private SomeViewModel _viewModel;

    [SetUp]
    public void Setup()
    {
        _eventAggregatorMock = new Mock<IEventAggregator>();
        _userLoggedInEventMock = new Mock<UserLoggedInEvent>();

        _eventAggregatorMock
            .Setup(ea => ea.GetEvent<UserLoggedInEvent>())
            .Returns(_userLoggedInEventMock.Object);

        _viewModel = new SomeViewModel(_eventAggregatorMock.Object);
    }

    [Test]
    public void Constructor_ShouldSubscribeToUserLoggedInEvent()
    {
        // Assert
        _userLoggedInEventMock.Verify(
            e => e.Subscribe(
                It.IsAny<Action<User>>(),
                It.IsAny<ThreadOption>(),
                It.IsAny<bool>(),
                It.IsAny<Predicate<User>>()),
            Times.Once);
    }

    [Test]
    public void OnUserLoggedIn_ShouldUpdateCurrentUser()
    {
        // Arrange
        var user = new User { Id = 1, Name = "John" };

        // 捕获订阅的回调
        Action<User> callback = null;
        _userLoggedInEventMock
            .Setup(e => e.Subscribe(
                It.IsAny<Action<User>>(),
                It.IsAny<ThreadOption>(),
                It.IsAny<bool>(),
                It.IsAny<Predicate<User>>()))
            .Callback<Action<User>, ThreadOption, bool, Predicate<User>>(
                (handler, threadOption, keepAlive, filter) => callback = handler);

        // 重新创建视图模型以捕获回调
        _viewModel = new SomeViewModel(_eventAggregatorMock.Object);

        // Act
        callback?.Invoke(user);

        // Assert
        Assert.AreEqual("John", _viewModel.CurrentUserName);
    }
}
```

---

## 完整示例

### 项目结构

```
MyPrismEventApp/
├── App.xaml
├── App.xaml.cs
├── Events/
│   ├── UserEvents.cs
│   └── NotificationEvents.cs
├── Models/
│   ├── User.cs
│   └── Notification.cs
├── Services/
│   ├── IUserEventService.cs
│   └── UserEventService.cs
├── ViewModels/
│   ├── MainWindowViewModel.cs
│   ├── LoginViewModel.cs
│   ├── HeaderViewModel.cs
│   └── NotificationViewModel.cs
└── Views/
    ├── MainWindow.xaml
    ├── LoginView.xaml
    ├── HeaderView.xaml
    └── NotificationView.xaml
```

### Events/UserEvents.cs

```csharp
namespace MyPrismEventApp.Events
{
    public class UserLoggedInEvent : PubSubEvent<User> { }
    public class UserLoggedOutEvent : PubSubEvent { }
    public class UserSessionExpiredEvent : PubSubEvent { }
}
```

### Events/NotificationEvents.cs

```csharp
namespace MyPrismEventApp.Events
{
    public class ShowNotificationEvent : PubSubEvent<Notification> { }
    public class ClearNotificationsEvent : PubSubEvent { }
}
```

### Models/User.cs

```csharp
namespace MyPrismEventApp.Models
{
    public class User
    {
        public int Id { get; set; }
        public string Username { get; set; }
        public string Email { get; set; }
        public bool IsAdmin { get; set; }
        public DateTime LastLoginDate { get; set; }
    }
}
```

### Models/Notification.cs

```csharp
namespace MyPrismEventApp.Models
{
    public class Notification
    {
        public string Title { get; set; }
        public string Message { get; set; }
        public NotificationType Type { get; set; }
        public DateTime Timestamp { get; set; }
    }

    public enum NotificationType
    {
        Info,
        Success,
        Warning,
        Error
    }
}
```

### Services/UserEventService.cs

```csharp
namespace MyPrismEventApp.Services
{
    public interface IUserEventService
    {
        void PublishUserLoggedIn(User user);
        void PublishUserLoggedOut();
        void PublishSessionExpired();
        
        SubscriptionToken SubscribeToUserLoggedIn(Action<User> handler, ThreadOption threadOption = ThreadOption.PublisherThread);
        SubscriptionToken SubscribeToUserLoggedOut(Action handler, ThreadOption threadOption = ThreadOption.PublisherThread);
        SubscriptionToken SubscribeToSessionExpired(Action handler, ThreadOption threadOption = ThreadOption.PublisherThread);
    }

    public class UserEventService : IUserEventService
    {
        private readonly IEventAggregator _eventAggregator;

        public UserEventService(IEventAggregator eventAggregator)
        {
            _eventAggregator = eventAggregator;
        }

        public void PublishUserLoggedIn(User user)
        {
            _eventAggregator.GetEvent<UserLoggedInEvent>().Publish(user);
        }

        public void PublishUserLoggedOut()
        {
            _eventAggregator.GetEvent<UserLoggedOutEvent>().Publish();
        }

        public void PublishSessionExpired()
        {
            _eventAggregator.GetEvent<UserSessionExpiredEvent>().Publish();
        }

        public SubscriptionToken SubscribeToUserLoggedIn(
            Action<User> handler,
            ThreadOption threadOption = ThreadOption.PublisherThread)
        {
            return _eventAggregator.GetEvent<UserLoggedInEvent>()
                .Subscribe(handler, threadOption);
        }

        public SubscriptionToken SubscribeToUserLoggedOut(
            Action handler,
            ThreadOption threadOption = ThreadOption.PublisherThread)
        {
            return _eventAggregator.GetEvent<UserLoggedOutEvent>()
                .Subscribe(handler, threadOption);
        }

        public SubscriptionToken SubscribeToSessionExpired(
            Action handler,
            ThreadOption threadOption = ThreadOption.PublisherThread)
        {
            return _eventAggregator.GetEvent<UserSessionExpiredEvent>()
                .Subscribe(handler, threadOption);
        }
    }
}
```

### ViewModels/LoginViewModel.cs

```csharp
namespace MyPrismEventApp.ViewModels
{
    public class LoginViewModel : BindableBase
    {
        private readonly IUserEventService _userEventService;
        private readonly IUserService _userService;
        private string _username;
        private string _password;
        private string _errorMessage;

        public LoginViewModel(IUserEventService userEventService, IUserService userService)
        {
            _userEventService = userEventService;
            _userService = userService;
            
            LoginCommand = new AsyncDelegateCommand(LoginAsync, CanLogin);
        }

        public AsyncDelegateCommand LoginCommand { get; }

        public string Username
        {
            get => _username;
            set
            {
                SetProperty(ref _username, value);
                LoginCommand.RaiseCanExecuteChanged();
            }
        }

        public string Password
        {
            get => _password;
            set
            {
                SetProperty(ref _password, value);
                LoginCommand.RaiseCanExecuteChanged();
            }
        }

        public string ErrorMessage
        {
            get => _errorMessage;
            set => SetProperty(ref _errorMessage, value);
        }

        private bool CanLogin()
        {
            return !string.IsNullOrWhiteSpace(Username) && !string.IsNullOrWhiteSpace(Password);
        }

        private async Task LoginAsync()
        {
            try
            {
                ErrorMessage = string.Empty;
                
                var user = await _userService.AuthenticateAsync(Username, Password);
                
                if (user != null)
                {
                    // 发布用户登录事件
                    _userEventService.PublishUserLoggedIn(user);
                }
                else
                {
                    ErrorMessage = "用户名或密码错误";
                }
            }
            catch (Exception ex)
            {
                ErrorMessage = $"登录失败: {ex.Message}";
            }
        }
    }
}
```

### ViewModels/HeaderViewModel.cs

```csharp
namespace MyPrismEventApp.ViewModels
{
    public class HeaderViewModel : BindableBase, IDisposable
    {
        private readonly IUserEventService _userEventService;
        private readonly List<SubscriptionToken> _subscriptionTokens = new List<SubscriptionToken>();
        private User _currentUser;
        private bool _isLoggedIn;

        public HeaderViewModel(IUserEventService userEventService)
        {
            _userEventService = userEventService;
            
            LogoutCommand = new DelegateCommand(Logout, () => IsLoggedIn);

            // 订阅用户事件
            _subscriptionTokens.Add(
                _userEventService.SubscribeToUserLoggedIn(OnUserLoggedIn, ThreadOption.UIThread));
            _subscriptionTokens.Add(
                _userEventService.SubscribeToUserLoggedOut(OnUserLoggedOut, ThreadOption.UIThread));
            _subscriptionTokens.Add(
                _userEventService.SubscribeToSessionExpired(OnSessionExpired, ThreadOption.UIThread));
        }

        public DelegateCommand LogoutCommand { get; }

        public User CurrentUser
        {
            get => _currentUser;
            set => SetProperty(ref _currentUser, value);
        }

        public bool IsLoggedIn
        {
            get => _isLoggedIn;
            set
            {
                SetProperty(ref _isLoggedIn, value);
                LogoutCommand.RaiseCanExecuteChanged();
            }
        }

        private void OnUserLoggedIn(User user)
        {
            CurrentUser = user;
            IsLoggedIn = true;
        }

        private void OnUserLoggedOut()
        {
            CurrentUser = null;
            IsLoggedIn = false;
        }

        private void OnSessionExpired()
        {
            CurrentUser = null;
            IsLoggedIn = false;
            // 显示会话过期提示
        }

        private void Logout()
        {
            _userEventService.PublishUserLoggedOut();
        }

        public void Dispose()
        {
            foreach (var token in _subscriptionTokens)
            {
                token.Dispose();
            }
        }
    }
}
```

### ViewModels/NotificationViewModel.cs

```csharp
namespace MyPrismEventApp.ViewModels
{
    public class NotificationViewModel : BindableBase, IDisposable
    {
        private readonly IEventAggregator _eventAggregator;
        private readonly IUserEventService _userEventService;
        private readonly List<SubscriptionToken> _subscriptionTokens = new List<SubscriptionToken>();
        private ObservableCollection<Notification> _notifications;

        public NotificationViewModel(IEventAggregator eventAggregator, IUserEventService userEventService)
        {
            _eventAggregator = eventAggregator;
            _userEventService = userEventService;
            
            Notifications = new ObservableCollection<Notification>();
            ClearCommand = new DelegateCommand(ClearNotifications);

            // 订阅通知事件
            _subscriptionTokens.Add(
                _eventAggregator.GetEvent<ShowNotificationEvent>().Subscribe(
                    OnShowNotification,
                    ThreadOption.UIThread));

            // 订阅用户登录事件，显示欢迎通知
            _subscriptionTokens.Add(
                _userEventService.SubscribeToUserLoggedIn(
                    OnUserLoggedIn,
                    ThreadOption.UIThread));
        }

        public ObservableCollection<Notification> Notifications
        {
            get => _notifications;
            set => SetProperty(ref _notifications, value);
        }

        public DelegateCommand ClearCommand { get; }

        private void OnShowNotification(Notification notification)
        {
            Notifications.Add(notification);
            
            // 自动移除旧通知（保留最近 10 条）
            while (Notifications.Count > 10)
            {
                Notifications.RemoveAt(0);
            }
        }

        private void OnUserLoggedIn(User user)
        {
            var notification = new Notification
            {
                Title = "欢迎",
                Message = $"欢迎回来，{user.Username}！",
                Type = NotificationType.Success,
                Timestamp = DateTime.Now
            };
            
            OnShowNotification(notification);
        }

        private void ClearNotifications()
        {
            Notifications.Clear();
        }

        public void Dispose()
        {
            foreach (var token in _subscriptionTokens)
            {
                token.Dispose();
            }
        }
    }
}
```

### App.xaml.cs

```csharp
namespace MyPrismEventApp
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
            containerRegistry.RegisterSingleton<IUserService, UserService>();
            containerRegistry.RegisterSingleton<IUserEventService, UserEventService>();

            // 注册视图
            containerRegistry.RegisterForNavigation<LoginView, LoginViewModel>();
        }
    }
}
```

### Views/MainWindow.xaml

```xml
<Window x:Class="MyPrismEventApp.Views.MainWindow"
        xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        xmlns:prism="http://prismlibrary.com"
        prism:ViewModelLocator.AutoWireViewModel="True"
        Title="Prism Event Aggregator Demo" Height="600" Width="800">
    <Grid>
        <Grid.RowDefinitions>
            <RowDefinition Height="Auto" />
            <RowDefinition Height="*" />
            <RowDefinition Height="Auto" />
        </Grid.RowDefinitions>

        <!-- 头部区域 -->
        <ContentControl Grid.Row="0"
                        prism:RegionManager.RegionName="HeaderRegion" />

        <!-- 主内容区域 -->
        <ContentControl Grid.Row="1"
                        prism:RegionManager.RegionName="MainRegion" />

        <!-- 通知区域 -->
        <ContentControl Grid.Row="2"
                        prism:RegionManager.RegionName="NotificationRegion" />
    </Grid>
</Window>
```

---

## 与 Region Navigation 结合使用

### 场景：导航时传递事件上下文

```csharp
public class OrderListViewModel : EventSubscriberViewModelBase
{
    private readonly IRegionManager _regionManager;

    public OrderListViewModel(
        IEventAggregator eventAggregator,
        IRegionManager regionManager)
        : base(eventAggregator)
    {
        _regionManager = regionManager;
        
        SelectOrderCommand = new DelegateCommand<Order>(SelectOrder);
        
        // 订阅订单状态变化事件
        Subscribe<OrderStatusChangedEvent, OrderStatusChangedEventArgs>(OnOrderStatusChanged, ThreadOption.UIThread);
    }

    public DelegateCommand<Order> SelectOrderCommand { get; }

    private void SelectOrder(Order order)
    {
        // 导航到订单详情，并传递参数
        var parameters = new NavigationParameters
        {
            { "orderId", order.Id }
        };
        
        _regionManager.RequestNavigate("MainRegion", "OrderDetailView", parameters);
    }

    private void OnOrderStatusChanged(OrderStatusChangedEventArgs args)
    {
        // 更新列表中的订单状态
        var order = Orders.FirstOrDefault(o => o.Id == args.OrderId);
        if (order != null)
        {
            order.Status = args.NewStatus;
        }
    }
}

public class OrderDetailViewModel : EventSubscriberViewModelBase, INavigationAware
{
    private readonly IRegionManager _regionManager;

    public OrderDetailViewModel(
        IEventAggregator eventAggregator,
        IRegionManager regionManager)
        : base(eventAggregator)
    {
        _regionManager = regionManager;
        
        UpdateStatusCommand = new DelegateCommand<string>(UpdateStatus);
    }

    public DelegateCommand<string> UpdateStatusCommand { get; }

    public void OnNavigatedTo(NavigationContext navigationContext)
    {
        var orderId = navigationContext.Parameters.GetValue<int>("orderId");
        LoadOrder(orderId);
        
        // 导航进入后订阅事件
        Subscribe<OrderStatusChangedEvent, OrderStatusChangedEventArgs>(
            OnOrderStatusChanged,
            ThreadOption.UIThread,
            args => args.OrderId == orderId);  // 只关注当前订单
    }

    public void OnNavigatedFrom(NavigationContext navigationContext)
    {
        // 基类会自动处理订阅清理
    }

    public bool IsNavigationTarget(NavigationContext navigationContext)
    {
        var orderId = navigationContext.Parameters.GetValue<int>("orderId");
        return orderId == CurrentOrder?.Id;
    }

    private void UpdateStatus(string newStatus)
    {
        // 更新订单状态...
        
        // 发布事件，通知其他视图
        Publish<OrderStatusChangedEvent, OrderStatusChangedEventArgs>(
            new OrderStatusChangedEventArgs
            {
                OrderId = CurrentOrder.Id,
                NewStatus = newStatus
            });
    }

    private void OnOrderStatusChanged(OrderStatusChangedEventArgs args)
    {
        CurrentOrder.Status = args.NewStatus;
    }
}
```

---

## 总结

Prism 事件聚合器是一个强大且灵活的发布-订阅通信机制，通过本文档，你应该能够：

| 能力 | 说明 |
|------|------|
| 理解核心概念 | 事件聚合器、发布者、订阅者、载荷 |
| 定义和组织事件 | 使用 `PubSubEvent<T>` 定义事件 |
| 发布和订阅事件 | 使用 `Publish()` 和 `Subscribe()` 方法 |
| 配置订阅选项 | 线程调度、事件过滤、生命周期管理 |
| 解决常见问题 | 跨线程访问、内存泄漏、事件顺序 |
| 编写可测试代码 | 使用依赖注入和接口抽象 |
| 结合区域导航 | 在导航场景中使用事件通信 |

如需更多信息，请参考：
- [Prism 官方文档 - Event Aggregator](https://prismlibrary.com/docs/event-aggregator.html)
- [Prism GitHub 仓库](https://github.com/PrismLibrary/Prism)

---

**文档版本**：1.0
**最后更新**：2026-05-31
**适用框架版本**：Prism 8.x
