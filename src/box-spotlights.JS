(function () {
  const EDIT = (window.BOX_SPOTLIGHTS_EDIT =
    window.BOX_SPOTLIGHTS_EDIT || {
      inducer: {
        groupId: 'inducerBoxGroup',
        targetId: 'inducerLightTarget',
        lightId: 'inducerSpotLight',

        enabled: true,
        targetPosition: '-0.90 0.820 0.030',
        lightPosition: '-0.90 1.850 0.030',

        color: '#8cf0a5',
        intensity: 2.4,
        angle: 30,
        penumbra: 0.7,
        decay: 1.4,
        distance: 3.4,
        castShadow: false
      },

      prodrug: {
        groupId: 'normalBoxGroup',
        targetId: 'normalLightTarget',
        lightId: 'normalSpotLight',

        enabled: true,
        targetPosition: '0.0 0.820 0.030',
        lightPosition: '0.0 1.850 0.030',

        color: '#dfe9ff',
        intensity: 2.35,
        angle: 30,
        penumbra: 0.7,
        decay: 1.4,
        distance: 3.4,
        castShadow: false
      },

      inhibitor: {
        groupId: 'inhibitorBoxGroup',
        targetId: 'inhibitorLightTarget',
        lightId: 'inhibitorSpotLight',

        enabled: true,
        targetPosition: '0.9000 0.820 0.030',
        lightPosition: '0.9000 1.850 0.030',

        color: '#ff9b9b',
        intensity: 2.4,
        angle: 30,
        penumbra: 0.7,
        decay: 1.4,
        distance: 3.4,
        castShadow: false
      }
    });

  function getEntity(id) {
    return document.getElementById(id);
  }

  function ensureChildEntity(parent, id) {
    let el = getEntity(id);

    if (!el) {
      el = document.createElement('a-entity');
      el.id = id;
      parent.appendChild(el);
    }

    return el;
  }

  function applyOneLight(config) {
    const group = getEntity(config.groupId);
    if (!group) return;

    const target = ensureChildEntity(group, config.targetId);
    const light = ensureChildEntity(group, config.lightId);

    target.setAttribute('position', config.targetPosition);
    target.setAttribute('visible', false);

    light.setAttribute('position', config.lightPosition);
    light.setAttribute(
      'light',
      [
        'type: spot',
        `intensity: ${config.enabled ? config.intensity : 0}`,
        `color: ${config.color}`,
        `angle: ${config.angle}`,
        `penumbra: ${config.penumbra}`,
        `decay: ${config.decay}`,
        `distance: ${config.distance}`,
        `target: #${config.targetId}`,
        `castShadow: ${config.castShadow ? 'true' : 'false'}`
      ].join('; ')
    );
  }

  function applyAllLights() {
    applyOneLight(EDIT.inducer);
    applyOneLight(EDIT.prodrug);
    applyOneLight(EDIT.inhibitor);
  }

  if (!AFRAME.components['box-spotlights']) {
    AFRAME.registerComponent('box-spotlights', {
      init() {
        this.tryApply();

        window.BoxSpotlights = {
          refresh: () => applyAllLights(),
          inducerOnly: () => applyOneLight(EDIT.inducer),
          prodrugOnly: () => applyOneLight(EDIT.prodrug),
          inhibitorOnly: () => applyOneLight(EDIT.inhibitor),
          logEdit: () => {
            console.log('BOX_SPOTLIGHTS_EDIT =', window.BOX_SPOTLIGHTS_EDIT);
          }
        };
      },

      tryApply() {
        const inducerGroup = getEntity(EDIT.inducer.groupId);
        const prodrugGroup = getEntity(EDIT.prodrug.groupId);
        const inhibitorGroup = getEntity(EDIT.inhibitor.groupId);

        if (!inducerGroup || !prodrugGroup || !inhibitorGroup) {
          setTimeout(() => this.tryApply(), 300);
          return;
        }

        applyAllLights();
        console.log('All 3 box spotlights are ready.');
        console.log('Edit window.BOX_SPOTLIGHTS_EDIT and run BoxSpotlights.refresh()');
      }
    });
  }

  function attachWhenReady() {
    const scene = document.querySelector('a-scene');
    if (!scene) {
      requestAnimationFrame(attachWhenReady);
      return;
    }

    if (!scene.hasAttribute('box-spotlights')) {
      scene.setAttribute('box-spotlights', '');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attachWhenReady);
  } else {
    attachWhenReady();
  }
})();