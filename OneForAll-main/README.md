# 🛒 14All (Local Grocery Ordering Platform)<br>
<p>An AI-powered hyperlocal marketplace connecting customers with nearby kirana stores using real-time order intelligence and WhatsApp-powered communication "Vocal for Local" marketplace boosting neighborhood commerce through predictive business analytics, real-time service tracking, civic reporting, and hyper-local community engagement.</p>

Python HTML CSS JavaScript Status<br>
🚀 Live Demo<br>
🌐 Customer Flow: customer.html<br>
🌐 Shopkeeper Dashboard: shopkeeper.html<br>

📌 Overview<br>
Local Grocery Ordering Platform is a lightweight hyperlocal commerce demo that combines:<br>
🛍 Nearby shop discovery<br>
📦 Real-time cart & ordering<br>
📲 WhatsApp integration (click-to-chat)<br>
🧪 Shopkeeper order simulation<br>
📍 Location-based shop listing<br>

Users can:<br>
Browse shops near their area<br>
View products with prices & quantity controls<br>
Add items to cart<br>
Checkout with UPI ID display<br>
Receive order confirmation with success animation<br>

Shopkeepers can:<br>
See incoming orders slide in automatically<br>
Accept or reject orders<br>
Hear sound alerts on new orders<br>
View all order history<br>

<h2>✨ Features</h2>
<h3>🛍 Nearby Shop Discovery</h3>
The platform displays 3 mock kirana stores with:<br>
Shop name & address<br>
Distance from user (in km)<br>
Star rating<br>
“View Store” button<br>
<h3>📦 Product Browsing & Cart</h3>
Each shop detail page shows product cards with:<br>
Product name & price<br>
Emoji / colored placeholder image<br>
Add (+), quantity counter, and minus (-) buttons<br>
Cart badge updates in real time with bounce animation<br>
<h3>🧾 Checkout with UPI Display</h3>
The checkout screen shows:<br>
Pre-filled delivery address (editable)<br>
UPI ID of the shopkeeper (e.g. ramesh@paytm)<br>
Green “Place Order” button<br>
On success:<br>
✅ Checkmark animation<br>
🎉 “Order Placed!” with order ID & delivery time<br>
📞 “Call Shop” button (mock)<br>
📲 WhatsApp Click-to-Chat<br>
Every shop detail page includes a “Chat on WhatsApp” button that opens:<br>
https://wa.me/91XXXXXXXXXX?text=Hi...<br>
No API needed – works immediately on any device.<br>
🧪 Shopkeeper Dashboard (Demo)<br>
The dashboard simulates real-time order inflow:<br>
Orders arrive every 5 seconds with a slide-in animation<br>
Each card shows customer name, items, total, and address<br>
Accept (✅) and Reject (❌) buttons<br>
Sound notification using Web Audio API<br>
Empty state when no orders remain<br>

<h2>🖥 Frontend</h2>
<p>Built using:</p>
<ul>
  <li>HTML5</li>
  <li>CSS3</li>
  <li>Vanilla JavaScript</li>
</ul>
<p><strong>Frontend features:</strong></p>
<ul>
  <li>Mobile-first responsive design (360px base)</li>
  <li>Soft green/white glassmorphism theme</li>
  <li>Rounded corners, subtle shadows, smooth transitions</li>
  <li>Floating cart icon with badge</li>
  <li>Bottom navigation bar (Home, Cart, Orders, Profile)</li>
  <li>Loading spinners &amp; empty state messages</li>
</ul>

<hr>

<h2>⚙ Backend</h2>
<p>Currently a mock frontend-only demo.</p>
<p><strong>Planned future backend:</strong></p>
<ul>
  <li>Python (Flask) or Node.js</li>
  <li>Real-time order push via WebSockets</li>
  <li>Twilio WhatsApp Business API for automated notifications</li>
  <li>User authentication via phone OTP</li>
</ul>

<hr>

<h2>🧠 Tech Stack</h2>
<table>
  <thead>
    <tr>
      <th>Technology</th>
      <th>Purpose</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>HTML5 / CSS3</td>
      <td>Frontend structure &amp; styling</td>
    </tr>
    <tr>
      <td>Vanilla JavaScript</td>
      <td>App logic &amp; navigation</td>
    </tr>
    <tr>
      <td>Web Audio API</td>
      <td>New order notification beep</td>
    </tr>
    <tr>
      <td>OpenStreetMap (planned)</td>
      <td>Live shop location mapping</td>
    </tr>
    <tr>
      <td>Twilio API (planned)</td>
      <td>WhatsApp order notifications</td>
    </tr>
    <tr>
      <td>Render / Vercel (future)</td>
      <td>Deployment</td>
    </tr>
  </tbody>
</table>

<hr>

