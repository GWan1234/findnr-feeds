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
	# 依赖关系：如果编译报错找不到包，请尝试把 oath-toolkit 改为 oathtool
	DEPENDS:=+oath-toolkit +qrencode +coreutils-base32
	PKGARCH:=all
endef

define Package/luci-app-simple2fa/description
	A minimal Two-Factor Authentication plugin intercepting ucode login.
endef

define Build/Compile
endef

define Package/luci-app-simple2fa/install
	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_DIR) $(1)/etc/uci-defaults
	$(INSTALL_DIR) $(1)/www/cgi-bin
	$(INSTALL_DIR) $(1)/www/luci-static/resources/view/bootstrap/js

	# 复制所有文件到安装目录
	$(CP) ./root/* $(1)/

	# 修正权限：这里原本写的是 cgi，必须改为 cgi-bin 才能找到文件
	$(INSTALL_BIN) ./root/www/cgi-bin/luci $(1)/www/cgi-bin/luci
endef

$(eval $(call BuildPackage,luci-app-simple2fa))
