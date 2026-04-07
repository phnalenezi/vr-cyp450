window.NUCLEUS_SPIN_EDIT = {
  targetId: 'nucleus',

  // turn on/off
  enabled: true,

  // degrees per second
  speedY: 1,

  // optional extra tilt/spin
  speedX: 0.75,
  speedZ: 0.25
};

AFRAME.registerComponent('nucleus-spin', {
  tick(time, timeDelta) {
    if (!window.NUCLEUS_SPIN_EDIT || !window.NUCLEUS_SPIN_EDIT.enabled) return;

    const dt = timeDelta / 1000;
    const rot = this.el.getAttribute('rotation') || { x: 0, y: 0, z: 0 };

    this.el.setAttribute('rotation', {
      x: rot.x + window.NUCLEUS_SPIN_EDIT.speedX * dt,
      y: rot.y + window.NUCLEUS_SPIN_EDIT.speedY * dt,
      z: rot.z + window.NUCLEUS_SPIN_EDIT.speedZ * dt
    });
  }
});

(function attachNucleusSpin() {
  function applySpin() {
    const nucleus = document.getElementById(window.NUCLEUS_SPIN_EDIT.targetId);
    if (!nucleus) return;

    if (!nucleus.hasAttribute('nucleus-spin')) {
      nucleus.setAttribute('nucleus-spin', '');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applySpin);
  } else {
    applySpin();
  }

  window.addEventListener('load', applySpin);
})();