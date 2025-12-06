local uci = require "luci.model.uci".cursor()
local sys = require "luci.sys"

local m = Map("simple2fa", translate("Two-Factor Authentication"), translate("Enable 2FA to secure your router login."))

-- === 1. 自动初始化密钥 ===
-- 如果配置文件里没有密钥，我们先帮用户生成一个
local secret = uci:get("simple2fa", "global", "secret")
if not secret or #secret < 16 then
    -- 生成 16位 Base32 随机密钥
    secret = sys.exec("head -c 20 /dev/urandom | base32 | head -c 16 | tr -d '\n'")
    uci:set("simple2fa", "global", "secret", secret)
    uci:commit("simple2fa")
end

local s = m:section(NamedSection, "global", "settings", translate("Settings"))

-- === 2. 功能开关 ===
s:option(Flag, "enabled", translate("Enable 2FA"))

-- === 3. 显示密钥 (只读) ===
local o = s:option(Value, "secret", translate("Secret Key"))
o.description = translate("Manually enter this key if you cannot scan the code.")
o.readonly = true  -- 只读，防止用户乱改改错了

-- === 4. 生成二维码 (核心魔法) ===
-- 构造标准 OTP URL
-- 格式: otpauth://totp/标签?secret=密钥&issuer=发行人
local hostname = sys.hostname() or "OpenWrt"
local otp_url = string.format("otpauth://totp/%s:root?secret=%s&issuer=%s", hostname, secret, hostname)

-- 使用 DummyValue 配合 Template 来显示二维码
local qr = s:option(DummyValue, "_qrcode", translate("Scan QR Code"))
qr.description = translate("Use Google Authenticator, Authy, or Microsoft Auth to scan this.")

-- 定义一个简单的 HTML 模板来显示 SVG
qr.template = "simple2fa/qrcode_view" 
-- 将 URL 传给模板 (LuCI 模板中可以通过 self.otp_url 获取)
qr.otp_url = otp_url 

return m