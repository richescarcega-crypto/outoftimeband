/**
 * Out of Time flyer layer helpers (F8a — r952).
 * Loaded after js/flyer-template-adapter.js and before inline flyer generator.
 * Preserves legacy _flyerLayer* global names for render compatibility.
 * Does not move _flyerRender; async layer loads re-enter via window._flyerRender.
 */
function _flyerLayerConfigForKey(key, layerName){
  var rec = _flyerTemplateRecordForKey(key);
  if(!rec || !rec.layers) return null;
  return rec.layers[layerName] || null;
}
function _flyerLayerImageCache(){
  if(!_flyerCtx.layerImages) _flyerCtx.layerImages = {};
  return _flyerCtx.layerImages;
}
function _flyerDrawImageLayer(ctx, dims, layer, cacheKey){
  try {
    if(!layer || layer.enabled !== true || !layer.src) return;
    var cache = _flyerLayerImageCache();
    var img = cache[cacheKey];
    if(!img){
      img = new Image();
      img.onload = function(){
        cache[cacheKey] = img;
        try {
          if(typeof window !== 'undefined' && typeof window._flyerRender === 'function'){
            window._flyerRender();
          }
        } catch(e){}
      };
      img.onerror = function(){ cache[cacheKey] = null; };
      cache[cacheKey] = img;
      img.src = layer.src;
      return;
    }
    if(!img.complete || !img.naturalWidth) return;
    var w = dims.w * (layer.w_frac || 0.24);
    var h = w * (img.naturalHeight / img.naturalWidth);
    if(layer.h_frac){ h = dims.h * layer.h_frac; }
    var x = dims.w * (layer.x_frac != null ? layer.x_frac : 0.5) - w / 2;
    var y = dims.h * (layer.y_frac != null ? layer.y_frac : 0.10) - h / 2;
    var oldAlpha = ctx.globalAlpha;
    ctx.globalAlpha = layer.opacity != null ? layer.opacity : 1;
    ctx.drawImage(img, x, y, w, h);
    ctx.globalAlpha = oldAlpha;
  } catch(e){}
}
function _flyerDrawConfiguredLayers(ctx, dims, key){
  var logo = _flyerLayerConfigForKey(key, 'logo');
  _flyerDrawImageLayer(ctx, dims, logo, key + ':logo');
}

window.OOT_FLYER_LAYER_HELPERS = {
  layerConfigForKey: _flyerLayerConfigForKey,
  layerImageCache: _flyerLayerImageCache,
  drawImageLayer: _flyerDrawImageLayer,
  drawConfiguredLayers: _flyerDrawConfiguredLayers
};

window._flyerLayerConfigForKey = window.OOT_FLYER_LAYER_HELPERS.layerConfigForKey;
window._flyerLayerImageCache = window.OOT_FLYER_LAYER_HELPERS.layerImageCache;
window._flyerDrawImageLayer = window.OOT_FLYER_LAYER_HELPERS.drawImageLayer;
window._flyerDrawConfiguredLayers = window.OOT_FLYER_LAYER_HELPERS.drawConfiguredLayers;
