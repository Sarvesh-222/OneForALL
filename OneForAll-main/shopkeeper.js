// ══════════════════════════════════════════════════
// API & STORAGE LAYER (Backend Integration Ready)
// ══════════════════════════════════════════════════

const USE_MOCK_API = false;
const API_BASE_URL = (window.location.protocol === 'file:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://127.0.0.1:8000/api/v1'
    : window.location.origin + '/api/v1';

// Initial fallback inventory with stock levels and units
const DEFAULT_INVENTORY = [
    { id: 1, name: 'Milk',   price: 40,  emoji: '🥛', inStock: true,  quantity: 50, unit: 'litre' },
    { id: 2, name: 'Bread',  price: 35,  emoji: '🍞', inStock: true,  quantity: 20, unit: 'packet' },
    { id: 3, name: 'Eggs',   price: 60,  emoji: '🥚', inStock: true,  quantity: 12, unit: 'dozen' },
    { id: 4, name: 'Rice',   price: 300, emoji: '🍚', inStock: true,  quantity: 15, unit: 'kg' },
    { id: 5, name: 'Dal',    price: 80,  emoji: '🫘', inStock: true,  quantity: 25, unit: 'kg' },
    { id: 6, name: 'Sugar',  price: 50,  emoji: '🍬', inStock: false, quantity: 0,  unit: 'kg' },
    { id: 7, name: 'Oil',    price: 220, emoji: '🫒', inStock: true,  quantity: 8,  unit: 'litre' },
    { id: 8, name: 'Tea',    price: 120, emoji: '☕', inStock: true,  quantity: 18, unit: 'packet' },
    { id: 9, name: 'Butter', price: 55,  emoji: '🧈', inStock: true,  quantity: 14, unit: 'packet' },
    { id: 10, name: 'Salt',  price: 20,  emoji: '🧂', inStock: false, quantity: 0,  unit: 'packet' }
];

const DEFAULT_ORDERS = [
    { id:'ORD-001', cusName:'Rajesh Patel',   items:['Milk','Bread','Eggs'],   amount:135, timestamp: Date.now()-3600000, status:'Delivered' },
    { id:'ORD-002', cusName:'Priya Kumar',    items:['Rice','Dal'],            amount:380, timestamp: Date.now()-2400000, status:'Delivered' },
    { id:'ORD-003', cusName:'Amit Singh',     items:['Oil','Sugar'],           amount:270, timestamp: Date.now()-1800000, status:'Accepted' },
    { id:'ORD-004', cusName:'Neha Desai',     items:['Tea','Bread','Milk'],    amount:195, timestamp: Date.now()-1200000, status:'Pending' },
    { id:'ORD-005', cusName:'Vikram Sharma',  items:['Eggs','Sugar','Dal'],    amount:190, timestamp: Date.now()-600000,  status:'Rejected' },
    { id:'ORD-006', cusName:'Anjali Gupta',   items:['Milk','Rice'],           amount:340, timestamp: Date.now()-300000,  status:'Pending' }
];

class ApiService {
    // Standard API helper to make request
    static async request(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        const authToken = localStorage.getItem('freshmart_session') || sessionStorage.getItem('freshmart_session');
        let parsedSession = null;
        try {
            parsedSession = authToken ? JSON.parse(authToken) : null;
        } catch (error) {
            console.warn('Invalid session JSON:', error);
        }

        const headers = {
            'Content-Type': 'application/json',
            ...(parsedSession?.token ? { Authorization: `Bearer ${parsedSession.token}` } : {}),
            ...(options.headers || {})
        };
        
        try {
            const response = await fetch(url, { ...options, headers });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || `HTTP error! status: ${response.status}`);
            }
            const contentType = response.headers.get('content-type') || '';
            if (contentType.includes('application/json')) {
                return await response.json();
            }
            return await response.text();
        } catch (error) {
            console.error(`API Request to ${endpoint} failed:`, error);
            showToast(`Backend connection failed. Check your Python API!`, 'danger');
            throw error;
        }
    }

    // Get all inventory
    static async getInventory() {
        if (!USE_MOCK_API) {
            return await this.request('/inventory');
        }
        
        if (!localStorage.getItem('freshmart_inventory')) {
            localStorage.setItem('freshmart_inventory', JSON.stringify(DEFAULT_INVENTORY));
        }
        return JSON.parse(localStorage.getItem('freshmart_inventory'));
    }

    // Save full inventory list (mock only)
    static saveMockInventory(list) {
        localStorage.setItem('freshmart_inventory', JSON.stringify(list));
    }

    // Add new inventory item
    static async addInventoryItem(item) {
        if (!USE_MOCK_API) {
            return await this.request('/inventory', {
                method: 'POST',
                body: JSON.stringify(item)
            });
        }
        
        const list = await this.getInventory();
        const newId = list.length > 0 ? Math.max(...list.map(x => x.id)) + 1 : 1;
        const newItem = { id: newId, ...item };
        list.push(newItem);
        this.saveMockInventory(list);
        return newItem;
    }

    // Update existing inventory item
    static async updateInventoryItem(id, updatedFields) {
        if (!USE_MOCK_API) {
            return await this.request(`/inventory/${id}`, {
                method: 'PUT',
                body: JSON.stringify(updatedFields)
            });
        }
        
        const list = await this.getInventory();
        const index = list.findIndex(x => x.id === id);
        if (index === -1) throw new Error("Item not found");
        list[index] = { ...list[index], ...updatedFields };
        this.saveMockInventory(list);
        return list[index];
    }

    // Delete inventory item
    static async deleteInventoryItem(id) {
        if (!USE_MOCK_API) {
            return await this.request(`/inventory/${id}`, {
                method: 'DELETE'
            });
        }
        
        const list = await this.getInventory();
        const filtered = list.filter(x => x.id !== id);
        this.saveMockInventory(filtered);
        return true;
    }

    // Get all orders
    static async getOrders() {
        if (!USE_MOCK_API) {
            return await this.request('/orders');
        }
        
        if (!localStorage.getItem('freshmart_orders')) {
            localStorage.setItem('freshmart_orders', JSON.stringify(DEFAULT_ORDERS));
        }
        return JSON.parse(localStorage.getItem('freshmart_orders'));
    }

    // Save full order list (mock only)
    static saveMockOrders(list) {
        localStorage.setItem('freshmart_orders', JSON.stringify(list));
    }

    // Create a new order (for simulation)
    static async createOrder(order) {
        if (!USE_MOCK_API) {
            return await this.request('/orders', {
                method: 'POST',
                body: JSON.stringify(order)
            });
        }
        
        const list = await this.getOrders();
        list.push(order);
        this.saveMockOrders(list);
        return order;
    }

    // Update order status
    static async updateOrderStatus(id, status) {
        if (!USE_MOCK_API) {
            return await this.request(`/orders/${id}/status`, {
                method: 'PUT',
                body: JSON.stringify({ status })
            });
        }
        
        const list = await this.getOrders();
        const index = list.findIndex(x => x.id === id);
        if (index === -1) throw new Error("Order not found");
        list[index].status = status;
        this.saveMockOrders(list);
        return list[index];
    }
}

