AFRAME.registerComponent('cyp-scene-manager', {
  init() {
    const THREE = AFRAME.THREE;
    const scene = this.el;
    const overlay = document.getElementById('loading-overlay');

    const refs = {
      rig: document.getElementById('rig'),
      camera: document.getElementById('camera'),
      hud: document.getElementById('hud'),
      infoPanel: document.getElementById('infoPanel'),
      buttonRow: document.getElementById('buttonRow'),
      focusRig: document.getElementById('focusRig'),
      drugGroup: document.getElementById('drugGroup'),
      partsGroup: document.getElementById('partsGroup'),
      cyp: document.getElementById('cyp'),
      heme: document.getElementById('heme'),
      monitorRig: document.getElementById('monitorRig'),
      monitor: document.getElementById('monitor'),
      monitorUiAnchor: document.getElementById('monitorUiAnchor'),
      monitor1UiRoot: document.getElementById('monitor1UiRoot'),
      comparisonRig: document.getElementById('comparisonRig'),
      inducerBoxGroup: document.getElementById('inducerBoxGroup'),
      normalBoxGroup: document.getElementById('normalBoxGroup'),
      inhibitorBoxGroup: document.getElementById('inhibitorBoxGroup'),

      inducerBox: document.getElementById('inducerBox'),
      normalBox: document.getElementById('normalBox'),
      inhibitorBox: document.getElementById('inhibitorBox'),

      inducerLabel: document.getElementById('inducerLabel'),
      prodrugLabel: document.getElementById('prodrugLabel'),
      inhibitorLabel: document.getElementById('inhibitorLabel'),

      comparisonRig: document.getElementById('comparisonRig'),
      inducerBoxGroup: document.getElementById('inducerBoxGroup'),
      normalBoxGroup: document.getElementById('normalBoxGroup'),
      inhibitorBoxGroup: document.getElementById('inhibitorBoxGroup'),

      inducerBox: document.getElementById('inducerBox'),
      normalBox: document.getElementById('normalBox'),
      inhibitorBox: document.getElementById('inhibitorBox'),

      inducerEnzyme: document.getElementById('inducerEnzyme'),
      normalEnzyme: document.getElementById('normalEnzyme'),
      inhibitorEnzyme: document.getElementById('inhibitorEnzyme'),

      rifampcinDrug: document.getElementById('rifampcinDrug'),
      phenytoinDrug: document.getElementById('phenytoinDrug'),
      codeineDrug: document.getElementById('codeineDrug'),
      morphineDrug: document.getElementById('morphineDrug'),

      apapStatic: document.getElementById('apapStatic'),
      apapOPhenol: document.getElementById('apapOPhenol'),
      apapHPhenol: document.getElementById('apapHPhenol'),
      apapNAmide: document.getElementById('apapNAmide'),
      apapHAmide: document.getElementById('apapHAmide'),

      sigmaApapOH: document.getElementById('sigmaApapOH'),
      sigmaApapC1O: document.getElementById('sigmaApapC1O'),
      sigmaApap34: document.getElementById('sigmaApap34'),
      sigmaRing1: document.getElementById('sigmaRing1'),
      sigmaRing2: document.getElementById('sigmaRing2'),
      sigmaRing3: document.getElementById('sigmaRing3'),
      sigmaRing4: document.getElementById('sigmaRing4'),
      sigmaApapC4N: document.getElementById('sigmaApapC4N'),
      sigmaApapNH: document.getElementById('sigmaApapNH'),

      activeSiteRing: document.getElementById('activeSiteRing'),
      infoCounter: document.getElementById('infoCounter'),
      infoTitle: document.getElementById('infoTitle'),
      infoBody: document.getElementById('infoBody'),
      btnBack: document.getElementById('btnBack'),
      btnNext: document.getElementById('btnNext'),
      btnReplay: document.getElementById('btnReplay'),
      btnMenu: document.getElementById('btnMenu')
    };
    // =========================================================
    // IN-SCENE VISUAL CONTROLS
    // - Darker / lighter environment.glb
    // - More transparent / more solid cyp450.glb
    // =========================================================

    const allGltfEntities = Array.from(document.querySelectorAll('[gltf-model]'));

    refs.environment =
      refs.environment ||
      document.getElementById('environment') ||
      allGltfEntities.find((el) => {
        const id = (el.getAttribute('id') || '').toLowerCase();
        const model = (el.getAttribute('gltf-model') || '').toLowerCase();
        return id.includes('environment') || model.includes('environment.glb');
      });

    refs.cyp =
      refs.cyp ||
      document.getElementById('cyp') ||
      document.getElementById('cyp450') ||
      allGltfEntities.find((el) => {
        const id = (el.getAttribute('id') || '').toLowerCase();
        const model = (el.getAttribute('gltf-model') || '').toLowerCase();
        return id.includes('cyp') || model.includes('cyp450.glb') || model.includes('cyp.glb');
      });

    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

    const sceneVisualControls = {
      envBrightness: 1.0,
      cypOpacity: 0.07,
      envMaterials: [],
      envValueText: null,
      cypValueText: null,
      panelAnchor: null,
      panelEntity: null
    };

    function collectUniqueMaterials(entityEl) {
      const materials = [];
      if (!entityEl || !entityEl.object3D) return materials;

      entityEl.object3D.traverse((obj) => {
        if (!obj.isMesh || !obj.material) return;

        const matList = Array.isArray(obj.material) ? obj.material : [obj.material];

        matList.forEach((mat) => {
          if (!mat) return;
          if (!materials.includes(mat)) {
            materials.push(mat);
          }
        });
      });

      return materials;
    }

    function updateSceneControlReadouts() {
      if (sceneVisualControls.envValueText) {
        sceneVisualControls.envValueText.setAttribute(
          'value',
          `Environment ${Math.round(sceneVisualControls.envBrightness * 100)}%`
        );
      }

      if (sceneVisualControls.cypValueText) {
        sceneVisualControls.cypValueText.setAttribute(
          'value',
          `CYP450 opacity ${Math.round(sceneVisualControls.cypOpacity * 100)}%`
        );
      }
    }

    function applyEnvironmentBrightness() {
      sceneVisualControls.envMaterials.forEach((entry) => {
        const { material, originalColor } = entry;

        if (material.color && originalColor) {
          material.color.copy(originalColor).multiplyScalar(sceneVisualControls.envBrightness);
        }

        material.needsUpdate = true;
      });

      updateSceneControlReadouts();
    }

    function applyCypOpacity() {
      const targetOpacity = clamp(sceneVisualControls.cypOpacity, 0, 1);

      sceneVisualControls.cypOpacity = targetOpacity;
      EDIT.SCENE.cypOpacity = targetOpacity;

      if (refs.cyp) {
        setModelOpacityRecursive(refs.cyp, targetOpacity, 1);
      }

      updateSceneControlReadouts();
    }

    function cacheEnvironmentMaterials() {
      if (!refs.environment) {
        console.warn('Environment entity not found.');
        return;
      }

      const mats = collectUniqueMaterials(refs.environment);

      sceneVisualControls.envMaterials = mats.map((material) => ({
        material,
        originalColor: material.color ? material.color.clone() : null,
      }));

      applyEnvironmentBrightness();
    }

    function cacheCypMaterials() {
      if (!refs.cyp) {
        console.warn('CYP entity not found.');
        return;
      }

      applyCypOpacity();
    }

    function createSceneControlButton(label, position, onClick) {
      const buttonWrap = document.createElement('a-entity');
      buttonWrap.setAttribute('position', position);
      buttonWrap.setAttribute('class', 'clickable');

      const glow = document.createElement('a-plane');
      glow.setAttribute('width', '0.36');
      glow.setAttribute('height', '0.11');
      glow.setAttribute('color', '#77e8ff');
      glow.setAttribute('opacity', '0.12');
      glow.setAttribute('shader', 'flat');
      glow.setAttribute('position', '0 0 -0.001');

      const button = document.createElement('a-plane');
      button.setAttribute('width', '0.34');
      button.setAttribute('height', '0.09');
      button.setAttribute('color', '#11293b');
      button.setAttribute('material', 'shader: flat; opacity: 0.98; side: double;');
      button.setAttribute('class', 'clickable');

      const text = document.createElement('a-text');
      text.setAttribute('value', label);
      text.setAttribute('align', 'center');
      text.setAttribute('anchor', 'center');
      text.setAttribute('color', '#ffffff');
      text.setAttribute('width', '0.72');
      text.setAttribute('position', '0 0 0.01');
      text.setAttribute('class', 'clickable');

      buttonWrap.appendChild(glow);
      buttonWrap.appendChild(button);
      buttonWrap.appendChild(text);

      const hoverOn = () => {
        button.setAttribute('color', '#1b3d55');
        buttonWrap.setAttribute('scale', '1.03 1.03 1.03');
      };

      const hoverOff = () => {
        button.setAttribute('color', '#11293b');
        buttonWrap.setAttribute('scale', '1 1 1');
      };

      buttonWrap.addEventListener('mouseenter', hoverOn);
      buttonWrap.addEventListener('mouseleave', hoverOff);
      button.addEventListener('mouseenter', hoverOn);
      button.addEventListener('mouseleave', hoverOff);
      text.addEventListener('mouseenter', hoverOn);
      text.addEventListener('mouseleave', hoverOff);

      const doClick = (evt) => {
        evt.stopPropagation();
        onClick();
      };

      buttonWrap.addEventListener('click', doClick);
      button.addEventListener('click', doClick);
      text.addEventListener('click', doClick);

      return buttonWrap;
    }

    function buildSceneVisualControlPanel() {
      return;
    }

    function bindSceneVisualControls() {
      if (refs.environment) {
        refs.environment.addEventListener('model-loaded', cacheEnvironmentMaterials);
      }

      if (refs.cyp) {
        refs.cyp.addEventListener('model-loaded', cacheCypMaterials);
      }

      setTimeout(() => {
        cacheEnvironmentMaterials();
        cacheCypMaterials();
      }, 300);
    }


    // =========================================================
    // END IN-SCENE VISUAL CONTROLS
    // =========================================================
    const initialRigPosition = '0 0 -0.20';
    const initialCameraPosition = '0 1.6 0';
    const initialCameraRotation = '0 0 0';

    const VERTICAL_MOVE = {
      speed: 0.45,
      minY: -3.5,
      maxY: 3.5
    };

    const EDIT = {
      MONITOR1_ROOT: {
        position: '1.189 -0.535 26.013',
        rotation: '-56.800 -30.000 0.000',
        scale: '0.640 0.580 0.700'
      },

      MONITOR2_ROOT: {
        position: '1.240 -0.530 0.030',
        rotation: '-90.000 90.000 0.000',
        scale: '0.640 0.580 0.700'
      },

      UI: {
        hudPosition: '0 0 0',
        hudRotation: '0 0 0',
        hudScale: '1 1 1',

        infoPanelPosition: '0.000 0.145 4.000',
        infoPanelScale: '0.920 0.920 0.920',
        buttonRowPosition: '0.000 -0.175 0.000',
        buttonRowScale: '0.920 0.920 0.920',

        panelWidth: 0.86,
        panelHeight: 0.28,

        counterPosition: '0 0.092 0.01',
        titlePosition: '0 0.020 0.01',
        bodyPosition: '0 -0.072 0.01',

        counterWidth: 1.10,
        titleWidth: 1.18,
        bodyWidth: 1.14,

        counterWrapCount: 24,
        titleWrapCount: 24,
        bodyWrapCount: 34
      },

      MONITOR: {
        rigPosition: '-9.5 0.880 -2.495',
        rigRotation: '0.000 80.000 0.000',
        rigScale: '2 2 2',
        modelPosition: '0.180 -0.120 3.940',
        modelRotation: '0.000 -120.000 1.200',
        modelScale: '0.017 0.017 0.017',
        uiAnchorPosition: '0.000 0.175 0.040',
        uiAnchorRotation: '0.000 0.000 0.000',
        uiAnchorScale: '0.150 0.150 0.150'
      },

      COMPARISON_PNG: {
        enabled: true,
        width: 0.18,
        height: 0.18,
        opacity: 0.98,

        inducer: {
          src: './assets/icons/ind.png',
          position: '0.000 0.655 -0.295',
          rotation: '-55.5 180 0',
          scale: '1 1 1'
        },

        prodrug: {
          src: './assets/icons/pro.png',
          position: '0.000 0.655 -0.295',
          rotation: '-55.5 180 0',
          scale: '1 1 1'
        },

        inhibitor: {
          src: './assets/icons/inh.png',
          position: '0.000 0.655 -0.295',
          rotation: '-55.5 180 0',
          scale: '1 1 1'
        }
      },

      SCENE: {
        focusRigPosition: '-2.6 1 -0.9',
        focusRigRotation: '0.000 90.000 -5.00',
        focusRigScale: '0.9 0.9 0.9',
        cypOpacity: 0.07,
        hemeScale: '0.100 0.100 0.100',
        drugScale: '0.090 0.090 0.090',
        hideYellowHemeParts: true
      },

      TIMING: {
        defaultMove: 2400,
        slowMove: 3000,
        longMove: 3600,
        fade: 2600,
        helperFade: 2600,
        cypFade: 1200
      },

      CURVES: {
        sigmaRing4ToNapqi: {
          enabled: true,
          duration: 2400,
          controlPosition: '-0.222 0.050 0.175',
          controlRotation: '-27.000 -348.500 89.400',
          controlScale: '0.090 0.090 0.090',

          startPosition: '-0.108 -0.021 0.100',
          startRotation: '1.000 -295.000 87.400',
          startScale: '0.090 0.090 0.090',

          endPosition: '-0.324 0.025 0.100',
          endRotation: '-24.000 -420.500 89.400',
          endScale: '0.090 0.090 0.090'
        }
      },

      HELPERS: {
        oxygenRadius: 0.033,
        hydrogenRadius: 0.030,

        waterH1Offset: '0.120 0.056 0.000',
        waterH2Offset: '-0.104 0.060 0.026',
        waterBondRadius: 0.0062,

        o2AtomAOffset: '-0.015 0.100 0.070',
        o2AtomBOffset: '-0.250 0.080 0.166',
        o2BondUpperPreShift: '-0.100 -0.022 0.045',
        o2BondLowerPreShift: '-0.100 0.001 0.035',
        o2BondOxoShift: '0.000 0.000 0.000',

        o2BondUpperPreRotation: '-90.000 3.000 0.000',
        o2BondLowerPreRotation: '-92.000 2.500 0.000',
        o2BondOxoRotation: '0.000 0.000 0.000',

        o2BondUpperPreModelScale: '0.300 0.30 0.150',
        o2BondLowerPreModelScale: '0.300 0.30 0.150',
        o2BondOxoModelScale: '0.030 0.30 0.010',

        o2BondUpperShift: '-0.115 -0.017 0.035',
        o2BondLowerShift: '-0.120 -0.004 0.035',

        o2BondUpperRotation: '211.000 -46.000 0.000',
        o2BondLowerRotation: '-156.800 5.000 0.000',

        o2BondUpperModelScale: '0.300 0.30 0.130',
        o2BondLowerModelScale: '0.300 0.30 0.120',

        electronRadius: 0.024,
        protonRadius: 0.022,
        oxoRadius: 0.028
      },

      HYDROGEN_FLIGHT: {
        phenolOffset: '-0.260 0.180 0.180',
        amideOffset: '0.260 0.180 0.180',
        moveDur: 2900,
        fadeDur: 1500
      },

      POSES: {
        mainDrug: {
          // Step 1: starting position
          A: { position: '1.210 0.300 0.000', rotation: '0 -90 90' },

          // Step 2: approaching
          B: { position: '0.510 0.300 0.500', rotation: '0 -280 90' },

          // Step 3 to Step 9: binding / active-site pose
          C: { position: '0.050 0.200 0.250', rotation: '130 -290 0' },

          // Step 10: releasing
          D: { position: '0.150 0.200 0.450', rotation: '130 -290 0' },

          // Step 11: flying away
          E: { position: '-1.050 0.100 0.000', rotation: '180 -270 -90' }
        },

        water: {
          bound: '-0.009 0.086 0.067',
          exit: '0.000 2.000 0.067'
        },

        electron1: {
          start: '-1.200 0.220 0.120',
          target: '-0.020 0.094 0.015'
        },

        oxygen: {
          start: '-1.500 0.500 1.000',
          target: '0.000 0.000 0.060',
          rotation: '0 -11 18',
          detachLocalB: '-1.186 0.093 0.430'
        },

        electron2: {
          start: '-1.200 0.120 0.280',
          target: '-0.330 0.029 0.175'
        },

        proton1: {
          start: '-0.756 0.220 0.620',
          target: '-0.432 0.085 0.267',
          detach: '-1.360 -0.177 0.356'
        },

        proton2: {
          start: '-0.330 -0.020 0.950',
          target: '-0.385 -0.140 0.272',
          detach: '-1.308 -0.392 0.371'
        }
      }
    };

    sceneVisualControls.cypOpacity = clamp(EDIT.SCENE.cypOpacity, 0, 1);
    bindSceneVisualControls();

    const APAP_LOCAL_POSES = {
      correctedApap: {
        apapStatic: { position: '0.000 0.000 0.000', rotation: '0.000 0.000 0.000', scale: '0.090 0.090 0.090' },
        apapOPhenol: { position: '0.000 0.000 0.000', rotation: '0.000 0.000 0.000', scale: '0.090 0.090 0.090' },
        apapHPhenol: { position: '0.000 0.000 0.000', rotation: '0.000 0.000 0.000', scale: '0.090 0.090 0.090' },
        apapNAmide: { position: '0.000 0.000 0.000', rotation: '0.000 0.000 0.000', scale: '0.090 0.090 0.090' },
        apapHAmide: { position: '0.000 0.000 0.000', rotation: '0.000 0.000 0.000', scale: '0.090 0.090 0.090' },

        sigmaApapOH: { position: '-0.535 -0.005 0.095', rotation: '0.000 -22.000 0.000', scale: '0.090 0.090 0.090' },
        sigmaApapC1O: { position: '-0.505 0.000 0.000', rotation: '0.000 -92.000 0.000', scale: '0.090 0.090 0.090' },
        sigmaApap34: { position: '-0.370 -0.003 -0.024', rotation: '3.000 -28.000 0.000', scale: '0.045 0.045 0.045' },

        sigmaRing1: { position: '-0.370 0.000 0.000', rotation: '0.000 -28.000 0.000', scale: '0.090 0.090 0.090' },
        sigmaRing2: { position: '-0.320 0.000 -0.100', rotation: '0.000 -88.000 0.000', scale: '0.090 0.090 0.090' },
        sigmaRing3: { position: '-0.190 0.000 -0.098', rotation: '0.000 210.000 0.000', scale: '0.090 0.090 0.090' },
        sigmaRing4: { position: '-0.130 0.000 -0.010', rotation: '0.000 30.000 0.000', scale: '0.090 0.090 0.090' },

        sigmaApapC4N: { position: '0.000 0.000 0.000', rotation: '0.000 0.000 0.000', scale: '0.100 0.100 0.100' },
        sigmaApapNH: { position: '0.000 0.000 0.000', rotation: '0.000 0.000 0.000', scale: '0.090 0.090 0.090' }
      },

      finalNapqi: {
        apapStatic: { position: '0.000 0.000 0.000', rotation: '0.000 0.000 0.000', scale: '0.090 0.090 0.090' },
        apapOPhenol: { position: '0.000 0.000 0.000', rotation: '0.000 0.000 0.000', scale: '0.090 0.090 0.090' },
        apapHPhenol: { position: '-0.050 0.000 0.050', rotation: '0.000 0.000 0.000', scale: '0.090 0.090 0.090' },
        apapNAmide: { position: '0.000 0.000 0.000', rotation: '0.000 0.000 0.000', scale: '0.090 0.090 0.090' },
        apapHAmide: { position: '0.060 0.000 0.060', rotation: '0.000 0.000 0.000', scale: '0.090 0.090 0.090' },

        sigmaApapOH: { position: '-0.395 -0.003 0.013', rotation: '0.000 89.000 0.000', scale: '0.090 0.090 0.090' },
        sigmaApapC1O: { position: '-0.505 -0.005 -0.002', rotation: '0.000 -92.000 0.000', scale: '0.040 0.060 0.090' },
        sigmaApap34: { position: '-0.371 -0.010 -0.004', rotation: '3.000 -28.000 0.000', scale: '0.090 0.090 0.080' },

        sigmaRing1: { position: '-0.372 -0.005 0.000', rotation: '0.000 -28.000 0.000', scale: '0.090 0.090 0.090' },
        sigmaRing2: { position: '-0.318 0.000 -0.110', rotation: '0.000 -89.000 0.000', scale: '0.090 0.090 0.090' },
        sigmaRing3: { position: '-0.191 0.000 -0.104', rotation: '0.000 92.000 0.000', scale: '0.090 0.090 0.090' },
        sigmaRing4: { position: '-0.130 0.000 -0.010', rotation: '0.000 30.000 0.000', scale: '0.090 0.090 0.090' },

        sigmaApapC4N: { position: '-0.026 0.000 -0.004', rotation: '0.000 0.000 0.000', scale: '0.060 0.060 0.040' },
        sigmaApapNH: { position: '-0.020 0.000 0.005', rotation: '0.000 -115.000 0.000', scale: '0.090 0.090 0.090' }
      }
    };

    const infoPanelBg = refs.infoPanel ? refs.infoPanel.querySelector('a-plane') : null;

    function parseVec3(value) {
      if (typeof value === 'string') {
        const [x, y, z] = value.trim().split(/\s+/).map(Number);
        return new THREE.Vector3(x, y, z);
      }
      if (value && typeof value.x === 'number') {
        return new THREE.Vector3(value.x, value.y, value.z);
      }
      return new THREE.Vector3(0, 0, 0);
    }

    function vecToStr(v) {
      return `${v.x.toFixed(3)} ${v.y.toFixed(3)} ${v.z.toFixed(3)}`;
    }

    function getEntityWorldPosition(entity) {
      const out = new THREE.Vector3(0, 0, 0);
      if (entity?.object3D) entity.object3D.getWorldPosition(out);
      return out;
    }

    function setEntityWorldPosition(entity, worldPosition) {
      if (!entity?.object3D) return;

      const parent = entity.object3D.parent;
      const local = worldPosition.clone();

      if (parent) {
        parent.worldToLocal(local);
      }

      entity.object3D.position.copy(local);
      entity.setAttribute('position', vecToStr(local));
    }

    function getMainDrugEntities() {
      return [
        refs.apapStatic,
        refs.apapOPhenol,
        refs.apapHPhenol,
        refs.apapNAmide,
        refs.apapHAmide,
        refs.sigmaApapOH,
        refs.sigmaApapC1O,
        refs.sigmaApap34,
        refs.sigmaRing1,
        refs.sigmaRing2,
        refs.sigmaRing3,
        refs.sigmaRing4,
        refs.sigmaApapC4N,
        refs.sigmaApapNH
      ].filter(Boolean);
    }

    function getDrugEntities() {
      return getMainDrugEntities();
    }

    function getDrugLeadEntity() {
      return refs.apapStatic || getMainDrugEntities()[0] || null;
    }

    function getPartsEntities() {
      return [
        refs.apapOPhenol,
        refs.apapHPhenol,
        refs.apapNAmide,
        refs.apapHAmide,
        refs.sigmaApapOH,
        refs.sigmaApapC1O,
        refs.sigmaApap34,
        refs.sigmaRing1,
        refs.sigmaRing2,
        refs.sigmaRing3,
        refs.sigmaRing4,
        refs.sigmaApapC4N,
        refs.sigmaApapNH
      ].filter(Boolean);
    }

    function getPartsLeadEntity() {
      return refs.apapNAmide || refs.apapOPhenol || getPartsEntities()[0] || null;
    }

    function getScaleOf(entity, fallback = '1 1 1') {
      return parseVec3(entity?.getAttribute('scale') || fallback);
    }

    function eulerDegToQuaternion(x, y, z) {
      const euler = new THREE.Euler(
        THREE.MathUtils.degToRad(x),
        THREE.MathUtils.degToRad(y),
        THREE.MathUtils.degToRad(z),
        'XYZ'
      );
      const q = new THREE.Quaternion();
      q.setFromEuler(euler);
      return q;
    }

    function quaternionToEulerDeg(q) {
      const euler = new THREE.Euler().setFromQuaternion(q, 'XYZ');
      return new THREE.Vector3(
        THREE.MathUtils.radToDeg(euler.x),
        THREE.MathUtils.radToDeg(euler.y),
        THREE.MathUtils.radToDeg(euler.z)
      );
    }

    function getCurrentLocalPosition(entity) {
      if (entity?.object3D) return entity.object3D.position.clone();
      return parseVec3(entity?.getAttribute('position') || '0 0 0');
    }

    function getCurrentLocalQuaternion(entity) {
      if (entity?.object3D) return entity.object3D.quaternion.clone();

      const rot = parseVec3(entity?.getAttribute('rotation') || '0 0 0');
      return eulerDegToQuaternion(rot.x, rot.y, rot.z);
    }

    function getCurrentLocalScale(entity, fallback = '1 1 1') {
      if (entity?.object3D) return entity.object3D.scale.clone();
      return getScaleOf(entity, fallback);
    }

    function buildLocalMatrix(position, quaternion, scale) {
      const matrix = new THREE.Matrix4();
      matrix.compose(position.clone(), quaternion.clone(), scale.clone());
      return matrix;
    }

    function setEntityGroupTransform(entities, lead, nextPosition, nextRotation, nextScale = null) {
      if (!lead || !entities.length) return;

      const currentLeadPosition = getCurrentLocalPosition(lead);
      const currentLeadQuaternion = getCurrentLocalQuaternion(lead);
      const currentLeadScale = getCurrentLocalScale(lead, EDIT.SCENE.drugScale);

      const targetLeadQuaternion = eulerDegToQuaternion(
        nextRotation.x,
        nextRotation.y,
        nextRotation.z
      );

      const targetLeadScale = nextScale
        ? nextScale.clone()
        : currentLeadScale.clone();

      const currentLeadMatrix = buildLocalMatrix(
        currentLeadPosition,
        currentLeadQuaternion,
        currentLeadScale
      );

      const targetLeadMatrix = buildLocalMatrix(
        nextPosition.clone(),
        targetLeadQuaternion,
        targetLeadScale
      );

      const inverseCurrentLeadMatrix = currentLeadMatrix.clone().invert();

      entities.forEach((entity) => {
        const currentEntityPosition = getCurrentLocalPosition(entity);
        const currentEntityQuaternion = getCurrentLocalQuaternion(entity);
        const currentEntityScale = getCurrentLocalScale(entity, EDIT.SCENE.drugScale);

        const currentEntityMatrix = buildLocalMatrix(
          currentEntityPosition,
          currentEntityQuaternion,
          currentEntityScale
        );

        const relativeMatrix = inverseCurrentLeadMatrix.clone().multiply(currentEntityMatrix);
        const targetEntityMatrix = targetLeadMatrix.clone().multiply(relativeMatrix);

        const nextEntityPosition = new THREE.Vector3();
        const nextEntityQuaternion = new THREE.Quaternion();
        const nextEntityScale = new THREE.Vector3();

        targetEntityMatrix.decompose(
          nextEntityPosition,
          nextEntityQuaternion,
          nextEntityScale
        );

        const nextEntityEuler = quaternionToEulerDeg(nextEntityQuaternion);

        entity.setAttribute('position', vecToStr(nextEntityPosition));
        entity.setAttribute(
          'rotation',
          `${nextEntityEuler.x.toFixed(1)} ${nextEntityEuler.y.toFixed(1)} ${nextEntityEuler.z.toFixed(1)}`
        );
        entity.setAttribute('scale', vecToStr(nextEntityScale));
      });
    }

    function setDrugGroupTransform(nextPosition, nextRotation, nextScale = null) {
      const lead = getDrugLeadEntity();
      const entities = getMainDrugEntities();
      setEntityGroupTransform(entities, lead, nextPosition, nextRotation, nextScale);
    }

    function setPartsGroupTransform(nextPosition, nextRotation, nextScale = null) {
      const lead = getPartsLeadEntity();
      const entities = getPartsEntities();
      setEntityGroupTransform(entities, lead, nextPosition, nextRotation, nextScale);
    }

    function stopEntityListMotion(entityList) {
      entityList.forEach((entity) => stopEntityMotion(entity));
    }

    function stopDrugGroupMotion() {
      stopEntityListMotion(getMainDrugEntities());
    }

    function stopPartsGroupMotion() {
      stopEntityListMotion(getPartsEntities());
    }

    function styleTextEntity(el, { position, width, wrapCount, color }) {
      if (!el) return;
      el.setAttribute('position', position);
      el.setAttribute('text', 'align', 'center');
      el.setAttribute('text', 'width', width);
      el.setAttribute('text', 'wrapCount', wrapCount);
      el.setAttribute('text', 'color', color);
    }

    function hideEntityNow(entity) {
      if (!entity) return;
      entity.setAttribute('visible', false);

      if (entity.object3D) {
        entity.object3D.visible = false;
      }
    }

    function isInsideComparisonArea(entity) {
      if (!entity) return false;

      const comparisonParents = [
        refs.comparisonRig,
        refs.inducerBoxGroup,
        refs.normalBoxGroup,
        refs.inhibitorBoxGroup
      ].filter(Boolean);

      return comparisonParents.some((parent) => parent.contains(entity));
    }

    function hideExtraTopBoxGlbs() {
      const allModelEntities = Array.from(document.querySelectorAll('[gltf-model]'));

      allModelEntities.forEach((entity) => {
        const modelPath = String(entity.getAttribute('gltf-model') || '').toLowerCase();

        const isComparisonBoxModel =
          modelPath.includes('ind.glb') ||
          modelPath.includes('inh.glb') ||
          modelPath.includes('pro.glb');

        if (!isComparisonBoxModel) return;

        // KEEP the lower animated comparison boxes
        if (isInsideComparisonArea(entity)) return;

        // HIDE only the extra copies outside the comparison area
        hideEntityNow(entity);
      });
    }

    function ensureComparisonImagePlane(parentEntity, planeId, config) {
      if (!parentEntity || !config || !config.src) return;

      let plane = document.getElementById(planeId);

      if (!plane) {
        plane = document.createElement('a-plane');
        plane.setAttribute('id', planeId);
        parentEntity.appendChild(plane);
      }

      plane.setAttribute('position', config.position);
      plane.setAttribute('rotation', config.rotation);
      plane.setAttribute('scale', config.scale || '1 1 1');
      plane.setAttribute('width', EDIT.COMPARISON_PNG.width);
      plane.setAttribute('height', EDIT.COMPARISON_PNG.height);
      plane.setAttribute(
        'material',
        `src: url(${config.src}); transparent: true; opacity: ${EDIT.COMPARISON_PNG.opacity}; side: double; shader: flat`
      );
      plane.setAttribute('visible', true);
    }
    function hideExtraCopiedComparisonTexts() {
      const textEntities = Array.from(document.querySelectorAll('[text], a-text'));

      textEntities.forEach((entity) => {
        let value = '';

        if (entity.tagName && entity.tagName.toLowerCase() === 'a-text') {
          value = String(entity.getAttribute('value') || '');
        } else {
          const textAttr = entity.getAttribute('text');
          if (textAttr && typeof textAttr === 'object') {
            value = String(textAttr.value || '');
          } else if (typeof textAttr === 'string') {
            value = textAttr;
          }
        }

        const normalized = value.toLowerCase();

        const isComparisonLabel =
          normalized.includes('inducer') ||
          normalized.includes('inhibitor') ||
          normalized.includes('prodrug');

        if (!isComparisonLabel) return;

        // KEEP the real labels inside the comparison area
        if (isInsideComparisonArea(entity)) return;

        // HIDE copied floating labels elsewhere
        hideEntityNow(entity);
      });
    }
    function ensureAnimatedBoxPngs() {
      if (!EDIT.COMPARISON_PNG.enabled) return;

      ensureComparisonImagePlane(
        refs.inducerBoxGroup,
        'inducerImagePlane',
        EDIT.COMPARISON_PNG.inducer
      );

      ensureComparisonImagePlane(
        refs.normalBoxGroup,
        'prodrugImagePlane',
        EDIT.COMPARISON_PNG.prodrug
      );

      ensureComparisonImagePlane(
        refs.inhibitorBoxGroup,
        'inhibitorImagePlane',
        EDIT.COMPARISON_PNG.inhibitor
      );
    }

    function applyHUDLayout() {
      if (refs.monitorRig) {
        refs.monitorRig.setAttribute('position', EDIT.MONITOR.rigPosition);
        refs.monitorRig.setAttribute('rotation', EDIT.MONITOR.rigRotation);
        refs.monitorRig.setAttribute('scale', EDIT.MONITOR.rigScale);
      }

      if (refs.monitor) {
        refs.monitor.setAttribute('position', EDIT.MONITOR.modelPosition);
        refs.monitor.setAttribute('rotation', EDIT.MONITOR.modelRotation);
        refs.monitor.setAttribute('scale', EDIT.MONITOR.modelScale);
      }

      if (refs.monitorUiAnchor) {
        refs.monitorUiAnchor.setAttribute('position', EDIT.MONITOR.uiAnchorPosition);
        refs.monitorUiAnchor.setAttribute('rotation', EDIT.MONITOR.uiAnchorRotation);
        refs.monitorUiAnchor.setAttribute('scale', EDIT.MONITOR.uiAnchorScale);
      }

      // LOWER SCREEN ROOT
      if (refs.monitor1UiRoot) {
        refs.monitor1UiRoot.setAttribute('position', EDIT.MONITOR1_ROOT.position);
        refs.monitor1UiRoot.setAttribute('rotation', EDIT.MONITOR1_ROOT.rotation);
        refs.monitor1UiRoot.setAttribute('scale', EDIT.MONITOR1_ROOT.scale);
      }

      // UPPER SCREEN ROOT
      if (refs.monitor2UiRoot) {
        refs.monitor2UiRoot.setAttribute('position', EDIT.MONITOR2_ROOT.position);
        refs.monitor2UiRoot.setAttribute('rotation', EDIT.MONITOR2_ROOT.rotation);
        refs.monitor2UiRoot.setAttribute('scale', EDIT.MONITOR2_ROOT.scale);
      }

      // HUD stays neutral inside monitor1UiRoot
      if (refs.hud) {
        refs.hud.setAttribute('position', EDIT.UI.hudPosition);
        refs.hud.setAttribute('rotation', EDIT.UI.hudRotation);
        refs.hud.setAttribute('scale', EDIT.UI.hudScale);
      }

      if (refs.infoPanel) {
        refs.infoPanel.setAttribute('position', EDIT.UI.infoPanelPosition);
        refs.infoPanel.setAttribute('rotation', '0 0 0');
        refs.infoPanel.setAttribute('scale', EDIT.UI.infoPanelScale);
      }

      if (refs.buttonRow) {
        refs.buttonRow.setAttribute('position', EDIT.UI.buttonRowPosition);
        refs.buttonRow.setAttribute('scale', EDIT.UI.buttonRowScale);
      }

      if (infoPanelBg) {
        infoPanelBg.setAttribute('width', EDIT.UI.panelWidth);
        infoPanelBg.setAttribute('height', EDIT.UI.panelHeight);
        infoPanelBg.setAttribute('material', 'opacity', 0);
        infoPanelBg.setAttribute('visible', false);
      }

      styleTextEntity(refs.infoCounter, {
        position: EDIT.UI.counterPosition,
        width: EDIT.UI.counterWidth,
        wrapCount: EDIT.UI.counterWrapCount,
        color: '#7dd3fc'
      });

      styleTextEntity(refs.infoTitle, {
        position: EDIT.UI.titlePosition,
        width: EDIT.UI.titleWidth,
        wrapCount: EDIT.UI.titleWrapCount,
        color: '#ffffff'
      });

      styleTextEntity(refs.infoBody, {
        position: EDIT.UI.bodyPosition,
        width: EDIT.UI.bodyWidth,
        wrapCount: EDIT.UI.bodyWrapCount,
        color: '#dbe7ff'
      });
    }

    function applySceneLayout() {
      if (refs.focusRig) {
        refs.focusRig.setAttribute('position', EDIT.SCENE.focusRigPosition);
        refs.focusRig.setAttribute('rotation', EDIT.SCENE.focusRigRotation || '0 0 0');
        refs.focusRig.setAttribute('scale', EDIT.SCENE.focusRigScale);
      }

      if (refs.partsGroup) {
        refs.partsGroup.setAttribute('position', '0 0 0');
        refs.partsGroup.setAttribute('rotation', '0 0 0');
        refs.partsGroup.setAttribute('scale', '1 1 1');
      }

      if (refs.heme) {
        refs.heme.setAttribute('scale', EDIT.SCENE.hemeScale);
      }

      getDrugEntities().forEach((entity) => {
        entity.setAttribute('scale', EDIT.SCENE.drugScale);
      });

      hideExtraTopBoxGlbs();
      hideExtraCopiedComparisonTexts();
      ensureAnimatedBoxPngs();
    }

    function setText(el, value) {
      if (!el) return;
      el.setAttribute('text', 'value', value);
    }

    function setButtonEnabled(buttonEl, enabled, colorEnabled, colorDisabled = '#374151') {
      if (!buttonEl) return;
      buttonEl.setAttribute('color', enabled ? colorEnabled : colorDisabled);
      buttonEl.setAttribute('material', 'opacity', enabled ? 1 : 0.55);
      buttonEl.dataset.enabled = enabled ? 'true' : 'false';
    }

    function easeInOut(t) {
      return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    }

    function animatePosition(entity, to, dur = EDIT.TIMING.defaultMove, instant = false) {
      if (!entity) return;
      if (instant) {
        entity.removeAttribute('animation__position');
        entity.setAttribute('position', to);
        return;
      }
      entity.setAttribute(
        'animation__position',
        `property: position; to: ${to}; dur: ${dur}; easing: easeInOutQuad`
      );
    }

    function animateRotation(entity, to, dur = EDIT.TIMING.defaultMove, instant = false) {
      if (!entity) return;
      if (instant) {
        entity.removeAttribute('animation__rotation');
        entity.setAttribute('rotation', to);
        return;
      }
      entity.setAttribute(
        'animation__rotation',
        `property: rotation; to: ${to}; dur: ${dur}; easing: easeInOutQuad`
      );
    }

    function animateScale(entity, to, dur = EDIT.TIMING.defaultMove, instant = false) {
      if (!entity) return;
      if (instant) {
        entity.removeAttribute('animation__scale');
        entity.setAttribute('scale', to);
        return;
      }
      entity.setAttribute(
        'animation__scale',
        `property: scale; to: ${to}; dur: ${dur}; easing: easeInOutQuad`
      );
    }

    function lerpVec3(a, b, t) {
      return new THREE.Vector3(
        THREE.MathUtils.lerp(a.x, b.x, t),
        THREE.MathUtils.lerp(a.y, b.y, t),
        THREE.MathUtils.lerp(a.z, b.z, t)
      );
    }

    function quadraticBezierVec3(a, b, c, t) {
      const ab = lerpVec3(a, b, t);
      const bc = lerpVec3(b, c, t);
      return lerpVec3(ab, bc, t);
    }

    function animateTransformAlongCurve(entity, options = {}) {
      if (!entity) return;

      const {
        toPosition,
        toRotation,
        toScale = null,
        controlPosition,
        controlRotation,
        controlScale = null,
        dur = EDIT.TIMING.defaultMove,
        instant = false
      } = options;

      if (!toPosition || !toRotation || !controlPosition || !controlRotation) return;

      stopEntityMotion(entity);

      if (instant) {
        entity.setAttribute('position', toPosition);
        entity.setAttribute('rotation', toRotation);
        if (toScale) entity.setAttribute('scale', toScale);
        return;
      }

      const startPosition = getCurrentLocalPosition(entity);
      const startQuaternion = getCurrentLocalQuaternion(entity);
      const startScale = getCurrentLocalScale(entity, EDIT.SCENE.drugScale);

      const endPosition = parseVec3(toPosition);
      const endRotationVec = parseVec3(toRotation);
      const endQuaternion = eulerDegToQuaternion(endRotationVec.x, endRotationVec.y, endRotationVec.z);
      const endScale = parseVec3(toScale || vecToStr(startScale));

      const controlPositionVec = parseVec3(controlPosition);
      const controlRotationVec = parseVec3(controlRotation);
      const controlQuaternion = eulerDegToQuaternion(
        controlRotationVec.x,
        controlRotationVec.y,
        controlRotationVec.z
      );
      const controlScaleVec = parseVec3(controlScale || vecToStr(startScale));

      const startTime = performance.now();

      function frame(now) {
        const rawT = Math.min(1, (now - startTime) / dur);
        const t = easeInOut(rawT);

        const curvedPosition = quadraticBezierVec3(
          startPosition,
          controlPositionVec,
          endPosition,
          t
        );

        const currentQuaternion = new THREE.Quaternion();

        if (t < 0.5) {
          currentQuaternion.slerpQuaternions(startQuaternion, controlQuaternion, t * 2);
        } else {
          currentQuaternion.slerpQuaternions(controlQuaternion, endQuaternion, (t - 0.5) * 2);
        }

        let currentScale;
        if (t < 0.5) {
          currentScale = lerpVec3(startScale, controlScaleVec, t * 2);
        } else {
          currentScale = lerpVec3(controlScaleVec, endScale, (t - 0.5) * 2);
        }

        const currentEuler = quaternionToEulerDeg(currentQuaternion);

        entity.setAttribute('position', vecToStr(curvedPosition));
        entity.setAttribute(
          'rotation',
          `${currentEuler.x.toFixed(1)} ${currentEuler.y.toFixed(1)} ${currentEuler.z.toFixed(1)}`
        );
        entity.setAttribute('scale', vecToStr(currentScale));

        if (rawT < 1) {
          entity.__curveFrame = requestAnimationFrame(frame);
        } else {
          entity.setAttribute('position', toPosition);
          entity.setAttribute('rotation', toRotation);
          entity.setAttribute('scale', vecToStr(endScale));
          entity.__curveFrame = null;
        }
      }

      entity.__curveFrame = requestAnimationFrame(frame);
    }

    function stopEntityMotion(entity) {
      if (!entity) return;

      entity.removeAttribute('animation__position');
      entity.removeAttribute('animation__rotation');
      entity.removeAttribute('animation__scale');

      if (entity.__curveFrame) {
        cancelAnimationFrame(entity.__curveFrame);
        entity.__curveFrame = null;
      }

      if (entity.__primitiveOpacityFrame) {
        cancelAnimationFrame(entity.__primitiveOpacityFrame);
        entity.__primitiveOpacityFrame = null;
      }

      if (entity.__opacityFrame) {
        cancelAnimationFrame(entity.__opacityFrame);
        entity.__opacityFrame = null;
      }

      if (entity.__releaseTimer) {
        clearTimeout(entity.__releaseTimer);
        entity.__releaseTimer = null;
      }

      if (entity.__hydrogenFadeTimer) {
        clearTimeout(entity.__hydrogenFadeTimer);
        entity.__hydrogenFadeTimer = null;
      }

      if (entity.__fadeDelayTimer) {
        clearTimeout(entity.__fadeDelayTimer);
        entity.__fadeDelayTimer = null;
      }
    }

    function setPrimitiveOpacityRecursive(entity, opacity) {
      if (!entity || !entity.object3D) return;

      entity.object3D.traverse((node) => {
        if (!node.isMesh || !node.material) return;
        const materials = Array.isArray(node.material) ? node.material : [node.material];
        materials.forEach((mat) => {
          mat.transparent = true;
          mat.opacity = opacity;
          mat.depthWrite = opacity >= 0.98;
          mat.needsUpdate = true;
        });
      });

      entity.__primitiveOpacity = opacity;
    }

    function animatePrimitiveOpacity(entity, targetOpacity, dur = EDIT.TIMING.helperFade, hideWhenDone = false) {
      if (!entity) return;
      if (entity.__primitiveOpacityFrame) cancelAnimationFrame(entity.__primitiveOpacityFrame);

      const startOpacity = typeof entity.__primitiveOpacity === 'number'
        ? entity.__primitiveOpacity
        : entity.getAttribute('visible') === false ? 0 : 1;

      if (targetOpacity > 0) entity.setAttribute('visible', true);
      const startTime = performance.now();

      function frame(now) {
        const rawT = Math.min(1, (now - startTime) / dur);
        const t = easeInOut(rawT);
        const value = startOpacity + (targetOpacity - startOpacity) * t;
        setPrimitiveOpacityRecursive(entity, value);

        if (rawT < 1) {
          entity.__primitiveOpacityFrame = requestAnimationFrame(frame);
        } else {
          setPrimitiveOpacityRecursive(entity, targetOpacity);
          if (targetOpacity <= 0 && hideWhenDone) entity.setAttribute('visible', false);
        }
      }

      entity.__primitiveOpacityFrame = requestAnimationFrame(frame);
    }

    function setModelOpacityRecursive(entity, opacity, renderOrder = 0) {
      if (!entity || !entity.object3D) return;

      const isCypEntity = entity === refs.cyp;

      entity.object3D.traverse((node) => {
        if (!node.isMesh) return;

        if (isCypEntity) {
          if (typeof node.userData.__baseCastShadow === 'undefined') {
            node.userData.__baseCastShadow = node.castShadow;
          }

          if (typeof node.userData.__baseReceiveShadow === 'undefined') {
            node.userData.__baseReceiveShadow = node.receiveShadow;
          }

          // Practical shadow fade behavior:
          // standard shadow maps do not smoothly fade with GLB opacity,
          // so we switch the CYP shadow off once it becomes transparent enough.
          const shadowVisible = opacity > 0.55;

          node.castShadow = shadowVisible && node.userData.__baseCastShadow !== false;
          node.receiveShadow = shadowVisible && node.userData.__baseReceiveShadow !== false;
        }

        if (!node.material) return;

        const materials = Array.isArray(node.material) ? node.material : [node.material];

        materials.forEach((mat) => {
          mat.transparent = true;
          mat.opacity = opacity;
          mat.depthWrite = opacity >= 0.98;
          mat.needsUpdate = true;
        });

        node.renderOrder = renderOrder;
      });

      entity.__currentOpacity = opacity;
      entity.__renderOrder = renderOrder;
    }

    function animateModelOpacity(entity, targetOpacity, dur = EDIT.TIMING.fade, hideWhenDone = false) {
      if (!entity) return;
      if (entity.__opacityFrame) cancelAnimationFrame(entity.__opacityFrame);

      const startOpacity = typeof entity.__currentOpacity === 'number'
        ? entity.__currentOpacity
        : entity.getAttribute('visible') === false ? 0 : 1;

      const renderOrder = typeof entity.__renderOrder === 'number' ? entity.__renderOrder : 0;
      if (targetOpacity > 0) entity.setAttribute('visible', true);
      const startTime = performance.now();

      function frame(now) {
        const rawT = Math.min(1, (now - startTime) / dur);
        const t = easeInOut(rawT);
        const value = startOpacity + (targetOpacity - startOpacity) * t;
        setModelOpacityRecursive(entity, value, renderOrder);

        if (rawT < 1) {
          entity.__opacityFrame = requestAnimationFrame(frame);
        } else {
          setModelOpacityRecursive(entity, targetOpacity, renderOrder);
          if (targetOpacity <= 0 && hideWhenDone) entity.setAttribute('visible', false);
        }
      }

      entity.__opacityFrame = requestAnimationFrame(frame);
    }

    function placeBondLocal(entity, fromValue, toValue, radius, color, opacity, emissiveIntensity = 0.10, shiftValue = '0 0 0') {
      const from = parseVec3(fromValue);
      const to = parseVec3(toValue);
      const shift = parseVec3(shiftValue);
      const axis = new THREE.Vector3(0, 1, 0);
      const dir = to.clone().sub(from);
      const len = dir.length();
      const mid = from.clone().add(to).multiplyScalar(0.5).add(shift);

      if (len <= 0.00001) {
        entity.setAttribute('geometry', `primitive: cylinder; radius: ${radius}; height: 0.0001`);
        entity.object3D.position.copy(mid);
        entity.object3D.quaternion.identity();
        entity.object3D.renderOrder = 30;
        return;
      }

      const quat = new THREE.Quaternion().setFromUnitVectors(axis, dir.clone().normalize());
      entity.setAttribute('geometry', `primitive: cylinder; radius: ${radius}; height: ${len}`);
      entity.setAttribute(
        'material',
        `color: ${color}; emissive: ${color}; emissiveIntensity: ${emissiveIntensity}; transparent: true; opacity: ${opacity}`
      );
      entity.object3D.position.copy(mid);
      entity.object3D.quaternion.copy(quat);
      entity.object3D.renderOrder = 30;
    }

    function placeBondModelLocal(
      entity,
      fromValue,
      toValue,
      modelScaleValue = '0.030 0.030 0.030',
      shiftValue = '0 0 0',
      rotationOffsetValue = '0 0 0',
      useDistanceLength = false
    ) {
      if (!entity) return;

      const from = parseVec3(fromValue);
      const to = parseVec3(toValue);
      const shift = parseVec3(shiftValue);
      const baseScale = parseVec3(modelScaleValue);
      const rotationOffset = parseVec3(rotationOffsetValue);

      const axis = new THREE.Vector3(0, 1, 0);
      const dir = to.clone().sub(from);
      const len = dir.length();
      const safeLen = Math.max(len, 0.0001);
      const mid = from.clone().add(to).multiplyScalar(0.5).add(shift);

      const alignQuaternion = new THREE.Quaternion();

      if (len > 0.00001) {
        alignQuaternion.setFromUnitVectors(axis, dir.clone().normalize());
      } else {
        alignQuaternion.identity();
      }

      const rotationOffsetQuaternion = eulerDegToQuaternion(
        rotationOffset.x,
        rotationOffset.y,
        rotationOffset.z
      );

      const finalQuaternion = alignQuaternion.clone().multiply(rotationOffsetQuaternion);

      // IMPORTANT:
      // For sigma_extra1 and sigma_extra2 we want exact manual XYZ scale.
      // For sigma_extra3 we can optionally keep distance-based Y scaling.
      const appliedScale = useDistanceLength
        ? new THREE.Vector3(
          baseScale.x,
          baseScale.y * safeLen,
          baseScale.z
        )
        : baseScale.clone();

      entity.object3D.position.copy(mid);
      entity.object3D.quaternion.copy(finalQuaternion);
      entity.object3D.scale.copy(appliedScale);
      entity.object3D.renderOrder = 30;

      const euler = quaternionToEulerDeg(finalQuaternion);

      entity.setAttribute('position', vecToStr(mid));
      entity.setAttribute(
        'rotation',
        `${euler.x.toFixed(1)} ${euler.y.toFixed(1)} ${euler.z.toFixed(1)}`
      );
      entity.setAttribute('scale', vecToStr(appliedScale));
    }
    function syncO2DoubleBondGeometry(group) {
      const parts = group?._parts;
      if (!parts) return;

      const oxygenAPos = parseVec3(parts.oxygenA.getAttribute('position') || EDIT.HELPERS.o2AtomAOffset);
      const oxygenBPos = parseVec3(parts.oxygenB.getAttribute('position') || EDIT.HELPERS.o2AtomBOffset);

      const upperShift = parseVec3(parts.bondUpperShiftHandle.getAttribute('position') || EDIT.HELPERS.o2BondUpperShift);
      const lowerShift = parseVec3(parts.bondLowerShiftHandle.getAttribute('position') || EDIT.HELPERS.o2BondLowerShift);
      const oxoShift = parseVec3(parts.bondOxoShiftHandle.getAttribute('position') || EDIT.HELPERS.o2BondOxoShift);

      const upperRotation = parseVec3(parts.bondUpperRotationHandle.getAttribute('rotation') || EDIT.HELPERS.o2BondUpperRotation);
      const lowerRotation = parseVec3(parts.bondLowerRotationHandle.getAttribute('rotation') || EDIT.HELPERS.o2BondLowerRotation);
      const oxoRotation = parseVec3(parts.bondOxoRotationHandle.getAttribute('rotation') || EDIT.HELPERS.o2BondOxoRotation);

      placeBondModelLocal(
        parts.bondA,
        oxygenAPos,
        oxygenBPos,
        EDIT.HELPERS.o2BondUpperModelScale,
        upperShift,
        upperRotation,
        false
      );

      placeBondModelLocal(
        parts.bondB,
        oxygenAPos,
        oxygenBPos,
        EDIT.HELPERS.o2BondLowerModelScale,
        lowerShift,
        lowerRotation,
        false
      );

      placeBondModelLocal(
        parts.bondOxo,
        '0 0 0',
        oxygenAPos,
        EDIT.HELPERS.o2BondOxoModelScale,
        oxoShift,
        oxoRotation,
        true
      );
    }

    function runOxygenBDetach(step, instant = false) {
      if (!step?.o2Group || step.o2Group.mode !== 'detachWater') return;

      const parts = helpers.o2Group?._parts;
      if (!parts) return;

      stopO2Animations();

      parts.oxygenA.setAttribute('visible', true);
      parts.oxygenB.setAttribute('visible', true);
      parts.bondA.setAttribute('visible', true);
      parts.bondB.setAttribute('visible', true);
      helpers.proton1.setAttribute('visible', true);
      helpers.proton2.setAttribute('visible', true);

      setEntityOpacityNow(parts.oxygenA, 1);
      setEntityOpacityNow(parts.oxygenB, 1);
      setEntityOpacityNow(parts.bondA, 1);
      setEntityOpacityNow(parts.bondB, 1);
      setEntityOpacityNow(helpers.proton1, 1);
      setEntityOpacityNow(helpers.proton2, 1);

      const oxygenBStartWorld = getEntityWorldPosition(parts.oxygenB);

      const oxygenBEndLocal = parseVec3(EDIT.POSES.oxygen.detachLocalB);
      const oxygenBEndWorld = oxygenBEndLocal.clone();
      parts.oxygenB.object3D.parent.localToWorld(oxygenBEndWorld);

      const deltaWorld = oxygenBEndWorld.clone().sub(oxygenBStartWorld);

      const clusterItems = [
        parts.oxygenB,
        parts.bondA,
        parts.bondB,
        helpers.proton1,
        helpers.proton2
      ];

      const startWorldPositions = clusterItems.map((item) => getEntityWorldPosition(item));
      const dur = step.o2Group.dur || EDIT.TIMING.longMove;

      if (instant) {
        clusterItems.forEach((item, i) => {
          const endWorld = startWorldPositions[i].clone().add(deltaWorld);
          setEntityWorldPosition(item, endWorld);
        });
        return;
      }

      const startTime = performance.now();

      function frame(now) {
        const rawT = Math.min(1, (now - startTime) / dur);
        const t = easeInOut(rawT);
        const deltaNow = deltaWorld.clone().multiplyScalar(t);

        clusterItems.forEach((item, i) => {
          const worldNow = startWorldPositions[i].clone().add(deltaNow);
          setEntityWorldPosition(item, worldNow);
        });

        if (rawT < 1) {
          helpers.o2Group.__detachClusterFrame = requestAnimationFrame(frame);
        } else {
          clusterItems.forEach((item, i) => {
            const endWorld = startWorldPositions[i].clone().add(deltaWorld);
            setEntityWorldPosition(item, endWorld);
          });
          helpers.o2Group.__detachClusterFrame = null;
        }
      }

      helpers.o2Group.__detachClusterFrame = requestAnimationFrame(frame);
    }

    function createGlowSphere({ id, radius, color, opacity = 1, emissiveIntensity = 1.2 }) {
      const el = document.createElement('a-entity');
      el.setAttribute('id', id);
      el.setAttribute('geometry', `primitive: sphere; radius: ${radius}`);
      el.setAttribute(
        'material',
        [
          `color: ${color}`,
          `emissive: ${color}`,
          `emissiveIntensity: ${emissiveIntensity}`,
          'transparent: true',
          `opacity: ${opacity}`
        ].join('; ')
      );
      el.setAttribute('visible', false);
      return el;
    }

    function createWaterGroup(id) {
      const group = document.createElement('a-entity');
      group.setAttribute('id', id);
      group.setAttribute('visible', false);

      const oxygen = document.createElement('a-entity');
      oxygen.setAttribute('geometry', `primitive: sphere; radius: ${EDIT.HELPERS.oxygenRadius}`);
      oxygen.setAttribute('material', 'color: #de493a; emissive: #de493a; emissiveIntensity: 0.12; transparent: true; opacity: 1');

      const hydrogen1 = document.createElement('a-entity');
      hydrogen1.setAttribute('geometry', `primitive: sphere; radius: ${EDIT.HELPERS.hydrogenRadius}`);
      hydrogen1.setAttribute('material', 'color: #f3f7ff; emissive: #ffffff; emissiveIntensity: 0.08; transparent: true; opacity: 1');
      hydrogen1.setAttribute('position', EDIT.HELPERS.waterH1Offset);

      const hydrogen2 = document.createElement('a-entity');
      hydrogen2.setAttribute('geometry', `primitive: sphere; radius: ${EDIT.HELPERS.hydrogenRadius}`);
      hydrogen2.setAttribute('material', 'color: #f3f7ff; emissive: #ffffff; emissiveIntensity: 0.08; transparent: true; opacity: 1');
      hydrogen2.setAttribute('position', EDIT.HELPERS.waterH2Offset);

      const bond1 = document.createElement('a-entity');
      const bond2 = document.createElement('a-entity');
      placeBondLocal(bond1, '0 0 0', EDIT.HELPERS.waterH1Offset, EDIT.HELPERS.waterBondRadius, '#d9e3f0', 0.94, 0.03);
      placeBondLocal(bond2, '0 0 0', EDIT.HELPERS.waterH2Offset, EDIT.HELPERS.waterBondRadius, '#d9e3f0', 0.94, 0.03);

      group.appendChild(bond1);
      group.appendChild(bond2);
      group.appendChild(oxygen);
      group.appendChild(hydrogen1);
      group.appendChild(hydrogen2);

      group._parts = { oxygen, hydrogen1, hydrogen2, bond1, bond2 };
      setPrimitiveOpacityRecursive(group, 1);
      return group;
    }

    function createO2Group(id) {
      const group = document.createElement('a-entity');
      group.setAttribute('id', id);
      group.setAttribute('visible', false);

      const oxygenA = document.createElement('a-entity');
      oxygenA.setAttribute('geometry', `primitive: sphere; radius: ${EDIT.HELPERS.oxygenRadius}`);
      oxygenA.setAttribute('material', 'color: #de493a; emissive: #de493a; emissiveIntensity: 0.12; transparent: true; opacity: 1');
      oxygenA.setAttribute('position', EDIT.HELPERS.o2AtomAOffset);

      const oxygenB = document.createElement('a-entity');
      oxygenB.setAttribute('geometry', `primitive: sphere; radius: ${EDIT.HELPERS.oxygenRadius}`);
      oxygenB.setAttribute('material', 'color: #de493a; emissive: #de493a; emissiveIntensity: 0.12; transparent: true; opacity: 1');
      oxygenB.setAttribute('position', EDIT.HELPERS.o2AtomBOffset);

      const bondUpperShiftHandle = document.createElement('a-entity');
      bondUpperShiftHandle.setAttribute('position', EDIT.HELPERS.o2BondUpperShift);
      bondUpperShiftHandle.setAttribute('visible', false);

      const bondLowerShiftHandle = document.createElement('a-entity');
      bondLowerShiftHandle.setAttribute('position', EDIT.HELPERS.o2BondLowerShift);
      bondLowerShiftHandle.setAttribute('visible', false);

      const bondOxoShiftHandle = document.createElement('a-entity');
      bondOxoShiftHandle.setAttribute('position', EDIT.HELPERS.o2BondOxoShift);
      bondOxoShiftHandle.setAttribute('visible', false);

      const bondUpperRotationHandle = document.createElement('a-entity');
      bondUpperRotationHandle.setAttribute('rotation', EDIT.HELPERS.o2BondUpperRotation);
      bondUpperRotationHandle.setAttribute('visible', false);

      const bondLowerRotationHandle = document.createElement('a-entity');
      bondLowerRotationHandle.setAttribute('rotation', EDIT.HELPERS.o2BondLowerRotation);
      bondLowerRotationHandle.setAttribute('visible', false);

      const bondOxoRotationHandle = document.createElement('a-entity');
      bondOxoRotationHandle.setAttribute('rotation', EDIT.HELPERS.o2BondOxoRotation);
      bondOxoRotationHandle.setAttribute('visible', false);

      const bondA = document.createElement('a-entity');
      bondA.setAttribute('gltf-model', 'url(./assets/models/sigma_extra1.glb)');
      bondA.setAttribute('visible', false);

      const bondB = document.createElement('a-entity');
      bondB.setAttribute('gltf-model', 'url(./assets/models/sigma_extra2.glb)');
      bondB.setAttribute('visible', false);

      const bondOxo = document.createElement('a-entity');
      bondOxo.setAttribute('gltf-model', 'url(./assets/models/sigma_extra3.glb)');
      bondOxo.setAttribute('visible', false);

      [bondA, bondB, bondOxo].forEach((bondEntity) => {
        bondEntity.addEventListener('model-loaded', () => {
          syncO2DoubleBondGeometry(group);
        });
      });

      group.appendChild(bondUpperShiftHandle);
      group.appendChild(bondLowerShiftHandle);
      group.appendChild(bondOxoShiftHandle);
      group.appendChild(bondUpperRotationHandle);
      group.appendChild(bondLowerRotationHandle);
      group.appendChild(bondOxoRotationHandle);
      group.appendChild(bondA);
      group.appendChild(bondB);
      group.appendChild(bondOxo);
      group.appendChild(oxygenA);
      group.appendChild(oxygenB);

      group._parts = {
        oxygenA,
        oxygenB,
        bondA,
        bondB,
        bondOxo,
        bondUpperShiftHandle,
        bondLowerShiftHandle,
        bondOxoShiftHandle,
        bondUpperRotationHandle,
        bondLowerRotationHandle,
        bondOxoRotationHandle
      };

      syncO2DoubleBondGeometry(group);
      setPrimitiveOpacityRecursive(group, 1);
      return group;
    }

    function createHelperEntities(parent) {
      const helperRoot = document.createElement('a-entity');
      helperRoot.setAttribute('id', 'helperRoot');
      parent.appendChild(helperRoot);

      const restingWater = createWaterGroup('restingWater');
      const o2Group = createO2Group('o2Group');

      const electron1 = createGlowSphere({ id: 'electron1', radius: EDIT.HELPERS.electronRadius, color: '#f3fc7d', opacity: 1, emissiveIntensity: 1.45 });
      const electron2 = createGlowSphere({ id: 'electron2', radius: EDIT.HELPERS.electronRadius, color: '#f3fc7d', opacity: 1, emissiveIntensity: 1.45 });
      const proton1 = createGlowSphere({ id: 'proton1', radius: EDIT.HELPERS.protonRadius, color: '#ffffff', opacity: 0.98, emissiveIntensity: 1.0 });
      const proton2 = createGlowSphere({ id: 'proton2', radius: EDIT.HELPERS.protonRadius, color: '#ffffff', opacity: 0.98, emissiveIntensity: 1.0 });
      const oxoSpecies = createGlowSphere({ id: 'oxoSpecies', radius: EDIT.HELPERS.oxoRadius, color: '#ffb45c', opacity: 0.95, emissiveIntensity: 1.2 });

      helperRoot.appendChild(restingWater);
      helperRoot.appendChild(o2Group);
      helperRoot.appendChild(electron1);
      helperRoot.appendChild(electron2);
      helperRoot.appendChild(proton1);
      helperRoot.appendChild(proton2);
      helperRoot.appendChild(oxoSpecies);

      return { helperRoot, restingWater, o2Group, electron1, electron2, proton1, proton2, oxoSpecies };
    }

    function hideYellowHemeParts(entity) {
      if (!entity || !EDIT.SCENE.hideYellowHemeParts) return;

      const applyNow = () => {
        if (!entity.object3D) return;

        entity.object3D.traverse((node) => {
          if (!node.isMesh || !node.material) return;
          const materials = Array.isArray(node.material) ? node.material : [node.material];
          materials.forEach((mat) => {
            if (!mat.color) return;
            const r = mat.color.r;
            const g = mat.color.g;
            const b = mat.color.b;
            if (r > 0.70 && g > 0.52 && b < 0.30) {
              mat.transparent = true;
              mat.opacity = 0.0;
              mat.needsUpdate = true;
            }
          });
        });
      };

      entity.addEventListener('model-loaded', applyNow);
      window.setTimeout(applyNow, 300);
      window.setTimeout(applyNow, 900);
      window.setTimeout(applyNow, 1600);
    }

    function prepareModel(entity, opacity, renderOrder) {
      if (!entity) return;
      entity.__renderOrder = renderOrder;

      const applyNow = () => {
        setModelOpacityRecursive(entity, opacity, renderOrder);
      };

      entity.addEventListener('model-loaded', applyNow);
      window.setTimeout(applyNow, 300);
      window.setTimeout(applyNow, 900);
      window.setTimeout(applyNow, 1600);
    }

    function applyEntityState(entity, state, instant = false) {
      if (!entity || !state) return;

      stopEntityMotion(entity);

      if (typeof state.visible !== 'undefined' && state.visible === false) {
        entity.setAttribute('visible', false);
        return;
      }

      if (typeof state.visible !== 'undefined' && state.visible === true) {
        entity.setAttribute('visible', true);
      }

      if (state.startPosition) entity.setAttribute('position', state.startPosition);
      if (state.startRotation) entity.setAttribute('rotation', state.startRotation);
      if (state.startScale) entity.setAttribute('scale', state.startScale);
      if (typeof state.startOpacity === 'number') {
        setPrimitiveOpacityRecursive(entity, state.startOpacity);
      }

      if (state.position) {
        animatePosition(entity, state.position, state.dur || EDIT.TIMING.defaultMove, instant);
      }

      if (state.rotation) {
        animateRotation(entity, state.rotation, state.dur || EDIT.TIMING.defaultMove, instant);
      }

      if (state.scale) {
        animateScale(entity, state.scale, state.dur || EDIT.TIMING.defaultMove, instant);
      }

      if (typeof state.opacity === 'number') {
        if (instant) {
          setPrimitiveOpacityRecursive(entity, state.opacity);
          if (state.opacity <= 0) entity.setAttribute('visible', false);
        } else {
          const runOpacity = () => {
            animatePrimitiveOpacity(
              entity,
              state.opacity,
              state.fadeDur || state.dur || EDIT.TIMING.helperFade,
              state.opacity <= 0
            );
          };

          if (state.fadeDelay && state.fadeDelay > 0) {
            entity.__fadeDelayTimer = window.setTimeout(() => {
              runOpacity();
              entity.__fadeDelayTimer = null;
            }, state.fadeDelay);
          } else {
            runOpacity();
          }
        }
      }
    }

    function setRingAppearance(step) {
      if (!refs.activeSiteRing) return;
      refs.activeSiteRing.setAttribute('visible', !!step.ringVisible);
      if (!step.ringVisible) return;

      const ringColor = step.ringColor || '#7dd3fc';
      const ringOpacity = typeof step.ringOpacity === 'number' ? step.ringOpacity : 0.42;
      refs.activeSiteRing.setAttribute('material', 'color', ringColor);
      refs.activeSiteRing.setAttribute('material', 'emissive', ringColor);
      refs.activeSiteRing.setAttribute('material', 'emissiveIntensity', 0.85);
      refs.activeSiteRing.setAttribute('material', 'opacity', ringOpacity);
    }

    const helpers = createHelperEntities(refs.focusRig || scene);

    function setEntityOpacityNowModel(entity, opacity) {
      if (!entity) return;
      setModelOpacityRecursive(entity, opacity, 6);
      entity.setAttribute('visible', opacity > 0);
    }

    function setExactTransform(entity, position, rotation, scale) {
      if (!entity) return;
      stopEntityMotion(entity);
      if (position) entity.setAttribute('position', position);
      if (rotation) entity.setAttribute('rotation', rotation);
      if (scale) entity.setAttribute('scale', scale);
    }

    function animateExactTransform(entity, position, rotation, scale, instant = false, dur = EDIT.TIMING.slowMove) {
      if (!entity) return;

      if (position) animatePosition(entity, position, dur, instant);
      if (rotation) animateRotation(entity, rotation, dur, instant);
      if (scale) animateScale(entity, scale, dur, instant);
    }

    function hideUnusedPiPieces() {
      // PI pieces were removed from the project.
    }

    function setAllDrugPiecesVisible() {
      getMainDrugEntities().forEach((entity) => setEntityOpacityNowModel(entity, 1));
    }

    function getDrugPoseByName(name) {
      return APAP_LOCAL_POSES[name] || null;
    }

    function applyDrugLocalPose(
      poseName,
      instant = false,
      dur = EDIT.TIMING.slowMove
    ) {
      const pose = getDrugPoseByName(poseName);
      if (!pose) return;

      Object.entries(pose).forEach(([key, transform]) => {
        const entity = refs[key];
        if (!entity) return;

        entity.setAttribute('visible', true);

        if (instant) {
          setExactTransform(entity, transform.position, transform.rotation, transform.scale);
        } else {
          animateExactTransform(
            entity,
            transform.position,
            transform.rotation,
            transform.scale,
            false,
            dur
          );
        }

        setEntityOpacityNowModel(entity, 1);
      });
    }

    function applyDrugLocalPoseExcept(
      poseName,
      excludedKeys = [],
      instant = false,
      dur = EDIT.TIMING.slowMove
    ) {
      const pose = getDrugPoseByName(poseName);
      if (!pose) return;

      Object.entries(pose).forEach(([key, transform]) => {
        if (excludedKeys.includes(key)) return;

        const entity = refs[key];
        if (!entity) return;

        entity.setAttribute('visible', true);

        if (instant) {
          setExactTransform(entity, transform.position, transform.rotation, transform.scale);
        } else {
          animateExactTransform(
            entity,
            transform.position,
            transform.rotation,
            transform.scale,
            false,
            dur
          );
        }

        setEntityOpacityNowModel(entity, 1);
      });
    }

    function applySingleDrugPiecePose(
      poseName,
      key,
      instant = false,
      dur = EDIT.TIMING.slowMove
    ) {
      const pose = getDrugPoseByName(poseName);
      if (!pose) return;

      const transform = pose[key];
      const entity = refs[key];

      if (!transform || !entity) return;

      entity.setAttribute('visible', true);

      if (instant) {
        setExactTransform(entity, transform.position, transform.rotation, transform.scale);
      } else {
        animateExactTransform(
          entity,
          transform.position,
          transform.rotation,
          transform.scale,
          false,
          dur
        );
      }

      setEntityOpacityNowModel(entity, 1);
    }

    function clearDrugReleaseTimer() {
      if (!refs.drugGroup) return;

      if (refs.drugGroup.__releaseTimer) {
        clearTimeout(refs.drugGroup.__releaseTimer);
        refs.drugGroup.__releaseTimer = null;
      }
    }

    function animateReleaseThenFlyAway(instant = false) {
      clearDrugReleaseTimer();

      if (!refs.drugGroup) return;

      if (instant) {
        applyMainDrugPose('E', true, 0);
        return;
      }

      // First small release move
      applyMainDrugPose('D', false, 1600);

      // Then fly farther away
      refs.drugGroup.__releaseTimer = window.setTimeout(() => {
        applyMainDrugPose('E', false, EDIT.TIMING.longMove);
        refs.drugGroup.__releaseTimer = null;
      }, 1650);
    }


    function setDrugHydrogenVisibility(showPhenolH, showAmideH) {
      if (refs.apapHPhenol) setEntityOpacityNowModel(refs.apapHPhenol, showPhenolH ? 1 : 0);
      if (refs.apapHAmide) setEntityOpacityNowModel(refs.apapHAmide, showAmideH ? 1 : 0);
    }

    function clearHydrogenFlightTimers() {
      [refs.apapHPhenol, refs.apapHAmide].forEach((entity) => {
        if (!entity) return;

        if (entity.__hydrogenFadeTimer) {
          clearTimeout(entity.__hydrogenFadeTimer);
          entity.__hydrogenFadeTimer = null;
        }
      });
    }

    function animateHydrogenFlyAway(entity, offsetStr, instant = false) {
      if (!entity) return;

      if (entity.__hydrogenFadeTimer) {
        clearTimeout(entity.__hydrogenFadeTimer);
        entity.__hydrogenFadeTimer = null;
      }

      entity.setAttribute('visible', true);
      setEntityOpacityNowModel(entity, 1);

      const startPos = getCurrentLocalPosition(entity);
      const targetPos = startPos.clone().add(parseVec3(offsetStr));

      if (instant) {
        entity.setAttribute('position', vecToStr(targetPos));
        setEntityOpacityNowModel(entity, 0);
        return;
      }

      animatePosition(
        entity,
        vecToStr(targetPos),
        EDIT.HYDROGEN_FLIGHT.moveDur,
        false
      );

      entity.__hydrogenFadeTimer = window.setTimeout(() => {
        animateModelOpacity(
          entity,
          0,
          EDIT.HYDROGEN_FLIGHT.fadeDur,
          true
        );
        entity.__hydrogenFadeTimer = null;
      }, EDIT.HYDROGEN_FLIGHT.moveDur);
    }

    function applyDrugPiecesForStep(index, instant = false) {
      clearHydrogenFlightTimers();
      clearDrugReleaseTimer();
      setAllDrugPiecesVisible();

      let poseLetter = 'A';
      let moveDur = EDIT.TIMING.defaultMove;

      // Step 1 = start
      if (index === 0) {
        poseLetter = 'A';
        moveDur = EDIT.TIMING.defaultMove;
      }
      // Step 2 = approach
      else if (index === 1) {
        poseLetter = 'B';
        moveDur = EDIT.TIMING.defaultMove;
      }
      // Step 3 to Step 11 = stay in active-site pose
      else if (index >= 2 && index <= 10) {
        poseLetter = 'C';
        moveDur = EDIT.TIMING.slowMove;
      }
      // Step 12 = release
      else {
        poseLetter = 'C';
        moveDur = EDIT.TIMING.slowMove;
      }

      applyMainDrugPose(poseLetter, instant, moveDur);

      // Steps 1-9 = APAP
      if (index <= 8) {
        applyDrugLocalPose('correctedApap', instant, moveDur);
        setDrugHydrogenVisibility(true, true);
        return;
      }

      // Step 10 = hydrogens leave, but keep APAP scaffold for a separate transformation step
      if (index === 9) {
        applyDrugLocalPoseExcept(
          'correctedApap',
          ['apapHPhenol', 'apapHAmide'],
          instant,
          moveDur
        );

        applySingleDrugPiecePose('correctedApap', 'apapHPhenol', true, 0);
        applySingleDrugPiecePose('correctedApap', 'apapHAmide', true, 0);

        animateHydrogenFlyAway(
          refs.apapHPhenol,
          EDIT.HYDROGEN_FLIGHT.phenolOffset,
          instant
        );

        animateHydrogenFlyAway(
          refs.apapHAmide,
          EDIT.HYDROGEN_FLIGHT.amideOffset,
          instant
        );

        return;
      }

      // Step 11 = now the structure changes to NAPQI in place
      if (index === 10) {
        applyDrugLocalPose('finalNapqi', instant, moveDur);
        setDrugHydrogenVisibility(false, false);
        return;
      }

      // Step 12 = release NAPQI
      applyDrugLocalPose('finalNapqi', instant, moveDur);
      setDrugHydrogenVisibility(false, false);
      animateReleaseThenFlyAway(instant);
    }

    function applyMainDrugPose(letter, instant = false, dur = EDIT.TIMING.defaultMove) {
      const pose = EDIT.POSES.mainDrug?.[letter];
      if (!pose) return;

      setDynamicDrugPose(
        pose.position,
        pose.rotation,
        instant,
        dur
      );
    }

    function setDynamicDrugPose(position, rotation, instant = false, dur = EDIT.TIMING.defaultMove) {
      if (!refs.drugGroup) return;

      const nextPosition = position || refs.drugGroup.getAttribute('position');
      const nextRotation = rotation || refs.drugGroup.getAttribute('rotation');

      animateExactTransform(
        refs.drugGroup,
        nextPosition,
        nextRotation,
        null,
        instant,
        dur
      );
    }


    function applyTransformationPieceFades(index, instant = false) {
      if (!refs.sigmaRing3) return;

      if (instant) {
        setEntityOpacityNowModel(refs.sigmaRing3, 1);
      } else {
        animateModelOpacity(refs.sigmaRing3, 1, EDIT.TIMING.fade, false);
      }
    }


    function shortestAngleDelta(fromDeg, toDeg) {
      let delta = (toDeg - fromDeg) % 360;
      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;
      return delta;
    }

    function animateBondHandlePose(
      shiftHandle,
      rotationHandle,
      scaleKey,
      targetPose,
      instant = false,
      dur = EDIT.TIMING.slowMove
    ) {
      if (!shiftHandle || !rotationHandle || !targetPose) return;

      if (shiftHandle.__bondPoseFrame) {
        cancelAnimationFrame(shiftHandle.__bondPoseFrame);
        shiftHandle.__bondPoseFrame = null;
      }

      const startPosition = parseVec3(shiftHandle.getAttribute('position') || '0 0 0');
      const startRotation = parseVec3(rotationHandle.getAttribute('rotation') || '0 0 0');
      const startScale = parseVec3(EDIT.HELPERS[scaleKey] || '1 1 1');

      const rawEndPosition = parseVec3(targetPose.position);
      const rawEndRotation = parseVec3(targetPose.rotation);
      const rawEndScale = parseVec3(targetPose.scale);

      // Rotate the short way instead of spinning around through 360.
      const endRotation = new THREE.Vector3(
        startRotation.x + shortestAngleDelta(startRotation.x, rawEndRotation.x),
        startRotation.y + shortestAngleDelta(startRotation.y, rawEndRotation.y),
        startRotation.z + shortestAngleDelta(startRotation.z, rawEndRotation.z)
      );

      if (instant) {
        shiftHandle.setAttribute('position', targetPose.position);
        rotationHandle.setAttribute(
          'rotation',
          `${rawEndRotation.x.toFixed(1)} ${rawEndRotation.y.toFixed(1)} ${rawEndRotation.z.toFixed(1)}`
        );
        EDIT.HELPERS[scaleKey] = targetPose.scale;
        syncO2DoubleBondGeometry(helpers.o2Group);
        return;
      }

      const startTime = performance.now();

      function frame(now) {
        const rawT = Math.min(1, (now - startTime) / dur);
        const t = easeInOut(rawT);

        const currentPosition = lerpVec3(startPosition, rawEndPosition, t);

        const currentRotation = new THREE.Vector3(
          THREE.MathUtils.lerp(startRotation.x, endRotation.x, t),
          THREE.MathUtils.lerp(startRotation.y, endRotation.y, t),
          THREE.MathUtils.lerp(startRotation.z, endRotation.z, t)
        );

        const currentScale = lerpVec3(startScale, rawEndScale, t);

        shiftHandle.setAttribute('position', vecToStr(currentPosition));
        rotationHandle.setAttribute(
          'rotation',
          `${currentRotation.x.toFixed(1)} ${currentRotation.y.toFixed(1)} ${currentRotation.z.toFixed(1)}`
        );
        EDIT.HELPERS[scaleKey] = vecToStr(currentScale);

        syncO2DoubleBondGeometry(helpers.o2Group);

        if (rawT < 1) {
          shiftHandle.__bondPoseFrame = requestAnimationFrame(frame);
        } else {
          shiftHandle.setAttribute('position', targetPose.position);
          rotationHandle.setAttribute(
            'rotation',
            `${rawEndRotation.x.toFixed(1)} ${rawEndRotation.y.toFixed(1)} ${rawEndRotation.z.toFixed(1)}`
          );
          EDIT.HELPERS[scaleKey] = targetPose.scale;
          syncO2DoubleBondGeometry(helpers.o2Group);
          shiftHandle.__bondPoseFrame = null;
        }
      }

      shiftHandle.__bondPoseFrame = requestAnimationFrame(frame);
    }

    function applyProtonBondAttachmentAnimation(index, instant = false) {
      const parts = helpers.o2Group?._parts;
      if (!parts) return;

      const upperPre = {
        position: EDIT.HELPERS.o2BondUpperPreShift,
        rotation: EDIT.HELPERS.o2BondUpperPreRotation,
        scale: EDIT.HELPERS.o2BondUpperPreModelScale
      };

      const lowerPre = {
        position: EDIT.HELPERS.o2BondLowerPreShift,
        rotation: EDIT.HELPERS.o2BondLowerPreRotation,
        scale: EDIT.HELPERS.o2BondLowerPreModelScale
      };

      const upperEnd = {
        position: EDIT.HELPERS.o2BondUpperShift,
        rotation: EDIT.HELPERS.o2BondUpperRotation,
        scale: EDIT.HELPERS.o2BondUpperModelScale
      };

      const lowerEnd = {
        position: EDIT.HELPERS.o2BondLowerShift,
        rotation: EDIT.HELPERS.o2BondLowerRotation,
        scale: EDIT.HELPERS.o2BondLowerModelScale
      };

      // Step 1 to Step 6: both bonds stay in the pre-proton pose.
      if (index <= 5) {
        animateBondHandlePose(
          parts.bondUpperShiftHandle,
          parts.bondUpperRotationHandle,
          'o2BondUpperModelScale',
          upperPre,
          instant,
          EDIT.TIMING.slowMove
        );

        animateBondHandlePose(
          parts.bondLowerShiftHandle,
          parts.bondLowerRotationHandle,
          'o2BondLowerModelScale',
          lowerPre,
          instant,
          EDIT.TIMING.slowMove
        );
        return;
      }

      // Step 7: sigma_extra1 moves with proton 1.
      // sigma_extra2 stays in its pre-proton pose.
      if (index === 6) {
        animateBondHandlePose(
          parts.bondUpperShiftHandle,
          parts.bondUpperRotationHandle,
          'o2BondUpperModelScale',
          upperEnd,
          instant,
          EDIT.TIMING.slowMove
        );

        animateBondHandlePose(
          parts.bondLowerShiftHandle,
          parts.bondLowerRotationHandle,
          'o2BondLowerModelScale',
          lowerPre,
          instant,
          EDIT.TIMING.slowMove
        );
        return;
      }

      // Step 8 and later: sigma_extra2 moves when proton 2 arrives.
      animateBondHandlePose(
        parts.bondUpperShiftHandle,
        parts.bondUpperRotationHandle,
        'o2BondUpperModelScale',
        upperEnd,
        instant,
        EDIT.TIMING.slowMove
      );

      animateBondHandlePose(
        parts.bondLowerShiftHandle,
        parts.bondLowerRotationHandle,
        'o2BondLowerModelScale',
        lowerEnd,
        instant,
        EDIT.TIMING.slowMove
      );
    }

    function getEntityWorldCenter(entity) {
      const fallback = new THREE.Vector3(0, 0, 0);
      if (!entity?.object3D) return fallback;

      const worldPos = new THREE.Vector3();
      entity.object3D.getWorldPosition(worldPos);

      const box = new THREE.Box3().setFromObject(entity.object3D);
      if (box.isEmpty()) return worldPos;

      return box.getCenter(new THREE.Vector3());
    }

    function getEntityFocusScale(entity) {
      if (!entity?.object3D) return 0.12;

      const box = new THREE.Box3().setFromObject(entity.object3D);
      if (box.isEmpty()) return 0.12;

      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);

      return THREE.MathUtils.clamp(maxDim * 1.6, 0.08, 0.45);
    }

    function createFocusBeacon() {
      const beacon = document.createElement('a-entity');
      beacon.setAttribute('id', 'editorFocusBeacon');
      beacon.setAttribute('visible', 'false');

      const sphere = document.createElement('a-sphere');
      sphere.setAttribute('radius', '0.06');
      sphere.setAttribute(
        'material',
        'color: #00e5ff; emissive: #00e5ff; emissiveIntensity: 1.8; transparent: true; opacity: 0.14'
      );

      const ringA = document.createElement('a-ring');
      ringA.setAttribute('radius-inner', '0.09');
      ringA.setAttribute('radius-outer', '0.11');
      ringA.setAttribute(
        'material',
        'color: #7dd3fc; emissive: #7dd3fc; emissiveIntensity: 1.2; transparent: true; opacity: 0.90; side: double'
      );
      ringA.setAttribute('rotation', '90 0 0');

      const ringB = document.createElement('a-ring');
      ringB.setAttribute('radius-inner', '0.09');
      ringB.setAttribute('radius-outer', '0.11');
      ringB.setAttribute(
        'material',
        'color: #7dd3fc; emissive: #7dd3fc; emissiveIntensity: 1.2; transparent: true; opacity: 0.90; side: double'
      );
      ringB.setAttribute('rotation', '0 0 0');

      const ringC = document.createElement('a-ring');
      ringC.setAttribute('radius-inner', '0.09');
      ringC.setAttribute('radius-outer', '0.11');
      ringC.setAttribute(
        'material',
        'color: #7dd3fc; emissive: #7dd3fc; emissiveIntensity: 1.2; transparent: true; opacity: 0.90; side: double'
      );
      ringC.setAttribute('rotation', '0 90 0');

      beacon.appendChild(sphere);
      beacon.appendChild(ringA);
      beacon.appendChild(ringB);
      beacon.appendChild(ringC);

      scene.appendChild(beacon);
      return beacon;
    }

    let editorFocusBeacon = null;
    let editorFocusHideTimer = null;

    function focusTargetTemporarily(target, durationMs = 2200) {
      if (!target) return;

      if (!editorFocusBeacon) {
        editorFocusBeacon = createFocusBeacon();
      }

      if (editorFocusHideTimer) {
        clearTimeout(editorFocusHideTimer);
        editorFocusHideTimer = null;
      }

      const entity = target.entity;
      if (!entity) return;

      const worldCenter =
        typeof target.readWorldPosition === 'function'
          ? target.readWorldPosition()
          : getEntityWorldCenter(entity);

      const scale = getEntityFocusScale(entity);

      editorFocusBeacon.setAttribute('position', vecToStr(worldCenter));
      editorFocusBeacon.setAttribute('scale', `${scale.toFixed(3)} ${scale.toFixed(3)} ${scale.toFixed(3)}`);
      editorFocusBeacon.setAttribute('visible', 'true');

      editorFocusBeacon.removeAttribute('animation__pulse');
      editorFocusBeacon.setAttribute(
        'animation__pulse',
        'property: scale; dir: alternate; dur: 420; loop: true; easing: easeInOutSine'
      );

      editorFocusHideTimer = window.setTimeout(() => {
        if (editorFocusBeacon) {
          editorFocusBeacon.setAttribute('visible', 'false');
          editorFocusBeacon.removeAttribute('animation__pulse');
        }
        editorFocusHideTimer = null;
      }, durationMs);
    }

    function createBrowserTransformEditor() {
      const panel = document.createElement('div');
      panel.id = 'browser-transform-editor';

      Object.assign(panel.style, {
        position: 'fixed',
        top: '12px',
        right: '12px',
        width: '320px',
        maxHeight: '82vh',
        overflow: 'hidden',
        zIndex: '999999',
        borderRadius: '14px',
        background: 'rgba(7, 16, 32, 0.98)',
        border: '2px solid #7dd3fc',
        boxShadow: '0 0 0 2px rgba(255,255,255,0.08), 0 12px 30px rgba(0, 0, 0, 0.45)',
        color: '#eef6ff',
        fontFamily: 'Arial, Helvetica, sans-serif'
      });

      panel.innerHTML = `
    <div data-editor="topbar" style="
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:8px;
      padding:10px 12px;
      border-bottom:1px solid rgba(125, 211, 252, 0.14);
      background:rgba(10, 20, 40, 0.96);
    ">
      <div>
        <div style="font-size:14px; font-weight:700; line-height:1.2;">Live Transform Editor</div>
        <div style="font-size:11px; color:#b9d7f7; margin-top:2px;">Position • Rotation • Scale</div>
      </div>
      <button data-editor-action="toggle" style="
        min-width:72px;
        border-radius:8px;
        border:1px solid rgba(148,163,184,0.26);
        background:#13213a;
        color:#eef6ff;
        padding:7px 10px;
        font-size:11px;
        cursor:pointer;
      ">Collapse</button>
    </div>

    <div data-editor="content" style="
      max-height:calc(82vh - 58px);
      overflow-y:auto;
      padding:10px 12px 12px 12px;
    ">
      <div style="font-size:11px; line-height:1.45; color:#cfe3ff; margin-bottom:10px;">
        Pick any model or helper, then edit its transform live.
      </div>

      <div style="margin-bottom:10px;">
        <div style="font-size:11px; font-weight:700; color:#d9ecff; margin-bottom:5px;">SEARCH</div>
        <input data-editor="search" type="text" placeholder="monitor, apap, sigma, proton..." />
      </div>

      <div style="margin-bottom:12px;">
        <div style="font-size:11px; font-weight:700; color:#d9ecff; margin-bottom:5px;">TARGETS</div>
        <select data-editor="target" size="7"></select>
      </div>

      <div style="padding:9px; border-radius:10px; background:rgba(255,255,255,0.03); margin-bottom:10px;">
        <div style="font-size:11px; font-weight:700; color:#d9ecff; margin-bottom:6px;">POSITION</div>
        <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:6px;">
          <div><div style="font-size:10px; margin-bottom:3px;">X</div><input data-editor="px" type="number" step="0.001" /></div>
          <div><div style="font-size:10px; margin-bottom:3px;">Y</div><input data-editor="py" type="number" step="0.001" /></div>
          <div><div style="font-size:10px; margin-bottom:3px;">Z</div><input data-editor="pz" type="number" step="0.001" /></div>
        </div>
        <div style="margin-top:6px;">
          <div style="font-size:10px; margin-bottom:3px;">Position nudge step</div>
          <input data-editor="posStep" type="number" step="0.001" value="0.005" />
        </div>
        <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:6px; margin-top:6px;">
          <button data-pos-axis="x" data-dir="-1">X−</button>
          <button data-pos-axis="y" data-dir="-1">Y−</button>
          <button data-pos-axis="z" data-dir="-1">Z−</button>
          <button data-pos-axis="x" data-dir="1">X+</button>
          <button data-pos-axis="y" data-dir="1">Y+</button>
          <button data-pos-axis="z" data-dir="1">Z+</button>
        </div>
      </div>

      <div style="padding:9px; border-radius:10px; background:rgba(255,255,255,0.03); margin-bottom:10px;">
        <div style="font-size:11px; font-weight:700; color:#d9ecff; margin-bottom:6px;">ROTATION</div>
        <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:6px;">
          <div><div style="font-size:10px; margin-bottom:3px;">RX</div><input data-editor="rx" type="number" step="1" /></div>
          <div><div style="font-size:10px; margin-bottom:3px;">RY</div><input data-editor="ry" type="number" step="1" /></div>
          <div><div style="font-size:10px; margin-bottom:3px;">RZ</div><input data-editor="rz" type="number" step="1" /></div>
        </div>
        <div style="margin-top:6px;">
          <div style="font-size:10px; margin-bottom:3px;">Rotation nudge step</div>
          <input data-editor="rotStep" type="number" step="1" value="2" />
        </div>
        <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:6px; margin-top:6px;">
          <button data-rot-axis="x" data-dir="-1">RX−</button>
          <button data-rot-axis="y" data-dir="-1">RY−</button>
          <button data-rot-axis="z" data-dir="-1">RZ−</button>
          <button data-rot-axis="x" data-dir="1">RX+</button>
          <button data-rot-axis="y" data-dir="1">RY+</button>
          <button data-rot-axis="z" data-dir="1">RZ+</button>
        </div>
      </div>

      <div style="padding:9px; border-radius:10px; background:rgba(255,255,255,0.03); margin-bottom:10px;">
        <div style="font-size:11px; font-weight:700; color:#d9ecff; margin-bottom:6px;">SCALE</div>
        <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:6px;">
          <div><div style="font-size:10px; margin-bottom:3px;">SX</div><input data-editor="sx" type="number" step="0.001" /></div>
          <div><div style="font-size:10px; margin-bottom:3px;">SY</div><input data-editor="sy" type="number" step="0.001" /></div>
          <div><div style="font-size:10px; margin-bottom:3px;">SZ</div><input data-editor="sz" type="number" step="0.001" /></div>
        </div>
        <div style="margin-top:6px;">
          <div style="font-size:10px; margin-bottom:3px;">Scale nudge step</div>
          <input data-editor="scaleStep" type="number" step="0.001" value="0.010" />
        </div>
        <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:6px; margin-top:6px;">
          <button data-scale-axis="x" data-dir="-1">SX−</button>
          <button data-scale-axis="y" data-dir="-1">SY−</button>
          <button data-scale-axis="z" data-dir="-1">SZ−</button>
          <button data-scale-axis="x" data-dir="1">SX+</button>
          <button data-scale-axis="y" data-dir="1">SY+</button>
          <button data-scale-axis="z" data-dir="1">SZ+</button>
        </div>
      </div>

      <div style="padding:9px; border-radius:10px; background:rgba(255,255,255,0.03); margin-bottom:10px;">
        <div style="font-size:11px; font-weight:700; color:#d9ecff; margin-bottom:6px;">ACTIONS</div>
        <div style="display:grid; grid-template-columns:repeat(2, 1fr); gap:6px;">
          <button data-editor-action="read">Read live</button>
          <button data-editor-action="apply">Apply</button>
          <button data-editor-action="focus">Focus</button>
          <button data-editor-action="stop">Stop motion</button>
          <button data-editor-action="print">Print selected</button>
          <button data-editor-action="print-all">Print all</button>
          <button data-editor-action="refresh">Refresh list</button>
        </div>
      </div>

      <div data-editor="hint" style="
        margin-top:8px;
        padding:8px;
        border-radius:10px;
        background:rgba(125,211,252,0.06);
        font-size:11px;
        line-height:1.45;
        color:#a9c4e7;
      "></div>

      <div data-editor="status" style="
        margin-top:8px;
        padding:8px;
        border-radius:10px;
        background:rgba(255,255,255,0.04);
        font-size:10px;
        line-height:1.5;
        color:#dbe7ff;
        font-family: Consolas, monospace;
        white-space: pre-wrap;
        word-break: break-word;
      "></div>
    </div>
  `;

      document.body.appendChild(panel);

      panel.querySelectorAll('input, select').forEach((el) => {
        Object.assign(el.style, {
          width: '100%',
          boxSizing: 'border-box',
          borderRadius: '8px',
          border: '1px solid rgba(148, 163, 184, 0.30)',
          background: '#0b1324',
          color: '#eef6ff',
          padding: '7px 8px',
          fontSize: '12px'
        });
      });

      panel.querySelectorAll('button').forEach((el) => {
        Object.assign(el.style, {
          width: '100%',
          borderRadius: '8px',
          border: '1px solid rgba(148, 163, 184, 0.26)',
          background: '#13213a',
          color: '#eef6ff',
          padding: '7px 8px',
          fontSize: '11px',
          cursor: 'pointer'
        });

        el.addEventListener('mouseenter', () => {
          el.style.background = '#1a3155';
        });

        el.addEventListener('mouseleave', () => {
          el.style.background = '#13213a';
        });
      });

      const ui = {
        search: panel.querySelector('[data-editor="search"]'),
        target: panel.querySelector('[data-editor="target"]'),
        px: panel.querySelector('[data-editor="px"]'),
        py: panel.querySelector('[data-editor="py"]'),
        pz: panel.querySelector('[data-editor="pz"]'),
        rx: panel.querySelector('[data-editor="rx"]'),
        ry: panel.querySelector('[data-editor="ry"]'),
        rz: panel.querySelector('[data-editor="rz"]'),
        sx: panel.querySelector('[data-editor="sx"]'),
        sy: panel.querySelector('[data-editor="sy"]'),
        sz: panel.querySelector('[data-editor="sz"]'),
        posStep: panel.querySelector('[data-editor="posStep"]'),
        rotStep: panel.querySelector('[data-editor="rotStep"]'),
        scaleStep: panel.querySelector('[data-editor="scaleStep"]'),
        hint: panel.querySelector('[data-editor="hint"]'),
        status: panel.querySelector('[data-editor="status"]'),
        content: panel.querySelector('[data-editor="content"]'),
        toggle: panel.querySelector('[data-editor-action="toggle"]')
      };

      function localPositionOf(entity) {
        return parseVec3(entity?.getAttribute('position') || '0 0 0');
      }

      function localRotationOf(entity) {
        return parseVec3(entity?.getAttribute('rotation') || '0 0 0');
      }

      function localScaleOf(entity) {
        return getScaleOf(entity, '1 1 1');
      }

      function worldPositionOf(entity) {
        const out = new THREE.Vector3(0, 0, 0);
        if (entity?.object3D) entity.object3D.getWorldPosition(out);
        return out;
      }

      function targetLocalPositionOf(target) {
        if (!target) return new THREE.Vector3(0, 0, 0);
        if (typeof target.readPosition === 'function') return target.readPosition();
        return localPositionOf(target.entity);
      }

      function targetLocalRotationOf(target) {
        if (!target) return new THREE.Vector3(0, 0, 0);
        if (typeof target.readRotation === 'function') return target.readRotation();
        return localRotationOf(target.entity);
      }

      function targetLocalScaleOf(target) {
        if (!target) return new THREE.Vector3(1, 1, 1);
        if (typeof target.readScale === 'function') return target.readScale();
        return localScaleOf(target.entity);
      }

      function targetWorldPositionOf(target) {
        if (!target) return new THREE.Vector3(0, 0, 0);
        if (typeof target.readWorldPosition === 'function') return target.readWorldPosition();
        return worldPositionOf(target.entity);
      }

      function applyTargetTransform(target, nextPosition, nextRotation, nextScale) {
        if (!target) return;

        if (typeof target.applyTransform === 'function') {
          target.applyTransform(nextPosition, nextRotation, nextScale);
          return;
        }

        if (!target.entity) return;

        target.entity.setAttribute('position', vecToStr(nextPosition));
        target.entity.setAttribute(
          'rotation',
          `${nextRotation.x.toFixed(1)} ${nextRotation.y.toFixed(1)} ${nextRotation.z.toFixed(1)}`
        );
        target.entity.setAttribute('scale', vecToStr(nextScale));
      }

      function stopTargetMotion(target) {
        if (!target) return;

        if (typeof target.stopMotion === 'function') {
          target.stopMotion();
          return;
        }

        if (target.stopParentEntity) stopEntityMotion(target.stopParentEntity);
        stopEntityMotion(target.entity);
      }

      function getTargets() {
        const o2Parts = helpers.o2Group?._parts || {};
        const restingParts = helpers.restingWater?._parts || {};
        const sceneControlPanel = document.getElementById('sceneVisualControlPanel');

        return [
          { key: 'comparisonRig', label: 'comparisonRig', entity: refs.comparisonRig, hint: 'Whole 3-box comparison rig.' },

          { key: 'inducerBoxGroup', label: 'inducer box group', entity: refs.inducerBoxGroup, hint: 'Left comparison group.' },
          { key: 'inducerBox', label: 'inducer box', entity: refs.inducerBox, hint: 'Left GLB box.' },
          { key: 'inducerEnzyme', label: 'inducer enzyme', entity: refs.inducerEnzyme, hint: 'Left enzyme.' },

          { key: 'normalBoxGroup', label: 'normal box group', entity: refs.normalBoxGroup, hint: 'Center comparison group.' },
          { key: 'normalBox', label: 'normal box', entity: refs.normalBox, hint: 'Center GLB box.' },
          { key: 'normalEnzyme', label: 'normal enzyme', entity: refs.normalEnzyme, hint: 'Center enzyme.' },

          { key: 'rifampcinDrug', label: 'rifampcin drug', entity: refs.rifampcinDrug, hint: 'Inducer example model.' },
          { key: 'phenytoinDrug', label: 'phenytoin drug', entity: refs.phenytoinDrug, hint: 'Inducer example model.' },
          { key: 'codeineDrug', label: 'codeine drug', entity: refs.codeineDrug, hint: 'Prodrug model.' },
          { key: 'morphineDrug', label: 'morphine drug', entity: refs.morphineDrug, hint: 'Active metabolite model.' },

          { key: 'inhibitorBoxGroup', label: 'inhibitor box group', entity: refs.inhibitorBoxGroup, hint: 'Right comparison group.' },
          { key: 'inhibitorBox', label: 'inhibitor box', entity: refs.inhibitorBox, hint: 'Right GLB box.' },
          { key: 'inhibitorEnzyme', label: 'inhibitor enzyme', entity: refs.inhibitorEnzyme, hint: 'Right enzyme.' },

          { key: 'monitorRig', label: 'monitorRig', entity: refs.monitorRig, hint: 'Whole monitor placement rig.' },
          { key: 'monitor', label: 'monitor1 model', entity: refs.monitor, hint: 'Monitor 1 GLB.' },
          { key: 'monitorUiAnchor', label: 'monitor1 UI anchor', entity: refs.monitorUiAnchor, hint: 'Monitor 1 UI anchor.' },
          { key: 'monitor1UiRoot', label: 'monitor1 UI root', entity: refs.monitor1UiRoot, hint: 'Monitor 1 control UI root.' },
          { key: 'hud', label: 'monitor1 HUD', entity: refs.hud, hint: 'Monitor 1 HUD root.' },
          { key: 'infoPanel', label: 'monitor1 info panel', entity: refs.infoPanel, hint: 'Monitor 1 step info panel.' },
          { key: 'buttonRow', label: 'monitor1 button row', entity: refs.buttonRow, hint: 'Monitor 1 control buttons.' },
          { key: 'btnBack', label: 'monitor1 Back button', entity: refs.btnBack, hint: 'Back control button plane.' },
          { key: 'btnNext', label: 'monitor1 Next button', entity: refs.btnNext, hint: 'Next control button plane.' },
          { key: 'btnReplay', label: 'monitor1 Restart button', entity: refs.btnReplay, hint: 'Restart control button plane.' },
          { key: 'monitor2', label: 'monitor2 model', entity: refs.monitor2, hint: 'Monitor 2 GLB.' },
          { key: 'monitor2UiAnchor', label: 'monitor2 UI anchor', entity: document.getElementById('monitor2UiAnchor'), hint: 'Monitor 2 UI anchor.' },
          { key: 'monitor2UiRoot', label: 'monitor2 UI root', entity: refs.monitor2UiRoot, hint: 'Monitor 2 info display UI root.' },

          { key: 'sceneVisualControlPanel', label: 'scene control panel', entity: sceneControlPanel, hint: 'Only appears if still present in scene.' },

          { key: 'drugGroup', label: 'drugGroup (everything)', entity: refs.drugGroup, hint: 'Whole drug group.' },
          { key: 'partsGroup', label: 'partsGroup (moving pieces)', entity: refs.partsGroup, hint: 'Moving APAP parts group.' },
          { key: 'apapStatic', label: 'apapStatic', entity: refs.apapStatic, hint: 'Static scaffold.' },
          { key: 'apapOPhenol', label: 'apapOPhenol', entity: refs.apapOPhenol, hint: 'Phenolic oxygen GLB.' },
          { key: 'apapHPhenol', label: 'apapHPhenol', entity: refs.apapHPhenol, hint: 'Phenolic hydrogen GLB.' },
          { key: 'apapNAmide', label: 'apapNAmide', entity: refs.apapNAmide, hint: 'Amide nitrogen GLB.' },
          { key: 'apapHAmide', label: 'apapHAmide', entity: refs.apapHAmide, hint: 'Amide hydrogen GLB.' },
          { key: 'sigmaApapOH', label: 'sigmaApapOH', entity: refs.sigmaApapOH, hint: 'APAP O-H sigma bond.' },
          { key: 'sigmaApapC1O', label: 'sigmaApapC1O', entity: refs.sigmaApapC1O, hint: 'APAP ring C-O bond.' },
          { key: 'sigmaApap34', label: 'sigmaApap34', entity: refs.sigmaApap34, hint: 'APAP ring 3-4 bond.' },
          { key: 'sigmaRing1', label: 'sigmaRing1', entity: refs.sigmaRing1, hint: 'Ring GLB 1.' },
          { key: 'sigmaRing2', label: 'sigmaRing2', entity: refs.sigmaRing2, hint: 'Ring GLB 2.' },
          { key: 'sigmaRing3', label: 'sigmaRing3', entity: refs.sigmaRing3, hint: 'Ring GLB 3.' },
          { key: 'sigmaRing4', label: 'sigmaRing4', entity: refs.sigmaRing4, hint: 'Ring GLB 4.' },
          { key: 'sigmaApapC4N', label: 'sigmaApapC4N', entity: refs.sigmaApapC4N, hint: 'APAP ring C-N bond.' },
          { key: 'sigmaApapNH', label: 'sigmaApapNH', entity: refs.sigmaApapNH, hint: 'APAP N-H bond.' },

          { key: 'o2Group', label: 'o2Group (whole)', entity: helpers.o2Group, hint: 'Whole oxygen helper.' },
          { key: 'o2OxygenA', label: 'o2 oxygen A (local)', entity: o2Parts.oxygenA, stopParentEntity: helpers.o2Group, hint: 'Local position inside o2Group.', onChange: () => syncO2DoubleBondGeometry(helpers.o2Group) },
          { key: 'o2OxygenB', label: 'o2 oxygen B (local)', entity: o2Parts.oxygenB, stopParentEntity: helpers.o2Group, hint: 'Local position inside o2Group.', onChange: () => syncO2DoubleBondGeometry(helpers.o2Group) },
          { key: 'o2BondUpperShift', label: 'o2 upper bond shift', entity: o2Parts.bondUpperShiftHandle, stopParentEntity: helpers.o2Group, hint: 'Upper O=O bond shift.', onChange: () => syncO2DoubleBondGeometry(helpers.o2Group) },
          { key: 'o2BondLowerShift', label: 'o2 lower bond shift', entity: o2Parts.bondLowerShiftHandle, stopParentEntity: helpers.o2Group, hint: 'Lower O=O bond shift.', onChange: () => syncO2DoubleBondGeometry(helpers.o2Group) },
          { key: 'o2BondOxoShift', label: 'oxo bond shift', entity: o2Parts.bondOxoShiftHandle, stopParentEntity: helpers.o2Group, hint: 'Fe=O bond shift.', onChange: () => syncO2DoubleBondGeometry(helpers.o2Group) },

          {
            key: 'sigmaExtra1',
            label: 'sigma_extra1.glb',
            entity: o2Parts.bondA,
            stopParentEntity: helpers.o2Group,
            hint: 'Upper O=O GLB.',
            readPosition: () => parseVec3(o2Parts.bondUpperShiftHandle.getAttribute('position') || EDIT.HELPERS.o2BondUpperShift),
            readRotation: () => parseVec3(o2Parts.bondUpperRotationHandle.getAttribute('rotation') || EDIT.HELPERS.o2BondUpperRotation),
            readScale: () => parseVec3(EDIT.HELPERS.o2BondUpperModelScale),
            readWorldPosition: () => worldPositionOf(o2Parts.bondA),
            applyTransform: (nextPosition, nextRotation, nextScale) => {
              o2Parts.bondUpperShiftHandle.setAttribute('position', vecToStr(nextPosition));
              o2Parts.bondUpperRotationHandle.setAttribute(
                'rotation',
                `${nextRotation.x.toFixed(1)} ${nextRotation.y.toFixed(1)} ${nextRotation.z.toFixed(1)}`
              );
              EDIT.HELPERS.o2BondUpperModelScale = vecToStr(nextScale);
              syncO2DoubleBondGeometry(helpers.o2Group);
            }
          },
          {
            key: 'sigmaExtra2',
            label: 'sigma_extra2.glb',
            entity: o2Parts.bondB,
            stopParentEntity: helpers.o2Group,
            hint: 'Lower O=O GLB.',
            readPosition: () => parseVec3(o2Parts.bondLowerShiftHandle.getAttribute('position') || EDIT.HELPERS.o2BondLowerShift),
            readRotation: () => parseVec3(o2Parts.bondLowerRotationHandle.getAttribute('rotation') || EDIT.HELPERS.o2BondLowerRotation),
            readScale: () => parseVec3(EDIT.HELPERS.o2BondLowerModelScale),
            readWorldPosition: () => worldPositionOf(o2Parts.bondB),
            applyTransform: (nextPosition, nextRotation, nextScale) => {
              o2Parts.bondLowerShiftHandle.setAttribute('position', vecToStr(nextPosition));
              o2Parts.bondLowerRotationHandle.setAttribute(
                'rotation',
                `${nextRotation.x.toFixed(1)} ${nextRotation.y.toFixed(1)} ${nextRotation.z.toFixed(1)}`
              );
              EDIT.HELPERS.o2BondLowerModelScale = vecToStr(nextScale);
              syncO2DoubleBondGeometry(helpers.o2Group);
            }
          },
          {
            key: 'sigmaExtra3',
            label: 'sigma_extra3.glb',
            entity: o2Parts.bondOxo,
            stopParentEntity: helpers.o2Group,
            hint: 'Fe=O GLB bond.',
            readPosition: () => parseVec3(o2Parts.bondOxoShiftHandle.getAttribute('position') || EDIT.HELPERS.o2BondOxoShift),
            readRotation: () => parseVec3(o2Parts.bondOxoRotationHandle.getAttribute('rotation') || EDIT.HELPERS.o2BondOxoRotation),
            readScale: () => parseVec3(EDIT.HELPERS.o2BondOxoModelScale),
            readWorldPosition: () => worldPositionOf(o2Parts.bondOxo),
            applyTransform: (nextPosition, nextRotation, nextScale) => {
              o2Parts.bondOxoShiftHandle.setAttribute('position', vecToStr(nextPosition));
              o2Parts.bondOxoRotationHandle.setAttribute(
                'rotation',
                `${nextRotation.x.toFixed(1)} ${nextRotation.y.toFixed(1)} ${nextRotation.z.toFixed(1)}`
              );
              EDIT.HELPERS.o2BondOxoModelScale = vecToStr(nextScale);
              syncO2DoubleBondGeometry(helpers.o2Group);
            }
          },

          { key: 'restingWater', label: 'restingWater (whole)', entity: helpers.restingWater, hint: 'Whole resting water.' },
          { key: 'restingWaterO', label: 'resting water oxygen', entity: restingParts.oxygen, stopParentEntity: helpers.restingWater, hint: 'Local oxygen.' },
          { key: 'restingWaterH1', label: 'resting water H1', entity: restingParts.hydrogen1, stopParentEntity: helpers.restingWater, hint: 'Local H1.' },
          { key: 'restingWaterH2', label: 'resting water H2', entity: restingParts.hydrogen2, stopParentEntity: helpers.restingWater, hint: 'Local H2.' },
          { key: 'electron1', label: 'electron1', entity: helpers.electron1, hint: 'Electron 1 helper.' },
          { key: 'electron2', label: 'electron2', entity: helpers.electron2, hint: 'Electron 2 helper.' },
          { key: 'proton1', label: 'proton1', entity: helpers.proton1, hint: 'Proton 1 helper.' },
          { key: 'proton2', label: 'proton2', entity: helpers.proton2, hint: 'Proton 2 helper.' }
        ].filter((item) => item.entity);
      }

      function getFilteredTargets() {
        const q = (ui.search.value || '').trim().toLowerCase();
        const all = getTargets();
        if (!q) return all;
        return all.filter((item) => item.label.toLowerCase().includes(q));
      }

      function getSelectedTarget() {
        const targets = getFilteredTargets();
        return targets.find((item) => item.key === ui.target.value) || targets[0] || null;
      }

      function refreshTargetList() {
        const keep = ui.target.value;
        const targets = getFilteredTargets();
        ui.target.innerHTML = targets.map((item) => `<option value="${item.key}">${item.label}</option>`).join('');
        if (targets.some((item) => item.key === keep)) ui.target.value = keep;
        else if (targets[0]) ui.target.value = targets[0].key;
      }

      function updateStatus(target) {
        if (!target) {
          ui.status.textContent = 'No target selected.';
          ui.hint.textContent = '';
          return;
        }

        const local = targetLocalPositionOf(target);
        const world = targetWorldPositionOf(target);
        const rot = targetLocalRotationOf(target);
        const scale = targetLocalScaleOf(target);

        ui.hint.textContent = target.hint || '';
        ui.status.textContent =
          `Local: ${vecToStr(local)}\n` +
          `World: ${vecToStr(world)}\n` +
          `Rotation: ${vecToStr(rot)}\n` +
          `Scale: ${vecToStr(scale)}`;
      }

      function readSelected() {
        const target = getSelectedTarget();
        if (!target) return;

        const pos = targetLocalPositionOf(target);
        const rot = targetLocalRotationOf(target);
        const scale = targetLocalScaleOf(target);

        ui.px.value = pos.x.toFixed(3);
        ui.py.value = pos.y.toFixed(3);
        ui.pz.value = pos.z.toFixed(3);

        ui.rx.value = rot.x.toFixed(1);
        ui.ry.value = rot.y.toFixed(1);
        ui.rz.value = rot.z.toFixed(1);

        ui.sx.value = scale.x.toFixed(3);
        ui.sy.value = scale.y.toFixed(3);
        ui.sz.value = scale.z.toFixed(3);

        updateStatus(target);
      }

      function applyInputs() {
        const target = getSelectedTarget();
        if (!target) return;

        stopTargetMotion(target);

        const currentPos = targetLocalPositionOf(target);
        const currentRot = targetLocalRotationOf(target);
        const currentScale = targetLocalScaleOf(target);

        const px = Number.isFinite(Number(ui.px.value)) ? Number(ui.px.value) : currentPos.x;
        const py = Number.isFinite(Number(ui.py.value)) ? Number(ui.py.value) : currentPos.y;
        const pz = Number.isFinite(Number(ui.pz.value)) ? Number(ui.pz.value) : currentPos.z;
        const rx = Number.isFinite(Number(ui.rx.value)) ? Number(ui.rx.value) : currentRot.x;
        const ry = Number.isFinite(Number(ui.ry.value)) ? Number(ui.ry.value) : currentRot.y;
        const rz = Number.isFinite(Number(ui.rz.value)) ? Number(ui.rz.value) : currentRot.z;
        const sx = Number.isFinite(Number(ui.sx.value)) ? Number(ui.sx.value) : currentScale.x;
        const sy = Number.isFinite(Number(ui.sy.value)) ? Number(ui.sy.value) : currentScale.y;
        const sz = Number.isFinite(Number(ui.sz.value)) ? Number(ui.sz.value) : currentScale.z;

        applyTargetTransform(
          target,
          new THREE.Vector3(px, py, pz),
          new THREE.Vector3(rx, ry, rz),
          new THREE.Vector3(sx, sy, sz)
        );

        if (typeof target.onChange === 'function') target.onChange();
        readSelected();
      }

      function nudgePosition(axis, dir) {
        const target = getSelectedTarget();
        if (!target) return;

        stopTargetMotion(target);

        const stepSize = Number.isFinite(Number(ui.posStep.value)) ? Number(ui.posStep.value) : 0.005;
        const pos = targetLocalPositionOf(target);
        const rot = targetLocalRotationOf(target);
        const scale = targetLocalScaleOf(target);

        if (axis === 'x') pos.x += stepSize * dir;
        if (axis === 'y') pos.y += stepSize * dir;
        if (axis === 'z') pos.z += stepSize * dir;

        applyTargetTransform(target, pos, rot, scale);
        if (typeof target.onChange === 'function') target.onChange();
        readSelected();
      }

      function nudgeRotation(axis, dir) {
        const target = getSelectedTarget();
        if (!target) return;

        stopTargetMotion(target);

        const stepSize = Number.isFinite(Number(ui.rotStep.value)) ? Number(ui.rotStep.value) : 2;
        const pos = targetLocalPositionOf(target);
        const rot = targetLocalRotationOf(target);
        const scale = targetLocalScaleOf(target);

        if (axis === 'x') rot.x += stepSize * dir;
        if (axis === 'y') rot.y += stepSize * dir;
        if (axis === 'z') rot.z += stepSize * dir;

        applyTargetTransform(target, pos, rot, scale);
        if (typeof target.onChange === 'function') target.onChange();
        readSelected();
      }

      function nudgeScale(axis, dir) {
        const target = getSelectedTarget();
        if (!target) return;

        stopTargetMotion(target);

        const stepSize = Number.isFinite(Number(ui.scaleStep.value)) ? Number(ui.scaleStep.value) : 0.01;
        const pos = targetLocalPositionOf(target);
        const rot = targetLocalRotationOf(target);
        const scale = targetLocalScaleOf(target);

        if (axis === 'x') scale.x = Math.max(0.001, scale.x + stepSize * dir);
        if (axis === 'y') scale.y = Math.max(0.001, scale.y + stepSize * dir);
        if (axis === 'z') scale.z = Math.max(0.001, scale.z + stepSize * dir);

        applyTargetTransform(target, pos, rot, scale);
        if (typeof target.onChange === 'function') target.onChange();
        readSelected();
      }

      function printSelected() {
        const target = getSelectedTarget();
        if (!target) return;

        const local = targetLocalPositionOf(target);
        const world = targetWorldPositionOf(target);
        const rot = targetLocalRotationOf(target);
        const scale = targetLocalScaleOf(target);

        console.log('================ LIVE POSITION EDITOR ================');
        console.log(`Target: ${target.label}`);
        console.log(`Local position: '${vecToStr(local)}'`);
        console.log(`World position: '${vecToStr(world)}'`);
        console.log(`Rotation: '${vecToStr(rot)}'`);
        console.log(`Scale: '${vecToStr(scale)}'`);
        console.log('======================================================');
      }

      function printAll() {
        const targets = getTargets();
        console.log('================ ALL EDITABLE TARGETS ================');
        targets.forEach((target) => {
          const local = targetLocalPositionOf(target);
          const world = targetWorldPositionOf(target);
          const rot = targetLocalRotationOf(target);
          const scale = targetLocalScaleOf(target);

          console.log(`${target.label}`);
          console.log(`  local position: '${vecToStr(local)}'`);
          console.log(`  world position: '${vecToStr(world)}'`);
          console.log(`  rotation: '${vecToStr(rot)}'`);
          console.log(`  scale: '${vecToStr(scale)}'`);
        });
        console.log('======================================================');
      }

      function setCollapsed(collapsed) {
        ui.content.style.display = collapsed ? 'none' : 'block';
        ui.toggle.textContent = collapsed ? 'Expand' : 'Collapse';
        panel.style.width = collapsed ? '220px' : '320px';
      }

      ui.search.addEventListener('input', () => {
        refreshTargetList();
        readSelected();
      });

      ui.target.addEventListener('change', readSelected);

      panel.querySelectorAll('[data-pos-axis]').forEach((button) => {
        button.addEventListener('click', () => {
          nudgePosition(button.dataset.posAxis, Number(button.dataset.dir || '1'));
        });
      });

      panel.querySelectorAll('[data-rot-axis]').forEach((button) => {
        button.addEventListener('click', () => {
          nudgeRotation(button.dataset.rotAxis, Number(button.dataset.dir || '1'));
        });
      });

      panel.querySelectorAll('[data-scale-axis]').forEach((button) => {
        button.addEventListener('click', () => {
          nudgeScale(button.dataset.scaleAxis, Number(button.dataset.dir || '1'));
        });
      });

      panel.querySelector('[data-editor-action="read"]').addEventListener('click', readSelected);
      panel.querySelector('[data-editor-action="apply"]').addEventListener('click', applyInputs);
      panel.querySelector('[data-editor-action="focus"]').addEventListener('click', () => {
        const target = getSelectedTarget();
        focusTargetTemporarily(target, 2200);
        updateStatus(target);
      });
      panel.querySelector('[data-editor-action="stop"]').addEventListener('click', () => {
        const target = getSelectedTarget();
        stopTargetMotion(target);
        updateStatus(target);
      });
      panel.querySelector('[data-editor-action="print"]').addEventListener('click', printSelected);
      panel.querySelector('[data-editor-action="print-all"]').addEventListener('click', printAll);
      panel.querySelector('[data-editor-action="refresh"]').addEventListener('click', () => {
        refreshTargetList();
        readSelected();
      });

      ui.toggle.addEventListener('click', () => {
        const isCollapsed = ui.content.style.display === 'none';
        setCollapsed(!isCollapsed);
      });

      refreshTargetList();
      readSelected();
      setCollapsed(false);

      return {
        refresh() {
          refreshTargetList();
          readSelected();
        },
        readSelected,
        printSelected,
        printAll
      };
    }
    const browserEditor = createBrowserTransformEditor();
    // =========================================================
    // INDUCER BOX LOOP ANIMATION
    // - constant particle flow
    // - baseline metabolism = 40% of inflow
    // - inducer glow starts at binding and lasts 3 s
    // - smoother particle pull
    // - induced enzyme holds particles a little less time
    // - released particles move at lane speed, but in a different direction
    // =========================================================

    const inducerLoopFx = {
      started: false,
      comparisonRig: null,
      inducerEnzyme: null,
      rifampcinDrug: null,
      particlesRoot: null,
      glow: null,
      particles: [],
      timers: [],
      rafId: null,

      enzymeBusy: false,
      baselineNextCaptureAt: 0,
      enzymeRecoveryUntil: 0,
      blockedUntil: 0,

      points: {
        enzyme: new THREE.Vector3(),
        laneStart: new THREE.Vector3(),
        laneEnd: new THREE.Vector3(),
        bindPos: new THREE.Vector3(),
        releaseRight: new THREE.Vector3(),
        inducerStart: new THREE.Vector3(),
        inducerBind: new THREE.Vector3(),
        inducerExit: new THREE.Vector3()
      },

      settings: {
        particleCount: 90,
        particleRadius: 0.006,
        particleOpacity: 0.78,

        // FLOW
        spawnEveryMs: 500,
        flowTravelMs: 10000,

        // BASELINE METABOLISM
        baselineMetabolismFraction: 0.40,

        // ENZYME HANDLING
        bindPullMsBaseline: 300,
        bindPullMsInduced: 190,

        bindHoldMsBaseline: 700,
        bindHoldMsInduced: 260,

        releaseMinMs: 420,
        postReleaseBufferMs: 0,
        captureRadiusBaseline: 0.16,
        captureRadiusInduced: 0.36,

        // INDUCER TIMING
        inducerCycleMs: 10000,
        inducerApproachMs: 1600,
        inducerBindHoldMs: 220,
        inducerLeaveMs: 1100,
        inducerGlowMs: 5000,

        // OFFSETS
        laneStartOffset: new THREE.Vector3(0.270, 0.070, 0.000),
        laneEndOffset: new THREE.Vector3(-0.270, 0.070, 0.000),

        bindOffset: new THREE.Vector3(0.015, 0.005, 0.000),

        // same speed as flow, different direction after metabolism
        releaseOffset: new THREE.Vector3(-0.270, 0.005, 0.00),

        inducerStartOffset: new THREE.Vector3(-0.110, -0.020, 0.100),
        inducerBindOffset: new THREE.Vector3(-0.010, 0.010, 0.100),
        inducerExitOffset: new THREE.Vector3(-0.110, -0.020, 0.100)
      }
    };

    function pushInducerTimeout(fn, delay) {
      const id = window.setTimeout(fn, delay);
      inducerLoopFx.timers.push({ id, kind: 'timeout' });
      return id;
    }

    function pushInducerInterval(fn, delay) {
      const id = window.setInterval(fn, delay);
      inducerLoopFx.timers.push({ id, kind: 'interval' });
      return id;
    }

    function clearInducerLoopTimers() {
      inducerLoopFx.timers.forEach((entry) => {
        if (entry.kind === 'interval') clearInterval(entry.id);
        else clearTimeout(entry.id);
      });
      inducerLoopFx.timers = [];

      if (inducerLoopFx.rafId) {
        cancelAnimationFrame(inducerLoopFx.rafId);
        inducerLoopFx.rafId = null;
      }
    }

    function vec3ToStrSimple(v) {
      return `${v.x.toFixed(3)} ${v.y.toFixed(3)} ${v.z.toFixed(3)}`;
    }

    function easeLinear01(t) {
      return t;
    }

    function easeInOutSine01(t) {
      return -(Math.cos(Math.PI * t) - 1) / 2;
    }

    function getComparisonRigLocalFromWorld(entity) {
      const rig = document.getElementById('comparisonRig');
      if (!rig || !rig.object3D || !entity || !entity.object3D) {
        return new THREE.Vector3(0, 0, 0);
      }

      const world = new THREE.Vector3();
      entity.object3D.getWorldPosition(world);
      rig.object3D.worldToLocal(world);
      return world;
    }

    function setLocalPositionVec(entity, v) {
      if (!entity) return;
      if (entity.object3D) entity.object3D.position.copy(v);
      entity.setAttribute('position', vec3ToStrSimple(v));
    }

    function getLocalPositionVec(entity) {
      if (!entity) return new THREE.Vector3(0, 0, 0);
      if (entity.object3D) return entity.object3D.position.clone();
      return parseVec3(entity.getAttribute('position') || '0 0 0');
    }

    function setPrimitiveNow(entity, positionStr, opacity = 1) {
      if (!entity) return;
      entity.setAttribute('position', positionStr);
      entity.setAttribute('visible', opacity > 0);
      setPrimitiveOpacityRecursive(entity, opacity);
    }

    function setModelNow(entity, positionStr, opacity = 1) {
      if (!entity) return;
      entity.setAttribute('position', positionStr);
      entity.setAttribute('visible', opacity > 0);
      setModelOpacityRecursive(entity, opacity, 6);
    }

    const drugLabelFx = {
      started: false,
      rafId: null,
      root: null,
      entries: []
    };

    function ensureDrugLabelRoot() {
      if (drugLabelFx.root) return drugLabelFx.root;

      let root = document.getElementById('drugLabelRoot');
      if (!root) {
        root = document.createElement('a-entity');
        root.setAttribute('id', 'drugLabelRoot');
        (refs.comparisonRig || scene).appendChild(root);
      }

      drugLabelFx.root = root;
      return root;
    }

    function createDrugFloatingLabel(labelId, labelText) {
      let label = document.getElementById(labelId);
      if (label) return label;

      const root = ensureDrugLabelRoot();

      label = document.createElement('a-entity');
      label.setAttribute('id', labelId);
      label.setAttribute('visible', false);
      label.setAttribute('rotation', '0 180 0');
      label.setAttribute('rotation', '0 0 0');
      label.setAttribute('scale', '0.05 0.05 0.05');

      const bg = document.createElement('a-plane');
      bg.setAttribute('width', '0.78');
      bg.setAttribute('height', '0.18');
      bg.setAttribute(
        'material',
        'shader: flat; color: #07131d; transparent: true; opacity: 0.72; side: double;'
      );
      bg.setAttribute('position', '0 0 0');

      const text = document.createElement('a-text');
      text.setAttribute('value', labelText);
      text.setAttribute('align', 'center');
      text.setAttribute('anchor', 'center');
      text.setAttribute('color', '#ecfbff');
      text.setAttribute('width', '1.55');
      text.setAttribute('wrap-count', '16');
      text.setAttribute('position', '0 0 0.01');

      label.appendChild(bg);
      label.appendChild(text);
      root.appendChild(label);

      return label;
    }

    function upsertDrugLabelEntry(key, targetEntity, labelText, offsetWorld) {
      if (!targetEntity) return;

      const labelId = `${key}FloatingLabel`;
      const labelEntity = createDrugFloatingLabel(labelId, labelText);

      const existing = drugLabelFx.entries.find((entry) => entry.key === key);
      if (existing) {
        existing.target = targetEntity;
        existing.label = labelEntity;
        existing.offsetWorld.copy(offsetWorld);
        return;
      }

      drugLabelFx.entries.push({
        key,
        target: targetEntity,
        label: labelEntity,
        offsetWorld: offsetWorld.clone()
      });
    }

    function ensureDrugLabels() {
      upsertDrugLabelEntry(
        'rifampcinDrug',
        refs.rifampcinDrug,
        'Rifampicin',
        new THREE.Vector3(-0.0300, 0.02, -0.0200)
      );

      upsertDrugLabelEntry(
        'phenytoinDrug',
        refs.phenytoinDrug,
        'Phenytoin',
        new THREE.Vector3(-0.030, 0.02, -0.0200)
      );

      upsertDrugLabelEntry(
        'codeineDrug',
        refs.codeineDrug,
        'Codeine',
        new THREE.Vector3(-0.0300, 0.02, -0.0200)
      );

      upsertDrugLabelEntry(
        'morphineDrug',
        refs.morphineDrug,
        'Morphine',
        new THREE.Vector3(-0.0300, 0.02, -0.0200)
      );
    }

    function updateDrugLabels() {
      if (!drugLabelFx.started) return;

      ensureDrugLabels();

      drugLabelFx.entries.forEach((entry) => {
        const target = entry.target;
        const label = entry.label;

        if (!target || !label || !target.object3D || !label.object3D) return;

        const isVisible =
          target.getAttribute('visible') !== false &&
          target.object3D.visible !== false;

        const opacity =
          typeof target.__currentOpacity === 'number'
            ? target.__currentOpacity
            : (isVisible ? 1 : 0);

        const showLabel = isVisible && opacity > 0.02;

        label.setAttribute('visible', showLabel);
        if (!showLabel) return;

        const worldPos = getEntityWorldPosition(target).clone().add(entry.offsetWorld);
        const localPos = worldPos.clone();

        if (label.object3D.parent) {
          label.object3D.parent.worldToLocal(localPos);
        }

        label.object3D.position.copy(localPos);
        label.setAttribute('position', vecToStr(localPos));

        setPrimitiveOpacityRecursive(label, opacity);
      });

      drugLabelFx.rafId = requestAnimationFrame(updateDrugLabels);
    }

    function startDrugLabelUpdater() {
      if (drugLabelFx.started) return;

      ensureDrugLabels();
      drugLabelFx.started = true;
      updateDrugLabels();
    }

    function isInductionActive(now = performance.now()) {
      return now < inducerLoopFx.inducedUntil;
    }

    function getBaselineCooldownMs() {
      const fraction = THREE.MathUtils.clamp(
        inducerLoopFx.settings.baselineMetabolismFraction,
        0.01,
        1
      );

      return inducerLoopFx.settings.spawnEveryMs / fraction;
    }

    function getLaneSpeedUnitsPerMs() {
      buildInducerFlowPoints();
      const laneDistance = inducerLoopFx.points.laneStart.distanceTo(inducerLoopFx.points.laneEnd);
      return laneDistance / Math.max(1, inducerLoopFx.settings.flowTravelMs);
    }

    function getTravelMsAtLaneSpeed(fromVec, toVec, minMs = 0) {
      const speed = Math.max(0.000001, getLaneSpeedUnitsPerMs());
      const distance = fromVec.distanceTo(toVec);
      return Math.max(minMs, distance / speed);
    }

    function getBindPullDurationMs(now = performance.now()) {
      return isInductionActive(now)
        ? inducerLoopFx.settings.bindPullMsInduced
        : inducerLoopFx.settings.bindPullMsBaseline;
    }

    function getBindHoldDurationMs(now = performance.now()) {
      return isInductionActive(now)
        ? inducerLoopFx.settings.bindHoldMsInduced
        : inducerLoopFx.settings.bindHoldMsBaseline;
    }

    function buildInducerFlowPoints() {
      const enzymeLocal = getComparisonRigLocalFromWorld(inducerLoopFx.inducerEnzyme);
      const s = inducerLoopFx.settings;

      inducerLoopFx.points.enzyme.copy(enzymeLocal);
      inducerLoopFx.points.laneStart.copy(enzymeLocal).add(s.laneStartOffset);
      inducerLoopFx.points.laneEnd.copy(enzymeLocal).add(s.laneEndOffset);
      inducerLoopFx.points.bindPos.copy(enzymeLocal).add(s.bindOffset);
      inducerLoopFx.points.releaseRight.copy(enzymeLocal).add(s.releaseOffset);

      inducerLoopFx.points.inducerStart.copy(enzymeLocal).add(s.inducerStartOffset);
      inducerLoopFx.points.inducerBind.copy(enzymeLocal).add(s.inducerBindOffset);
      inducerLoopFx.points.inducerExit.copy(enzymeLocal).add(s.inducerExitOffset);

      if (inducerLoopFx.glow) {
        setLocalPositionVec(inducerLoopFx.glow, inducerLoopFx.points.enzyme);
      }
    }

    function ensureInducerLoopObjects() {
      inducerLoopFx.comparisonRig = document.getElementById('comparisonRig');
      inducerLoopFx.inducerEnzyme = document.getElementById('inducerEnzyme');
      inducerLoopFx.rifampcinDrug = document.getElementById('rifampcinDrug');

      if (!inducerLoopFx.comparisonRig || !inducerLoopFx.inducerEnzyme || !inducerLoopFx.rifampcinDrug) {
        return false;
      }

      if (!inducerLoopFx.particlesRoot) {
        const root = document.createElement('a-entity');
        root.setAttribute('id', 'inducerParticlesRoot');
        inducerLoopFx.comparisonRig.appendChild(root);
        inducerLoopFx.particlesRoot = root;
      }

      if (!inducerLoopFx.glow) {
        const glow = document.createElement('a-entity');
        glow.setAttribute('id', 'inducerEnzymeGlow');
        glow.setAttribute('geometry', 'primitive: sphere; radius: 0.055');
        glow.setAttribute(
          'material',
          'color: #63e68a; emissive: #63e68a; emissiveIntensity: 1.15; transparent: true; opacity: 0'
        );
        glow.setAttribute('visible', false);
        glow.setAttribute(
          'animation__pulse',
          'property: scale; from: 1 1 1; to: 1.10 1.10 1.10; dur: 900; dir: alternate; loop: true; easing: easeInOutSine'
        );
        inducerLoopFx.particlesRoot.appendChild(glow);
        inducerLoopFx.glow = glow;
      }

      if (inducerLoopFx.particles.length === 0) {
        for (let i = 0; i < inducerLoopFx.settings.particleCount; i += 1) {
          const particle = document.createElement('a-entity');
          particle.setAttribute('id', `inducerParticle${i + 1}`);
          particle.setAttribute(
            'geometry',
            `primitive: sphere; radius: ${inducerLoopFx.settings.particleRadius}`
          );
          particle.setAttribute(
            'material',
            'color: #ffd166; emissive: #ffe08a; emissiveIntensity: 0.40; transparent: true; opacity: 0'
          );
          particle.setAttribute('visible', false);

          particle.__flowState = 'idle';
          particle.__flowStartMs = 0;
          particle.__flowFrom = null;
          particle.__flowTo = null;
          particle.__motion = null;
          particle.__holdUntil = 0;

          inducerLoopFx.particlesRoot.appendChild(particle);
          inducerLoopFx.particles.push(particle);
        }
      }

      buildInducerFlowPoints();
      return true;
    }

    function triggerInducerGlow(activeMs = 3000) {
      if (!inducerLoopFx.glow) return;

      inducerLoopFx.glow.setAttribute('visible', true);
      animatePrimitiveOpacity(inducerLoopFx.glow, 0.28, 180, false);

      pushInducerTimeout(() => {
        animatePrimitiveOpacity(inducerLoopFx.glow, 0, 450, true);
      }, activeMs);
    }

    function resetInducerParticle(particle) {
      if (!particle) return;

      stopEntityMotion(particle);
      particle.__flowState = 'idle';
      particle.__flowStartMs = 0;
      particle.__flowFrom = null;
      particle.__flowTo = null;
      particle.__motion = null;
      particle.__holdUntil = 0;

      particle.setAttribute('scale', '1 1 1');
      setPrimitiveNow(particle, '0 0 0', 0);
    }

    function resetInducerLoopState() {
      inducerLoopFx.enzymeBusy = false;
      inducerLoopFx.baselineNextCaptureAt = performance.now();
      inducerLoopFx.inducedUntil = 0;

      inducerLoopFx.particles.forEach(resetInducerParticle);

      if (inducerLoopFx.glow) {
        stopEntityMotion(inducerLoopFx.glow);
        setPrimitiveNow(inducerLoopFx.glow, vec3ToStrSimple(inducerLoopFx.points.enzyme), 0);
      }

      if (inducerLoopFx.rifampcinDrug) {
        stopEntityMotion(inducerLoopFx.rifampcinDrug);
        setModelNow(
          inducerLoopFx.rifampcinDrug,
          vec3ToStrSimple(inducerLoopFx.points.inducerStart),
          1
        );
        inducerLoopFx.rifampcinDrug.setAttribute('visible', true);
      }
    }

    function getFreeInducerParticle() {
      return inducerLoopFx.particles.find((particle) => particle.__flowState === 'idle') || null;
    }

    function spawnFlowParticle() {
      if (!ensureInducerLoopObjects()) return;

      buildInducerFlowPoints();

      const particle = getFreeInducerParticle();
      if (!particle) return;

      particle.__flowState = 'flowing';
      particle.__flowStartMs = performance.now();
      particle.__flowFrom = inducerLoopFx.points.laneStart.clone();
      particle.__flowTo = inducerLoopFx.points.laneEnd.clone();
      particle.__motion = null;
      particle.__holdUntil = 0;

      setLocalPositionVec(particle, particle.__flowFrom);
      particle.setAttribute('visible', true);
      setPrimitiveOpacityRecursive(particle, inducerLoopFx.settings.particleOpacity);
    }

    function startParticleMotion(particle, fromVec, toVec, durationMs, easeFn, onComplete) {
      particle.__motion = {
        from: fromVec.clone(),
        to: toVec.clone(),
        startMs: performance.now(),
        durationMs: Math.max(1, durationMs),
        easeFn: easeFn || easeInOutSine01,
        onComplete: typeof onComplete === 'function' ? onComplete : null
      };
    }

    function updateParticleMotion(particle, now) {
      const motion = particle.__motion;
      if (!motion) return;

      const rawT = Math.min(1, (now - motion.startMs) / motion.durationMs);
      const easedT = motion.easeFn(rawT);
      const nextPos = motion.from.clone().lerp(motion.to, easedT);

      setLocalPositionVec(particle, nextPos);

      if (particle.__flowState === 'releasing') {
        const nextOpacity = inducerLoopFx.settings.particleOpacity * (1 - rawT * 0.35);
        setPrimitiveOpacityRecursive(particle, Math.max(0, nextOpacity));
      }

      if (rawT >= 1) {
        particle.__motion = null;
        if (motion.onComplete) motion.onComplete();
      }
    }

    function findClosestCapturableParticle(now) {
      buildInducerFlowPoints();

      const bindPos = inducerLoopFx.points.bindPos;
      const maxRadius = isInductionActive(now)
        ? inducerLoopFx.settings.captureRadiusInduced
        : inducerLoopFx.settings.captureRadiusBaseline;

      let bestParticle = null;
      let bestDist = Infinity;

      inducerLoopFx.particles.forEach((particle) => {
        if (particle.__flowState !== 'flowing') return;

        const pos = getLocalPositionVec(particle);
        const dist = pos.distanceTo(bindPos);

        if (dist <= maxRadius && dist < bestDist) {
          bestDist = dist;
          bestParticle = particle;
        }
      });

      return bestParticle;
    }

    function startReleaseFromEnzyme(particle) {
      buildInducerFlowPoints();

      particle.__flowState = 'releasing';

      const fromVec = getLocalPositionVec(particle);
      const toVec = inducerLoopFx.points.releaseRight.clone();
      const releaseDur = getTravelMsAtLaneSpeed(
        fromVec,
        toVec,
        inducerLoopFx.settings.releaseMinMs
      );

      // enzyme becomes free as soon as the molecule detaches
      inducerLoopFx.enzymeBusy = false;

      startParticleMotion(
        particle,
        fromVec,
        toVec,
        releaseDur,
        easeInOutSine01,
        () => {
          resetInducerParticle(particle);
        }
      );
    }

    function captureParticleToEnzyme(particle, now) {
      if (!particle) return;

      buildInducerFlowPoints();

      inducerLoopFx.enzymeBusy = true;

      if (!isInductionActive(now)) {
        inducerLoopFx.baselineNextCaptureAt = now + getBaselineCooldownMs();
      }

      const pullDur = getBindPullDurationMs(now);
      const holdDur = getBindHoldDurationMs(now);

      particle.__flowState = 'capturing';
      setPrimitiveOpacityRecursive(particle, 0.95);

      startParticleMotion(
        particle,
        getLocalPositionVec(particle),
        inducerLoopFx.points.bindPos,
        pullDur,
        easeInOutSine01,
        () => {
          particle.__flowState = 'bound';
          particle.__holdUntil = performance.now() + holdDur;
          setLocalPositionVec(particle, inducerLoopFx.points.bindPos);
        }
      );
    }

    function tryCaptureClosestParticle(now) {
      if (inducerLoopFx.enzymeBusy) return;
      if (!isInductionActive(now) && now < inducerLoopFx.baselineNextCaptureAt) return;

      const particle = findClosestCapturableParticle(now);
      if (!particle) return;

      captureParticleToEnzyme(particle, now);
    }

    function updateInducerFlow(now) {
      if (!inducerLoopFx.started) return;

      buildInducerFlowPoints();

      inducerLoopFx.particles.forEach((particle) => {
        if (particle.__flowState === 'flowing') {
          const rawT = (now - particle.__flowStartMs) / inducerLoopFx.settings.flowTravelMs;

          if (rawT >= 1) {
            resetInducerParticle(particle);
            return;
          }

          const nextPos = particle.__flowFrom.clone().lerp(particle.__flowTo, easeLinear01(rawT));
          setLocalPositionVec(particle, nextPos);
          return;
        }

        if (particle.__motion) {
          updateParticleMotion(particle, now);
          return;
        }

        if (particle.__flowState === 'bound' && now >= particle.__holdUntil) {
          startReleaseFromEnzyme(particle);
        }
      });

      tryCaptureClosestParticle(now);
      inducerLoopFx.rafId = requestAnimationFrame(updateInducerFlow);
    }

    function startInductionPulse() {
      if (!ensureInducerLoopObjects()) return;

      buildInducerFlowPoints();

      const rifampcin = inducerLoopFx.rifampcinDrug;
      const startPos = vec3ToStrSimple(inducerLoopFx.points.inducerStart);
      const bindPos = vec3ToStrSimple(inducerLoopFx.points.inducerBind);
      const exitPos = vec3ToStrSimple(inducerLoopFx.points.inducerExit);

      stopEntityMotion(rifampcin);
      setModelNow(rifampcin, startPos, 1);
      rifampcin.setAttribute('visible', true);

      animatePosition(
        rifampcin,
        bindPos,
        inducerLoopFx.settings.inducerApproachMs,
        false
      );

      // start glow exactly when inducer binds
      pushInducerTimeout(() => {
        setModelNow(rifampcin, bindPos, 1);
        inducerLoopFx.inducedUntil = performance.now() + inducerLoopFx.settings.inducerGlowMs;
        triggerInducerGlow(inducerLoopFx.settings.inducerGlowMs);
      }, inducerLoopFx.settings.inducerApproachMs);

      // short bind hold, then move away
      pushInducerTimeout(() => {
        animatePosition(
          rifampcin,
          exitPos,
          inducerLoopFx.settings.inducerLeaveMs,
          false
        );
      }, inducerLoopFx.settings.inducerApproachMs + inducerLoopFx.settings.inducerBindHoldMs);

      // keep visible at exit
      pushInducerTimeout(() => {
        setModelNow(rifampcin, exitPos, 1);
        rifampcin.setAttribute('visible', true);
      }, inducerLoopFx.settings.inducerApproachMs + inducerLoopFx.settings.inducerBindHoldMs + inducerLoopFx.settings.inducerLeaveMs + 20);

      // after induction ends, re-align baseline pacing
      pushInducerTimeout(() => {
        inducerLoopFx.baselineNextCaptureAt = performance.now() + getBaselineCooldownMs();
      }, inducerLoopFx.settings.inducerApproachMs + inducerLoopFx.settings.inducerGlowMs);
    }

    function startInducerLoopWhenReady() {
      if (inducerLoopFx.started) return;

      if (!ensureInducerLoopObjects()) {
        window.setTimeout(startInducerLoopWhenReady, 300);
        return;
      }

      const rifampcinMesh = inducerLoopFx.rifampcinDrug.getObject3D('mesh');
      const enzymeMesh = inducerLoopFx.inducerEnzyme.getObject3D('mesh');

      if (!rifampcinMesh || !enzymeMesh) {
        window.setTimeout(startInducerLoopWhenReady, 300);
        return;
      }

      clearInducerLoopTimers();
      resetInducerLoopState();

      inducerLoopFx.started = true;

      spawnFlowParticle();
      pushInducerInterval(spawnFlowParticle, inducerLoopFx.settings.spawnEveryMs);

      pushInducerTimeout(() => {
        startInductionPulse();
        pushInducerInterval(startInductionPulse, inducerLoopFx.settings.inducerCycleMs);
      }, inducerLoopFx.settings.inducerCycleMs);

      inducerLoopFx.baselineNextCaptureAt = performance.now();
      inducerLoopFx.rafId = requestAnimationFrame(updateInducerFlow);
    }

    // =========================================================
    // INHIBITOR BOX LOOP ANIMATION
    // - constant particle flow
    // - phenytoin binds to the enzyme
    // - while blocked, only the nearest particle that enters the
    //   hit zone bumps once and flies away
    // - NOT all particles bump
    // =========================================================

    const inhibitorLoopFx = {
      started: false,
      comparisonRig: null,
      inhibitorEnzyme: null,
      inhibitorDrug: null,
      particlesRoot: null,
      glow: null,
      particles: [],
      timers: [],
      rafId: null,

      enzymeBusy: false,
      enzymeRecoveryUntil: 0,
      blockedUntil: 0,

      pulseInProgress: false,
      retryScheduled: false,

      blockedInteractionActive: false,
      blockedInteractionParticleId: null,
      blockedHitCooldownUntil: 0,
      scatterIndex: 0,

      points: {
        enzyme: new THREE.Vector3(),
        laneStart: new THREE.Vector3(),
        laneEnd: new THREE.Vector3(),
        bindPos: new THREE.Vector3(),
        releaseRight: new THREE.Vector3(),
        inhibitorStart: new THREE.Vector3(),
        inhibitorBind: new THREE.Vector3(),
        inhibitorExit: new THREE.Vector3()
      },

      scatterDirections: [
        new THREE.Vector3(-1.00, 0.25, 0.18).normalize(),
        new THREE.Vector3(-1.00, -0.22, -0.16).normalize(),
        new THREE.Vector3(-0.88, 0.14, -0.40).normalize(),
        new THREE.Vector3(-0.88, -0.18, 0.34).normalize()
      ],

      settings: {
        particleCount: 90,
        particleRadius: 0.006,
        particleOpacity: 0.78,

        // FLOW
        spawnEveryMs: 500,
        flowTravelMs: 10000,

        // FREE ENZYME METABOLISM
        bindPullMsBaseline: 300,
        bindHoldMsBaseline: 700,
        releaseMinMs: 420,
        captureRadiusBaseline: 0.16,
        postReleaseBufferMs: 260,

        // INHIBITOR TIMING
        inhibitorCycleMs: 6000,
        inhibitorApproachMs: 900,
        inhibitorBindHoldMs: 3000,
        inhibitorLeaveMs: 800,
        retryDelayMs: 220,

        // BLOCKED BUMP BEHAVIOR
        blockedHitRadius: 0.090,
        blockedHitMinMs: 0,
        blockedHitReboundDistance: 0.050,
        blockedScatterDistance: 0.0,
        blockedHitCooldownMs: 370,

        // FLOW PATH
        laneStartOffset: new THREE.Vector3(0.270, 0.070, 0.000),
        laneEndOffset: new THREE.Vector3(-0.270, 0.070, 0.000),
        bindOffset: new THREE.Vector3(0.015, 0.005, 0.000),
        releaseOffset: new THREE.Vector3(-0.270, 0.005, 0.000),

        // PHENYTOIN BINDING
        inhibitorBindOffset: new THREE.Vector3(-0.020, 0.020, 0.010),
        inhibitorStartOffsetFromBind: new THREE.Vector3(-0.050, -0.050, 0.090),
        inhibitorExitOffsetFromBind: new THREE.Vector3(-0.050, -0.050, 0.090)
      }
    };

    function pushInhibitorTimeout(fn, delay) {
      const id = window.setTimeout(fn, delay);
      inhibitorLoopFx.timers.push({ id, kind: 'timeout' });
      return id;
    }

    function pushInhibitorInterval(fn, delay) {
      const id = window.setInterval(fn, delay);
      inhibitorLoopFx.timers.push({ id, kind: 'interval' });
      return id;
    }

    function clearInhibitorLoopTimers() {
      inhibitorLoopFx.timers.forEach((entry) => {
        if (entry.kind === 'interval') clearInterval(entry.id);
        else clearTimeout(entry.id);
      });
      inhibitorLoopFx.timers = [];

      if (inhibitorLoopFx.rafId) {
        cancelAnimationFrame(inhibitorLoopFx.rafId);
        inhibitorLoopFx.rafId = null;
      }

      inhibitorLoopFx.pulseInProgress = false;
      inhibitorLoopFx.retryScheduled = false;
      inhibitorLoopFx.blockedInteractionActive = false;
      inhibitorLoopFx.blockedInteractionParticleId = null;
      inhibitorLoopFx.blockedHitCooldownUntil = 0;
    }

    function ensureInhibitorFlowRaf() {
      if (!inhibitorLoopFx.started) return;
      if (inhibitorLoopFx.rafId) return;
      inhibitorLoopFx.rafId = requestAnimationFrame(updateInhibitorFlow);
    }

    function isInhibitorBlocked(now = performance.now()) {
      return now < inhibitorLoopFx.blockedUntil;
    }

    function isInhibitorRecovering(now = performance.now()) {
      return now < inhibitorLoopFx.enzymeRecoveryUntil;
    }

    function buildInhibitorFlowPoints() {
      const enzymeLocal = getComparisonRigLocalFromWorld(inhibitorLoopFx.inhibitorEnzyme);
      const s = inhibitorLoopFx.settings;

      inhibitorLoopFx.points.enzyme.copy(enzymeLocal);
      inhibitorLoopFx.points.laneStart.copy(enzymeLocal).add(s.laneStartOffset);
      inhibitorLoopFx.points.laneEnd.copy(enzymeLocal).add(s.laneEndOffset);
      inhibitorLoopFx.points.bindPos.copy(enzymeLocal).add(s.bindOffset);
      inhibitorLoopFx.points.releaseRight.copy(enzymeLocal).add(s.releaseOffset);

      inhibitorLoopFx.points.inhibitorBind
        .copy(enzymeLocal)
        .add(s.inhibitorBindOffset);

      inhibitorLoopFx.points.inhibitorStart
        .copy(inhibitorLoopFx.points.inhibitorBind)
        .add(s.inhibitorStartOffsetFromBind);

      inhibitorLoopFx.points.inhibitorExit
        .copy(inhibitorLoopFx.points.inhibitorBind)
        .add(s.inhibitorExitOffsetFromBind);

      if (inhibitorLoopFx.glow) {
        setLocalPositionVec(inhibitorLoopFx.glow, inhibitorLoopFx.points.enzyme);
      }
    }

    function getInhibitorLaneSpeedUnitsPerMs() {
      buildInhibitorFlowPoints();
      const laneDistance = inhibitorLoopFx.points.laneStart.distanceTo(inhibitorLoopFx.points.laneEnd);
      return laneDistance / Math.max(1, inhibitorLoopFx.settings.flowTravelMs);
    }

    function getInhibitorTravelMsAtLaneSpeed(fromVec, toVec, minMs = 0) {
      const speed = Math.max(0.000001, getInhibitorLaneSpeedUnitsPerMs());
      const distance = fromVec.distanceTo(toVec);
      return Math.max(minMs, distance / speed);
    }

    function ensureInhibitorLoopObjects() {
      inhibitorLoopFx.comparisonRig = document.getElementById('comparisonRig');
      inhibitorLoopFx.inhibitorEnzyme = document.getElementById('inhibitorEnzyme');
      inhibitorLoopFx.inhibitorDrug = document.getElementById('phenytoinDrug');

      if (!inhibitorLoopFx.comparisonRig || !inhibitorLoopFx.inhibitorEnzyme || !inhibitorLoopFx.inhibitorDrug) {
        return false;
      }

      if (!inhibitorLoopFx.particlesRoot) {
        const root = document.createElement('a-entity');
        root.setAttribute('id', 'inhibitorParticlesRoot');
        inhibitorLoopFx.comparisonRig.appendChild(root);
        inhibitorLoopFx.particlesRoot = root;
      }

      if (!inhibitorLoopFx.glow) {
        const glow = document.createElement('a-entity');
        glow.setAttribute('id', 'inhibitorBlockGlow');
        glow.setAttribute('geometry', 'primitive: sphere; radius: 0.055');
        glow.setAttribute(
          'material',
          'color: #ff6b6b; emissive: #ff6b6b; emissiveIntensity: 1.1; transparent: true; opacity: 0'
        );
        glow.setAttribute('visible', false);
        glow.setAttribute(
          'animation__pulse',
          'property: scale; from: 1 1 1; to: 1.08 1.08 1.08; dur: 900; dir: alternate; loop: true; easing: easeInOutSine'
        );
        inhibitorLoopFx.particlesRoot.appendChild(glow);
        inhibitorLoopFx.glow = glow;
      }

      if (inhibitorLoopFx.particles.length === 0) {
        for (let i = 0; i < inhibitorLoopFx.settings.particleCount; i += 1) {
          const particle = document.createElement('a-entity');
          particle.setAttribute('id', `inhibitorParticle${i + 1}`);
          particle.setAttribute(
            'geometry',
            `primitive: sphere; radius: ${inhibitorLoopFx.settings.particleRadius}`
          );
          particle.setAttribute(
            'material',
            'color: #ffd166; emissive: #ffe08a; emissiveIntensity: 0.40; transparent: true; opacity: 0'
          );
          particle.setAttribute('visible', false);

          particle.__flowState = 'idle';
          particle.__flowStartMs = 0;
          particle.__flowTravelMs = 0;
          particle.__flowFrom = null;
          particle.__flowTo = null;
          particle.__motion = null;
          particle.__holdUntil = 0;
          particle.__visualMode = 'normal';
          particle.__blockedIgnoreUntil = 0;

          inhibitorLoopFx.particlesRoot.appendChild(particle);
          inhibitorLoopFx.particles.push(particle);
        }
      }

      buildInhibitorFlowPoints();
      return true;
    }

    function triggerInhibitorBlockGlow(activeMs = 2000) {
      if (!inhibitorLoopFx.glow) return;

      inhibitorLoopFx.glow.setAttribute('visible', true);
      animatePrimitiveOpacity(inhibitorLoopFx.glow, 0.26, 180, false);

      pushInhibitorTimeout(() => {
        animatePrimitiveOpacity(inhibitorLoopFx.glow, 0, 450, true);
      }, activeMs);
    }

    function setInhibitorParticleVisual(particle, mode = 'normal') {
      if (!particle) return;

      const palette = mode === 'bound'
        ? {
          color: '#7dd3fc',
          emissive: '#7dd3fc',
          emissiveIntensity: 0.95
        }
        : {
          color: '#ffd166',
          emissive: '#ffe08a',
          emissiveIntensity: 0.40
        };

      particle.setAttribute('material', 'color', palette.color);
      particle.setAttribute('material', 'emissive', palette.emissive);
      particle.setAttribute('material', 'emissiveIntensity', palette.emissiveIntensity);

      if (particle.object3D) {
        particle.object3D.traverse((node) => {
          if (!node.isMesh || !node.material) return;
          const materials = Array.isArray(node.material) ? node.material : [node.material];
          materials.forEach((mat) => {
            if (mat.color) mat.color.set(palette.color);
            if (mat.emissive) mat.emissive.set(palette.emissive);
            mat.emissiveIntensity = palette.emissiveIntensity;
            mat.needsUpdate = true;
          });
        });
      }

      particle.__visualMode = mode;
    }

    function resetInhibitorParticle(particle) {
      if (!particle) return;

      stopEntityMotion(particle);
      particle.__flowState = 'idle';
      particle.__flowStartMs = 0;
      particle.__flowTravelMs = 0;
      particle.__flowFrom = null;
      particle.__flowTo = null;
      particle.__motion = null;
      particle.__holdUntil = 0;
      particle.__blockedIgnoreUntil = 0;

      if (inhibitorLoopFx.blockedInteractionParticleId === particle.id) {
        inhibitorLoopFx.blockedInteractionActive = false;
        inhibitorLoopFx.blockedInteractionParticleId = null;
      }

      particle.setAttribute('scale', '1 1 1');
      setInhibitorParticleVisual(particle, 'normal');
      setPrimitiveNow(particle, '0 0 0', 0);
    }

    function resetInhibitorLoopState() {
      inhibitorLoopFx.enzymeBusy = false;
      inhibitorLoopFx.enzymeRecoveryUntil = 0;
      inhibitorLoopFx.blockedUntil = 0;
      inhibitorLoopFx.pulseInProgress = false;
      inhibitorLoopFx.retryScheduled = false;
      inhibitorLoopFx.blockedInteractionActive = false;
      inhibitorLoopFx.blockedInteractionParticleId = null;
      inhibitorLoopFx.blockedHitCooldownUntil = 0;
      inhibitorLoopFx.scatterIndex = 0;

      inhibitorLoopFx.particles.forEach(resetInhibitorParticle);

      if (inhibitorLoopFx.glow) {
        stopEntityMotion(inhibitorLoopFx.glow);
        setPrimitiveNow(inhibitorLoopFx.glow, vec3ToStrSimple(inhibitorLoopFx.points.enzyme), 0);
      }

      if (inhibitorLoopFx.inhibitorDrug) {
        stopEntityMotion(inhibitorLoopFx.inhibitorDrug);
        setModelNow(
          inhibitorLoopFx.inhibitorDrug,
          vec3ToStrSimple(inhibitorLoopFx.points.inhibitorStart),
          1
        );
        inhibitorLoopFx.inhibitorDrug.setAttribute('visible', true);
      }
    }

    function getFreeInhibitorParticle() {
      return inhibitorLoopFx.particles.find((particle) => particle.__flowState === 'idle') || null;
    }

    function spawnInhibitorFlowParticle() {
      if (!ensureInhibitorLoopObjects()) return;

      buildInhibitorFlowPoints();

      const particle = getFreeInhibitorParticle();
      if (!particle) return;

      particle.__flowState = 'flowing';
      particle.__flowStartMs = performance.now();
      particle.__flowTravelMs = inhibitorLoopFx.settings.flowTravelMs;
      particle.__flowFrom = inhibitorLoopFx.points.laneStart.clone();
      particle.__flowTo = inhibitorLoopFx.points.laneEnd.clone();
      particle.__motion = null;
      particle.__holdUntil = 0;
      particle.__blockedIgnoreUntil = 0;

      setInhibitorParticleVisual(particle, 'normal');
      setLocalPositionVec(particle, particle.__flowFrom);
      particle.setAttribute('visible', true);
      setPrimitiveOpacityRecursive(particle, inhibitorLoopFx.settings.particleOpacity);

      ensureInhibitorFlowRaf();
    }

    function startInhibitorParticleMotion(particle, fromVec, toVec, durationMs, easeFn, onComplete) {
      particle.__motion = {
        from: fromVec.clone(),
        to: toVec.clone(),
        startMs: performance.now(),
        durationMs: Math.max(1, durationMs),
        easeFn: easeFn || easeInOutSine01,
        onComplete: typeof onComplete === 'function' ? onComplete : null
      };
    }

    function updateInhibitorParticleMotion(particle, now) {
      const motion = particle.__motion;
      if (!motion) return;

      const rawT = Math.min(1, (now - motion.startMs) / motion.durationMs);
      const easedT = motion.easeFn(rawT);
      const nextPos = motion.from.clone().lerp(motion.to, easedT);

      setLocalPositionVec(particle, nextPos);

      if (
        particle.__flowState === 'releasing' ||
        particle.__flowState === 'blockedScatter'
      ) {
        const nextOpacity = inhibitorLoopFx.settings.particleOpacity * (1 - rawT * 0.35);
        setPrimitiveOpacityRecursive(particle, Math.max(0, nextOpacity));
      }

      if (rawT >= 1) {
        particle.__motion = null;
        if (motion.onComplete) motion.onComplete();
      }
    }

    function findClosestCapturableInhibitorParticle() {
      buildInhibitorFlowPoints();

      const bindPos = inhibitorLoopFx.points.bindPos;
      const maxRadius = inhibitorLoopFx.settings.captureRadiusBaseline;

      let bestParticle = null;
      let bestDist = Infinity;

      inhibitorLoopFx.particles.forEach((particle) => {
        if (particle.__flowState !== 'flowing') return;

        const pos = getLocalPositionVec(particle);
        const dist = pos.distanceTo(bindPos);

        if (dist <= maxRadius && dist < bestDist) {
          bestDist = dist;
          bestParticle = particle;
        }
      });

      return bestParticle;
    }

    function captureInhibitorParticleToEnzyme(particle) {
      if (!particle) return;

      buildInhibitorFlowPoints();

      inhibitorLoopFx.enzymeBusy = true;

      particle.__flowState = 'capturing';
      setPrimitiveOpacityRecursive(particle, 0.95);

      startInhibitorParticleMotion(
        particle,
        getLocalPositionVec(particle),
        inhibitorLoopFx.points.bindPos,
        inhibitorLoopFx.settings.bindPullMsBaseline,
        easeInOutSine01,
        () => {
          setInhibitorParticleVisual(particle, 'bound');
          particle.__flowState = 'bound';
          particle.__holdUntil = performance.now() + inhibitorLoopFx.settings.bindHoldMsBaseline;
          setLocalPositionVec(particle, inhibitorLoopFx.points.bindPos);
        }
      );
    }

    function tryCaptureClosestInhibitorParticle(now) {
      if (inhibitorLoopFx.enzymeBusy) return;
      if (isInhibitorBlocked(now)) return;
      if (isInhibitorRecovering(now)) return;

      const particle = findClosestCapturableInhibitorParticle();
      if (!particle) return;

      captureInhibitorParticleToEnzyme(particle);
    }

    function startInhibitorReleaseFromEnzyme(particle) {
      buildInhibitorFlowPoints();

      particle.__flowState = 'releasing';

      const fromVec = getLocalPositionVec(particle);
      const toVec = inhibitorLoopFx.points.releaseRight.clone();
      const releaseDur = getInhibitorTravelMsAtLaneSpeed(
        fromVec,
        toVec,
        inhibitorLoopFx.settings.releaseMinMs
      );

      inhibitorLoopFx.enzymeBusy = false;
      inhibitorLoopFx.enzymeRecoveryUntil =
        performance.now() + inhibitorLoopFx.settings.postReleaseBufferMs;

      startInhibitorParticleMotion(
        particle,
        fromVec,
        toVec,
        releaseDur,
        easeInOutSine01,
        () => {
          resetInhibitorParticle(particle);
        }
      );
    }

    function findClosestBlockedHitParticle(now) {
      if (inhibitorLoopFx.blockedInteractionActive) return null;
      if (now < inhibitorLoopFx.blockedHitCooldownUntil) return null;

      buildInhibitorFlowPoints();

      const bindPos = inhibitorLoopFx.points.bindPos;
      const radius = inhibitorLoopFx.settings.blockedHitRadius;

      let bestParticle = null;
      let bestDist = Infinity;

      inhibitorLoopFx.particles.forEach((particle) => {
        if (particle.__flowState !== 'flowing') return;
        if (particle.__blockedIgnoreUntil > now) return;

        const pos = getLocalPositionVec(particle);
        const dist = pos.distanceTo(bindPos);

        if (dist <= radius && dist < bestDist) {
          bestDist = dist;
          bestParticle = particle;
        }
      });

      return bestParticle;
    }

    function releaseBlockedInteraction(particle = null) {
      if (!particle) {
        inhibitorLoopFx.blockedInteractionActive = false;
        inhibitorLoopFx.blockedInteractionParticleId = null;
        return;
      }

      if (
        inhibitorLoopFx.blockedInteractionParticleId &&
        inhibitorLoopFx.blockedInteractionParticleId !== particle.id
      ) {
        return;
      }

      inhibitorLoopFx.blockedInteractionActive = false;
      inhibitorLoopFx.blockedInteractionParticleId = null;
      inhibitorLoopFx.blockedHitCooldownUntil =
        performance.now() + inhibitorLoopFx.settings.blockedHitCooldownMs;
    }

    function returnBlockedParticleToTrack(particle, directionVec) {
      if (!particle) return;

      buildInhibitorFlowPoints();

      const currentPos = getLocalPositionVec(particle);
      const laneStart = inhibitorLoopFx.points.laneStart.clone();
      const laneEnd = inhibitorLoopFx.points.laneEnd.clone();
      const laneVec = laneEnd.clone().sub(laneStart);

      const laneLenSq = Math.max(0.000001, laneVec.lengthSq());

      // project current particle position back onto the original lane
      const tRaw = currentPos.clone().sub(laneStart).dot(laneVec) / laneLenSq;
      const t = THREE.MathUtils.clamp(tRaw, 0, 1);

      const rejoinTarget = laneStart.clone().add(laneVec.multiplyScalar(t));

      const rejoinDur = getInhibitorTravelMsAtLaneSpeed(
        currentPos,
        rejoinTarget,
        inhibitorLoopFx.settings.releaseMinMs
      );

      particle.__flowState = 'blockedReturn';
      particle.__blockedIgnoreUntil = performance.now() + 900;

      releaseBlockedInteraction(particle);

      startInhibitorParticleMotion(
        particle,
        currentPos,
        rejoinTarget,
        rejoinDur,
        easeInOutSine01,
        () => {
          // resume normal lane flow from the rejoin point
          particle.__flowState = 'flowing';
          particle.__flowFrom = rejoinTarget.clone();
          particle.__flowTo = inhibitorLoopFx.points.laneEnd.clone();

          const remainingDistance = particle.__flowFrom.distanceTo(particle.__flowTo);
          const laneSpeed = Math.max(0.000001, getInhibitorLaneSpeedUnitsPerMs());
          particle.__flowTravelMs = remainingDistance / laneSpeed;
          particle.__flowStartMs = performance.now();

          setLocalPositionVec(particle, particle.__flowFrom);
          setPrimitiveOpacityRecursive(particle, inhibitorLoopFx.settings.particleOpacity);
          setInhibitorParticleVisual(particle, 'normal');
        }
      );
    }

    function startBlockedParticleEncounter(particle) {
      if (!particle || particle.__flowState !== 'flowing') return;

      inhibitorLoopFx.blockedInteractionActive = true;
      inhibitorLoopFx.blockedInteractionParticleId = particle.id;

      const hitPos = inhibitorLoopFx.points.bindPos.clone();
      const currentPos = getLocalPositionVec(particle);

      const direction =
        inhibitorLoopFx.scatterDirections[
          inhibitorLoopFx.scatterIndex % inhibitorLoopFx.scatterDirections.length
        ].clone();

      inhibitorLoopFx.scatterIndex += 1;

      const hitDur = getInhibitorTravelMsAtLaneSpeed(
        currentPos,
        hitPos,
        inhibitorLoopFx.settings.blockedHitMinMs
      );

      particle.__flowState = 'blockedTapIn';

      startInhibitorParticleMotion(
        particle,
        currentPos,
        hitPos,
        hitDur,
        easeInOutSine01,
        () => {
          const reboundTarget = hitPos.clone().add(
            direction.clone().multiplyScalar(inhibitorLoopFx.settings.blockedHitReboundDistance)
          );

          const reboundDur = getInhibitorTravelMsAtLaneSpeed(
            hitPos,
            reboundTarget,
            inhibitorLoopFx.settings.blockedHitMinMs
          );

          particle.__flowState = 'blockedTapOut';

          startInhibitorParticleMotion(
            particle,
            hitPos,
            reboundTarget,
            reboundDur,
            easeInOutSine01,
            () => {
              returnBlockedParticleToTrack(particle, direction);
            }
          );
        }
      );
    }

    function tryBlockedParticleResponse(now) {
      if (!isInhibitorBlocked(now)) return;
      if (inhibitorLoopFx.blockedInteractionActive) return;

      const particle = findClosestBlockedHitParticle(now);
      if (!particle) return;

      startBlockedParticleEncounter(particle);
    }

    function updateInhibitorFlow(now) {
      inhibitorLoopFx.rafId = null;

      if (!inhibitorLoopFx.started) return;

      buildInhibitorFlowPoints();

      inhibitorLoopFx.particles.forEach((particle) => {
        if (particle.__flowState === 'flowing') {
          const travelMs = particle.__flowTravelMs || inhibitorLoopFx.settings.flowTravelMs;
          const rawT = (now - particle.__flowStartMs) / travelMs;

          if (rawT >= 1) {
            resetInhibitorParticle(particle);
            return;
          }

          const nextPos = particle.__flowFrom.clone().lerp(particle.__flowTo, easeLinear01(rawT));
          setLocalPositionVec(particle, nextPos);
          return;
        }

        if (particle.__motion) {
          updateInhibitorParticleMotion(particle, now);
          return;
        }

        if (particle.__flowState === 'bound' && now >= particle.__holdUntil) {
          startInhibitorReleaseFromEnzyme(particle);
        }
      });

      if (isInhibitorBlocked(now)) {
        tryBlockedParticleResponse(now);
      } else {
        tryCaptureClosestInhibitorParticle(now);
      }

      ensureInhibitorFlowRaf();
    }

    function scheduleInhibitorPulseRetry() {
      if (!inhibitorLoopFx.started) return;
      if (inhibitorLoopFx.retryScheduled) return;

      inhibitorLoopFx.retryScheduled = true;

      pushInhibitorTimeout(() => {
        inhibitorLoopFx.retryScheduled = false;
        if (!inhibitorLoopFx.started) return;
        startInhibitorPulse();
      }, inhibitorLoopFx.settings.retryDelayMs);
    }

    function startInhibitorPulse() {
      if (!ensureInhibitorLoopObjects()) return;
      if (!inhibitorLoopFx.started) return;

      const now = performance.now();

      if (
        inhibitorLoopFx.pulseInProgress ||
        inhibitorLoopFx.enzymeBusy ||
        isInhibitorBlocked(now) ||
        isInhibitorRecovering(now)
      ) {
        scheduleInhibitorPulseRetry();
        return;
      }

      inhibitorLoopFx.retryScheduled = false;
      inhibitorLoopFx.pulseInProgress = true;

      buildInhibitorFlowPoints();

      const phenytoin = inhibitorLoopFx.inhibitorDrug;
      const startPos = vec3ToStrSimple(inhibitorLoopFx.points.inhibitorStart);
      const bindPos = vec3ToStrSimple(inhibitorLoopFx.points.inhibitorBind);
      const exitPos = vec3ToStrSimple(inhibitorLoopFx.points.inhibitorExit);

      inhibitorLoopFx.enzymeBusy = true;

      stopEntityMotion(phenytoin);
      setModelNow(phenytoin, startPos, 1);
      phenytoin.setAttribute('visible', true);

      animatePosition(
        phenytoin,
        bindPos,
        inhibitorLoopFx.settings.inhibitorApproachMs,
        false
      );

      pushInhibitorTimeout(() => {
        if (!inhibitorLoopFx.started) return;

        setModelNow(phenytoin, bindPos, 1);

        inhibitorLoopFx.blockedUntil =
          performance.now() + inhibitorLoopFx.settings.inhibitorBindHoldMs;

        triggerInhibitorBlockGlow(inhibitorLoopFx.settings.inhibitorBindHoldMs);
        ensureInhibitorFlowRaf();
      }, inhibitorLoopFx.settings.inhibitorApproachMs);

      pushInhibitorTimeout(() => {
        if (!inhibitorLoopFx.started) return;

        animatePosition(
          phenytoin,
          exitPos,
          inhibitorLoopFx.settings.inhibitorLeaveMs,
          false
        );
      }, inhibitorLoopFx.settings.inhibitorApproachMs + inhibitorLoopFx.settings.inhibitorBindHoldMs);

      pushInhibitorTimeout(() => {
        if (!inhibitorLoopFx.started) return;

        setModelNow(phenytoin, exitPos, 1);
        phenytoin.setAttribute('visible', true);

        inhibitorLoopFx.enzymeBusy = false;
        inhibitorLoopFx.enzymeRecoveryUntil =
          performance.now() + inhibitorLoopFx.settings.postReleaseBufferMs;

        inhibitorLoopFx.pulseInProgress = false;
        ensureInhibitorFlowRaf();
      }, inhibitorLoopFx.settings.inhibitorApproachMs + inhibitorLoopFx.settings.inhibitorBindHoldMs + inhibitorLoopFx.settings.inhibitorLeaveMs + 20);
    }

    function startInhibitorLoopWhenReady() {
      if (inhibitorLoopFx.started) return;

      if (!ensureInhibitorLoopObjects()) {
        window.setTimeout(startInhibitorLoopWhenReady, 300);
        return;
      }

      const inhibitorMesh = inhibitorLoopFx.inhibitorDrug.getObject3D('mesh');
      const enzymeMesh = inhibitorLoopFx.inhibitorEnzyme.getObject3D('mesh');

      if (!inhibitorMesh || !enzymeMesh) {
        window.setTimeout(startInhibitorLoopWhenReady, 300);
        return;
      }

      clearInhibitorLoopTimers();
      buildInhibitorFlowPoints();
      resetInhibitorLoopState();

      inhibitorLoopFx.started = true;

      spawnInhibitorFlowParticle();
      pushInhibitorInterval(spawnInhibitorFlowParticle, inhibitorLoopFx.settings.spawnEveryMs);

      pushInhibitorTimeout(() => {
        startInhibitorPulse();
      }, 300);

      pushInhibitorInterval(() => {
        startInhibitorPulse();
      }, inhibitorLoopFx.settings.inhibitorCycleMs);

      inhibitorLoopFx.rafId = requestAnimationFrame(updateInhibitorFlow);
    }

    // =========================================================
    // PRODRUG BOX LOOP ANIMATION
    // - simple codeine -> morphine sequence
    // - A: codeine approaches CYP2D6-like enzyme
    // - B: glow at transformation site while codeine fades out
    //      and morphine fades in
    // - C: morphine leaves and disappears
    // =========================================================

    const prodrugLoopFx = {
      started: false,
      cycleInProgress: false,
      comparisonRig: null,
      normalEnzyme: null,
      codeineDrug: null,
      morphineDrug: null,
      fxRoot: null,
      glow: null,
      timers: [],

      points: {
        enzymeWorld: new THREE.Vector3(),
        startWorld: new THREE.Vector3(),
        bindWorld: new THREE.Vector3(),
        exitWorld: new THREE.Vector3()
      },

      settings: {
        cycleMs: 6200,
        approachMs: 1800,
        transformFadeMs: 900,
        transformHoldMs: 350,
        exitMs: 1800,
        settleMs: 500,

        startOffset: new THREE.Vector3(0.260, 0.060, 0.000),
        bindOffset: new THREE.Vector3(0.020, 0.010, 0.000),
        exitOffset: new THREE.Vector3(-0.260, 0.060, 0.000),

        glowOpacity: 0.14,
        glowOffset: new THREE.Vector3(0.000, 0.040, -0.030),
        glowFadeInMs: 180,
        glowFadeOutMs: 400
      }
    };

    function pushProdrugTimeout(fn, delay) {
      const id = window.setTimeout(fn, delay);
      prodrugLoopFx.timers.push({ id, kind: 'timeout' });
      return id;
    }

    function pushProdrugInterval(fn, delay) {
      const id = window.setInterval(fn, delay);
      prodrugLoopFx.timers.push({ id, kind: 'interval' });
      return id;
    }

    function clearProdrugLoopTimers() {
      prodrugLoopFx.timers.forEach((entry) => {
        if (entry.kind === 'interval') clearInterval(entry.id);
        else clearTimeout(entry.id);
      });
      prodrugLoopFx.timers = [];
      prodrugLoopFx.cycleInProgress = false;
    }

    function getLocalStringForEntityFromWorld(entity, worldVec) {
      const local = worldVec.clone();
      const parent = entity?.object3D?.parent;
      if (parent) parent.worldToLocal(local);
      return vecToStr(local);
    }

    function ensureProdrugLoopObjects() {
      prodrugLoopFx.comparisonRig = document.getElementById('comparisonRig');
      prodrugLoopFx.normalEnzyme = document.getElementById('normalEnzyme');
      prodrugLoopFx.codeineDrug = document.getElementById('codeineDrug');
      prodrugLoopFx.morphineDrug = document.getElementById('morphineDrug');

      if (
        !prodrugLoopFx.comparisonRig ||
        !prodrugLoopFx.normalEnzyme ||
        !prodrugLoopFx.codeineDrug ||
        !prodrugLoopFx.morphineDrug
      ) {
        return false;
      }

      if (!prodrugLoopFx.fxRoot) {
        const root = document.createElement('a-entity');
        root.setAttribute('id', 'prodrugFxRoot');
        prodrugLoopFx.comparisonRig.appendChild(root);
        prodrugLoopFx.fxRoot = root;
      }

      if (!prodrugLoopFx.glow) {
        const glow = document.createElement('a-entity');
        glow.setAttribute('id', 'prodrugTransformGlow');
        glow.setAttribute('geometry', 'primitive: sphere; radius: 0.026');
        glow.setAttribute(
          'material',
          'color: #72e7ff; emissive: #72e7ff; emissiveIntensity: 1.55; transparent: true; opacity: 0'
        );
        glow.setAttribute('visible', false);
        glow.setAttribute(
          'animation__pulse',
          'property: scale; from: 1 1 1; to: 1.22 1.22 1.22; dur: 520; dir: alternate; loop: true; easing: easeInOutSine'
        );
        prodrugLoopFx.fxRoot.appendChild(glow);
        prodrugLoopFx.glow = glow;
      }

      buildProdrugFlowPoints();
      return true;
    }

    function buildProdrugFlowPoints() {
      if (!prodrugLoopFx.normalEnzyme?.object3D) return;

      const enzymeWorld = getEntityWorldPosition(prodrugLoopFx.normalEnzyme);
      const s = prodrugLoopFx.settings;

      prodrugLoopFx.points.enzymeWorld.copy(enzymeWorld);
      prodrugLoopFx.points.startWorld.copy(enzymeWorld).add(s.startOffset);
      prodrugLoopFx.points.bindWorld.copy(enzymeWorld).add(s.bindOffset);
      prodrugLoopFx.points.exitWorld.copy(enzymeWorld).add(s.exitOffset);

      if (prodrugLoopFx.glow) {
        const glowWorld = prodrugLoopFx.points.bindWorld
          .clone()
          .add(prodrugLoopFx.settings.glowOffset);
        setEntityWorldPosition(prodrugLoopFx.glow, glowWorld);
      }
    }

    function resetProdrugLoopState() {
      if (!ensureProdrugLoopObjects()) return;

      buildProdrugFlowPoints();

      stopEntityMotion(prodrugLoopFx.codeineDrug);
      stopEntityMotion(prodrugLoopFx.morphineDrug);
      stopEntityMotion(prodrugLoopFx.glow);

      setModelNow(
        prodrugLoopFx.codeineDrug,
        getLocalStringForEntityFromWorld(
          prodrugLoopFx.codeineDrug,
          prodrugLoopFx.points.startWorld
        ),
        1
      );
      prodrugLoopFx.codeineDrug.setAttribute('visible', true);

      setModelNow(
        prodrugLoopFx.morphineDrug,
        getLocalStringForEntityFromWorld(
          prodrugLoopFx.morphineDrug,
          prodrugLoopFx.points.bindWorld
        ),
        0
      );
      prodrugLoopFx.morphineDrug.setAttribute('visible', false);

      setPrimitiveNow(
        prodrugLoopFx.glow,
        getLocalStringForEntityFromWorld(
          prodrugLoopFx.glow,
          prodrugLoopFx.points.bindWorld
        ),
        0
      );
      prodrugLoopFx.glow.setAttribute('visible', false);

      prodrugLoopFx.cycleInProgress = false;
    }

    function playProdrugCycle() {
      if (!ensureProdrugLoopObjects()) return;
      if (prodrugLoopFx.cycleInProgress) return;

      prodrugLoopFx.cycleInProgress = true;
      buildProdrugFlowPoints();

      const codeine = prodrugLoopFx.codeineDrug;
      const morphine = prodrugLoopFx.morphineDrug;
      const glow = prodrugLoopFx.glow;
      const s = prodrugLoopFx.settings;

      const codeineStart = getLocalStringForEntityFromWorld(codeine, prodrugLoopFx.points.startWorld);
      const codeineBind = getLocalStringForEntityFromWorld(codeine, prodrugLoopFx.points.bindWorld);

      const morphineBind = getLocalStringForEntityFromWorld(morphine, prodrugLoopFx.points.bindWorld);
      const morphineExit = getLocalStringForEntityFromWorld(morphine, prodrugLoopFx.points.exitWorld);

      const glowBind = getLocalStringForEntityFromWorld(
        glow,
        prodrugLoopFx.points.bindWorld.clone().add(prodrugLoopFx.settings.glowOffset)
      );

      stopEntityMotion(codeine);
      stopEntityMotion(morphine);
      stopEntityMotion(glow);

      setModelNow(codeine, codeineStart, 1);
      codeine.setAttribute('visible', true);

      setModelNow(morphine, morphineBind, 0);
      morphine.setAttribute('visible', false);

      setPrimitiveNow(glow, glowBind, 0);
      glow.setAttribute('visible', false);

      animatePosition(codeine, codeineBind, s.approachMs, false);

      pushProdrugTimeout(() => {
        setModelNow(codeine, codeineBind, 1);
        setModelNow(morphine, morphineBind, 0);

        glow.setAttribute('visible', true);
        animatePrimitiveOpacity(glow, s.glowOpacity, s.glowFadeInMs, false);

        morphine.setAttribute('visible', true);
        animateModelOpacity(codeine, 0, s.transformFadeMs, true);
        animateModelOpacity(morphine, 1, s.transformFadeMs, false);
      }, s.approachMs);

      pushProdrugTimeout(() => {
        animatePrimitiveOpacity(glow, 0, s.glowFadeOutMs, true);
        animatePosition(morphine, morphineExit, s.exitMs, false);
        animateModelOpacity(morphine, 0, s.exitMs, true);
      }, s.approachMs + s.transformFadeMs + s.transformHoldMs);

      pushProdrugTimeout(() => {
        prodrugLoopFx.cycleInProgress = false;
      }, s.approachMs + s.transformFadeMs + s.transformHoldMs + s.exitMs + s.settleMs);
    }



    // =========================================================
    // END INHIBITOR BOX LOOP ANIMATION
    // =========================================================

    function stopO2Animations() {
      const parts = helpers.o2Group?._parts;
      if (!parts) return;

      [parts.oxygenA, parts.oxygenB, parts.bondA, parts.bondB].forEach(stopEntityMotion);
      [helpers.proton1, helpers.proton2].forEach(stopEntityMotion);

      if (helpers.o2Group.__detachClusterFrame) {
        cancelAnimationFrame(helpers.o2Group.__detachClusterFrame);
        helpers.o2Group.__detachClusterFrame = null;
      }
    }

    function setEntityOpacityNow(entity, opacity) {
      if (!entity) return;
      setPrimitiveOpacityRecursive(entity, opacity);
      entity.setAttribute('visible', opacity > 0);
    }

    function setO2GroupModeInstant(mode) {
      const parts = helpers.o2Group?._parts;
      if (!parts) return;

      stopO2Animations();

      // Keep the oxygen atoms in their base local positions.
      parts.oxygenA.setAttribute('position', EDIT.HELPERS.o2AtomAOffset);
      parts.oxygenB.setAttribute('position', EDIT.HELPERS.o2AtomBOffset);

      // IMPORTANT:
      // Do NOT reset bond handle shifts / rotations here.
      // Those are controlled by applyProtonBondAttachmentAnimation()
      // so Step 5 / Step 7 / Step 8 can each have the correct bond pose.
      syncO2DoubleBondGeometry(helpers.o2Group);

      // Start from everything hidden, then enable only what this mode needs.
      parts.oxygenA.setAttribute('visible', false);
      parts.oxygenB.setAttribute('visible', false);
      parts.bondA.setAttribute('visible', false);
      parts.bondB.setAttribute('visible', false);
      parts.bondOxo.setAttribute('visible', false);

      setEntityOpacityNow(parts.oxygenA, 0);
      setEntityOpacityNow(parts.oxygenB, 0);
      setEntityOpacityNow(parts.bondA, 0);
      setEntityOpacityNow(parts.bondB, 0);
      setEntityOpacityNow(parts.bondOxo, 0);

      if (mode === 'dioxygen') {
        parts.oxygenA.setAttribute('visible', true);
        parts.oxygenB.setAttribute('visible', true);
        parts.bondA.setAttribute('visible', true);
        parts.bondB.setAttribute('visible', true);

        setEntityOpacityNow(parts.oxygenA, 1);
        setEntityOpacityNow(parts.oxygenB, 1);
        setEntityOpacityNow(parts.bondA, 1);
        setEntityOpacityNow(parts.bondB, 1);
        return;
      }

      if (mode === 'detachWater') {
        parts.oxygenA.setAttribute('visible', true);
        parts.oxygenB.setAttribute('visible', true);
        parts.bondA.setAttribute('visible', true);
        parts.bondB.setAttribute('visible', true);

        setEntityOpacityNow(parts.oxygenA, 1);
        setEntityOpacityNow(parts.oxygenB, 1);
        setEntityOpacityNow(parts.bondA, 1);
        setEntityOpacityNow(parts.bondB, 1);
        return;
      }

      if (mode === 'oxo') {
        parts.oxygenA.setAttribute('visible', true);
        parts.bondOxo.setAttribute('visible', true);

        setEntityOpacityNow(parts.oxygenA, 1);
        setEntityOpacityNow(parts.bondOxo, 1);
      }
    }

    function syncO2GroupMode(step) {
      if (!step.o2Group || !step.o2Group.visible) return;

      const mode = step.o2Group.mode || 'dioxygen';

      if (mode === 'dioxygen') {
        setO2GroupModeInstant('dioxygen');
        return;
      }

      if (mode === 'detachWater') {
        setO2GroupModeInstant('detachWater');
        return;
      }

      if (mode === 'oxo') {
        setO2GroupModeInstant('oxo');
      }
    }

    if (refs.activeSiteRing) {
      refs.activeSiteRing.setAttribute('animation__pulse', 'property: scale; from: 1 1 1; to: 1.08 1.08 1.08; dir: alternate; dur: 1100; loop: true; easing: easeInOutSine');
    }

    const steps = [
      {
        counter: 'Step 1 / 12',
        title: 'Resting Fe(III)-H2O',
        body: 'Cytochrome P450 starts in its resting ferric state. A water ligand is bound at the heme active site.',
        ringVisible: false,
        restingWater: { visible: true, position: EDIT.POSES.water.bound, opacity: 1 },
        electron1: { visible: false },
        o2Group: { visible: false },
        electron2: { visible: false },
        proton1: { visible: false },
        proton2: { visible: false },
        oxoSpecies: { visible: false }
      },
      {
        counter: 'Step 2 / 12',
        title: 'APAP approaches the active site',
        body: 'Acetaminophen moves into the pocket and aligns near the heme for oxidation.',
        ringVisible: false,
        restingWater: { visible: true, position: EDIT.POSES.water.bound, opacity: 1 },
        electron1: { visible: false },
        o2Group: { visible: false },
        electron2: { visible: false },
        proton1: { visible: false },
        proton2: { visible: false },
        oxoSpecies: { visible: false }
      },
      {
        counter: 'Step 3 / 12',
        title: 'APAP binds; water is displaced',
        body: 'The substrate occupies the active site, and the resting water ligand leaves the heme pocket.',
        ringVisible: true,
        ringColor: '#7dd3fc',
        ringOpacity: 0.44,
        restingWater: {
          visible: true,
          startPosition: EDIT.POSES.water.bound,
          position: EDIT.POSES.water.exit,
          startOpacity: 1,
          opacity: 0,
          dur: EDIT.TIMING.longMove,
          fadeDur: EDIT.TIMING.longMove
        },
        electron1: { visible: false },
        o2Group: { visible: false },
        electron2: { visible: false },
        proton1: { visible: false },
        proton2: { visible: false },
        oxoSpecies: { visible: false }
      },
      {
        counter: 'Step 4 / 12',
        title: 'First electron transfer',
        body: 'An electron from NADPH via reductase reduces the heme iron and prepares the enzyme for oxygen binding.',
        ringVisible: true,
        ringColor: '#7dd3fc',
        ringOpacity: 0.48,
        restingWater: { visible: false },
        electron1: {
          visible: true,
          startPosition: EDIT.POSES.electron1.start,
          position: EDIT.POSES.electron1.target,
          startOpacity: 0,
          opacity: 1,
          dur: EDIT.TIMING.slowMove,
          fadeDur: EDIT.TIMING.fade
        },
        o2Group: { visible: false },
        electron2: { visible: false },
        proton1: { visible: false },
        proton2: { visible: false },
        oxoSpecies: { visible: false }
      },
      {
        counter: 'Step 5 / 12',
        title: 'O2 binds to Fe(II)',
        body: 'Molecular oxygen binds at the heme iron, creating the oxygen-bound catalytic intermediate.',
        ringVisible: true,
        ringColor: '#7dd3fc',
        ringOpacity: 0.50,
        restingWater: { visible: false },
        electron1: {
          visible: true,
          position: EDIT.POSES.electron1.target,
          startOpacity: 1,
          opacity: 0,
          dur: EDIT.TIMING.defaultMove,
          fadeDelay: 3600,
          fadeDur: 1200
        },
        o2Group: {
          visible: true,
          mode: 'dioxygen',
          startPosition: EDIT.POSES.oxygen.start,
          position: EDIT.POSES.oxygen.target,
          rotation: EDIT.POSES.oxygen.rotation,
          startOpacity: 0,
          opacity: 1,
          dur: 3600,
          fadeDur: 2200
        },
        electron2: { visible: false },
        proton1: { visible: false },
        proton2: { visible: false },
        oxoSpecies: { visible: false }
      },
      {
        counter: 'Step 6 / 12',
        title: 'Second electron transfer',
        body: 'A second electron enters the oxygen-bound complex and advances the catalytic cycle.',
        ringVisible: true,
        ringColor: '#7dd3fc',
        ringOpacity: 0.54,
        restingWater: { visible: false },
        electron1: { visible: false },
        o2Group: { visible: true, mode: 'dioxygen', position: EDIT.POSES.oxygen.target, rotation: EDIT.POSES.oxygen.rotation, opacity: 1 },
        electron2: {
          visible: true,
          startPosition: EDIT.POSES.electron2.start,
          position: EDIT.POSES.electron2.target,
          startOpacity: 0,
          opacity: 1,
          dur: EDIT.TIMING.slowMove,
          fadeDur: EDIT.TIMING.fade
        },
        proton1: { visible: false },
        proton2: { visible: false },
        oxoSpecies: { visible: false }
      },
      {
        counter: 'Step 7 / 12',
        title: 'First protonation',
        body: 'The oxygen-bound intermediate receives its first proton as activation continues.',
        ringVisible: true,
        ringColor: '#8fd4ff',
        ringOpacity: 0.56,
        restingWater: { visible: false },
        electron1: { visible: false },
        o2Group: { visible: true, mode: 'dioxygen', position: EDIT.POSES.oxygen.target, rotation: EDIT.POSES.oxygen.rotation, opacity: 1 },
        electron2: {
          visible: true,
          position: EDIT.POSES.electron2.target,
          startOpacity: 1,
          opacity: 0,
          dur: EDIT.TIMING.defaultMove,
          fadeDur: 1800
        },
        proton1: {
          visible: true,
          startPosition: EDIT.POSES.proton1.start,
          position: EDIT.POSES.proton1.target,
          startOpacity: 0,
          opacity: 1,
          dur: EDIT.TIMING.slowMove,
          fadeDur: EDIT.TIMING.fade
        },
        proton2: { visible: false },
        oxoSpecies: { visible: false }
      },
      {
        counter: 'Step 8 / 12',
        title: 'Second protonation, water formed, Compound I',
        body: 'A second proton drives O-O bond cleavage, forms water, and generates Compound I, the true oxidizing species.',
        ringVisible: true,
        ringColor: '#ffb45c',
        ringOpacity: 0.60,
        restingWater: { visible: false },
        electron1: { visible: false },
        o2Group: { visible: true, mode: 'dioxygen', position: EDIT.POSES.oxygen.target, rotation: EDIT.POSES.oxygen.rotation, opacity: 1 },
        electron2: { visible: false },
        proton1: { visible: true, position: EDIT.POSES.proton1.target, opacity: 1 },
        proton2: {
          visible: true,
          startPosition: EDIT.POSES.proton2.start,
          position: EDIT.POSES.proton2.target,
          startOpacity: 0,
          opacity: 1,
          dur: EDIT.TIMING.slowMove,
          fadeDur: EDIT.TIMING.fade
        },
        oxoSpecies: { visible: false }
      },
      {
        counter: 'Step 9 / 12',
        title: 'Compound I oxidizes APAP',
        body: 'Compound I reacts with acetaminophen and drives oxidation toward the quinone-imine product.',
        ringVisible: true,
        ringColor: '#ffb45c',
        ringOpacity: 0.66,
        restingWater: { visible: false },
        electron1: { visible: false },
        o2Group: {
          visible: true,
          mode: 'detachWater',
          position: EDIT.POSES.oxygen.target,
          rotation: EDIT.POSES.oxygen.rotation,
          opacity: 1,
          dur: EDIT.TIMING.longMove
        },
        electron2: { visible: false },
        proton1: { visible: true, position: EDIT.POSES.proton1.target, opacity: 1 },
        proton2: { visible: true, position: EDIT.POSES.proton2.target, opacity: 1 },
        oxoSpecies: { visible: false }
      },
      {
        counter: 'Step 10 / 12',
        title: 'Hydrogen loss',
        body: 'Visual simplification: the two hydrogens depart first while the substrate remains in the active site.',
        ringVisible: true,
        ringColor: '#7dd3fc',
        ringOpacity: 0.50,
        restingWater: { visible: false },
        electron1: { visible: false },
        o2Group: { visible: true, mode: 'oxo', position: EDIT.POSES.oxygen.target, rotation: EDIT.POSES.oxygen.rotation, opacity: 1 },
        electron2: { visible: false },
        proton1: { visible: false },
        proton2: { visible: false },
        oxoSpecies: { visible: false }
      },
      {
        counter: 'Step 11 / 12',
        title: 'NAPQI is formed',
        body: 'The oxidized quinone-imine product is now visible as N-acetyl-p-benzoquinone imine, or NAPQI.',
        ringVisible: true,
        ringColor: '#7dd3fc',
        ringOpacity: 0.50,
        restingWater: { visible: false },
        electron1: { visible: false },
        o2Group: { visible: true, mode: 'oxo', position: EDIT.POSES.oxygen.target, rotation: EDIT.POSES.oxygen.rotation, opacity: 1 },
        electron2: { visible: false },
        proton1: { visible: false },
        proton2: { visible: false },
        oxoSpecies: { visible: false }
      },
      {
        counter: 'Step 12 / 12',
        title: 'NAPQI is released',
        body: 'The product leaves the active site, and the enzyme returns toward another resting catalytic cycle.',
        ringVisible: false,
        restingWater: { visible: false },
        electron1: { visible: false },
        o2Group: { visible: true, mode: 'oxo', position: EDIT.POSES.oxygen.target, rotation: EDIT.POSES.oxygen.rotation, opacity: 1 },
        electron2: { visible: false },
        proton1: { visible: false },
        proton2: { visible: false },
        oxoSpecies: { visible: false }
      }
    ];

    let currentStep = 0;

    function getMonitor1UiComponent() {
      return refs.monitor1UiRoot?.components?.['monitor1-ui'] || null;
    }

    function getMonitor2UiComponent() {
      return refs.monitor2UiRoot?.components?.['monitor2-ui'] || null;
    }

    function setMonitor1Screen(screenName) {
      const monitor1Ui = getMonitor1UiComponent();
      if (monitor1Ui && typeof monitor1Ui.setScreen === 'function') {
        monitor1Ui.setScreen(screenName);
      }
    }

    function setMonitor2Screen(screenName) {
      const monitor2Ui = getMonitor2UiComponent();
      if (monitor2Ui && typeof monitor2Ui.setScreen === 'function') {
        monitor2Ui.setScreen(screenName);
      }
    }

    function syncMonitor1Step(index) {
      const monitor1Ui = getMonitor1UiComponent();
      if (monitor1Ui && typeof monitor1Ui.setMetabolismStep === 'function') {
        monitor1Ui.setMetabolismStep(index);
      }
    }

    function syncMonitor2Step(index) {
      const monitor2Ui = getMonitor2UiComponent();
      if (monitor2Ui && typeof monitor2Ui.setMetabolismStep === 'function') {
        monitor2Ui.setMetabolismStep(index);
      }
    }

    function syncMonitorSettings() {
      const monitor1Ui = getMonitor1UiComponent();
      const monitor2Ui = getMonitor2UiComponent();

      if (monitor1Ui && typeof monitor1Ui.setSettingsValues === 'function') {
        monitor1Ui.setSettingsValues(sceneVisualControls.envBrightness, sceneVisualControls.cypOpacity);
      }

      if (monitor2Ui && typeof monitor2Ui.setSettingsValues === 'function') {
        monitor2Ui.setSettingsValues(sceneVisualControls.envBrightness, sceneVisualControls.cypOpacity);
      }
    }

    function setEnvironmentBrightnessSetting(nextValue) {
      sceneVisualControls.envBrightness = clamp(nextValue, 0.30, 1.70);
      applyEnvironmentBrightness();
      syncMonitorSettings();
    }

    function setCypOpacitySetting(nextValue) {
      sceneVisualControls.cypOpacity = clamp(nextValue, 0.0, 1.0);
      applyCypOpacity();
      syncMonitorSettings();
    }

    function resetVisualSettings() {
      setEnvironmentBrightnessSetting(1.0);
      setCypOpacitySetting(0.07);
    }

    function syncTwoScreenStart() {
      setMonitor1Screen('start');
      setMonitor2Screen('start');
      syncMonitor1Step(currentStep);
      syncMonitor2Step(currentStep);
      syncMonitorSettings();
    }

    function bindTwoScreenUiEvents() {
      scene.addEventListener('monitor-control-open-main-menu', () => {
        setMonitor2Screen('main-menu');
        syncMonitorSettings();
      });

      scene.addEventListener('monitor-control-open-cyp450', () => {
        setMonitor2Screen('cyp450');
      });

      scene.addEventListener('monitor-control-open-adme', () => {
        setMonitor2Screen('adme');
      });

      scene.addEventListener('monitor-control-open-credits', () => {
        setMonitor2Screen('credits');
      });

      scene.addEventListener('monitor-control-open-settings', () => {
        setMonitor2Screen('settings');
        syncMonitorSettings();
      });

      scene.addEventListener('monitor-control-settings-env-change', (evt) => {
        const delta = Number(evt?.detail?.delta || 0);
        setEnvironmentBrightnessSetting(sceneVisualControls.envBrightness + delta);
        setMonitor2Screen('settings');
      });

      scene.addEventListener('monitor-control-settings-cyp-change', (evt) => {
        const delta = Number(evt?.detail?.delta || 0);
        setCypOpacitySetting(sceneVisualControls.cypOpacity + delta);
        setMonitor2Screen('settings');
      });

      scene.addEventListener('monitor-control-settings-reset', () => {
        resetVisualSettings();
        setMonitor2Screen('settings');
      });

      scene.addEventListener('monitor-control-open-metabolism', () => {
        setMonitor2Screen('metabolism');
        applyStep(currentStep, true);
      });

      scene.addEventListener('monitor-control-next-step', () => {
        setMonitor2Screen('metabolism');
        nextStep();
      });

      scene.addEventListener('monitor-control-back-step', () => {
        setMonitor2Screen('metabolism');
        previousStep();
      });

      scene.addEventListener('monitor-control-replay-step', () => {
        setMonitor2Screen('metabolism');
        replayScene();
      });
    }

    bindTwoScreenUiEvents();


    function applyModelVisuals(step, instant = false) {
      if (instant) {
        setModelOpacityRecursive(refs.cyp, sceneVisualControls.cypOpacity, 1);
        setModelOpacityRecursive(refs.heme, 1, 4);
        return;
      }

      animateModelOpacity(refs.cyp, sceneVisualControls.cypOpacity, EDIT.TIMING.cypFade, false);
      animateModelOpacity(refs.heme, 1, EDIT.TIMING.fade, false);
    }

    function applyStep(index, instant = false) {
      const step = steps[index];
      currentStep = index;
      syncMonitor1Step(index);
      syncMonitor2Step(index);
      applyHUDLayout();
      applySceneLayout();
      setText(refs.infoCounter, step.counter);
      setText(refs.infoTitle, step.title);
      setText(refs.infoBody, step.body);
      setRingAppearance(step);
      applyEntityState(helpers.restingWater, step.restingWater, instant);
      applyEntityState(helpers.electron1, step.electron1, instant);
      stopO2Animations();
      applyEntityState(helpers.o2Group, step.o2Group, instant);
      syncO2GroupMode(step);
      applyProtonBondAttachmentAnimation(index, instant);
      applyEntityState(helpers.electron2, step.electron2, instant);
      applyEntityState(helpers.proton1, step.proton1, instant);
      applyEntityState(helpers.proton2, step.proton2, instant);
      runOxygenBDetach(step, instant);
      applyEntityState(helpers.oxoSpecies, step.oxoSpecies, instant);
      applyModelVisuals(step, instant);
      applyDrugPiecesForStep(index, instant);
      applyTransformationPieceFades(index, instant);
      setButtonEnabled(refs.btnBack, currentStep > 0, '#1d3557');
      setButtonEnabled(refs.btnNext, currentStep < steps.length - 1, '#2563eb');
      setButtonEnabled(refs.btnReplay, true, '#1d4d4f');
      setButtonEnabled(refs.btnMenu, true, '#4b5563');
    }

    function nextStep() { if (currentStep < steps.length - 1) applyStep(currentStep + 1, false); }
    function previousStep() { if (currentStep > 0) applyStep(currentStep - 1, false); }
    function replayScene() { applyStep(0, true); }

    this.nextStep = nextStep;
    this.prevStep = previousStep;
    this.previousStep = previousStep;
    this.replayScene = replayScene;
    this.goToStep = (stepIndex = 0) => {
      const safeIndex = Math.max(0, Math.min(steps.length - 1, Number(stepIndex) || 0));
      applyStep(safeIndex, true);
    };
    this.setStep = this.goToStep;

    function resetView() {
      refs.rig.setAttribute('position', initialRigPosition);
      refs.camera.setAttribute('position', initialCameraPosition);
      refs.camera.setAttribute('rotation', initialCameraRotation);
      applyHUDLayout();
      applySceneLayout();
      hideUnusedPiPieces();
      applyStep(0, true);
    }

    function handleAction(action) {
      if (action === 'next' && refs.btnNext.dataset.enabled === 'true') nextStep();
      if (action === 'back' && refs.btnBack.dataset.enabled === 'true') previousStep();
      if (action === 'replay') replayScene();
      if (action === 'menu') resetView();
    }

    function dumpEntityTransform(label, entity) {
      if (!entity) return;
      const p = entity.getAttribute('position');
      const r = entity.getAttribute('rotation');
      const s = entity.getAttribute('scale');
      console.log(label);
      if (p) console.log('Position:', `[${Number(p.x).toFixed(3)}, ${Number(p.y).toFixed(3)}, ${Number(p.z).toFixed(3)}]`);
      if (r) console.log('Rotation:', `[${Number(r.x).toFixed(1)}, ${Number(r.y).toFixed(1)}, ${Number(r.z).toFixed(1)}]`);
      if (s) console.log('Scale:', `[${Number(s.x).toFixed(3)}, ${Number(s.y).toFixed(3)}, ${Number(s.z).toFixed(3)}]`);
    }

    function dumpScenePositions() {
      console.log('========== CYP450 SCENE POSITION DUMP ==========');
      dumpEntityTransform('Monitor rig', refs.monitorRig);
      dumpEntityTransform('Monitor', refs.monitor);
      dumpEntityTransform('Monitor UI anchor', refs.monitorUiAnchor);
      dumpEntityTransform('HUD', refs.hud);
      dumpEntityTransform('Info panel', refs.infoPanel);
      dumpEntityTransform('Button row', refs.buttonRow);
      dumpEntityTransform('APAP Static', refs.apapStatic);
      dumpEntityTransform('APAP O Phenol', refs.apapOPhenol);
      dumpEntityTransform('APAP H Phenol', refs.apapHPhenol);
      dumpEntityTransform('APAP N Amide', refs.apapNAmide);
      dumpEntityTransform('APAP H Amide', refs.apapHAmide);
      dumpEntityTransform('SIGMA APAP O-H', refs.sigmaApapOH);
      dumpEntityTransform('SIGMA APAP C1O', refs.sigmaApapC1O);
      dumpEntityTransform('SIGMA APAP 34', refs.sigmaApap34);
      dumpEntityTransform('SIGMA RING 1', refs.sigmaRing1);
      dumpEntityTransform('SIGMA RING 2', refs.sigmaRing2);
      dumpEntityTransform('SIGMA RING 3', refs.sigmaRing3);
      dumpEntityTransform('SIGMA RING 4', refs.sigmaRing4);
      dumpEntityTransform('SIGMA APAP C4N', refs.sigmaApapC4N);
      dumpEntityTransform('SIGMA APAP NH', refs.sigmaApapNH);
      dumpEntityTransform('Heme', refs.heme);
      dumpEntityTransform('Resting water', helpers.restingWater);
      dumpEntityTransform('O2', helpers.o2Group);
      dumpEntityTransform('Electron 1', helpers.electron1);
      dumpEntityTransform('Electron 2', helpers.electron2);
      dumpEntityTransform('Proton 1', helpers.proton1);
      dumpEntityTransform('Proton 2', helpers.proton2);
      console.log('Current step:', currentStep + 1);
      console.log('===============================================');
    }

    const verticalMoveState = { up: false, down: false };

    function isTypingInEditor() {
      const active = document.activeElement;
      if (!active) return false;
      const tag = active.tagName || '';
      return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
    }

    function setVerticalMoveKey(event, isDown) {
      if (isTypingInEditor()) return false;
      const key = (event.key || '').toLowerCase();
      if (key === 'r' || key === 'pageup') { verticalMoveState.up = isDown; return true; }
      if (key === 'f' || key === 'pagedown') { verticalMoveState.down = isDown; return true; }
      return false;
    }

    let lastVerticalMoveTime = performance.now();

    function updateVerticalMovement(now) {
      const dt = Math.min(0.05, (now - lastVerticalMoveTime) / 1000);
      lastVerticalMoveTime = now;
      const direction = (verticalMoveState.up ? 1 : 0) - (verticalMoveState.down ? 1 : 0);
      if (direction !== 0 && refs.rig?.object3D) {
        const position = refs.rig.object3D.position;
        position.y += direction * VERTICAL_MOVE.speed * dt;
        position.y = Math.max(VERTICAL_MOVE.minY, Math.min(VERTICAL_MOVE.maxY, position.y));
        refs.rig.setAttribute('position', vecToStr(position));
      }
      requestAnimationFrame(updateVerticalMovement);
    }

    requestAnimationFrame(updateVerticalMovement);

    window.cypEditor = {
      edit: EDIT,
      dumpPositions: dumpScenePositions,
      readSelected() { browserEditor.readSelected(); },
      printSelected() { browserEditor.printSelected(); },
      printAllEditable() { browserEditor.printAll(); },
      refreshEditorUI() { browserEditor.refresh(); },
      focusSelected() {
        browserEditor.readSelected();
        const panel = document.getElementById('browser-transform-editor');
        const select = panel?.querySelector('[data-editor="target"]');
        const key = select?.value;
        if (!key) return;

        const focusBtn = panel?.querySelector('[data-editor-action="focus"]');
        if (focusBtn) focusBtn.click();
      },

      goToStep(stepNumber) {
        const safeStep = Math.max(1, Math.min(steps.length, stepNumber));
        applyStep(safeStep - 1, true);
        browserEditor.refresh();
      },

      resetSigmaRing4Start() {
        setExactTransform(
          refs.sigmaRing4,
          EDIT.CURVES.sigmaRing4ToNapqi.startPosition,
          EDIT.CURVES.sigmaRing4ToNapqi.startRotation,
          EDIT.CURVES.sigmaRing4ToNapqi.startScale
        );
        browserEditor.refresh();
      },

      previewSigmaRing4Curve() {
        animateTransformAlongCurve(refs.sigmaRing4, {
          toPosition: EDIT.CURVES.sigmaRing4ToNapqi.endPosition,
          toRotation: EDIT.CURVES.sigmaRing4ToNapqi.endRotation,
          toScale: EDIT.CURVES.sigmaRing4ToNapqi.endScale,
          controlPosition: EDIT.CURVES.sigmaRing4ToNapqi.controlPosition,
          controlRotation: EDIT.CURVES.sigmaRing4ToNapqi.controlRotation,
          controlScale: EDIT.CURVES.sigmaRing4ToNapqi.controlScale,
          dur: EDIT.CURVES.sigmaRing4ToNapqi.duration,
          instant: false
        });
      }
    };

    window.addEventListener('keydown', (event) => {
      if (setVerticalMoveKey(event, true)) event.preventDefault();
      if ((event.key || '').toLowerCase() === 'p') dumpScenePositions();
    });

    window.addEventListener('keyup', (event) => {
      if (setVerticalMoveKey(event, false)) event.preventDefault();
    });

    [refs.btnBack, refs.btnNext, refs.btnReplay, refs.btnMenu]
      .filter(Boolean)
      .forEach((button) => {
        button.addEventListener('click', () => handleAction(button.dataset.action));
      });

    function hideLoadingOverlay() {
      if (!overlay) return;
      overlay.classList.add('hidden');
      window.setTimeout(() => { overlay.style.display = 'none'; }, 500);
    }

    applyHUDLayout();
    applySceneLayout();
    hideUnusedPiPieces();
    if (refs.focusRig) refs.focusRig.setAttribute('visible', false);

    prepareModel(refs.monitor, 1, 3);
    prepareModel(refs.monitor2, 1, 3);
    prepareModel(refs.cyp, sceneVisualControls.cypOpacity, 1);
    prepareModel(refs.heme, 1, 4);
    getDrugEntities().forEach((entity) => prepareModel(entity, entity?.getAttribute('visible') === false ? 0 : 1, 6));
    prepareModel(document.getElementById('rifampcinDrug'), 1, 6);
    prepareModel(document.getElementById('phenytoinDrug'), 1, 6);
    prepareModel(document.getElementById('codeineDrug'), 1, 6);
    prepareModel(document.getElementById('morphineDrug'), 1, 6);
    hideYellowHemeParts(refs.heme);

    function forceShadowOnModel(entity, cast = true, receive = true) {
      if (!entity) return;

      const applyNow = () => {
        if (!entity.object3D) return;

        entity.object3D.traverse((node) => {
          if (!node.isMesh) return;
          node.castShadow = cast;
          node.receiveShadow = receive;

          if (node.material) {
            const mats = Array.isArray(node.material) ? node.material : [node.material];
            mats.forEach((mat) => {
              mat.needsUpdate = true;
            });
          }
        });
      };

      entity.addEventListener('model-loaded', applyNow);
      window.setTimeout(applyNow, 300);
      window.setTimeout(applyNow, 900);
      window.setTimeout(applyNow, 1600);
    }

    forceShadowOnModel(refs.monitor, true, true);
    forceShadowOnModel(refs.monitor2, true, true);
    startDrugLabelUpdater();

    const assets = scene.querySelector('a-assets');
    if (assets) {
      assets.addEventListener('loaded', () => {
        hideUnusedPiPieces();
        applyStep(0, true);
        syncTwoScreenStart();
        if (refs.focusRig) refs.focusRig.setAttribute('visible', true);
        startInducerLoopWhenReady();
        startInhibitorLoopWhenReady();
        hideLoadingOverlay();
      });
    }

    scene.addEventListener('loaded', () => {
      window.setTimeout(() => {
        applyHUDLayout();
        applySceneLayout();
        hideUnusedPiPieces();
        applyStep(0, true);
        syncTwoScreenStart();
        if (refs.focusRig) refs.focusRig.setAttribute('visible', true);
        startInducerLoopWhenReady();
        startInhibitorLoopWhenReady();
        hideLoadingOverlay();
      }, 700);
    });

    window.setTimeout(() => {
      applyHUDLayout();
      applySceneLayout();
      applyStep(0, true);
      syncTwoScreenStart();
      if (refs.focusRig) refs.focusRig.setAttribute('visible', true);
      startInducerLoopWhenReady();
      startInhibitorLoopWhenReady();
      hideLoadingOverlay();
    }, 5000);

    scene.addEventListener('loaded', () => {
      window.setTimeout(() => {
        applyHUDLayout();
        applySceneLayout();
        hideUnusedPiPieces();
        applyStep(0, true);
        if (refs.focusRig) refs.focusRig.setAttribute('visible', true);
        hideLoadingOverlay();
      }, 700);
    });

    window.setTimeout(() => {
      applyHUDLayout();
      applySceneLayout();
      applyStep(0, true);
      if (refs.focusRig) refs.focusRig.setAttribute('visible', true);
      hideLoadingOverlay();
    }, 5000);
  }
});