// =====================================================
// WashEasy – Main JavaScript
// =====================================================

// -------- State --------
let currentUser = null;
let selectedService = null;
let selectedPrice = 0;
let orders = JSON.parse(localStorage.getItem('we_orders') || '[]');
let currentStep = 1;
let currentCalculatorOrder = null;

// -------- App Initialization --------
function initApp() {
  const preloader = document.getElementById('preloader');
  if (preloader) preloader.remove();

  // Check stored login
  const stored = localStorage.getItem('we_user');
  if (stored) {
    try {
      currentUser = JSON.parse(stored);
      updateAuthUI();
    } catch (e) {}
  }

  // Set min date for booking
  const today = new Date().toISOString().split('T')[0];
  const dateInput = document.getElementById('book-date');
  if (dateInput) dateInput.min = today;

  // Init scroll events
  window.addEventListener('scroll', handleScroll);

  // Animate sections on scroll
  initIntersectionObserver();

  // Initialize Price Calculator
  if (typeof initPriceCalculator === 'function') {
    initPriceCalculator();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
window.addEventListener('load', () => {
  const p = document.getElementById('preloader');
  if (p) p.remove();
});

// -------- Scroll Handling --------
function handleScroll() {
  const navbar = document.getElementById('navbar');
  const scrollTop = document.getElementById('scroll-top');
  const scrollY = window.scrollY;

  if (navbar) navbar.classList.toggle('scrolled', scrollY > 80);
  if (scrollTop) scrollTop.classList.toggle('visible', scrollY > 400);
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// -------- Intersection Observer for Animations --------
function initIntersectionObserver() {
  const items = document.querySelectorAll('.step-card, .service-card, .review-card, .pricing-card, .offer-card, .gallery-item');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.animationPlayState = 'running';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  items.forEach(item => {
    item.style.animationPlayState = 'paused';
    observer.observe(item);
  });
}

// -------- Toast Notification --------
function showToast(message, type = 'success') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
  toast.innerHTML = `<span>${icon}</span> ${message}`;
  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 3500);
}

// -------- Auth Functions --------
function openAuth() {
  document.getElementById('auth-modal').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function switchAuth(type) {
  const loginForm = document.getElementById('login-form');
  const signupForm = document.getElementById('signup-form');
  const tabLogin = document.getElementById('tab-login');
  const tabSignup = document.getElementById('tab-signup');

  if (type === 'login') {
    loginForm.classList.remove('hidden');
    signupForm.classList.add('hidden');
    tabLogin.classList.add('active');
    tabSignup.classList.remove('active');
  } else {
    loginForm.classList.add('hidden');
    signupForm.classList.remove('hidden');
    tabLogin.classList.remove('active');
    tabSignup.classList.add('active');
  }
}

function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const pass = document.getElementById('login-pass').value;

  if (!email || !pass) {
    showToast('Please fill all fields!', 'error');
    return;
  }

  // Simulate login
  currentUser = { email, name: email.split('@')[0], phone: '' };
  localStorage.setItem('we_user', JSON.stringify(currentUser));
  updateAuthUI();
  closeModal('auth-modal');
  showToast(`Welcome back, ${currentUser.name}! 👋`);
}

function handleSignup(e) {
  e.preventDefault();
  const name = document.getElementById('signup-name').value;
  const phone = document.getElementById('signup-phone').value;
  const email = document.getElementById('signup-email').value;
  const pass = document.getElementById('signup-pass').value;

  if (!name || !phone || !email || !pass) {
    showToast('Please fill all fields!', 'error');
    return;
  }

  currentUser = { name, phone, email };
  localStorage.setItem('we_user', JSON.stringify(currentUser));
  updateAuthUI();
  closeModal('auth-modal');
  showToast(`Welcome to WashEasy, ${name}! 🎉`);
}

function updateAuthUI() {
  const loginBtn = document.getElementById('login-btn');
  const userMenu = document.getElementById('user-menu');
  const userName = document.getElementById('user-name-display');

  if (currentUser) {
    if (loginBtn) loginBtn.classList.add('hidden');
    if (userMenu) userMenu.classList.remove('hidden');
    if (userName) userName.textContent = currentUser.name;
  } else {
    if (loginBtn) loginBtn.classList.remove('hidden');
    if (userMenu) userMenu.classList.add('hidden');
  }
}

function toggleUserDropdown() {
  const dropdown = document.getElementById('user-dropdown');
  if (dropdown) dropdown.classList.toggle('hidden');
}

function showOrders() {
  const dropdown = document.getElementById('user-dropdown');
  if (dropdown) dropdown.classList.add('hidden');

  if (!orders.length) {
    showToast('Aapka koi order nahi hai abhi.', 'info');
    return;
  }

  const lastOrder = orders[orders.length - 1];
  const itemsText = lastOrder.calcDetails ? ` (${lastOrder.calcDetails.itemCount} items – ₹${lastOrder.total})` : ` (₹${lastOrder.total || 0})`;
  showToast(`Last order: #${lastOrder.id} – ${lastOrder.service}${itemsText} [${lastOrder.status}]`, 'success');
}

function logout() {
  currentUser = null;
  localStorage.removeItem('we_user');
  updateAuthUI();
  const dropdown = document.getElementById('user-dropdown');
  if (dropdown) dropdown.classList.add('hidden');
  showToast('Aap logout ho gaye! 👋');
}

// -------- Booking Functions --------
function openBooking(serviceName = null, price = null) {
  currentCalculatorOrder = null;
  const calcBreakdown = document.getElementById('s-calc-breakdown');
  if (calcBreakdown) calcBreakdown.classList.add('hidden');

  if (serviceName) {
    selectedService = serviceName;
    selectedPrice = price || 50;
    // Highlight matching card if present
    document.querySelectorAll('.service-select-card').forEach(c => {
      const h4 = c.querySelector('h4');
      if (h4 && h4.textContent.trim().toLowerCase() === serviceName.toLowerCase()) {
        c.classList.add('selected');
      } else {
        c.classList.remove('selected');
      }
    });
  } else {
    selectedService = null;
    selectedPrice = 0;
    document.querySelectorAll('.service-select-card').forEach(c => c.classList.remove('selected'));
  }

  currentStep = 1;
  updateBookingSteps();
  document.getElementById('booking-modal').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function selectService(el, name, price) {
  document.querySelectorAll('.service-select-card').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  selectedService = name;
  selectedPrice = price;
  currentCalculatorOrder = null;
}

function goToStep(step) {
  if (step === 2) {
    if (!selectedService) {
      showToast('Pehle ek service chuniye!', 'error');
      return;
    }
  }
  if (step === 3) {
    const date = document.getElementById('book-date').value;
    const addr = document.getElementById('book-address').value;
    const phone = document.getElementById('book-phone').value;
    if (!date || !addr || !phone) {
      showToast('Sabhi fields fill karein!', 'error');
      return;
    }
    // Populate summary
    const qty = parseInt(document.getElementById('book-qty').value) || 1;
    const time = document.getElementById('book-time').value;

    document.getElementById('s-service').textContent = selectedService;
    document.getElementById('s-date').textContent = date;
    document.getElementById('s-time').textContent = time;
    document.getElementById('s-addr').textContent = addr;

    const calcBreakdown = document.getElementById('s-calc-breakdown');
    const calcItemsList = document.getElementById('s-calc-items-list');

    if (currentCalculatorOrder) {
      document.getElementById('s-qty').textContent = `${currentCalculatorOrder.itemCount} Items (Calculated)`;
      document.getElementById('s-total').textContent = `₹${currentCalculatorOrder.grandTotal.toLocaleString('en-IN')}`;
      if (calcBreakdown && calcItemsList) {
        calcBreakdown.classList.remove('hidden');
        calcItemsList.innerHTML = currentCalculatorOrder.items.map(item => `
          <div class="s-item-row">
            <span>${item.qty}x ${item.name} <small style="color:var(--primary); font-weight:700;">(${item.serviceLabel})</small></span>
            <strong>₹${item.totalPrice}</strong>
          </div>
        `).join('');

        const couponRow = document.getElementById('s-coupon-row');
        const couponDisc = document.getElementById('s-coupon-discount');
        if (couponRow && couponDisc) {
          if (currentCalculatorOrder.promoDiscount > 0) {
            couponRow.style.display = 'flex';
            couponDisc.textContent = `-₹${currentCalculatorOrder.promoDiscount}`;
          } else {
            couponRow.style.display = 'none';
          }
        }
      }
    } else {
      const total = selectedPrice * qty;
      document.getElementById('s-qty').textContent = qty;
      document.getElementById('s-total').textContent = `₹${total.toLocaleString('en-IN')}`;
      if (calcBreakdown) calcBreakdown.classList.add('hidden');
    }
  }
  currentStep = step;
  updateBookingSteps();
}

function updateBookingSteps() {
  for (let i = 1; i <= 3; i++) {
    const page = document.getElementById(`booking-step-${i}`);
    const stepEl = document.getElementById(`bstep-${i}`);
    if (page) page.classList.toggle('hidden', i !== currentStep);
    if (stepEl) {
      stepEl.classList.remove('active', 'done');
      if (i === currentStep) stepEl.classList.add('active');
      else if (i < currentStep) stepEl.classList.add('done');
    }
  }
}

function placeOrder() {
  const orderId = 'WE' + Math.floor(10000 + Math.random() * 90000);
  const payment = document.querySelector('input[name="payment"]:checked')?.value || 'cod';

  const finalTotal = currentCalculatorOrder
    ? currentCalculatorOrder.grandTotal
    : (selectedPrice * (parseInt(document.getElementById('book-qty').value) || 1));

  const finalQty = currentCalculatorOrder
    ? currentCalculatorOrder.itemCount
    : document.getElementById('book-qty').value;

  const order = {
    id: orderId,
    service: selectedService,
    qty: finalQty,
    date: document.getElementById('book-date').value,
    time: document.getElementById('book-time').value,
    address: document.getElementById('book-address').value,
    phone: document.getElementById('book-phone').value,
    payment,
    total: finalTotal,
    calcDetails: currentCalculatorOrder ? { ...currentCalculatorOrder } : null,
    status: 'Confirmed',
    placedAt: new Date().toISOString()
  };

  orders.push(order);
  localStorage.setItem('we_orders', JSON.stringify(orders));

  closeModal('booking-modal');

  // Show success
  document.getElementById('order-id').textContent = orderId;
  document.getElementById('track-status').textContent = 'Confirmed ✅';
  document.getElementById('success-modal').classList.remove('hidden');

  // Reset booking
  selectedService = null;
  selectedPrice = 0;
  currentCalculatorOrder = null;
  currentStep = 1;
  document.querySelectorAll('.service-select-card').forEach(c => c.classList.remove('selected'));
}

function closeSuccess() {
  closeModal('success-modal');
}

// -------- Order Tracking --------
function trackOrder() {
  const input = document.getElementById('track-input').value.trim().toUpperCase();
  const result = document.getElementById('track-result');

  if (!input) {
    showToast('Order ID likhein!', 'error');
    return;
  }

  // Find in local orders
  const found = orders.find(o => o.id === input);

  if (found || input.startsWith('WE')) {
    result.classList.remove('hidden');
    document.getElementById('tr-id').textContent = input;

    // Simulate status based on found order or random demo
    const statusMap = { 'Confirmed': 1, 'Picked Up': 2, 'Washing': 3, 'Packed': 4, 'Delivered': 5 };
    const status = found ? found.status : 'Washing';
    const doneSteps = statusMap[status] || 3;

    document.getElementById('tr-badge').textContent = status;

    for (let i = 1; i <= 5; i++) {
      const step = document.getElementById(`tl-${i}`);
      if (step) {
        step.classList.remove('done', 'active');
        if (i < doneSteps) step.classList.add('done');
        else if (i === doneSteps) step.classList.add('active');
      }
    }
    result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  } else {
    showToast('Order ID nahi mila. Sample: WE12345', 'error');
  }
}

// -------- Contact Form --------
function submitContact(e) {
  e.preventDefault();
  showToast('Aapka message send ho gaya! Hum jald hi contact karenge. 📩');
  e.target.reset();
}

// -------- Modal Close --------
function closeModal(id) {
  document.getElementById(id).classList.add('hidden');
  document.body.style.overflow = '';
}

// Close modals on overlay click
document.addEventListener('DOMContentLoaded', () => {
  ['auth-modal', 'booking-modal', 'success-modal'].forEach(id => {
    const modal = document.getElementById(id);
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal(id);
      });
    }
  });

  document.getElementById('close-auth')?.addEventListener('click', () => closeModal('auth-modal'));
  document.getElementById('close-booking')?.addEventListener('click', () => closeModal('booking-modal'));

  // Close user dropdown on outside click
  document.addEventListener('click', (e) => {
    const menu = document.getElementById('user-menu');
    const dropdown = document.getElementById('user-dropdown');
    if (menu && !menu.contains(e.target)) {
      dropdown?.classList.add('hidden');
    }
  });
});