// ══════════════════════════════════════════════════
// GLOBAL CACHED STATE
// ══════════════════════════════════════════════════
let inventory = [];
let orders = [];

let nextId = 7;
let deliverySteps = {}; // orderId → selected step
let stockFilter = 'all'; // 'all' | 'in' | 'out'
let currentOrderFilter = 'all';
let searchQuery = '';
let selectedEmoji = '🍎'; // default for forms
let selectedImage = null;  // base64 data URL for product image

const customerNames = ['Rajesh','Priya','Amit','Neha','Vikram','Anjali','Rohan','Zara','Suresh','Divya','Kiran','Meera'];
const STEPS = ['Accepted','Packing','Out for Delivery','Delivered'];

// ══════════════════════════════════════════════════
// SOUND & UTILS
// ══════════════════════════════════════════════════
function playBeep(freq=800, dur=0.3) {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.value = freq; osc.type = 'sine';
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + dur);
        osc.start(); osc.stop(ctx.currentTime + dur);
    } catch(e) {}
}

function showToast(msg, type='') {
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.innerHTML = `<i class="fa-solid fa-${type==='success'?'check-circle':type==='danger'?'times-circle':'info-circle'}"></i> ${msg}`;
    const tc = document.getElementById('toast-container');
    if (tc) {
        tc.appendChild(t);
        setTimeout(() => t.remove(), 3100);
    }
}

