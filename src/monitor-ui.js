const MONITOR2_UI_EDIT = {
  panelWidth: 1.52,
  panelHeight: 0.90,

  titleY: 0.285,
  bodyY: 0.055,
  footerY: -0.37,

  stepBadgeY: 0.355,

  buttonWidth: 0.44,
  buttonHeight: 0.11,

  bigButtonWidth: 0.66,
  bigButtonHeight: 0.16,
};

const MONITOR2_THEME = {
  panel: '#07131d',
  panelSoft: '#0d1d2a',
  accent: '#72e7ff',
  title: '#ecfbff',
  body: '#bfeeff',
  footer: '#8db8c8',
  button: '#11283a',
  buttonHover: '#18364d',
  buttonText: '#eefcff',
  badge: '#0d3140',
};

const MONITOR2_METABOLISM_STEPS = [
  {
    title: 'Resting Fe(III)-H2O',
    text: 'Cytochrome P450 starts in its resting ferric state with a water ligand bound at the heme active site.',
  },
  {
    title: 'APAP approaches the active site',
    text: 'Acetaminophen moves into the pocket and aligns near the heme for oxidation.',
  },
  {
    title: 'APAP binds; water is displaced',
    text: 'The substrate occupies the active site and the resting water ligand leaves the heme pocket.',
  },
  {
    title: 'First electron transfer',
    text: 'An electron from NADPH via reductase reduces the heme iron and prepares the enzyme for oxygen binding.',
  },
  {
    title: 'O2 binds to Fe(II)',
    text: 'Molecular oxygen binds at the heme iron, creating the oxygen-bound catalytic intermediate.',
  },
  {
    title: 'Second electron transfer',
    text: 'A second electron enters the oxygen-bound complex and advances the catalytic cycle.',
  },
  {
    title: 'First protonation',
    text: 'The oxygen-bound intermediate receives its first proton as activation continues.',
  },
  {
    title: 'Second protonation, water formed, Compound I',
    text: 'A second proton drives O-O bond cleavage, forms water, and generates Compound I, the true oxidizing species.',
  },
  {
    title: 'Compound I oxidizes APAP',
    text: 'Compound I reacts with acetaminophen and drives oxidation toward the quinone-imine product.',
  },
  {
    title: 'Hydrogen loss',
    text: 'Visual simplification: the two hydrogens depart first while the substrate remains in the active site.',
  },
  {
    title: 'NAPQI is formed',
    text: 'The oxidized quinone-imine product is now visible as N-acetyl-p-benzoquinone imine, or NAPQI.',
  },
  {
    title: 'NAPQI is released',
    text: 'The product leaves the active site and the enzyme returns toward another resting catalytic cycle.',
  }
];

function createEntity(tag, attrs = {}) {
  const el = document.createElement(tag);
  Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
  return el;
}

