using FrameCodec;
using Xunit;

// 报警状态机：毕业课第一块试验田
// 转换表（每轮红绿补一行）：
//   Normal          --Trigger-->          Unacknowledged
//   Unacknowledged  --Acknowledge-->      Acknowledged
//   Acknowledged    --Clear-->            Normal
//   Unacknowledged  --Clear-->            ReturnToNormal
//   ReturnToNormal  --AcknowledgeReturn--> Normal
// 表外调用契约：一律抛 InvalidOperationException，且状态原地不动
public class AlarmStateMachineTests
{
    [Fact]
    public void New_machine_starts_in_Normal()
    {
        var machine = new AlarmStateMachine();

        Assert.Equal(AlarmState.Normal, machine.CurrentState);   // 契约第一条：出厂即 Normal
    }

    [Fact]
    public void Trigger_moves_Normal_to_Unacknowledged()
    {
        var machine = new AlarmStateMachine();

        machine.Trigger();

        Assert.Equal(AlarmState.Unacknowledged, machine.CurrentState);   // 报警发生，等人来确认
    }

    [Fact]
    public void Acknowledge_moves_Unacknowledged_to_Acknowledged()
    {
        var machine = new AlarmStateMachine();
        machine.Trigger();

        machine.Acknowledge();

        Assert.Equal(AlarmState.Acknowledged, machine.CurrentState);   // 人确认过了，等条件恢复
    }

    [Fact]
    public void Clear_moves_Acknowledged_to_Normal()
    {
        var machine = new AlarmStateMachine();
        machine.Trigger();
        machine.Acknowledge();

        machine.Clear();

        Assert.Equal(AlarmState.Normal, machine.CurrentState);   // 先确认后恢复：直接回家
    }

    [Fact]
    public void Clear_moves_Unacknowledged_to_ReturnToNormal()
    {
        var machine = new AlarmStateMachine();
        machine.Trigger();                       // 条件报警了，还没人来确认
        machine.Clear();                         // 条件自己恢复了

        Assert.Equal(AlarmState.ReturnToNormal, machine.CurrentState);   // 仍需 AcknowledgeReturn 收尾
    }

    [Fact]
    public void AcknowledgeReturn_moves_ReturnToNormal_to_Normal()
    {
        var machine = new AlarmStateMachine();
        machine.Trigger();
        machine.Clear();                          // 先恢复后确认，进了 RTN

        machine.AcknowledgeReturn();

        Assert.Equal(AlarmState.Normal, machine.CurrentState);   // 人看过恢复了，闭环
    }

    // ── 非法转换：先定契约，再决定实现（决策：抛 InvalidOperationException）──
    [Theory]
    [InlineData(AlarmState.Unacknowledged)]
    [InlineData(AlarmState.Acknowledged)]
    [InlineData(AlarmState.ReturnToNormal)]
    public void Trigger_outside_Normal_throws(AlarmState start)
    {
        var machine = MachineIn(start);

        Assert.Throws<InvalidOperationException>(() => machine.Trigger());
        Assert.Equal(start, machine.CurrentState);   // 抛归抛，机器不能被改坏
    }

    [Theory]
    [InlineData(AlarmState.Normal)]
    [InlineData(AlarmState.Acknowledged)]
    [InlineData(AlarmState.ReturnToNormal)]
    public void Acknowledge_outside_Unacknowledged_throws(AlarmState start)
    {
        var machine = MachineIn(start);

        Assert.Throws<InvalidOperationException>(() => machine.Acknowledge());
        Assert.Equal(start, machine.CurrentState);
    }

    [Theory]
    [InlineData(AlarmState.Normal)]
    [InlineData(AlarmState.ReturnToNormal)]
    public void Clear_outside_Acknowledged_or_Unacknowledged_throws(AlarmState start)
    {
        var machine = MachineIn(start);

        Assert.Throws<InvalidOperationException>(() => machine.Clear());
        Assert.Equal(start, machine.CurrentState);
    }

    [Theory]
    [InlineData(AlarmState.Normal)]
    [InlineData(AlarmState.Unacknowledged)]
    [InlineData(AlarmState.Acknowledged)]
    public void AcknowledgeReturn_outside_ReturnToNormal_throws(AlarmState start)
    {
        var machine = MachineIn(start);

        Assert.Throws<InvalidOperationException>(() => machine.AcknowledgeReturn());
        Assert.Equal(start, machine.CurrentState);
    }

    // 测试脚手架：只走合法路径把机器开到指定状态
    private static AlarmStateMachine MachineIn(AlarmState state)
    {
        var machine = new AlarmStateMachine();
        switch (state)
        {
            case AlarmState.Unacknowledged: machine.Trigger(); break;
            case AlarmState.Acknowledged: machine.Trigger(); machine.Acknowledge(); break;
            case AlarmState.ReturnToNormal: machine.Trigger(); machine.Clear(); break;
        }
        return machine;
    }
}
