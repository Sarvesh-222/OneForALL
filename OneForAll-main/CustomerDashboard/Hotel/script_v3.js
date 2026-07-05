const defaultHotelProducts = [
    { id: 1, name: "Paneer Tikka", price: 350.00, image: "images/Paneer_Tikka.jpg", badge: "HOT", category: "Veg", cuisine: "Indian", inStock: true },
    { id: 2, name: "Chicken Biryani", price: 400.00, image: "images/Chicken Biryani.jpeg", badge: "CHEF'S PICK", category: "Non-veg", cuisine: "Indian", inStock: true },
    { id: 3, name: "Veg Hakka Noodles", price: 250.00, image: "images/Veg Hakka Noodles.jpeg", badge: "NEW", category: "Veg", cuisine: "Chinese", inStock: true },
    { id: 4, name: "Chilli Chicken", price: 380.00, image: "images/Chlli_Chiken.jpeg", badge: "SPICY", category: "Non-veg", cuisine: "Chinese", inStock: true },
    { id: 5, name: "Chicken Sandwich", price: 150.00, image: "images/Chicken_Sandwich.jpeg", badge: "SNACK", category: "Non-veg", cuisine: "Indian", inStock: true },
    { id: 6, name: "Paneer Kabab", price: 280.00, image: "images/Paneer_Kabab.jpeg", badge: "STARTER", category: "Veg", cuisine: "Indian", inStock: true }
];

let products = [];

let cart = [];

// DOM Elements
const productGrid = document.getElementById('product-grid');
const cartBtn = document.getElementById('cart-btn');
const closeCartBtn = document.getElementById('close-cart');
const cartOverlay = document.getElementById('cart-overlay');
const cartItemsContainer = document.getElementById('cart-items');
const cartBadge = document.getElementById('cart-badge');
const cartTotalPrice = document.getElementById('cart-total-price');
const checkoutBtn = document.getElementById('checkout-btn');
const trackingModal = document.getElementById('tracking-modal');
const closeTrackingBtn = document.getElementById('close-tracking');
const openTrackingBtn = document.getElementById('open-tracking-btn');

const API_BASE_URL = 'http://127.0.0.1:8000';

async function fetchProductsFromDB() {
    try {
        const response = await fetch(`${API_BASE_URL}/get-product`);
        if (!response.ok) throw new Error('Network response was not ok');
        let dbProducts = await response.json();
        
        let hotelDbProducts = dbProducts.filter(p => p.shop_id === 1);
        
        products = defaultHotelProducts.map(def => {
            const dbProd = hotelDbProducts.find(p => p.name.toLowerCase() === def.name.toLowerCase());
            if (dbProd) {
                return {
                    ...def,
                    id: dbProd.id,
                    price: parseFloat(dbProd.price),
                    inStock: dbProd.is_available && dbProd.stock_quantity > 0,
                    stock_quantity: dbProd.stock_quantity,
                    shop_id: dbProd.shop_id
                };
            } else {
                return {
                    ...def,
                    stock_quantity: 10,
                    shop_id: 1,
                    inStock: true
                };
            }
        });
    } catch (error) {
        console.error("Failed to fetch products from DB, falling back to defaults", error);
        products = JSON.parse(JSON.stringify(defaultHotelProducts));
    }
}

// Initialize Dashboard
async function init() {
    await fetchProductsFromDB();
    renderProducts();
    setupEventListeners();
}

