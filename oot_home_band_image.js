// Phase 2: Home band image presentation registry (move-only extraction from index.html).
// Exposes legacy globals on window; no layout/CSS/registry behavior changes.

var HOME_IMAGE_PRESENTATION = {
  1: {
    normal: {
      img: { yPct: -61 },
      buttons: { gapPx: 7, sizePx: 33, iconPx: 16, xPx: 7, yPx: 3, scale: 1 }
    },
    rehearsal: {
      img: { widthPct: 110, xPx: 8, yPct: -61 },
      buttons: { gapPx: 7, sizePx: 34, iconPx: 17, xPx: 8, yPx: -2, scale: 1 }
    }
  },
  2: {
    normal: {
      img: { widthPct: 108, xPx: 4, yPct: -63.2 },
      buttons: { gapPx: 7, sizePx: 33, iconPx: 16, xPx: 8, yPx: 3, scale: 1 }
    },
    rehearsal: {
      img: { widthPct: 100, xPx: 0, yPct: -62.5 },
      buttons: { gapPx: 7, sizePx: 33, iconPx: 16, xPx: 8, yPx: 2, scale: 1 }
    }
  },
  3: {
    normal: {
      img: { yPct: -57.2 },
      buttons: { gapPx: 7, sizePx: 33, iconPx: 16, xPx: 8, yPx: 3, scale: 1 }
    },
    rehearsal: {
      img: { widthPct: 106, xPx: 8, yPct: -60 },
      buttons: { gapPx: 7, sizePx: 33, iconPx: 16, xPx: 8, yPx: 2, scale: 1 }
    }
  },
  4: {
    normal: {
      img: { yPct: -61 },
      buttons: { gapPx: 7, sizePx: 33, iconPx: 16, xPx: 8, yPx: 3, scale: 1 }
    },
    rehearsal: {
      img: { widthPct: 106, xPx: 2, yPct: -60 },
      buttons: { gapPx: 7, sizePx: 33, iconPx: 16, xPx: 8, yPx: 2, scale: 1 }
    }
  },
  5: {
    normal: {
      img: { yPct: -61 }
    },
    rehearsal: {
      img: { widthPct: 104, xPx: -8, yPct: -60 },
      buttons: { gapPx: 5, sizePx: 26, iconPx: 13, xPx: -2, yPx: -8, scale: 1 }
    }
  },
  6: {
    normal: {
      img: { yPct: -61 },
      buttons: { gapPx: 7, sizePx: 32, iconPx: 16, xPx: 10, yPx: 1, scale: 1 }
    },
    rehearsal: {
      buttons: { gapPx: 8, sizePx: 30, iconPx: 15, xPx: 6, yPx: 1, scale: .94 }
    }
  },
  7: {
    normal: {
      img: { widthPct: 110, xPx: 6, yPct: -59.2 },
      buttons: { gapPx: 7, sizePx: 33, iconPx: 16, xPx: 8, yPx: 3, scale: 1 }
    },
    rehearsal: {
      img: { widthPct: 106, xPx: 6, yPct: -60 },
      buttons: { gapPx: 7, sizePx: 30, iconPx: 15, xPx: 8, yPx: -2, scale: 1 }
    }
  },
  8: {
    normal: {
      img: { widthPct: 110, xPx: 6, yPct: -59.2 },
      buttons: { gapPx: 7, sizePx: 33, iconPx: 16, xPx: 8, yPx: 3, scale: 1 }
    },
    rehearsal: {
      img: { widthPct: 106, xPx: 6, yPct: -60 },
      buttons: { gapPx: 7, sizePx: 30, iconPx: 15, xPx: 8, yPx: -2, scale: 1 }
    }
  },
  9: {
    normal: {
      img: { widthPct: 110, xPx: 6, yPct: -59.2 },
      buttons: { gapPx: 7, sizePx: 33, iconPx: 16, xPx: 8, yPx: 3, scale: 1 }
    },
    rehearsal: {
      img: { widthPct: 106, xPx: 6, yPct: -60 },
      buttons: { gapPx: 7, sizePx: 30, iconPx: 15, xPx: 8, yPx: -2, scale: 1 }
    }
  },
  10: {
    normal: {
      img: { widthPct: 110, xPx: -4, yPct: -59.2 },
      buttons: { gapPx: 7, sizePx: 33, iconPx: 16, xPx: 8, yPx: 3, scale: 1 }
    },
    rehearsal: {
      img: { widthPct: 106, xPx: -4, yPct: -60 },
      buttons: { gapPx: 7, sizePx: 30, iconPx: 15, xPx: 8, yPx: -2, scale: 1 }
    }
  },
  11: {
    normal: {
      img: { widthPct: 110, xPx: -4, yPct: -58 },
      buttons: { gapPx: 7, sizePx: 33, iconPx: 16, xPx: 8, yPx: 3, scale: 1 }
    },
    rehearsal: {
      img: { widthPct: 106, xPx: -4, yPct: -60 },
      buttons: { gapPx: 7, sizePx: 30, iconPx: 15, xPx: 8, yPx: -2, scale: 1 }
    }
  },
  12: {
    normal: {
      img: { widthPct: 110, xPx: -4, yPct: -58 },
      buttons: { gapPx: 7, sizePx: 33, iconPx: 16, xPx: 8, yPx: 3, scale: 1 }
    },
    rehearsal: {
      img: { widthPct: 106, xPx: -4, yPct: -60 },
      buttons: { gapPx: 7, sizePx: 30, iconPx: 15, xPx: 8, yPx: -2, scale: 1 }
    }
  },
  13: {
    normal: {
      img: { widthPct: 110, xPx: -4, yPct: -59.2 },
      buttons: { gapPx: 7, sizePx: 33, iconPx: 16, xPx: 8, yPx: 3, scale: 1 }
    },
    rehearsal: {
      img: { widthPct: 106, xPx: -4, yPct: -60 },
      buttons: { gapPx: 7, sizePx: 30, iconPx: 15, xPx: 8, yPx: -2, scale: 1 }
    }
  },
  14: {
    normal: {
      img: { widthPct: 110, xPx: -4, yPct: -59.2 },
      buttons: { gapPx: 7, sizePx: 33, iconPx: 16, xPx: 8, yPx: 3, scale: 1 }
    },
    rehearsal: {
      img: { widthPct: 106, xPx: -4, yPct: -60 },
      buttons: { gapPx: 7, sizePx: 30, iconPx: 15, xPx: 8, yPx: -2, scale: 1 }
    }
  },
  15: {
    normal: {
      img: { widthPct: 110, xPx: -4, yPct: -59.2 },
      buttons: { gapPx: 7, sizePx: 33, iconPx: 16, xPx: 8, yPx: 3, scale: 1 }
    },
    rehearsal: {
      img: { widthPct: 106, xPx: -4, yPct: -60 },
      buttons: { gapPx: 7, sizePx: 30, iconPx: 15, xPx: 8, yPx: -2, scale: 1 }
    }
  },
  16: {
    normal: {
      img: { widthPct: 110, xPx: -4, yPct: -59.2 },
      buttons: { gapPx: 7, sizePx: 33, iconPx: 16, xPx: 8, yPx: 3, scale: 1 }
    },
    rehearsal: {
      img: { widthPct: 106, xPx: -4, yPct: -60 },
      buttons: { gapPx: 7, sizePx: 30, iconPx: 15, xPx: 8, yPx: -2, scale: 1 }
    }
  },
  17: {
    normal: {
      img: { widthPct: 110, xPx: -4, yPct: -62.2 },
      buttons: { gapPx: 7, sizePx: 33, iconPx: 16, xPx: 8, yPx: 3, scale: 1 }
    },
    rehearsal: {
      img: { widthPct: 106, xPx: -4, yPct: -60 },
      buttons: { gapPx: 7, sizePx: 30, iconPx: 15, xPx: 8, yPx: -2, scale: 1 }
    }
  },
  18: {
    normal: {
      img: { widthPct: 110, xPx: -4, yPct: -59.2 },
      buttons: { gapPx: 7, sizePx: 33, iconPx: 16, xPx: 8, yPx: 3, scale: 1 }
    },
    rehearsal: {
      img: { widthPct: 106, xPx: -4, yPct: -60 },
      buttons: { gapPx: 7, sizePx: 30, iconPx: 15, xPx: 8, yPx: -2, scale: 1 }
    }
  },
  19: {
    normal: {
      img: { widthPct: 110, xPx: -4, yPct: -58 },
      buttons: { gapPx: 7, sizePx: 33, iconPx: 16, xPx: 8, yPx: 3, scale: 1 }
    },
    rehearsal: {
      img: { widthPct: 106, xPx: -4, yPct: -60 },
      buttons: { gapPx: 7, sizePx: 30, iconPx: 15, xPx: 8, yPx: -2, scale: 1 }
    }
  }

};
// r622: safe post-registry assignment for Image 20, avoiding literal-object surgery.
HOME_IMAGE_PRESENTATION[20] = {
  normal: {
    img: { widthPct: 110, xPx: -4, yPct: -58 },
    buttons: { gapPx: 7, sizePx: 33, iconPx: 16, xPx: 8, yPx: 3, scale: 1 }
  },
  rehearsal: {
    img: { widthPct: 106, xPx: -4, yPct: -60 },
    buttons: { gapPx: 7, sizePx: 30, iconPx: 15, xPx: 8, yPx: -2, scale: 1 }
  }
};
function _homeMergePresentation(base, override){
  base = base || {};
  override = override || {};
  return {
    img: Object.assign({}, base.img || {}, override.img || {}),
    buttons: Object.assign({}, base.buttons || {}, override.buttons || {})
  };
}
function _homeRehearsalCueVisible(){
  try {
    var cue = document.getElementById('home-rehearsal-cue');
    if(!cue) return false;
    var ds = (cue.style && cue.style.display) ? String(cue.style.display) : '';
    if(ds && ds !== 'none') return true;
    var cs = window.getComputedStyle ? window.getComputedStyle(cue) : null;
    return !!(cs && cs.display !== 'none' && cs.visibility !== 'hidden' && cue.offsetParent !== null);
  } catch(e){}
  return false;
}
function _homeImagePresentationMode(){
  // r798: alert pills overlay the lower logo area instead of consuming Home stack height.
  // Rehearsal visibility must not trigger the old compressed/downstream band-image mode.
  return 'normal';
}
function _getHomeImagePresentation(idx, mode){
  mode = mode || 'normal';
  var base = (HOME_IMAGE_PRESENTATION_DEFAULTS && HOME_IMAGE_PRESENTATION_DEFAULTS[mode]) || HOME_IMAGE_PRESENTATION_DEFAULTS.normal || {};
  var byImage = (HOME_IMAGE_PRESENTATION && HOME_IMAGE_PRESENTATION[idx] && HOME_IMAGE_PRESENTATION[idx][mode]) || {};
  return _homeMergePresentation(base, byImage);
}
function _setHomeCssVar(row, name, value){
  if(!row || value === undefined || value === null || value === '') return;
  try { row.style.setProperty(name, String(value)); } catch(e){}
}
function _applyHomeImagePresentation(row, idx){
  if(!row) return;
  var mode = _homeImagePresentationMode();
  var p = _getHomeImagePresentation(idx, mode);
  row.setAttribute('data-home-image-index', String(idx || 1));
  row.setAttribute('data-home-image-mode', mode);

  var imgWidth = (p.img.widthPct || 114) + '%';
  var imgX = (p.img.xPx || 0) + 'px';
  // r775: Registry-only global bottom-anchor correction.
  // The Home Image Presentation Registry is the source of truth for image placement.
  // Move all Home images safely downward through the renderer so excess bottom blue
  // strip is reduced and feet sit closer to the bottom, without touching layout CSS
  // or social-button values. Caps preserve the r764 accepted footline target.
  var imgYNum = (p.img.yPct === 0 ? 0 : (p.img.yPct || -55));
  imgYNum = parseFloat(imgYNum);
  if(!isFinite(imgYNum)) imgYNum = -55;
  // r794: after the Home top/logo compression work, the Home band image sits
  // a touch too low in its frame. Use the central registry renderer, not scattered
  // CSS, to lift the rendered band image slightly while preserving each image's
  // registry width/x framing and the Home frame/gaps.
  imgYNum += 3;
  // r776: default thin-gap calibration. r775's cap held some images too high,
  // recreating a large blue bottom strip. Allow the registry renderer to settle
  // one step lower while still capping at the previously safe no-clip band.
  var maxDownY = (mode === 'rehearsal') ? -53 : -51;
  if(imgYNum > maxDownY) imgYNum = maxDownY;
  var imgYPxNum = (p.img.yPx === 0 ? 0 : (p.img.yPx || 0));
  imgYPxNum = parseFloat(imgYPxNum);
  if(!isFinite(imgYPxNum)) imgYPxNum = 0;
  var imgY = imgYNum + '%';
  var imgYPx = imgYPxNum + 'px';
  var btnGap = ((p.buttons.gapPx === 0 ? 0 : (p.buttons.gapPx || 8))) + 'px';
  var btnSize = (p.buttons.sizePx || 38) + 'px';
  var btnIcon = (p.buttons.iconPx || 20) + 'px';
  var btnX = ((p.buttons.xPx === 0 ? 0 : (p.buttons.xPx || 0))) + 'px';
  var btnYNum = (p.buttons.yPx === 0 ? 0 : (p.buttons.yPx || 0));
  // r761: keep this in the registry renderer. CSS-only social-button lifts get
  // overwritten by this inline-important renderer. The restored tight Home bottom gap
  // requires a stronger global upward clamp so Facebook/Instagram stay fully visible
  // across all 20 Home images and both normal/rehearsal modes.
  // r794: the Home logo/card height changes restored enough lower-right room;
  // keep social buttons protected from clipping but let them sit lower again.
  var HOME_SOCIAL_BUTTON_MIN_UP_Y_PX = -18;
  if(btnYNum > HOME_SOCIAL_BUTTON_MIN_UP_Y_PX) btnYNum = HOME_SOCIAL_BUTTON_MIN_UP_Y_PX;
  var btnY = btnYNum + 'px';
  var btnScale = (p.buttons.scale === 0 ? 0 : (p.buttons.scale || 1));

  _setHomeCssVar(row, '--oot-home-img-width', imgWidth);
  _setHomeCssVar(row, '--oot-home-img-x', imgX);
  _setHomeCssVar(row, '--oot-home-img-y', imgY);
  _setHomeCssVar(row, '--oot-home-img-y-px', imgYPx);
  _setHomeCssVar(row, '--oot-home-button-gap', btnGap);
  _setHomeCssVar(row, '--oot-home-button-size', btnSize);
  _setHomeCssVar(row, '--oot-home-button-icon', btnIcon);
  _setHomeCssVar(row, '--oot-home-button-x', btnX);
  _setHomeCssVar(row, '--oot-home-button-y', btnY);
  _setHomeCssVar(row, '--oot-home-button-scale', btnScale);

  // r594: direct inline-important renderer. Older Home/Rehearsal CSS used higher-specificity
  // :has(...) selectors with !important, so CSS variables alone could be overridden. The
  // registry now applies the resolved values directly to the live nodes as !important.
  try {
    row.style.setProperty('gap', btnGap, 'important');
    var bg = row.querySelector('.home-band-backdrop');
    if(bg){
      bg.style.setProperty('position', 'absolute', 'important');
      bg.style.setProperty('left', '50%', 'important');
      bg.style.setProperty('top', '50%', 'important');
      bg.style.setProperty('right', 'auto', 'important');
      bg.style.setProperty('bottom', 'auto', 'important');
      bg.style.setProperty('width', imgWidth, 'important');
      bg.style.setProperty('height', 'auto', 'important');
      bg.style.setProperty('max-width', 'none', 'important');
      bg.style.setProperty('max-height', 'none', 'important');
      bg.style.setProperty('object-fit', 'contain', 'important');
      bg.style.setProperty('object-position', 'center center', 'important');
      bg.style.setProperty('transform', 'translate(calc(-50% + ' + imgX + '), calc(' + imgY + ' + ' + imgYPx + '))', 'important');
      bg.style.setProperty('transform-origin', 'center center', 'important');
      bg.style.setProperty('pointer-events', 'none', 'important');
      bg.style.setProperty('z-index', '1', 'important');
    }
    row.querySelectorAll('a').forEach(function(a){
      a.style.setProperty('width', btnSize, 'important');
      a.style.setProperty('height', btnSize, 'important');
      a.style.setProperty('transform', 'translate(' + btnX + ', ' + btnY + ') scale(' + btnScale + ')', 'important');
      a.style.setProperty('transform-origin', 'center center', 'important');
      a.style.setProperty('position', 'relative', 'important');
      a.style.setProperty('z-index', '3', 'important');
      var svg = a.querySelector('svg');
      if(svg){
        svg.style.setProperty('width', btnIcon, 'important');
        svg.style.setProperty('height', btnIcon, 'important');
      }
    });
  } catch(e){}

  _renderHomeImageQaBadge(row, idx, mode, p);
  try { _homeLayoutDiagSnapshot('applyHomeImagePresentation:after', { idx: idx, mode: mode }); } catch(e){}
}
function _refreshHomeImagePresentation(){
  try {
    var row = document.getElementById('home-social-row');
    if(!row || typeof _applyHomeImagePresentation !== 'function') return;
    var idx = (typeof _resolveHomeBandImageIndex === 'function') ? _resolveHomeBandImageIndex() : parseInt(row.getAttribute('data-home-image-index') || '1', 10);
    if(!idx || isNaN(idx)) idx = 1;
    _applyHomeImagePresentation(row, idx);
    try { _homeLayoutDiagSnapshot('refreshHomeImagePresentation:complete', {}); } catch(e){}
  } catch(e){}
}
function _scheduleHomeImagePresentationRefresh(reason){
  try {
    if(window.__ootHomePresentationRefreshTimer) clearTimeout(window.__ootHomePresentationRefreshTimer);
    window.__ootHomePresentationRefreshReason = reason || '';
    window.__ootHomePresentationRefreshTimer = setTimeout(function(){
      try { _refreshHomeImagePresentation(); } catch(e){}
    }, 0);
    setTimeout(function(){ try { _refreshHomeImagePresentation(); } catch(e){} }, 80);
  } catch(e){
    try { _refreshHomeImagePresentation(); } catch(_e){}
  }
  try { _homeLayoutDiagSnapshot('scheduleHomeImagePresentationRefresh', { reason: reason || '' }); } catch(e){}
}
function _ensureHomePresentationObserver(){
  try {
    if(window.__ootHomePresentationObserverBound) return;
    var cue = document.getElementById('home-rehearsal-cue');
    if(!cue) return;
    window.__ootHomePresentationObserverBound = true;
    var obs = new MutationObserver(function(){
      _scheduleHomeImagePresentationRefresh('home-rehearsal-cue mutation');
    });
    obs.observe(cue, { attributes:true, attributeFilter:['style','class','hidden'], childList:true, subtree:false, characterData:false });
    window.__ootHomePresentationObserver = obs;
  } catch(e){}
}
window.HOME_IMAGE_PRESENTATION = HOME_IMAGE_PRESENTATION;
window._applyHomeImagePresentation = _applyHomeImagePresentation;
window._refreshHomeImagePresentation = _refreshHomeImagePresentation;
window._scheduleHomeImagePresentationRefresh = _scheduleHomeImagePresentationRefresh;
window._ensureHomePresentationObserver = _ensureHomePresentationObserver;