const DELIVERY_FEE = 1.50;
let cart = [];
let currentFilter = 'all';

// Setup Menu Filtering (Now reads directly from HTML)
document.getElementById('filterRow').addEventListener('click', (e) => {
  const btn = e.target.closest('.filter-btn');
  if(!btn) return;
  
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  currentFilter = btn.dataset.filter;
  
  const cards = document.querySelectorAll('.drink-card');
  cards.forEach(card => {
    if(currentFilter === 'all' || card.dataset.temp === currentFilter) {
      card.style.display = 'flex';
    } else {
      card.style.display = 'none';
    }
  });
});

// Setup Add to Cart Buttons
document.querySelectorAll('.add-btn').forEach(btn => {
  btn.addEventListener('click', (e) => handleAdd(e));
});

function handleAdd(e){
  const btn = e.currentTarget;
  // Read product details directly from the HTML data-attributes
  const id = btn.dataset.id;
  const name = btn.dataset.name;
  const price = parseFloat(btn.dataset.price);
  const image = btn.dataset.image;
  
  addToCart({ id, name, price, image });
  flyToCart(btn);
  
  const original = btn.innerHTML;
  btn.classList.add('added');
  btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M20 6L9 17l-5-5"/></svg> Added`;
  
  setTimeout(() => { 
    btn.classList.remove('added'); 
    btn.innerHTML = original; 
  }, 1100);
  
  showToast(`${name} added to your cup`);
}

function addToCart(item){
  const existing = cart.find(c => c.id === item.id);
  if(existing) existing.qty++;
  else cart.push({ ...item, qty: 1 });
  renderCart();
}

function changeQty(id, delta){
  const item = cart.find(c => c.id === id);
  if(!item) return;
  item.qty += delta;
  if(item.qty <= 0) cart = cart.filter(c => c.id !== id);
  renderCart();
}

function removeItem(id){
  cart = cart.filter(c => c.id !== id);
  renderCart();
}

function cartTotals(){
  const subtotal = cart.reduce((s, c) => s + (c.price * c.qty), 0);
  const fee = cart.length ? DELIVERY_FEE : 0;
  return { subtotal, fee, total: subtotal + fee };
}

const cartItemsEl = document.getElementById('cartItems');
const cartCountEl = document.getElementById('cartCount');
const checkoutBtn = document.getElementById('checkoutBtn');
const locNote = document.getElementById('locNote');

function renderCart(){
  const totalQty = cart.reduce((s, c) => s + c.qty, 0);
  cartCountEl.textContent = totalQty;
  cartCountEl.classList.toggle('show', totalQty > 0);

  if(cart.length === 0){
    cartItemsEl.innerHTML = `
      <div class="cart-empty">
        <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
        <p>Your cup is empty.<br>Add a drink from the menu.</p>
      </div>`;
  } else {
    cartItemsEl.innerHTML = cart.map(c => `
      <div class="cart-item">
        <div class="mini-cup">
            <img src="${c.image}" alt="${c.name}" />
        </div>
        <div class="ci-info">
          <div class="ci-top">
            <span class="ci-name">${c.name}</span>
            <span class="ci-price" style="color: var(--c-accent);">$${(c.price * c.qty).toFixed(2)}</span>
          </div>
          <div class="ci-controls">
            <button class="qty-btn" data-act="dec" data-id="${c.id}">−</button>
            <span class="qty-val">${c.qty}</span>
            <button class="qty-btn" data-act="inc" data-id="${c.id}">+</button>
            <button class="remove-link" data-act="rm" data-id="${c.id}">Remove</button>
          </div>
        </div>
      </div>`).join('');
  }

  const t = cartTotals();
  document.getElementById('sumSubtotal').textContent = '$' + t.subtotal.toFixed(2);
  document.getElementById('sumDelivery').textContent = cart.length ? '$' + t.fee.toFixed(2) : '$0.00';
  document.getElementById('sumTotal').textContent = '$' + t.total.toFixed(2);

  const ready = cart.length > 0 && deliveryLocation !== null;
  checkoutBtn.disabled = !ready;
  
  if(cart.length === 0) locNote.textContent = 'Add a drink and set your delivery location to check out.';
  else if(!deliveryLocation) locNote.textContent = 'Set your delivery location below to check out.';
  else locNote.textContent = 'Ready when you are.';
}

cartItemsEl.addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if(!btn) return;
  const id = btn.dataset.id;
  if(btn.dataset.act === 'inc') changeQty(id, 1);
  if(btn.dataset.act === 'dec') changeQty(id, -1);
  if(btn.dataset.act === 'rm') removeItem(id);
});

