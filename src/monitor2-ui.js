AFRAME.registerComponent('monitor2-ui', {
  init() {
    this.state = {
      screen: 'start',
      stepIndex: 0,
      envBrightness: 1.0,
      cypOpacity: 0.07
    };

    this.metabolismSteps = [
      {
        counter: 'Step 1 of 12',
        title: 'Resting Fe(III)-H2O',
        body: 'The heme iron begins in the ferric Fe(III) state, with a water ligand coordinated at the active site.',
        why: 'This is the resting catalytic state before substrate binding and oxygen activation.'
      },
      {
        counter: 'Step 2 of 12',
        title: 'APAP approaches the active site',
        body: 'Acetaminophen moves toward the pocket and begins aligning so the reactive region faces the heme center.',
        why: 'Substrate orientation helps determine where oxidation occurs.'
      },
      {
        counter: 'Step 3 of 12',
        title: 'APAP binds; water is displaced',
        body: 'The substrate settles into the active site, and the resting water ligand leaves the heme iron.',
        why: 'Binding clears the site so catalytic oxygen chemistry can continue.'
      },
      {
        counter: 'Step 4 of 12',
        title: 'First electron transfer',
        body: 'An electron arrives from NADPH through cytochrome P450 reductase and reduces the iron from Fe(III) to Fe(II).',
        why: 'The reduced iron is the form that can bind molecular oxygen.'
      },
      {
        counter: 'Step 5 of 12',
        title: 'O2 binds to Fe(II)',
        body: 'Molecular oxygen binds to the reduced heme iron and forms the oxygen-bound intermediate.',
        why: 'This loads oxygen onto the enzyme for activation.'
      },
      {
        counter: 'Step 6 of 12',
        title: 'Second electron transfer',
        body: 'A second electron enters the oxygen-bound complex and advances it toward a more reactive oxygen species.',
        why: 'This helps the enzyme reach the high-energy oxidant needed for substrate oxidation.'
      },
      {
        counter: 'Step 7 of 12',
        title: 'First protonation',
        body: 'The oxygen-bound intermediate receives its first proton as activation of the O-O unit continues.',
        why: 'Proton delivery helps prepare the O-O bond for cleavage.'
      },
      {
        counter: 'Step 8 of 12',
        title: 'Second protonation, water formed, Compound I',
        body: 'A second proton drives O-O bond cleavage, releases water, and generates Compound I, the key oxidizing species.',
        why: 'Compound I is the powerful oxidant that performs substrate oxidation.'
      },
      {
        counter: 'Step 9 of 12',
        title: 'Compound I oxidizes APAP',
        body: 'Compound I reacts with acetaminophen and removes electrons from the substrate as the quinone-imine pathway develops.',
        why: 'This is the chemistry that leads toward the toxic metabolite.'
      },
      {
        counter: 'Step 10 of 12',
        title: 'Hydrogen loss',
        body: 'Visual simplification: the two hydrogens are shown leaving first while the oxidized framework remains in the active site.',
        why: 'This simplification makes the structural change easier to follow in VR.'
      },
      {
        counter: 'Step 11 of 12',
        title: 'NAPQI is formed',
        body: 'The oxidized product now appears as N-acetyl-p-benzoquinone imine, commonly called NAPQI.',
        why: 'NAPQI is the reactive metabolite associated with acetaminophen toxicity.'
      },
      {
        counter: 'Step 12 of 12',
        title: 'NAPQI is released',
        body: 'The product leaves the active site, and the enzyme moves back toward another resting catalytic cycle.',
        why: 'Release frees the active site for future turnover.'
      }
    ];

    this.cyp450DetailPages = {
      cyp450_what: {
        accent: '#8cf0a5',
        title: 'What is Cytochrome P450?',
        subtitle: 'Enzyme family overview',
        body:
          'Cytochrome P450 is a superfamily of heme-containing oxidative enzymes.\n\n' +
          'These enzymes help the body chemically modify many drugs and other foreign compounds.',
        footer: 'In this project, CYP450 is shown as the main enzyme system behind drug oxidation.',
        backTarget: 'cyp450'
      },
      cyp450_where: {
        accent: '#8cf0a5',
        title: 'Where is CYP450 found?',
        subtitle: 'Main site for drug metabolism',
        body:
          'Many CYP450 enzymes are especially important in the liver.\n\n' +
          'They are commonly associated with the smooth endoplasmic reticulum of liver cells, where much drug metabolism occurs.',
        footer: 'This is why the liver is a major organ for drug biotransformation.',
        backTarget: 'cyp450'
      },
      cyp450_why: {
        accent: '#8cf0a5',
        title: 'Why is CYP450 important?',
        subtitle: 'Clinical relevance',
        body:
          'CYP450 enzymes influence drug clearance, drug levels, toxicity risk, and drug-drug interactions.\n\n' +
          'Changes in CYP450 activity can make a drug weaker, stronger, safer, or more toxic.',
        footer: 'Inducers, inhibitors, and genetic variation can all affect CYP450 activity.',
        backTarget: 'cyp450'
      },
      cyp450_isoforms: {
        accent: '#8cf0a5',
        title: 'Key CYP450 isoforms',
        subtitle: 'Common clinically relevant examples',
        body:
          'CYP3A4: metabolizes many drugs\n' +
          'CYP2D6: important for many CNS drugs and some prodrugs\n' +
          'CYP2C9: important for warfarin and some NSAIDs\n' +
          'CYP2C19: relevant to clopidogrel and PPIs\n' +
          'CYP2E1: relevant to acetaminophen bioactivation',
        footer: 'This project especially highlights CYP2E1 in the APAP pathway.',
        backTarget: 'cyp450'
      }
    };

    this.admeDetailPages = {
      adme_absorption: {
        accent: '#c8a8ff',
        title: 'Absorption',
        subtitle: 'How a drug enters the body',
        body:
          'Absorption is the movement of a drug from the site of administration into the bloodstream.\n\n' +
          'For oral drugs, this usually involves passage through the gastrointestinal tract.',
        footer: 'Poor absorption means less active drug reaches the blood.',
        backTarget: 'adme'
      },
      adme_distribution: {
        accent: '#c8a8ff',
        title: 'Distribution',
        subtitle: 'How a drug spreads through the body',
        body:
          'Distribution is the movement of a drug from the bloodstream into tissues and body compartments.\n\n' +
          'It depends on blood flow, protein binding, and tissue affinity.',
        footer: 'Distribution affects where a drug acts and how long it remains available.',
        backTarget: 'adme'
      },
      adme_metabolism: {
        accent: '#ffb45c',
        title: 'Metabolism',
        subtitle: 'How the drug is chemically changed',
        body:
          'Metabolism converts a drug into another chemical form.\n\n' +
          'It can inactivate a drug, activate a prodrug, or generate a reactive metabolite. CYP450 enzymes are major contributors.',
        footer: 'This project mainly focuses on CYP450-mediated oxidation.',
        backTarget: 'adme'
      },
      adme_excretion: {
        accent: '#c8a8ff',
        title: 'Excretion',
        subtitle: 'How the body removes the drug',
        body:
          'Excretion is the removal of a drug or its metabolites from the body.\n\n' +
          'Common routes include renal excretion in urine and biliary excretion through the liver.',
        footer: 'Efficient excretion helps prevent excessive drug accumulation.',
        backTarget: 'adme'
      }
    };

    this.el.innerHTML = '';

    this.root = document.createElement('a-entity');
    this.root.setAttribute('position', '0 -0.01 0');
    this.root.setAttribute('rotation', '0 0 0');
    this.root.setAttribute('scale', '0.28 0.28 0.28');
    this.el.appendChild(this.root);

    this.buildPanel();
    this.render();

    window.monitor2SetScreen = (screenName) => {
      this.setScreen(screenName);
    };

    window.monitor2SetMetabolismStep = (stepIndex) => {
      this.setMetabolismStep(stepIndex);
    };

    window.monitor2SetSettingsValues = (envBrightness, cypOpacity) => {
      this.setSettingsValues(envBrightness, cypOpacity);
    };
  },

  buildPanel() {
    const glowBack = this.makePlane({
      width: 5.70,
      height: 3.38,
      color: '#5fd6ff',
      opacity: 0.07,
      position: '0 0 -0.03'
    });

    const outerFrame = this.makePlane({
      width: 5.70,
      height: 3.16,
      color: '#113147',
      opacity: 0.98,
      position: '0 0 -0.02'
    });

    const innerPanel = this.makePlane({
      width: 5.30,
      height: 2.92,
      color: '#04111c',
      opacity: 0.98,
      position: '0 0 -0.01'
    });

    const innerGlow = this.makePlane({
      width: 5.18,
      height: 2.62,
      color: '#0b2132',
      opacity: 0.42,
      position: '0 0 0'
    });

    this.topLine = this.makePlane({
      width: 1.55,
      height: 0.028,
      color: '#7dd3fc',
      opacity: 1,
      position: '0 1.18 0.01'
    });

    this.bottomLine = this.makePlane({
      width: 1.15,
      height: 0.022,
      color: '#7dd3fc',
      opacity: 0.95,
      position: '0 -1.22 0.01'
    });

    this.pillGroup = document.createElement('a-entity');
    this.pillGroup.setAttribute('position', '0 0.90 0.02');

    this.pillBg = this.makePlane({
      width: 1.95,
      height: 0.26,
      color: '#15384b',
      opacity: 0.96,
      position: '0 0 0'
    });

    this.pillText = this.makeText({
      value: 'EDUCATIONAL DISPLAY',
      position: '0 -0.01 0.01',
      width: 4.18,
      color: '#c9f1ff',
      wrapCount: 28,
      align: 'center'
    });
    this.pillText.setAttribute('scale', '0.88 0.88 0.88');

    this.pillGroup.appendChild(this.pillBg);
    this.pillGroup.appendChild(this.pillText);

    this.titleText = this.makeText({
      value: '',
      position: '0 4.4 0.02',
      width: 2.90,
      color: '#f3fbff',
      wrapCount: 44,
      align: 'center'
    });

    this.subtitleText = this.makeText({
      value: '',
      position: '0 0.0 0.02',
      width: 2.40,
      color: '#9fdfff',
      wrapCount: 24,
      align: 'center'
    });

    this.bodyText = this.makeText({
      value: '',
      position: '0 -0.14 0.02',
      width: 3.15,
      color: '#d9e8f7',
      wrapCount: 56,
      align: 'center'
    });

    this.footerText = this.makeText({
      value: '',
      position: '0 -0.82 0.02',
      width: 2.00,
      color: '#88abc6',
      wrapCount: 42,
      align: 'center'
    });

    this.progressGroup = document.createElement('a-entity');
    this.progressGroup.setAttribute('visible', 'false');

    this.progressLabel = this.makeText({
      value: '',
      position: '0 -0.88 0.02',
      width: 1.32,
      color: '#ffcf8f',
      wrapCount: 20,
      align: 'center'
    });
    this.progressLabel.setAttribute('scale', '0.92 0.92 0.92');

    this.progressTrack = this.makePlane({
      width: 3.7,
      height: 0.10,
      color: '#163041',
      opacity: 0.96,
      position: '0 -1.05 0.01'
    });

    this.progressFill = this.makePlane({
      width: 0.01,
      height: 0.08,
      color: '#ffb45c',
      opacity: 1,
      position: '-1.845 -1.05 0.02'
    });

    this.progressGroup.appendChild(this.progressLabel);
    this.progressGroup.appendChild(this.progressTrack);
    this.progressGroup.appendChild(this.progressFill);

    this.cards = [];
    const cardSlots = [
      { x: -1.36, y: -0.24 },
      { x: 1.36, y: -0.24 },
      { x: -1.36, y: -0.88 },
      { x: 1.36, y: -0.88 }
    ];

    cardSlots.forEach((slot) => {
      const card = this.createCard(slot.x, slot.y);
      this.cards.push(card);
      this.root.appendChild(card.group);
    });

    this.detailBackButton = this.createBackButton();
    this.root.appendChild(this.detailBackButton.group);

    this.envBar = this.createBar(-0.02, '#7dd3fc');
    this.cypBar = this.createBar(-0.62, '#ffb45c');

    this.root.appendChild(glowBack);
    this.root.appendChild(outerFrame);
    this.root.appendChild(innerPanel);
    this.root.appendChild(innerGlow);
    this.root.appendChild(this.topLine);
    this.root.appendChild(this.bottomLine);
    this.root.appendChild(this.pillGroup);
    this.root.appendChild(this.titleText);
    this.root.appendChild(this.subtitleText);
    this.root.appendChild(this.bodyText);
    this.root.appendChild(this.footerText);
    this.root.appendChild(this.progressGroup);
    this.root.appendChild(this.envBar.group);
    this.root.appendChild(this.cypBar.group);
  },

  makePlane({ width, height, color, opacity, position }) {
    const plane = document.createElement('a-plane');
    plane.setAttribute('width', width);
    plane.setAttribute('height', height);
    plane.setAttribute('position', position || '0 0 0');
    plane.setAttribute(
      'material',
      `shader: flat; color: ${color}; opacity: ${opacity}; side: double; transparent: true;`
    );
    return plane;
  },

  makeText({ value, position, width, color, wrapCount, align }) {
    const text = document.createElement('a-text');
    text.setAttribute('value', value || '');
    text.setAttribute('position', position || '0 0 0');
    text.setAttribute('width', width || 2);
    text.setAttribute('color', color || '#ffffff');
    text.setAttribute('align', align || 'center');
    text.setAttribute('anchor', 'center');
    text.setAttribute('baseline', 'center');
    text.setAttribute('wrap-count', wrapCount || 24);
    return text;
  },

  applyTextStyle(target, { position, width, wrapCount, scale }) {
    if (!target) return;
    if (position) target.setAttribute('position', position);
    if (typeof width === 'number') target.setAttribute('width', width);
    if (typeof wrapCount === 'number') target.setAttribute('wrap-count', wrapCount);
    if (scale) target.setAttribute('scale', scale);
  },

  createCard(x, y) {
    const group = document.createElement('a-entity');
    group.setAttribute('position', `${x} ${y} 0.02`);
    group.setAttribute('visible', 'false');

    const backGlow = this.makePlane({
      width: 2.36,
      height: 0.66,
      color: '#5fd6ff',
      opacity: 0.05,
      position: '0 0 -0.01'
    });

    const bg = this.makePlane({
      width: 2.30,
      height: 0.62,
      color: '#0b1f2f',
      opacity: 0.95,
      position: '0 0 0'
    });

    const accent = this.makePlane({
      width: 1.70,
      height: 0.025,
      color: '#7dd3fc',
      opacity: 1,
      position: '0 -0.20 0.01'
    });

    const title = this.makeText({
      value: '',
      position: '0 0.09 0.02',
      width: 1.20,
      color: '#f3fbff',
      wrapCount: 16,
      align: 'center'
    });
    title.setAttribute('scale', '0.96 0.96 0.96');

    const body = this.makeText({
      value: '',
      position: '0 -0.080 0.02',
      width: 2.14,
      color: '#c8d8e8',
      wrapCount: 30,
      align: 'center'
    });
    body.setAttribute('scale', '0.84 0.84 0.84');

    const clickHandler = (evt) => {
      if (evt) evt.stopPropagation();
      if (group._targetScreen) {
        this.setScreen(group._targetScreen);
      }
    };

    [backGlow, bg, accent, title, body].forEach((el) => {
      el.setAttribute('class', 'clickable');
      el.addEventListener('click', clickHandler);
      el.addEventListener('mouseenter', () => {
        if (!group._targetScreen) return;
        bg.setAttribute('material', 'color', '#10283c');
      });
      el.addEventListener('mouseleave', () => {
        bg.setAttribute('material', 'color', '#0b1f2f');
      });
    });

    group.appendChild(backGlow);
    group.appendChild(bg);
    group.appendChild(accent);
    group.appendChild(title);
    group.appendChild(body);

    return { group, accent, title, body, bg };
  },

  createBackButton() {
    const group = document.createElement('a-entity');
    group.setAttribute('position', '0 -1.12 0.03');
    group.setAttribute('visible', 'false');

    const glow = this.makePlane({
      width: 1.18,
      height: 0.20,
      color: '#7dd3fc',
      opacity: 0.10,
      position: '0 0 -0.01'
    });

    const bg = this.makePlane({
      width: 1.12,
      height: 0.16,
      color: '#113147',
      opacity: 0.98,
      position: '0 0 0'
    });

    const text = this.makeText({
      value: 'BACK TO OVERVIEW',
      position: '0 -0.005 0.02',
      width: 1.08,
      color: '#eefcff',
      wrapCount: 20,
      align: 'center'
    });
    text.setAttribute('scale', '0.90 0.90 0.90');

    const clickHandler = (evt) => {
      if (evt) evt.stopPropagation();
      if (group._targetScreen) {
        this.setScreen(group._targetScreen);
      }
    };

    [glow, bg, text].forEach((el) => {
      el.setAttribute('class', 'clickable');
      el.addEventListener('click', clickHandler);
      el.addEventListener('mouseenter', () => {
        if (!group._targetScreen) return;
        bg.setAttribute('material', 'color', '#18364d');
      });
      el.addEventListener('mouseleave', () => {
        bg.setAttribute('material', 'color', '#113147');
      });
    });

    group.appendChild(glow);
    group.appendChild(bg);
    group.appendChild(text);

    return { group, bg, text };
  },

  createBar(y, fillColor) {
    const group = document.createElement('a-entity');
    group.setAttribute('position', '0 0 0');
    group.setAttribute('visible', 'false');

    const label = this.makeText({
      value: '',
      position: `0 ${y + 0.12} 0.02`,
      width: 2.40,
      color: '#d9e8f7',
      wrapCount: 32,
      align: 'center'
    });
    label.setAttribute('scale', '0.96 0.96 0.96');

    const value = this.makeText({
      value: '',
      position: `0 ${y - 0.02} 0.02`,
      width: 1.20,
      color: '#9fdfff',
      wrapCount: 20,
      align: 'center'
    });
    value.setAttribute('scale', '0.94 0.94 0.94');

    const track = this.makePlane({
      width: 3.65,
      height: 0.10,
      color: '#163041',
      opacity: 0.96,
      position: `0 ${y - 0.22} 0.01`
    });

    const fill = this.makePlane({
      width: 0.01,
      height: 0.08,
      color: fillColor,
      opacity: 1,
      position: `-1.825 ${y - 0.22} 0.02`
    });

    group.appendChild(label);
    group.appendChild(value);
    group.appendChild(track);
    group.appendChild(fill);

    return {
      group,
      label,
      value,
      track,
      fill,
      trackWidth: 3.65
    };
  },

  setBar(bar, label, percentText, normalizedValue) {
    const safe = Math.max(0, Math.min(1, normalizedValue));
    const width = Math.max(0.01, bar.trackWidth * safe);
    const x = (-bar.trackWidth / 2) + (width / 2);

    bar.group.setAttribute('visible', 'true');
    bar.label.setAttribute('value', label);
    bar.value.setAttribute('value', percentText);
    bar.fill.setAttribute('width', width.toFixed(3));

    const trackPosition = bar.track.getAttribute('position');
    bar.fill.setAttribute('position', `${x.toFixed(3)} ${trackPosition.y} 0.02`);
  },

  setAccent(color) {
    this.topLine.setAttribute('material', 'color', color);
    this.bottomLine.setAttribute('material', 'color', color);
    this.pillBg.setAttribute('material', 'color', color);
    this.pillBg.setAttribute('material', 'opacity', 0.22);
  },

  setTextBlock({ pill, title, subtitle, body, footer }) {
    this.pillText.setAttribute('value', pill || '');
    this.titleText.setAttribute('value', title || '');
    this.subtitleText.setAttribute('value', subtitle || '');
    this.bodyText.setAttribute('value', body || '');
    this.footerText.setAttribute('value', footer || '');
  },

  setTextVisibility({ pill = true, title = true, subtitle = true, body = true, footer = true }) {
    this.pillGroup.setAttribute('visible', pill);
    this.titleText.setAttribute('visible', title);
    this.subtitleText.setAttribute('visible', subtitle);
    this.bodyText.setAttribute('visible', body);
    this.footerText.setAttribute('visible', footer);
  },

  useStartTitleLayout() {
    this.applyTextStyle(this.titleText, {
      position: '0 0.14 0.02',
      width: 3.50,
      wrapCount: 26,
      scale: '1.06 1.06 1.06'
    });

    this.applyTextStyle(this.subtitleText, {
      position: '0 -0.50 0.02',
      width: 2.65,
      wrapCount: 22,
      scale: '0.84 0.84 0.84'
    });
  },

  useMainMenuLayout() {
    this.applyTextStyle(this.titleText, {
      position: '0 0.16 0.02',
      width: 3.10,
      wrapCount: 24,
      scale: '1.04 1.04 1.04'
    });

    this.applyTextStyle(this.subtitleText, {
      position: '0 -0.08 0.02',
      width: 2.60,
      wrapCount: 24,
      scale: '0.88 0.88 0.88'
    });
  },

  useDefaultCardsLayout() {
    this.applyTextStyle(this.titleText, {
      position: '0 0.550 0.02',
      width: 7.05,
      wrapCount: 40,
      scale: '1.02 1.02 1.02'
    });

    this.applyTextStyle(this.subtitleText, {
      position: '0 0.28 0.02',
      width: 6,
      wrapCount: 40,
      scale: '0.88 0.88 0.88'
    });
  },

  useDetailLayout() {
    this.applyTextStyle(this.titleText, {
      position: '0 0.6 0.02',
      width: 2.95,
      wrapCount: 22,
      scale: '1.02 1.02 1.02'
    });

    this.applyTextStyle(this.subtitleText, {
      position: '0 0.30 0.02',
      width: 2.55,
      wrapCount: 24,
      scale: '1 1 1'
    });

    this.applyTextStyle(this.bodyText, {
      position: '0 -0.3 0.02',
      width: 10.30,
      wrapCount: 180,
      scale: '0.92 0.92 0.92'
    });

    this.applyTextStyle(this.footerText, {
      position: '0 -0.74 0.02',
      width: 5.15,
      wrapCount: 42,
      scale: '0.72 0.72 0.72'
    });
  },

  useClinicalImpactLayout() {
    this.applyTextStyle(this.titleText, {
      position: '0 0.74 0.02',
      width: 3.2,
      wrapCount: 24,
      scale: '1.00 1.00 1.00'
    });

    this.applyTextStyle(this.subtitleText, {
      position: '0 0.42 0.02',
      width: 2.9,
      wrapCount: 28,
      scale: '0.88 0.88 0.88'
    });

    this.applyTextStyle(this.bodyText, {
      position: '0 -0.06 0.02',
      width: 5.0,
      wrapCount: 40,
      scale: '0.82 0.82 0.82'
    });

    this.applyTextStyle(this.footerText, {
      position: '0 -0.92 0.02',
      width: 4.6,
      wrapCount: 34,
      scale: '0.68 0.68 0.68'
    });
  },

  useMetabolismLayout() {
    this.applyTextStyle(this.titleText, {
      position: '0 0.50 0.02',
      width: 5.05,
      wrapCount: 40,
      scale: '1.06 1.06 1.06'
    });

    this.applyTextStyle(this.subtitleText, {
      position: '0 0.24 0.02',
      width: 2.20,
      wrapCount: 22,
      scale: '0.96 0.96 0.96'
    });

    this.applyTextStyle(this.bodyText, {
      position: '0 -0.15 0.02',
      width: 5.5,
      wrapCount: 46,
      scale: '0.88 0.88 0.88'
    });

    this.applyTextStyle(this.footerText, {
      position: '0 -0.60 0.02',
      width: 4.10,
      wrapCount: 42,
      scale: '0.76 0.76 0.76'
    });
  },

  useCreditsLayout() {
    this.applyTextStyle(this.titleText, {
      position: '0 0.52 0.02',
      width: 3.20,
      wrapCount: 42,
      scale: '1.12 1.12 1.12'
    });

    this.applyTextStyle(this.bodyText, {
      position: '0 -0.22 0.02',
      width: 8.80,
      wrapCount: 96,
      scale: '1.10 1.10 1.10'
    });

    this.applyTextStyle(this.footerText, {
      position: '0 -1 0.02',
      width: 4.5,
      wrapCount: 40,
      scale: '0.76 0.76 0.76'
    });
  },

  hideAllCards() {
    this.cards.forEach((card) => {
      card.group.setAttribute('visible', 'false');
      card.group._targetScreen = null;
    });
  },

  showCard(index, title, body, accentColor, targetScreen = null) {
    const card = this.cards[index];
    if (!card) return;

    card.group.setAttribute('visible', 'true');
    card.group._targetScreen = targetScreen;
    card.accent.setAttribute('material', 'color', accentColor || '#7dd3fc');
    card.title.setAttribute('value', title || '');
    card.body.setAttribute('value', body || '');
  },

  hideBars() {
    this.envBar.group.setAttribute('visible', 'false');
    this.cypBar.group.setAttribute('visible', 'false');
  },

  hideProgress() {
    this.progressGroup.setAttribute('visible', 'false');
  },

  hideBackButton() {
    this.detailBackButton.group.setAttribute('visible', 'false');
    this.detailBackButton.group._targetScreen = null;
  },

  showBackButton(targetScreen) {
    this.detailBackButton.group.setAttribute('visible', 'true');
    this.detailBackButton.group._targetScreen = targetScreen;
  },

  showProgress(stepIndex, totalSteps) {
    const safeIndex = Math.max(0, Math.min(totalSteps - 1, stepIndex));
    const ratio = (safeIndex + 1) / totalSteps;
    const width = Math.max(0.01, 3.7 * ratio);
    const x = (-3.7 / 2) + (width / 2);

    this.progressGroup.setAttribute('visible', 'true');
    this.progressLabel.setAttribute('value', `${safeIndex + 1} / ${totalSteps}`);
    this.progressFill.setAttribute('width', width.toFixed(3));
    this.progressFill.setAttribute('position', `${x.toFixed(3)} -1.05 0.02`);
  },

  render() {
    const screen = this.state.screen || 'start';

    this.hideAllCards();
    this.hideBars();
    this.hideProgress();
    this.hideBackButton();

    if (screen === 'start') {
      this.setAccent('#7dd3fc');
      this.useStartTitleLayout();
      this.setTextVisibility({
        pill: false,
        title: true,
        subtitle: true,
        body: false,
        footer: false
      });

      this.setTextBlock({
        pill: '',
        title: 'IMMERSIVE VISUALIZATION OF\nCYTOCHROME P450-MEDIATED\nDRUG METABOLISM',
        subtitle: 'Binding - Oxidation - Molecular Transformation',
        body: '',
        footer: ''
      });
      return;
    }

    if (screen === 'main-menu') {
      this.setAccent('#7dd3fc');
      this.useMainMenuLayout();
      this.setTextVisibility({
        pill: true,
        title: true,
        subtitle: true,
        body: false,
        footer: false
      });

      this.setTextBlock({
        pill: 'MAIN MENU',
        title: 'Choose the lesson',
        subtitle: 'Use Monitor 1 to continue',
        body: '',
        footer: ''
      });
      return;
    }

    if (screen === 'cyp450') {
      this.setAccent('#8cf0a5');
      this.useDefaultCardsLayout();
      this.setTextVisibility({
        pill: true,
        title: true,
        subtitle: true,
        body: false,
        footer: false
      });

      this.setTextBlock({
        pill: 'CYP450 OVERVIEW',
        title: 'Cytochrome P450',
        subtitle: 'Click a card to open more detail',
        body: '',
        footer: ''
      });

      this.showCard(0, 'WHAT IT IS', 'Definition and role', '#8cf0a5', 'cyp450_what');
      this.showCard(1, 'WHERE FOUND', 'Main biological location', '#8cf0a5', 'cyp450_where');
      this.showCard(2, 'WHY IMPORTANT', 'Clinical relevance', '#8cf0a5', 'cyp450_why');
      this.showCard(3, 'KEY ISOFORMS', 'Major CYP examples', '#8cf0a5', 'cyp450_isoforms');
      return;
    }

    if (this.cyp450DetailPages[screen]) {
      const page = this.cyp450DetailPages[screen];
      this.setAccent(page.accent);
      this.useDetailLayout();
      this.setTextVisibility({
        pill: true,
        title: true,
        subtitle: true,
        body: true,
        footer: true
      });

      this.setTextBlock({
        pill: 'CYP450 DETAIL',
        title: page.title,
        subtitle: page.subtitle,
        body: page.body,
        footer: page.footer
      });

      this.showBackButton(page.backTarget);
      return;
    }

    if (screen === 'adme') {
      this.setAccent('#c8a8ff');
      this.useDefaultCardsLayout();
      this.setTextVisibility({
        pill: true,
        title: true,
        subtitle: true,
        body: false,
        footer: false
      });

      this.setTextBlock({
        pill: 'ADME',
        title: 'Drug disposition',
        subtitle: 'Click a card to open more detail',
        body: '',
        footer: ''
      });

      this.showCard(0, 'ABSORPTION', 'How drug enters blood', '#c8a8ff', 'adme_absorption');
      this.showCard(1, 'DISTRIBUTION', 'How drug spreads', '#c8a8ff', 'adme_distribution');
      this.showCard(2, 'METABOLISM', 'How drug is changed', '#ffb45c', 'adme_metabolism');
      this.showCard(3, 'EXCRETION', 'How drug leaves body', '#c8a8ff', 'adme_excretion');
      return;
    }

    if (this.admeDetailPages[screen]) {
      const page = this.admeDetailPages[screen];
      this.setAccent(page.accent);
      this.useDetailLayout();
      this.setTextVisibility({
        pill: true,
        title: true,
        subtitle: true,
        body: true,
        footer: true
      });

      this.setTextBlock({
        pill: 'ADME DETAIL',
        title: page.title,
        subtitle: page.subtitle,
        body: page.body,
        footer: page.footer
      });

      this.showBackButton(page.backTarget);
      return;
    }

    if (screen === 'metabolism_intro') {
      this.setAccent('#ffb45c');
      this.useDetailLayout();
      this.setTextVisibility({
        pill: true,
        title: true,
        subtitle: true,
        body: true,
        footer: true
      });

      this.setTextBlock({
        pill: 'METABOLISM INTRO',
        title: 'Drug Metabolism in 3D',
        subtitle: 'Why this lesson matters',
        body:
          'Drugs interact with enzymes in a 3D space.\n\n' +
          'Their shape and orientation help determine whether they bind correctly inside the active site.\n\n' +
          'CYP450 enzymes can inactivate drugs, activate drugs, or create toxic metabolites.',
        footer: 'Use NEXT STEP on Monitor 1 to begin the metabolism sequence.'
      });

      return;
    }

    if (screen === 'metabolism') {
      const step = this.metabolismSteps[this.state.stepIndex] || this.metabolismSteps[0];

      this.setAccent('#ffb45c');
      this.useMetabolismLayout();
      this.setTextVisibility({
        pill: true,
        title: true,
        subtitle: true,
        body: true,
        footer: true
      });

      this.setTextBlock({
        pill: 'CURRENT STEP',
        title: step.title,
        subtitle: step.counter,
        body: step.body,
        footer: `Why it matters: ${step.why}`
      });

      this.showProgress(this.state.stepIndex, this.metabolismSteps.length);
      return;
    }

    if (screen === 'metabolism_clinical_impact') {
      this.setAccent('#ff8c5a');
      this.useClinicalImpactLayout();
      this.setTextVisibility({
        pill: true,
        title: true,
        subtitle: true,
        body: true,
        footer: true
      });

      this.setTextBlock({
        pill: 'CLINICAL IMPACT',
        title: 'Why this matters clinically',
        subtitle: 'From mechanism to patient risk',
        body:
          'Acetaminophen can be converted into NAPQI.\n\n' +
          'NAPQI is a toxic metabolite.\n\n' +
          'High levels can cause liver damage.',
        footer:
          'CYP450 activity affects drug safety.\n\n' +
          'Use BACK or RESTART to continue.'
      });

      return;
    }

    if (screen === 'settings') {
      const envPercent = Math.round(this.state.envBrightness * 100);
      const cypPercent = Math.round(this.state.cypOpacity * 100);

      this.setAccent('#7dd3fc');
      this.useDefaultCardsLayout();
      this.setTextVisibility({
        pill: true,
        title: true,
        subtitle: true,
        body: false,
        footer: false
      });

      this.setTextBlock({
        pill: 'DISPLAY SETTINGS',
        title: 'Visual control values',
        subtitle: 'Updated from Monitor 1',
        body: '',
        footer: ''
      });

      this.setBar(
        this.envBar,
        'Environment brightness',
        `${envPercent}%`,
        Math.max(0, Math.min(1, this.state.envBrightness))
      );

      this.setBar(
        this.cypBar,
        'CYP450 opacity',
        `${cypPercent}%`,
        Math.max(0, Math.min(1, this.state.cypOpacity))
      );
      return;
    }

    if (screen === 'credits') {
      this.setAccent('#7dd3fc');
      this.useCreditsLayout();
      this.setTextVisibility({
        pill: true,
        title: true,
        subtitle: false,
        body: true,
        footer: true
      });

      this.setTextBlock({
        pill: 'PROJECT CREDITS',
        title: 'Student Contributors',
        subtitle: '',
        body:
          'Anfal Jamal Elenzi  0231081\n' +
          'Latifah Abdulmohsen Ibrahim  0230832\n' +
          'Danah Faisal Alawadhi  0230422\n' +
          'Abdullatif Adel Alfoudari  0210092\n' +
          'Mohamad Fahad Alreshaid  0220206',
        footer: 'Educational VR project on CYP450-mediated drug metabolism'
      });
      return;
    }

    this.setAccent('#7dd3fc');
    this.setTextBlock({
      pill: 'DISPLAY',
      title: 'Screen ready',
      subtitle: '',
      body: '',
      footer: ''
    });
  },

  setScreen(screenName) {
    this.state.screen = screenName || 'start';
    this.render();
  },

  setMetabolismStep(stepIndex) {
    const total = this.metabolismSteps.length;
    const safeIndex = Math.max(0, Math.min(total - 1, Number(stepIndex) || 0));
    this.state.stepIndex = safeIndex;
    this.render();
  },

  setSettingsValues(envBrightness, cypOpacity) {
    this.state.envBrightness =
      typeof envBrightness === 'number'
        ? Math.max(0, Math.min(1, envBrightness))
        : this.state.envBrightness;

    this.state.cypOpacity =
      typeof cypOpacity === 'number'
        ? Math.max(0, Math.min(1, cypOpacity))
        : this.state.cypOpacity;

    this.render();
  }
});