// ══════════════════════════════════════════════════
// TAB SWITCHING
// ══════════════════════════════════════════════════
function switchTab(name) {
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.querySelectorAll('.mobile-nav-item').forEach(n => n.classList.remove('active'));

    document.getElementById(name + 'Tab').classList.add('active');
    document.querySelectorAll(`[data-tab="${name}"]`).forEach(el => el.classList.add('active'));

    const renders = { inventory: renderInventory, orders: renderOrders, earnings: renderEarnings, active: renderActive };
    renders[name]?.();
}

// ══════════════════════════════════════════════════
// STATE SYNCHRONIZATION
// ══════════════════════════════════════════════════
async function loadStateFromService() {
    try {
        inventory = await ApiService.getInventory();
        orders = await ApiService.getOrders();
    } catch(err) {
        console.error("Failed to sync state from ApiService:", err);
    }
}

async function refreshAll() {
    await loadStateFromService();
    const active = document.querySelector('.tab-content.active')?.id?.replace('Tab','');
    if (active === 'inventory') renderInventory();
    else if (active === 'orders') renderOrders();
    else if (active === 'earnings') renderEarnings();
    else if (active === 'active') renderActive();
    updateBadges();
}

function updateBadges() {
    const pending = orders.filter(o => o.status === 'Pending').length;

    ['notifCount','sideNavBadge'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.textContent = pending;
            el.classList.toggle('visible', pending > 0);
        }
    });

    const mob = document.getElementById('mobileNavBadge');
    if (mob) {
        mob.textContent = pending;
        mob.classList.toggle('visible', pending > 0);
    }

    // sidebar mini stats
    const delivered = orders.filter(o => o.status === 'Delivered');
    const total = delivered.reduce((s,o) => s + o.amount, 0);
    
    const se = document.getElementById('sidebarEarnings');
    if (se) se.textContent = '₹' + total.toLocaleString('en-IN');
    
    const soc = document.getElementById('sidebarOrderCount');
    if (soc) soc.textContent = delivered.length + ' delivered';
}

function handleSearch(val) {
    searchQuery = val.toLowerCase().trim();
    const active = document.querySelector('.tab-content.active')?.id?.replace('Tab','');
    if (active === 'inventory') renderInventory();
    else if (active === 'orders') renderOrders();
}

// ══════════════════════════════════════════════════
// TAB 1: INVENTORY MANAGEMENT
// ══════════════════════════════════════════════════
const stockFilterLabels = { all:'All Items', in:'In Stock', out:'Out of Stock' };
const stockFilterCycle  = { all:'in', in:'out', out:'all' };

function cycleStockFilter() {
    stockFilter = stockFilterCycle[stockFilter];
    document.getElementById('stockFilterBtn').innerHTML = `${stockFilterLabels[stockFilter]} <i class="fa-solid fa-chevron-down"></i>`;
    renderInventory();
}

function renderInventory() {
    let items = [...inventory];
    if (stockFilter === 'in')  items = items.filter(p => p.inStock);
    if (stockFilter === 'out') items = items.filter(p => !p.inStock);
    if (searchQuery) items = items.filter(p => p.name.toLowerCase().includes(searchQuery));

    const grid = document.getElementById('inventoryGrid');
    if (!grid) return;
    
    if (!items.length) {
        grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-state-icon">📦</div><div class="empty-state-text">No items found</div></div>`;
        return;
    }

    grid.innerHTML = items.map(p => {
        const visual = p.image
            ? `<img class="product-thumb" src="${p.image}" alt="${p.name}">`
            : p.emoji;
        return `
        <div class="product-card">
            <div class="product-img-wrap">
                ${visual}
                <button class="edit-card-btn" onclick="openEditModal(${p.id})" title="Edit product">
                    <i class="fa-solid fa-pen"></i>
                </button>
                <span class="stock-pill ${p.inStock ? 'in-stock' : 'out-stock'}" onclick="toggleStock(${p.id})">
                    ${p.inStock ? '● In Stock' : '○ Out'}
                </span>
            </div>
            <div class="product-body">
                <div class="product-name">${p.name}</div>
                <div class="product-meta">
                    <div class="product-price">₹${p.price}</div>
                    <div class="product-stock-qty" title="Available stock">${p.quantity} ${p.unit}</div>
                </div>
                <div class="product-stock-toggle">
                    <button class="toggle-btn ${p.inStock ? 'in' : 'out'}" onclick="toggleStock(${p.id})">
                        ${p.inStock ? '<i class="fa-solid fa-toggle-on"></i> Mark Out of Stock' : '<i class="fa-solid fa-toggle-off"></i> Mark In Stock'}
                    </button>
                </div>
            </div>
        </div>
    `}).join('');
}

