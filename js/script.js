// ============================================================
// CAKE TOWN BAKERY — main script
// ============================================================
const WA_NUMBER = "918899264105";

document.getElementById("year").textContent = new Date().getFullYear();

/* ---------------- MENU DATA ----------------
   Menu items load from data/menu.json so the shop owner can update
   prices/availability daily via the /admin panel (Decap CMS), without
   touching any code. A tiny hardcoded fallback is kept in case the
   JSON file can't be fetched (e.g. opening index.html directly by
   double-click instead of via a local/live server). */
let menuItems = [
  { name: "1 KG Cake", price: "₹620 onwards", cat: "cakes", img: "https://images.unsplash.com/photo-1571115177098-24ec42ed204d?q=80&w=600&auto=format&fit=crop", badge: "Best Seller", available: true },
];

const catLabels = {
  cakes: "Cakes", pastries: "Pastries", pizza: "Pizza", sandwiches: "Sandwiches",
  snacks: "Bakery Snacks", cupcakes: "Cupcakes", beverages: "Beverages",
  sweets: "Bakes & Sweets", party: "Party Pack",
  photocakes: "Photo Cakes", designercakes: "Designer Cakes", kidscakes: "Kids Theme Cakes",
  pinatacakes: "Piñata Cakes", fruitcakes: "Fresh Fruit Cakes", annivcakes: "Anniversary & Wedding"
};

const menuGrid = document.getElementById("menuGrid");
const noResults = document.getElementById("noResults");
let activeCat = "all";
let searchTerm = "";
let activeTier = "all";

/* Pull the first number out of a price string like "₹620 onwards" so
   the price-tier filter (Under ₹300/₹600/₹1000) can work even though
   prices are stored as free text (to allow "Custom Order" etc). */
function firstPriceNumber(priceStr){
  const match = String(priceStr).replace(/,/g, "").match(/\d+/);
  return match ? parseInt(match[0], 10) : null;
}

function matchesTier(item){
  if (activeTier === "all") return true;
  const n = firstPriceNumber(item.price);
  if (activeTier === "premium") return n === null || n >= 1000;
  if (n === null) return false;
  return n <= parseInt(activeTier, 10);
}

function starRow(rating, reviews){
  if (!rating) return "";
  const full = Math.round(rating);
  const stars = "★".repeat(full) + "☆".repeat(5 - full);
  return `<p class="rating"><span class="stars">${stars}</span> <span class="rating-num">${rating.toFixed ? rating.toFixed(1) : rating}</span>${reviews ? ` <span class="rating-count">(${reviews})</span>` : ""}</p>`;
}

function renderMenu(){
  const filtered = menuItems.filter(item => {
    const matchesCat = activeCat === "all" || item.cat === activeCat;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCat && matchesSearch && matchesTier(item);
  });

  menuGrid.innerHTML = filtered.map((item, idx) => {
    /* Every item can always be ordered — items not on the shelf right now are
       marked "Available on Order" rather than being blocked from purchase. */
    const onOrder = item.available === false;
    const safeId = `mi-${item.cat}-${idx}-${item.name.replace(/[^a-z0-9]/gi, "")}`;
    return `
    <div class="menu-card reveal in-view">
      <div class="img-wrap">
        <img src="${item.img}" alt="${item.name} — Cake Town Bakery" loading="lazy">
        <span class="cat-tag">${catLabels[item.cat]}</span>
        ${item.badge ? `<span class="best-badge">✦ ${item.badge}</span>` : ""}
        ${onOrder ? `<span class="stock-ribbon available-order">Available on Order</span>` : ""}
      </div>
      <div class="menu-card-body">
        <h4>${item.name}</h4>
        ${starRow(item.rating, item.reviews)}
        <p class="price">${item.price}</p>
        <button class="add-cart-btn" data-name="${item.name.replace(/"/g, "&quot;")}" data-price="${item.price.replace(/"/g, "&quot;")}" id="${safeId}">+ Add to Order</button>
        <a class="order-wa" target="_blank" rel="noopener"
           href="https://wa.me/${WA_NUMBER}?text=${encodeURIComponent("Hi Cake Town Bakery! I'd like to order: " + item.name)}">
           💬 Quick order on WhatsApp
        </a>
      </div>
    </div>
  `;
  }).join("");

  noResults.hidden = filtered.length !== 0;

  menuGrid.querySelectorAll(".add-cart-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      addToCart(btn.dataset.name, btn.dataset.price);
      btn.textContent = "✓ Added";
      setTimeout(() => { btn.textContent = "+ Add to Order"; }, 1200);
    });
  });
}

