// r944: Shared UI prompt/confirm/toast helpers extracted from index.html.
// Preserves legacy global functions: appConfirm, toast, appPrompt.
// Do not add opM/clM here; clM contains feature-specific close behavior.
(function(window, document){
  'use strict';


// ── CUSTOM CONFIRM DIALOG + TOAST ─────────────────────────────────────────
function appConfirm(opts){
  opts = opts || {};
  return new Promise(function(resolve){
    var ov = document.getElementById('app-confirm');
    var card = document.getElementById('app-confirm-card');
    var titleEl = document.getElementById('app-confirm-title');
    var msgEl = document.getElementById('app-confirm-message');
    var okBtn = document.getElementById('app-confirm-ok');
    var cancelBtn = document.getElementById('app-confirm-cancel');
    var iconWrap = document.getElementById('app-confirm-icon');
    if(!ov || !okBtn || !cancelBtn) { resolve(window.confirm(opts.message || 'Are you sure?')); return; }

    var isDestructive = opts.destructive !== false; // default true
    titleEl.textContent = opts.title || 'Confirm';
    if(opts.allowHtml){ msgEl.innerHTML = opts.message || 'Are you sure?'; } else { msgEl.textContent = opts.message || 'Are you sure?'; };
    okBtn.textContent = opts.okLabel || (isDestructive ? 'DELETE' : 'CONFIRM');
    cancelBtn.textContent = opts.cancelLabel || 'CANCEL';
    if(isDestructive){
      okBtn.style.background = '#ff4757';
      okBtn.style.borderColor = '#ff4757';
      okBtn.style.color = '#fff';
      cancelBtn.style.background = 'transparent';
      cancelBtn.style.borderColor = '#1a3a8a';
      cancelBtn.style.color = '#8aa8d6';
      cancelBtn.style.boxShadow = 'none';
      iconWrap.style.background = 'rgba(255,71,87,.12)';
      iconWrap.firstElementChild && iconWrap.firstElementChild.querySelector('path') && iconWrap.firstElementChild.querySelector('path').setAttribute('fill', '#ff4757');
    } else {
      okBtn.style.background = '#4a9eff';
      okBtn.style.borderColor = '#4a9eff';
      okBtn.style.color = '#060e1c';
      cancelBtn.style.background = 'transparent';
      cancelBtn.style.borderColor = '#1a3a8a';
      cancelBtn.style.color = '#8aa8d6';
      cancelBtn.style.boxShadow = 'none';
      iconWrap.style.background = 'rgba(74,158,255,.12)';
      iconWrap.firstElementChild && iconWrap.firstElementChild.querySelector('path') && iconWrap.firstElementChild.querySelector('path').setAttribute('fill', '#4a9eff');
    }
    // r173: allow safety-first confirmations where Cancel is the visually primary/default action.
    if(opts.preferCancel){
      cancelBtn.style.background = '#ff4757';
      cancelBtn.style.borderColor = '#ff4757';
      cancelBtn.style.color = '#fff';
      cancelBtn.style.boxShadow = '0 6px 18px rgba(255,71,87,.4)';
      okBtn.style.background = 'transparent';
      okBtn.style.borderColor = '#1a3a8a';
      okBtn.style.color = '#8aa8d6';
      okBtn.style.boxShadow = 'none';
    }

    function close(result){
      card.style.opacity = '0';
      card.style.transform = 'scale(.95)';
      setTimeout(function(){
        ov.style.display = 'none';
        okBtn.onclick = null;
        cancelBtn.onclick = null;
        ov.onclick = null;
        document.removeEventListener('keydown', keyHandler);
        resolve(result);
      }, 180);
    }
    function keyHandler(e){
      if(e.key === 'Escape') close(false);
      else if(e.key === 'Enter') close(opts.preferCancel ? false : true);
    }

    okBtn.onclick = function(){ close(true); };
    cancelBtn.onclick = function(){ close(false); };
    ov.onclick = function(e){ if(e.target === ov) close(false); };
    document.addEventListener('keydown', keyHandler);

    ov.style.display = 'flex';
    // next frame: animate in
    requestAnimationFrame(function(){
      requestAnimationFrame(function(){
        card.style.opacity = '1';
        card.style.transform = 'scale(1)';
      });
    });
  });
}

var _toastTimer = null;
function toast(message, opts){
  opts = opts || {};
  var el = document.getElementById('app-toast');
  if(!el) return;
  el.textContent = message;
  // Tone variants
  var tone = opts.tone || 'info'; // info | success | error
  if(tone === 'success'){
    el.style.borderColor = '#06d6a0';
    el.style.color = '#06d6a0';
  } else if(tone === 'error'){
    el.style.borderColor = '#ff4757';
    el.style.color = '#ff4757';
  } else {
    el.style.borderColor = '#1a3a8a';
    el.style.color = '#e8f0ff';
  }
  el.style.display = 'block';
  requestAnimationFrame(function(){
    el.style.opacity = '1';
    el.style.transform = 'translateX(-50%) translateY(0)';
  });
  if(_toastTimer) clearTimeout(_toastTimer);
  _toastTimer = setTimeout(function(){
    el.style.opacity = '0';
    el.style.transform = 'translateX(-50%) translateY(80px)';
    setTimeout(function(){ el.style.display = 'none'; }, 280);
  }, opts.duration || 2500);
}

function appPrompt(opts){
  opts = opts || {};
  return new Promise(function(resolve){
    var ov = document.getElementById('app-prompt');
    var card = document.getElementById('app-prompt-card');
    var titleEl = document.getElementById('app-prompt-title');
    var msgEl = document.getElementById('app-prompt-message');
    var inputEl = document.getElementById('app-prompt-input');
    var okBtn = document.getElementById('app-prompt-ok');
    var cancelBtn = document.getElementById('app-prompt-cancel');
    if(!ov || !okBtn || !cancelBtn || !inputEl){ resolve(window.prompt(opts.message||'', opts.defaultValue||'')); return; }

    titleEl.textContent = opts.title || 'Edit';
    if(opts.message){ msgEl.textContent = opts.message; msgEl.style.display = ''; }
    else { msgEl.textContent = ''; msgEl.style.display = 'none'; }
    inputEl.value = opts.defaultValue || '';
    inputEl.placeholder = opts.placeholder || '';
    okBtn.textContent = opts.okLabel || 'SAVE';
    cancelBtn.textContent = opts.cancelLabel || 'CANCEL';

    function close(result){
      card.style.opacity = '0';
      card.style.transform = 'scale(.95)';
      setTimeout(function(){
        ov.style.display = 'none';
        okBtn.onclick = null;
        cancelBtn.onclick = null;
        ov.onclick = null;
        inputEl.onkeydown = null;
        document.removeEventListener('keydown', keyHandler);
        resolve(result);
      }, 180);
    }
    function submit(){
      var val = inputEl.value;
      if(opts.required && !val.trim()){
        inputEl.style.borderColor = '#ff4757';
        setTimeout(function(){ inputEl.style.borderColor = ''; }, 1200);
        return;
      }
      close(val);
    }
    function keyHandler(e){
      if(e.key === 'Escape') close(null);
    }
    inputEl.onkeydown = function(e){
      if(e.key === 'Enter'){ e.preventDefault(); submit(); }
    };

    okBtn.onclick = submit;
    cancelBtn.onclick = function(){ close(null); };
    ov.onclick = function(e){ if(e.target === ov) close(null); };
    document.addEventListener('keydown', keyHandler);

    ov.style.display = 'flex';
    requestAnimationFrame(function(){
      requestAnimationFrame(function(){
        card.style.opacity = '1';
        card.style.transform = 'scale(1)';
        // Focus + select after the animation kicks off
        try {
          inputEl.focus();
          inputEl.select();
        } catch(e){}
      });
    });
  });
}

  window.appConfirm = window.appConfirm || appConfirm;
  window.toast = window.toast || toast;
  window.appPrompt = window.appPrompt || appPrompt;
})(window, document);
