using FrameCodec;
using System.IO.Ports;

public interface IFrameChannel          // 接缝：行为可以在这里被替换
{
    void Write(byte[] bytes);
}
public class ChannelBusyException : Exception { }
public class FrameSender                // 纯逻辑：拼校验、写通道
{
    private readonly IFrameChannel _channel;

    public FrameSender(IFrameChannel channel) => _channel = channel;

    public void Send(byte[] frame) =>
        _channel.Write(frame.Append(Frame.XorChecksum(frame)).ToArray());

    public bool TrySend(byte[] frame)
    {
        var payload = frame.Append(Frame.XorChecksum(frame)).ToArray();

        for (int attempt = 0; attempt < 2; attempt++)   // 两次机会
        {
            try
            {
                _channel.Write(payload);
                return true;                             // 有人收了，收工
            }
            catch (ChannelBusyException) { }             // 忙，吃掉异常，进下一圈
        }
        return false;                                    // 两次都忙，放弃
    }

}

public class SerialFrameChannel : IFrameChannel   // 真硬件，只在组装时出现
{
    private readonly string _portName;
    public SerialFrameChannel(string portName) => _portName = portName;

    public void Write(byte[] bytes)
    {
        using var port = new SerialPort(_portName, 9600);
        port.Open();
        port.Write(bytes, 0, bytes.Length);
    }
}