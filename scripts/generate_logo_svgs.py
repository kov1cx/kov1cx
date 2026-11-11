import os

logo_dir = os.path.abspath('portfolio/assets/img/logos')
os.makedirs(logo_dir, exist_ok=True)

# 1. Concept 1: "NK" Bubble Pop Monogram
svg_c1 = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <!-- Hard Comic Shadow -->
  <rect x="12" y="12" width="80" height="80" rx="24" fill="#000000"/>
  <!-- Main Badge Body -->
  <rect x="8" y="8" width="80" height="80" rx="24" fill="#ffd166" stroke="#18181b" stroke-width="6"/>
  <!-- Top-left Gloss Highlight -->
  <path d="M 22 18 Q 48 16 68 20" stroke="#ffffff" stroke-width="4" stroke-linecap="round" fill="none" opacity="0.85"/>
  <!-- Letter N & K fused Pop-Art Typography -->
  <!-- N -->
  <path d="M 24 66 L 24 34 Q 24 28 30 28 Q 36 28 36 34 L 36 44 L 46 28 Q 50 24 54 28 Q 58 32 54 38 L 45 50 L 56 64 Q 60 70 54 74 Q 48 76 44 70 L 36 58 L 36 66 Q 36 72 30 72 Q 24 72 24 66 Z" fill="#ff477e" stroke="#18181b" stroke-width="4.5" stroke-linejoin="round"/>
  <!-- Letter text "NK" in ultra-bold friendly cartoon style -->
  <text x="47" y="65" font-family="'Baloo 2', Impact, cursive, sans-serif" font-size="44" font-weight="900" text-anchor="middle" fill="#18181b" letter-spacing="-1">NK</text>
  <text x="45" y="63" font-family="'Baloo 2', Impact, cursive, sans-serif" font-size="44" font-weight="900" text-anchor="middle" fill="#ffffff" letter-spacing="-1">NK</text>
  <!-- Sparkle ✦ -->
  <path d="M 72 16 Q 72 24 80 24 Q 72 24 72 32 Q 72 24 64 24 Q 72 24 72 16 Z" fill="#ff477e" stroke="#18181b" stroke-width="2"/>
</svg>"""

# 2. Concept 2: "LogiBox" Cute Cartoon Parcel with Friendly Face & Tape
svg_c2 = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <!-- Hard Comic Shadow -->
  <rect x="14" y="16" width="76" height="74" rx="20" fill="#000000"/>
  <!-- Parcel Main Box Body (Warm Golden Kraft) -->
  <rect x="10" y="12" width="76" height="74" rx="20" fill="#fbbf24" stroke="#18181b" stroke-width="6"/>
  
  <!-- Box Top Flaps Shading -->
  <path d="M 10 32 L 86 32" stroke="#18181b" stroke-width="5" stroke-linecap="round"/>
  <path d="M 48 12 L 48 32" stroke="#18181b" stroke-width="4" stroke-linecap="round"/>
  
  <!-- Bubblegum Pink Delivery Tape -->
  <rect x="38" y="8" width="20" height="28" rx="4" fill="#ff477e" stroke="#18181b" stroke-width="4"/>
  
  <!-- Cute Happy Cartoon Eyes -->
  <circle cx="34" cy="52" r="5" fill="#18181b"/>
  <circle cx="32.5" cy="50.5" r="1.8" fill="#ffffff"/>
  
  <circle cx="62" cy="52" r="5" fill="#18181b"/>
  <circle cx="60.5" cy="50.5" r="1.8" fill="#ffffff"/>
  
  <!-- Rosy Cheeks -->
  <ellipse cx="26" cy="58" rx="4.5" ry="3" fill="#ff70a6" opacity="0.8"/>
  <ellipse cx="70" cy="58" rx="4.5" ry="3" fill="#ff70a6" opacity="0.8"/>
  
  <!-- Sweet Smile -->
  <path d="M 42 58 Q 48 66 54 58" stroke="#18181b" stroke-width="4" stroke-linecap="round" fill="none"/>
  
  <!-- Mini Barcode / Shipping Label -->
  <rect x="52" y="68" width="24" height="12" rx="3" fill="#ffffff" stroke="#18181b" stroke-width="2.5"/>
  <line x1="56" y1="71" x2="56" y2="77" stroke="#18181b" stroke-width="1.8"/>
  <line x1="60" y1="71" x2="60" y2="77" stroke="#18181b" stroke-width="1.2"/>
  <line x1="64" y1="71" x2="64" y2="77" stroke="#18181b" stroke-width="2.2"/>
  <line x1="69" y1="71" x2="69" y2="77" stroke="#18181b" stroke-width="1.5"/>
</svg>"""

