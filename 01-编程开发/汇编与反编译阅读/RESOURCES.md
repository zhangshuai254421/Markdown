# 汇编与 C++ 反编译阅读 Resources

## Knowledge

- [Microsoft: x64 calling convention](https://learn.microsoft.com/en-us/cpp/build/x64-calling-convention?view=msvc-170)
  Windows x64 ABI 的权威规则。用于：参数、返回值、shadow space、易失/非易失寄存器和栈对齐。
- [Microsoft: x64 architecture overview and registers](https://learn.microsoft.com/windows-hardware/drivers/debugger/x64-architecture)
  Windows 调试视角的寄存器和 x64 基础。用于：读 WinDbg、Ghidra 或 IDA 中的寄存器状态。
- [Intel: 64 and IA-32 Software Developer Manuals](https://www.intel.com/content/www/us/en/developer/articles/technical/intel-sdm.html)
  x86-64 指令语义的第一手参考。用于：查询 `mov`、`lea`、`cmp`、`test`、跳转等具体指令，非通读。
- [Ghidra documentation](https://ghidradocs.com/)
  Ghidra 的官方使用文档与入门课程。用于：导入、分析、反编译窗口、函数和数据类型修正。
- [Compiler Explorer](https://godbolt.org/)
  交互式比较 C++ 与编译输出。用于：在 `-O0` 与 `-O2` 间切换，观察相同源码的汇编变化。
- [CppCon: Just Enough Assembly for Compiler Explorer](https://www.youtube.com/watch?v=_sSFtJwgVYQ)
  面向 C++ 开发者的汇编阅读演讲。用于：把编译器输出与源码建立直觉；作为课程后的复习材料。

## Wisdom (Communities)

- [Reverse Engineering Stack Exchange](https://reverseengineering.stackexchange.com/)
  有明确证据和代码上下文的反编译、ABI、工具使用问题，适合作为真实案例的校验场。

