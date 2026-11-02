# Portfolio – Logistics & Supply Chain

Trang portfolio cá nhân ngành Quản trị Chuỗi Cung ứng & Logistics với kiến trúc định tuyến theo tab (5 tab), hỗ trợ 3 ngôn ngữ (**VI / EN / FR**), hệ thống typography tự host cao cấp (**Newsreader**, **Be Vietnam Pro**, **IBM Plex Mono**), chuẩn SEO đa ngôn ngữ và tối ưu tương phản WCAG 2.1 AA.

---

## 1. Cấu trúc dự án
```
portfolio/
├─ index.html           # Điểm vào chính – SEO hreflang, Open Graph & render layout
├─ 404.html            # Trang lỗi 404 hỗ trợ 3 ngôn ngữ (VI, EN, FR)
├─ sitemap.xml         # XML sitemap đa ngôn ngữ (xhtml:link hreflang)
├─ robots.txt
├─ README.md            # Tài liệu dự án
├─ css/
│  ├─ base.css         # @font-face tự host, tokens, typography & reset
│  ├─ layout.css       # Header 1 hàng, tab bar cuộn ngang, bố cục lưới
│  └─ components.css   # Buttons, forms, theme switch, animation
├─ js/
│  ├─ i18n.js          # Bộ chọn 3 ngôn ngữ (VI / EN / FR), localStorage & định tuyến
│  ├─ theme.js         # Chuyển đổi theme Sáng/Tối (Light/Dark)
│  ├─ filter.js        # Bộ lọc thẻ dự án
│  ├─ motion.js        # Hiệu ứng mượt mà khi cuộn và chuyển tab
│  ├─ form.js          # Xử lý form liên hệ (Formspree hoặc mailto)
│  └─ render.js        # Xây dựng DOM, giải quyết đa ngôn ngữ & routing con
├─ data/
│  ├─ profile.json      # Thông tin cá nhân (để rỗng theo cấu trúc đa ngôn ngữ)
│  ├─ projects.json     # Danh sách dự án
│  ├─ certificates.json # Danh sách chứng chỉ nghề nghiệp
│  ├─ skills.json       # Danh mục kỹ năng chuyên môn
│  ├─ profile.example.md# Hướng dẫn chi tiết mẫu JSON đa ngôn ngữ
│  ├─ ui.vi.json        # Chuỗi giao diện tiếng Việt
│  ├─ ui.en.json        # Chuỗi giao diện tiếng Anh
│  ├─ ui.fr.json        # Chuỗi giao diện tiếng Pháp (chuẩn ngữ pháp & dấu)
│  └─ _demo/            # Dữ liệu thử nghiệm hoàn chỉnh (?demo=1)
└─ assets/
   ├─ fonts/            # Bộ font WOFF2 tự host (Newsreader, Be Vietnam Pro, IBM Plex Mono)
   ├─ img/              # Ảnh đại diện hero.webp & minh họa
   └─ icons/            # Icon SVG
```

---

## 2. Hệ thống Đa ngôn ngữ (VI / EN / FR)

### 2.1. Cách chọn ngôn ngữ mặc định
Khi người dùng truy cập trang:
1. Đọc tùy chọn đã lưu từ `localStorage` (`uiLang`).
2. Nếu chưa có, tự động nhận diện theo `navigator.language`:
   - Nếu bắt đầu bằng `vi*` ➔ sử dụng `vi`.
   - Nếu bắt đầu bằng `fr*` ➔ sử dụng `fr`.
   - Nếu bắt đầu bằng `en*` ➔ sử dụng `en`.
   - Mọi ngôn ngữ khác ➔ dùng `en`.
3. Mặc định cuối cùng: `vi`.

### 2.2. Cơ chế Dự phòng Dữ liệu (Fallback Hierarchy)
Mỗi trường văn bản trong các tệp dữ liệu cá nhân (`profile.json`, `projects.json`, `certificates.json`, `skills.json`) có thể là một chuỗi đơn hoặc một object gồm các khóa ngôn ngữ:
```json
{
  "role": {
    "vi": "Chuyên viên Quản trị Chuỗi Cung ứng",
    "en": "Supply Chain & Logistics Specialist",
    "fr": "Spécialiste Supply Chain & Logistique"
  }
}
```
Khi hiển thị giao diện:
- **Tiếng Pháp (`fr`)**: Tìm giá trị tại khóa `fr`. Nếu khóa `fr` rỗng (`""`), tự động dự phòng sang `en`. Nếu `en` cũng rỗng, lấy từ `vi`.
- **Tiếng Anh (`en`)**: Tìm giá trị tại khóa `en`. Nếu rỗng, tự động dự phòng sang `vi`.
- **Tiếng Việt (`vi`)**: Tìm giá trị tại khóa `vi`. Nếu rỗng, lấy từ `en` (hoặc `fr`).

### 2.3. Cách điền khóa `"fr"`
- Đối với mọi trường chữ trong dữ liệu cá nhân, giữ nguyên cấu trúc object `{"vi": "", "en": "", "fr": ""}`.
- Nếu bạn chưa có bản dịch tiếng Pháp, chỉ cần để `""`. Giao diện sẽ tự động hiển thị bản tiếng Anh hoặc tiếng Việt mà không để lộ chuỗi rỗng hay chữ "undefined".
- Chi tiết xem tại `data/profile.example.md`.

