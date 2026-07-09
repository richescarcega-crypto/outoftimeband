/**
 * Out of Time flyer template manifest (F5 — r950).
 * Loaded before inline flyer generator in index.html.
 * Preserves legacy FLYER_* global names for adapter compatibility.
 */
var FLYER_TEMPLATES = {
  'hollywood-square': 'oot_flyer_square_01_r512.png',
  'hollywood-story': 'oot_flyer_story_01_r513.png',
  'neon-square': 'oot_flyer_square_02_r473.png',
  'neon-story': 'oot_flyer_story_02_r464.png',
  'skyline-square': 'oot_flyer_square_03_r473.png',
  'skyline-story': 'oot_flyer_story_03_r464.png',
  'deco-square': 'oot_flyer_square_04_r473.png',
  'deco-story': 'oot_flyer_story_04_r464.png',
  'disco-square': 'oot_flyer_square_05_r473.png',
  'disco-story': 'oot_flyer_story_05_r464.png',
  'comic-square': 'oot_flyer_square_06_r473.png',
  'comic-story': 'oot_flyer_story_06_r464.png',
  'metropolis-square': 'oot_flyer_square_07_r473.png',
  'metropolis-story': 'oot_flyer_story_07_r464.png',
  'boardwalk-square': 'oot_flyer_square_08_r473.png',
  'boardwalk-story': 'oot_flyer_story_08_r464.png',
  'oot09-square': 'oot_flyer_square_09_r473.png',
  'oot09-story': 'oot_flyer_story_09_r464.png',
  'oot10-square': 'oot_flyer_square_10_r473.png',
  'oot10-story': 'oot_flyer_story_10_r464.png',
  'oot11-square': 'oot_flyer_square_11_r473.png',
  'oot11-story': 'oot_flyer_story_11_r464.png',
  'oot12-square': 'oot_flyer_square_12_r473.png',
  'oot12-story': 'oot_flyer_story_12_r464.png',
  'oot13-square': 'oot_flyer_square_13_r473.png',
  'oot13-story': 'oot_flyer_story_13_r504.png',
  'oot14-square': 'oot_flyer_square_14_r473.png',
  'oot14-story': 'oot_flyer_story_14_r507.png',
  'oot15-square': 'oot_flyer_square_15_r473.png',
  'oot15-story': 'oot_flyer_story_15_r507.png',
};