<h2>📂 Project Structure</h2>
<pre>
local-grocery-platform/
│
├── customer.html     # Customer ordering flow (single file)
├── shopkeeper.html   # Shopkeeper order dashboard (single file)
│
└── README.md         # This file
</pre>

<hr>

<h2>🛠 Installation Guide (Demo)</h2>
<ol>
  <li>
    <strong>Clone Repository</strong>
    <pre>git clone https://github.com/your-username/local-grocery-platform.git
cd local-grocery-platform</pre>
  </li>
  <li>
    <strong>Open Demo</strong>
    <p>Simply open the HTML files in any browser:</p>
    <ul>
      <li><code>customer.html</code> → Customer ordering app</li>
      <li><code>shopkeeper.html</code> → Shopkeeper dashboard</li>
    </ul>
    <p>No server, no dependencies required.</p>
    <p>For WhatsApp click-to-chat to work, replace the placeholder numbers in <code>wa.me</code> links with real numbers (works on mobile WhatsApp app).</p>
  </li>
</ol>

<hr>

<h2>🌐 Planned API Endpoints (Future)</h2>

<h3>Customer / Order APIs</h3>
<p><code>POST /api/orders</code></p>
<p><strong>Request</strong></p>
<pre>
{
  "shop_id": "ramesh_kirana",
  "items": [
    { "name": "Milk", "qty": 2, "price": 50 },
    { "name": "Bread", "qty": 1, "price": 35 }
  ],
  "address": "123, Green Apartments, Sector 62",
  "customer_phone": "9876543210"
}
</pre>
<p><strong>Response</strong></p>
<pre>
{
  "success": true,
  "order_id": "ORD-20241005-001",
  "shopkeeper_whatsapp": "ramesh@paytm"
}
</pre>

<h3>Shopkeeper APIs</h3>
<p><code>GET /api/shop/orders?shop_id=ramesh_kirana</code></p>
<p><strong>Response</strong></p>
<pre>
{
  "orders": [
    {
      "id": "ORD-20241005-001",
      "customer": "Amit",
      "items": ["Milk x2", "Bread x1"],
      "total": 135,
      "status": "pending"
    }
  ]
}
</pre>
<p><code>POST /api/orders/accept</code></p>
<p><code>POST /api/orders/reject</code></p>

<hr>

<h2>🚀 Deployment (Future)</h2>
<ul>
  <li><strong>Frontend:</strong> Vercel / Netlify (static)</li>
  <li><strong>Backend:</strong> Render / Railway (Flask/Node)</li>
  <li><strong>Database:</strong> MongoDB / PostgreSQL</li>
  <li><strong>Notifications:</strong> Twilio WhatsApp API</li>
</ul>

<hr>

<h2>📈 Future Improvements</h2>
<ul>
  <li>📲 Real WhatsApp notification using Twilio</li>
  <li>🔐 Phone OTP authentication</li>
  <li>📍 Live location-based shop discovery (map view)</li>
  <li>📊 Order status tracking (Accepted → Packing → Out for delivery)</li>
  <li>💳 Online payment (Razorpay / PhonePe)</li>
  <li>🛒 Shop inventory management with stock counters</li>
  <li>🌟 Rating &amp; review system for shops</li>
  <li>📦 Delivery partner assignment</li>
</ul>

<hr>

<h2>🧠 Business Logic – Shopkeeper Conflict</h2>
<p>The platform uses an open marketplace model:</p>
<ul>
  <li>All shops within delivery range appear to the customer.</li>
  <li>Each shop sets their delivery radius (default 2 km).</li>
  <li>No exclusivity – if two shops serve the same area, both are shown.</li>
  <li>Customer chooses based on price, rating, or distance.</li>
  <li>Future: “Preferred Vendor” badge for high-rated shops.</li>
</ul>
<p>This avoids direct conflict by giving every shop equal visibility while letting customers decide.</p>

<hr>

<h2>🤝 Contributing</h2>
<p>Contributions are welcome.</p>
<p>Please open an issue or pull request for any improvements.</p>

<hr>

<h2>🛡 License</h2>
<p>This project is licensed under the MIT License.</p>

<hr>

<h2>👨‍💻 Authors</h2>
<p>Developed by <strong>Ayan, Jay, Zion, Sarvesh / 14ALL</strong></p>

<hr>

<h2>📞 Support &amp; Community</h2>
<p>💬 For questions, open a GitHub Discussion or Issue.</p>

<hr>

<h2>⭐ Show Your Support</h2>
<p>If this project helped you, please consider:</p>
<ul>
  <li>⭐ Starring this repository</li>
  <li>🍴 Forking it to contribute</li>
  <li>📢 Sharing it with local shopkeepers</li>
  <li>💖 Following for more updates</li>
</ul>
<p>🛠 Contribute improvements – backend integration, WhatsApp API, live location, and more.</p>