# 3. Concept 3: "LogiTruck" Cute Cartoon Delivery Van
svg_c3 = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <!-- Hard Comic Shadow -->
  <rect x="12" y="24" width="78" height="56" rx="16" fill="#000000"/>
  
  <!-- Van Cargo Body (Yellow Pop) -->
  <rect x="8" y="20" width="50" height="52" rx="12" fill="#ffd166" stroke="#18181b" stroke-width="5.5"/>
  
  <!-- Van Front Cab (Sky Blue) -->
  <path d="M 56 34 L 72 34 Q 82 34 84 44 L 86 64 Q 86 72 78 72 L 56 72 Z" fill="#38bdf8" stroke="#18181b" stroke-width="5.5" stroke-linejoin="round"/>
  
  <!-- Windshield with gloss -->
  <path d="M 60 40 L 72 40 Q 77 40 78 48 L 78 52 L 60 52 Z" fill="#ffffff" stroke="#18181b" stroke-width="3.5"/>
  
  <!-- "NK" on Cargo Box -->
  <text x="32" y="54" font-family="'Baloo 2', cursive, sans-serif" font-size="22" font-weight="900" text-anchor="middle" fill="#ff477e" stroke="#18181b" stroke-width="1.5">NK</text>
  
  <!-- Cute Headlight -->
  <circle cx="82" cy="62" r="3.5" fill="#fef08a" stroke="#18181b" stroke-width="2.5"/>
  
  <!-- Comic Wheels (Left & Right) -->
  <circle cx="28" cy="74" r="12" fill="#18181b"/>
  <circle cx="28" cy="74" r="5" fill="#ffffff" stroke="#18181b" stroke-width="2.5"/>
  
  <circle cx="70" cy="74" r="12" fill="#18181b"/>
  <circle cx="70" cy="74" r="5" fill="#ffffff" stroke="#18181b" stroke-width="2.5"/>
  
  <!-- Speed lines (Playful wind) -->
  <path d="M 6 36 L 2 36" stroke="#18181b" stroke-width="3" stroke-linecap="round"/>
  <path d="M 7 46 L 1 46" stroke="#18181b" stroke-width="3" stroke-linecap="round"/>
</svg>"""

# 4. Concept 4: "Data & Logistics" Pop-Art Chart Badge (Biểu đồ tăng trưởng Pop)
svg_c4 = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <!-- Hard Comic Shadow -->
  <rect x="14" y="14" width="76" height="76" rx="22" fill="#000000"/>
  <!-- Main Pill Surface (Night Slate) -->
  <rect x="10" y="10" width="76" height="76" rx="22" fill="#221e36" stroke="#ffd166" stroke-width="5"/>
  
  <!-- 3 Colorful Ascending Bouncy Bars -->
  <!-- Bar 1 (Mint) -->
  <rect x="22" y="52" width="14" height="24" rx="7" fill="#4ade80" stroke="#000000" stroke-width="3"/>
  <!-- Bar 2 (Sky Blue) -->
  <rect x="42" y="38" width="14" height="38" rx="7" fill="#38bdf8" stroke="#000000" stroke-width="3"/>
  <!-- Bar 3 (Pink Pop) -->
  <rect x="62" y="24" width="14" height="52" rx="7" fill="#ff70a6" stroke="#000000" stroke-width="3"/>
  
  <!-- Trend Arrow curved up -->
  <path d="M 24 44 Q 44 36 68 18" stroke="#ffd166" stroke-width="5" stroke-linecap="round" fill="none"/>
  <!-- Arrow Head -->
  <polygon points="68,14 74,24 62,20" fill="#ffd166" stroke="#000000" stroke-width="2.5"/>
  
  <!-- Cute mini sparkle ✦ -->
  <path d="M 24 22 Q 24 27 29 27 Q 24 27 24 32 Q 24 27 19 27 Q 24 27 24 22 Z" fill="#ffd166"/>
</svg>"""

with open(os.path.join(logo_dir, 'logo_c1_monogram.svg'), 'w', encoding='utf-8') as f:
    f.write(svg_c1)
with open(os.path.join(logo_dir, 'logo_c2_logibox.svg'), 'w', encoding='utf-8') as f:
    f.write(svg_c2)
with open(os.path.join(logo_dir, 'logo_c3_logitruck.svg'), 'w', encoding='utf-8') as f:
    f.write(svg_c3)
with open(os.path.join(logo_dir, 'logo_c4_datachart.svg'), 'w', encoding='utf-8') as f:
    f.write(svg_c4)

print("Saved all 4 SVG logo concepts!")

