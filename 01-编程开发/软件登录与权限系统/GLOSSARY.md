# 术语表（GLOSSARY）

课程内所有课件与参考卡共用这套术语（纯桌面版）。新术语先加进这里，再进课件。

| 术语 | 英文 | 一句话定义 |
|---|---|---|
| 认证 | Authentication (AuthN) | 核对「你是不是你声称的那个人」——验证身份本身 |
| 授权 | Authorization (AuthZ) | 判断「你能对什么资源做什么操作」——认证通过之后才发生 |
| 审计 | Audit | 记录「谁在什么时候对什么做了什么」，事后可追溯 |
| 凭据 | Credential | 用来证明身份的东西：密码、指纹、域账号都算 |
| 进程内会话 | In-process session | 桌面形态的会话：登录后 App 级 CurrentUser 对象，软件关闭即登出 |
| 哈希 | Hash | 把任意数据映射成固定长度「指纹」的单向函数：不可逆，相同输入必得相同输出 |
| 库被拷走 | — | 桌面软件的核心威胁：Ghost、共享目录、备份都会让本地库离开你的控制 |
| 彩虹表 | Rainbow table | 预先算好的「明文→哈希」巨型查找表，专门对付无盐的快哈希 |
| 盐 | Salt | 存密码哈希前拼进密码的随机值，让相同密码的哈希结果互不相同 |
| 慢哈希 | Slow hash | 故意算得慢的哈希算法（bcrypt / Argon2 / PBKDF2），抬高暴力破解成本 |
| 密钥派生函数 | KDF | 为密码设计的慢哈希算法族：Argon2id、bcrypt、scrypt、PBKDF2 |
| 工作因子 | Work factor / Cost | 控制慢哈希算多慢的参数（迭代次数、内存量），可随硬件发展上调 |
| 重哈希 | Rehash | 用户下次登录时把旧参数哈希升级为新参数（SuccessRehashNeeded） |
| 弱口令黑名单 | Password blocklist | 拦截常见/已泄露口令的检查（NIST 800-63B-4 要求） |
| 多因素认证 | MFA / 2FA | 同时验证「你知道的 + 你拥有的/你本身的」两类以上因素 |
| RBAC | Role-Based Access Control | 把权限授给角色、再把角色授给用户的访问控制模型 |
| 权限点 | Permission | 授权最小单元，按「资源 × 动作」定义，只发给角色、不发给用户 |
| 最小权限原则 | Least Privilege | 只给完成任务所必需的权限，多一点也不给 |
| 默认拒绝 | Deny by default | 未显式授权的功能一律拒绝，漏配倒向安全 |
| 职责分离 | Separation of Duties (SoD) | 配置权与审计权互斥：能改权限的人不看审计 |
| 越手 / 越权 | Privilege misuse | 桌面语义：够到岗位之外的功能（垂直）、看到不该看的数据（水平） |
| 账号锁定 | Account lockout | 连续失败达阈值后拒绝登录；桌面简化为内存计数（如 5 次锁 5 分钟） |
| 用户枚举 | User enumeration | 靠差异化提示探测哪些账号存在；防法是统一失败话术 |
| 等保 2.0 | — | 中国网络安全等级保护制度 2.0，核心标准 GB/T 22239-2019，按一至四级提安全要求 |
| 安全审计（等保语境） | Security audit | 等保条款要求项：审计覆盖每个用户、记录可追溯、留存不少于六个月 |
| AAL | Authenticator Assurance Level | NIST 800-63B 的验证器保障等级 AAL1–AAL3，等级越高对抗攻击能力越强 |
