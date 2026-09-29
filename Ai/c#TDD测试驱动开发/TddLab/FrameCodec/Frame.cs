namespace FrameCodec;

public static class Frame
{
    public static byte XorChecksum(byte[] payload) =>
       payload.Aggregate((byte)0, (acc, b) => (byte)(acc ^ b));

     public static byte[] Parse(string str) =>
          str.Split(' ', StringSplitOptions.RemoveEmptyEntries)
              .Select(token => Convert.ToByte(token, 16))
              .ToArray();


}
