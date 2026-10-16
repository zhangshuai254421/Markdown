namespace FrameCodec;

// 报警状态机：纯逻辑，没有时钟、没有 IO，测试只走公共接口
//
// 转换表（合法路径）：
//   Normal          --Trigger-->           Unacknowledged
//   Unacknowledged  --Acknowledge-->       Acknowledged
//   Acknowledged    --Clear-->             Normal
//   Unacknowledged  --Clear-->             ReturnToNormal
//   ReturnToNormal  --AcknowledgeReturn--> Normal
// 表外调用 = 调用方有 bug（如按钮双击、UI 状态失同步），抛 InvalidOperationException，状态原地不动。
// 锁存（latching）暂不建模：RTN 已覆盖「恢复未确认不能静默消失」的语义。
public enum AlarmState
{
    Normal,
    Unacknowledged,
    Acknowledged,
    ReturnToNormal,
}

public class AlarmStateMachine
{
    public AlarmState CurrentState { get; private set; } = AlarmState.Normal;

    public void Trigger() =>
        CurrentState = RequireLegal(AlarmState.Normal, AlarmState.Unacknowledged);

    public void Acknowledge() =>
        CurrentState = RequireLegal(AlarmState.Unacknowledged, AlarmState.Acknowledged);

    public void Clear() =>
        CurrentState = CurrentState switch
        {
            AlarmState.Acknowledged => AlarmState.Normal,           // 先确认后恢复：直接回家
            AlarmState.Unacknowledged => AlarmState.ReturnToNormal, // 先恢复后确认：还差一次 AcknowledgeReturn
            _ => Illegal(),
        };

    public void AcknowledgeReturn() =>
        CurrentState = RequireLegal(AlarmState.ReturnToNormal, AlarmState.Normal);

    // 查表辅助：from 是本方法唯一合法的起点，to 是去向
    private AlarmState RequireLegal(AlarmState from, AlarmState to) =>
        CurrentState == from ? to : Illegal();

    private AlarmState Illegal() =>
        throw new InvalidOperationException($"报警状态机不接受 {CurrentState} 状态下的此操作");
}
