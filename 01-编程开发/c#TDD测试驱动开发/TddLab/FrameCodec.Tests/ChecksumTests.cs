using FrameCodec;
using NSubstitute;
using Xunit;
public class ChecksumTests
{
    [Fact]
    public void Xor_of_10_and_02_is_12()
    {
        byte[] frame = { 0x10, 0x02 };
        Assert.Equal(0x12, Frame.XorChecksum(frame));
    }

    [Fact]
    public void XorEmpty()
    {
        Assert.Equal(0x00, Frame.XorChecksum(Array.Empty<byte>()));
    }
    [Fact]
    public void Parse_single_hex_byte()
    {
        Assert.Equal(new byte[] { 0x10 }, Frame.Parse("10"));
    }

    [Fact]
    public void Parse_hex_frame()
    {
        Assert.Equal(new byte[] { 0x10, 0x02 }, Frame.Parse("10 02"));
    }

    [Theory]
    [InlineData("10", new byte[] { 0x10 })]
    [InlineData("7F", new byte[] { 0x7F })]
    [InlineData("10 02", new byte[] { 0x10, 0x02 })]
    public void Parse_hex_string(string text, byte[] expected)
    {
        Assert.Equal(expected, Frame.Parse(text));
    }

    [Fact]
    public void Send_appends_xor_checksum()
    {
        var channel = new RecordingChannel();
        var sender = new FrameSender(channel);

        sender.Send(new byte[] { 0x10, 0x02 });

        Assert.Equal(
            new byte[] { 0x10, 0x02, 0x12 },   // 校验字节 0x12 被追加在帧尾
            channel.LastWritten);
    }

    private class RecordingChannel : IFrameChannel
    {
        public byte[] LastWritten { get; private set; } = Array.Empty<byte>();
        public void Write(byte[] bytes) => LastWritten = bytes;
    }



    [Fact]
    public void Send_retries_once_when_channel_is_busy()
    {
        var channel = new FlakyChannel(failuresBeforeSuccess: 0);
        var sender = new FrameSender(channel);

        sender.Send(new byte[] { 0x10, 0x02 });
        sender.Send(new byte[] { 0x10, 0x02 });
        Assert.Equal(2, channel.Attempts);   // ← 注意这条：断言的不是数据，是「次数」
    }

    private class FlakyChannel : IFrameChannel
    {
        private int _failuresLeft;
        public int Attempts { get; private set; }
        public byte[] LastWritten { get; private set; } = Array.Empty<byte>();

        public FlakyChannel(int failuresBeforeSuccess) => _failuresLeft = failuresBeforeSuccess;

        public void Write(byte[] bytes)
        {
            Attempts++;
            if (_failuresLeft-- > 0) throw new ChannelBusyException();
            LastWritten = bytes;
        }
    }


    [Fact]
    public void TrySend_gives_up_after_two_busy_attempts()
    {
        var channel = Substitute.For<IFrameChannel>();
        channel.When(c => c.Write(Arg.Any<byte[]>()))
               .Do(_ => throw new ChannelBusyException());   // 永远忙

        var sender = new FrameSender(channel);

        var ok = sender.TrySend(new byte[] { 0x10, 0x02 });

        Assert.False(ok);                                    // 放弃了
        channel.Received(2).Write(Arg.Any<byte[]>());        // 试了两次，不多不少
    }

    [Fact]
    public void TrySend_returns_true_when_channel_accepts()
    {
        var channel = Substitute.For<IFrameChannel>();
        var sender = new FrameSender(channel);

        var ok = sender.TrySend(new byte[] { 0x10, 0x02 });

        Assert.True(ok);
        channel.Received(1).Write(Arg.Any<byte[]>());
    }


}