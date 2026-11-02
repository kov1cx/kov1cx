# HƯỚNG DẪN CẤU TRÚC DỮ LIỆU ĐA NGÔN NGỮ (VI / EN / FR)
# MULTILINGUAL DATA GUIDE & PROFILE SPECIFICATION

Tài liệu này hướng dẫn cách điền dữ liệu cá nhân trong thư mục `data/` hỗ trợ 3 ngôn ngữ: Tiếng Việt (`vi`), Tiếng Anh (`en`), và Tiếng Pháp (`fr`).

---

## 1. Cơ chế Dự phòng Ngôn ngữ (Fallback Hierarchy)
Khi trang web hiển thị nội dung:
- **Ngôn ngữ Pháp (`fr`)**: Ưu tiên trường `fr`. Nếu rỗng `""` hoặc không có, tự động lấy dữ liệu từ `en`. Nếu `en` cũng rỗng, lấy từ `vi`.
- **Ngôn ngữ Anh (`en`)**: Ưu tiên trường `en`. Nếu rỗng, lấy từ `vi`.
- **Ngôn ngữ Việt (`vi`)**: Ưu tiên trường `vi`. Nếu rỗng, lấy từ `en` (hoặc `fr`).

> [!NOTE]
> Các trường text có thể là một chuỗi đơn (nếu chỉ dùng 1 ngôn ngữ) hoặc là một object gồm 3 khóa `{"vi": "...", "en": "...", "fr": "..."}`.
> Nếu bạn chưa có bản dịch tiếng Pháp, chỉ cần để `""`. Hệ thống sẽ tự động dùng bản tiếng Anh hoặc tiếng Việt làm dự phòng mà không gây lỗi giao diện.

---

## 2. Cấu trúc chi tiết từng tệp