function renderProducts() {
    productGrid.innerHTML = '';

    // Get active filters
    const categoryFilters = Array.from(document.querySelectorAll('#category-filters .filter-cb:checked')).map(cb => cb.value);
    const cuisineFilters = Array.from(document.querySelectorAll('#cuisine-filters .filter-cb:checked')).map(cb => cb.value);
    const priceFilters = Array.from(document.querySelectorAll('#price-filters .filter-cb:checked')).map(cb => cb.value);

    const searchInput = document.querySelector('.search-bar input');
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';

    let filtered = products.filter(product => {
        let nameMatch = searchTerm === '' || product.name.toLowerCase().includes(searchTerm);
        let categoryMatch = categoryFilters.length === 0 || categoryFilters.some(c => c.toLowerCase() === 'all') || categoryFilters.includes(product.category);
        let cuisineMatch = cuisineFilters.length === 0 || cuisineFilters.includes(product.cuisine);
        
        let priceMatch = priceFilters.length === 0 || priceFilters.some(p => p.toLowerCase() === 'all');
        if (!priceMatch) {
            priceMatch = priceFilters.some(pf => {
                if (pf === 'under-200' && product.price < 200) return true;
                if (pf === '200-350' && product.price >= 200 && product.price <= 350) return true;
                if (pf === 'over-350' && product.price > 350) return true;
                return false;
            });
        }
        
        return nameMatch && categoryMatch && cuisineMatch && priceMatch;
    });

    if (filtered.length === 0) {
        productGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 3rem;">No dishes found matching your filters.</div>';
        return;
    }

    filtered.forEach(product => {
        const isOutOfStock = !product.inStock;
        const cardClass = isOutOfStock ? 'product-card out-of-stock' : 'product-card';
        
        const badgeHtml = isOutOfStock 
            ? `<div class="badge out-stock">OUT OF STOCK</div>` 
            : `<div class="badge ${product.badge === 'HOT' ? 'hot' : ''}">${product.badge}</div>`;
            
        const buttonHtml = isOutOfStock
            ? `<button class="add-to-cart" disabled><i class="fa-solid fa-ban"></i> Unavailable</button>`
            : `<button class="add-to-cart" onclick="addToCart(${product.id})"><i class="fa-solid fa-plus"></i> Add to Order</button>`;

        const card = document.createElement('div');
        card.className = cardClass;
        card.innerHTML = `
            <div class="product-img-wrapper">
                ${badgeHtml}
                <img src="${product.image}" alt="${product.name}">
            </div>
            <div class="product-info">
                <h3 class="product-title">${product.name}</h3>
                <div class="product-price">₹${product.price.toFixed(2)}</div>
                ${buttonHtml}
            </div>
        `;
        productGrid.appendChild(card);
    });
}

function setupEventListeners() {
    cartBtn.addEventListener('click', () => {
        cartOverlay.classList.add('active');
        renderCart();
    });

    closeCartBtn.addEventListener('click', () => {
        cartOverlay.classList.remove('active');
    });

    checkoutBtn.addEventListener('click', handleCheckout);

    closeTrackingBtn.addEventListener('click', () => {
        trackingModal.classList.remove('active');
    });

    if (openTrackingBtn) {
        openTrackingBtn.addEventListener('click', () => {
            trackingModal.classList.add('active');
        });
    }

    // Listen for filter changes
    document.querySelectorAll('.filter-cb').forEach(cb => {
        cb.addEventListener('change', renderProducts);
    });
    
    // Listen for search input changes
    const searchInput = document.querySelector('.search-bar input');
    if (searchInput) {
        searchInput.addEventListener('input', renderProducts);
    }

    // Dropdown animation for filters
    document.querySelectorAll('.filter-section h3').forEach(header => {
        header.addEventListener('click', () => {
            const list = header.nextElementSibling;
            list.classList.toggle('collapsed');
            header.classList.toggle('collapsed');
        });
    });

}

// Sound and Toast Animation
function playPopSound() {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    // First tone (A5)
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, audioCtx.currentTime);
    gain1.gain.setValueAtTime(0, audioCtx.currentTime);
    gain1.gain.linearRampToValueAtTime(0.4, audioCtx.currentTime + 0.02);
    gain1.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    osc1.start(audioCtx.currentTime);
    osc1.stop(audioCtx.currentTime + 0.15);

    // Second tone (D6)
    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1174.66, audioCtx.currentTime + 0.1);
    gain2.gain.setValueAtTime(0, audioCtx.currentTime + 0.1);
    gain2.gain.linearRampToValueAtTime(0.4, audioCtx.currentTime + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
    osc2.connect(gain2);
    gain2.connect(audioCtx.destination);
    osc2.start(audioCtx.currentTime + 0.1);
    osc2.stop(audioCtx.currentTime + 0.35);
}