document.getElementById("menuSearch").addEventListener("input", (e) => {
  searchTerm = e.target.value;
  renderMenu();
});

function setActiveCat(cat){
  activeCat = cat;
  document.querySelectorAll(".filter-btn").forEach(b => b.classList.toggle("active", b.dataset.cat === cat));
  document.querySelectorAll(".quick-cat").forEach(b => b.classList.toggle("active", b.dataset.cat === cat));
  renderMenu();
}

document.querySelectorAll(".filter-btn").forEach(btn => {
  btn.addEventListener("click", () => setActiveCat(btn.dataset.cat));
});

document.querySelectorAll(".quick-cat").forEach(btn => {
  btn.addEventListener("click", () => {
    setActiveCat(btn.dataset.cat);
    document.getElementById("menu").scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

document.querySelectorAll(".price-tier-chip").forEach(chip => {
  chip.addEventListener("click", () => {
    document.querySelectorAll(".price-tier-chip").forEach(c => c.classList.remove("active"));
    chip.classList.add("active");
    activeTier = chip.dataset.tier;
    renderMenu();
  });
});

/* ---------------- CART (WhatsApp checkout) ----------------
   A lightweight cart — like the "+ ADD" pattern on other cake
   sites — but instead of online payment it builds one consolidated
   WhatsApp message so the owner can confirm final pricing & delivery. */
let cart = []; // { name, price, qty }

function addToCart(name, price){
  const existing = cart.find(c => c.name === name);
  if (existing) existing.qty += 1;
  else cart.push({ name, price, qty: 1 });
  renderCart();
  openCart();
}

function changeQty(name, delta){
  const item = cart.find(c => c.name === name);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) cart = cart.filter(c => c.name !== name);
  renderCart();
}

function renderCart(){
  const cartItemsEl = document.getElementById("cartItems");
  const cartBadge = document.getElementById("cartBadge");
  const totalCount = cart.reduce((sum, c) => sum + c.qty, 0);

  if (totalCount > 0) {
    cartBadge.textContent = totalCount;
    cartBadge.hidden = false;
  } else {
    cartBadge.hidden = true;
  }

  if (cart.length === 0) {
    cartItemsEl.innerHTML = `<p class="cart-empty">Your cart is empty. Tap <strong>+ Add to Order</strong> on any item to start your order.</p>`;
  } else {
    cartItemsEl.innerHTML = cart.map(c => `
      <div class="cart-item">
        <div class="cart-item-info">
          <strong>${c.name}</strong>
          <span>${c.price}</span>
        </div>
        <div class="cart-item-qty">
          <button data-action="dec" data-name="${c.name.replace(/"/g, "&quot;")}" aria-label="Decrease quantity">−</button>
          <span>${c.qty}</span>
          <button data-action="inc" data-name="${c.name.replace(/"/g, "&quot;")}" aria-label="Increase quantity">+</button>
        </div>
      </div>
    `).join("");

    cartItemsEl.querySelectorAll("button[data-action]").forEach(btn => {
      btn.addEventListener("click", () => {
        changeQty(btn.dataset.name, btn.dataset.action === "inc" ? 1 : -1);
      });
    });
  }

  const total = cartTotal();
  const totalRow = document.getElementById("cartTotalRow");
  const totalAmt = document.getElementById("cartTotalAmt");
  if (total > 0) {
    totalRow.hidden = false;
    totalAmt.textContent = `₹${total.toLocaleString("en-IN")}${cart.some(c => firstPriceNumber(c.price) === null) ? "+" : ""}`;
  } else {
    totalRow.hidden = true;
  }

  const lines = cart.map(c => `• ${c.name} x${c.qty} (${c.price})`).join("\n");
  const details = getCustomerDetails();
  const detailsLines = `\nName: ${details.name || "-"}\nPhone: ${details.phone || "-"}\nAddress: ${details.address || "-"}`;
  const message = cart.length
    ? `Hi Cake Town Bakery! I'd like to order:\n${lines}${detailsLines}\n\nPlease confirm final price & delivery time. Thank you!`
    : "Hi Cake Town Bakery! I'd like to place an order.";
  document.getElementById("cartCheckout").href = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message)}`;
}

/* Sum up parseable prices × qty for a running total. Items priced
   "Custom Order" / "Available on Order" etc. can't be summed, so they're
   flagged with a "+" instead of being silently ignored. */
function cartTotal(){
  return cart.reduce((sum, c) => {
    const n = firstPriceNumber(c.price);
    return sum + (n !== null ? n * c.qty : 0);
  }, 0);
}

function getCustomerDetails(){
  return {
    name: document.getElementById("custName").value.trim(),
    phone: document.getElementById("custPhone").value.trim(),
    address: document.getElementById("custAddress").value.trim(),
  };
}

function prefillCustomerDetails(){
  const user = getCurrentUser();
  if (!user) return;
  const nameEl = document.getElementById("custName");
  const phoneEl = document.getElementById("custPhone");
  if (nameEl && !nameEl.value) nameEl.value = user.name || "";
  if (phoneEl && !phoneEl.value) phoneEl.value = user.phone || "";
}

const cartDrawer = document.getElementById("cartDrawer");
const cartOverlay = document.getElementById("cartOverlay");

function openCart(){
  cartDrawer.classList.add("open");
  cartOverlay.hidden = false;
  cartDrawer.setAttribute("aria-hidden", "false");
}
function closeCart(){
  cartDrawer.classList.remove("open");
  cartOverlay.hidden = true;
  cartDrawer.setAttribute("aria-hidden", "true");
}
document.getElementById("cartFab").addEventListener("click", () => { prefillCustomerDetails(); openCart(); });
document.getElementById("cartClose").addEventListener("click", closeCart);
cartOverlay.addEventListener("click", closeCart);
["custName", "custPhone", "custAddress"].forEach(id => {
  document.getElementById(id).addEventListener("input", renderCart);
});
renderCart();

/* ---------------- PAY VIA UPI & PLACE ORDER ----------------
   No payment gateway/backend is wired up for this static site, so this
   uses a standard "upi://pay" deep link — the same mechanism UPI QR
   codes use — to open the customer's own UPI app (GPay/PhonePe/Paytm/BHIM)
   with the amount pre-filled. The order is also logged to WhatsApp +
   saved to "My Orders" so both the shop and the customer have a record. */
const SHOP_UPI_ID = "8899264105-1@okbizaxis";
const SHOP_UPI_NAME = "Cake Town Bakery";

/* Shared: send the WhatsApp confirmation message for a placed order. */
function sendOrderWhatsApp(order, paymentNote){
  const lines = order.items.map(c => `• ${c.name} x${c.qty} (${c.price})`).join("\n");
  const msg = `Hi Cake Town Bakery! I've placed order ${order.id}${paymentNote ? " " + paymentNote : ""}.\n\n${lines}\n\nName: ${order.customer.name}\nPhone: ${order.customer.phone}\nAddress: ${order.customer.address}\n\nPlease confirm my order. Thank you!`;
  window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`, "_blank");
}

document.getElementById("cartPayUpi").addEventListener("click", () => {
  if (cart.length === 0) {
    alert("Your cart is empty. Add an item first!");
    return;
  }
  const details = getCustomerDetails();
  if (!details.name || !details.phone || !details.address) {
    alert("Please enter your name, phone number, and delivery address before placing your order.");
    return;
  }
  if (!/^[0-9]{10}$/.test(details.phone)) {
    alert("Please enter a valid 10-digit phone number.");
    return;
  }

  const total = cartTotal();
  const orderId = "CTB" + Date.now().toString().slice(-8);
  const hasCustomItems = cart.some(c => firstPriceNumber(c.price) === null);

  const order = {
    id: orderId,
    date: new Date().toISOString(),
    items: cart.map(c => ({ name: c.name, price: c.price, qty: c.qty })),
    total,
    hasCustomItems,
    customer: details,
    status: "Placed — awaiting confirmation",
  };

  const finishOrder = (paymentNote) => {
    saveOrder(order);
    sendOrderWhatsApp(order, paymentNote);
    cart = [];
    renderCart();
    closeCart();
  };

  // Nothing to actually charge (all items are "on order"/custom-priced) —
  // just log the order and hand off to WhatsApp for a manual quote.
  if (total <= 0) {
    finishOrder("");
    alert(`Order ${orderId} placed! We've opened WhatsApp so we can confirm pricing and your order.`);
    return;
  }

  // Open the customer's UPI app (GPay/PhonePe/Paytm/BHIM) with the amount
  // pre-filled, then hand off to WhatsApp so the shop can confirm the order.
  const upiLink = `upi://pay?pa=${encodeURIComponent(SHOP_UPI_ID)}&pn=${encodeURIComponent(SHOP_UPI_NAME)}&am=${total}&cu=INR&tn=${encodeURIComponent("Order " + orderId)}`;
  window.location.href = upiLink;
  setTimeout(() => {
    finishOrder(`and started a UPI payment of ₹${total}`);
    alert(`Order ${orderId} placed! Complete the payment in your UPI app, then we've opened WhatsApp so we can confirm your order.`);
  }, 800);
});

