'use strict';
'require ui';
'require view';

return view.extend({
    render: function() {
        var form = document.querySelector('form');
        var btn = document.querySelector('button');

        // 1. 获取原来的输入框元素 (用户名、密码、按钮等)
        var inputFields = [].slice.call(document.querySelectorAll('section > *'));

        // 2. 创建你的 2FA 输入框
        var tokenDiv = document.createElement('div');
        tokenDiv.className = 'cbi-value';
        tokenDiv.innerHTML = [
            '<label class="cbi-value-title">验证码</label>',
            '<div class="cbi-value-field">',
            '  <input class="cbi-input-text" type="text" name="token" placeholder="验证码 (未开启留空)" autocomplete="off" />',
            '</div>'
        ].join('');

        // 3. 插入位置调整：尝试插到最后一个元素(通常是按钮)的前面
        if (inputFields.length > 0) {
            inputFields.splice(inputFields.length - 1, 0, tokenDiv);
        } else {
            inputFields.push(tokenDiv);
        }

        // 4. 显示弹窗
        var dlg = ui.showModal(
            _('Authorization Required'),
            inputFields,
            'login'
        );

        // 回车键支持
        form.addEventListener('keypress', function(ev) {
            if (ev.key == 'Enter')
                btn.click();
        });

        // === 关键修复：点击登录按钮时的处理 ===
        btn.addEventListener('click', function() {
            // A. 获取用户输入的验证码
            var tokenInput = tokenDiv.querySelector('input');
            var tokenValue = tokenInput ? tokenInput.value : '';

            // B. 创建一个隐藏的 input，把它塞进真正的 form 里
            // 这样 form.submit() 时才会带上这个数据
            var hiddenInput = document.createElement('input');
            hiddenInput.type = 'hidden';
            hiddenInput.name = 'token'; // 这个名字必须和 Lua 里 http.formvalue("token") 一致
            hiddenInput.value = tokenValue;
            form.appendChild(hiddenInput);

            // C. 界面显示 "Logging in..."
            dlg.querySelectorAll('*').forEach(function(node) { node.style.display = 'none' });
            dlg.appendChild(E('div', { 'class': 'spinning' }, _('Logging in...')));
            
            // D. 提交表单
            form.submit();
        });

        // 自动聚焦密码框
        var passInput = document.querySelector('input[type="password"]');
        if(passInput) passInput.focus();

        return '';
    },

    addFooter: function() {}
});