function showToast(message) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<i class="fa-solid fa-circle-check"></i> <span>${message}</span>`;
    
    container.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 10);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}

// Cart Logic
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    const existingItem = cart.find(item => item.id === productId);

    if (existingItem) {
        if (product.stock_quantity !== undefined && existingItem.quantity >= product.stock_quantity) {
            showToast("Maximum available stock reached!");
            return;
        }
        existingItem.quantity += 1;
    } else {
        if (product.stock_quantity !== undefined && product.stock_quantity <= 0) {
            showToast("Out of stock!");
            return;
        }
        cart.push({ ...product, quantity: 1 });
    }

    updateCartBadge();
    
    playPopSound();
    showToast(product.name + " added to order!");
    
    // Bounce effect on cart icon
    cartBtn.style.transform = 'scale(1.2)';
    setTimeout(() => cartBtn.style.transform = 'scale(1)', 200);
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    renderCart();
    updateCartBadge();
}

function updateQuantity(productId, delta) {
    const item = cart.find(item => item.id === productId);
    const product = products.find(p => p.id === productId);
    if (item) {
        const newQty = item.quantity + delta;
        if (product && product.stock_quantity !== undefined && newQty > product.stock_quantity) {
            showToast("Maximum available stock reached!");
            return;
        }
        item.quantity = newQty;
        if (item.quantity <= 0) {
            removeFromCart(productId);
        } else {
            renderCart();
            updateCartBadge();
        }
    }
}

function updateCartBadge() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartBadge.textContent = totalItems;
}

function renderCart() {
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<div class="empty-cart-msg" style="text-align: center; color: var(--text-muted); margin-top: 2rem;">Your order is empty.</div>';
        cartTotalPrice.textContent = '₹0.00';
        return;
    }

    cartItemsContainer.innerHTML = '';
    let total = 0;

    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;

        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <div class="cart-item-img">
                <img src="${item.image}" alt="${item.name}">
            </div>
            <div class="cart-item-details">
                <div class="cart-item-title">${item.name}</div>
                <div class="cart-item-price">₹${item.price.toFixed(2)}</div>
            </div>
            <div class="cart-item-actions">
                <button class="qty-btn" onclick="updateQuantity(${item.id}, -1)">-</button>
                <span>${item.quantity}</span>
                <button class="qty-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
            </div>
        `;
        cartItemsContainer.appendChild(cartItem);
    });

    cartTotalPrice.textContent = `₹${total.toFixed(2)}`;
}