/* ---------------- ACCOUNTS (Sign Up / Sign In) ----------------
   This is a static frontend with no server, so accounts are stored in
   this browser's localStorage. It's enough to let a customer create an
   account, sign in, have their details remembered, and see their past
   orders on this device — for real password security & cross-device
   accounts, this would need a backend (e.g. Firebase Auth or a small API). */
function getUsers(){
  try { return JSON.parse(localStorage.getItem("ctb-users") || "[]"); } catch(e){ return []; }
}
function saveUsers(users){
  try { localStorage.setItem("ctb-users", JSON.stringify(users)); } catch(e){}
}
function getCurrentUser(){
  try { return JSON.parse(localStorage.getItem("ctb-current-user") || "null"); } catch(e){ return null; }
}
function setCurrentUser(user){
  try { localStorage.setItem("ctb-current-user", JSON.stringify(user)); } catch(e){}
  updateAccountUI();
}
function logOutUser(){
  try { localStorage.removeItem("ctb-current-user"); } catch(e){}
  updateAccountUI();
}

function saveOrder(order){
  const user = getCurrentUser();
  const key = user ? `ctb-orders-${user.email}` : "ctb-orders-guest";
  let orders = [];
  try { orders = JSON.parse(localStorage.getItem(key) || "[]"); } catch(e){}
  orders.unshift(order);
  try { localStorage.setItem(key, JSON.stringify(orders)); } catch(e){}
}
function getOrders(){
  const user = getCurrentUser();
  const key = user ? `ctb-orders-${user.email}` : "ctb-orders-guest";
  try { return JSON.parse(localStorage.getItem(key) || "[]"); } catch(e){ return []; }
}

