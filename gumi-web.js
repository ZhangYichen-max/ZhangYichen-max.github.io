/** GUMI Blog 网页版共享：登录态 + 校验 + 登录弹窗（零依赖） */
(function(){
  var API = 'https://api.github.com/repos/ZhangYichen-max/ZhangYichen-max.github.io/contents/';

  function b64decode(s){
    return new TextDecoder().decode(Uint8Array.from(atob(s.replace(/\s/g,'')), function(c){ return c.charCodeAt(0); }));
  }

  var G = window.GumiWeb = {
    user: function(){ return localStorage.getItem('gumi_user') || ''; },
    login: function(u){ localStorage.setItem('gumi_user', u); },
    logout: function(){ localStorage.removeItem('gumi_user'); },

    /* usrinfo.txt 校验（GitHub API，避开协议问题） */
    verify: function(u, p){
      return fetch(API + 'usrinfo.txt')
        .then(function(r){ if(!r.ok) throw new Error('net'); return r.json(); })
        .then(function(f){
          var txt = b64decode(f.content);
          var lines = txt.split('\n');
          for (var i=0;i<lines.length;i++){
            var line = lines[i].trim();
            if (!line) continue;
            var sp = line.indexOf(' ');
            if (sp < 1) continue;
            var name = line.slice(0, sp), pass = line.slice(sp+1).trim();
            var banned = false;
            if (name.charAt(0) === '!'){ banned = true; name = name.slice(1); }
            name = name.replace(/#/g, '');
            if (name === u && pass === p) return {ok:true, banned:banned};
          }
          return {ok:false};
        });
    },

    /* 帖子可见性：me 可看返回 true */
    canSee: function(post, me){
      if (Array.isArray(post.visibleTo)){
        if (!me) return false;
        if (me === post.author || me === 'Admin') return true;
        return post.visibleTo.indexOf(me) >= 0;
      }
      if (post.webVisible === false) return !!me;
      return true;
    },

    /* 登录弹窗 */
    openLogin: function(onOk){
      if (document.getElementById('gw-mask')) return;
      var mask = document.createElement('div');
      mask.id = 'gw-mask';
      mask.style.cssText = 'position:fixed;inset:0;background:rgba(6,95,70,.35);z-index:999;display:flex;align-items:center;justify-content:center';
      var card = document.createElement('div');
      card.style.cssText = 'background:#fff;border-radius:16px;padding:26px 28px;width:min(340px,90vw);box-shadow:0 16px 48px rgba(6,95,70,.25);font-family:inherit';
      card.innerHTML =
        '<h3 style="margin:0 0 4px;color:#065f46;font-size:1.1rem">登录 GUMI Blog</h3>' +
        '<p style="margin:0 0 14px;color:#6b7280;font-size:.85rem">使用 Blog 账号（App 同款）</p>' +
        '<input id="gw-u" placeholder="用户名（纯英文字母）" autocomplete="off" style="width:100%;box-sizing:border-box;padding:10px 14px;border:1px solid #a7f3d0;border-radius:10px;margin-bottom:10px;font-size:.95rem;outline:none">' +
        '<input id="gw-p" type="password" placeholder="密码" style="width:100%;box-sizing:border-box;padding:10px 14px;border:1px solid #a7f3d0;border-radius:10px;margin-bottom:12px;font-size:.95rem;outline:none">' +
        '<div id="gw-status" style="min-height:20px;font-size:.82rem;color:#dc2626;margin-bottom:8px"></div>' +
        '<div style="display:flex;gap:10px">' +
        '<button id="gw-cancel" style="flex:1;padding:10px;border-radius:10px;border:1px solid #e2e8f0;background:#f6faf8;color:#4b5563;cursor:pointer">取消</button>' +
        '<button id="gw-ok" style="flex:1;padding:10px;border-radius:10px;border:none;background:#10b981;color:#fff;font-weight:600;cursor:pointer">登录</button>' +
        '</div>';
      mask.appendChild(card);
      document.body.appendChild(mask);
      var st = card.querySelector('#gw-status');
      function close(){ mask.remove(); }
      card.querySelector('#gw-cancel').onclick = close;
      mask.addEventListener('click', function(e){ if (e.target === mask) close(); });
      function go(){
        var u = card.querySelector('#gw-u').value.trim();
        var p = card.querySelector('#gw-p').value;
        if (!u || !p){ st.textContent = '请输入用户名和密码'; return; }
        if (!/^[a-zA-Z]+$/.test(u)){ st.textContent = '用户名只能包含纯英文字母'; return; }
        st.style.color = '#6b7280';
        st.textContent = '验证中…';
        G.verify(u, p).then(function(res){
          if (!res.ok){ st.style.color = '#dc2626'; st.textContent = '用户名或密码错误'; return; }
          G.login(u);
          close();
          if (onOk) onOk(u, res.banned);
        }).catch(function(){ st.style.color = '#dc2626'; st.textContent = '网络错误，请稍后再试'; });
      }
      card.querySelector('#gw-ok').onclick = go;
      card.querySelector('#gw-p').addEventListener('keydown', function(e){ if (e.key === 'Enter') go(); });
      card.querySelector('#gw-u').focus();
    },

    /* 导航登录区渲染（容器 id=gw-nav-login） */
    renderNav: function(onChange){
      var box = document.getElementById('gw-nav-login');
      if (!box) return;
      var me = G.user();
      if (me){
        box.innerHTML = '<span style="color:#065f46;font-weight:600">🌿 ' + me + '</span>' +
          '<a href="javascript:void 0" id="gw-logout" style="color:#6b7280;font-size:.85rem">退出</a>';
        box.querySelector('#gw-logout').onclick = function(){
          G.logout();
          if (onChange) onChange();
        };
      } else {
        box.innerHTML = '<a href="javascript:void 0" id="gw-login-btn" style="background:#10b981;color:#fff;padding:6px 16px;border-radius:999px;font-weight:600">登录</a>';
        box.querySelector('#gw-login-btn').onclick = function(){
          G.openLogin(function(){ if (onChange) onChange(); });
        };
      }
    }
  };
})();