// -------- Mobile Menu --------
function toggleMenu() {
  const navLinks = document.getElementById('nav-links');
  const hamburger = document.getElementById('hamburger');
  navLinks.classList.toggle('open');
  hamburger.classList.toggle('active');
  document.body.style.overflow = navLinks.classList.contains('open') ? 'hidden' : '';
}

// Close menu on nav link click (mobile)
document.querySelectorAll('.nav-links a').forEach(link => {
  link.addEventListener('click', () => {
    const navLinks = document.getElementById('nav-links');
    const hamburger = document.getElementById('hamburger');
    navLinks.classList.remove('open');
    hamburger.classList.remove('active');
    document.body.style.overflow = '';
  });
});

// -------- Smooth Active Nav on Scroll --------
window.addEventListener('scroll', () => {
  const sections = ['home', 'services', 'pricing', 'calculator', 'gallery', 'reviews', 'contact'];
  const navLinks = document.querySelectorAll('.nav-links a');
  let current = '';

  sections.forEach(id => {
    const section = document.getElementById(id);
    if (section && section.getBoundingClientRect().top < window.innerHeight / 2) {
      current = id;
    }
  });

  navLinks.forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('href') === `#${current}`) {
      link.classList.add('active');
    }
  });
});

// -------- Counter Animation --------
function animateCounters() {
  const counters = document.querySelectorAll('.stat strong');
  counters.forEach(counter => {
    const target = counter.textContent;
    const num = parseFloat(target.replace(/[^\d.]/g, ''));
    if (!num || counter.dataset.animated) return;
    counter.dataset.animated = true;

    let current = 0;
    const step = num / 60;
    const timer = setInterval(() => {
      current += step;
      if (current >= num) {
        counter.textContent = target;
        clearInterval(timer);
      } else {
        const formatted = target.includes(',')
          ? Math.floor(current).toLocaleString('en-IN') + '+'
          : target.includes('/')
            ? '₹' + Math.floor(current) + '/kg'
            : Math.floor(current) + ' hrs';
        counter.textContent = formatted;
      }
    }, 16);
  });
}

const heroObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => { if (entry.isIntersecting) animateCounters(); });
}, { threshold: 0.5 });
const heroStats = document.querySelector('.hero-stats');
if (heroStats) heroObserver.observe(heroStats);

// -------- Gallery Lightbox --------
function openLightbox(src, alt) {
  const lb = document.getElementById('gallery-lightbox');
  const img = document.getElementById('lightbox-img');
  if (!lb || !img) return;
  img.src = src;
  img.alt = alt || 'Gallery image';
  lb.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  const lb = document.getElementById('gallery-lightbox');
  if (lb) lb.classList.add('hidden');
  document.body.style.overflow = '';
}

// Wire up gallery photo cards to the lightbox
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.gallery-photo-card').forEach(card => {
    card.addEventListener('click', () => {
      const img = card.querySelector('.photo-ba-img');
      if (img) openLightbox(img.src, img.alt);
    });
  });

  // Close lightbox with Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeLightbox();
  });
});

// =====================================================
// INTERACTIVE LAUNDRY PRICE CALCULATOR
// =====================================================

const CALC_ITEMS = [
  // Daily Wear
  { id: 'shirt', name: 'Shirt / T-Shirt', icon: 'fa-tshirt', category: 'daily', prices: { wash_iron: 35, wash_fold: 20, dry_clean: 80, iron_only: 15 } },
  { id: 'jeans', name: 'Jeans / Denim', icon: 'fa-socks', category: 'daily', prices: { wash_iron: 45, wash_fold: 30, dry_clean: 100, iron_only: 20 } },
  { id: 'trousers', name: 'Trousers / Chinos', icon: 'fa-vest', category: 'daily', prices: { wash_iron: 40, wash_fold: 28, dry_clean: 90, iron_only: 20 } },
  { id: 'kurta', name: 'Kurta / Pyjama', icon: 'fa-user-tie', category: 'daily', prices: { wash_iron: 40, wash_fold: 25, dry_clean: 100, iron_only: 20 } },
  { id: 'shorts', name: 'Shorts / Trackpants', icon: 'fa-running', category: 'daily', prices: { wash_iron: 30, wash_fold: 20, dry_clean: 70, iron_only: 15 } },
  
  // Formal & Ethnic
  { id: 'suit', name: 'Suit / Blazer (2-Pc)', icon: 'fa-user-tie', category: 'formal', prices: { wash_iron: 140, wash_fold: 100, dry_clean: 250, iron_only: 50 } },
  { id: 'saree_cotton', name: 'Saree (Daily / Cotton)', icon: 'fa-female', category: 'formal', prices: { wash_iron: 70, wash_fold: 50, dry_clean: 160, iron_only: 35 } },
  { id: 'saree_silk', name: 'Saree (Silk / Heavy)', icon: 'fa-gem', category: 'formal', prices: { wash_iron: 110, wash_fold: 80, dry_clean: 250, iron_only: 50 } },
  { id: 'dress', name: 'Dress / Anarkali / Gown', icon: 'fa-spa', category: 'formal', prices: { wash_iron: 100, wash_fold: 70, dry_clean: 220, iron_only: 45 } },
  { id: 'sherwani', name: 'Sherwani / Indo-Western', icon: 'fa-crown', category: 'formal', prices: { wash_iron: 200, wash_fold: 150, dry_clean: 400, iron_only: 90 } },

  // Winter Wear
  { id: 'jacket', name: 'Winter Jacket / Coat', icon: 'fa-snowflake', category: 'winter', prices: { wash_iron: 160, wash_fold: 120, dry_clean: 280, iron_only: 60 } },
  { id: 'sweater', name: 'Sweater / Cardigan', icon: 'fa-mitten', category: 'winter', prices: { wash_iron: 75, wash_fold: 50, dry_clean: 150, iron_only: 30 } },
  { id: 'hoodie', name: 'Hoodie / Sweatshirt', icon: 'fa-vest-patches', category: 'winter', prices: { wash_iron: 65, wash_fold: 45, dry_clean: 130, iron_only: 25 } },
  { id: 'shawl', name: 'Shawl / Pashmina Stole', icon: 'fa-ribbon', category: 'winter', prices: { wash_iron: 70, wash_fold: 50, dry_clean: 180, iron_only: 35 } },

  // Bedding & Household
  { id: 'bedsheet_s', name: 'Bedsheet (Single)', icon: 'fa-bed', category: 'household', prices: { wash_iron: 85, wash_fold: 60, dry_clean: 150, iron_only: 30 } },
  { id: 'bedsheet_d', name: 'Bedsheet (Double / King)', icon: 'fa-bed', category: 'household', prices: { wash_iron: 120, wash_fold: 90, dry_clean: 220, iron_only: 45 } },
  { id: 'blanket_heavy', name: 'Blanket / Razai / Quilt', icon: 'fa-couch', category: 'household', prices: { wash_iron: 200, wash_fold: 150, dry_clean: 400, iron_only: 80 } },
  { id: 'curtain', name: 'Curtain (Per Panel)', icon: 'fa-door-closed', category: 'household', prices: { wash_iron: 110, wash_fold: 80, dry_clean: 200, iron_only: 40 } },
  { id: 'towel', name: 'Bath Towel / Bathrobe', icon: 'fa-bath', category: 'household', prices: { wash_iron: 35, wash_fold: 25, dry_clean: 80, iron_only: 15 } }
];

