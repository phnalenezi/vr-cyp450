const MONITOR1_UI_EDIT = {
  panelWidth: 1.52,
  panelHeight: 0.98,
};

const MONITOR1_THEME = {
  panel: '#07131d',
  panelSoft: '#0d1d2a',
  accent: '#72e7ff',
  title: '#ecfbff',
  subtitle: '#9fefff',
  body: '#c9efff',
  helper: '#8db8c8',
  button: '#11283a',
  buttonHover: '#18364d',
  buttonText: '#eefcff',
  badge: '#0d3140',
  card: '#0a1a26',
};

const MONITOR1_STEP_TITLES = [
  'Resting Fe(III)-H2O',
  'APAP approaches the active site',
  'APAP binds; water is displaced',
  'First electron transfer',
  'O2 binds to Fe(II)',
  'Second electron transfer',
  'First protonation',
  'Second protonation, water formed, Compound I',
  'Compound I oxidizes APAP',
  'Hydrogen loss',
  'NAPQI is formed',
  'NAPQI is released',
];

function m1CreateEntity(tag, attrs = {}) {
  const el = document.createElement(tag);
  Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
  return el;
}

AFRAME.registerComponent('monitor1-ui', {
  init() {
    this.screen = 'start';
    this.metabolismStep = 0;
    this.environmentBrightness = 1.0;
    this.cypOpacity = 0.07;

    this.buildUi();
    this.render();

    window.monitor1SetScreen = (screenName) => {
      this.setScreen(screenName);
    };

    window.monitor1SetMetabolismStep = (stepIndex) => {
      this.setMetabolismStep(stepIndex);
    };
  },

  buildUi() {
    this.el.innerHTML = '';
    this.el.setAttribute('position', '0 0 0');
    this.el.setAttribute('rotation', '0 0 0');
    this.el.setAttribute('scale', '1 1 1');

    this.panelBack = m1CreateEntity('a-plane', {
      width: MONITOR1_UI_EDIT.panelWidth + 0.04,
      height: MONITOR1_UI_EDIT.panelHeight + 0.04,
      color: MONITOR1_THEME.accent,
      opacity: 0.14,
      shader: 'flat',
      position: '0 -0.0 -0.002',
    });

    this.panel = m1CreateEntity('a-plane', {
      width: MONITOR1_UI_EDIT.panelWidth,
      height: MONITOR1_UI_EDIT.panelHeight,
      color: MONITOR1_THEME.panel,
      opacity: 0.97,
      shader: 'flat',
      position: '0 0 0',
    });

    this.topBar = m1CreateEntity('a-plane', {
      width: MONITOR1_UI_EDIT.panelWidth,
      height: 0.08,
      color: MONITOR1_THEME.panelSoft,
      opacity: 1,
      shader: 'flat',
      position: `0 ${MONITOR1_UI_EDIT.panelHeight / 2 - 0.04} 0.001`,
    });

    this.topLine = m1CreateEntity('a-plane', {
      width: 0.56,
      height: 0.012,
      color: MONITOR1_THEME.accent,
      opacity: 0.95,
      shader: 'flat',
      position: '0 0.40 0.002',
    });

    this.bottomLine = m1CreateEntity('a-plane', {
      width: 0.42,
      height: 0.010,
      color: MONITOR1_THEME.accent,
      opacity: 0.72,
      shader: 'flat',
      position: '0 -0.445 0.002',
    });

    this.titleText = m1CreateEntity('a-entity', { position: '0 0.22 0.003' });
    this.subtitleText = m1CreateEntity('a-entity', { position: '0 0.10 0.003' });
    this.bodyText = m1CreateEntity('a-entity', { position: '0 -0.03 0.003' });

    this.stepBadgeBack = m1CreateEntity('a-plane', {
      width: 0.56,
      height: 0.07,
      color: MONITOR1_THEME.badge,
      opacity: 1,
      shader: 'flat',
      position: '0 0.355 0.003',
      visible: false,
    });



    this.stepBadgeText = m1CreateEntity('a-entity', {
      position: '0 0.355 0.004',
      visible: false,
    });

    this.previewCard = this.createPreviewCard();
    this.buttonGroup = m1CreateEntity('a-entity', { position: '0 0 0.003' });

    this.el.appendChild(this.panelBack);
    this.el.appendChild(this.panel);
    this.el.appendChild(this.topBar);
    this.el.appendChild(this.topLine);
    this.el.appendChild(this.bottomLine);
    this.el.appendChild(this.titleText);
    this.el.appendChild(this.subtitleText);
    this.el.appendChild(this.bodyText);
    this.el.appendChild(this.stepBadgeBack);
    this.el.appendChild(this.stepBadgeText);
    this.el.appendChild(this.previewCard.group);
    this.el.appendChild(this.buttonGroup);
  },

  createPreviewCard() {
    const group = m1CreateEntity('a-entity', {
      position: '0 -0.02 0.003',
      visible: false,
      class: 'clickable',
    });

    const glow = m1CreateEntity('a-plane', {
      width: 1.24,
      height: 0.24,
      color: MONITOR1_THEME.accent,
      opacity: 0.08,
      shader: 'flat',
      position: '0 0 -0.001',
      class: 'clickable',
    });

    const back = m1CreateEntity('a-plane', {
      width: 1.20,
      height: 0.22,
      color: MONITOR1_THEME.card,
      opacity: 0.96,
      shader: 'flat',
      position: '0 0 0',
      class: 'clickable',
    });

    const line = m1CreateEntity('a-plane', {
      width: 0.78,
      height: 0.010,
      color: MONITOR1_THEME.accent,
      opacity: 0.95,
      shader: 'flat',
      position: '0 -0.1 0.001',
      class: 'clickable',
    });

    const title = m1CreateEntity('a-entity', {
      position: '0 0.020 0.002',
      class: 'clickable',
    });

    const body = m1CreateEntity('a-entity', {
      position: '0 -0.042 0.002',
      class: 'clickable',
    });

    const hoverOn = () => {
      if (!group._action) return;
      back.setAttribute('color', MONITOR1_THEME.buttonHover);
      group.setAttribute('scale', '1.02 1.02 1.02');
    };

    const hoverOff = () => {
      back.setAttribute('color', MONITOR1_THEME.card);
      group.setAttribute('scale', '1 1 1');
    };

    const clickHandler = () => {
      if (!group._action) return;
      this.handleAction(group._action);
    };

    [group, glow, back, line, title, body].forEach((el) => {
      el.addEventListener('mouseenter', hoverOn);
      el.addEventListener('mouseleave', hoverOff);
      el.addEventListener('click', clickHandler);
    });

    group.appendChild(glow);
    group.appendChild(back);
    group.appendChild(line);
    group.appendChild(title);
    group.appendChild(body);

    return { group, glow, back, line, title, body };
  },

  setTextBlock(el, value, color, width, wrapCount, scale = '1 1 1', lineHeight = 50) {
    if (!el) return;
    el.setAttribute('scale', scale);
    el.setAttribute('text', {
      value: value || '',
      color,
      align: 'center',
      width,
      wrapCount,
      anchor: 'center',
      baseline: 'center',
      lineHeight
    });
  },

  getMonitor2Component() {
    const root = this.el.sceneEl?.querySelector('#monitor2UiRoot');
    return root?.components?.['monitor2-ui'] || null;
  },

  setMonitor2Screen(screenName) {
    const comp = this.getMonitor2Component();
    if (comp && typeof comp.setScreen === 'function') {
      comp.setScreen(screenName);
    }
  },

  setMonitor2Step(stepIndex) {
    const comp = this.getMonitor2Component();
    if (comp && typeof comp.setMetabolismStep === 'function') {
      comp.setMetabolismStep(stepIndex);
    }
  },

  getScreenData() {
    if (this.screen === 'start') {
      return {
        title: 'CONTROL PANEL',
        subtitle: 'Monitor 1',
        body: 'Use this screen to control the lesson.',
        showBadge: false,
        showPreview: false,
        previewTitle: '',
        previewBody: '',
        buttons: [
          { label: 'START', action: 'open-main', width: 0.64, height: 0.16, x: 0, y: -0.18, textScale: '0.94 0.94 0.94' }
        ]
      };
    }

    if (this.screen === 'main-menu') {
      return {
        title: 'MAIN MENU',
        subtitle: 'Choose a lesson',
        body: '',
        showBadge: false,
        showPreview: false,
        previewTitle: '',
        previewBody: '',
        buttons: [
          { label: 'CYP450', action: 'open-cyp450', x: -0.26, y: -0.04, width: 0.44, height: 0.11 },
          { label: 'ADME', action: 'open-adme', x: 0.26, y: -0.04, width: 0.44, height: 0.11 },
          { label: 'METABOLISM', action: 'open-metabolism', x: -0.26, y: -0.18, width: 0.46, height: 0.11, textScale: '0.90 0.90 0.90' },
          { label: 'CREDITS', action: 'open-credits', x: 0.26, y: -0.18, width: 0.44, height: 0.11 },
          { label: 'SETTINGS', action: 'open-settings', x: 0, y: -0.32, width: 0.46, height: 0.10 },
        ]
      };
    }

    if (this.screen === 'cyp450') {
      return {
        title: 'CYP450 DISPLAY',
        subtitle: 'Monitor 2 active',
        body: 'Monitor 2 shows the CYP450 overview.',
        showBadge: false,
        showPreview: false,
        previewTitle: '',
        previewBody: '',
        buttons: [
          { label: 'MAIN MENU', action: 'open-main', x: -0.26, y: -0.21, width: 0.44, height: 0.11, textScale: '0.88 0.88 0.88' },
          { label: 'ADME', action: 'open-adme', x: 0.26, y: -0.21, width: 0.44, height: 0.11 },
          { label: 'METABOLISM', action: 'open-metabolism', x: -0.26, y: -0.35, width: 0.46, height: 0.11, textScale: '0.88 0.88 0.88' },
          { label: 'SETTINGS', action: 'open-settings', x: 0.26, y: -0.35, width: 0.44, height: 0.11 },
        ]
      };
    }

    if (this.screen === 'adme') {
      return {
        title: 'ADME DISPLAY',
        subtitle: 'Monitor 2 active',
        body: 'Monitor 2 shows ADME information.',
        showBadge: false,
        showPreview: false,
        previewTitle: '',
        previewBody: '',
        buttons: [
          { label: 'MAIN MENU', action: 'open-main', x: -0.26, y: -0.21, width: 0.44, height: 0.11, textScale: '0.88 0.88 0.88' },
          { label: 'CYP450', action: 'open-cyp450', x: 0.26, y: -0.21, width: 0.44, height: 0.11 },
          { label: 'METABOLISM', action: 'open-metabolism', x: -0.26, y: -0.35, width: 0.46, height: 0.11, textScale: '0.88 0.88 0.88' },
          { label: 'SETTINGS', action: 'open-settings', x: 0.26, y: -0.35, width: 0.44, height: 0.11 },
        ]
      };
    }

    if (this.screen === 'credits') {
      return {
        title: 'CREDITS DISPLAY',
        subtitle: 'Monitor 2 active',
        body: 'Monitor 2 shows the project credits.',
        showBadge: false,
        showPreview: false,
        previewTitle: '',
        previewBody: '',
        buttons: [
          { label: 'MAIN MENU', action: 'open-main', x: -0.23, y: -0.28, width: 0.40, height: 0.10, textScale: '0.84 0.84 0.84' },
          { label: 'METABOLISM', action: 'open-metabolism', x: 0.23, y: -0.28, width: 0.42, height: 0.10, textScale: '0.82 0.82 0.82' },
          { label: 'SETTINGS', action: 'open-settings', x: 0, y: -0.40, width: 0.40, height: 0.09, textScale: '0.86 0.86 0.86' },
        ]
      };
    }

    if (this.screen === 'settings') {
      return {
        title: 'VISUAL SETTINGS',
        subtitle: 'Scene controls',
        body: '',
        showBadge: false,
        showPreview: true,
        previewTitle: 'CURRENT VALUES',
        previewBody:
          `Environment brightness: ${Math.round(this.environmentBrightness * 100)}%\n` +
          `CYP450 opacity: ${Math.round(this.cypOpacity * 100)}%`,
        buttons: [
          { label: 'ENV -', action: 'env-minus', x: -0.26, y: -0.18, width: 0.34, height: 0.11 },
          { label: 'ENV +', action: 'env-plus', x: 0.26, y: -0.18, width: 0.34, height: 0.11 },
          { label: 'CYP -', action: 'cyp-minus', x: -0.26, y: -0.32, width: 0.34, height: 0.11 },
          { label: 'CYP +', action: 'cyp-plus', x: 0.26, y: -0.32, width: 0.34, height: 0.11 },
          { label: 'MAIN MENU', action: 'open-main', x: 0, y: -0.44, width: 0.46, height: 0.09, textScale: '0.88 0.88 0.88' },
        ]
      };
    }

    const nextTitle =
      this.metabolismStep < MONITOR1_STEP_TITLES.length - 1
        ? MONITOR1_STEP_TITLES[this.metabolismStep + 1]
        : 'End of sequence';

    return {
      title: 'METABOLISM CONTROL',
      subtitle: '',
      body: '',
      showBadge: true,
      showPreview: true,
      previewTitle: 'NEXT STEP',
      previewBody: nextTitle,
      previewAction: 'next-step',
      buttons: [
        { label: 'BACK', action: 'back-step', x: -0.44, y: -0.34, width: 0.24, height: 0.10, textScale: '0.82 0.82 0.82' },
        { label: 'MAIN MENU', action: 'open-main', x: 0, y: -0.34, width: 0.48, height: 0.10, textScale: '0.78 0.78 0.78' },
        { label: 'RESTART', action: 'replay-step', x: 0.44, y: -0.34, width: 0.28, height: 0.10, textScale: '0.78 0.78 0.78' },
      ]
    };
  },

  render() {
    const screenData = this.getScreenData();

    this.stepBadgeBack.setAttribute('visible', !!screenData.showBadge);
    this.stepBadgeText.setAttribute('visible', !!screenData.showBadge);
    this.previewCard.group.setAttribute('visible', !!screenData.showPreview);
    this.previewCard.group._action = screenData.previewAction || null;
    const showBody = !!screenData.body;
    this.bodyText.setAttribute('visible', showBody);

    if (this.screen === 'start') {
      this.titleText.setAttribute('position', '0 0.22 0.003');
      this.subtitleText.setAttribute('position', '0 0.10 0.003');
      this.bodyText.setAttribute('position', '0 -0.03 0.003');
    } else if (this.screen === 'main-menu') {
      this.titleText.setAttribute('position', '0 0.22 0.003');
      this.subtitleText.setAttribute('position', '0 0.09 0.003');
      this.bodyText.setAttribute('position', '0 -0.02 0.003');
    } else if (this.screen === 'settings') {
      this.titleText.setAttribute('position', '0 0.22 0.003');
      this.subtitleText.setAttribute('position', '0 0.10 0.003');
      this.previewCard.group.setAttribute('position', '0 -0.05 0.003');
    } else if (this.screen === 'metabolism') {
      this.titleText.setAttribute('position', '0 0.18 0.003');
      this.subtitleText.setAttribute('position', '0 0.05 0.003');
      this.previewCard.group.setAttribute('position', '0 -0.06 0.003');
    } else {
      this.titleText.setAttribute('position', '0 0.21 0.003');
      this.subtitleText.setAttribute('position', '0 0.09 0.003');
      this.bodyText.setAttribute('position', '0 -0.05 0.003');
    }

    if (this.screen === 'metabolism') {
      this.setTextBlock(this.titleText, screenData.title, MONITOR1_THEME.title, 1.56, 24, '0.78 0.78 0.78');
      this.setTextBlock(this.subtitleText, screenData.subtitle, MONITOR1_THEME.subtitle, 1.12, 22, '0.82 0.82 0.82');
    } else {
      this.setTextBlock(this.titleText, screenData.title, MONITOR1_THEME.title, 1.46, 22, '1 1 1');
      this.setTextBlock(this.subtitleText, screenData.subtitle, MONITOR1_THEME.subtitle, 1.18, 24, '0.86 0.86 0.86');
    }

    this.setTextBlock(this.bodyText, screenData.body, MONITOR1_THEME.body, 1.08, 28, '0.86 0.86 0.86');

    if (screenData.showBadge) {
      this.setTextBlock(
        this.stepBadgeText,
        `STEP ${this.metabolismStep + 1}/${MONITOR1_STEP_TITLES.length}`,
        MONITOR1_THEME.accent,
        0.98,
        22,
        '0.86 0.86 0.86'
      );
    }

    if (screenData.showPreview) {
      if (this.screen === 'metabolism') {
        this.setTextBlock(
          this.previewCard.title,
          screenData.previewTitle,
          MONITOR1_THEME.subtitle,
          0.98,
          18,
          '0.76 0.76 0.76'
        );
        this.setTextBlock(
          this.previewCard.body,
          screenData.previewBody,
          MONITOR1_THEME.body,
          1.12,
          34,
          '0.82 0.82 0.82'
        );
      } else {
        this.setTextBlock(
          this.previewCard.title,
          screenData.previewTitle,
          MONITOR1_THEME.subtitle,
          0.90,
          20,
          '0.78 0.78 0.78'
        );
        this.setTextBlock(
          this.previewCard.body,
          screenData.previewBody,
          MONITOR1_THEME.body,
          1.04,
          34,
          '0.82 0.82 0.82'
        );
      }
    }

    this.renderButtons(screenData.buttons || []);
  },

  renderButtons(buttons) {
    while (this.buttonGroup.firstChild) {
      this.buttonGroup.removeChild(this.buttonGroup.firstChild);
    }

    buttons.forEach((buttonData) => {
      this.buttonGroup.appendChild(
        this.createButton(
          buttonData,
          buttonData.x || 0,
          buttonData.y || 0,
          buttonData.width || 0.42,
          buttonData.height || 0.11
        )
      );
    });
  },

  createButton(buttonData, x, y, width, height) {
    const wrapper = m1CreateEntity('a-entity', {
      position: `${x} ${y} 0`,
      class: 'clickable',
    });

    const glow = m1CreateEntity('a-plane', {
      width: width + 0.018,
      height: height + 0.018,
      color: MONITOR1_THEME.accent,
      opacity: 0.14,
      shader: 'flat',
      position: '0 0 -0.001',
      class: 'clickable',
    });

    const face = m1CreateEntity('a-plane', {
      width,
      height,
      color: MONITOR1_THEME.button,
      opacity: 1,
      shader: 'flat',
      class: 'clickable',
    });

    const text = m1CreateEntity('a-entity', {
      text: `value: ${buttonData.label}; color: ${MONITOR1_THEME.buttonText}; align: center; width: ${buttonData.textWidth || Math.max(width * 2.0, 0.86)}; wrapCount: ${buttonData.wrapCount || 20}; anchor: center; baseline: center;`,
      position: '0 0 0.002',
      class: 'clickable',
      scale: buttonData.textScale || '1 1 1',
    });

    wrapper.appendChild(glow);
    wrapper.appendChild(face);
    wrapper.appendChild(text);

    const hoverOn = () => {
      face.setAttribute('color', MONITOR1_THEME.buttonHover);
      wrapper.setAttribute('scale', '1.03 1.03 1.03');
    };

    const hoverOff = () => {
      face.setAttribute('color', MONITOR1_THEME.button);
      wrapper.setAttribute('scale', '1 1 1');
    };

    wrapper.addEventListener('mouseenter', hoverOn);
    wrapper.addEventListener('mouseleave', hoverOff);
    face.addEventListener('mouseenter', hoverOn);
    face.addEventListener('mouseleave', hoverOff);
    text.addEventListener('mouseenter', hoverOn);
    text.addEventListener('mouseleave', hoverOff);

    const clickHandler = () => this.handleAction(buttonData.action);
    wrapper.addEventListener('click', clickHandler);
    face.addEventListener('click', clickHandler);
    text.addEventListener('click', clickHandler);

    return wrapper;
  },

  handleAction(action) {
    if (action === 'open-main') {
      this.screen = 'main-menu';
      this.setMonitor2Screen('main-menu');
      this.emitSceneEvent('monitor-control-open-main-menu');
      this.render();
      return;
    }

    if (action === 'open-cyp450') {
      this.screen = 'cyp450';
      this.setMonitor2Screen('cyp450');
      this.emitSceneEvent('monitor-control-open-cyp450');
      this.render();
      return;
    }

    if (action === 'open-adme') {
      this.screen = 'adme';
      this.setMonitor2Screen('adme');
      this.emitSceneEvent('monitor-control-open-adme');
      this.render();
      return;
    }

    if (action === 'open-credits') {
      this.screen = 'credits';
      this.setMonitor2Screen('credits');
      this.emitSceneEvent('monitor-control-open-credits');
      this.render();
      return;
    }

    if (action === 'open-settings') {
      this.screen = 'settings';
      this.setMonitor2Screen('settings');
      this.emitSceneEvent('monitor-control-open-settings');
      this.render();
      return;
    }

    if (action === 'env-minus') {
      this.setMonitor2Screen('settings');
      this.emitSceneEvent('monitor-control-settings-env-change', { delta: -0.10 });
      return;
    }

    if (action === 'env-plus') {
      this.setMonitor2Screen('settings');
      this.emitSceneEvent('monitor-control-settings-env-change', { delta: 0.10 });
      return;
    }

    if (action === 'cyp-minus') {
      this.setMonitor2Screen('settings');
      this.emitSceneEvent('monitor-control-settings-cyp-change', { delta: -0.05 });
      return;
    }

    if (action === 'cyp-plus') {
      this.setMonitor2Screen('settings');
      this.emitSceneEvent('monitor-control-settings-cyp-change', { delta: 0.05 });
      return;
    }

    if (action === 'open-metabolism') {
      this.screen = 'metabolism';
      this.setMonitor2Screen('metabolism');
      this.setMonitor2Step(this.metabolismStep);
      this.emitSceneEvent('monitor-control-open-metabolism', {
        stepIndex: this.metabolismStep,
      });
      this.render();
      return;
    }

    if (action === 'next-step') {
      if (this.metabolismStep < MONITOR1_STEP_TITLES.length - 1) {
        this.metabolismStep += 1;
      }
      this.setMonitor2Screen('metabolism');
      this.setMonitor2Step(this.metabolismStep);
      this.emitSceneEvent('monitor-control-next-step', {
        stepIndex: this.metabolismStep,
      });
      this.render();
      return;
    }

    if (action === 'back-step') {
      if (this.metabolismStep > 0) {
        this.metabolismStep -= 1;
      }
      this.setMonitor2Screen('metabolism');
      this.setMonitor2Step(this.metabolismStep);
      this.emitSceneEvent('monitor-control-back-step', {
        stepIndex: this.metabolismStep,
      });
      this.render();
      return;
    }

    if (action === 'replay-step') {
      this.metabolismStep = 0;
      this.setMonitor2Screen('metabolism');
      this.setMonitor2Step(this.metabolismStep);
      this.emitSceneEvent('monitor-control-replay-step', {
        stepIndex: this.metabolismStep,
      });
      this.render();
    }
  },

  setScreen(screenName) {
    this.screen = screenName;
    this.render();
  },

  setMetabolismStep(stepIndex) {
    const max = MONITOR1_STEP_TITLES.length - 1;
    this.metabolismStep = Math.max(0, Math.min(max, Number(stepIndex) || 0));
    this.render();
  },

  setSettingsValues(environmentBrightness, cypOpacity) {
    this.environmentBrightness = environmentBrightness;
    this.cypOpacity = cypOpacity;
    this.render();
  },

  emitSceneEvent(eventName, detail = {}) {
    if (this.el.sceneEl) {
      this.el.sceneEl.emit(eventName, detail, false);
    }
  },
});