### `data/profile.json`
```json
{
  "name": "Nguyễn Văn A",
  "initials": "NVA",
  "role": {
    "vi": "Chuyên viên Quản trị Chuỗi Cung ứng",
    "en": "Supply Chain & Logistics Specialist",
    "fr": "Spécialiste Supply Chain & Logistique"
  },
  "tagline": {
    "vi": "Tối ưu hóa mạng lưới giao nhận đa điểm và dự báo tồn kho chuỗi cung ứng.",
    "en": "Multi-stop fleet route optimization and supply chain inventory forecasting.",
    "fr": "Optimisation de tournées multi-points et prévision des stocks logistiques."
  },
  "status": {
    "vi": "Sẵn sàng đón nhận cơ hội mới",
    "en": "Open to new opportunities",
    "fr": "À l’écoute de nouvelles opportunités"
  },
  "target": {
    "vi": "Tháng 09/2026",
    "en": "September 2026",
    "fr": "Septembre 2026"
  },
  "intro": {
    "vi": "Tối ưu hóa mạng lưới logistics, vận tải đa phương thức và giải pháp phân phối bán lẻ.",
    "en": "Logistics network optimization, multimodal freight, and retail distribution solutions.",
    "fr": "Optimisation des réseaux logistiques, transport multimodal et distribution omnicanale."
  },
  "facts": [
    {
      "label": {
        "vi": "Thời gian sẵn sàng",
        "en": "Availability",
        "fr": "Disponibilité"
      },
      "value": {
        "vi": "Tháng 09/2026 · Thực tập / Toàn thời gian",
        "en": "September 2026 · Internship / Full-time",
        "fr": "Septembre 2026 · Stage / Temps plein"
      }
    },
    {
      "label": {
        "vi": "Nơi ở",
        "en": "Location",
        "fr": "Localisation"
      },
      "value": {
        "vi": "Hà Nội, Việt Nam",
        "en": "Hanoi, Vietnam",
        "fr": "Hanoï, Vietnam"
      }
    },
    {
      "label": {
        "vi": "Trường & Năm học",
        "en": "University & Year",
        "fr": "Université & Année"
      },
      "value": {
        "vi": "Đại học Xây Dựng Hà Nội · Sinh viên năm 3",
        "en": "Hanoi University of Civil Engineering · 3rd-year Student",
        "fr": "Université de Génie Civil de Hanoï · 3e année"
      }
    },
    {
      "label": {
        "vi": "Ngôn ngữ",
        "en": "Languages",
        "fr": "Langues"
      },
      "value": {
        "vi": "Tiếng Việt (Bản ngữ) · Tiếng Anh (B2)",
        "en": "Vietnamese (Native) · English (B2)",
        "fr": "Vietnamien (Langue maternelle) · Anglais (B2)"
      }
    }
  ],
  "cvLink": "assets/docs/cv.pdf",
  "email": "example@domain.com",
  "phone": "+84 90 123 4567",
  "linkedin": "https://linkedin.com/in/username",
  "github": "https://github.com/username",
  "kaggle": "https://kaggle.com/username",
  "formspreeId": "myformid",
  "education": [
    {
      "degree": {
        "vi": "Thạc sĩ Khoa học Chuỗi Cung ứng",
        "en": "Master of Science in Supply Chain",
        "fr": "Master of Science en Supply Chain"
      },
      "school": {
        "vi": "Đại học Kinh tế",
        "en": "University of Economics",
        "fr": "Université d’Économie"
      },
      "year": "2022 – 2024",
      "details": {
        "vi": "Nghiên cứu mô hình định tuyến xe tải (VRP).",
        "en": "Research in Vehicle Routing Problem (VRP).",
        "fr": "Recherche sur l’optimisation des tournées de véhicules (VRP)."
      }
    }
  ],
  "experience": [
    {
      "role": {
        "vi": "Chuyên viên Hoạch định Vận tải",
        "en": "Freight Planning Specialist",
        "fr": "Spécialiste Planification du Transport"
      },
      "company": {
        "vi": "Tập đoàn Logistics Á Châu",
        "en": "Asia Logistics Group",
        "fr": "Groupe Logistique Asie"
      },
      "period": "2024 – Hiện tại",
      "description": {
        "vi": "Điều phối mạng lưới giao vận tại 14 kho trung chuyển.",
        "en": "Coordinating freight operations across 14 hubs.",
        "fr": "Coordination des flux de transport sur 14 plateformes logistiques."
      }
    }
  ]
}
```
- `tagline` (object đa ngôn ngữ `{ "vi": "", "en": "", "fr": "" }` hoặc chuỗi, tùy chọn): Câu định vị ngắn hiển thị ngay bên dưới họ tên (`h1`) ở cỡ chữ `lead` trên phần mở đầu (Hero). Nếu mục Tổng quan (`01.1 Overview`) chỉ còn một dòng văn bản thì nội dung sẽ tự động gộp vào Hero dưới tên và bỏ mục `01.1 Overview`, đồng thời đánh lại số thứ tự các mục tiếp theo.
- `portrait` (object `{ "src": "", "alt": { "vi": "", "en": "", "fr": "" }, "grayscale": true }`, tùy chọn): Ảnh chân dung tỷ lệ `4:5` hiển thị ở cột phải của Hero trên Desktop (`4/12` cột, canh đầu ảnh với đầu khối tên) và nằm dưới câu định vị / trước bảng sự kiện trên điện thoại (`<=700px`). Nếu `src` rỗng hoặc file không tồn tại, khối ảnh không render và Hero co lại bình thường. Nếu `alt` rỗng sẽ tự động dùng `"Chân dung của <tên>"` theo ngôn ngữ. Mặc định `grayscale: true` (`filter: grayscale(1) contrast(1.05)`).
- `facts` (mảng các đối tượng `{ "label": {...}, "value": {...} }`, tùy chọn): Bảng sự kiện 3–4 hàng hiển thị ở cột phải của Hero (nhãn `12px`, giá trị `14–16px`, kẻ ngang mảnh `1px`). Hàng nào có `value` rỗng `""` sẽ tự động ẩn.