async function toggleStock(id) {
    const p = inventory.find(x => x.id === id);
    if (!p) return;
    const newStockState = !p.inStock;
    const newQty = newStockState ? 10 : 0;
    
    try {
        await ApiService.updateInventoryItem(id, { inStock: newStockState, quantity: newQty });
        showToast(`${p.name} marked ${newStockState ? 'In Stock' : 'Out of Stock'}`, newStockState ? 'success' : 'danger');
        await refreshAll();
    } catch(err) {
        console.error("Failed to toggle stock:", err);
    }
}

// ══════════════════════════════════════════════════
// MODAL EVENTS & CRUD CONTROLLER
// ══════════════════════════════════════════════════
function openAddModal() {
    document.getElementById('modalTitle').innerHTML = '<i class="fa-solid fa-box-open"></i> Add New Product';
    document.getElementById('productId').value = '';
    document.getElementById('productName').value = '';
    document.getElementById('productPrice').value = '';
    document.getElementById('productQty').value = '';
    document.getElementById('productUnit').value = 'kg';
    document.getElementById('productEmojiInput').value = '';
    document.getElementById('deleteProductBtn').style.display = 'none';
    document.getElementById('saveProductBtn').textContent = 'Save Product';
    
    // Reset image upload
    resetImageUploadUI();
    
    // Select default suggested emoji
    selectSuggestedEmoji('🍎', document.querySelector('#modalEmojiGrid .emoji-btn'));
    
    updateLivePreview();
    document.getElementById('productModal').classList.add('active');
}

function openEditModal(id) {
    const p = inventory.find(x => x.id === id);
    if (!p) return;
    
    document.getElementById('modalTitle').innerHTML = '<i class="fa-solid fa-pen"></i> Edit Product';
    document.getElementById('productId').value = p.id;
    document.getElementById('productName').value = p.name;
    document.getElementById('productPrice').value = p.price;
    document.getElementById('productQty').value = p.quantity;
    document.getElementById('productUnit').value = p.unit;
    document.getElementById('deleteProductBtn').style.display = 'block';
    document.getElementById('saveProductBtn').textContent = 'Update Product';
    
    // Check if current emoji is in suggestion grid
    let matchFound = false;
    const gridBtns = document.querySelectorAll('#modalEmojiGrid .emoji-btn');
    gridBtns.forEach(btn => {
        if (btn.textContent.trim() === p.emoji) {
            selectSuggestedEmoji(p.emoji, btn);
            matchFound = true;
        }
    });
    
    if (!matchFound) {
        document.getElementById('productEmojiInput').value = p.emoji;
        selectCustomEmoji(p.emoji);
    } else {
        document.getElementById('productEmojiInput').value = '';
    }
    
    // Load existing product image if any
    if (p.image) {
        selectedImage = p.image;
        showImagePreview(p.image);
    } else {
        resetImageUploadUI();
    }
    
    updateLivePreview();
    document.getElementById('productModal').classList.add('active');
}

function closeProductModal(event) {
    if (event) event.preventDefault();
    document.getElementById('productModal').classList.remove('active');
}

function selectSuggestedEmoji(emoji, btnEl) {
    selectedEmoji = emoji;
    document.querySelectorAll('#modalEmojiGrid .emoji-btn').forEach(btn => btn.classList.remove('selected'));
    if (btnEl) btnEl.classList.add('selected');
    updateLivePreview();
}

function selectCustomEmoji(val) {
    const emojiStr = val.trim();
    if (emojiStr) {
        selectedEmoji = emojiStr;
        // remove selected highlight from suggestions grid
        document.querySelectorAll('#modalEmojiGrid .emoji-btn').forEach(btn => btn.classList.remove('selected'));
        updateLivePreview();
    }
}

// ══════════════════════════════════════════════════
// IMAGE UPLOAD HANDLER
// ══════════════════════════════════════════════════
const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2 MB
const MAX_THUMB_WIDTH = 400; // compress to save localStorage space

