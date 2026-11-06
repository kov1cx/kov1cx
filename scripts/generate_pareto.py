import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np
from PIL import Image

def generate_chart():
    plt.rcParams['font.family'] = 'Segoe UI'
    plt.rcParams['font.size'] = 11

    # Data - exact arithmetic consistency:
    # 25.3 + 23.9 + 15.1 + 13.3 + 13.1 + 9.3 = 100.0%
    categories = [
        'Hệ thống treo\n& truyền động',
        'Khung &\nthân xe',
        'Hệ thống\nđiện',
        'Hệ thống\nphanh',
        'Động cơ',
        'Phụ tùng\nkhác'
    ]
    shares = [25.3, 23.9, 15.1, 13.3, 13.1, 9.3]
    cumulative = [25.3, 49.2, 64.3, 77.6, 90.7, 100.0]

    fig, ax1 = plt.subplots(figsize=(11.5, 6.8), dpi=150)
    fig.patch.set_facecolor('#ffffff')
    ax1.set_facecolor('#ffffff')

    # Bar chart (Share of net revenue)
    x = np.arange(len(categories))
    bar_width = 0.52
    bars = ax1.bar(x, shares, width=bar_width, color='#1d63ed', label='Tỷ trọng doanh thu thuần (%)', zorder=3)

    # Values on top of bars
    for bar, val in zip(bars, shares):
        y_val = bar.get_height()
        ax1.text(bar.get_x() + bar.get_width()/2, y_val / 2, f'{val:.1f}%',
                 ha='center', va='center', color='#ffffff', fontweight='bold', fontsize=11, zorder=4)

    ax1.set_ylabel('Tỷ trọng doanh thu (%)', color='#4b5563', fontsize=11, labelpad=8)
    ax1.set_ylim(0, 32)
    ax1.tick_params(axis='y', labelcolor='#4b5563')
    ax1.set_xticks(x)
    ax1.set_xticklabels(categories, fontsize=10.5, color='#111827', fontweight='600')

    # Cumulative line (ax2)
    ax2 = ax1.twinx()
    ax2.plot(x, cumulative, color='#374151', marker='o', linewidth=2.4, markersize=7,
             markerfacecolor='#1f2937', label='Đường tích lũy doanh thu (%)', zorder=5)

    # Cumulative value labels
    for i, (xi, yi) in enumerate(zip(x, cumulative)):
        offset_y = 4.2
        if i == 2: # 64.3%
            ax2.annotate(f'{yi:.1f}% (Top 3)', (xi, yi), textcoords="offset points", xytext=(0, 10),
                         ha='center', fontsize=11, fontweight='bold', color='#1d63ed',
                         bbox=dict(boxstyle="round,pad=0.25", fc="#eff6ff", ec="#bfdbfe", lw=1))
        else:
            ax2.annotate(f'{yi:.1f}%', (xi, yi), textcoords="offset points", xytext=(0, offset_y),
                         ha='center', fontsize=10.5, fontweight='bold', color='#1f2937')

    # Threshold lines for ABC classification
    ax2.axhline(70, color='#9ca3af', linestyle='--', linewidth=1.2, zorder=2)
    ax2.text(0.02, 71.2, '70%: Ngưỡng phân loại Nhóm A (Doanh thu cao)', transform=ax2.get_yaxis_transform(),
             fontsize=9.5, color='#6b7280', fontstyle='italic')

    ax2.axhline(90, color='#9ca3af', linestyle='--', linewidth=1.2, zorder=2)
    ax2.text(0.02, 91.2, '90%: Ngưỡng phân loại Nhóm B / C', transform=ax2.get_yaxis_transform(),
             fontsize=9.5, color='#6b7280', fontstyle='italic')

    ax2.set_ylabel('Tỷ trọng tích lũy (%)', color='#4b5563', fontsize=11, labelpad=8)
    ax2.set_ylim(0, 115)
    ax2.tick_params(axis='y', labelcolor='#4b5563')

    # Grid & styling
    ax1.grid(axis='y', linestyle='-', alpha=0.35, color='#e5e7eb', zorder=1)
    ax1.spines['top'].set_visible(False)
    ax2.spines['top'].set_visible(False)
    ax1.spines['left'].set_color('#d1d5db')
    ax1.spines['bottom'].set_color('#111827')
    ax2.spines['right'].set_color('#d1d5db')

    # Main Titles
    fig.suptitle('3 nhóm sản phẩm hàng đầu đóng góp 64.3% doanh thu thuần',
                 fontsize=16, fontweight='bold', color='#111827', x=0.08, y=0.98, ha='left')
    fig.text(0.08, 0.925, 'Phân tích ABC / Pareto theo dòng sản phẩm phụ tùng xe máy (Bộ dữ liệu mẫu benchmark)',
             fontsize=11.5, color='#6b7280', ha='left')

    # Legend
    lines1, labels1 = ax1.get_legend_handles_labels()
    lines2, labels2 = ax2.get_legend_handles_labels()
    ax1.legend(lines1 + lines2, labels1 + labels2, loc='lower right', frameon=True,
               facecolor='#ffffff', edgecolor='#e5e7eb', fontsize=10)

    # Footer source & rounding note
    fig.text(0.08, 0.02, 'Nguồn dữ liệu: sales_data (Kaggle/DataCamp, Q2-Q3/2021). Doanh thu thuần = Doanh thu - Phí dịch vụ (* Làm tròn 1 chữ số thập phân, tổng tích lũy = 100.0%).',
             fontsize=9.5, color='#9ca3af', ha='left')

    plt.subplots_adjust(top=0.88, bottom=0.14, left=0.08, right=0.92)
    
    out_png = 'portfolio/assets/img/motorcycle-sales-pareto.png'
    out_webp = 'portfolio/assets/img/motorcycle-sales-pareto.webp'
    out_webp800 = 'portfolio/assets/img/motorcycle-sales-pareto-800.webp'
    
    plt.savefig(out_png, dpi=150, facecolor='#ffffff', edgecolor='none')
    plt.close()
    print(f"Generated {out_png}")

    # Convert to webp with high quality
    img = Image.open(out_png)
    img.save(out_webp, 'WEBP', quality=92)
    print(f"Generated {out_webp}")

    # Generate 800w version
    ratio = 800 / img.width
    h800 = round(img.height * ratio)
    img800 = img.resize((800, h800), Image.Resampling.LANCZOS)
    img800.save(out_webp800, 'WEBP', quality=90)
    print(f"Generated {out_webp800}")

if __name__ == '__main__':
    generate_chart()