### `data/projects.json`
```json
{
  "projects": [
    {
      "title": {
        "vi": "Tối ưu hóa Lộ trình Đội xe Đa điểm",
        "en": "Multi-stop Fleet Route Optimization",
        "fr": "Optimisation de Tournées de Véhicules Multi-points"
      },
      "summary": {
        "vi": "Mô hình định tuyến phương tiện (VRP) với khung thời gian giao nhận.",
        "en": "Vehicle Routing Problem (VRP) model with delivery time windows.",
        "fr": "Modèle d’optimisation des tournées (VRP) avec fenêtres de livraison."
      },
      "result": {
        "vi": "Cắt giảm 14% chi phí nhiên liệu và rút ngắn 22% thời gian giao nhận.",
        "en": "Reduced fuel costs by 14% and cut delivery lead time by 22%.",
        "fr": "Réduction de 14 % des dépenses de carburant et gain de 22 % sur les délais."
      },
      "tags": ["Logistics", "Python", "OR-Tools"],
      "role": {
        "vi": "Kỹ sư Tối ưu hóa",
        "en": "Optimization Engineer",
        "fr": "Ingénieur Optimisation"
      },
      "image": "",
      "grayscale": false,
      "pdfLink": "assets/docs/vrp-report.pdf",
      "githubLink": "https://github.com/username/vrp-repo",
      "demoLink": "https://example.com/demo",
      "featured": true
    }
  ]
}
```
- `grayscale` (boolean, tùy chọn): Mặc định `false` (giữ nguyên màu gốc cho biểu đồ, bản đồ, dashboard vì màu mã hóa dữ liệu). Đặt `"grayscale": true` nếu muốn chuyển hình ảnh của dự án đó sang đen trắng (`filter: grayscale(1)`).
- Các trường chi tiết tùy chọn cho trang `#/du-an/<slug>` (mục nào rỗng sẽ tự động ẩn): `context` (Bối cảnh), `data` (Dữ liệu), `method` (Phương pháp — mảng các bước hoặc chuỗi, hiển thị thành các bước đánh số trên nền đen liên tục), `result` (Kết quả), `limitations` (Hạn chế).

### `data/certificates.json`
Mỗi mục trong mảng `certificates` có cấu trúc chuẩn như sau (khóa không sử dụng để rỗng `""`):
```json
{
  "certificates": [
    {
      "id": "cert-cscp",
      "title": "Certified Supply Chain Professional (CSCP)",
      "issuer": "APICS / ASCM",
      "year": "2024",
      "month": "05",
      "type": "certificate",
      "status": "completed",
      "expected": "",
      "category": "logistics",
      "featured": true,
      "order": 1,
      "hidden": false,
      "group": "",
      "verify_url": "https://example.com/verify-cscp",
      "verify_note": "",
      "hours": "150",
      "project_id": "toi-uu-hoa-lo-trinh-doi-xe-da-diem"
    }
  ]
}
```

#### Chi tiết các trường dữ liệu `certificates.json`:
- `id` (chuỗi): Mã định danh duy nhất (ví dụ: `cert-cscp`, `cert-data-science`).
- `title` (chuỗi): Tên khóa/chứng chỉ giữ nguyên ngôn ngữ gốc (không dịch).
- `issuer` (chuỗi): Đơn vị cấp chứng chỉ / tổ chức đào tạo.
- `year` (chuỗi): Năm hoàn thành (ví dụ: `"2024"`).
- `month` (chuỗi): Tháng hoàn thành (ví dụ: `"05"` hoặc `""` nếu không có).
- `type`:
  - `"certificate"`: Có văn bằng/chứng chỉ chính thức cấp cho bạn.
  - `"badge"`: Huy hiệu kỹ năng hoặc chứng nhận hoàn thành ngắn hạn.
  - `"course"`: Khóa đã học nhưng **không cấp chứng chỉ** (ví dụ khóa audit). Hiển thị ở khối riêng, tuyệt đối không dùng các từ "chứng chỉ", "certified", "certificat".
- `status`:
  - `"completed"`: Đã hoàn thành (mặc định).
  - `"in_progress"`: Đang trong quá trình học.
  - `"planned"`: Dự kiến sẽ học trong tương lai.