const accountBtn = document.getElementById("accountBtn");
const accountBtnMobile = document.getElementById("accountBtnMobile");
const accountDropdown = document.getElementById("accountDropdown");

function updateAccountUI(){
  const user = getCurrentUser();
  if (user) {
    accountBtn.textContent = `👤 Hi, ${user.name.split(" ")[0]}`;
    accountBtnMobile.textContent = `👤 Hi, ${user.name.split(" ")[0]} (My Account)`;
  } else {
    accountBtn.textContent = "👤 Sign In";
    accountBtnMobile.textContent = "👤 Sign In / Account";
  }
}
updateAccountUI();

accountBtn.addEventListener("click", () => {
  const user = getCurrentUser();
  if (user) {
    accountDropdown.hidden = !accountDropdown.hidden;
  } else {
    openAuthModal();
  }
});
accountBtnMobile.addEventListener("click", () => {
  const user = getCurrentUser();
  if (user) openOrdersModal(); else openAuthModal();
});
document.addEventListener("click", (e) => {
  if (!accountDropdown.hidden && !accountDropdown.contains(e.target) && e.target !== accountBtn) {
    accountDropdown.hidden = true;
  }
});
document.getElementById("ddMyOrders").addEventListener("click", (e) => {
  e.preventDefault();
  accountDropdown.hidden = true;
  openOrdersModal();
});
document.getElementById("ddLogout").addEventListener("click", (e) => {
  e.preventDefault();
  accountDropdown.hidden = true;
  logOutUser();
});

/* ---- Auth modal open/close + tab switching ---- */
const authOverlay = document.getElementById("authOverlay");
const authModal = document.getElementById("authModal");
const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");
const tabLoginBtn = document.getElementById("tabLoginBtn");
const tabSignupBtn = document.getElementById("tabSignupBtn");

function openAuthModal(tab){
  authOverlay.hidden = false;
  authModal.hidden = false;
  setAuthTab(tab || "login");
}
function closeAuthModal(){
  authOverlay.hidden = true;
  authModal.hidden = true;
  document.getElementById("loginError").hidden = true;
  document.getElementById("signupError").hidden = true;
}
function setAuthTab(tab){
  const isLogin = tab === "login";
  tabLoginBtn.classList.toggle("active", isLogin);
  tabSignupBtn.classList.toggle("active", !isLogin);
  loginForm.hidden = !isLogin;
  signupForm.hidden = isLogin;
}
tabLoginBtn.addEventListener("click", () => setAuthTab("login"));
tabSignupBtn.addEventListener("click", () => setAuthTab("signup"));
document.getElementById("authClose").addEventListener("click", closeAuthModal);
authOverlay.addEventListener("click", closeAuthModal);

signupForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const f = new FormData(e.target);
  const name = f.get("name").trim();
  const phone = f.get("phone").trim();
  const email = f.get("email").trim().toLowerCase();
  const password = f.get("password");
  const errEl = document.getElementById("signupError");

  if (!/^[0-9]{10}$/.test(phone)) {
    errEl.textContent = "Please enter a valid 10-digit phone number.";
    errEl.hidden = false;
    return;
  }
  const users = getUsers();
  if (users.some(u => u.email === email)) {
    errEl.textContent = "An account with this email already exists — try signing in instead.";
    errEl.hidden = false;
    return;
  }
  const newUser = { name, phone, email, password };
  users.push(newUser);
  saveUsers(users);
  setCurrentUser({ name, phone, email });
  closeAuthModal();
  signupForm.reset();
  prefillCustomerDetails();
  alert(`Welcome, ${name}! Your account has been created and you're signed in.`);
});

loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const f = new FormData(e.target);
  const email = f.get("email").trim().toLowerCase();
  const password = f.get("password");
  const errEl = document.getElementById("loginError");

  const users = getUsers();
  const match = users.find(u => u.email === email && u.password === password);
  if (!match) {
    errEl.textContent = "Incorrect email or password. Don't have an account? Use Create Account above.";
    errEl.hidden = false;
    return;
  }
  setCurrentUser({ name: match.name, phone: match.phone, email: match.email });
  closeAuthModal();
  loginForm.reset();
  prefillCustomerDetails();
});

/* ---- My Orders modal ---- */
const ordersOverlay = document.getElementById("ordersOverlay");
const ordersModal = document.getElementById("ordersModal");
function openOrdersModal(){
  const orders = getOrders();
  const list = document.getElementById("ordersList");
  list.innerHTML = orders.length
    ? orders.map(o => `
      <div class="order-card">
        <div class="order-card-head">
          <strong>#${o.id}</strong>
          <span>${new Date(o.date).toLocaleString("en-IN")}</span>
        </div>
        <ul class="order-card-items">
          ${o.items.map(it => `<li>${it.name} × ${it.qty} <span>${it.price}</span></li>`).join("")}
        </ul>
        <div class="order-card-foot">
          <span>${o.total > 0 ? "₹" + o.total.toLocaleString("en-IN") + (o.hasCustomItems ? "+" : "") : "Priced on confirmation"}</span>
          <span class="order-status">${o.status}</span>
        </div>
      </div>
    `).join("")
    : `<p class="cart-empty">No orders yet. Once you place an order it will show up here.</p>`;
  ordersOverlay.hidden = false;
  ordersModal.hidden = false;
}
function closeOrdersModal(){
  ordersOverlay.hidden = true;
  ordersModal.hidden = true;
}
document.getElementById("ordersClose").addEventListener("click", closeOrdersModal);
ordersOverlay.addEventListener("click", closeOrdersModal);

/* ---------------- LOAD LIVE MENU + DAILY BANNER ----------------
   Fetches data/menu.json (editable by the owner at /admin) and
   re-renders the menu once it arrives. Falls back to the small
   hardcoded list above if the fetch fails (e.g. offline or opened
   via file:// without a server). */
function showBanner(text){
  let banner = document.getElementById("dailyBanner");
  if (!banner) {
    banner = document.createElement("div");
    banner.id = "dailyBanner";
    banner.style.cssText = "background:var(--gold,#caa24a);color:#2a1a12;text-align:center;font-weight:600;padding:10px 16px;font-size:0.95rem;";
    document.body.prepend(banner);
  }
  banner.textContent = text;
  banner.hidden = false;
}

async function loadLiveContent(){
  try {
    const res = await fetch("data/menu.json", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.items) && data.items.length) {
        menuItems = data.items;
      }
    }
  } catch (err) {
    console.warn("Could not load data/menu.json, using fallback menu.", err);
  }
  renderMenu();

  try {
    const res = await fetch("data/announcement.json", { cache: "no-store" });
    if (res.ok) {
      const ann = await res.json();
      if (ann.show && ann.message) showBanner(ann.message);
    }
  } catch (err) {
    console.warn("Could not load data/announcement.json.", err);
  }
}
loadLiveContent();