// Per-template text-overlay zones. y_frac is fraction of canvas height where text BASELINE sits.
// Each template has its own positions because the empty zones differ.
var FLYER_ZONES = {
  'hollywood-square': {
    announcement: {y_frac: 0.745, x_frac: 0.50, size: 34, color: '#ffffff', bold: true},
    venue: {y_frac: 0.815, x_frac: 0.50, size: 60, color: '#d4b56a', bold: true, hideRule: true},
    address: {y_frac: 0.875, x_frac: 0.50, size: 30, color: '#ffe5b8', bold: false},
    date: {y_frac: 0.930, x_frac: 0.50, size: 50, color: '#ffd9a3', bold: true},
  },
  'hollywood-story': {
    venue: {y_frac: 0.760, x_frac: 0.50, size: 82, color: '#f3c967', bold: true, font: 'premium-serif', premiumVenue: true, premiumRule: true, premiumRuleY_frac: 0.820},
    address: {y_frac: 0.833, x_frac: 0.50, size: 34, color: '#f6df9f', bold: false, font: 'premium-serif'},
    date: {y_frac: 0.887, x_frac: 0.50, size: 58, color: '#ffd777', bold: true, font: 'premium-serif', premiumBottomRule: true, premiumBottomRuleY_frac: 0.943},
  },
  'neon-square': {
    announcement: {y_frac: 0.786, x_frac: 0.50, size: 34, color: '#ffffff', bold: true},
    venue: {y_frac: 0.798, x_frac: 0.50, size: 60, color: '#d4b56a', bold: true},
    address: {y_frac: 0.858, x_frac: 0.50, size: 30, color: '#ffe5b8', bold: false},
    date: {y_frac: 0.908, x_frac: 0.50, size: 50, color: '#ffd9a3', bold: true},
  },
  'neon-story': {
    venue: {y_frac: 0.758, x_frac: 0.515, size: 76, color: '#f3c967', bold: true, font: 'premium-serif', premiumVenue: true, premiumRule: true, premiumRuleY_frac: 0.824},
    address: {y_frac: 0.846, x_frac: 0.50, size: 34, color: '#f6df9f', bold: false, font: 'premium-serif'},
    date: {y_frac: 0.904, x_frac: 0.50, size: 58, color: '#ffd777', bold: true, font: 'premium-serif', premiumBottomRule: true, premiumBottomRuleY_frac: 0.956},
  },
  'skyline-square': {
    announcement: {y_frac: 0.745, x_frac: 0.50, size: 34, color: '#ffffff', bold: true},
    venue: {y_frac: 0.774, x_frac: 0.50, size: 60, color: '#d4b56a', bold: true},
    address: {y_frac: 0.834, x_frac: 0.50, size: 30, color: '#ffe5b8', bold: false},
    date: {y_frac: 0.884, x_frac: 0.50, size: 50, color: '#ffd9a3', bold: true},
  },
  'skyline-story': {
    venue: {y_frac: 0.715, x_frac: 0.50, size: 82, color: '#f3c967', bold: true, font: 'premium-serif', premiumVenue: true, premiumRule: true, premiumRuleY_frac: 0.776},
    address: {y_frac: 0.792, x_frac: 0.50, size: 34, color: '#f6df9f', bold: false, font: 'premium-serif'},
    date: {y_frac: 0.848, x_frac: 0.50, size: 58, color: '#ffd777', bold: true, font: 'premium-serif', premiumBottomRule: true, premiumBottomRuleY_frac: 0.900},
  },
  'deco-square': {
    announcement: {y_frac: 0.745, x_frac: 0.50, size: 34, color: '#ffffff', bold: true},
    venue: {y_frac: 0.767, x_frac: 0.50, size: 60, color: '#d4b56a', bold: true},
    address: {y_frac: 0.827, x_frac: 0.50, size: 30, color: '#ffe5b8', bold: false},
    date: {y_frac: 0.877, x_frac: 0.50, size: 50, color: '#ffd9a3', bold: true},
  },
  'deco-story': {
    venue: {y_frac: 0.720, x_frac: 0.507, size: 78, color: '#f3c967', bold: true, font: 'premium-serif', premiumVenue: true},
    address: {y_frac: 0.802, x_frac: 0.50, size: 34, color: '#f6df9f', bold: false, font: 'premium-serif'},
    date: {y_frac: 0.866, x_frac: 0.50, size: 58, color: '#ffd777', bold: true, font: 'premium-serif'},
    bottomRuleShift: {oldY_frac: 0.958, newY_frac: 0.958, xInset: 118, sampleYOffset: -62, coverHeight: 44, removeOnly: true},
  },
  'disco-square': {
    announcement: {y_frac: 0.745, x_frac: 0.50, size: 34, color: '#ffffff', bold: true},
    venue: {y_frac: 0.749, x_frac: 0.50, size: 60, color: '#d4b56a', bold: true},
    address: {y_frac: 0.809, x_frac: 0.50, size: 30, color: '#ffe5b8', bold: false},
    date: {y_frac: 0.859, x_frac: 0.50, size: 50, color: '#ffd9a3', bold: true},
  },
  'disco-story': {
    venue: {y_frac: 0.736, x_frac: 0.507, size: 74, color: '#f3c967', bold: true, font: 'premium-serif', premiumVenue: true},
    address: {y_frac: 0.818, x_frac: 0.502, size: 34, color: '#f6df9f', bold: false, font: 'premium-serif'},
    date: {y_frac: 0.886, x_frac: 0.502, size: 58, color: '#ffd777', bold: true, font: 'premium-serif'},
    bottomRuleShift: {oldY_frac: 0.835, newY_frac: 0.835, xInset: 118, sampleYOffset: 58, coverHeight: 44, removeOnly: true},
  },
  'comic-square': {
    announcement: {y_frac: 0.745, x_frac: 0.50, size: 34, color: '#ffffff', bold: true},
    venue: {y_frac: 0.776, x_frac: 0.50, size: 60, color: '#d4b56a', bold: true},
    address: {y_frac: 0.836, x_frac: 0.50, size: 30, color: '#ffe5b8', bold: false},
    date: {y_frac: 0.886, x_frac: 0.50, size: 50, color: '#ffd9a3', bold: true},
  },
  'comic-story': {
    venue: {y_frac: 0.772, x_frac: 0.500, size: 70, color: '#f3c967', bold: true, font: 'premium-serif', premiumVenue: true, premiumNoTracking: true, premiumFitMargin: 132},
    address: {y_frac: 0.844, x_frac: 0.50, size: 32, color: '#f6df9f', bold: false, font: 'premium-serif'},
    date: {y_frac: 0.891, x_frac: 0.50, size: 54, color: '#ffd777', bold: true, font: 'premium-serif'},
    bottomRuleShift: {oldY_frac: 0.952, newY_frac: 0.952, xInset: 120, sampleYOffset: 26, coverHeight: 58, removeOnly: true},
  },
  'metropolis-square': {
    venue: {y_frac: 0.757, x_frac: 0.50, size: 60, color: '#d4b56a', bold: true},
    address: {y_frac: 0.817, x_frac: 0.50, size: 30, color: '#ffe5b8', bold: false},
    date: {y_frac: 0.867, x_frac: 0.50, size: 50, color: '#ffd9a3', bold: true},
  },
  'metropolis-story': {
    venue: {y_frac: 0.696, x_frac: 0.500, size: 70, color: '#f3c967', bold: true, font: 'premium-serif', premiumVenue: true, premiumNoTracking: true, premiumFitMargin: 132},
    address: {y_frac: 0.775, x_frac: 0.50, size: 34, color: '#f6df9f', bold: false, font: 'premium-serif'},
    date: {y_frac: 0.835, x_frac: 0.50, size: 54, color: '#ffd777', bold: true, font: 'premium-serif'},
    bottomRuleShift: {oldY_frac: 0.808, newY_frac: 0.808, xInset: 140, sampleYOffset: 96, coverHeight: 52, removeOnly: true},
  },
  'boardwalk-square': {
    venue: {y_frac: 0.756, x_frac: 0.50, size: 60, color: '#d4b56a', bold: true},
    address: {y_frac: 0.816, x_frac: 0.50, size: 30, color: '#ffe5b8', bold: false},
    date: {y_frac: 0.866, x_frac: 0.50, size: 50, color: '#ffd9a3', bold: true},
  },
  'boardwalk-story': {
    venue: {y_frac: 0.758, x_frac: 0.500, size: 70, color: '#f3c967', bold: true, font: 'premium-serif', premiumVenue: true, premiumNoTracking: true, premiumFitMargin: 132},
    address: {y_frac: 0.834, x_frac: 0.50, size: 32, color: '#f6df9f', bold: false, font: 'premium-serif'},
    date: {y_frac: 0.898, x_frac: 0.50, size: 54, color: '#ffd777', bold: true, font: 'premium-serif'},
    bottomRuleShift: {oldY_frac: 0.835, newY_frac: 0.835, xInset: 118, sampleYOffset: -62, coverHeight: 54, removeOnly: true},
  },
  'oot09-square': {
    tagline: {y_frac: 0.650, x_frac: 0.50, size: 42, color: '#f5c66b'},
    announcement: {y_frac: 0.699, x_frac: 0.50, size: 34, color: '#ffffff', bold: true},
    venue: {y_frac: 0.762, x_frac: 0.50, size: 60, color: '#d4b56a', bold: true},
    address: {y_frac: 0.822, x_frac: 0.50, size: 30, color: '#ffe5b8', bold: false},
    date: {y_frac: 0.872, x_frac: 0.50, size: 50, color: '#ffd9a3', bold: true},
  },
  'oot09-story': {
    venue: {y_frac: 0.714, x_frac: 0.500, size: 70, color: '#f3c967', bold: true, font: 'premium-serif', premiumVenue: true, premiumNoTracking: true, premiumFitMargin: 132},
    address: {y_frac: 0.794, x_frac: 0.50, size: 32, color: '#f6df9f', bold: false, font: 'premium-serif'},
    date: {y_frac: 0.858, x_frac: 0.50, size: 54, color: '#ffd777', bold: true, font: 'premium-serif'},
    bottomRuleShift: {oldY_frac: 0.772, newY_frac: 0.772, xInset: 120, sampleYOffset: 68, coverHeight: 48, removeOnly: true},
  },
  'oot10-square': {
    announcement: {y_frac: 0.745, x_frac: 0.50, size: 34, color: '#ffffff', bold: true},
    venue: {y_frac: 0.758, x_frac: 0.50, size: 60, color: '#d4b56a', bold: true},
    address: {y_frac: 0.818, x_frac: 0.50, size: 30, color: '#ffe5b8', bold: false},
    date: {y_frac: 0.868, x_frac: 0.50, size: 50, color: '#ffd9a3', bold: true},
  },
  'oot10-story': {
    venue: {y_frac: 0.708, x_frac: 0.50, size: 76, color: '#d4b56a', bold: true},
    address: {y_frac: 0.788, x_frac: 0.50, size: 34, color: '#ffe5b8', bold: false},
    date: {y_frac: 0.832, x_frac: 0.50, size: 58, color: '#ffd9a3', bold: true},
  },
  'oot11-square': {
    announcement: {y_frac: 0.745, x_frac: 0.50, size: 34, color: '#ffffff', bold: true},
    venue: {y_frac: 0.800, x_frac: 0.50, size: 60, color: '#d4b56a', bold: true},
    address: {y_frac: 0.860, x_frac: 0.50, size: 30, color: '#ffe5b8', bold: false},
    date: {y_frac: 0.910, x_frac: 0.50, size: 50, color: '#ffd9a3', bold: true},
  },
  'oot11-story': {
    venue: {y_frac: 0.708, x_frac: 0.50, size: 76, color: '#d4b56a', bold: true},
    address: {y_frac: 0.772, x_frac: 0.50, size: 34, color: '#ffe5b8', bold: false},
    date: {y_frac: 0.800, x_frac: 0.50, size: 58, color: '#ffd9a3', bold: true},
  },
  'oot12-square': {
    announcement: {y_frac: 0.745, x_frac: 0.50, size: 34, color: '#ffffff', bold: true},
    venue: {y_frac: 0.764, x_frac: 0.50, size: 60, color: '#d4b56a', bold: true},
    address: {y_frac: 0.824, x_frac: 0.50, size: 30, color: '#ffe5b8', bold: false},
    date: {y_frac: 0.874, x_frac: 0.50, size: 50, color: '#ffd9a3', bold: true},
  },
  'oot12-story': {
    venue: {y_frac: 0.708, x_frac: 0.50, size: 76, color: '#d4b56a', bold: true},
    address: {y_frac: 0.810, x_frac: 0.50, size: 34, color: '#ffe5b8', bold: false},
    date: {y_frac: 0.852, x_frac: 0.50, size: 58, color: '#ffd9a3', bold: true},
  },
  'oot13-square': {
    announcement: {y_frac: 0.745, x_frac: 0.50, size: 34, color: '#ffffff', bold: true},
    venue: {y_frac: 0.780, x_frac: 0.50, size: 60, color: '#d4b56a', bold: true},
    address: {y_frac: 0.840, x_frac: 0.50, size: 30, color: '#ffe5b8', bold: false},
    date: {y_frac: 0.890, x_frac: 0.50, size: 50, color: '#ffd9a3', bold: true},
  },
  'oot13-story': {
    venue: {y_frac: 0.760, x_frac: 0.50, size: 76, color: '#d4b56a', bold: true, ruleY_frac: 0.895, hideRule: true},
    address: {y_frac: 0.818, x_frac: 0.50, size: 34, color: '#ffe5b8', bold: false},
    date: {y_frac: 0.858, x_frac: 0.50, size: 58, color: '#ffd9a3', bold: true},
  },
  'oot14-square': {
    announcement: {y_frac: 0.745, x_frac: 0.50, size: 34, color: '#ffffff', bold: true},
    venue: {y_frac: 0.788, x_frac: 0.50, size: 60, color: '#d4b56a', bold: true},
    address: {y_frac: 0.848, x_frac: 0.50, size: 30, color: '#ffe5b8', bold: false},
    date: {y_frac: 0.898, x_frac: 0.50, size: 50, color: '#ffd9a3', bold: true},
  },
  'oot14-story': {
    venue: {y_frac: 0.724, x_frac: 0.50, size: 76, color: '#d4b56a', bold: true, hideRule: true},
    address: {y_frac: 0.786, x_frac: 0.50, size: 34, color: '#ffe5b8', bold: false},
    date: {y_frac: 0.864, x_frac: 0.50, size: 58, color: '#ffd9a3', bold: true},
  },
  'oot15-square': {
    venue: {y_frac: 0.745, x_frac: 0.50, size: 60, color: '#d4b56a', bold: true},
    address: {y_frac: 0.805, x_frac: 0.50, size: 30, color: '#ffe5b8', bold: false},
    date: {y_frac: 0.855, x_frac: 0.50, size: 50, color: '#ffd9a3', bold: true},
  },
  'oot15-story': {
    venue: {y_frac: 0.735, x_frac: 0.50, size: 76, color: '#d4b56a', bold: true, hideRule: true},
    address: {y_frac: 0.805, x_frac: 0.50, size: 34, color: '#ffe5b8', bold: false},
    date: {y_frac: 0.883, x_frac: 0.50, size: 58, color: '#ffd9a3', bold: true},
  },
};

