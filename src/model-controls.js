window.EXTRA_MODELS_EDIT = {
  nucleus: {
    id: 'nucleus',
    position: '20 5.2 -115',
    rotation: '0 0 0',
    scale: '15 15 15',
    visible: true
  },

  board: {
    id: 'board',
    position: '0.25 0.4 1.0',
    rotation: '270 180 0',
    scale: '0.025 0.025 0.025',
    visible: true
  },

  cellDemo: {
    id: 'cellDemo',
    position: '2.3 1.5 -0.6',
    rotation: '0 270 0',
    scale: '0.15 0.15 0.15',
    visible: true
  },

  lights: {
    boardSpot: {
      lightId: 'boardSpotLight',
      targetId: 'boardSpotTarget',
      enabled: true,
      position: '2.8525 1.5 -1',
      targetPosition: '-0.25 2.9 01.50',
      color: '#fff4d6',
      intensity: 5,
      angle: 50,
      penumbra: 0.45,
      distance: 6,
      decay: 1.4,
      castShadow: true
    },

    cellDemoSpot: {
      lightId: 'cellDemoSpotLight',
      targetId: 'cellDemoSpotTarget',
      enabled: true,
      position: '0.0 50 00',
      targetPosition: '0 100 100',
      color: '#d8a8d2',
      intensity: 120,
      angle: 30,
      penumbra: 2.45,
      distance: 172,
      decay: 1.4,
      castShadow: true
    }
  }
};

(function () {
  function applyModelSettings() {
    const config = window.EXTRA_MODELS_EDIT;
    if (!config) return;

    ['nucleus', 'board', 'cellDemo'].forEach((key) => {
      const item = config[key];
      if (!item) return;

      const el = document.getElementById(item.id);
      if (!el) {
        console.warn(`Model control: could not find element with id "${item.id}"`);
        return;
      }

      if (item.position) el.setAttribute('position', item.position);
      if (item.rotation) el.setAttribute('rotation', item.rotation);
      if (item.scale) el.setAttribute('scale', item.scale);
      if (typeof item.visible === 'boolean') el.setAttribute('visible', item.visible);
    });
  }

  function applySpotLightSettings() {
    const config = window.EXTRA_MODELS_EDIT;
    if (!config || !config.lights) return;

    Object.keys(config.lights).forEach((key) => {
      const item = config.lights[key];
      if (!item) return;

      const lightEl = document.getElementById(item.lightId);
      const targetEl = document.getElementById(item.targetId);

      if (!lightEl) {
        console.warn(`Spotlight control: could not find light "${item.lightId}"`);
        return;
      }

      if (!targetEl) {
        console.warn(`Spotlight control: could not find target "${item.targetId}"`);
        return;
      }

      if (item.position) lightEl.setAttribute('position', item.position);
      if (item.targetPosition) targetEl.setAttribute('position', item.targetPosition);
      lightEl.setAttribute('visible', item.enabled !== false);

      lightEl.setAttribute('light', {
        type: 'spot',
        color: item.color || '#ffffff',
        intensity: item.intensity ?? 2,
        angle: item.angle ?? 30,
        penumbra: item.penumbra ?? 0.4,
        distance: item.distance ?? 6,
        decay: item.decay ?? 1.5,
        castShadow: item.castShadow === true,
        target: `#${item.targetId}`
      });
    });
  }

  function applyAllSettings() {
    applyModelSettings();
    applySpotLightSettings();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyAllSettings);
  } else {
    applyAllSettings();
  }

  window.addEventListener('load', applyAllSettings);
})();