import './App.css';

const navItems = ['Trang chủ', 'Dịch vụ', 'Tư vấn tóc', 'Bảng giá', 'Tin tức', 'Liên hệ'];
const promoItems = [
  { title: 'Combo Uốn - Duỗi - Nhuộm', text: 'Giảm ngay 15% khi đặt 3 dịch vụ cùng lúc trong 1 buổi.', accent: 'soft-blue' },
  { title: 'Phục hồi & chăm sóc tóc', text: 'Tặng 1 liệu trình dưỡng ẩm sâu và kiểm tra tình trạng tóc miễn phí.', accent: 'dark' },
];
const services = [
  { title: 'Tóc Nhuộm', image: 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=900&q=80' },
  { title: 'Tóc Uốn', image: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=900&q=80' },
  { title: 'Cắt Tóc', image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80' },
  { title: 'Duỗi Tóc', image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=900&q=80' },
];
const styles = [
  { name: 'Mặt trái xoan', tone: 'Gợi ý tỉa layer mềm, mái xòa nhẹ để làm nổi bật gương mặt.' },
  { name: 'Mặt tròn', tone: 'Nên chọn kiểu tóc có độ dài ngang vai và tầng mái tối giản.' },
  { name: 'Mặt vuông', tone: 'Lựa chọn mái uốn cong, tóc dài mềm để giảm góc cạnh.' },
  { name: 'Mặt dài', tone: 'Mái ngắn, tầng xoè ngang giúp cân đối đường nét.' },
];
const hours = [
  ['Thứ 2', '08:30', '19:00'], ['Thứ 3', '08:30', '19:00'], ['Thứ 4', '08:30', '19:00'], ['Thứ 5', '08:30', '19:00'], ['Thứ 6', '08:30', '19:00'], ['Thứ 7', '09:00', '18:00'], ['Chủ Nhật', '09:00', '17:00'],
];
const blogPosts = [
  { title: '5 mẹo giữ màu nhuộm bền đẹp sau 4 tuần', text: 'Khám phá cách bảo dưỡng tóc nhuộm đúng cách để giữ màu sắc tươi sáng và không bị khô xơ.', image: 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=900&q=80' },
  { title: 'Chọn kiểu tóc phù hợp cho phong cách làm việc chuyên nghiệp', text: 'Một diện mạo gọn gàng nhưng vẫn nữ tính sẽ giúp bạn tự tin hơn trong từng cuộc họp.', image: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=900&q=80' },
  { title: 'Spa tóc và dưỡng phù hợp cho mái tóc yếu sau mùa mưa', text: 'Hướng dẫn 3 bước phục hồi độ ẩm, cải thiện độ bóng và giảm gãy rụng hiệu quả.', image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=80' },
];

function App() {
  return (
    <div className="page">
      <header className="topbar-wrapper">
        <div className="container topbar">
          <div className="topbar-left">
            <span>Hotline: 090 123 4567</span>
            <span>Email: hello@salonblue.com</span>
            <span>Địa chỉ: 58 Nguyễn Huệ, Q1, TP.HCM</span>
          </div>
          <div className="topbar-right">
            <span>f</span><span>◎</span><span>◌</span><span>▶</span>
          </div>
        </div>
      </header>

      <nav className="nav-wrapper">
        <div className="container nav-inner">
          <div className="brand-wrap">
            <div className="brand-mark">SB</div>
            <div>
              <div className="brand-name">Salon Blue</div>
              <div className="brand-tag">Beauty • Care • Style</div>
            </div>
          </div>
          <div className="nav-menu">{navItems.map((item) => <a href="#" key={item}>{item}</a>)}</div>
          <div className="nav-actions">
            <button className="cart-btn" aria-label="Giỏ hàng">🛒</button>
            <button className="primary-btn">Đặt lịch hẹn ngay</button>
          </div>
        </div>
      </nav>

      <main>
        <section className="hero container">
          <div className="hero-copy">
            <span className="eyebrow">Nơi làm đẹp chuẩn phong cách riêng bạn</span>
            <h1>Khôi phục mái tóc khỏe đẹp, tự tin tỏa sáng mỗi ngày.</h1>
            <p>Salon Blue mang đến dịch vụ uốn nhuộm, duỗi tóc, cắt tạo kiểu và chăm sóc chuyên sâu với đội ngũ kỹ thuật viên giàu kinh nghiệm.</p>
            <div className="hero-actions">
              <button className="primary-btn large">Book ngay</button>
              <button className="secondary-btn">Xem dịch vụ</button>
            </div>
            <div className="hero-points">
              <div><strong>10k+</strong><span>Khách hàng tin tưởng</span></div>
              <div><strong>8+</strong><span>Năm kinh nghiệm</span></div>
              <div><strong>4.9/5</strong><span>Đánh giá khách hàng</span></div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="visual-card main-card">
              <img src="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80" alt="Khách hàng salon" />
            </div>
            <div className="floating-badge badge-top">Spa + Style</div>
            <div className="floating-badge badge-bottom">Ưu đãi 15%</div>
          </div>
        </section>

        <section className="promo container">
          {promoItems.map((item) => (
            <article key={item.title} className={`promo-card ${item.accent}`}>
              <span className="promo-tag">Khuyến mãi</span>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
              <a href="#">Tìm hiểu thêm</a>
            </article>
          ))}
        </section>

        <section className="strengths container section-space">
          <div className="section-head">
            <span className="eyebrow">Vì sao chọn Salon Blue</span>
            <h2>Thế mạnh của thương hiệu</h2>
          </div>
          <div className="strength-grid">
            <div className="strength-item"><div className="icon-box">✦</div><h3>Kinh nghiệm 8+ năm</h3><p>Thành thạo nhiều kỹ thuật nhuộm uốn, tạo kiểu phù hợp với từng khách hàng.</p></div>
            <div className="strength-item"><div className="icon-box">✦</div><h3>Đội ngũ chuyên nghiệp</h3><p>Stylist được đào tạo bài bản với phong cách làm việc tỉ mỉ và tận tâm.</p></div>
            <div className="strength-item"><div className="icon-box">✦</div><h3>Chất lượng sản phẩm</h3><p>Sử dụng nguyên liệu nhập khẩu, an toàn cho tóc và làn da đầu.</p></div>
          </div>
        </section>

        <section className="services container section-space">
          <div className="section-head">
            <span className="eyebrow">Dịch vụ nổi bật</span>
            <h2>Khám phá dịch vụ làm đẹp</h2>
          </div>
          <div className="service-grid">
            {services.map((service) => (
              <article key={service.title} className="service-card">
                <img src={service.image} alt={service.title} />
                <div className="service-content">
                  <h3>{service.title}</h3>
                  <button className="secondary-btn small">Đặt lịch</button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="advisor container section-space">
          <div className="section-head">
            <span className="eyebrow">Tư vấn kiểu tóc</span>
            <h2>Chọn phong cách phù hợp với dáng mặt</h2>
          </div>
          <div className="advisor-slider">
            {styles.map((style, index) => (
              <article key={style.name} className={`style-card ${index === 0 ? 'active' : ''}`}>
                <div className="style-visual"><img src="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80" alt={style.name} /></div>
                <div className="style-copy">
                  <span className="style-label">Gợi ý {index + 1}</span>
                  <h3>{style.name}</h3>
                  <p>{style.tone}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="hours container section-space">
          <div className="section-head">
            <span className="eyebrow">Giờ làm việc</span>
            <h2>Lịch làm việc linh hoạt</h2>
          </div>
          <div className="hours-table-wrap">
            <table className="hours-table">
              <thead><tr><th>Ngày</th><th>Ca sáng</th><th>Ca chiều</th></tr></thead>
              <tbody>
                {hours.map(([day, morning, evening]) => <tr key={day}><td>{day}</td><td>{morning}</td><td>{evening}</td></tr>)}
              </tbody>
            </table>
          </div>
        </section>

        <section className="blog container section-space">
          <div className="section-head">
            <span className="eyebrow">Tin tức & blog</span>
            <h2>Chia sẻ kinh nghiệm làm đẹp</h2>
          </div>
          <div className="blog-grid">
            {blogPosts.map((post) => (
              <article key={post.title} className="blog-card">
                <img src={post.image} alt={post.title} />
                <div className="blog-body">
                  <span className="blog-meta">Beauty Tips</span>
                  <h3>{post.title}</h3>
                  <p>{post.text}</p>
                  <a href="#">Đọc thêm</a>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="container footer-grid">
          <div>
            <div className="brand-wrap footer-brand">
              <div className="brand-mark">SB</div>
              <div><div className="brand-name">Salon Blue</div></div>
            </div>
            <p>Chuyên chăm sóc tóc, spa đầu & kiểu tóc cá nhân hóa cho nữ giới hiện đại.</p>
          </div>
          <div>
            <h4>Liên hệ</h4>
            <ul>
              <li>Hotline: 090 123 4567</li>
              <li>Email: hello@salonblue.com</li>
              <li>Địa chỉ: 58 Nguyễn Huệ, Q1, TP.HCM</li>
            </ul>
          </div>
          <div>
            <h4>Google Maps</h4>
            <div className="map-box"><iframe title="Salon Blue map" src="https://www.google.com/maps?q=58%20Nguyen%20Hue%20District%201%20Ho%20Chi%20Minh&t=&z=13&ie=UTF8&iwloc=&output=embed" loading="lazy" referrerPolicy="no-referrer-when-downgrade"></iframe></div>
          </div>
          <div>
            <h4>Fanpage Facebook</h4>
            <div className="facebook-box"><a href="#">Salon Blue - Beauty Studio</a></div>
          </div>
        </div>
        <div className="copyright">© 2026 Salon Blue. All rights reserved.</div>
      </footer>
    </div>
  );
}

export default App;





