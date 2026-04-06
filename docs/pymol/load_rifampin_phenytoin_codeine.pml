reinitialize

python
from pymol import cmd

MOLECULES = {
    "rifampin": 135398735,   # PubChem uses the compound record name "Rifampicin"
    "phenytoin": 1775,
    "codeine": 5284371,
}

for name, cid in MOLECULES.items():
    url = f"https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/{cid}/SDF?record_type=3d"
    cmd.load(url, name, format="sdf")

# Clean default view
cmd.hide("everything", "all")
cmd.show("sticks", "all")
cmd.show("spheres", "elem O+N")
cmd.set("sphere_scale", 0.22)
cmd.set("stick_radius", 0.07)

# VR-friendly colors
cmd.set_color("carbon_vr", [0.26, 0.28, 0.31])
cmd.set_color("oxygen_vr", [0.87, 0.29, 0.23])
cmd.set_color("nitrogen_vr", [0.18, 0.43, 0.89])
cmd.set_color("hydrogen_vr", [0.95, 0.97, 1.00])

cmd.color("carbon_vr", "elem C")
cmd.color("oxygen_vr", "elem O")
cmd.color("nitrogen_vr", "elem N")
cmd.color("hydrogen_vr", "elem H")

# Background and rendering
cmd.bg_color("white")
cmd.set("antialias", 2)
cmd.set("specular", 0.2)
cmd.set("depth_cue", 0)
cmd.set("ray_opaque_background", 0)

# Spread the molecules so they do not overlap
cmd.translate([-18, 0, 0], "rifampin", camera=0)
cmd.translate([0, 0, 0], "phenytoin", camera=0)
cmd.translate([18, 0, 0], "codeine", camera=0)

# Nice starting labels
cmd.label("rifampin and name C1", '"Rifampin"')
cmd.label("phenytoin and name C1", '"Phenytoin"')
cmd.label("codeine and name C1", '"Codeine"')

# Final camera
cmd.orient("all")
cmd.zoom("all", 3)
python end