### 2.4. Cách thêm một ngôn ngữ mới (Ví dụ: Tiếng Đức `de` hoặc Nhật `ja`)
1. **Tạo tệp UI**: Tạo `data/ui.<mã_ngôn_ngữ>.json` (sao chép từ `data/ui.en.json` và dịch các chuỗi giao diện, tab names, slugs).
2. **Khai báo trong `js/i18n.js`**:
   - Thêm mã ngôn ngữ vào mảng `SUPPORTED_LANGS` (ví dụ `['vi', 'en', 'fr', 'de']`).
   - Thêm slug các tab tương ứng vào `TAB_SLUG_MAP`.
3. **Cập nhật `js/render.js`**:
   - Thêm slug vào `SLUG_TO_TAB`.
   - Thêm mã ngôn ngữ vào `LOCALE_MAP` và các thẻ `lang-switch`.
   - Cập nhật hàm `resolveI18n` để bổ sung thứ tự fallback cho ngôn ngữ mới.
4. **Cập nhật SEO trong `index.html` và `sitemap.xml`**:
   - Thêm `<link rel="alternate" hreflang="<mã>" href="...">`.
5. **Dữ liệu cá nhân**: Thêm khóa ngôn ngữ tương ứng vào các object text trong `profile.json`, `projects.json`, v.v.

---

## 3. Hệ thống Typography Tự Host

Trang web hoàn toàn tự host font chữ trong thư mục `assets/fonts/` (không tải từ Google Fonts CDN nhằm đảm bảo quyền riêng tư và hiệu năng tải trang):
- **Tiêu đề (Headings)**: **Newsreader** (variable font với 2 trục `opsz` và `wght`, đầy đủ bản thường và italic).
- **Thân bài (Body text)**: **Be Vietnam Pro** (các độ đậm 400, 500, 600, 700 và italic 400).
- **Mã nguồn & Nhãn kỹ thuật (Mono)**: **IBM Plex Mono** (các độ đậm 400, 500).

Toàn bộ các file font đều bao gồm đầy đủ 3 tập con: `vietnamese`, `latin-ext`, `latin`, hỗ trợ 100% các ký tự tiếng Việt, tiếng Pháp, ký hiệu tiền tệ và dấu câu chuyên dụng.

---

## 4. Kiểm thử Cục bộ (Local Development) & Demo Mode

### 4.1. Chạy máy chủ cục bộ
```bash
cd portfolio
python -m http.server 8000
# Truy cập: http://localhost:8000/
```

### 4.2. Chế độ xem thử Demo (`?demo=1`) và Kiểm tra mục ẩn (`?showhidden=1`)
- Thêm `?demo=1` vào URL (ví dụ `http://localhost:8000/?demo=1#/` hoặc `http://localhost:8000/?demo=1#/du-an`) để xem toàn bộ dữ liệu mẫu đầy đủ cả 3 ngôn ngữ với mọi loại chứng chỉ, khóa học và kỹ năng.
- Thêm `?showhidden=1` vào URL khi phát triển để hiển thị cả các chứng chỉ có cờ `hidden: true` (kèm nhãn `[Hidden]`). Tham số này chỉ phục vụ kiểm tra cục bộ, không dùng khi deploy.
- Tham số query string luôn được giữ nguyên khi chuyển tab hoặc chuyển đổi ngôn ngữ.
- **Lưu ý triển khai:** Thư mục `data/_demo/` chỉ dùng cho kiểm thử, cần xóa hoặc loại trừ khi phát hành phiên bản chính thức.

### 4.3. Kiểm tra tự động liên kết xác thực (check-links)
Chạy script kiểm tra độc lập các URL chứng chỉ:
```bash
npm run check-links
```
Script sẽ gửi yêu cầu HTTP tới từng `verify_url` trong `data/certificates.json` và báo cáo các link OK, redirect, cần đăng nhập hoặc link hỏng.

### 4.4. Kiểm tra tự động giao diện di động (`scripts/check-mobile.js`)
Chạy bộ kiểm tra Playwright cho toàn bộ các kích thước màn hình di động/máy tính bảng (`320×568` đến `768×1024`, dọc & ngang, DPR 2/3, Sáng/Tối, VI/EN/FR, dữ liệu thật / `?demo=1` / rỗng):
```bash
npm run check-mobile
```
> **Lưu ý khi deploy:** Thư mục `scripts/` (bao gồm `scripts/check-mobile.js` và `scripts/check-links.js`), `node_modules/` và `package*.json` chỉ phục vụ kiểm thử cục bộ, **không đưa vào bản deploy** sản xuất.

---

## 5. Triển khai lên GitHub Pages
1. Đưa toàn bộ mã nguồn trong thư mục `portfolio/` lên nhánh `main` của kho lưu trữ GitHub `<USERNAME>.github.io` (hoặc kho dự án).
2. Vào Settings ➔ Pages ➔ Source chọn `main` / root.
3. Trang web sẽ sẵn sàng sau vài phút.