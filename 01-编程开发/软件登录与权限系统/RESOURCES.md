# 软件登录与权限系统 Resources（纯桌面版）

## Knowledge

### 合规主线（中国国标）

- [GB/T 22239-2019《信息安全技术 网络安全等级保护基本要求》官方标准信息页](https://openstd.samr.gov.cn/bzgk/std/newGbInfo?hcno=BAFB47E8874764186BDB7865E8344DAF)
  即「等保 2.0」。身份鉴别、访问控制、安全审计是安全功能要求项，按一至四级逐级增强。Use for: 回答「过测评要做到什么」，登录权限模块的合规底线（第 6 课验收主轴）。
- [GB/T 39786-2021《信息安全技术 信息系统密码应用基本要求》官方标准信息页](https://openstd.samr.gov.cn/bzgk/std/newGbInfo?hcno=53282C88712CE157043B7A2C590278FC)
  商用密码（SM 系列算法）应用要求。Use for: 客户指定国密算法或要做「密评」的项目——届时哈希路线换国密方案。
- 《网络安全法》（2017 施行）：确立等保制度；第 21 条要求日志留存不少于六个月。Use for: 审计「只增不删、留存 ≥6 个月」的法律依据。

### 原理与落地主线（国际标准 / 行业最佳实践）

- [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
  密码存储唯一权威出处：Argon2id（19 MiB/2 次/并行 1）、PBKDF2-HMAC-SHA256 ≥600,000 次、bcrypt ≥10；盐、pepper、旧哈希升级。Use for: 第 2 课全部参数。
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
  密码策略（长度底线、黑名单、不强制组合规则与定期换密）、失败话术统一、锁定策略。Use for: 第 3 课登录窗口与密码策略。
- [OWASP Authorization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html)
  十三条授权原则：默认拒绝、最小权限、检查集中等。Use for: 第 4、5 课建模与落地的原则出处。
- [NIST SP 800-63B-4《Digital Identity Guidelines》](https://pages.nist.gov/800-63-4/sp800-63b.html)（[最终版发布页](https://csrc.nist.gov/pubs/sp/800/63/b/4/final)，2025 定稿）
  认证权威参考：AAL1–3、密码策略（不再建议定期强制换密）。Use for: 讲清每个决策的「为什么」。
- [NIST RBAC（INCITS 359）](https://csrc.nist.gov/projects/role-based-access-control)
  基于角色的访问控制参考模型：核心/层级/约束三层。Use for: 第 4 课建模方法的模型出处。
- [OWASP ASVS 5.0](https://owasp.org/projects/asvs)（[5.0 PDF](https://raw.githubusercontent.com/OWASP/ASVS/v5.0.0/5.0/OWASP_Application_Security_Verification_Standard_5.0.0_en.pdf)）
  应用安全验证需求清单。Use for: 客户要正式验收时，把课程自查单升级成 ASVS 条目的桥梁。
- ISO/IEC 27001:2022 附录 A 5.15–5.18（[解读](https://www.urmconsulting.com/blog/iso-27001-2022-a-5-organisational-controls-access-management)）
  管理体系视角的访问管理控制簇。Use for: 客户要 ISO 认证时的对接语言。

### .NET 落地文档（桌面）

- [PasswordHasher&lt;TUser&gt; 类](https://learn.microsoft.com/en-us/dotnet/api/microsoft.aspnetcore.identity.passwordhasher-1)（NuGet：Microsoft.Extensions.Identity.Core）
  桌面可直接 new 的密码哈希器：PBKDF2 + 自动盐 + 版本化格式 + SuccessRehashNeeded。Use for: 第 2 课核心 API。
- [WPF Commanding Overview](https://learn.microsoft.com/en-us/dotnet/desktop/wpf/advanced/commanding-overview) / [Prism DelegateCommand](https://docs.prismlibrary.com/docs/wpf/essential-concepts/commands.html)
  CanExecute 命令机制。Use for: 第 5 课授权落地。

## Wisdom (Communities)

- [Information Security Stack Exchange](https://security.stackexchange.com/)
  高信号安全问答社区。Use for: 具体方案取舍的第二意见。
- [OWASP GitHub Discussions（OWASP/ASVS）](https://github.com/OWASP/ASVS/discussions)
  标准条款怎么理解、怎么落地可直接与标准社区讨论。Use for: ASVS 适用性答疑。
- 博客园 / 掘金的 .NET 桌面开发话题
  中文实现向文章质量参差——只当线索用，结论一律回上面的一手标准核对。

## Gaps

- 等保「安全计算环境」条款的逐条中文原文精读（全文需在[官方公开系统](https://openstd.samr.gov.cn)在线阅读）——引用条款时需补一次精读。
- 多机连库形态的应用—数据库传输加密（TLS/证书）专题资源——需要时再搜集。
- 桌面 MFA 实操方案（USB Key / 动态口令在 WPF 的接入）——客户提出双因素硬要求时的储备。
