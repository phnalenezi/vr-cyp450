# CYP450 VR Starter Project

## Project title
**Immersive Visualization of Cytochrome P450–Mediated Drug Metabolism**  
*Exploring Binding, Oxidation, and Molecular Transformation Inside the Liver*

## What this starter includes
- A clean A-Frame VR scene
- Meta Quest-ready controller ray interaction
- Desktop preview controls
- A floating information panel
- Next / Back / Replay buttons
- Rotate Left / Rotate Right buttons
- A first-pass acetaminophen → NAPQI teaching sequence

## Important note about the chemistry
This first build is a **teaching visualization**, not a full molecular simulation.  
It shows the **oxidative branch** clearly and safely:
- acetaminophen approaches the active site
- it binds near the heme region
- the lesson highlights the oxidative transformation pathway
- the model then displays NAPQI as the metabolite

Later, we can upgrade this into:
- atom-level bond movement
- finer step-by-step oxidation states
- more precise active-site orientation
- extra educational panels
- multiple drugs in one menu

---

## 1) Project folder structure

```text
cyp450-vr-starter/
│
├── index.html
├── assets/
│   └── models/
│       ├── environment.glb
│       ├── cyp450.glb
│       ├── heme.glb
│       ├── acetaminophen.glb
│       └── napqi.glb
├── src/
│   ├── app.js
│   └── style.css
├── docs/
│   ├── storyboard.md
│   └── references.md
└── .vscode/
    └── settings.json
```

---

## 2) What to do first in VS Code

1. Create a new folder called **cyp450-vr-starter**
2. Open that folder in VS Code
3. Copy all starter files into the same structure
4. Put your `.glb` files inside `assets/models/`
5. Rename your files exactly like this if possible:
   - `environment.glb`
   - `cyp450.glb`
   - `heme.glb`
   - `acetaminophen.glb`
   - `napqi.glb`

If your file names are different, update the paths inside `index.html`.

---

## 3) How to run it

### Desktop preview
Use a local web server from the project folder.

Example:
```bash
python -m http.server 8000
```

Then open:
`http://localhost:8000`

Do **not** rely on double-clicking the HTML file and opening it as `file://...`.

### Quest VR testing
For the real headset test, use a **secure hosted URL** (HTTPS).  
WebXR immersive sessions are security-gated in the browser, so the Quest workflow should use a secure origin and then enter VR from a user action.

---

## 4) Desktop preview controls

- Drag mouse = look around
- WASD = move
- Click the floating buttons:
  - Back
  - Next
  - Replay
  - Rotate Left
  - Rotate Right

Keyboard shortcuts:
- Right Arrow = Next
- Left Arrow = Back
- R = Replay
- Q = Rotate Left
- E = Rotate Right

---

## 5) Meta Quest workflow

1. Put the project on a secure hosted URL (HTTPS)
2. Open that URL in the Quest browser
3. Press **Enter VR**
4. Use the controllers to point at the buttons

---

## 6) What you should see

When it works:
- your environment loads
- CYP450 and heme appear in front of you
- acetaminophen starts at the side
- the text panel explains the current step
- Next moves the sequence forward
- later steps switch to NAPQI
- Rotate Left / Rotate Right spin the main focus area

---

## 7) Best next upgrades

After this first version works, the best next upgrades are:

1. Correct final scale and placement of all GLBs
2. Improve the exact active-site pose
3. Build atom-level acetaminophen and NAPQI models
4. Animate bond and atom motion instead of doing a model swap
5. Add a start menu
6. Add a final references panel
7. Add a second drug pathway only after acetaminophen is solid

---

## 8) If something is invisible

Check these first:
1. File path is correct
2. Model actually loads
3. Scale is not too small
4. Position is not too far away
5. Lighting is enough
6. The model origin in Blender is sensible

---

## 9) Recommended workflow for you

For your project, this order is the safest:

1. Make the scene load
2. Confirm all models are visible
3. Fix scale
4. Fix positions
5. Fix step sequence
6. Improve the educational text
7. Upgrade the chemistry animation
8. Test in Quest
9. Refine comfort and readability