// Friendly names for the template grid
var FLYER_NAMES = {
  'hollywood-square': 'Flyer 1',
  'hollywood-story': 'Flyer 1',
  'neon-square': 'Flyer 2',
  'neon-story': 'Flyer 2',
  'skyline-square': 'Flyer 3',
  'skyline-story': 'Flyer 3',
  'deco-square': 'Flyer 4',
  'deco-story': 'Flyer 4',
  'disco-square': 'Flyer 5',
  'disco-story': 'Flyer 5',
  'comic-square': 'Flyer 6',
  'comic-story': 'Flyer 6',
  'metropolis-square': 'Flyer 7',
  'metropolis-story': 'Flyer 7',
  'boardwalk-square': 'Flyer 8',
  'boardwalk-story': 'Flyer 8',
  'oot09-square': 'Flyer 9',
  'oot09-story': 'Flyer 9',
  'oot10-square': 'Flyer 10',
  'oot10-story': 'Flyer 10',
  'oot11-square': 'Flyer 11',
  'oot11-story': 'Flyer 11',
  'oot12-square': 'Flyer 12',
  'oot12-story': 'Flyer 12',
  'oot13-square': 'Flyer 13',
  'oot13-story': 'Flyer 13',
  'oot14-square': 'Flyer 14',
  'oot14-story': 'Flyer 14',
  'oot15-square': 'Flyer 15',
  'oot15-story': 'Flyer 15',
};

