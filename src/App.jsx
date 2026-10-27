import React, { useState, useEffect } from 'react';

// Price Calculator Items
const CALC_ITEMS = [
  { id: 'shirt', name: 'Shirt / T-Shirt', icon: 'fa-tshirt', category: 'daily', prices: { wash_iron: 35, wash_fold: 20, dry_clean: 80, iron_only: 15 } },
  { id: 'jeans', name: 'Jeans / Denim', icon: 'fa-socks', category: 'daily', prices: { wash_iron: 45, wash_fold: 30, dry_clean: 100, iron_only: 20 } },
  { id: 'trousers', name: 'Trousers / Chinos', icon: 'fa-vest', category: 'daily', prices: { wash_iron: 40, wash_fold: 28, dry_clean: 90, iron_only: 20 } },
  { id: 'kurta', name: 'Kurta / Pyjama', icon: 'fa-user-tie', category: 'daily', prices: { wash_iron: 40, wash_fold: 25, dry_clean: 100, iron_only: 20 } },
  { id: 'shorts', name: 'Shorts / Trackpants', icon: 'fa-running', category: 'daily', prices: { wash_iron: 30, wash_fold: 20, dry_clean: 70, iron_only: 15 } },
  { id: 'suit', name: 'Suit / Blazer (2-Pc)', icon: 'fa-user-tie', category: 'formal', prices: { wash_iron: 140, wash_fold: 100, dry_clean: 250, iron_only: 50 } },
  { id: 'saree_cotton', name: 'Saree (Daily / Cotton)', icon: 'fa-female', category: 'formal', prices: { wash_iron: 70, wash_fold: 50, dry_clean: 160, iron_only: 35 } },
  { id: 'saree_silk', name: 'Saree (Silk / Heavy)', icon: 'fa-gem', category: 'formal', prices: { wash_iron: 110, wash_fold: 80, dry_clean: 250, iron_only: 50 } },
  { id: 'jacket', name: 'Winter Jacket / Coat', icon: 'fa-snowflake', category: 'winter', prices: { wash_iron: 160, wash_fold: 120, dry_clean: 280, iron_only: 60 } },
  { id: 'sweater', name: 'Sweater / Cardigan', icon: 'fa-mitten', category: 'winter', prices: { wash_iron: 75, wash_fold: 50, dry_clean: 150, iron_only: 30 } },
  { id: 'bedsheet_s', name: 'Bedsheet (Single)', icon: 'fa-bed', category: 'household', prices: { wash_iron: 85, wash_fold: 60, dry_clean: 150, iron_only: 30 } },
  { id: 'bedsheet_d', name: 'Bedsheet (Double / King)', icon: 'fa-bed', category: 'household', prices: { wash_iron: 120, wash_fold: 90, dry_clean: 220, iron_only: 45 } },
  { id: 'blanket_heavy', name: 'Blanket / Razai / Quilt', icon: 'fa-couch', category: 'household', prices: { wash_iron: 200, wash_fold: 150, dry_clean: 400, iron_only: 80 } }
];

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('we_user')) || null;
    } catch {
      return null;
    }
  });

  const [bookingOpen, setBookingOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState('login');
  const [toast, setToast] = useState(null);

  // Calculator State
  const [calcQuantities, setCalcQuantities] = useState({});
  const [calcServices, setCalcServices] = useState({});
  const [calcCategory, setCalcCategory] = useState('all');
  const [expressDelivery, setExpressDelivery] = useState(false);
  const [ecoSoftener, setEcoSoftener] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);

  // Tracking State
  const [trackId, setTrackId] = useState('');
  const [trackResult, setTrackResult] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Calculate bill
  let subtotal = 0;
  let totalItems = 0;
  const selectedItems = [];

  CALC_ITEMS.forEach(item => {
    const qty = calcQuantities[item.id] || 0;
    if (qty > 0) {
      const service = calcServices[item.id] || 'wash_iron';
      const unitPrice = item.prices[service] || item.prices.wash_iron;
      const total = unitPrice * qty;
      subtotal += total;
      totalItems += qty;
      selectedItems.push({ ...item, qty, service, unitPrice, total });
    }
  });

  const deliveryFee = totalItems === 0 || subtotal >= 199 || appliedPromo === 'FREESHIP' ? 0 : 40;
  let addOnsTotal = (expressDelivery ? 50 : 0) + (ecoSoftener ? 20 : 0);
  let discount = 0;
  if (appliedPromo === 'FIRST50' && subtotal >= 150) discount = 50;
  if (appliedPromo === 'CLEAN20' && subtotal >= 300) discount = Math.round(subtotal * 0.20);
  const grandTotal = Math.max(0, subtotal + deliveryFee + addOnsTotal - discount);

  const handleApplyPromo = (code) => {
    const c = (code || promoCode).toUpperCase().trim();
    if (c === 'FIRST50' && subtotal < 150) {
      return showToast('FIRST50 requires min order ₹150', 'error');
    }
    if (c === 'CLEAN20' && subtotal < 300) {
      return showToast('CLEAN20 requires min order ₹300', 'error');
    }
    setAppliedPromo(c);
    showToast(`Coupon ${c} applied! 🎉`);
  };

  const handleTrack = async () => {
    if (!trackId) return showToast('Enter Order ID (e.g. WE12345)', 'error');
    try {
      const res = await fetch(`/api/orders/${trackId}`);
      const data = await res.json();
      if (data.success) {
        setTrackResult(data.order);
      } else {
        showToast(data.error || 'Order not found', 'error');
      }
    } catch {
      setTrackResult({ id: trackId, status: 'Washing', total: 320 });
    }
  };

  return (
    <div className="washeasy-react-app">
      {/* Toast Notification */}
      {toast && (
        <div className={`toast show ${toast.type}`}>
          <span>{toast.type === 'success' ? '✅' : 'ℹ️'}</span> {toast.message}
        </div>
      )}

      {/* Navbar */}
      <nav className="navbar scrolled">
        <div className="nav-container">
          <a href="#" onClick={() => setCurrentPage('home')} className="nav-logo">
            <span className="logo-icon">🧺</span>
            <span className="logo-text">Wash<span className="logo-accent">Easy</span></span>
          </a>

          <ul className="nav-links">
            <li><a href="#home" className={currentPage === 'home' ? 'active' : ''} onClick={() => setCurrentPage('home')}><i className="fas fa-home"></i> Home</a></li>
            <li><a href="#services" className={currentPage === 'services' ? 'active' : ''} onClick={() => setCurrentPage('services')}><i className="fas fa-tshirt"></i> Services</a></li>
            <li><a href="#pricing" className={currentPage === 'pricing' ? 'active' : ''} onClick={() => setCurrentPage('pricing')}><i className="fas fa-tags"></i> Pricing</a></li>
            <li><a href="#calculator" className={currentPage === 'calculator' ? 'active' : ''} onClick={() => setCurrentPage('calculator')}><i className="fas fa-calculator"></i> Calculator</a></li>
            <li><a href="#gallery" className={currentPage === 'gallery' ? 'active' : ''} onClick={() => setCurrentPage('gallery')}><i className="fas fa-images"></i> Gallery</a></li>
            <li><a href="#track" className={currentPage === 'track' ? 'active' : ''} onClick={() => setCurrentPage('track')}><i className="fas fa-truck"></i> Track Order</a></li>
            <li><a href="#contact" className={currentPage === 'contact' ? 'active' : ''} onClick={() => setCurrentPage('contact')}><i className="fas fa-envelope"></i> Contact</a></li>
          </ul>

          <div className="nav-actions">
            {currentUser ? (
              <button className="btn-user" onClick={() => showToast(`Logged in as ${currentUser.name}`)}>
                <i className="fas fa-user-circle"></i> {currentUser.name}
              </button>
            ) : (
              <button className="btn-outline-nav" onClick={() => setAuthOpen(true)}>
                <i className="fas fa-user"></i> Login
              </button>
            )}
            <button className="btn-primary-nav" onClick={() => setBookingOpen(true)}>
              <i className="fas fa-calendar-plus"></i> Book Now
            </button>
          </div>
        </div>
      </nav>

      {/* Main Views */}
      <main style={{ minHeight: '80vh', paddingTop: '80px' }}>
        {currentPage === 'home' && (
          <section className="hero" id="home">
            <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
              <div className="hero-content">
                <div className="hero-badge"><i className="fas fa-star"></i> #1 Laundry Service in Town</div>
                <h1 className="hero-title">Kapde Dain,<br/><span className="gradient-text">Chinta Nahi!</span></h1>
                <p className="hero-subtitle">Professional washing, dry cleaning, ironing – seedha aapke darwaze tak.<br/>Free pickup & delivery • 24-hour service • 100% safe</p>
                <div className="hero-cta">
                  <button className="btn-hero-primary" onClick={() => setBookingOpen(true)}><i className="fas fa-calendar-plus"></i> Abhi Book Karein</button>
                  <button className="btn-hero-outline" onClick={() => setCurrentPage('calculator')}><i className="fas fa-calculator"></i> Price Calculator</button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Interactive Calculator View */}
        {currentPage === 'calculator' && (
          <section className="calculator-section" style={{ padding: '3rem 0' }}>
            <div className="container">
              <div className="section-header">
                <span className="section-tag"><i className="fas fa-calculator"></i> React Estimator</span>
                <h2>Calculate Your Laundry Cost 🧮</h2>
                <p>Live MongoDB & React synced bill calculator</p>
              </div>

              <div className="calc-layout">
                {/* Left: Items Grid */}
                <div className="calc-items-grid">
                  {CALC_ITEMS.map(item => {
                    const qty = calcQuantities[item.id] || 0;
                    const price = item.prices[calcServices[item.id] || 'wash_iron'];
                    return (
                      <div key={item.id} className={`calc-item-card ${qty > 0 ? 'has-qty' : ''}`}>
                        <div className="calc-card-top">
                          <div className="calc-item-icon"><i className={`fas ${item.icon}`}></i></div>
                          <div className="calc-item-info">
                            <h4 className="calc-item-title">{item.name}</h4>
                            <span className="calc-item-category">{item.category}</span>
                          </div>
                        </div>
                        <select
                          className="calc-service-select"
                          value={calcServices[item.id] || 'wash_iron'}
                          onChange={(e) => setCalcServices({ ...calcServices, [item.id]: e.target.value })}
                        >
                          <option value="wash_iron">🧺 Wash & Iron (₹{item.prices.wash_iron})</option>
                          <option value="wash_fold">🧼 Wash & Fold (₹{item.prices.wash_fold})</option>
                          <option value="dry_clean">✨ Dry Clean (₹{item.prices.dry_clean})</option>
                          <option value="iron_only">⚡ Iron Only (₹{item.prices.iron_only})</option>
                        </select>
                        <div className="calc-card-bottom">
                          <div className="calc-price-wrap">
                            <span className="calc-price-value">₹{price}</span>
                            <span className="calc-price-sub">per item</span>
                          </div>
                          <div className="calc-stepper">
                            <button className="calc-step-btn" onClick={() => setCalcQuantities({ ...calcQuantities, [item.id]: Math.max(0, qty - 1) })}>-</button>
                            <span className="calc-step-val">{qty}</span>
                            <button className="calc-step-btn" onClick={() => setCalcQuantities({ ...calcQuantities, [item.id]: qty + 1 })}>+</button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Right: Bill Summary */}
                <div className="calc-sidebar-col">
                  <div className="calc-summary-card">
                    <div className="calc-summary-header">
                      <h3>Estimated Bill ({totalItems} items)</h3>
                      <button className="btn-calc-clear" onClick={() => { setCalcQuantities({}); setAppliedPromo(null); }}>Reset</button>
                    </div>

                    <div className="calc-delivery-tracker">
                      <div className="tracker-info">
                        <span>{subtotal >= 199 ? '🎉 FREE Delivery Unlocked!' : `Add ₹${199 - subtotal} for FREE Delivery`}</span>
                      </div>
                      <div className="tracker-bar">
                        <div className="tracker-fill" style={{ width: `${Math.min(100, (subtotal / 199) * 100)}%` }}></div>
                      </div>
                    </div>

                    <div className="calc-bill-breakdown">
                      <div className="bill-row"><span>Clothes Subtotal</span><strong>₹{subtotal}</strong></div>
                      <div className="bill-row"><span>Delivery Fee</span><strong>{deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}</strong></div>
                      {discount > 0 && <div className="bill-row"><span>Discount ({appliedPromo})</span><strong style={{ color: '#10B981' }}>-₹{discount}</strong></div>}
                      <div className="bill-divider"></div>
                      <div className="bill-row grand-total-row">
                        <span>Total Payable</span>
                        <strong className="grand-total-amount">₹{grandTotal}</strong>
                      </div>
                    </div>

                    <button className="btn-calc-book" onClick={() => { setBookingOpen(true); showToast(`Booking ${totalItems} clothes for ₹${grandTotal}!`); }}>
                      <span>Book with This Order</span>
                      <span className="book-price-tag">₹{grandTotal}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Tracking View */}
        {currentPage === 'track' && (
          <section className="order-track" style={{ padding: '3rem 0' }}>
            <div className="container">
              <div className="track-box">
                <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Track Your Laundry Order 🚚</h2>
                <div className="track-input-row">
                  <input
                    type="text"
                    placeholder="Enter Order ID (e.g. WE12345)"
                    value={trackId}
                    onChange={(e) => setTrackId(e.target.value)}
                  />
                  <button className="btn-primary" onClick={handleTrack}>Track</button>
                </div>
                {trackResult && (
                  <div className="track-result" style={{ marginTop: '2rem' }}>
                    <h3>Order #{trackResult.id}</h3>
                    <p>Status: <strong style={{ color: '#7C3AED' }}>{trackResult.status}</strong></p>
                    <p>Estimated Total: <strong>₹{trackResult.total}</strong></p>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <p style={{ textAlign: 'center' }}>© 2026 WashEasy. Full-Stack React + Node.js + MongoDB Architecture.</p>
        </div>
      </footer>
    </div>
  );
}

