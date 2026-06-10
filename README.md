# findnr-feeds

## 简介

本仓库包含了一系列为 OpenWrt (特别是新版 LuCI) 量身定制的高性能、高实用性插件，旨在增强路由器的安全防护、内网穿透能力、订阅转换以及网络流量精细化管理。

*   **luci-app-simple2fa**：为路由器 Web 登录界面强制添加 **TOTP 二次验证 (2FA)**。特别适合开启了公网访问或内网穿透的用户，提供金融级的安全屏障。
*   **luci-app-cymfrpc**：Frp 客户端管理器。支持多实例并行运行，支持纯文本直接粘贴 `ini/toml/yaml` 格式配置。
*   **luci-app-cymfrps**：Frp 服务端管理器。支持多实例运行，便于集中式穿透节点中转。
*   **luci-app-vpnrss**：VPN 订阅聚合与转换生成器。支持多协议节点聚合，可自动输出为 Clash、Sing-box、Surge 或 Base64 订阅链接。
*   **luci-app-cymonline**：在线设备与流量管理器。支持实时网速监控、累计流量统计、精细化设备限速及一键断网。

---

## 安装说明

### 准备工作

本插件包部分功能依赖底层系统工具，构建时会自动安装：
- **luci-app-simple2fa** 依赖：`oath-toolkit` (验证计算) 和 `qrencode` (生成二维码)
- **luci-app-cymonline** 依赖：`tc` (流量控制)、`kmod-sched-core` 和 `nftables`
- **cymfrp** 依赖：`golang` (编译核心，构建系统需支持 Go 编译器)

### 方式一：集成到 OpenWrt 源码编译（推荐）

1. 进入你的 OpenWrt (或 LEDE) 源码根目录，在 `feeds.conf.default` 或 `feeds.conf` 中追加本仓库：
   ```bash
   echo "src-git findnrfeeds https://github.com/findnr/findnr-feeds.git" >> feeds.conf
   ```
2. 更新并安装 feeds：
   ```bash
   ./scripts/feeds update findnrfeeds
   & ./scripts/feeds install -a -p findnrfeeds
   ```
3. 打开配置菜单选择插件：
   ```bash
   make menuconfig
   ```
   在菜单中勾选以下路径的插件（按需选择 `<*>` 编译进固件或 `<M>` 编译为单独 ipk）：
   *   **LuCI -> Applications -> luci-app-simple2fa**
   *   **LuCI -> Applications -> luci-app-cymfrpc**
   *   **LuCI -> Applications -> luci-app-cymfrps**
   *   **LuCI -> Applications -> luci-app-vpnrss**
   *   **LuCI -> Applications -> luci-app-cymonline**
4. 开始编译：
   ```bash
   make -j$(nproc)
   ```

### 方式二：单独编译并安装 IPK

如果你已拥有编译好的固件，只想编译本仓库的单包，在源码目录下执行：
```bash
make package/feeds/findnrfeeds/luci-app-simple2fa/compile V=s
make package/feeds/findnrfeeds/cymfrp/compile V=s
make package/feeds/findnrfeeds/luci-app-cymfrpc/compile V=s
make package/feeds/findnrfeeds/luci-app-cymfrps/compile V=s
make package/feeds/findnrfeeds/luci-app-vpnrss/compile V=s
make package/feeds/findnrfeeds/luci-app-cymonline/compile V=s
```
编译完成后，将对应的 `.ipk` 文件上传到路由器的 `/tmp` 目录下，在路由器终端执行安装：
```bash
opkg update
opkg install /tmp/luci-app-simple2fa_*.ipk
```

---

## 插件详细使用教程

### 1. 二次验证 (luci-app-simple2fa)

本插件提供 CGI 级别的主动拦截。一旦启用，所有访问 `/cgi-bin/luci` 的登录请求都必须通过 TOTP 验证码校验。

#### ⚙️ 配置与使用步骤：
1. **进入路径**：登录路由器 Web 界面 -> **系统 (System)** -> **二步验证 (Two-Factor Auth)**。
2. **初始化密钥**：
   - 首次进入该页面，系统会自动在后台生成一个高强度的随机 Base32 密钥。
   - 页面会自动展示对应的**二维码**以及**明文密钥**。
3. **绑定手机身份验证器**：
   - 打开手机上的身份验证器 APP（如 Google Authenticator、Microsoft Authenticator、Authy 等）。
   - 选择“扫描二维码”或“手动输入密钥”（将页面上的密钥复制并填入），绑定完成。
4. **安全防锁死校验（关键）**：
   - 为了防止由于系统时间不对、用户扫错码导致把自己锁在路由器外面，**在勾选“启用”前，必须先在“验证码”输入框中输入手机 APP 上当前生成的 6 位数字验证码**。
   - 验证通过后，方可点击下方“保存并应用”。如果验证不匹配，系统会提示失败，确保配置的绝对安全。
5. **登录测试**：
   - 退出当前登录或清除浏览器 Cookie，再次访问路由器登录页面。
   - 在输入正常的用户名和密码后，回车或点击登录，页面将切换或弹出 **验证码** 输入框。
   - 输入身份验证器生成的 6 位实时验证码，即可成功进入管理后台。

