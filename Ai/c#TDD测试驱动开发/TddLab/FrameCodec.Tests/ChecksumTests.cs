using FrameCodec;
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
}