- `expected` (chuỗi): Thời gian dự kiến hoàn thành (ví dụ: `"Q4 2026"`, `"11/2026"`), chỉ dùng khi `status` khác `"completed"`.
- `category`: Phân loại chuyên môn, gồm:
  - `"data"`: Dữ liệu & Phân tích (Data & Analytics)
  - `"code"`: Lập trình & Kỹ thuật (Programming & Engineering)
  - `"logistics"`: Quản trị Logistics & Chuỗi cung ứng
  - `"ai"`: Trí tuệ Nhân tạo (AI)
  - `"management"`: Quản trị & Dự án (Management)
  - `"other"`: Kỹ năng bổ trợ khác
- `featured` (boolean): `true` nếu là chứng chỉ nổi bật (tối đa 4 mục hiển thị dạng thẻ lớn), `false` nếu thông thường.
- `order` (số): Thứ tự ưu tiên sắp xếp hiển thị.
- `hidden` (boolean): `true` để ẩn khỏi giao diện (không render vào DOM; chỉ hiển thị khi dev dùng `?showhidden=1`).
- `group` (chuỗi): Tên nhóm gom (ví dụ `"hp-life"`, `"gli-modules"`). Nếu có nhiều chứng chỉ cùng đơn vị, cùng thời điểm, đặt chung mã nhóm để hệ thống tự động gom vào một thanh `<details>` mở rộng được. Để rỗng `""` nếu là chứng chỉ độc lập.
- `verify_url` (chuỗi): Đường link tra cứu / xác thực trực tuyến (`https://...`).
- `verify_note` (chuỗi): Ghi chú xác thực khi thiếu liên kết (ví dụ: `"Bản cứng lưu tại hồ sơ cá nhân"`). Nếu rỗng sẽ dùng câu mặc định `"Xác thực khi được yêu cầu"`.
- `hours` (chuỗi/số, tùy chọn): Thời lượng khóa học (ví dụ: `"150"` sẽ hiển thị `"150 giờ"`).
- `project_id` (chuỗi, tùy chọn): Slug hoặc ID của dự án trong `projects.json` mà kiến thức được áp dụng vào (hệ thống tự tạo liên kết nội bộ tới dự án).

> [!IMPORTANT]
> **Quy định bảo mật**: Tuyệt đối không lưu mã số sê-ri nội bộ chứng chỉ, số CMND/CCCD, họ tên in trên chứng chỉ, hoặc liên kết tải PDF chứng chỉ trong tệp này.

---

### `data/skills.json`
```json
{
  "analysis": [
    {
      "name": {
        "vi": "Dự báo nhu cầu (Forecasting)",
        "en": "Demand Forecasting",
        "fr": "Prévision de la demande"
      },
      "level": "daily",
      "evidence": ["he-thong-du-bao-nhu-cau-ton-kho-kho-lanh"]
    }
  ],
  "programming": [
    {
      "name": {
        "vi": "Python (Pandas, PuLP, OR-Tools)",
        "en": "Python (Pandas, PuLP, OR-Tools)",
        "fr": "Python (Pandas, PuLP, OR-Tools)"
      },
      "level": "daily",
      "evidence": ["demo-badge-python", "toi-uu-hoa-lo-trinh-doi-xe-da-diem"],
      "logo": "<svg viewBox='0 0 24 24' width='16' height='16'>...</svg>"
    }
  ]
}
```
- `level`: Cấp độ thành thạo:
  - `"learning"`: Đang học
  - `"proficient"`: Thành thạo
  - `"daily"`: Sử dụng hằng ngày
- `evidence` (mảng chuỗi, tùy chọn): Danh sách ID dự án (từ `projects.json`) hoặc ID chứng chỉ (từ `certificates.json`). Khi có, giao diện hiển thị dòng chữ mono nhỏ: `Minh chứng: <Tên dự án/chứng chỉ>` kèm liên kết trực tiếp.
- `logo` / `icon` (chuỗi, tùy chọn): Mã SVG đơn sắc hoặc đường dẫn tệp SVG biểu trưng công nghệ.
