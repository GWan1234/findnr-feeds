include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-simple2fa
PKG_VERSION:=1.0.0
PKG_RELEASE:=1
PKG_MAINTAINER:=findnr

include $(INCLUDE_DIR)/package.mk

define Package/luci-app-simple2fa
	SECTION:=luci
	CATEGORY:=LuCI
	SUBMENU:=3. Applications
	TITLE:=Simple 2FA (TOTP) for Login
	# 修正依赖名：已移除 coreutils-base32，改用 Lua 生成密钥
	DEPENDS:=+oath-toolkit +qrencode
	PKGARCH:=all
endef

define Package/luci-app-simple2fa/description
	A minimal Two-Factor Authentication plugin intercepting ucode login.
endef

define Build/Compile
endef

# ==========================================================
# ⚠️ 注意：下面的每一行命令开头必须是 TAB 键，不能是空格！
# ==========================================================
define Package/luci-app-simple2fa/install
	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_DIR) $(1)/etc/uci-defaults
	$(INSTALL_DIR) $(1)/usr/lib/lua/luci/controller
	$(INSTALL_DIR) $(1)/usr/lib/lua/luci/model/cbi/simple2fa
	$(INSTALL_DIR) $(1)/usr/lib/lua/luci/view/simple2fa
	# 创建 staging 目录
	$(INSTALL_DIR) $(1)/usr/share/luci-app-simple2fa

	# 复制配置文件和 Lua 脚本
	$(CP) ./root/etc $(1)/
	$(CP) ./root/usr/lib $(1)/usr/

	# 复制用于替换的源文件到 staging 目录
	$(INSTALL_BIN) ./root/usr/share/luci-app-simple2fa/luci $(1)/usr/share/luci-app-simple2fa/luci
	$(INSTALL_DATA) ./root/usr/share/luci-app-simple2fa/sysauth.js $(1)/usr/share/luci-app-simple2fa/sysauth.js
endef

define Package/luci-app-simple2fa/prerm
#!/bin/sh
# 卸载前恢复原文件
if [ -f "/www/cgi-bin/luci.bak" ]; then
	mv -f /www/cgi-bin/luci.bak /www/cgi-bin/luci
fi
if [ -f "/www/luci-static/resources/view/bootstrap/sysauth.js.bak" ]; then
	mv -f /www/luci-static/resources/view/bootstrap/sysauth.js.bak /www/luci-static/resources/view/bootstrap/sysauth.js
fi
exit 0
endef

$(eval $(call BuildPackage,luci-app-simple2fa))
