window.BOX_IMAGE_EDIT = {
  inhibitor: {
    targetId: 'inhibitorBox',
    asset: '#inhImage',
    position: '0 0.22 0.051',
    rotation: '0 0 0',
    width: 0.34,
    height: 0.22,
    backColor: '#111111',
    backOpacity: 0.78
  },

  inducer: {
    targetId: 'inducerBox',
    asset: '#indImage',
    position: '0 0.22 0.051',
    rotation: '0 0 0',
    width: 0.34,
    height: 0.22,
    backColor: '#111111',
    backOpacity: 0.78
  },

  prodrug: {
    targetId: 'prodrugBox',
    asset: '#proImage',
    position: '0 0.22 0.051',
    rotation: '0 0 0',
    width: 0.34,
    height: 0.22,
    backColor: '#111111',
    backOpacity: 0.78
  }
};

function createBoxImagePanel(name, cfg) {
  const target = document.getElementById(cfg.targetId);
  if (!target) {
    console.warn(`[box-image-panels] Missing target box: ${cfg.targetId}`);
    return;
  }

  const oldPanel = document.getElementById(`${name}ImagePanel`);
  if (oldPanel) oldPanel.remove();

  const panelRoot = document.createElement('a-entity');
  panelRoot.setAttribute('id', `${name}ImagePanel`);
  panelRoot.setAttribute('position', cfg.position);
  panelRoot.setAttribute('rotation', cfg.rotation);

  const back = document.createElement('a-plane');
  back.setAttribute('width', (cfg.width * 1.08).toFixed(3));
  back.setAttribute('height', (cfg.height * 1.12).toFixed(3));
  back.setAttribute('color', cfg.backColor || '#111111');
  back.setAttribute('opacity', cfg.backOpacity ?? 0.78);
  back.setAttribute('material', 'shader: flat; side: double; transparent: true;');
  back.setAttribute('position', '0 0 -0.002');

  const image = document.createElement('a-image');
  image.setAttribute('src', cfg.asset);
  image.setAttribute('width', cfg.width);
  image.setAttribute('height', cfg.height);
  image.setAttribute('position', '0 0 0');
  image.setAttribute(
    'material',
    'shader: flat; side: double; transparent: true; alphaTest: 0.01;'
  );

  panelRoot.appendChild(back);
  panelRoot.appendChild(image);
  target.appendChild(panelRoot);
}

function buildAllBoxPanels() {
  const edit = window.BOX_IMAGE_EDIT;
  createBoxImagePanel('inhibitor', edit.inhibitor);
  createBoxImagePanel('inducer', edit.inducer);
  createBoxImagePanel('prodrug', edit.prodrug);
}

window.addEventListener('load', () => {
  const scene = document.querySelector('a-scene');

  if (!scene) {
    console.warn('[box-image-panels] No <a-scene> found.');
    return;
  }

  if (scene.hasLoaded) {
    buildAllBoxPanels();
  } else {
    scene.addEventListener('loaded', buildAllBoxPanels, { once: true });
  }
});