/* ---------------- GALLERY ---------------- */
const galleryItems = [
  { label: "Birthday Cakes", img: "https://images.unsplash.com/photo-1558636508-e0db3814bd1d?q=80&w=700&auto=format&fit=crop" },
  { label: "Designer Cakes", img: "https://images.unsplash.com/photo-1535254973040-607b474cb50d?q=80&w=700&auto=format&fit=crop" },
  { label: "Pizza", img: "https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=700&auto=format&fit=crop" },
  { label: "Pastries", img: "https://images.unsplash.com/photo-1586788680434-30d324b2d46f?q=80&w=700&auto=format&fit=crop" },
  { label: "Cupcakes", img: "https://images.unsplash.com/photo-1614707267537-b85aaf00c4b7?q=80&w=700&auto=format&fit=crop" },
  { label: "Cream Rolls", img: "https://images.unsplash.com/photo-1509365465985-25d11c17e812?q=80&w=700&auto=format&fit=crop" },
  { label: "Sandwiches", img: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?q=80&w=700&auto=format&fit=crop" },
  { label: "Shop Interior", img: "https://images.unsplash.com/photo-1517433670267-08bbd4be890f?q=80&w=700&auto=format&fit=crop" },
  { label: "Bakery Counter", img: "https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=700&auto=format&fit=crop" },
  { label: "Happy Customers", img: "https://images.unsplash.com/photo-1541599468348-e96984315921?q=80&w=700&auto=format&fit=crop" },
];

const galleryGrid = document.getElementById("galleryGrid");
galleryGrid.innerHTML = galleryItems.map(g => `
  <div class="gallery-item reveal" data-img="${g.img}" data-label="${g.label}">
    <img src="${g.img}" alt="${g.label} — Cake Town Bakery" loading="lazy">
    <span class="g-label">${g.label}</span>
  </div>
`).join("");

const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightboxImg");
const lightboxClose = document.getElementById("lightboxClose");
let lastFocusedEl = null;
function openLightbox(item){
  lastFocusedEl = document.activeElement;
  lightboxImg.src = item.dataset.img;
  lightboxImg.alt = item.dataset.label;
  lightbox.hidden = false;
  document.body.style.overflow = "hidden";
  lightboxClose.focus();
}
function closeLightbox(){
  lightbox.hidden = true;
  document.body.style.overflow = "";
  if (lastFocusedEl) lastFocusedEl.focus();
}
document.querySelectorAll(".gallery-item").forEach(item => {
  item.setAttribute("tabindex", "0");
  item.setAttribute("role", "button");
  item.setAttribute("aria-label", `View ${item.dataset.label} photo`);
  item.addEventListener("click", () => openLightbox(item));
  item.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openLightbox(item); }
  });
});
lightboxClose.addEventListener("click", closeLightbox);
lightbox.addEventListener("click", (e) => { if (e.target === lightbox) closeLightbox(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !lightbox.hidden) closeLightbox(); });

/* ---------------- REVIEWS ---------------- */
const reviews = [
  { name: "Ritika Sharma", role: "Regular Customer", quote: "The best black forest cake in Pandit Kheda — soft, fresh, and never too sweet. My family's default choice now." },
  { name: "Manish Verma", role: "Birthday Order", quote: "Ordered a photo cake for my daughter's birthday. The design was beautiful and delivered right on time." },
  { name: "Priya Gupta", role: "Office Party", quote: "Their pizza slices and sandwiches are perfect for office parties. Always fresh, always on budget." },
  { name: "Amit Singh", role: "Anniversary Cake", quote: "Pre-booked our anniversary cake and got the discount too. Taste and presentation were both excellent." },
  { name: "Sneha Tiwari", role: "Loyal Customer", quote: "Hygienic, friendly staff, and the cupcakes are addictive. Cake Town is our go-to bakery in Lucknow." },
];

const reviewTrack = document.getElementById("reviewTrack");
const reviewDotsWrap = document.getElementById("reviewDots");
reviewTrack.innerHTML = reviews.map(r => `
  <div class="review-card">
    <div class="review-stars">★★★★★</div>
    <p class="quote">"${r.quote}"</p>
    <p class="name">${r.name}</p>
    <p class="role">${r.role}</p>
  </div>
`).join("");
reviewDotsWrap.innerHTML = reviews.map((_, i) => `<span data-i="${i}" class="${i===0?'active':''}"></span>`).join("");

