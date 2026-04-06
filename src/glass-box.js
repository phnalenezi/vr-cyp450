AFRAME.registerComponent('glass-display-box', {
  schema: {
    width: { type: 'number', default: 0.72 },
    height: { type: 'number', default: 0.72 },
    depth: { type: 'number', default: 0.72 },

    glassColor: { type: 'color', default: '#9fdcff' },
    glassOpacity: { type: 'number', default: 0.10 },

    edgeColor: { type: 'color', default: '#bfe9ff' },
    edgeOpacity: { type: 'number', default: 0.85 },
    edgeThickness: { type: 'number', default: 0.012 }
  },

  init() {
    const d = this.data;
    const root = this.el;

    const w = d.width;
    const h = d.height;
    const z = d.depth;
    const t = d.edgeThickness;

    const halfW = w / 2;
    const halfH = h / 2;
    const halfZ = z / 2;

    function make(tag, attrs, parent = root) {
      const el = document.createElement(tag);
      Object.entries(attrs).forEach(([key, value]) => {
        el.setAttribute(key, value);
      });
      parent.appendChild(el);
      return el;
    }

    function edge(position, scale) {
      make('a-box', {
        position,
        scale,
        material: `shader: flat; color: ${d.edgeColor}; opacity: ${d.edgeOpacity}; transparent: true`
      });
    }

    // Main transparent glass body
    make('a-box', {
      position: '0 0 0',
      width: String(w),
      height: String(h),
      depth: String(z),
      material: `color: ${d.glassColor}; opacity: ${d.glassOpacity}; transparent: true; metalness: 0.05; roughness: 0.12; side: double`
    });

    // Outer edges
    // Vertical edges
    edge(`${halfW} 0 ${halfZ}`, `${t} ${h} ${t}`);
    edge(`${-halfW} 0 ${halfZ}`, `${t} ${h} ${t}`);
    edge(`${halfW} 0 ${-halfZ}`, `${t} ${h} ${t}`);
    edge(`${-halfW} 0 ${-halfZ}`, `${t} ${h} ${t}`);

    // Top front/back left/right
    edge(`0 ${halfH} ${halfZ}`, `${w} ${t} ${t}`);
    edge(`0 ${halfH} ${-halfZ}`, `${w} ${t} ${t}`);
    edge(`${halfW} ${halfH} 0`, `${t} ${t} ${z}`);
    edge(`${-halfW} ${halfH} 0`, `${t} ${t} ${z}`);

    // Bottom front/back left/right
    edge(`0 ${-halfH} ${halfZ}`, `${w} ${t} ${t}`);
    edge(`0 ${-halfH} ${-halfZ}`, `${w} ${t} ${t}`);
    edge(`${halfW} ${-halfH} 0`, `${t} ${t} ${z}`);
    edge(`${-halfW} ${-halfH} 0`, `${t} ${t} ${z}`);
  }
});