AFRAME.registerComponent('monitor2-ui', {
  init() {
    this.screen = 'start';
    this.metabolismStep = 0;

    this.buildMonitorUi();
    this.render();

    window.monitor2SetScreen = (screenName) => {
      this.setScreen(screenName);
    };

    window.monitor2SetMetabolismStep = (stepIndex) => {
      this.setMetabolismStep(stepIndex);
    };
  },

  buildMonitorUi() {
    this.el.setAttribute('position', '0 0 0');
    this.el.setAttribute('rotation', '0 0 0');
    this.el.setAttribute('scale', '1 1 1');

    this.panelBack = createEntity('a-plane', {
      width: MONITOR2_UI_EDIT.panelWidth + 0.04,
      height: MONITOR2_UI_EDIT.panelHeight + 0.04,
      color: MONITOR2_THEME.accent,
      opacity: 0.18,
      shader: 'flat',
      position: '0 0 -0.002',
    });

    this.panel = createEntity('a-plane', {
      width: MONITOR2_UI_EDIT.panelWidth,
      height: MONITOR2_UI_EDIT.panelHeight,
      color: MONITOR2_THEME.panel,
      opacity: 0.96,
      shader: 'flat',
      position: '0 0 0',
    });

    this.topBar = createEntity('a-plane', {
      width: MONITOR2_UI_EDIT.panelWidth,
      height: 0.08,
      color: MONITOR2_THEME.panelSoft,
      opacity: 1,
      shader: 'flat',
      position: `0 ${MONITOR2_UI_EDIT.panelHeight / 2 - 0.04} 0.001`,
    });

    this.titleText = createEntity('a-entity', {
      text: `value: ; color: ${MONITOR2_THEME.title}; align: center; width: 1.35; wrapCount: 24; anchor: center; baseline: center;`,
      position: `0 ${MONITOR2_UI_EDIT.titleY} 0.002`,
    });

    this.bodyText = createEntity('a-entity', {
      text: `value: ; color: ${MONITOR2_THEME.body}; align: center; width: 1.18; wrapCount: 33; anchor: center; baseline: center; lineHeight: 48;`,
      position: `0 ${MONITOR2_UI_EDIT.bodyY} 0.002`,
    });

    this.footerText = createEntity('a-entity', {
      text: `value: Display monitor; color: ${MONITOR2_THEME.footer}; align: center; width: 1.2; wrapCount: 32; anchor: center; baseline: center;`,
      position: `0 ${MONITOR2_UI_EDIT.footerY} 0.002`,
    });

    this.stepBadgeBack = createEntity('a-plane', {
      width: 0.36,
      height: 0.06,
      color: MONITOR2_THEME.badge,
      opacity: 1,
      shader: 'flat',
      position: `0 ${MONITOR2_UI_EDIT.stepBadgeY} 0.002`,
      visible: false,
    });

    this.stepBadgeText = createEntity('a-entity', {
      text: `value: ; color: ${MONITOR2_THEME.accent}; align: center; width: 0.6; wrapCount: 20; anchor: center; baseline: center;`,
      position: `0 ${MONITOR2_UI_EDIT.stepBadgeY} 0.003`,
      visible: false,
    });

    this.buttonGroup = createEntity('a-entity', {
      position: '0 0 0.002',
    });

    this.el.appendChild(this.panelBack);
    this.el.appendChild(this.panel);
    this.el.appendChild(this.topBar);
    this.el.appendChild(this.titleText);
    this.el.appendChild(this.bodyText);
    this.el.appendChild(this.footerText);
    this.el.appendChild(this.stepBadgeBack);
    this.el.appendChild(this.stepBadgeText);
    this.el.appendChild(this.buttonGroup);
  },

  getScreenData() {
    if (this.screen === 'metabolism') {
      const step = MONITOR2_METABOLISM_STEPS[this.metabolismStep];

      return {
        title: 'METABOLISM WITH ACETAMINOPHEN',
        body: `${step.title}\n\n${step.text}`,
        footer: 'Monitor 1 controls the sequence. Monitor 2 displays the explanation.',
        showStepBadge: true,
        buttons: [
          { label: 'MAIN MENU', action: 'main-menu' },
          { label: 'CREDITS', action: 'open-credits' },
        ],
      };
    }

    if (this.screen === 'start') {
      return {
        title: 'IMMERSIVE VISUALIZATION OF CYP450',
        body: 'Monitor 1 is the control screen.\n\nMonitor 2 is the display screen for CYP450, ADME, and metabolism information.',
        footer: 'Press START to open the display menu.',
        showStepBadge: false,
        buttons: [
          { label: 'START', action: 'open-main', big: true },
        ],
      };
    }

    if (this.screen === 'main-menu') {
      return {
        title: 'DISPLAY MENU',
        body: 'Choose which information to show on Monitor 2.',
        footer: 'Two-screen mode only.',
        showStepBadge: false,
        buttons: [
          { label: 'WHAT IS CYP450?', action: 'open-cyp450' },
          { label: 'ADME', action: 'open-adme' },
          { label: 'METABOLISM', action: 'open-metabolism' },
          { label: 'CREDITS', action: 'open-credits' },
        ],
      };
    }

    if (this.screen === 'cyp450') {
      return {
        title: 'WHAT IS CYP450?',
        body: 'Cytochrome P450 enzymes are heme-containing enzymes that metabolize many drugs and endogenous compounds.\n\nThis project shows the enzyme environment and the heme center in a simplified educational VR layout.',
        footer: 'Some scene arrangement is optimized for readability in VR.',
        showStepBadge: false,
        buttons: [
          { label: 'MAIN MENU', action: 'open-main' },
          { label: 'ADME', action: 'open-adme' },
          { label: 'METABOLISM', action: 'open-metabolism' },
        ],
      };
    }

    if (this.screen === 'adme') {
      return {
        title: 'ADME',
        body: 'ADME stands for Absorption, Distribution, Metabolism, and Excretion.\n\nThis VR experience focuses mainly on metabolism, especially CYP450-mediated transformation in the liver.',
        footer: 'The metabolic stage is the main interactive sequence here.',
        showStepBadge: false,
        buttons: [
          { label: 'MAIN MENU', action: 'open-main' },
          { label: 'WHAT IS CYP450?', action: 'open-cyp450' },
          { label: 'METABOLISM', action: 'open-metabolism' },
        ],
      };
    }

    if (this.screen === 'credits') {
      return {
        title: 'CREDITS',
        body: 'Project: Immersive Visualization of Cytochrome P450–Mediated Drug Metabolism\n\nAdd your name, course title, supervisor, and scientific references here.',
        footer: 'Keep this screen short and formal.',
        showStepBadge: false,
        buttons: [
          { label: 'MAIN MENU', action: 'open-main' },
          { label: 'METABOLISM', action: 'open-metabolism' },
        ],
      };
    }

    return {
      title: 'MONITOR 2',
      body: 'Unknown screen.',
      footer: '',
      showStepBadge: false,
      buttons: [
        { label: 'MAIN MENU', action: 'open-main' },
      ],
    };
  },

  render() {
    const screenData = this.getScreenData();

    this.titleText.setAttribute(
      'text',
      `value: ${screenData.title}; color: ${MONITOR2_THEME.title}; align: center; width: 1.35; wrapCount: 24; anchor: center; baseline: center;`
    );

    this.bodyText.setAttribute(
      'text',
      `value: ${screenData.body}; color: ${MONITOR2_THEME.body}; align: center; width: 1.18; wrapCount: 33; anchor: center; baseline: center; lineHeight: 48;`
    );

    this.footerText.setAttribute(
      'text',
      `value: ${screenData.footer}; color: ${MONITOR2_THEME.footer}; align: center; width: 1.2; wrapCount: 32; anchor: center; baseline: center;`
    );

    const badgeVisible = !!screenData.showStepBadge;
    this.stepBadgeBack.setAttribute('visible', badgeVisible);
    this.stepBadgeText.setAttribute('visible', badgeVisible);

    if (badgeVisible) {
      this.stepBadgeText.setAttribute(
        'text',
        `value: STEP ${this.metabolismStep + 1}/${MONITOR2_METABOLISM_STEPS.length}; color: ${MONITOR2_THEME.accent}; align: center; width: 0.6; wrapCount: 20; anchor: center; baseline: center;`
      );
    }

    this.renderButtons(screenData.buttons);
  },

  renderButtons(buttons) {
    while (this.buttonGroup.firstChild) {
      this.buttonGroup.removeChild(this.buttonGroup.firstChild);
    }

    if (buttons.length === 1 && buttons[0].big) {
      const button = this.createButton(buttons[0], 0, -0.17, MONITOR2_UI_EDIT.bigButtonWidth, MONITOR2_UI_EDIT.bigButtonHeight);
      this.buttonGroup.appendChild(button);
      return;
    }

    if (buttons.length === 2) {
      const positions = [
        [-0.26, -0.17],
        [0.26, -0.17],
      ];
      buttons.forEach((buttonData, index) => {
        const [x, y] = positions[index];
        const button = this.createButton(buttonData, x, y, MONITOR2_UI_EDIT.buttonWidth, MONITOR2_UI_EDIT.buttonHeight);
        this.buttonGroup.appendChild(button);
      });
      return;
    }

    if (buttons.length === 3) {
      const positions = [
        [0, -0.10],
        [-0.26, -0.26],
        [0.26, -0.26],
      ];
      buttons.forEach((buttonData, index) => {
        const [x, y] = positions[index];
        const button = this.createButton(buttonData, x, y, MONITOR2_UI_EDIT.buttonWidth, MONITOR2_UI_EDIT.buttonHeight);
        this.buttonGroup.appendChild(button);
      });
      return;
    }

    const positions = [
      [-0.26, -0.12],
      [0.26, -0.12],
      [-0.26, -0.28],
      [0.26, -0.28],
    ];

    buttons.slice(0, 4).forEach((buttonData, index) => {
      const [x, y] = positions[index];
      const button = this.createButton(buttonData, x, y, MONITOR2_UI_EDIT.buttonWidth, MONITOR2_UI_EDIT.buttonHeight);
      this.buttonGroup.appendChild(button);
    });
  },

  createButton(buttonData, x, y, width, height) {
    const wrapper = createEntity('a-entity', {
      position: `${x} ${y} 0`,
      class: 'clickable',
    });

    const back = createEntity('a-plane', {
      width: width + 0.018,
      height: height + 0.018,
      color: MONITOR2_THEME.accent,
      opacity: 0.14,
      shader: 'flat',
      position: '0 0 -0.001',
    });

    const face = createEntity('a-plane', {
      width,
      height,
      color: MONITOR2_THEME.button,
      opacity: 1,
      shader: 'flat',
      class: 'clickable',
    });

    const text = createEntity('a-entity', {
      text: `value: ${buttonData.label}; color: ${MONITOR2_THEME.buttonText}; align: center; width: 0.7; wrapCount: 18; anchor: center; baseline: center;`,
      position: '0 0 0.002',
      class: 'clickable',
    });

    wrapper.appendChild(back);
    wrapper.appendChild(face);
    wrapper.appendChild(text);

    const hoverOn = () => {
      face.setAttribute('color', MONITOR2_THEME.buttonHover);
      wrapper.setAttribute('scale', '1.03 1.03 1.03');
    };

    const hoverOff = () => {
      face.setAttribute('color', MONITOR2_THEME.button);
      wrapper.setAttribute('scale', '1 1 1');
    };

    wrapper.addEventListener('mouseenter', hoverOn);
    wrapper.addEventListener('mouseleave', hoverOff);
    face.addEventListener('mouseenter', hoverOn);
    face.addEventListener('mouseleave', hoverOff);
    text.addEventListener('mouseenter', hoverOn);
    text.addEventListener('mouseleave', hoverOff);

    const clickHandler = () => {
      this.handleAction(buttonData.action);
    };

    wrapper.addEventListener('click', clickHandler);
    face.addEventListener('click', clickHandler);
    text.addEventListener('click', clickHandler);

    return wrapper;
  },

  handleAction(action) {
    if (action === 'open-main') {
      this.screen = 'main-menu';
      this.render();
      return;
    }

    if (action === 'open-cyp450') {
      this.screen = 'cyp450';
      this.render();
      return;
    }

    if (action === 'open-adme') {
      this.screen = 'adme';
      this.render();
      return;
    }

    if (action === 'open-credits') {
      this.screen = 'credits';
      this.render();
      return;
    }

    if (action === 'open-metabolism') {
      this.screen = 'metabolism';
      this.render();
      return;
    }

    if (action === 'main-menu') {
      this.screen = 'main-menu';
      this.render();
      return;
    }
  },

  setScreen(screenName) {
    this.screen = screenName;
    this.render();
  },

  setMetabolismStep(stepIndex) {
    const max = MONITOR2_METABOLISM_STEPS.length - 1;
    this.metabolismStep = Math.max(0, Math.min(max, stepIndex));
    this.render();
  },
});