let revIndex = 0;
function goToReview(i){
  revIndex = (i + reviews.length) % reviews.length;
  reviewTrack.style.transform = `translateX(-${revIndex * 100}%)`;
  document.querySelectorAll(".review-dots span").forEach((d, idx) => d.classList.toggle("active", idx === revIndex));
}
document.getElementById("revPrev").addEventListener("click", () => goToReview(revIndex - 1));
document.getElementById("revNext").addEventListener("click", () => goToReview(revIndex + 1));
document.querySelectorAll(".review-dots span").forEach(dot => {
  dot.addEventListener("click", () => goToReview(Number(dot.dataset.i)));
});
setInterval(() => goToReview(revIndex + 1), 6000);

/* ---------------- FAQ ---------------- */
const faqs = [
  { q: "How do I pre-book a cake?", a: "Fill the Pre-Book form in the Contact section or message us on WhatsApp with your cake type, weight, and date. You'll also get 5% off for pre-booking!" },
  { q: "Do you deliver on the same day?", a: "Yes, same day pickup is available for most items. For custom or heavier cakes (1 KG+), we recommend ordering a day in advance." },
  { q: "Can I get a custom photo or theme cake?", a: "Absolutely — we make photo cakes, kids' theme cakes, designer cakes and more. Share your reference image with us on WhatsApp." },
  { q: "What payment methods do you accept?", a: "We accept cash, UPI, and most major payment apps at the store. Pre-orders can be confirmed with a small advance." },
  { q: "Do you cater for bulk/office orders?", a: "Yes, we handle bulk orders for offices, parties and events — pizza, sandwiches, cupcakes and snack platters included." },
  { q: "Can I cancel or get a refund on my order?", a: "Once an order is placed, it cannot be cancelled or refunded. Every cake and bakery item is freshly prepared specifically for your order and can't be reused or resold, so please review your order carefully before confirming." },
];
const faqList = document.getElementById("faqList");
faqList.innerHTML = faqs.map((f, i) => `
  <div class="faq-item">
    <button class="faq-q" data-i="${i}" aria-expanded="false" aria-controls="faqAnswer${i}" id="faqQ${i}">${f.q} <span class="plus" aria-hidden="true">+</span></button>
    <div class="faq-a" id="faqAnswer${i}" role="region" aria-labelledby="faqQ${i}"><p>${f.a}</p></div>
  </div>
`).join("");
document.querySelectorAll(".faq-q").forEach(btn => {
  btn.addEventListener("click", () => {
    const item = btn.closest(".faq-item");
    const isOpen = item.classList.toggle("open");
    btn.setAttribute("aria-expanded", String(isOpen));
  });
});

/* ---------------- NAVBAR: scroll + mobile toggle ---------------- */
const navbar = document.getElementById("navbar");
const navLinks = document.getElementById("navLinks");
const hamburger = document.getElementById("hamburger");
const scrollTopBtn = document.getElementById("scrollTop");

window.addEventListener("scroll", () => {
  navbar.classList.toggle("scrolled", window.scrollY > 20);
  scrollTopBtn.hidden = window.scrollY < 500;
});

hamburger.addEventListener("click", () => {
  const isOpen = navLinks.classList.toggle("open");
  hamburger.setAttribute("aria-expanded", String(isOpen));
  hamburger.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
});
navLinks.querySelectorAll("a").forEach(a => a.addEventListener("click", () => {
  navLinks.classList.remove("open");
  hamburger.setAttribute("aria-expanded", "false");
  hamburger.setAttribute("aria-label", "Open menu");
}));
document.addEventListener("click", (e) => {
  if (navLinks.classList.contains("open") && !navLinks.contains(e.target) && !hamburger.contains(e.target)) {
    navLinks.classList.remove("open");
    hamburger.setAttribute("aria-expanded", "false");
    hamburger.setAttribute("aria-label", "Open menu");
  }
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && navLinks.classList.contains("open")) {
    navLinks.classList.remove("open");
    hamburger.setAttribute("aria-expanded", "false");
    hamburger.setAttribute("aria-label", "Open menu");
  }
});

scrollTopBtn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