// Checkout and Tracking
async function handleCheckout() {
    if (cart.length === 0) return;

    checkoutBtn.classList.add('processing');
    checkoutBtn.querySelector('.btn-text').textContent = 'Processing...';

    try {
        for (const item of cart) {
            const checkRes = await fetch(`${API_BASE_URL}/get-product`);
            const allDbProducts = await checkRes.json();
            const dbProduct = allDbProducts.find(p => p.name.toLowerCase() === item.name.toLowerCase() && p.shop_id === (item.shop_id || 1));
            
            if (dbProduct) {
                if (dbProduct.stock_quantity < item.quantity || !dbProduct.is_available) {
                    showToast(`Sorry, ${item.name} is out of stock!`);
                    checkoutBtn.classList.remove('processing');
                    checkoutBtn.querySelector('.btn-text').textContent = 'Pay & Order';
                    return; // Stop checkout
                }

                const newStock = dbProduct.stock_quantity - item.quantity;
                const updatePayload = {
                    shop_id: dbProduct.shop_id,
                    name: dbProduct.name,
                    price: dbProduct.price,
                    stock_quantity: newStock < 0 ? 0 : newStock,
                    is_available: newStock > 0
                };
                
                await fetch(`${API_BASE_URL}/update-product/${dbProduct.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updatePayload)
                });
            } else {
                // If it doesn't exist, use POST request to create it so it shows up in the DB
                const createPayload = {
                    shop_id: item.shop_id || 1,
                    name: item.name,
                    price: item.price,
                    stock_quantity: 10 - item.quantity,
                    is_available: true
                };
                
                await fetch(`${API_BASE_URL}/create-product`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(createPayload)
                });
            }
        }
    } catch (e) {
        console.error("Failed to sync with database during checkout", e);
    }

    setTimeout(() => {
        checkoutBtn.classList.remove('processing');
        checkoutBtn.querySelector('.btn-text').textContent = 'Pay & Order';
        
        cartOverlay.classList.remove('active');
        cart = [];
        updateCartBadge();
        
        // Refresh products from DB so UI shows updated stock
        fetchProductsFromDB().then(() => renderProducts());
        
        trackingModal.classList.add('active');
        if (openTrackingBtn) openTrackingBtn.style.display = 'block';
        startTrackingAnimation();
    }, 2000); 
}

// Google Maps Tracking Algorithm
let map, donorMarker, truckMarker, polyline;
let donorPos = { lat: 19.2307, lng: 72.8567 }; // Default Customer Home (Borivali)
const startPos = { lat: 19.1136, lng: 72.8697 }; // Restaurant (Andheri)

function initMap() {
    map = new google.maps.Map(document.getElementById("map"), {
        zoom: 14,
        center: donorPos,
        disableDefaultUI: true,
        zoomControl: true,
    });

    donorMarker = new google.maps.Marker({
        position: donorPos,
        map: map,
        title: "My Home",
        icon: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
    });

    truckMarker = new google.maps.Marker({
        map: map,
        title: "Delivery",
        position: startPos,
        icon: {
            url: "https://maps.gstatic.com/mapfiles/ms2/micons/truck.png",
            scaledSize: new google.maps.Size(40, 40)
        }
    });

    polyline = new google.maps.Polyline({
        map: map,
        geodesic: true,
        strokeColor: '#e67e22', // Primary color for Hotel
        strokeOpacity: 1.0,
        strokeWeight: 5,
        path: [startPos, donorPos]
    });

    // Request User Geolocation
    if (navigator.geolocation) {
        if (window.location.protocol === 'file:') {
            setTimeout(() => {
                showToast("Note: Browser blocks location on file:///. Use Live Server.");
            }, 3000);
        }
        navigator.geolocation.getCurrentPosition(
            (position) => {
                donorPos = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                
                // Update map center, marker, and route path
                map.setCenter(donorPos);
                donorMarker.setPosition(donorPos);
                polyline.setPath([startPos, donorPos]);
                
                // Adjust bounds to fit both the store and new user location
                const bounds = new google.maps.LatLngBounds();
                bounds.extend(donorPos);
                bounds.extend(startPos);
                map.fitBounds(bounds, { padding: 80 });
                showToast("Location updated successfully!");
            },
            (error) => {
                console.log("Geolocation error or denied:", error.message);
                showToast("Could not get your location: " + error.message);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    } else {
        showToast("Geolocation is not supported by this browser.");
    }
}
window.initMap = initMap;

function updateTruckLocation(driverPos) {
    if(!truckMarker) return;
    truckMarker.setPosition(driverPos);
    polyline.setPath([driverPos, donorPos]);

    const bounds = new google.maps.LatLngBounds();
    bounds.extend(donorPos);
    bounds.extend(driverPos);
    map.fitBounds(bounds, { padding: 80 });
}

let simSteps = [];
let simIndex = 0;
let simInterval;

function startTrackingAnimation() {
    setTimeout(() => {
        if (map) google.maps.event.trigger(map, "resize");

        if (simInterval) clearInterval(simInterval);

        let currLat = startPos.lat;
        let currLng = startPos.lng;
        const targetLat = donorPos.lat;
        const targetLng = donorPos.lng;

        simSteps = [];
        for (let i = 1; i <= 30; i++) {
            simSteps.push({
                lat: currLat + ((targetLat - currLat) * (i / 30)),
                lng: currLng + ((targetLng - currLng) * (i / 30))
            });
        }

        simIndex = 0;
        document.getElementById("status-text").innerText = "Out for Delivery!";
        updateTruckLocation(startPos);
        
        const steps = document.querySelectorAll('#tracking-modal .status-step');
        if(steps.length >= 4) {
            steps[2].classList.add('pulse');
            steps[3].classList.remove('active');
        }

        simInterval = setInterval(() => {
            if (simIndex >= simSteps.length) {
                clearInterval(simInterval);
                document.getElementById("status-text").innerText = "Arrived at your Doorstep!";
                document.getElementById("dist-text").innerText = "0.0 km left";
                
                if(steps.length >= 4) {
                    steps[2].classList.remove('pulse');
                    steps[3].classList.add('active');
                }
                
                // Hide tracking button when delivery is complete
                if (openTrackingBtn) openTrackingBtn.style.display = 'none';
                
                return;
            }
            const pos = simSteps[simIndex];
            updateTruckLocation(pos);

            const remainingKm = ((30 - simIndex) * 0.4).toFixed(1);
            document.getElementById("dist-text").innerText = `${remainingKm} km left`;

            simIndex++;
        }, 800);
    }, 400); 
}

// Run init
init();

// Mobile Sidebar Toggle
const mobileBtn = document.querySelector('.mobile-filter-btn');
const sidebar = document.querySelector('.sidebar');
const overlay = document.getElementById('sidebar-overlay');
const closeSidebarBtn = document.getElementById('close-sidebar-btn');

if (mobileBtn && sidebar && overlay) {
    mobileBtn.addEventListener('click', () => {
        sidebar.classList.add('open');
        overlay.classList.add('active');
    });
    
    const closeSidebar = () => {
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
    };

    overlay.addEventListener('click', closeSidebar);
    if (closeSidebarBtn) closeSidebarBtn.addEventListener('click', closeSidebar);
}