function flyToCart(sourceEl){
  const cartBtn = document.getElementById('cartBtn');
  const startRect = sourceEl.getBoundingClientRect();
  const endRect = cartBtn.getBoundingClientRect();
  const dot = document.createElement('div');
  
  dot.className = 'fly-dot';
  dot.style.left = (startRect.left + startRect.width/2 - 7) + 'px';
  dot.style.top = (startRect.top + startRect.height/2 - 7) + 'px';
  document.body.appendChild(dot);
  
  const dx = (endRect.left + endRect.width/2) - (startRect.left + startRect.width/2);
  const dy = (endRect.top + endRect.height/2) - (startRect.top + startRect.height/2);
  
  dot.animate([
    { transform: 'translate(0,0) scale(1)', opacity: 1 },
    { transform: `translate(${dx * 0.5}px, ${dy - 90}px) scale(1.2)`, opacity: 1, offset: 0.55 },
    { transform: `translate(${dx}px, ${dy}px) scale(0.3)`, opacity: 0.2 }
  ], { duration: 750, easing: 'cubic-bezier(.2,.8,.3,1)' }).onfinish = () => {
    dot.remove();
    cartBtn.animate([{transform:'scale(1)'},{transform:'scale(1.25)'},{transform:'scale(1)'}], {duration: 300});
  };
}

const cartDrawer = document.getElementById('cartDrawer');
const overlay = document.getElementById('overlay');

function openCart(){ 
    cartDrawer.classList.add('open'); 
    overlay.classList.add('show'); 
    document.body.style.overflow = 'hidden';
}
function closeCartFn(){ 
    cartDrawer.classList.remove('open'); 
    overlay.classList.remove('show'); 
    document.body.style.overflow = '';
}

document.getElementById('cartBtn').addEventListener('click', openCart);
document.getElementById('closeCart').addEventListener('click', closeCartFn);
overlay.addEventListener('click', closeCartFn);

let toastTimer;
function showToast(msg){
  const t = document.getElementById('toast');
  t.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M20 6L9 17l-5-5"/></svg> ${msg}`;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2500);
}

let deliveryLocation = null;
let marker = null;
let map;

if (typeof L !== 'undefined') {
  map = L.map('map', { zoomControl: true, attributionControl: false }).setView([13.4125, 103.8670], 6);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { maxZoom: 19, subdomains: 'abcd' }).addTo(map);

  function setMarker(lat, lng){
    if(marker) map.removeLayer(marker);
    const icon = L.divIcon({
      className: '',
      html: `<div style="width:28px;height:28px;border-radius:50% 50% 50% 0;background:var(--c-accent);border:3px solid #000;transform:rotate(-45deg);box-shadow:0 8px 16px rgba(0,0,0,0.6);"></div>`,
      iconSize: [28,28], iconAnchor: [14,28]
    });
    marker = L.marker([lat,lng], {icon, draggable: true}).addTo(map);
    marker.on('dragend', () => { const pos = marker.getLatLng(); setLocation(pos.lat, pos.lng); });
  }

  async function setLocation(lat, lng){
    deliveryLocation = { lat, lng };
    setMarker(lat, lng);
    map.setView([lat,lng], 15, { animate: true });
    document.getElementById('addressPreview').innerHTML = `<b>Locating address…</b>${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    renderCart();
    
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await res.json();
      const addr = data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      document.getElementById('addressPreview').innerHTML = `<b>Delivering to</b>${addr}`;
    } catch(err) {
      document.getElementById('addressPreview').innerHTML = `<b>Delivering to</b>Pinned location — ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    }
  }

  map.on('click', (e) => setLocation(e.latlng.lat, e.latlng.lng));
}

document.getElementById('locateBtn').addEventListener('click', () => {
  if(!navigator.geolocation) { showToast('Geolocation is not available'); return; }
  showToast('Locating your position…');
  navigator.geolocation.getCurrentPosition(
    pos => setLocation(pos.coords.latitude, pos.coords.longitude),
    err => showToast('Could not access your location.')
  );
});

document.getElementById('searchBtn').addEventListener('click', doAddressSearch);
document.getElementById('addrSearch').addEventListener('keydown', (e) => { if(e.key === 'Enter') doAddressSearch(); });