/* ---------------- THEME TOGGLE ---------------- */
const themeToggle = document.getElementById("themeToggle");
const themeIcon = themeToggle.querySelector(".theme-icon");
function applyTheme(theme){
  document.documentElement.setAttribute("data-theme", theme);
  themeIcon.textContent = theme === "dark" ? "☀️" : "🌙";
}
const savedTheme = (() => { try { return localStorage.getItem("ctb-theme"); } catch(e){ return null; } })();
applyTheme(savedTheme || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
themeToggle.addEventListener("click", () => {
  const current = document.documentElement.getAttribute("data-theme");
  const next = current === "dark" ? "light" : "dark";
  applyTheme(next);
  try { localStorage.setItem("ctb-theme", next); } catch(e){}
});

/* ---------------- SCROLL REVEAL ---------------- */
const revealEls = document.querySelectorAll(".offer-card, .why-card, .gallery-item, .banner, .form-card, .info-card, .stat-card, .faq-item, .combo-card, .payment-card, .map-embed");
revealEls.forEach(el => el.classList.add("reveal"));
const io = new IntersectionObserver((entries) => {
  entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add("in-view"); });
}, { threshold: 0.15 });
revealEls.forEach(el => io.observe(el));

/* ---------------- FORMS -> WHATSAPP ---------------- */
document.getElementById("prebookForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const f = new FormData(e.target);
  const msg = `Hi Cake Town Bakery! I'd like to pre-book a cake.%0A%0AName: ${f.get("name")}%0APhone: ${f.get("phone")}%0ACake Type: ${f.get("cakeType")}%0AWeight: ${f.get("weight")}%0ADate Needed: ${f.get("date")}%0ANotes: ${f.get("notes") || "-"}`;
  window.open(`https://wa.me/${WA_NUMBER}?text=${msg}`, "_blank");
});

document.getElementById("enquiryForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const f = new FormData(e.target);
  const msg = `Hi Cake Town Bakery! I have an enquiry.%0A%0AName: ${f.get("name")}%0APhone: ${f.get("phone")}%0AMessage: ${f.get("message")}`;
  window.open(`https://wa.me/${WA_NUMBER}?text=${msg}`, "_blank");
});

/* ---------------- CAKE BUILDER -> WHATSAPP ---------------- */
document.getElementById("cakeBuilderForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const f = new FormData(e.target);
  const msg = `Hi Cake Town Bakery! I'd like to customize a cake.%0A%0AWeight: ${f.get("weight")}%0AFlavor: ${f.get("flavor")}%0AShape: ${f.get("shape")}%0ATheme: ${f.get("theme")}%0AMessage on Cake: ${f.get("message") || "-"}%0ADelivery Date: ${f.get("date")}%0APickup Time: ${f.get("pickupTime")}%0ASpecial Instructions: ${f.get("notes") || "-"}`;
  window.open(`https://wa.me/${WA_NUMBER}?text=${msg}`, "_blank");
});

/* ---------------- ANIMATED STAT COUNTERS ---------------- */
const statEls = document.querySelectorAll(".stat-num");
const statIO = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const el = entry.target;
    const target = parseFloat(el.dataset.target);
    const decimals = Number(el.dataset.decimal || 0);
    const duration = 1600;
    const start = performance.now();
    function tick(now){
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = target * eased;
      el.textContent = decimals ? value.toFixed(decimals) : Math.floor(value).toLocaleString("en-IN");
      if (progress < 1) requestAnimationFrame(tick);
      else el.textContent = decimals ? target.toFixed(decimals) : target.toLocaleString("en-IN");
    }
    requestAnimationFrame(tick);
    statIO.unobserve(el);
  });
}, { threshold: 0.4 });
statEls.forEach(el => statIO.observe(el));

/* ---------------- OPEN / CLOSED STATUS ---------------- */
function updateOpenStatus(){
  const el = document.getElementById("openStatus");
  const textEl = document.getElementById("openStatusText");
  const now = new Date();
  const hour = now.getHours() + now.getMinutes() / 60;
  const isOpen = hour >= 9 && hour < 22; // 9 AM - 10 PM daily
  el.classList.toggle("open", isOpen);
  el.classList.toggle("closed", !isOpen);
  textEl.textContent = isOpen ? "Open Now · Till 10 PM" : "Closed · Opens 9 AM";
}
updateOpenStatus();
setInterval(updateOpenStatus, 60000);

/* ---------------- SCROLL PROGRESS BAR ---------------- */
const scrollProgress = document.getElementById("scrollProgress");
window.addEventListener("scroll", () => {
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
  scrollProgress.style.width = pct + "%";
});