function handleImageSelect(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    processImageFile(file);
}

function processImageFile(file) {
    if (!file.type.startsWith('image/')) {
        showToast('Please select a valid image file', 'danger');
        return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
        showToast('Image must be under 2 MB', 'danger');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        // Compress/resize image to save localStorage quota
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let w = img.width, h = img.height;
            if (w > MAX_THUMB_WIDTH) {
                h = Math.round(h * MAX_THUMB_WIDTH / w);
                w = MAX_THUMB_WIDTH;
            }
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, w, h);
            selectedImage = canvas.toDataURL('image/jpeg', 0.82);
            showImagePreview(selectedImage);
            updateLivePreview();
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function showImagePreview(dataUrl) {
    const placeholder = document.getElementById('imageUploadPlaceholder');
    const preview = document.getElementById('imageUploadPreview');
    const previewImg = document.getElementById('imagePreviewImg');
    if (placeholder) placeholder.style.display = 'none';
    if (preview) { preview.style.display = 'flex'; }
    if (previewImg) previewImg.src = dataUrl;
}

function removeProductImage(event) {
    event.stopPropagation();
    selectedImage = null;
    const placeholder = document.getElementById('imageUploadPlaceholder');
    const preview = document.getElementById('imageUploadPreview');
    const fileInput = document.getElementById('productImageInput');
    if (placeholder) placeholder.style.display = 'flex';
    if (preview) preview.style.display = 'none';
    if (fileInput) fileInput.value = '';
    updateLivePreview();
}

function resetImageUploadUI() {
    selectedImage = null;
    const placeholder = document.getElementById('imageUploadPlaceholder');
    const preview = document.getElementById('imageUploadPreview');
    const fileInput = document.getElementById('productImageInput');
    if (placeholder) placeholder.style.display = 'flex';
    if (preview) preview.style.display = 'none';
    if (fileInput) fileInput.value = '';
}

function setupImageDropZone() {
    const zone = document.getElementById('imageUploadZone');
    if (!zone) return;

    zone.addEventListener('dragover', (e) => {
        e.preventDefault();
        zone.classList.add('drag-over');
    });
    zone.addEventListener('dragleave', () => {
        zone.classList.remove('drag-over');
    });
    zone.addEventListener('drop', (e) => {
        e.preventDefault();
        zone.classList.remove('drag-over');
        const file = e.dataTransfer.files?.[0];
        if (file) processImageFile(file);
    });
}

function updateLivePreview() {
    const name = document.getElementById('productName').value || 'Product Preview';
    const price = Number(document.getElementById('productPrice').value) || 0;
    const qty = Number(document.getElementById('productQty').value) || 0;
    const unit = document.getElementById('productUnit').value;
    const inStock = qty > 0;
    
    const previewContainer = document.getElementById('livePreviewContainer');
    if (!previewContainer) return;

    const visualContent = selectedImage
        ? `<img class="product-thumb" src="${selectedImage}" alt="Product">`
        : selectedEmoji;
    
    previewContainer.innerHTML = `
        <div class="product-card">
            <div class="product-img-wrap">
                ${visualContent}
                <span class="stock-pill ${inStock ? 'in-stock' : 'out-stock'}">
                    ${inStock ? '● In Stock' : '○ Out'}
                </span>
            </div>
            <div class="product-body">
                <div class="product-name">${name}</div>
                <div class="product-meta">
                    <div class="product-price">₹${price}</div>
                    <div class="product-stock-qty">${qty} ${unit}</div>
                </div>
                <div class="product-stock-toggle">
                    <button type="button" class="toggle-btn ${inStock ? 'in' : 'out'}">
                        ${inStock ? '<i class="fa-solid fa-toggle-on"></i> In Stock' : '<i class="fa-solid fa-toggle-off"></i> Out of Stock'}
                    </button>
                </div>
            </div>
        </div>
    `;
}

async function handleProductSubmit(event) {
    event.preventDefault();
    
    const idVal = document.getElementById('productId').value;
    const name = document.getElementById('productName').value.trim();
    const price = Number(document.getElementById('productPrice').value);
    const quantity = Number(document.getElementById('productQty').value);
    const unit = document.getElementById('productUnit').value;
    const inStock = quantity > 0;
    
    const productPayload = {
        name,
        price,
        quantity,
        unit,
        emoji: selectedEmoji,
        image: selectedImage || null,
        inStock
    };
    
    try {
        if (idVal) {
            // Edit mode
            const id = Number(idVal);
            await ApiService.updateInventoryItem(id, productPayload);
            showToast(`${name} updated successfully!`, 'success');
        } else {
            // Add mode
            await ApiService.addInventoryItem(productPayload);
            showToast(`${name} added to inventory!`, 'success');
        }
        closeProductModal();
        await refreshAll();
    } catch(err) {
        showToast("Error saving product details", "danger");
        console.error(err);
    }
}

async function handleProductDelete() {
    const idVal = document.getElementById('productId').value;
    if (!idVal) return;
    
    const id = Number(idVal);
    const p = inventory.find(x => x.id === id);
    if (!p) return;
    
    if (confirm(`Are you sure you want to delete "${p.name}"?`)) {
        try {
            await ApiService.deleteInventoryItem(id);
            showToast(`${p.name} deleted from catalog`, 'success');
            closeProductModal();
            await refreshAll();
        } catch(err) {
            showToast("Failed to delete product", "danger");
            console.error(err);
        }
    }
}

// ══════════════════════════════════════════════════
// TAB 2: ORDER HISTORICAL LIST
// ══════════════════════════════════════════════════
function setOrderFilter(val, el) {
    currentOrderFilter = val;
    document.querySelectorAll('#orderFilterRow .filter-pill').forEach(p => p.classList.remove('active'));
    el.classList.add('active');
    renderOrders();
}

function renderOrders() {
    let list = [...orders].sort((a,b) => b.timestamp - a.timestamp);
    if (currentOrderFilter !== 'all') list = list.filter(o => o.status === currentOrderFilter);
    if (searchQuery) list = list.filter(o =>
        o.id.toLowerCase().includes(searchQuery) ||
        o.cusName.toLowerCase().includes(searchQuery) ||
        o.items.some(i => i.toLowerCase().includes(searchQuery))
    );

    const el = document.getElementById('ordersList');
    if (!el) return;
    
    if (!list.length) {
        el.innerHTML = `<div class="empty-state"><div class="empty-state-icon">🛒</div><div class="empty-state-text">No orders found</div></div>`;
        return;
    }

    el.innerHTML = list.map(o => {
        const accentClass = `accent-${o.status.toLowerCase()}`;
        const badgeClass  = { Delivered:'badge-info', Accepted:'badge-success', Rejected:'badge-danger', Pending:'badge-warning' }[o.status] || 'badge-warning';
        const time = new Date(o.timestamp).toLocaleString('en-IN', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' });
        return `
            <div class="order-card">
                <div class="order-accent ${accentClass}"></div>
                <div class="order-top">
                    <div class="order-id">${o.id}</div>
                    <div class="order-time">${time}</div>
                </div>
                <div class="order-customer">Customer: <strong>${o.cusName}</strong></div>
                <div class="order-items-list"><i class="fa-solid fa-basket-shopping" style="color:var(--text-muted);font-size:.8rem"></i> ${o.items.join(', ')}</div>
                <div class="order-footer">
                    <div class="order-amount">₹${o.amount}</div>
                    <span class="badge ${badgeClass}">${o.status}</span>
                </div>
            </div>
        `;
    }).join('');
}

// ══════════════════════════════════════════════════
// TAB 3: REVENUE & EARNINGS REPORTS
// ══════════════════════════════════════════════════
function renderEarnings() {
    const delivered = orders.filter(o => o.status === 'Delivered');
    const accepted  = orders.filter(o => o.status === 'Accepted');
    const rejected  = orders.filter(o => o.status === 'Rejected');
    const total     = delivered.reduce((s,o) => s + o.amount, 0);

    const el = document.getElementById('earningsContent');
    if (!el) return;
    
    el.innerHTML = `
        <div class="earnings-hero">
            <div class="earnings-label">Total Earnings (Delivered Orders)</div>
            <div class="earnings-total">₹${total.toLocaleString('en-IN')}</div>
            <div class="earnings-stats">
                <div class="earnings-stat">
                    <div class="earnings-stat-label">Total Orders</div>
                    <div class="earnings-stat-val">${orders.length}</div>
                </div>
                <div class="earnings-stat">
                    <div class="earnings-stat-label">Accepted</div>
                    <div class="earnings-stat-val">${accepted.length + delivered.length}</div>
                </div>
                <div class="earnings-stat">
                    <div class="earnings-stat-label">Rejected</div>
                    <div class="earnings-stat-val">${rejected.length}</div>
                </div>
            </div>
        </div>

        <div class="receipts-section">
            <div class="receipts-header">
                <h3>💼 Completed Orders</h3>
                <span class="badge badge-success">${delivered.length} delivered</span>
            </div>
            ${delivered.length === 0
                ? `<div class="empty-state"><div class="empty-state-icon">📭</div><div class="empty-state-text">No completed orders yet</div></div>`
                : delivered.map(o => `
                    <div class="receipt-row">
                        <div class="receipt-ord-id">${o.id}</div>
                        <div class="receipt-items">${o.items.join(', ')}</div>
                        <div class="receipt-amount">₹${o.amount}</div>
                    </div>
                `).join('')
            }
        </div>
    `;
}

// ══════════════════════════════════════════════════
// TAB 4: ACTIVE DELIVERIES
// ══════════════════════════════════════════════════
function renderActive() {
    const active = orders.filter(o => o.status === 'Pending' || o.status === 'Accepted');
    const el = document.getElementById('activeList');
    if (!el) return;

    if (!active.length) {
        el.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📭</div><div class="empty-state-text">No active orders right now</div></div>`;
        return;
    }

    el.innerHTML = active.map(o => {
        const time = new Date(o.timestamp).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' });
        const accentClass = o.status === 'Accepted' ? 'accent-accepted' : 'accent-pending';

        if (o.status === 'Pending') {
            return `
                <div class="order-card" id="card-${o.id}">
                    <div class="order-accent ${accentClass}"></div>
                    <div class="order-top">
                        <div class="order-id">${o.id}</div>
                        <div class="order-time">${time}</div>
                    </div>
                    <div class="order-customer">Customer: <strong>${o.cusName}</strong></div>
                    <div class="order-items-list"><i class="fa-solid fa-basket-shopping" style="color:var(--text-muted);font-size:.8rem"></i> ${o.items.join(', ')}</div>
                    <div class="order-footer" style="margin-bottom:0">
                        <div class="order-amount">₹${o.amount}</div>
                        <span class="badge badge-warning pulse">Pending</span>
                    </div>
                    <div class="order-actions">
                        <button class="btn btn-accept" onclick="acceptOrder('${o.id}')">
                            <i class="fa-solid fa-check"></i> Accept
                        </button>
                        <button class="btn btn-cancel" onclick="rejectOrder('${o.id}')">
                            <i class="fa-solid fa-times"></i> Cancel
                        </button>
                    </div>
                </div>
            `;
        } else {
            const sel = deliverySteps[o.id] || 'Accepted';
            return `
                <div class="order-card" id="card-${o.id}">
                    <div class="order-accent ${accentClass}"></div>
                    <div class="order-top">
                        <div class="order-id">${o.id}</div>
                        <div class="order-time">${time}</div>
                    </div>
                    <div class="order-customer">Customer: <strong>${o.cusName}</strong></div>
                    <div class="order-items-list"><i class="fa-solid fa-basket-shopping" style="color:var(--text-muted);font-size:.8rem"></i> ${o.items.join(', ')}</div>
                    <div class="order-footer" style="margin-bottom:0">
                        <div class="order-amount">₹${o.amount}</div>
                        <span class="badge badge-success">Accepted</span>
                    </div>
                    <div class="stepper-wrap">
                        <div class="stepper-label">Update Delivery Status</div>
                        <div class="stepper-options">
                            ${STEPS.map(s => `
                                <button class="step-btn ${sel === s ? 'selected' : ''}"
                                    onclick="selectStep('${o.id}','${s}')">
                                    ${s}
                                </button>
                            `).join('')}
                        </div>
                        <button class="btn btn-update" onclick="updateDelivery('${o.id}')">
                            <i class="fa-solid fa-paper-plane"></i> Update Status
                        </button>
                    </div>
                </div>
            `;
        }
    }).join('');
}

function selectStep(orderId, step) {
    deliverySteps[orderId] = step;
    renderActive();
}

async function acceptOrder(orderId) {
    try {
        await ApiService.updateOrderStatus(orderId, 'Accepted');
        deliverySteps[orderId] = 'Accepted';
        playBeep(880, 0.25);
        showToast(`${orderId} accepted!`, 'success');
        await refreshAll();
    } catch(err) {
        showToast("Error updating order status", "danger");
        console.error(err);
    }
}

function rejectOrder(orderId) {
    const card = document.getElementById(`card-${orderId}`);
    if (card) {
        card.classList.add('card-removing');
        setTimeout(async () => {
            try {
                await ApiService.updateOrderStatus(orderId, 'Rejected');
                showToast(`${orderId} rejected`, 'danger');
                await refreshAll();
            } catch(err) {
                showToast("Failed to reject order", "danger");
                console.error(err);
            }
        }, 300);
    }
}

async function updateDelivery(orderId) {
    const step = deliverySteps[orderId];
    if (!step) return;

    if (step === 'Delivered') {
        const card = document.getElementById(`card-${orderId}`);
        if (card) {
            card.classList.add('card-removing');
            setTimeout(async () => {
                try {
                    await ApiService.updateOrderStatus(orderId, 'Delivered');
                    delete deliverySteps[orderId];
                    playBeep(660, 0.4);
                    showToast(`${orderId} marked as Delivered 🎉`, 'success');
                    await refreshAll();
                } catch(err) {
                    showToast("Failed to update status to Delivered", "danger");
                    console.error(err);
                }
            }, 300);
        }
    } else {
        try {
            await ApiService.updateOrderStatus(orderId, 'Accepted'); // keep status accepted, change step cached
            deliverySteps[orderId] = step;
            showToast(`${orderId} → ${step}`, 'success');
            await refreshAll();
        } catch(err) {
            showToast("Failed to update active step", "danger");
            console.error(err);
        }
    }
}

// ══════════════════════════════════════════════════
// NEW ORDER SIMULATION
// ══════════════════════════════════════════════════
async function generateRandomOrder() {
    if (inventory.length === 0) return;
    
    nextId++;
    const cusName = customerNames[Math.floor(Math.random() * customerNames.length)];
    const count = Math.floor(Math.random() * 3) + 1;
    const itemSet = new Set();
    while (itemSet.size < count) {
        itemSet.add(inventory[Math.floor(Math.random() * inventory.length)].name);
    }
    const items = [...itemSet];
    const amount = items.reduce((s, name) => {
        const p = inventory.find(x => x.name === name);
        return s + (p ? p.price : 0);
    }, 0);

    const newOrder = {
        id: `ORD-${String(nextId).padStart(3,'0')}`,
        cusName,
        items,
        amount,
        timestamp: Date.now(),
        status: 'Pending'
    };

    try {
        await ApiService.createOrder(newOrder);
        playBeep(800, 0.35);
        showToast(`New order from ${cusName}!`, 'success');
        await refreshAll();
    } catch(err) {
        console.error("Order simulation failed:", err);
    }
}

// ══════════════════════════════════════════════════
// INITIALIZATION
// ══════════════════════════════════════════════════
async function init() {
    await refreshAll();
    
    // Setup drag-and-drop for image upload zone
    setupImageDropZone();
    
    // Periodically simulate incoming orders from users
    setInterval(generateRandomOrder, 15000);
}

// Start Dashboard — called by login controller after authentication
// init();

// Expose handlers to the inline onclick/onsubmit attributes used by the page.
Object.assign(window, {
    switchTab,
    handleSearch,
    cycleStockFilter,
    openAddModal,
    openEditModal,
    closeProductModal,
    selectSuggestedEmoji,
    selectCustomEmoji,
    handleImageSelect,
    removeProductImage,
    updateLivePreview,
    handleProductSubmit,
    handleProductDelete,
    setOrderFilter,
    selectStep,
    acceptOrder,
    rejectOrder,
    updateDelivery,
    toggleStock,
    init,
    showToast,
    refreshAll,
    loadStateFromService,
    updateBadges,
    renderInventory,
    renderOrders,
    renderEarnings,
    renderActive,
    openShopNameModal,
    closeShopNameModal,
    saveShopName,
    openCredentialsModal,
    closeCredentialsModal,
    saveCredentials
});
window.__shopkeeperScriptLoaded = true;
console.log('shopkeeper.js executed');