const SERVICE_LABELS = {
  wash_iron: 'Wash & Iron',
  wash_fold: 'Wash & Fold',
  dry_clean: 'Dry Clean',
  iron_only: 'Steam Iron Only'
};

// State
let calcCategory = 'all';
let calcSearchQuery = '';
let calcGlobalDefaultService = 'wash_iron';
let calcQuantities = {};
let calcItemServices = {};
let calcAppliedPromo = null;

function initPriceCalculator() {
  // Initialize default service for each item
  CALC_ITEMS.forEach(item => {
    if (!calcItemServices[item.id]) {
      calcItemServices[item.id] = calcGlobalDefaultService;
    }
  });

  renderCalcItems();
  calculateBill();
}

function renderCalcItems() {
  const grid = document.getElementById('calc-items-grid');
  const noItems = document.getElementById('calc-no-items');
  if (!grid) return;

  const query = calcSearchQuery.trim().toLowerCase();
  const filtered = CALC_ITEMS.filter(item => {
    const matchCategory = calcCategory === 'all' || item.category === calcCategory;
    const matchSearch = !query || item.name.toLowerCase().includes(query) || item.category.toLowerCase().includes(query);
    return matchCategory && matchSearch;
  });

  if (filtered.length === 0) {
    grid.innerHTML = '';
    if (noItems) noItems.classList.remove('hidden');
    return;
  }

  if (noItems) noItems.classList.add('hidden');

  grid.innerHTML = filtered.map(item => {
    const qty = calcQuantities[item.id] || 0;
    const service = calcItemServices[item.id] || calcGlobalDefaultService;
    const price = item.prices[service] || item.prices.wash_iron;
    const hasQtyClass = qty > 0 ? 'has-qty' : '';

    return `
      <div class="calc-item-card ${hasQtyClass}" id="calc-card-${item.id}">
        <div class="calc-card-top">
          <div class="calc-item-icon">
            <i class="fas ${item.icon}"></i>
          </div>
          <div class="calc-item-info">
            <h4 class="calc-item-title">${item.name}</h4>
            <span class="calc-item-category">${formatCategoryName(item.category)}</span>
          </div>
        </div>

        <select class="calc-service-select" onchange="changeItemService('${item.id}', this.value)" aria-label="Service for ${item.name}">
          <option value="wash_iron" ${service === 'wash_iron' ? 'selected' : ''}>🧺 Wash & Iron (₹${item.prices.wash_iron})</option>
          <option value="wash_fold" ${service === 'wash_fold' ? 'selected' : ''}>🧼 Wash & Fold (₹${item.prices.wash_fold})</option>
          <option value="dry_clean" ${service === 'dry_clean' ? 'selected' : ''}>✨ Dry Clean (₹${item.prices.dry_clean})</option>
          <option value="iron_only" ${service === 'iron_only' ? 'selected' : ''}>⚡ Iron Only (₹${item.prices.iron_only})</option>
        </select>

        <div class="calc-card-bottom">
          <div class="calc-price-wrap">
            <span class="calc-price-value" id="price-display-${item.id}">₹${price}</span>
            <span class="calc-price-sub">per item</span>
          </div>
          <div class="calc-stepper">
            <button class="calc-step-btn" onclick="adjustItemQty('${item.id}', -1)" aria-label="Decrease quantity">
              <i class="fas fa-minus"></i>
            </button>
            <span class="calc-step-val" id="qty-val-${item.id}">${qty}</span>
            <button class="calc-step-btn" onclick="adjustItemQty('${item.id}', 1)" aria-label="Increase quantity">
              <i class="fas fa-plus"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function formatCategoryName(cat) {
  const map = {
    daily: 'Daily Wear',
    formal: 'Formal & Ethnic',
    winter: 'Winter Care',
    household: 'Home & Bedding'
  };
  return map[cat] || cat;
}

function filterCalcCategory(cat) {
  calcCategory = cat;
  document.querySelectorAll('.calc-cat-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.category === cat);
  });
  renderCalcItems();
}

function filterCalcSearch(val) {
  calcSearchQuery = val;
  renderCalcItems();
}

function setGlobalDefaultService(serviceKey) {
  calcGlobalDefaultService = serviceKey;
  CALC_ITEMS.forEach(item => {
    // Only update items that currently haven't been customized or update all
    calcItemServices[item.id] = serviceKey;
  });
  renderCalcItems();
  calculateBill();
  showToast(`Default service changed to: ${SERVICE_LABELS[serviceKey]}`);
}

function changeItemService(itemId, newService) {
  calcItemServices[itemId] = newService;
  const item = CALC_ITEMS.find(i => i.id === itemId);
  if (item) {
    const priceEl = document.getElementById(`price-display-${itemId}`);
    if (priceEl) {
      priceEl.textContent = `₹${item.prices[newService]}`;
    }
  }
  calculateBill();
}

function adjustItemQty(itemId, delta) {
  const current = calcQuantities[itemId] || 0;
  const next = Math.max(0, current + delta);
  calcQuantities[itemId] = next;

  const qtyEl = document.getElementById(`qty-val-${itemId}`);
  if (qtyEl) qtyEl.textContent = next;

  const card = document.getElementById(`calc-card-${itemId}`);
  if (card) {
    card.classList.toggle('has-qty', next > 0);
  }

  calculateBill();
}

function calculateBill() {
  let subtotal = 0;
  let totalItems = 0;
  const selectedItemsData = [];

  CALC_ITEMS.forEach(item => {
    const qty = calcQuantities[item.id] || 0;
    if (qty > 0) {
      const service = calcItemServices[item.id] || calcGlobalDefaultService;
      const unitPrice = item.prices[service] || item.prices.wash_iron;
      const itemTotal = unitPrice * qty;

      subtotal += itemTotal;
      totalItems += qty;

      selectedItemsData.push({
        id: item.id,
        name: item.name,
        serviceKey: service,
        serviceLabel: SERVICE_LABELS[service] || 'Wash & Iron',
        unitPrice,
        qty,
        totalPrice: itemTotal
      });
    }
  });

  // Delivery calculation
  const freeThreshold = 199;
  let deliveryFee = 0;
  let isFreeDelivery = false;

  if (totalItems === 0) {
    deliveryFee = 0;
    isFreeDelivery = true;
  } else if (subtotal >= freeThreshold) {
    deliveryFee = 0;
    isFreeDelivery = true;
  } else {
    deliveryFee = 40;
    isFreeDelivery = false;
  }

  // Promo handling (FREESHIP)
  if (calcAppliedPromo && calcAppliedPromo.code === 'FREESHIP') {
    deliveryFee = 0;
    isFreeDelivery = true;
  }

  // Delivery Progress Bar
  const trackerFill = document.getElementById('tracker-fill');
  const trackerText = document.getElementById('tracker-text');
  if (trackerFill && trackerText) {
    if (totalItems === 0) {
      trackerFill.style.width = '0%';
      trackerText.innerHTML = `Add <strong>₹${freeThreshold}</strong> more for <strong>FREE Delivery</strong>`;
    } else if (subtotal >= freeThreshold) {
      trackerFill.style.width = '100%';
      trackerText.innerHTML = `🎉 Badhaai ho! <strong>FREE Delivery</strong> unlocked!`;
    } else {
      const remaining = freeThreshold - subtotal;
      const percent = Math.min(100, Math.round((subtotal / freeThreshold) * 100));
      trackerFill.style.width = `${percent}%`;
      trackerText.innerHTML = `Bas <strong>₹${remaining}</strong> aur add karein for <strong>FREE Delivery</strong>!`;
    }
  }

  // Add-ons
  const expressChecked = document.getElementById('calc-addon-express')?.checked || false;
  const softenerChecked = document.getElementById('calc-addon-softener')?.checked || false;
  let addonsTotal = 0;
  if (expressChecked) addonsTotal += 50;
  if (softenerChecked) addonsTotal += 20;

  // Promo discount calculation
  let promoDiscount = 0;
  if (calcAppliedPromo && totalItems > 0) {
    if (calcAppliedPromo.code === 'FIRST50') {
      if (subtotal >= 150) {
        promoDiscount = 50;
      } else {
        promoDiscount = 0;
      }
    } else if (calcAppliedPromo.code === 'CLEAN20') {
      if (subtotal >= 300) {
        promoDiscount = Math.min(120, Math.round(subtotal * 0.20));
      } else {
        promoDiscount = 0;
      }
    }
  }

  const grandTotal = Math.max(0, subtotal + deliveryFee + addonsTotal - promoDiscount);

  // Store in global calculator order state
  currentCalculatorOrder = {
    items: selectedItemsData,
    itemCount: totalItems,
    subtotal,
    deliveryFee,
    addonsTotal,
    addons: [
      ...(expressChecked ? ['12-Hour Express (+₹50)'] : []),
      ...(softenerChecked ? ['Eco Fabric Softener (+₹20)'] : [])
    ],
    promoCode: calcAppliedPromo ? calcAppliedPromo.code : null,
    promoDiscount,
    grandTotal
  };

  // Update DOM displays
  const itemCountEl = document.getElementById('calc-item-count');
  if (itemCountEl) itemCountEl.textContent = `${totalItems} ${totalItems === 1 ? 'item' : 'items'} added`;

  const subtotalEl = document.getElementById('bill-subtotal');
  if (subtotalEl) subtotalEl.textContent = `₹${subtotal.toLocaleString('en-IN')}`;

  const deliveryEl = document.getElementById('bill-delivery');
  if (deliveryEl) {
    if (isFreeDelivery || deliveryFee === 0) {
      deliveryEl.textContent = 'FREE';
      deliveryEl.className = 'text-accent3';
    } else {
      deliveryEl.textContent = `₹${deliveryFee}`;
      deliveryEl.className = '';
    }
  }

  const rowAddon = document.getElementById('row-addon-total');
  const billAddons = document.getElementById('bill-addons');
  if (rowAddon && billAddons) {
    if (addonsTotal > 0) {
      rowAddon.classList.remove('hidden');
      billAddons.textContent = `+₹${addonsTotal}`;
    } else {
      rowAddon.classList.add('hidden');
    }
  }

  const rowPromo = document.getElementById('row-promo-discount');
  const billDiscount = document.getElementById('bill-discount');
  const billCouponTag = document.getElementById('bill-coupon-tag');
  if (rowPromo && billDiscount && billCouponTag) {
    if (promoDiscount > 0) {
      rowPromo.classList.remove('hidden');
      billCouponTag.textContent = calcAppliedPromo.code;
      billDiscount.textContent = `-₹${promoDiscount}`;
    } else {
      rowPromo.classList.add('hidden');
    }
  }

  const grandTotalEl = document.getElementById('bill-grand-total');
  if (grandTotalEl) grandTotalEl.textContent = `₹${grandTotal.toLocaleString('en-IN')}`;

  const bookTag = document.getElementById('book-price-tag');
  if (bookTag) bookTag.textContent = `₹${grandTotal.toLocaleString('en-IN')}`;

  // Render selected items list
  renderSelectedList(selectedItemsData);
}

function renderSelectedList(items) {
  const listEl = document.getElementById('calc-selected-list');
  if (!listEl) return;

  if (items.length === 0) {
    listEl.innerHTML = `
      <div class="calc-empty-hint" id="calc-empty-hint">
        <div class="empty-basket-icon">🧺</div>
        <p>Aapka basket abhi khali hai.</p>
        <span>Items ke <strong>+</strong> button par click karein</span>
      </div>
    `;
    return;
  }

  listEl.innerHTML = items.map(item => `
    <div class="calc-selected-row">
      <div class="row-item-meta">
        <span class="row-item-name">${item.name}</span>
        <span class="row-item-service">${item.qty} × ${item.serviceLabel}</span>
      </div>
      <div class="row-item-actions">
        <span class="row-item-price">₹${item.totalPrice}</span>
        <button class="row-remove-btn" onclick="adjustItemQty('${item.id}', -${item.qty})" title="Remove item" aria-label="Remove ${item.name}">
          <i class="fas fa-times-circle"></i>
        </button>
      </div>
    </div>
  `).join('');
}

function applyPromoCode() {
  const input = document.getElementById('calc-promo-input');
  if (!input) return;
  const code = input.value.trim().toUpperCase();
  processPromoCode(code);
}

function applyQuickPromo(code) {
  const input = document.getElementById('calc-promo-input');
  if (input) input.value = code;
  processPromoCode(code);
}

function processPromoCode(code) {
  const feedback = document.getElementById('promo-feedback');
  if (!code) {
    showFeedback('Koi coupon code enter karein!', 'error');
    return;
  }

  const subtotal = currentCalculatorOrder ? currentCalculatorOrder.subtotal : 0;

  if (code === 'FIRST50') {
    if (subtotal < 150) {
      showFeedback('FIRST50 coupon ke liye minimum ₹150 ke clothes hone chahiye!', 'error');
      return;
    }
    calcAppliedPromo = { code: 'FIRST50', discount: 50 };
    showFeedback('Coupon FIRST50 apply ho gaya! ₹50 OFF mil gaya 🎉', 'success');
  } else if (code === 'CLEAN20') {
    if (subtotal < 300) {
      showFeedback('CLEAN20 coupon ke liye minimum ₹300 ke clothes hone chahiye!', 'error');
      return;
    }
    calcAppliedPromo = { code: 'CLEAN20', percent: 20 };
    showFeedback('Coupon CLEAN20 apply ho gaya! 20% OFF 🎉', 'success');
  } else if (code === 'FREESHIP') {
    calcAppliedPromo = { code: 'FREESHIP' };
    showFeedback('Coupon FREESHIP apply ho gaya! Delivery charge bilkul free 🎉', 'success');
  } else {
    showFeedback('Galat coupon code! Try FIRST50, CLEAN20 ya FREESHIP.', 'error');
    return;
  }

  calculateBill();
}

function showFeedback(msg, type) {
  const feedback = document.getElementById('promo-feedback');
  if (!feedback) return;
  feedback.textContent = msg;
  feedback.className = `promo-feedback ${type}`;
  feedback.classList.remove('hidden');
}

function resetCalculator() {
  calcQuantities = {};
  calcAppliedPromo = null;
  const promoInput = document.getElementById('calc-promo-input');
  if (promoInput) promoInput.value = '';
  const feedback = document.getElementById('promo-feedback');
  if (feedback) feedback.classList.add('hidden');

  const express = document.getElementById('calc-addon-express');
  if (express) express.checked = false;
  const softener = document.getElementById('calc-addon-softener');
  if (softener) softener.checked = false;

  renderCalcItems();
  calculateBill();
  showToast('Calculator reset ho gaya! 🧺');
}

function bookFromCalculator() {
  if (!currentCalculatorOrder || currentCalculatorOrder.itemCount === 0) {
    showToast('Pehle kuch kapde add karein! (+ button dabayein)', 'error');
    return;
  }

  selectedService = `Custom Laundry (${currentCalculatorOrder.itemCount} Items)`;
  selectedPrice = currentCalculatorOrder.grandTotal;

  // Jump directly to step 2 (scheduling)
  currentStep = 2;
  updateBookingSteps();
  document.getElementById('booking-modal').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  showToast(`Schedule karein aapka ₹${currentCalculatorOrder.grandTotal} ka laundry order! 🧺`);
}
