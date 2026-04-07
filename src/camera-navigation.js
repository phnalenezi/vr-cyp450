(function () {
  const NAV_EDIT = (window.NAV_EDIT = window.NAV_EDIT || {
    movement: {
      moveSpeed: 1.9,          // meters per second
      verticalSpeed: 1.25,     // meters per second
      sprintMultiplier: 1.6,
      deadzone: 0.18,
      thumbstickTurnCooldown: 380
    },

    bounds: {
      minY: 0.6,
      maxY: 4.2
    },

    // Edit these 5 views later if you want.
    // position = rig position
    // yaw = rig rotation around Y
    views: [
      {
        name: 'View 1 - Main',
        position: { x: 0.0, y: 0.0, z: 0.0 },
        yaw: 0
      },
      {
        name: 'View 2 - Left',
        position: { x: -1.8, y: 0.0, z: 0.6 },
        yaw: 35
      },
      {
        name: 'View 3 - Right',
        position: { x: 1.8, y: 0.0, z: 0.6 },
        yaw: -35
      },
      {
        name: 'View 4 - Front Close',
        position: { x: 0.0, y: 0.0, z: 1.5 },
        yaw: 180
      },
      {
        name: 'View 5 - Wide',
        position: { x: 0.0, y: 0.4, z: -2.6 },
        yaw: 0
      }
    ]
  });

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function ensureController(rig, id, hand) {
    let controller = rig.querySelector(`#${id}`);
    if (controller) return controller;

    controller = document.createElement('a-entity');
    controller.setAttribute('id', id);
    controller.setAttribute('laser-controls', `hand: ${hand}`);
    controller.setAttribute('raycaster', 'objects: .clickable; far: 20');
    controller.setAttribute('line', 'color: #7FDBFF; opacity: 0.4');
    controller.setAttribute('visible', 'true');
    rig.appendChild(controller);
    return controller;
  }

  AFRAME.registerComponent('vr-navigation-controls', {
    init() {
      const THREE = AFRAME.THREE;

      this.keys = {
        forward: false,
        back: false,
        left: false,
        right: false,
        up: false,
        down: false,
        sprint: false
      };

      this.leftStick = { x: 0, y: 0 };
      this.rightStick = { x: 0, y: 0 };
      this.lastStickTurnTime = 0;
      this.currentViewIndex = 0;

      this.tempVec = new THREE.Vector3();
      this.forwardVec = new THREE.Vector3();
      this.rightVec = new THREE.Vector3();

      this.cameraEl =
        this.el.querySelector('#camera') ||
        this.el.querySelector('[camera]');

      if (!this.cameraEl) {
        console.warn('vr-navigation-controls: No camera found inside #rig.');
      }

      this.leftHand = ensureController(this.el, 'leftHand', 'left');
      this.rightHand = ensureController(this.el, 'rightHand', 'right');

      this.onKeyDown = this.onKeyDown.bind(this);
      this.onKeyUp = this.onKeyUp.bind(this);
      this.onLeftThumbstick = this.onLeftThumbstick.bind(this);
      this.onRightThumbstick = this.onRightThumbstick.bind(this);

      window.addEventListener('keydown', this.onKeyDown);
      window.addEventListener('keyup', this.onKeyUp);

      this.leftHand.addEventListener('thumbstickmoved', this.onLeftThumbstick);
      this.rightHand.addEventListener('thumbstickmoved', this.onRightThumbstick);

      // Start at View 1
      this.applyView(0, false);

      console.log('vr-navigation-controls loaded');
      console.log('Keyboard: WASD move, Space up, Ctrl/C down, Shift sprint');
      console.log('Views: 1-5 or Q/E to cycle');
      console.log('VR: left thumbstick = move, right thumbstick left/right = change view, up/down = up/down');
    },

    remove() {
      window.removeEventListener('keydown', this.onKeyDown);
      window.removeEventListener('keyup', this.onKeyUp);

      if (this.leftHand) {
        this.leftHand.removeEventListener('thumbstickmoved', this.onLeftThumbstick);
      }

      if (this.rightHand) {
        this.rightHand.removeEventListener('thumbstickmoved', this.onRightThumbstick);
      }
    },

    onKeyDown(event) {
      const key = event.key.toLowerCase();

      if (key === 'w') this.keys.forward = true;
      if (key === 's') this.keys.back = true;
      if (key === 'a') this.keys.left = true;
      if (key === 'd') this.keys.right = true;
      if (key === ' ') this.keys.up = true;
      if (key === 'control') this.keys.down = true;
      if (key === 'c') this.keys.down = true;
      if (key === 'shift') this.keys.sprint = true;

      if (key === '1') this.applyView(0);
      if (key === '2') this.applyView(1);
      if (key === '3') this.applyView(2);
      if (key === '4') this.applyView(3);
      if (key === '5') this.applyView(4);

      if (key === 'q') this.applyView(this.currentViewIndex - 1);
      if (key === 'e') this.applyView(this.currentViewIndex + 1);
    },

    onKeyUp(event) {
      const key = event.key.toLowerCase();

      if (key === 'w') this.keys.forward = false;
      if (key === 's') this.keys.back = false;
      if (key === 'a') this.keys.left = false;
      if (key === 'd') this.keys.right = false;
      if (key === ' ') this.keys.up = false;
      if (key === 'control') this.keys.down = false;
      if (key === 'c') this.keys.down = false;
      if (key === 'shift') this.keys.sprint = false;
    },

    onLeftThumbstick(event) {
      this.leftStick.x = event.detail.x || 0;
      this.leftStick.y = event.detail.y || 0;
    },

    onRightThumbstick(event) {
      const now = performance.now();
      const x = event.detail.x || 0;
      const y = event.detail.y || 0;

      this.rightStick.x = x;
      this.rightStick.y = y;

      const dz = NAV_EDIT.movement.deadzone;

      if (now - this.lastStickTurnTime > NAV_EDIT.movement.thumbstickTurnCooldown) {
        if (x > 0.75) {
          this.applyView(this.currentViewIndex + 1);
          this.lastStickTurnTime = now;
        } else if (x < -0.75) {
          this.applyView(this.currentViewIndex - 1);
          this.lastStickTurnTime = now;
        }
      }

      if (Math.abs(y) < dz) {
        this.rightStick.y = 0;
      }
    },

    applyView(index, logMessage = true) {
      const views = NAV_EDIT.views;
      const count = views.length;

      let safeIndex = index;
      if (safeIndex < 0) safeIndex = count - 1;
      if (safeIndex >= count) safeIndex = 0;

      this.currentViewIndex = safeIndex;

      const view = views[safeIndex];
      const currentPos = this.el.object3D.position;

      currentPos.set(view.position.x, view.position.y, view.position.z);
      this.el.object3D.rotation.set(0, THREE.MathUtils.degToRad(view.yaw), 0);

      if (this.cameraEl) {
        // Reset local pitch/roll so each view feels clean.
        this.cameraEl.object3D.position.set(0, 1.6, 0);
        this.cameraEl.object3D.rotation.set(0, 0, 0);
      }

      if (logMessage) {
        console.log(`Switched to ${view.name}`);
      }
    },

    tick(time, deltaMs) {
      const delta = deltaMs / 1000;
      if (!delta || !this.cameraEl) return;

      const move = NAV_EDIT.movement;
      const bounds = NAV_EDIT.bounds;
      const dz = move.deadzone;

      let moveX = 0;
      let moveZ = 0;
      let moveY = 0;

      if (this.keys.forward) moveZ -= 1;
      if (this.keys.back) moveZ += 1;
      if (this.keys.left) moveX -= 1;
      if (this.keys.right) moveX += 1;
      if (this.keys.up) moveY += 1;
      if (this.keys.down) moveY -= 1;

      if (Math.abs(this.leftStick.x) > dz) moveX += this.leftStick.x;
      if (Math.abs(this.leftStick.y) > dz) moveZ += this.leftStick.y;

      // Right stick up/down controls vertical motion in VR
      if (Math.abs(this.rightStick.y) > dz) {
        moveY += -this.rightStick.y;
      }

      if (moveX === 0 && moveY === 0 && moveZ === 0) return;

      const speed = this.keys.sprint
        ? move.moveSpeed * move.sprintMultiplier
        : move.moveSpeed;

      const yaw = this.cameraEl.object3D.rotation.y;

      this.forwardVec.set(0, 0, -1);
      this.forwardVec.applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
      this.forwardVec.y = 0;
      this.forwardVec.normalize();

      this.rightVec.set(1, 0, 0);
      this.rightVec.applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
      this.rightVec.y = 0;
      this.rightVec.normalize();

      this.tempVec.set(0, 0, 0);
      this.tempVec.addScaledVector(this.forwardVec, -moveZ);
      this.tempVec.addScaledVector(this.rightVec, moveX);

      if (this.tempVec.lengthSq() > 1) {
        this.tempVec.normalize();
      }

      const rigPos = this.el.object3D.position;

      rigPos.x += this.tempVec.x * speed * delta;
      rigPos.z += this.tempVec.z * speed * delta;

      const verticalStep = move.verticalSpeed * delta;
      rigPos.y = clamp(rigPos.y + moveY * verticalStep, bounds.minY, bounds.maxY);
    }
  });
})();