async function doAddressSearch(){
  const q = document.getElementById('addrSearch').value.trim();
  if(!q) return;
  showToast('Searching…');
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1`);
    const data = await res.json();
    if(data && data.length) setLocation(parseFloat(data[0].lat), parseFloat(data[0].lon));
    else showToast('No results found for that address.');
  } catch(err) {
    showToast('Search service unavailable.');
  }
}

const modalOverlay = document.getElementById('modalOverlay');
const modalBody = document.getElementById('modalBody');
let qrTimerInterval = null;

function openModal(){ modalOverlay.classList.add('show'); document.body.style.overflow = 'hidden'; }
function closeModal(){ modalOverlay.classList.remove('show'); document.body.style.overflow = ''; clearInterval(qrTimerInterval); }

modalOverlay.addEventListener('click', (e) => { if(e.target === modalOverlay) closeModal(); });

checkoutBtn.addEventListener('click', () => {
  if(checkoutBtn.disabled) return;
  closeCartFn();
  renderCheckout();
  openModal();
});

function renderCheckout(){
  const t = cartTotals();
  const orderId = 'EC-' + Math.floor(10000 + Math.random() * 89999);
  
  modalBody.innerHTML = `
    <button class="modal-close" onclick="closeModal()" aria-label="Close">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
    </button>
    <h3>Scan to pay</h3>
    <p class="sub">Order ${orderId} · securely routed to location</p>
    
    <div class="qr-box">
      <div class="qr-frame">
        <!-- 📱 PUT YOUR QR CODE IMAGE HERE 📱 -->
        <!-- Just change 'your-qr-code-image.jpg' to the name of your actual image file -->
        <img src="image-menu/qr-code.jpg" alt="Scan to Pay" style="width: 180px; height: 180px; object-fit: contain; display: block;" />
      </div>
      <div class="qr-amount">$${t.total.toFixed(2)}</div>
      <div class="qr-timer">Expires in <span id="qrClock">05:00</span></div>
      <div class="timer-bar"><div class="timer-fill" id="qrFill"></div></div>
    </div>
    
    <button class="pay-confirm-btn" id="confirmPayBtn">I've completed payment</button>
  `;

  let seconds = 300;
  const clockEl = document.getElementById('qrClock');
  const fillEl = document.getElementById('qrFill');
  
  clearInterval(qrTimerInterval);
  qrTimerInterval = setInterval(() => {
    seconds--;
    const m = String(Math.floor(seconds / 60)).padStart(2, '0');
    const s = String(seconds % 60).padStart(2, '0');
    clockEl.textContent = `${m}:${s}`;
    fillEl.style.width = (seconds / 300 * 100) + '%';
    
    if(seconds <= 0) { clearInterval(qrTimerInterval); showToast('QR code expired. Please restart checkout.'); closeModal(); }
  }, 1000);

  document.getElementById('confirmPayBtn').addEventListener('click', () => renderSuccess(orderId, t.total));
}

function renderSuccess(orderId, total){
  clearInterval(qrTimerInterval);
  const eta = 18 + Math.floor(Math.random() * 10);
  
  modalBody.innerHTML = `
    <div class="success-view">
      <div class="check-circle">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#8fae57" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
      </div>
      <h3>Payment Confirmed</h3>
      <p class="sub" style="margin-bottom:0;">We're pulling your espresso shots now.</p>
      
      <div class="order-id">Order ${orderId} · $${total.toFixed(2)}</div>
      
      <div class="eta-box">
        <div><b>${eta} – ${eta+6} min</b><span>Estimated delivery time</span></div>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--c-accent)" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
      </div>
      
      <button class="checkout-btn" onclick="finishOrder()" style="margin-top: 2rem;">Done</button>
    </div>
  `;
}

function finishOrder() {
  closeModal();
  cart = []; 
  renderCart();
  showToast('Order received! Check your delivery location shortly.');
}
// ប្រើ Intersection Observer ដើម្បីចាប់ទីតាំងពេល Scroll ដល់
  document.addEventListener("DOMContentLoaded", function() {
    
    // បង្កើត Observer
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        // បើ scroll មកដល់ (isIntersecting)
        if (entry.isIntersecting) {
          // បន្ថែម class 'is-visible' ដើម្បីឱ្យវាផុសឡើង
          entry.target.classList.add('is-visible');
          
          // បញ្ឈប់ការចាប់ទីតាំង (Unobserve) ដើម្បីឱ្យវាផុសតែម្តង កុំឱ្យលោតចុះលោតឡើងវិញពេល Scroll ទៅលើ
          observer.unobserve(entry.target);
        }
      });
    }, { 
      threshold: 0.1 // 0.1 មានន័យថាបង្ហាញចេញ 10% នៃទំហំរបស់វា ទើបចាប់ផ្តើមផុស
    });

    // ចាប់យកគ្រប់ elements ដែលមាន class 'fade-up-item' យកមកដាក់ក្នុង observer
    const fadeUpItems = document.querySelectorAll('.fade-up-item');
    fadeUpItems.forEach((item) => {
      observer.observe(item);
    });
    
  });
// Start rendering the cart on load
renderCart();