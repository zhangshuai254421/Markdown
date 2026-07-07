# ControllableTask 类图

```mermaid
classDiagram
    class ControllableTask {
        - thread_ : std::thread
        - running_ : atomic~bool~
        - paused_ : atomic~bool~
        - joined_ : atomic~bool~
        - stop_ : atomic~bool~
        - pauseMutex_ : std::mutex
        - pauseCv_ : condition_variable

        + ControllableTask()
        + ~ControllableTask()
        + start(func : TaskFunc) void
        + pause() void
        + resume() void
        + stop() void
        + Init() void
        - selfStop() void
        + isRunning() bool
        + isPaused() bool
        + isJoined() bool
        + isStoped() bool
    }

    class TaskFunc {
        <<function>>
        +operator()(checkPause : function~void()~) void
    }

    ControllableTask ..> TaskFunc : 持有
    ControllableTask ..> "1" std::thread : 管理
    ControllableTask ..> "1" std::mutex : 同步
    ControllableTask ..> "1" std::condition_variable : 等待/唤醒
```

## 状态转换图

```mermaid
stateDiagram-v2
    [*] --> Idle : 构造

    Idle --> Running : start(func)
    Running --> Paused : pause()
    Paused --> Running : resume()
    Running --> Idle : 任务函数返回
    Paused --> Idle : stop()
    Running --> Idle : stop()

    Idle --> Idle : Init()
```

## 线程控制流程

```mermaid
sequenceDiagram
    participant Caller as 调用方
    participant Task as ControllableTask
    participant Thread as 工作线程

    Caller->>Task: start(func)
    Task->>Thread: 创建线程
    activate Thread
    Thread->>Thread: func(checkPause)

    loop 任务循环
        Thread->>Thread: checkPause()
        Note over Thread: 检查 paused_ 标志
        alt paused_ == true
            Thread->>Thread: wait() 阻塞
        else paused_ == false
            Thread->>Thread: 继续执行
        end
    end

    Caller->>Task: pause()
    Task-->>Thread: paused_ = true
    Note over Thread: 下次 checkPause() 阻塞

    Caller->>Task: resume()
    Task-->>Thread: notify_one()
    Note over Thread: 从 wait() 唤醒

    Caller->>Task: stop()
    Task-->>Thread: stop_ = true, notify_one()
    Thread->>Thread: 退出循环
    deactivate Thread
    Task->>Thread: join()
    Note over Task: 等待线程完全退出
```

## 成员变量职责

```mermaid
flowchart LR
    subgraph 控制标志
        running_[running_<br/>线程执行中]
        paused_[paused_<br/>被请求暂停]
        stop_[stop_<br/>被请求停止]
        joined_[joined_<br/>已 join]
    end

    subgraph 同步原语
        mutex[pauseMutex_<br/>互斥锁]
        cv[pauseCv_<br/>条件变量]
    end

    subgraph 线程对象
        thread[thread_<br/>工作线程]
    end

    running_ -->|检查| checkPause
    paused_ -->|检查| checkPause
    stop_ -->|检查| checkPause
    mutex -->|配合| cv
    cv -->|阻塞/唤醒| checkPause
    thread -->|执行| checkPause

    checkPause["checkPause()<br/>协作式暂停点"]
```
