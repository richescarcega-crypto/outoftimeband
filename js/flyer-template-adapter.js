/**
 * Out of Time flyer template adapter (r968).
 * Prefers canonical OOT_FLYER_TEMPLATE_RECORDS / OOT_FLYER_MANIFEST.records.
 * Falls back to legacy FLYER_* maps when the canonical pack is unavailable.
 * Loaded after js/flyer-template-manifest.js and before inline flyer generator.
 */
function _flyerDefaultLogoLayer(){
  return { enabled: false, src: '', x_frac: 0.5, y_frac: 0.10, w_frac: 0.24 };
}

function _flyerCanonicalRecords(){
  try {
    if(typeof window !== 'undefined' && window.OOT_FLYER_MANIFEST && Array.isArray(window.OOT_FLYER_MANIFEST.records)){
      return window.OOT_FLYER_MANIFEST.records;
    }
    if(typeof OOT_FLYER_TEMPLATE_RECORDS !== 'undefined' && Array.isArray(OOT_FLYER_TEMPLATE_RECORDS)){
      return OOT_FLYER_TEMPLATE_RECORDS;
    }
    if(typeof window !== 'undefined' && Array.isArray(window.OOT_FLYER_TEMPLATE_RECORDS)){
      return window.OOT_FLYER_TEMPLATE_RECORDS;
    }
  } catch(e){}
  return null;
}

function _flyerNormalizeRecord(raw){
  try {
    if(!raw || !raw.id) return null;
    var backgroundSrc = raw.backgroundSrc != null ? String(raw.backgroundSrc) : '';
    if(!backgroundSrc) return null;
    var format = raw.format === 'story' ? 'story' : (raw.format === 'square' ? 'square' : (String(raw.id).endsWith('-story') ? 'story' : 'square'));
    var width = Number(raw.width);
    var height = Number(raw.height);
    if(!(width > 0) || !(height > 0)){
      try {
        if(typeof FLYER_DIMS !== 'undefined' && FLYER_DIMS[format]){
          width = FLYER_DIMS[format].w;
          height = FLYER_DIMS[format].h;
        }
      } catch(e){}
    }
    if(!(width > 0)) width = 1080;
    if(!(height > 0)) height = (format === 'story' ? 1920 : 1080);
    var layers = (raw.layers && typeof raw.layers === 'object') ? raw.layers : { logo: _flyerDefaultLogoLayer() };
    var logo = (layers.logo && typeof layers.logo === 'object') ? layers.logo : _flyerDefaultLogoLayer();
    if(typeof logo.enabled !== 'boolean') logo = Object.assign({}, _flyerDefaultLogoLayer(), logo, { enabled: false });
    return {
      id: String(raw.id),
      key: String(raw.id),
      familyId: String(raw.id).replace(/-(square|story)$/, ''),
      name: raw.name ? String(raw.name) : String(raw.id),
      format: format,
      width: width,
      height: height,
      backgroundSrc: backgroundSrc,
      active: raw.active !== false,
      layers: { logo: {
        enabled: !!logo.enabled,
        src: logo.src != null ? String(logo.src) : '',
        x_frac: (typeof logo.x_frac === 'number') ? logo.x_frac : 0.5,
        y_frac: (typeof logo.y_frac === 'number') ? logo.y_frac : 0.10,
        w_frac: (typeof logo.w_frac === 'number') ? logo.w_frac : 0.24
      } },
      textZones: raw.textZones || null,
      assetVersion: raw.assetVersion != null ? String(raw.assetVersion) : backgroundSrc
    };
  } catch(e){ return null; }
}

function _flyerRecordFromLegacyMaps(key){
  try {
    if(!key || typeof FLYER_TEMPLATES === 'undefined' || !FLYER_TEMPLATES[key]) return null;
    var format = String(key).endsWith('-story') ? 'story' : 'square';
    var backgroundSrc = String(FLYER_TEMPLATES[key]);
    var force = (typeof FLYER_FORCE_REFRESH_TEMPLATES !== 'undefined' && FLYER_FORCE_REFRESH_TEMPLATES[key])
      ? String(FLYER_FORCE_REFRESH_TEMPLATES[key])
      : backgroundSrc;
    return _flyerNormalizeRecord({
      id: key,
      name: (typeof FLYER_NAMES !== 'undefined' && FLYER_NAMES[key]) ? FLYER_NAMES[key] : key,
      format: format,
      width: (typeof FLYER_DIMS !== 'undefined' && FLYER_DIMS[format]) ? FLYER_DIMS[format].w : 1080,
      height: (typeof FLYER_DIMS !== 'undefined' && FLYER_DIMS[format]) ? FLYER_DIMS[format].h : (format === 'story' ? 1920 : 1080),
      backgroundSrc: backgroundSrc,
      textZones: (typeof FLYER_ZONES !== 'undefined' && FLYER_ZONES[key]) ? FLYER_ZONES[key] : null,
      assetVersion: force,
      active: true,
      layers: { logo: _flyerDefaultLogoLayer() }
    });
  } catch(e){ return null; }
}

function _flyerTemplateRecordForKey(key){
  try {
    if(!key) return null;
    var records = _flyerCanonicalRecords();
    if(records){
      for(var i = 0; i < records.length; i++){
        if(records[i] && records[i].id === key){
          return _flyerNormalizeRecord(records[i]);
        }
      }
      return null;
    }
    return _flyerRecordFromLegacyMaps(key);
  } catch(e){ return null; }
}

function _flyerTemplateExists(key){
  return !!_flyerTemplateRecordForKey(key);
}

function _flyerTemplateKeysForFormat(fmt){
  try {
    var records = _flyerCanonicalRecords();
    if(records){
      return records.filter(function(raw){
        var rec = _flyerNormalizeRecord(raw);
        return rec && rec.active !== false && rec.format === fmt;
      }).map(function(raw){ return raw.id; });
    }
    if(typeof FLYER_TEMPLATES === 'undefined') return [];
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

function _flyerForceVersionForKey(key){
  try {
    var rec = _flyerTemplateRecordForKey(key);
    if(rec && rec.assetVersion && String(rec.assetVersion) !== String(rec.backgroundSrc)){
      return String(rec.assetVersion);
    }
    if(typeof FLYER_FORCE_REFRESH_TEMPLATES !== 'undefined' && FLYER_FORCE_REFRESH_TEMPLATES[key]){
      return String(FLYER_FORCE_REFRESH_TEMPLATES[key]);
    }
  } catch(e){}
  return '';
}

function _flyerSavedRenderIsStale(det){
  try {
    if(!det || !det.flyerData || !det.flyerTemplateKey) return false;
    var currentSrc = _flyerTemplateSrcForKey(det.flyerTemplateKey);
    if(!currentSrc) return false;
    if(det.flyerTemplateSrc && String(det.flyerTemplateSrc) !== currentSrc) return true;
    var forceVersion = _flyerForceVersionForKey(det.flyerTemplateKey);
    if(!det.flyerTemplateSrc && forceVersion) return true;
    if(forceVersion && String(det.flyerTemplateAssetVersion || '') !== String(forceVersion)) return true;
    return false;
  } catch(e){ return false; }
}

function _flyerPreviewSrcForDetails(det){
  try {
    if(!det) return '';
    if(_flyerSavedRenderIsStale(det)) return _flyerTemplateSrcForKey(det.flyerTemplateKey) || '';
    return det.flyerData || '';
  } catch(e){ return ''; }
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
