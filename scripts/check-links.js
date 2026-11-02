/**
 * scripts/check-links.js
 * Kiểm tra tính hợp lệ của tất cả verify_url trong data/certificates.json
 * Chạy thủ công: npm run check-links
 */

const fs = require('fs');
const path = require('path');

const certsPath = path.resolve(__dirname, '../data/certificates.json');

if (!fs.existsSync(certsPath)) {
  console.error(`[LỖI] Không tìm thấy tệp: ${certsPath}`);
  process.exit(1);
}

let data;
try {
  data = JSON.parse(fs.readFileSync(certsPath, 'utf8'));
} catch (err) {
  console.error(`[LỖI] Lỗi cú pháp JSON trong ${certsPath}:`, err.message);
  process.exit(1);
}

const certs = Array.isArray(data.certificates) ? data.certificates : [];
console.log(`\n============================================================`);
console.log(` KIỂM TRA ĐƯỜNG DẪN XÁC THỰC CHỨNG CHỈ (CHECK-LINKS)`);
console.log(` Tổng số mục trong tệp: ${certs.length}`);
console.log(`============================================================\n`);

const results = {
  total: 0,
  ok: 0,
  redirect: 0,
  authRequired: 0,
  broken: 0,
  noUrl: 0,
  items: []
};

async function checkUrl(url) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  };

  try {
    // Thử gửi GET (chỉ đọc headers trước nếu có thể)
    const res = await fetch(url, {
      method: 'GET',
      headers,
      signal: controller.signal,
      redirect: 'manual'
    });
    clearTimeout(timeoutId);

    const status = res.status;
    const location = res.headers.get('location');

    // Kiểm tra redirect
    if (status >= 300 && status < 400) {
      const isLoginRedirect = location && /(login|signin|auth|oauth|account)/i.test(location);
      return {
        status,
        type: isLoginRedirect ? 'authRequired' : 'redirect',
        message: `Redirect ${status} -> ${location}`
      };
    }

    if (status === 401 || status === 403) {
      return {
        status,
        type: 'authRequired',
        message: `HTTP ${status} (Yêu cầu đăng nhập hoặc giới hạn quyền truy cập)`
      };
    }

    if (status >= 400) {
      return {
        status,
        type: 'broken',
        message: `HTTP ${status} (Liên kết hỏng / không tìm thấy)`
      };
    }

    // 200 OK -> Kiểm tra nếu chuyển hướng ngầm tới login
    return {
      status,
      type: 'ok',
      message: `HTTP ${status} OK`
    };
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      return {
        status: 0,
        type: 'broken',
        message: 'Timeout (>12s)'
      };
    }
    return {
      status: 0,
      type: 'broken',
      message: `Lỗi kết nối: ${err.message}`
    };
  }
}

async function run() {
  for (const c of certs) {
    const rawTitle = typeof c.title === 'object' ? (c.title.vi || c.title.en || c.title.fr) : c.title;
    const url = (c.verify_url || c.link || '').trim();

    if (!url) {
      results.noUrl++;
      results.items.push({
        id: c.id,
        title: rawTitle,
        issuer: c.issuer,
        url: '(Không có URL)',
        statusText: '[THIẾU LINK]',
        type: 'noUrl'
      });
      continue;
    }

    results.total++;
    process.stdout.write(`Đang kiểm tra: ${c.id} (${rawTitle})... `);
    const res = await checkUrl(url);

    if (res.type === 'ok') {
      results.ok++;
      console.log(`[OK] ${res.message}`);
    } else if (res.type === 'redirect') {
      results.redirect++;
      console.log(`[CHUYỂN HƯỚNG] ${res.message}`);
    } else if (res.type === 'authRequired') {
      results.authRequired++;
      console.log(`[CẦN ĐĂNG NHẬP / 403] ${res.message}`);
    } else {
      results.broken++;
      console.log(`[HỎNG] ${res.message}`);
    }

    results.items.push({
      id: c.id,
      title: rawTitle,
      issuer: c.issuer,
      url,
      statusText: res.message,
      type: res.type
    });
  }

  console.log(`\n------------------------------------------------------------`);
  console.log(` KẾT QUẢ TỔNG HỢP:`);
  console.log(` - Tổng số chứng chỉ:        ${certs.length}`);
  console.log(` - Có URL xác thực:          ${results.total}`);
  console.log(` - Không có URL:             ${results.noUrl}`);
  console.log(` - Hợp lệ (OK):              ${results.ok}`);
  console.log(` - Chuyển hướng (Redirect):  ${results.redirect}`);
  console.log(` - Yêu cầu auth / Bot check: ${results.authRequired}`);
  console.log(` - Hỏng (Broken / Error):    ${results.broken}`);
  console.log(`------------------------------------------------------------\n`);

  if (results.broken > 0 || results.authRequired > 0) {
    console.log(`CÁC MỤC CẦN LƯU Ý:`);
    results.items
      .filter(item => item.type === 'broken' || item.type === 'authRequired')
      .forEach(item => {
        console.log(` • [${item.id}] ${item.title}: ${item.statusText} -> ${item.url}`);
      });
    console.log(``);
  }
}

run().catch(err => {
  console.error('[LỖI CHƯƠNG TRÌNH]', err);
  process.exit(1);
});

