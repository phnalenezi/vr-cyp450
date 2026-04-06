(function () {
  const EDIT = (window.CODEINE_MORPHINE_LOOP_EDIT =
    window.CODEINE_MORPHINE_LOOP_EDIT || {
      // If you know the exact entity IDs later, you can put them here.
      // Leave blank to auto-find by glb file name.
      codeineSelector: '',
      morphineSelector: '',

      // Auto-find by glb file name if selector is blank.
      codeineModelMatch: 'codeine',
      morphineModelMatch: 'morphine',

      // YOUR POSITIONS FROM LIVE POSITION EDITOR
      codeine: {
        startPosition: '0.184 1.066 -0.030',
        bindPosition: '0.024 1.046 -0.030',
        rotation: '0 -1 -11',
        scale: '0.002 0.002 0.002'
      },

      morphine: {
        bindPosition: '0.025 1.045 -0.030',
        exitPosition: '-0.225 1.065 -0.030',
        rotation: '0 0 0',
        scale: '0.002 0.002 0.002',

        detachPosition: '0.000 1.050 -0.030',
        detachFraction: 0.80,

        fadeInSpin: '0 300 0',
        preDetachSpin: '0 180 0',
        leaveSpin: '0 220 0'
      },

      timing: {
        startDelay: 1400,
        moveToBind: 6000,
        bindHold: 1400,
        crossFade: 2400,
        morphineHold: 1000,
        detachMove: 1800,
        leaveMove: 4800,
        endFade: 1300,
        loopDelay: 2400
      },

      loop: {
        enabled: true,
        autoStart: true
      },

      effects: {
        enabled: true,
        glowRadius: 0.020,
        glowColor: '#66d9ff',
        glowOpacity: 0.020,
        glowPulseOpacity: 0.042,
        glowScale: '1 1 1',
        glowPulseScale: '1.35 1.35 1.35'
      }
    });

  function lower(value) {
    return String(value || '').toLowerCase();
  }

  function parseVec3(value) {
    if (!value) return { x: 0, y: 0, z: 0 };

    if (typeof value === 'object' && value.x !== undefined) {
      return {
        x: Number(value.x) || 0,
        y: Number(value.y) || 0,
        z: Number(value.z) || 0
      };
    }

    const parts = String(value).trim().split(/\s+/).map(Number);
    return {
      x: parts[0] || 0,
      y: parts[1] || 0,
      z: parts[2] || 0
    };
  }

  function vecToString(v) {
    return `${v.x} ${v.y} ${v.z}`;
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function lerpVec3(a, b, t) {
    return {
      x: lerp(a.x, b.x, t),
      y: lerp(a.y, b.y, t),
      z: lerp(a.z, b.z, t)
    };
  }

  function easeInOutCubic(t) {
    return -(Math.cos(Math.PI * t) - 1) / 2;
  }

  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function applyOpacity(entity, opacity) {
    const mesh = entity.getObject3D('mesh');
    if (!mesh) return;

    mesh.traverse((node) => {
      if (!node.isMesh || !node.material) return;

      const materials = Array.isArray(node.material)
        ? node.material
        : [node.material];

      materials.forEach((material) => {
        material.transparent = opacity < 0.999;
        material.opacity = opacity;
        material.depthWrite = opacity >= 0.999;
        material.needsUpdate = true;
      });
    });
  }

  function attachOpacityHook(entity) {
    if (!entity || entity.__codeineMorphineOpacityHook) return;
    entity.__codeineMorphineOpacityHook = true;

    entity.addEventListener('model-loaded', () => {
      const opacity = Number(entity.dataset.currentOpacity || 1);
      applyOpacity(entity, opacity);
    });
  }

  function setVisible(entity, visible) {
    if (!entity) return;
    entity.object3D.visible = visible;
    entity.setAttribute('visible', visible);
  }

  function setOpacity(entity, opacity) {
    if (!entity) return;
    entity.dataset.currentOpacity = String(opacity);
    applyOpacity(entity, opacity);
  }

  function setPosition(entity, value) {
    if (!entity) return;
    const p = parseVec3(value);
    entity.object3D.position.set(p.x, p.y, p.z);
    entity.setAttribute('position', vecToString(p));
  }

  function setRotation(entity, value) {
    if (!entity) return;
    entity.setAttribute('rotation', value);
  }

  function setScale(entity, value) {
    if (!entity) return;
    entity.setAttribute('scale', value);
  }

  function tween({ duration, update, shouldStop }) {
    return new Promise((resolve) => {
      const start = performance.now();

      function frame(now) {
        if (shouldStop && shouldStop()) {
          resolve(false);
          return;
        }

        const raw = Math.min(1, (now - start) / duration);
        const t = easeInOutCubic(raw);
        update(t, raw);

        if (raw < 1) {
          requestAnimationFrame(frame);
        } else {
          resolve(true);
        }
      }

      requestAnimationFrame(frame);
    });
  }

  async function tweenPosition(entity, fromValue, toValue, duration, shouldStop) {
    const from = parseVec3(fromValue);
    const to = parseVec3(toValue);

    return tween({
      duration,
      shouldStop,
      update: (t) => {
        const pos = lerpVec3(from, to, t);
        setPosition(entity, pos);
      }
    });
  }

  async function tweenOpacity(entity, from, to, duration, shouldStop) {
    return tween({
      duration,
      shouldStop,
      update: (t) => {
        setOpacity(entity, lerp(from, to, t));
      }
    });
  }

  function findBySelectorOrModel({ selector, modelMatch }) {
    if (selector) {
      const direct = document.querySelector(selector);
      if (direct) return direct;
    }

    const all = Array.from(document.querySelectorAll('[gltf-model]'));

    const byModel = all.find((el) =>
      lower(el.getAttribute('gltf-model')).includes(lower(modelMatch))
    );
    if (byModel) return byModel;

    const byId = all.find((el) => lower(el.id).includes(lower(modelMatch)));
    if (byId) return byId;

    return null;
  }

  function getDetachPosition() {
    if (EDIT.morphine.detachPosition && String(EDIT.morphine.detachPosition).trim()) {
      return EDIT.morphine.detachPosition;
    }

    const bind = parseVec3(EDIT.morphine.bindPosition);
    const exit = parseVec3(EDIT.morphine.exitPosition);
    const t = Number(EDIT.morphine.detachFraction || 0.0);

    return vecToString(lerpVec3(bind, exit, t));
  }

  function updateMonitor(title, body) {
    const titleEl =
      document.getElementById('monitor2-title') ||
      document.getElementById('monitorTitle') ||
      document.getElementById('lessonTitle');

    const bodyEl =
      document.getElementById('monitor2-body') ||
      document.getElementById('monitorBody') ||
      document.getElementById('lessonBody');

    if (titleEl) titleEl.textContent = title;
    if (bodyEl) bodyEl.textContent = body;
  }

  if (!AFRAME.components['codeine-morphine-loop']) {
    AFRAME.registerComponent('codeine-morphine-loop', {
      init() {
        this.playToken = 0;
        this.isPlaying = false;
        this.targetsReady = false;
        this.boundKeyDown = this.onKeyDown.bind(this);

        window.addEventListener('keydown', this.boundKeyDown);

        this.waitForTargets();

        window.CodeineMorphineLoop = {
          start: () => this.startLoop(),
          stop: () => this.stopLoop(),
          reset: () => this.resetTransforms(),
          showCodeineStart: () => this.showCodeineStart(),
          showCodeineBind: () => this.showCodeineBind(),
          showMorphineBind: () => this.showMorphineBind(),
          showMorphineExit: () => this.showMorphineExit()
        };
      },

      remove() {
        window.removeEventListener('keydown', this.boundKeyDown);
      },

      onKeyDown(event) {
        if (event.key === '7') this.startLoop();
        if (event.key === '8') this.stopLoop();
        if (event.key === '9') this.showCodeineBind();
        if (event.key === '0') this.showMorphineBind();
      },

      waitForTargets() {
        this.codeine = findBySelectorOrModel({
          selector: EDIT.codeineSelector,
          modelMatch: EDIT.codeineModelMatch
        });

        this.morphine = findBySelectorOrModel({
          selector: EDIT.morphineSelector,
          modelMatch: EDIT.morphineModelMatch
        });

        if (!this.codeine || !this.morphine) {
          setTimeout(() => this.waitForTargets(), 400);
          return;
        }

        attachOpacityHook(this.codeine);
        attachOpacityHook(this.morphine);

        this.setupGlow();
        this.targetsReady = true;
        this.resetTransforms();

        console.log('Codeine/Morphine loop ready.');
        console.log('7 = start loop | 8 = stop/reset | 9 = preview codeine bind | 0 = preview morphine bind');

        if (EDIT.loop.autoStart) {
          this.startLoop();
        }
      },

      setupGlow() {
        const oldGlow = document.getElementById('codeineMorphineBindGlow');
        if (oldGlow && oldGlow.parentNode) {
          oldGlow.parentNode.removeChild(oldGlow);
        }

        if (!EDIT.effects.enabled) return;

        const glowParent = this.codeine.parentElement || this.el;

        this.glow = document.createElement('a-sphere');
        this.glow.id = 'codeineMorphineBindGlow';
        this.glow.setAttribute('radius', EDIT.effects.glowRadius);
        this.glow.setAttribute('position', EDIT.codeine.bindPosition);
        this.glow.setAttribute(
          'material',
          [
            'shader: standard',
            `color: ${EDIT.effects.glowColor}`,
            `emissive: ${EDIT.effects.glowColor}`,
            'emissiveIntensity: 1.25',
            'transparent: true',
            `opacity: ${EDIT.effects.glowOpacity}`,
            'roughness: 0.25',
            'metalness: 0.0'
          ].join('; ')
        );
        this.glow.setAttribute('scale', EDIT.effects.glowScale);
        this.glow.setAttribute('visible', false);
        this.glow.setAttribute(
          'animation__pulse_scale',
          [
            'property: scale',
            `to: ${EDIT.effects.glowPulseScale}`,
            'dur: 1200',
            'dir: alternate',
            'loop: true',
            'easing: easeInOutQuad'
          ].join('; ')
        );
        this.glow.setAttribute(
          'animation__pulse_opacity',
          [
            'property: material.opacity',
            `to: ${EDIT.effects.glowPulseOpacity}`,
            'dur: 1200',
            'dir: alternate',
            'loop: true',
            'easing: easeInOutQuad'
          ].join('; ')
        );

        glowParent.appendChild(this.glow);
      },

      showGlow(active) {
        if (!this.glow) return;

        if (active) {
          this.glow.setAttribute('position', EDIT.codeine.bindPosition);
          this.glow.setAttribute('visible', true);
        } else {
          this.glow.setAttribute('visible', false);
        }
      },

      resetTransforms() {
        if (!this.targetsReady) return;

        setPosition(this.codeine, EDIT.codeine.startPosition);
        setRotation(this.codeine, EDIT.codeine.rotation);
        setScale(this.codeine, EDIT.codeine.scale);
        setOpacity(this.codeine, 1);
        setVisible(this.codeine, true);

        setPosition(this.morphine, EDIT.morphine.bindPosition);
        setRotation(this.morphine, EDIT.morphine.rotation);
        setScale(this.morphine, EDIT.morphine.scale);
        setOpacity(this.morphine, 0);
        setVisible(this.morphine, false);

        this.showGlow(false);

        updateMonitor(
          'Codeine → Morphine',
          'Loop ready: codeine enters, binds, crossfades to morphine, morphine detaches, then leaves.'
        );
      },

      showCodeineStart() {
        this.stopLoop(false);

        setPosition(this.codeine, EDIT.codeine.startPosition);
        setRotation(this.codeine, EDIT.codeine.rotation);
        setScale(this.codeine, EDIT.codeine.scale);
        setOpacity(this.codeine, 1);
        setVisible(this.codeine, true);

        setVisible(this.morphine, false);
        this.showGlow(false);

        updateMonitor('Preview', 'Showing codeine at the starting position.');
      },

      showCodeineBind() {
        this.stopLoop(false);

        setPosition(this.codeine, EDIT.codeine.bindPosition);
        setRotation(this.codeine, EDIT.codeine.rotation);
        setScale(this.codeine, EDIT.codeine.scale);
        setOpacity(this.codeine, 1);
        setVisible(this.codeine, true);

        setVisible(this.morphine, false);
        this.showGlow(true);

        updateMonitor('Preview', 'Showing codeine at the bind position.');
      },

      showMorphineBind() {
        this.stopLoop(false);

        setVisible(this.codeine, false);

        setPosition(this.morphine, EDIT.morphine.bindPosition);
        setRotation(this.morphine, EDIT.morphine.rotation);
        setScale(this.morphine, EDIT.morphine.scale);
        setOpacity(this.morphine, 1);
        setVisible(this.morphine, true);

        this.showGlow(true);

        updateMonitor('Preview', 'Showing morphine at the bind position.');
      },

      showMorphineExit() {
        this.stopLoop(false);

        setVisible(this.codeine, false);

        setPosition(this.morphine, EDIT.morphine.exitPosition);
        setRotation(this.morphine, EDIT.morphine.rotation);
        setScale(this.morphine, EDIT.morphine.scale);
        setOpacity(this.morphine, 1);
        setVisible(this.morphine, true);

        this.showGlow(false);

        updateMonitor('Preview', 'Showing morphine at the exit position.');
      },

      startLoop() {
        if (!this.targetsReady || this.isPlaying) return;

        this.isPlaying = true;
        this.playToken += 1;
        this.runLoop(this.playToken);
      },

      stopLoop(doReset = true) {
        this.playToken += 1;
        this.isPlaying = false;

        if (doReset) {
          this.resetTransforms();
        }
      },

      async runLoop(token) {
        while (token === this.playToken) {
          await this.runOnce(token);

          if (token !== this.playToken) break;
          if (!EDIT.loop.enabled) break;

          await wait(EDIT.timing.loopDelay);
        }

        if (token === this.playToken) {
          this.isPlaying = false;
        }
      },

      async runOnce(token) {
        const shouldStop = () => token !== this.playToken;
        const morphineDetachPosition = getDetachPosition();

        this.resetTransforms();

        await wait(EDIT.timing.startDelay);
        if (shouldStop()) return;

        updateMonitor('Step 1', 'Codeine moves toward the enzyme active site.');

        await tweenPosition(
          this.codeine,
          EDIT.codeine.startPosition,
          EDIT.codeine.bindPosition,
          EDIT.timing.moveToBind,
          shouldStop
        );
        if (shouldStop()) return;

        this.showGlow(true);

        await wait(EDIT.timing.bindHold);
        if (shouldStop()) return;

        updateMonitor('Step 2', 'Codeine binds and crossfades into morphine.');

        setPosition(this.morphine, EDIT.morphine.bindPosition);
        setRotation(this.morphine, EDIT.morphine.rotation);
        setScale(this.morphine, EDIT.morphine.scale);
        setOpacity(this.morphine, 0);
        setVisible(this.morphine, true);

        await Promise.all([
          tweenOpacity(this.codeine, 1, 0, EDIT.timing.crossFade, shouldStop),
          tweenOpacity(this.morphine, 0, 1, EDIT.timing.crossFade, shouldStop)
        ]);
        if (shouldStop()) return;

        setVisible(this.codeine, false);

        await wait(EDIT.timing.morphineHold);
        if (shouldStop()) return;

        updateMonitor('Step 3', 'Morphine detaches from the active site.');

        await tweenPosition(
          this.morphine,
          EDIT.morphine.bindPosition,
          morphineDetachPosition,
          EDIT.timing.detachMove,
          shouldStop
        );
        if (shouldStop()) return;

        this.showGlow(false);

        updateMonitor('Step 4', 'Morphine leaves the enzyme.');

        await tweenPosition(
          this.morphine,
          morphineDetachPosition,
          EDIT.morphine.exitPosition,
          EDIT.timing.leaveMove,
          shouldStop
        );
        if (shouldStop()) return;

        await tweenOpacity(
          this.morphine,
          1,
          0,
          EDIT.timing.endFade,
          shouldStop
        );
        if (shouldStop()) return;

        setVisible(this.morphine, false);

        updateMonitor(
          'Complete',
          'Sequence complete. Looping again.'
        );
      }
    });
  }

  function attachWhenReady() {
    const scene = document.querySelector('a-scene');
    if (!scene) {
      requestAnimationFrame(attachWhenReady);
      return;
    }

    if (!scene.hasAttribute('codeine-morphine-loop')) {
      scene.setAttribute('codeine-morphine-loop', '');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attachWhenReady);
  } else {
    attachWhenReady();
  }
})();