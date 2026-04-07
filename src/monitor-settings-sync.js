(function () {
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  const DEFAULTS = {
    envBrightness: 0.70,
    cypOpacity: 0.00,
    step: 0.05
  };

  const listeners = new Set();

  const state = {
    envBrightness: DEFAULTS.envBrightness,
    cypOpacity: DEFAULTS.cypOpacity,
    step: DEFAULTS.step
  };

  function emitChange() {
    listeners.forEach((fn) => {
      try {
        fn(getState());
      } catch (error) {
        console.error('Monitor settings listener error:', error);
      }
    });
  }

  function getState() {
    return {
      envBrightness: state.envBrightness,
      cypOpacity: state.cypOpacity,
      step: state.step
    };
  }

  function setEnvBrightness(value) {
    state.envBrightness = clamp(value, 0, 1);
    emitChange();
  }

  function setCypOpacity(value) {
    state.cypOpacity = clamp(value, 0, 1);
    emitChange();
  }

  function adjustEnv(delta) {
    setEnvBrightness(state.envBrightness + delta);
  }

  function adjustCyp(delta) {
    setCypOpacity(state.cypOpacity + delta);
  }

  function subscribe(callback, fireNow = true) {
    listeners.add(callback);

    if (fireNow) {
      callback(getState());
    }

    return () => {
      listeners.delete(callback);
    };
  }

  window.CYPMonitorSettings = {
    getState,
    setEnvBrightness,
    setCypOpacity,
    adjustEnv,
    adjustCyp,
    subscribe
  };
})();