#### 🛠️ 故障排查与后台恢复：
> [!WARNING]
> 如果因为手机丢失、时间错乱导致完全无法登录路由器 Web 页面，可以通过 SSH 执行以下命令紧急关闭 2FA：
> ```bash
> # 1. 将配置中的 enabled 设为 0
> uci set simple2fa.global.enabled='0'
> uci commit simple2fa
> # 2. 重启 simple2fa 服务（这会自动恢复系统原始的 luci CGI 程序和登录模板）
> /etc/init.d/simple2fa restart
> ```

---

### 2. FRP 穿透客户端 (luci-app-cymfrpc)

相比官方自带的版本，此客户端提供了更灵活的**多实例**支持与**纯文本配置文件**直接管理方式。

#### ⚙️ 配置与使用步骤：
1. **进入路径**：**服务 (Services)** -> **FRP 客户端**。
2. **添加新实例**：
   - 在“实例管理”中，点击“添加”按钮，新建一个配置实例（例如命名为 `nas_sync`）。
3. **编写配置**：
   - 勾选“启用”该实例。
   - 在“配置类型”中选择你所使用的 frps 服务端支持的格式（支持 `ini` / `toml` / `yaml` 格式）。
   - 在文本框中直接粘贴你的 frpc 配置内容，例如：
     ```ini
     [common]
     server_addr = x.x.x.x
     server_port = 7000
     token = your_frp_token

     [web_nas]
     type = tcp
     local_ip = 192.168.1.100
     local_port = 80
     remote_port = 8080
     ```
4. **保存并运行**：
   - 点击“保存并应用”。插件会自动在后台为该实例生成独立的管理进程并运行。
   - 你可以创建多个不同的实例分别连接到不同的 FRP 服务端，互不干扰。

---

### 3. FRP 穿透服务端 (luci-app-cymfrps)

如果你有公网 IP 的 OpenWrt 路由器（如 VPS 软路由），可以使用此插件快速搭建多端口、多配置的 FRP 服务端。

#### ⚙️ 配置与使用步骤：
1. **进入路径**：**服务 (Services)** -> **FRP 服务端**。
2. **添加实例**：
   - 新增一个实例，勾选“启用”。
   - 在配置框中输入你的服务器监听规则，例如：
     ```ini
     [common]
     bind_port = 7000
     vhost_http_port = 8080
     token = your_secure_token
     ```
3. **保存应用**：
   - 点击“保存并应用”后，服务端进程将常驻后台监听指定端口。

---

### 4. VPN 订阅生成器 (luci-app-vpnrss)

该插件用于将零散的单个 VPN 节点链接，聚合成一个长期有效的自定义订阅地址，并支持智能去重、多平台配置格式转换。

#### ⚙️ 配置与使用步骤：
1. **进入路径**：**服务 (Services)** -> **VPN RSS 订阅生成**。
2. **全局安全配置**：
   - 勾选“启用”。
   - 在“访问 Token”输入框中输入一个只有你自己知道的随机字符串（例如 `my_secure_sub_token_888`），以防止他人扫描你的订阅链接。
3. **添加节点**：
   - 点击“添加节点”按钮。
   - **别名 (Alias)**：节点名称前缀（如 `HK-BGP`）。
   - **节点链接 (Links)**：可以直接粘贴单条链接（如 `vmess://...`），也可以在一行内输入多条，或者每行一条进行批量导入。
   - **智能重命名特性**：如果你在节点链接里粘贴了 5 个不同的 vmess 链接，并且别名填的是 `HK`，保存后插件会自动将其处理为 `HK 1`、`HK 2`、`HK 3`... 以防客户端内节点名称冲突。
4. **生成与获取订阅链接**：
   - 保存并应用配置后，你的专属订阅地址格式如下：
     ```
     http://<你的路由器IP>/cgi-bin/luci/vpnrss/subscribe?token=<你的Token>&client=<输出格式>
     ```
   - **`client` 参数支持的输出格式**：
     - `clash` 或 `clash_meta`：直接输出符合 Clash 规范的 YAML 节点配置。
     - `singbox`：输出符合 Sing-box 规范的 JSON 节点配置。
     - `surge`：输出 Surge 代理行格式。
     - `base64`（默认）：输出经过 Base64 编码的通用订阅节点列表，兼容 Passwall、SSR+、V2rayN 等工具。

---

### 5. 在线设备与流量管理器 (luci-app-cymonline)

提供无侵入式的在线设备状态呈现，并能够对内网的各个终端实施强力的上行与下行带宽限制。

#### ⚙️ 配置与使用步骤：
1. **进入路径**：**状态 (Status)** -> **在线用户 (Online Users)**。
2. **监控在线设备**：
   - 页面会实时列出当前局域网内所有有活动流量的设备，展示其：
     - 实时上行网速、实时下行网速。
     - 累计上传流量、累计下载流量。
     - IP 地址、MAC 地址和主机名。
3. **管理设备（备注）**：
   - 对于不知名的设备名称，可以点击设备行右侧的“编辑”或“备注”，输入自定义名称（如“客厅电视”），方便后续识别。
4. **限速设置（QoS）**：
   - 点击指定设备行右侧的“限速”按钮。
   - 填写限制的 **最大上传速度** 和 **最大下载速度**（单位可选择 Mbps 或 Kbps）。
   - 保存后，插件会直接调用系统的 `tc` 流量控制器在网卡队列上实施精细限速，对该设备的所有流量生效。
5. **一键阻断网络**：
   - 对于需要禁止联网的设备，可直接点击“禁用”按钮，插件会利用 `nftables` 规则阻断其经过 WAN 口的转发流量。
