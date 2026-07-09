/**
 * Out of Time flyer template adapter (F7 — r951).
 * Loaded after js/flyer-template-manifest.js and before inline flyer generator.
 * Preserves legacy _flyer* global names for render/save/UI compatibility.
 */
function _flyerTemplateRecordForKey(key){
  try {
    if(!key || !FLYER_TEMPLATES || !FLYER_TEMPLATES[key]) return null;
    var format = String(key).endsWith('-story') ? 'story' : 'square';
    return {
      id: key,
      key: key,
      familyId: String(key).replace(/-(square|story)$/, ''),
      name: (typeof FLYER_NAMES !== 'undefined' && FLYER_NAMES[key]) ? FLYER_NAMES[key] : key,
      format: format,
      width: FLYER_DIMS && FLYER_DIMS[format] ? FLYER_DIMS[format].w : 1080,
      height: FLYER_DIMS && FLYER_DIMS[format] ? FLYER_DIMS[format].h : (format === 'story' ? 1920 : 1080),
      backgroundSrc: String(FLYER_TEMPLATES[key]),
      active: true,
      layers: { logo: { enabled: false, src: '', x_frac: 0.5, y_frac: 0.10, w_frac: 0.24 } },
      textZones: (typeof FLYER_ZONES !== 'undefined' && FLYER_ZONES[key]) ? FLYER_ZONES[key] : null,
      assetVersion: (typeof FLYER_FORCE_REFRESH_TEMPLATES !== 'undefined' && FLYER_FORCE_REFRESH_TEMPLATES[key]) ? FLYER_FORCE_REFRESH_TEMPLATES[key] : String(FLYER_TEMPLATES[key])
    };
  } catch(e){ return null; }
}
function _flyerTemplateExists(key){
  return !!_flyerTemplateRecordForKey(key);
}
function _flyerTemplateKeysForFormat(fmt){
  try {
    return Object.keys(FLYER_TEMPLATES).filter(function(k){
      var rec = _flyerTemplateRecordForKey(k);
      return rec && rec.active !== false && rec.format === fmt;
    });
  } catch(e){ return []; }
}
function _flyerTemplateNameForKey(key){
  var rec = _flyerTemplateRecordForKey(key);
  return rec ? rec.name : 'Flyer';
}
function _flyerTemplateZonesForKey(key){
  var rec = _flyerTemplateRecordForKey(key);
  return rec ? rec.textZones : null;
}
function _flyerTemplateSrcForKey(key){
  var rec = _flyerTemplateRecordForKey(key);
  return rec ? rec.backgroundSrc : '';
}
function _flyerSavedRenderIsStale(det){
  if(!det || !det.flyerData || !det.flyerTemplateKey) return false;
  var currentSrc = _flyerTemplateSrcForKey(det.flyerTemplateKey);
  if(!currentSrc) return false;
  if(det.flyerTemplateSrc && String(det.flyerTemplateSrc) !== currentSrc) return true;
  if(!det.flyerTemplateSrc && FLYER_FORCE_REFRESH_TEMPLATES[det.flyerTemplateKey]) return true;
  if(FLYER_FORCE_REFRESH_TEMPLATES[det.flyerTemplateKey] && String(det.flyerTemplateAssetVersion || '') !== String(FLYER_FORCE_REFRESH_TEMPLATES[det.flyerTemplateKey])) return true;
  return false;
}
function _flyerPreviewSrcForDetails(det){
  if(!det) return '';
  if(_flyerSavedRenderIsStale(det)) return _flyerTemplateSrcForKey(det.flyerTemplateKey) || '';
  return det.flyerData || '';
}
function _flyerCurrentAssetVersion(key){
  var rec = _flyerTemplateRecordForKey(key);
  return rec ? rec.assetVersion : '';
}

window.OOT_FLYER_ADAPTER = {
  templateRecordForKey: _flyerTemplateRecordForKey,
  templateExists: _flyerTemplateExists,
  templateKeysForFormat: _flyerTemplateKeysForFormat,
  templateNameForKey: _flyerTemplateNameForKey,
  templateZonesForKey: _flyerTemplateZonesForKey,
  templateSrcForKey: _flyerTemplateSrcForKey,
  savedRenderIsStale: _flyerSavedRenderIsStale,
  previewSrcForDetails: _flyerPreviewSrcForDetails,
  currentAssetVersion: _flyerCurrentAssetVersion
};

window._flyerTemplateRecordForKey = window.OOT_FLYER_ADAPTER.templateRecordForKey;
window._flyerTemplateExists = window.OOT_FLYER_ADAPTER.templateExists;
window._flyerTemplateKeysForFormat = window.OOT_FLYER_ADAPTER.templateKeysForFormat;
window._flyerTemplateNameForKey = window.OOT_FLYER_ADAPTER.templateNameForKey;
window._flyerTemplateZonesForKey = window.OOT_FLYER_ADAPTER.templateZonesForKey;
window._flyerTemplateSrcForKey = window.OOT_FLYER_ADAPTER.templateSrcForKey;
window._flyerSavedRenderIsStale = window.OOT_FLYER_ADAPTER.savedRenderIsStale;
window._flyerPreviewSrcForDetails = window.OOT_FLYER_ADAPTER.previewSrcForDetails;
window._flyerCurrentAssetVersion = window.OOT_FLYER_ADAPTER.currentAssetVersion;
