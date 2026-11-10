from PIL import Image
import os

artifact_dir = 'C:/Users/saoli/.gemini/antigravity/brain/5039a96a-55eb-4af2-bd47-45817b8fb661'
img_light = Image.open(os.path.join(artifact_dir, 'mobile_friendly_light_full.png'))
w, h = img_light.size

img_light.crop((0, 0, w, min(h, 844))).save(os.path.join(artifact_dir, 'mf_light_s1_hero.png'))
img_light.crop((0, 844, w, min(h, 1688))).save(os.path.join(artifact_dir, 'mf_light_s2_project.png'))
img_light.crop((0, 1688, w, min(h, 2532))).save(os.path.join(artifact_dir, 'mf_light_s3_tools.png'))
print('Sliced light mobile!')

