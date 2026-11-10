from PIL import Image
import os

artifact_dir = 'C:/Users/saoli/.gemini/antigravity/brain/5039a96a-55eb-4af2-bd47-45817b8fb661'
img = Image.open(os.path.join(artifact_dir, 'mobile_full_current_dark.png'))
w, h = img.size
print(f"Full mobile height: {h}")

# Save slices:
# Slice 1: Header + Hero (0 - 844)
img.crop((0, 0, w, min(h, 844))).save(os.path.join(artifact_dir, 'm_slice1_hero.png'))
# Slice 2: Projects / Metrics (844 - 1700)
img.crop((0, 844, w, min(h, 1700))).save(os.path.join(artifact_dir, 'm_slice2_projects.png'))
# Slice 3: Certs / Tech Stack (1700 - 2600)
img.crop((0, 1700, w, min(h, 2600))).save(os.path.join(artifact_dir, 'm_slice3_certs.png'))
# Slice 4: Bottom / Contact (2600 - 3600)
img.crop((0, 2600, w, min(h, 3600))).save(os.path.join(artifact_dir, 'm_slice4_contact.png'))

print("Saved all slices!")