// Dimensions per format
var FLYER_DIMS = {
  'square': {w:1080, h:1080},
  'story':  {w:1080, h:1920}
};

// State
var _flyerCtx = {
  format: 'square',     // 'square' | 'story'
  template: null,       // template key
  gig: null,            // gig event being flyered
  venue: '',
  address: '',
  date: '',
  announce: '',         // optional announcement line
  loadedImages: {},     // template key -> loaded HTMLImageElement
  loadedImageSrc: {},  // r505: template key -> asset URL used for cached image
  staleSavedRender: false
};


// r505: Saved flyer render staleness helpers. Saved flyers store a JPEG in Firestore;
// when a template asset file changes, that JPEG can be visually stale even though
// the template key is unchanged. Track/compare the asset source so old renders get refreshed.
var FLYER_FORCE_REFRESH_TEMPLATES = {
  'hollywood-square': '2026-05-12-flyer1-square-clean-stack-r512',
  'hollywood-story': '2026-05-13-flyer1-story-gold-serif-r517',
  'neon-story': '2026-05-13-flyer2-story-venue-optical-center-r519',
  'skyline-story': '2026-05-13-flyer3-story-gold-serif-r520',
  'deco-story': '2026-05-13-flyer4-story-center-cleanup-r523',
  'disco-story': '2026-05-13-flyer5-story-centering-refine-r525',
  'comic-story': '2026-05-13-flyer6-story-spacing-rebalance-r532',
  'metropolis-story': '2026-05-13-flyer7-story-premium-spacing-cleanup-r531',
  'boardwalk-story': '2026-05-13-flyer8-story-premium-artifact-cleanup-r533',
  'oot09-story': '2026-05-13-flyer9-story-premium-separator-cleanup-r534',
  'oot13-story': '2026-05-12-story13-asset-clean-r504',
  'oot14-story': '2026-05-12-story14-clean-centered-r507',
  'oot15-story': '2026-05-12-story15-clean-centered-r507'
};
if (typeof window !== 'undefined') {
  window.OOT_FLYER_MANIFEST = {
    schemaVersion: 1,
    dims: FLYER_DIMS,
    templates: FLYER_TEMPLATES,
    zones: FLYER_ZONES,
    names: FLYER_NAMES,
    forceRefresh: FLYER_FORCE_REFRESH_TEMPLATES
  };
}
