require('dotenv').config();

const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const session = require('express-session');
const rateLimit = require('express-rate-limit');
const nodemailer = require('nodemailer');
const Razorpay = require('razorpay');

const app = express();
const PORT = Number(process.env.PORT || 3000);
const DATA_FILE = path.join(__dirname, 'data', 'orders.json');
const STOCK_FILE = path.join(__dirname, 'data', 'stock.json');
const USERS_FILE = path.join(__dirname, 'data', 'users.json');
const PRODUCTS_FILE = path.join(__dirname, 'data', 'products.json');
const CUSTOMERS_FILE = path.join(__dirname, 'data', 'customers.json');
const REVIEWS_FILE = path.join(__dirname, 'data', 'reviews.json');
const COUPONS_FILE = path.join(__dirname, 'data', 'coupons.json');
const ACTIVITY_FILE = path.join(__dirname, 'data', 'activity.json');
const SETTINGS_FILE = path.join(__dirname, 'data', 'settings.json');
const NOTIFICATIONS_FILE = path.join(__dirname, 'data', 'notifications.json');
const ANALYTICS_FILE = path.join(__dirname, 'data', 'analytics-events.json');
const WHATSAPP_NUMBER = '919372654780';
const WHATSAPP_CLOUD_TOKEN = (process.env.WHATSAPP_CLOUD_TOKEN || '').trim();
const WHATSAPP_PHONE_NUMBER_ID = (process.env.WHATSAPP_PHONE_NUMBER_ID || '').trim();
const WHATSAPP_CLOUD_API_VERSION = (process.env.WHATSAPP_CLOUD_API_VERSION || 'v22.0').trim();
const ADMIN_USERNAME = (process.env.ADMIN_USERNAME || '').trim();
const ADMIN_PASSWORD_HASH = (process.env.ADMIN_PASSWORD_HASH || '').trim();
const SESSION_SECRET = (process.env.SESSION_SECRET || '').trim();
const NODE_ENV = process.env.NODE_ENV || 'development';
const adminEventClients = new Set();

const isProduction = NODE_ENV === 'production';

app.disable('x-powered-by');
if (isProduction) app.set('trust proxy', 1);

if (!ADMIN_USERNAME || !ADMIN_PASSWORD_HASH || !SESSION_SECRET) {
  throw new Error('Missing required env variables: ADMIN_USERNAME, ADMIN_PASSWORD_HASH, SESSION_SECRET');
}

if (!ADMIN_PASSWORD_HASH.startsWith('$2')) {
  throw new Error('ADMIN_PASSWORD_HASH must be a bcrypt hash string.');
}

// Email Service Configuration
const EMAIL_SERVICE = process.env.EMAIL_SERVICE || 'gmail';
const EMAIL_USER = (process.env.EMAIL_USER || '').trim();
const EMAIL_PASSWORD = (process.env.EMAIL_PASSWORD || '').trim();
const SENDER_NAME = 'Pixel Perfect';
const SENDER_EMAIL = EMAIL_USER || 'noreply@pixelperfect.com';

const transporter = nodemailer.createTransport({
  service: EMAIL_SERVICE,
  auth: EMAIL_USER && EMAIL_PASSWORD ? {
    user: EMAIL_USER,
    pass: EMAIL_PASSWORD
  } : undefined
});

// Test email configuration in development
if (NODE_ENV !== 'production' && (!EMAIL_USER || !EMAIL_PASSWORD)) {
  console.log('⚠️  Email service not configured. Set EMAIL_USER and EMAIL_PASSWORD to enable email notifications.');
  console.log('   Emails will be logged to console in development mode.');
}

// Razorpay Payment Gateway Configuration
const RAZORPAY_KEY_ID = (process.env.RAZORPAY_KEY_ID || '').trim();
const RAZORPAY_KEY_SECRET = (process.env.RAZORPAY_KEY_SECRET || '').trim();
let razorpayInstance = null;

if (RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET) {
  try {
    razorpayInstance = new Razorpay({
      key_id: RAZORPAY_KEY_ID,
      key_secret: RAZORPAY_KEY_SECRET
    });
    console.log('✓ Razorpay payment gateway configured');
  } catch (error) {
    console.error('✗ Razorpay configuration error:', error.message);
  }
} else {
  console.log('⚠️  Razorpay not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET for live payments.');
  console.log('   Currently using UPI screenshot and COD fallback.');
}

const createRazorpayOrder = async (amount, orderId, customerEmail) => {
  if (!razorpayInstance) return null;
  
  try {
    const order = await razorpayInstance.orders.create({
      amount: Math.round(amount * 100), // Amount in paise
      currency: 'INR',
      receipt: orderId,
      notes: {
        order_id: orderId,
        customer_email: customerEmail
      }
    });
    return order;
  } catch (error) {
    console.error('Razorpay order creation error:', error.message);
    return null;
  }
};

const verifyRazorpayPayment = (paymentId, orderId, signature) => {
  if (!razorpayInstance) return false;

  try {
    const generatedSignature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');
    const expected = Buffer.from(generatedSignature, 'utf8');
    const received = Buffer.from(signature, 'utf8');
    return expected.length === received.length && crypto.timingSafeEqual(expected, received);
  } catch (error) {
    console.error('Razorpay verification error:', error.message);
    return false;
  }
};

const verifyRazorpayWebhook = (rawBody, signature) => {
  const webhookSecret = (process.env.RAZORPAY_WEBHOOK_SECRET || '').trim();
  if (!webhookSecret || !rawBody || !signature) return false;
  const expected = crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('hex');
  const expectedBuffer = Buffer.from(expected, 'utf8');
  const receivedBuffer = Buffer.from(signature, 'utf8');
  return expectedBuffer.length === receivedBuffer.length && crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
};

const getWhatsAppOrderLink = (order, message) => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hello ${order.customer?.name || 'there'}, ${message} Order: ${order.id}.`)}`;

const sendEmail = async (to, subject, htmlContent) => {
  if (!EMAIL_USER || !EMAIL_PASSWORD) {
    console.log(`📧 [EMAIL] To: ${to}\n   Subject: ${subject}\n   (Email service not configured - logged to console)\n`);
    return { success: false, reason: 'Email service not configured' };
  }

  try {
    const result = await transporter.sendMail({
      from: `${SENDER_NAME} <${SENDER_EMAIL}>`,
      to,
      subject,
      html: htmlContent
    });
    console.log(`✓ Email sent to ${to}: ${subject}`);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error(`✗ Failed to send email to ${to}:`, error.message);
    return { success: false, reason: error.message };
  }
};

const buildOrderConfirmationEmail = (order) => {
  const itemsList = order.items.map(item => 
    `<tr><td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name} (${item.size})</td><td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">₹${item.price}</td><td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">x${item.quantity}</td><td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">₹${item.price * item.quantity}</td></tr>`
  ).join('');

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <div style="background: linear-gradient(135deg, #111111 0%, #1a1a1a 100%); color: #d6b578; padding: 30px; text-align: center;">
        <h1 style="margin: 0; font-size: 28px;">Order Confirmed!</h1>
        <p style="margin: 10px 0 0 0; font-size: 14px;">Thank you for your purchase</p>
      </div>
      
      <div style="padding: 30px; background: #f9f9f9;">
        <p style="margin: 0 0 20px 0; font-size: 16px;">Dear ${order.customer.name},</p>
        
        <p>Your order has been successfully placed. Here are the details:</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #d6b578;">
          <p style="margin: 0 0 10px 0;"><strong>Order ID:</strong> ${order.id}</p>
          <p style="margin: 0 0 10px 0;"><strong>Tracking ID:</strong> ${order.trackingId}</p>
          <p style="margin: 0 0 10px 0;"><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          <p style="margin: 0;"><strong>Estimated Delivery:</strong> ${new Date(order.estimatedDelivery).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        
        <h3 style="margin: 20px 0 10px 0; font-size: 16px; color: #111;">Order Items</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead><tr style="background: #f0f0f0;"><th style="padding: 8px; text-align: left;">Product</th><th style="padding: 8px; text-align: right;">Price</th><th style="padding: 8px; text-align: right;">Qty</th><th style="padding: 8px; text-align: right;">Total</th></tr></thead>
          <tbody>${itemsList}</tbody>
        </table>
        
        <div style="margin: 20px 0; padding: 15px; background: white; border-radius: 8px;">
          <p style="margin: 0 0 8px 0; display: flex; justify-content: space-between;"><span>Subtotal:</span> <strong>₹${order.subtotal}</strong></p>
          ${order.discount > 0 ? `<p style="margin: 0 0 8px 0; display: flex; justify-content: space-between; color: #28a745;"><span>Discount:</span> <strong>-₹${order.discount}</strong></p>` : ''}
          <p style="margin: 0 0 8px 0; display: flex; justify-content: space-between;"><span>Shipping:</span> <strong>₹${order.shipping}</strong></p>
          <p style="margin: 0; padding-top: 8px; border-top: 2px solid #d6b578; display: flex; justify-content: space-between; font-size: 18px; color: #d6b578;"><span>Total:</span> <strong>₹${order.total}</strong></p>
        </div>
        
        <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; font-weight: bold;">📍 Delivery Address</p>
          <p style="margin: 5px 0 0 0; font-size: 14px;">${order.customer.address}<br>${order.customer.city}, ${order.customer.state} ${order.customer.pincode}</p>
        </div>
        
        <div style="background: #e8f4f8; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; font-weight: bold;">💳 Payment Method</p>
          <p style="margin: 5px 0 0 0; font-size: 14px;">${order.customer.paymentMethod === 'UPI' ? 'UPI Transfer (Verification Pending)' : 'Cash on Delivery (COD)'}</p>
        </div>
        
        <p style="margin: 20px 0; padding: 15px; background: #d6b578; color: white; border-radius: 8px; text-align: center;">
          <strong>Your order is being prepared with care!</strong> We'll send you a shipping notification as soon as your items are dispatched.
        </p>
        
        <p style="margin: 20px 0 0 0; text-align: center; font-size: 12px; color: #999;">
          Questions? Reply to this email or contact us on WhatsApp: <a href="https://wa.me/919372654780" style="color: #d6b578; text-decoration: none;">919372654780</a>
        </p>
      </div>
      
      <div style="background: #111111; color: #d6b578; padding: 20px; text-align: center; font-size: 12px;">
        <p style="margin: 0;">© 2024 Pixel Perfect. All rights reserved.</p>
      </div>
    </div>
  `;
};

const buildShippingNotificationEmail = (order) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <div style="background: linear-gradient(135deg, #111111 0%, #1a1a1a 100%); color: #d6b578; padding: 30px; text-align: center;">
        <h1 style="margin: 0; font-size: 28px;">📦 Your Order is On the Way!</h1>
      </div>
      
      <div style="padding: 30px; background: #f9f9f9;">
        <p style="margin: 0 0 20px 0; font-size: 16px;">Dear ${order.customer.name},</p>
        
        <p>Great news! Your order has been shipped and is on its way to you.</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #d6b578;">
          <p style="margin: 0 0 10px 0;"><strong>Order ID:</strong> ${order.id}</p>
          <p style="margin: 0 0 10px 0;"><strong>Tracking ID:</strong> ${order.trackingId}</p>
          <p style="margin: 0;"><strong>Estimated Delivery:</strong> ${new Date(order.estimatedDelivery).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        
        <p style="margin: 20px 0; padding: 15px; background: #d6b578; color: white; border-radius: 8px; text-align: center;">
          <strong>Track your order:</strong> Use Tracking ID <strong>${order.trackingId}</strong> to monitor your delivery
        </p>
        
        <p style="margin: 20px 0 0 0; text-align: center; font-size: 12px; color: #999;">
          Need help? Contact us on WhatsApp: <a href="https://wa.me/919372654780" style="color: #d6b578; text-decoration: none;">919372654780</a>
        </p>
      </div>
    </div>
  `;
};

const buildDeliveryConfirmedEmail = (order) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <div style="background: linear-gradient(135deg, #111111 0%, #1a1a1a 100%); color: #d6b578; padding: 30px; text-align: center;">
        <h1 style="margin: 0; font-size: 28px;">✓ Delivered!</h1>
      </div>
      
      <div style="padding: 30px; background: #f9f9f9;">
        <p style="margin: 0 0 20px 0; font-size: 16px;">Dear ${order.customer.name},</p>
        
        <p>Your order has been delivered! We hope you love your Pixel Perfect posters.</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
          <p style="margin: 0;"><strong>Order ID:</strong> ${order.id}</p>
        </div>
        
        <div style="background: #e8f5e9; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; font-weight: bold;">🎨 Love your purchase?</p>
          <p style="margin: 5px 0 0 0; font-size: 14px;">We'd love to hear your feedback! Share your room setup and wall art photos with us.</p>
        </div>
        
        <p style="margin: 20px 0 0 0; text-align: center; font-size: 12px; color: #999;">
          Questions or issues? Contact us: <a href="https://wa.me/919372654780" style="color: #d6b578; text-decoration: none;">WhatsApp Support</a>
        </p>
      </div>
    </div>
  `;
};

app.use(express.json({
  limit: '5mb',
  verify: (req, _res, buffer) => {
    req.rawBody = buffer;
  }
}));
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  if (isProduction) res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    domain: process.env.SESSION_COOKIE_DOMAIN || undefined,
    maxAge: 1000 * 60 * 60 * 8
  }
}));

const ensureDataFile = (filePath, defaultValue) => {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2));
  }
};

const readJsonFile = (filePath, fallback = []) => {
  ensureDataFile(filePath, fallback);
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return fallback;
  }
};

const writeJsonFile = (filePath, data) => {
  ensureDataFile(filePath, []);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

const readOrders = () => readJsonFile(DATA_FILE, []);
const writeOrders = (orders) => writeJsonFile(DATA_FILE, orders);
const readStock = () => readJsonFile(STOCK_FILE, {});
const writeStock = (stock) => writeJsonFile(STOCK_FILE, stock);
const readUsers = () => readJsonFile(USERS_FILE, []);
const writeUsers = (users) => writeJsonFile(USERS_FILE, users);
const readProducts = () => readJsonFile(PRODUCTS_FILE, []);
const writeProducts = (products) => writeJsonFile(PRODUCTS_FILE, products);
const readCustomers = () => readJsonFile(CUSTOMERS_FILE, []);
const writeCustomers = (customers) => writeJsonFile(CUSTOMERS_FILE, customers);
const readReviews = () => readJsonFile(REVIEWS_FILE, []);
const writeReviews = (reviews) => writeJsonFile(REVIEWS_FILE, reviews);
const readCoupons = () => readJsonFile(COUPONS_FILE, []);
const writeCoupons = (coupons) => writeJsonFile(COUPONS_FILE, coupons);
const readActivity = () => readJsonFile(ACTIVITY_FILE, []);
const writeActivity = (activity) => writeJsonFile(ACTIVITY_FILE, activity);
const readSettings = () => readJsonFile(SETTINGS_FILE, {
  storeName: 'Pixel Perfect', currency: 'INR', shippingFee: 50,
  freeShippingThreshold: 200, defaultOrderStatus: 'pending', lowStockThreshold: 5,
  sessionTimeoutHours: 8, notifications: { newOrder: true, lowStock: true }
});
const writeSettings = (settings) => writeJsonFile(SETTINGS_FILE, settings);
const readNotifications = () => readJsonFile(NOTIFICATIONS_FILE, []);
const writeNotifications = (notifications) => writeJsonFile(NOTIFICATIONS_FILE, notifications);
const readAnalyticsEvents = () => readJsonFile(ANALYTICS_FILE, []);
const writeAnalyticsEvents = (events) => writeJsonFile(ANALYTICS_FILE, events);

const ensureDefaultAdmin = async () => {
  const users = readUsers();
  const existing = users.find((user) => String(user.username).toLowerCase() === ADMIN_USERNAME.toLowerCase());

  if (!existing) {
    users.push({
      username: ADMIN_USERNAME,
      passwordHash: ADMIN_PASSWORD_HASH,
      role: 'admin',
      createdAt: new Date().toISOString()
    });
    writeUsers(users);
    return;
  }

  if (!existing.passwordHash || existing.passwordHash !== ADMIN_PASSWORD_HASH) {
    existing.passwordHash = ADMIN_PASSWORD_HASH;
    existing.updatedAt = new Date().toISOString();
    writeUsers(users);
  }
};

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(value || 0);
};

const sanitizeString = (value, fallback = '') => String(value ?? fallback).trim();

const buildWhatsAppMessage = (payload) => {
  const itemLines = payload.items
    .map((item) => `${item.name} x${item.quantity} (${item.size}) - ${formatCurrency(item.price * item.quantity)}`)
    .join('\n');

  const subtotal = payload.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = Number(payload.shipping || 0);
  const discount = Number(payload.discount || 0);
  const total = Number(payload.total ?? subtotal + shipping - discount);

  return `Hello Pixel Perfect,\n\nNew online order received.\n\nOrder ID: ${payload.id || 'Pending'}\n\nCustomer Details:\nName: ${payload.customer.name}\nPhone: ${payload.customer.phone}\nAddress: ${payload.customer.address}\nCity: ${payload.customer.city}\nPincode: ${payload.customer.pincode}\nState: ${payload.customer.state || 'Not provided'}\nPayment Method: ${payload.customer.paymentMethod || 'UPI'}\nPayment Status: ${payload.customer.paymentStatus || 'Pending'}\nNotes: ${payload.customer.note || 'None'}\n\nOrder Items:\n${itemLines}\n\nSubtotal: ${formatCurrency(subtotal)}\nShipping: ${shipping ? formatCurrency(shipping) : 'Free'}\nDiscount: ${discount ? formatCurrency(discount) : 'None'}\nTotal: ${formatCurrency(total)}\n\nPlease confirm the order and delivery details.`;
};

const sendWhatsAppStatusUpdate = async (order, status) => {
  if (!WHATSAPP_CLOUD_TOKEN || !WHATSAPP_PHONE_NUMBER_ID || !order?.customer?.phone) return;

  const phone = sanitizeString(order.customer.phone).replace(/\D/g, '');
  const recipient = phone.length === 10 ? `91${phone}` : phone;
  const statusLabels = {
    whatsapp_contacted: 'WhatsApp contacted',
    payment_pending: 'Payment pending',
    payment_confirmed: 'Payment confirmed',
    confirmed: 'Confirmed',
    processing: 'Processing',
    shipped: 'Shipped',
    delivered: 'Delivered',
    completed: 'Delivered',
    cancelled: 'Cancelled'
  };
  const label = statusLabels[status] || 'Order updated';
  const message = `Pixel Perfect order update\n\nOrder: ${order.id}\nStatus: ${label}\nTotal: ${formatCurrency(order.total)}\n\nTrack your order: ${order.trackingId || order.id}\nFor help, reply to this WhatsApp message.`;

  try {
    const response = await fetch(`https://graph.facebook.com/${WHATSAPP_CLOUD_API_VERSION}/${WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${WHATSAPP_CLOUD_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: recipient,
        type: 'text',
        text: { preview_url: false, body: message }
      })
    });
    if (!response.ok) console.error('WhatsApp Cloud API notification failed:', await response.text());
  } catch (error) {
    console.error('WhatsApp Cloud API notification error:', error.message);
  }
};

const buildAdminEmail = (order) => {
  const itemText = order.items.map((item) => `${item.name} x ${item.quantity} (${item.size})`).join('\n');
  return {
    subject: `Order update: ${order.id}`,
    body: `Order ID: ${order.id}\nCustomer: ${order.customer.name}\nPhone: ${order.customer.phone}\nCity: ${order.customer.city}\nStatus: ${order.status || 'pending'}\nTotal: ${formatCurrency(order.total)}\nItems:\n${itemText}`
  };
};

const escapeCsvValue = (value) => {
  const text = value == null ? '' : String(value);
  return `"${text.replace(/"/g, '""')}"`;
};

const buildOrdersCsv = (orders) => {
  const rows = [
    [
      'Order ID',
      'Date',
      'Customer',
      'Phone',
      'City',
      'Status',
      'Total',
      'Items',
      'Payment Method'
    ]
  ];

  orders.forEach((order) => {
    rows.push([
      order.id,
      new Date(order.createdAt).toLocaleString('en-IN'),
      order.customer?.name || '',
      order.customer?.phone || '',
      order.customer?.city || '',
      order.status || 'pending',
      Number(order.total || 0),
      (order.items || []).map((item) => `${item.name} x ${item.quantity} (${item.size})`).join(' | '),
      order.customer?.paymentMethod || 'Cash on Delivery'
    ]);
  });

  return rows
    .map((line) => line.map((cell) => escapeCsvValue(cell)).join(','))
    .join('\n');
};

const getOrderStatusValue = (value) => {
  const normalized = sanitizeString(value, 'pending').toLowerCase();
  return ['pending', 'whatsapp_contacted', 'payment_pending', 'payment_confirmed', 'confirmed', 'processing', 'shipped', 'delivered', 'completed', 'cancelled'].includes(normalized)
    ? normalized
    : 'pending';
};

const safeNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const logActivity = (req, action, objectType, objectId) => {
  const activity = readActivity();
  activity.push({
    id: `activity-${Date.now()}`,
    action,
    objectType,
    objectId: objectId || '',
    administrator: req.session?.user?.username || ADMIN_USERNAME,
    timestamp: new Date().toISOString()
  });
  writeActivity(activity.slice(-500));
};

const broadcastAdminEvent = (event, payload) => {
  const message = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
  adminEventClients.forEach((client) => client.write(message));
};

const createNotification = (type, title, detail, objectType = '', objectId = '') => {
  const sendOrderWebhook = async (order) => {
    const webhookUrl = sanitizeString(process.env.ADMIN_NOTIFICATION_WEBHOOK_URL, '');
    if (!webhookUrl) return;
    try {
      await fetch(webhookUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ event: 'new-order', orderId: order.id, customer: order.customer.name, total: order.total, createdAt: order.createdAt }) });
    } catch {
      createNotification('delivery-error', 'Notification delivery failed', `Order ${order.id} could not reach the configured webhook`, 'order', order.id);
    }
  };

  const parseCsvLine = (line) => {
    const values = [];
    const matcher = /("(?:[^"]|"")*"|[^,]*)(?:,|$)/g;
    let match;
    while ((match = matcher.exec(line)) && match[0] !== '') values.push(match[1].replace(/^"|"$/g, '').replace(/""/g, '"'));
    return values;
  };
  const notification = {
    id: `notification-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type,
    title,
    detail,
    objectType,
    objectId,
    read: false,
    createdAt: new Date().toISOString()
  };
  const notifications = readNotifications();
  notifications.push(notification);
  writeNotifications(notifications.slice(-200));
  broadcastAdminEvent('notification', notification);
  return notification;
};

const startOfLocalDay = (date = new Date()) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const isRevenueOrder = (order) => getOrderStatusValue(order.status) !== 'cancelled';
const buildRevenueReport = (orders, startDate) => {
  const filtered = orders.filter((order) => isRevenueOrder(order) && (!startDate || new Date(order.createdAt) >= startDate));
  const grossSales = filtered.reduce((sum, order) => sum + safeNumber(order.subtotal ?? order.total, 0), 0);
  const discounts = filtered.reduce((sum, order) => sum + safeNumber(order.discount, 0), 0);
  const shipping = filtered.reduce((sum, order) => sum + safeNumber(order.shipping, 0), 0);
  const netSales = filtered.reduce((sum, order) => sum + safeNumber(order.total, 0), 0);
  return { grossSales, discounts, shipping, netSales, completedRevenue: filtered.filter((order) => getOrderStatusValue(order.status) === 'completed').reduce((sum, order) => sum + safeNumber(order.total, 0), 0), averageOrderValue: filtered.length ? netSales / filtered.length : 0, orders: filtered.length };
};

const buildCustomerSummary = (customer, order) => {
  const normalizedPhone = sanitizeString(customer.phone || '', '');
  const normalizedName = sanitizeString(customer.name || '', 'Unknown Customer');
  const email = sanitizeString(customer.email || '', '');
  const address = sanitizeString(customer.address || '', '');
  const city = sanitizeString(customer.city || '', '');
  const state = sanitizeString(customer.state || '', '');
  const pincode = sanitizeString(customer.pincode || '', '');

  return {
    id: normalizedPhone || normalizedName.toLowerCase().replace(/\s+/g, '-'),
    name: normalizedName,
    phone: normalizedPhone,
    email,
    orders: 1,
    totalSpent: safeNumber(order.total || 0, 0),
    lastOrderId: order.id,
    lastOrderDate: order.createdAt,
    addresses: [{
      id: `${order.id}-address`,
      label: 'Default shipping address',
      value: [address, city, state, pincode].filter(Boolean).join(', ')
    }],
    lastOrderStatus: getOrderStatusValue(order.status)
  };
};

const syncCustomerRecord = (customer, order) => {
  const customers = readCustomers();
  const phone = sanitizeString(customer.phone || '', '');
  const name = sanitizeString(customer.name || '', 'Unknown Customer');
  const email = sanitizeString(customer.email || '', '');
  const key = phone || name.toLowerCase().replace(/\s+/g, '-');
  const customerIndex = customers.findIndex((entry) => String(entry.phone || entry.id || '').toLowerCase() === String(key).toLowerCase());
  const orderTotal = safeNumber(order.total || 0, 0);

  if (customerIndex >= 0) {
    const existing = customers[customerIndex];
    existing.name = name;
    existing.phone = phone;
    existing.email = email || existing.email || '';
    existing.orders = safeNumber(existing.orders || 0, 0) + 1;
    existing.totalSpent = safeNumber(existing.totalSpent || 0, 0) + orderTotal;
    existing.lastOrderId = order.id;
    existing.lastOrderDate = order.createdAt;
    existing.lastOrderStatus = getOrderStatusValue(order.status);
    existing.addresses = Array.isArray(existing.addresses) && existing.addresses.length
      ? existing.addresses
      : [];

    const nextAddress = [
      sanitizeString(customer.address || '', ''),
      sanitizeString(customer.city || '', ''),
      sanitizeString(customer.state || '', ''),
      sanitizeString(customer.pincode || '', '')
    ].filter(Boolean).join(', ');

    if (nextAddress && !existing.addresses.some((address) => address.value === nextAddress)) {
      existing.addresses.push({
        id: `${order.id}-address`,
        label: 'Shipping address',
        value: nextAddress
      });
    }

    customers[customerIndex] = existing;
    writeCustomers(customers);
    return existing;
  }

  const nextCustomer = buildCustomerSummary(customer, order);
  nextCustomer.id = key;
  nextCustomer.email = email;
  nextCustomer.orders = 1;
  nextCustomer.totalSpent = orderTotal;
  nextCustomer.addresses = [];

  const nextAddress = [
    sanitizeString(customer.address || '', ''),
    sanitizeString(customer.city || '', ''),
    sanitizeString(customer.state || '', ''),
    sanitizeString(customer.pincode || '', '')
  ].filter(Boolean).join(', ');

  if (nextAddress) {
    nextCustomer.addresses.push({
      id: `${order.id}-address`,
      label: 'Shipping address',
      value: nextAddress
    });
  }

  customers.push(nextCustomer);
  writeCustomers(customers);
  return nextCustomer;
};

const ensureCustomerRecordsFromOrders = () => {
  const orders = readOrders();
  const customers = readCustomers();

  if (!customers.length && orders.length) {
    orders.forEach((order) => {
      if (order.customer) {
        syncCustomerRecord(order.customer, order);
      }
    });
  }
};

const validateCustomer = (customer) => {
  if (!customer) return 'Customer data is required.';

  const required = ['name', 'phone', 'address', 'city', 'pincode'];
  const missing = required.filter((field) => !sanitizeString(customer[field]));
  if (missing.length) return `Missing required fields: ${missing.join(', ')}`;

  if (!/^[0-9+\s-]{7,15}$/.test(String(customer.phone).trim())) {
    return 'Phone number is invalid.';
  }

  if (String(customer.pincode).trim().length < 4) {
    return 'Pincode is invalid.';
  }

  return null;
};

const validateStock = (items) => {
  const stockState = readStock();
  const insufficient = [];

  for (const item of items) {
    const stockKey = String(item.id || '').trim();
    const requestedQty = Number(item.quantity || 1);
    const available = Number(stockState[stockKey] ?? 50);

    if (requestedQty > available) {
      insufficient.push({ id: stockKey, name: item.name, requested: requestedQty, available });
    }
  }

  return insufficient;
};

const reduceStock = (items, restore = false) => {
  const stockState = readStock();

  for (const item of items) {
    const stockKey = String(item.id || '').trim();
    if (!stockKey) continue;
    const change = Number(item.quantity || 1) * (restore ? 1 : -1);
    stockState[stockKey] = Number(stockState[stockKey] ?? 50) + change;
    if (stockState[stockKey] < 0) stockState[stockKey] = 0;
  }

  writeStock(stockState);
};

const validateLoginFields = (password) => {
  if (!password) return 'Password is required.';
  if (password.length < 8 || password.length > 128) return 'Password must be between 8 and 128 characters.';
  return null;
};

const requireAdminAuth = (req, res, next) => {
  const authenticated = req.session && req.session.adminAuthenticated === true && req.session.user && ['admin', 'manager', 'support'].includes(req.session.user.role);

  if (!authenticated) {
    return res.status(401).json({ message: 'Unauthorized admin access.' });
  }

  return next();
};

const rolePermissions = {
  admin: ['orders:read', 'orders:write', 'products:read', 'products:write', 'reports:read', 'settings:write'],
  manager: ['orders:read', 'orders:write', 'products:read', 'products:write', 'reports:read'],
  support: ['orders:read', 'orders:write', 'products:read', 'reports:read']
};

const requirePermission = (permission) => (req, res, next) => {
  const role = req.session?.user?.role || 'support';
  if (!rolePermissions[role]?.includes(permission)) return res.status(403).json({ message: 'This admin role is not allowed to perform that action.' });
  return next();
};

const ensureAdminPage = (req, res, next) => {
  const authenticated = req.session && req.session.adminAuthenticated === true && req.session.user && ['admin', 'manager', 'support'].includes(req.session.user.role);

  if (!authenticated) {
    return res.redirect('/login');
  }

  return next();
};

const seedProducts = () => {
  const products = readProducts();
  if (products.length > 0) return products;

  const starterProducts = [
    {
      id: 'bmw-poster',
      name: 'BMW Poster',
      price: 499,
      originalPrice: 799,
      category: 'cars',
      description: 'Premium BMW poster for walls and car lovers.',
      image: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=900&q=80',
      size: 'A4',
      material: 'Matte paper',
      sku: 'BMW-POSTER-A4',
      featured: true,
      bestSeller: true,
      newArrival: false,
      discount: 38,
      stock: 25
    },
    {
      id: 'jdm-poster',
      name: 'JDM Poster',
      price: 599,
      originalPrice: 899,
      category: 'cars',
      description: 'JDM-inspired street car artwork for a premium wall setup.',
      image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=900&q=80',
      size: 'A3',
      material: 'Gloss paper',
      sku: 'JDM-POSTER-A3',
      featured: true,
      bestSeller: true,
      newArrival: false,
      discount: 33,
      stock: 12
    },
    {
      id: 'anime-pack',
      name: 'Anime Pack',
      price: 799,
      originalPrice: 1099,
      category: 'anime',
      description: 'Anime-inspired wall poster pack with premium finish.',
      image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=900&q=80',
      size: 'A4',
      material: 'Premium matte',
      sku: 'ANIME-PACK-A4',
      featured: false,
      bestSeller: false,
      newArrival: true,
      discount: 27,
      stock: 0
    }
  ];

  writeProducts(starterProducts);
  const stock = readStock();
  starterProducts.forEach((product) => {
    if (!Object.prototype.hasOwnProperty.call(stock, product.id)) {
      stock[product.id] = product.stock;
    }
  });
  writeStock(stock);
  return starterProducts;
};

const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, message: 'Too many login attempts. Please try again later.' }
});

const orderRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, message: 'Too many order attempts. Please try again later.' }
});

const paymentRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, message: 'Too many payment attempts. Please try again later.' }
});

const reviewRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, message: 'Too many review submissions. Please try again later.' }
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, message: 'Pixel Perfect backend is running', environment: NODE_ENV });
});

app.post('/api/admin/login', loginRateLimiter, async (req, res) => {
  try {
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    const validationMessage = validateLoginFields(password);

    if (validationMessage) {
      return res.status(400).json({ message: validationMessage });
    }

    await ensureDefaultAdmin();
    const users = readUsers();
    let user = null;
    for (const entry of users) {
      if (await bcrypt.compare(password, entry.passwordHash)) {
        user = entry;
        break;
      }
    }

    if (!user) return res.status(401).json({ message: 'Invalid credentials.' });

    const isValid = user.role === 'admin' || user.role === 'manager' || user.role === 'support';
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    req.session.adminAuthenticated = true;
    req.session.user = {
      username: user.username,
      role: user.role || 'admin'
    };
    logActivity(req, 'login', 'session', user.username);

    return res.json({ ok: true, message: 'Login successful.' });
  } catch (error) {
    return res.status(500).json({ message: 'Login failed.' });
  }
});

app.post('/api/admin/logout', requireAdminAuth, (req, res) => {
  logActivity(req, 'logout', 'session', req.session.user?.username);
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.json({ ok: true, message: 'Logged out.' });
  });
});

app.get('/api/orders', requirePermission('orders:read'), (_req, res) => {
  try {
    const orders = readOrders();
    res.json({ orders });
  } catch (error) {
    res.status(500).json({ message: 'Failed to read orders', error: error.message });
  }
});

app.get('/api/orders/track', (req, res) => {
  const orderId = sanitizeString(req.query.orderId);
  const phone = sanitizeString(req.query.phone).replace(/[^0-9]/g, '');
  const order = readOrders().find((entry) => {
    const orderPhone = sanitizeString(entry.customer?.phone).replace(/[^0-9]/g, '');
    return (entry.id === orderId || entry.trackingId === orderId) && orderPhone === phone;
  });

  if (!order) return res.status(404).json({ message: 'We could not find an order with those details.' });

  res.json({
    id: order.id,
    trackingId: order.trackingId || order.id,
    createdAt: order.createdAt,
    estimatedDelivery: order.estimatedDelivery || null,
    status: order.status || 'pending',
    customer: { name: order.customer?.name },
    paymentMethod: order.customer?.paymentMethod || 'Cash on Delivery',
    paymentStatus: order.customer?.paymentStatus || 'Pending',
    statusHistory: Array.isArray(order.statusHistory) ? order.statusHistory : [],
    items: order.items || [],
    subtotal: order.subtotal || order.total || 0,
    shipping: order.shipping || 0,
    discount: order.discount || 0,
    total: order.total || 0
  });
});

app.get('/api/reviews', (req, res) => {
  const category = sanitizeString(req.query.category).toLowerCase();
  const product = sanitizeString(req.query.product).toLowerCase();
  const reviews = readReviews().filter((review) => {
    if (review.status !== 'approved' && review.approved !== true) return false;
    return (!category || sanitizeString(review.category).toLowerCase() === category)
      && (!product || sanitizeString(review.productBought).toLowerCase().includes(product));
  });
  res.json({ reviews: reviews.map(({ wallPhoto, ...review }) => review) });
});

app.post('/api/reviews', reviewRateLimiter, (req, res) => {
  const body = req.body || {};
  const name = sanitizeString(body.name);
  const review = sanitizeString(body.review);
  const rating = Number(body.rating);
  if (name.length < 2 || review.length < 10 || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ message: 'Name, review, and a rating from 1 to 5 are required.' });
  }

  const productBought = sanitizeString(body.productBought, 'Pixel Perfect poster');
  const orderId = sanitizeString(body.orderId);
  const orderPhone = sanitizeString(body.orderPhone).replace(/\D/g, '');
  const matchedOrder = orderId && orderPhone
    ? readOrders().find((order) => {
      const storedPhone = sanitizeString(order.customer?.phone).replace(/\D/g, '');
      const hasProduct = (order.items || []).some((item) => sanitizeString(item.name).toLowerCase() === productBought.toLowerCase());
      return (order.id === orderId || order.trackingId === orderId) && storedPhone === orderPhone && hasProduct;
    })
    : null;

  const nextReview = {
    id: `review-${Date.now()}`,
    name,
    location: sanitizeString(body.location, 'India'),
    rating,
    title: sanitizeString(body.title, 'Customer review'),
    review,
    productBought,
    category: sanitizeString(body.category, 'all').toLowerCase(),
    verified: Boolean(matchedOrder),
    verifiedOrderId: matchedOrder?.id || '',
    status: 'pending',
    createdAt: new Date().toISOString()
  };
  const reviews = readReviews();
  reviews.push(nextReview);
  writeReviews(reviews.slice(-500));
  const message = matchedOrder
    ? 'Review submitted for approval. Your order details will be checked for a verified-purchase label.'
    : 'Review submitted for approval. Add your order ID and checkout phone next time to request verification.';
  res.status(201).json({ ok: true, message });
});

app.post('/api/analytics/events', (req, res) => {
  const allowed = ['product_view', 'add_to_cart', 'checkout_start', 'order_complete'];
  const type = sanitizeString(req.body?.type);
  if (!allowed.includes(type)) return res.status(400).json({ message: 'Invalid analytics event.' });
  const events = readAnalyticsEvents();
  events.push({ type, productId: sanitizeString(req.body?.productId), createdAt: new Date().toISOString() });
  writeAnalyticsEvents(events.slice(-10000));
  res.status(204).end();
});

app.get('/api/orders/:id', (_req, res) => {
  try {
    const orderId = sanitizeString(_req.params.id);
    const orders = readOrders();
    const order = orders.find((o) => o.id === orderId);

    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    const safeOrder = {
      id: order.id,
      trackingId: order.trackingId || order.id,
      createdAt: order.createdAt,
      estimatedDelivery: order.estimatedDelivery || null,
      status: order.status || 'pending',
      customer: {
        name: order.customer?.name
      },
      paymentMethod: order.customer?.paymentMethod || 'Cash on Delivery',
      items: order.items || [],
      total: order.total || 0
    };

    res.json(safeOrder);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch order', error: error.message });
  }
});

app.get('/api/products', (_req, res) => {
  try {
    const categoryDetails = {
      cars: 'A crisp automotive statement piece for bedrooms, offices, and dream garages. Printed for sharp detail and strong contrast.',
      bikes: 'A bold bike-inspired print made for riders and modern walls. Designed to bring motion, attitude, and character to your setup.',
      motivation: 'A focused visual reminder for workspaces, studios, and bedrooms. Built to make everyday walls feel more intentional.',
      gaming: 'A high-energy design for gaming rooms and creative setups. Rich visual detail helps your space feel like your own.',
      anime: 'A collectible-style wall print for fans who want a distinctive room setup. Made to display cleanly as a solo piece or set.',
      lifestyle: 'A versatile decor piece that adds personality without overwhelming your wall. Easy to style across modern spaces.'
    };
    const markup = (value) => Math.round(safeNumber(value, 0) * 1.2);
    const products = readProducts().map((product) => {
      const priceValue = (value) => product.sourceId ? safeNumber(value, 0) : markup(value);
      const sizes = Array.isArray(product.sizes)
        ? product.sizes.map((size) => ({ ...size, price: priceValue(size.price) }))
        : product.sizes;
      const basePrice = product.price ?? sizes?.[0]?.price ?? product.regularPrice ?? 0;
      return {
        ...product,
        price: priceValue(basePrice),
        regularPrice: product.regularPrice ? priceValue(product.regularPrice) : product.regularPrice,
        originalPrice: product.originalPrice ? priceValue(product.originalPrice) : product.originalPrice,
        sizes,
        description: product.description || categoryDetails[product.category] || categoryDetails.lifestyle,
        collection: product.collection || (product.category === 'cars' ? 'Garage Icons' : 'Moodboard Essentials'),
        imageAlt: product.imageAlt || `${product.name} premium wall poster`,
        imageQuality: 'high-resolution-display',
        stock: safeNumber(readStock()[product.id], product.stock ?? 50)
      };
    });
    res.json({ products });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch products', error: error.message });
  }
});

app.post('/api/coupons/validate', (req, res) => {
  const code = sanitizeString(req.body?.code).toUpperCase();
  const subtotal = safeNumber(req.body?.subtotal, 0);
  const coupon = readCoupons().find((entry) => entry.active !== false && entry.code === code);
  if (!coupon) return res.status(404).json({ message: 'Coupon code is invalid or expired.' });
  if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) return res.status(400).json({ message: 'This coupon has expired.' });
  if (subtotal < safeNumber(coupon.minimumOrder)) return res.status(400).json({ message: `Minimum order value is ${formatCurrency(coupon.minimumOrder)}.` });

  let discount = coupon.type === 'fixed' ? safeNumber(coupon.amount) : Math.round(subtotal * safeNumber(coupon.amount) / 100);
  if (coupon.maximumDiscount) discount = Math.min(discount, safeNumber(coupon.maximumDiscount));
  discount = Math.min(Math.max(discount, 0), subtotal);
  res.json({ ok: true, code, discount });
});

// Razorpay Payment Endpoints
app.post('/api/payment/create-order', paymentRateLimiter, async (req, res) => {
  try {
    const amount = safeNumber(req.body?.amount, 0);
    const orderId = sanitizeString(req.body?.orderId, '');
    const customerEmail = sanitizeString(req.body?.customerEmail, '');

    if (amount <= 0 || !orderId) {
      return res.status(400).json({ message: 'Invalid amount or order ID.' });
    }

    if (!razorpayInstance) {
      return res.status(503).json({ 
        message: 'Razorpay payment gateway not configured. Using COD/UPI fallback.',
        gateway: 'fallback',
        available: false
      });
    }

    const storedOrder = readOrders().find((order) => order.id === orderId);
    if (!storedOrder) return res.status(404).json({ message: 'Order not found.' });
    if (Math.abs(amount - safeNumber(storedOrder.total, 0)) > 0.01) {
      return res.status(400).json({ message: 'Payment amount does not match the order total.' });
    }

    const razorpayOrder = await createRazorpayOrder(amount, orderId, customerEmail);
    if (!razorpayOrder) {
      return res.status(500).json({ message: 'Failed to create payment order.' });
    }

    res.json({
      ok: true,
      razorpay_order_id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key_id: RAZORPAY_KEY_ID
    });
  } catch (error) {
    console.error('Payment order creation error:', error);
    res.status(500).json({ message: 'Failed to create payment order.', error: error.message });
  }
});

app.post('/api/payment/verify', paymentRateLimiter, async (req, res) => {
  try {
    const razorpayOrderId = sanitizeString(req.body?.razorpay_order_id, '');
    const razorpayPaymentId = sanitizeString(req.body?.razorpay_payment_id, '');
    const razorpaySignature = sanitizeString(req.body?.razorpay_signature, '');
    const orderId = sanitizeString(req.body?.orderId, '');

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature || !orderId) {
      return res.status(400).json({ message: 'Missing payment verification details.' });
    }

    if (!razorpayInstance) {
      return res.status(503).json({ message: 'Razorpay gateway not configured.' });
    }

    const ordersBeforeVerification = readOrders();
    const storedOrder = ordersBeforeVerification.find((order) => order.id === orderId);
    if (!storedOrder) return res.status(404).json({ message: 'Order not found.' });
    if (storedOrder.razorpayPaymentId === razorpayPaymentId && storedOrder.paymentStatus === 'Confirmed') {
      return res.json({ ok: true, message: 'Payment was already verified.', order: storedOrder });
    }
    if (typeof razorpayInstance.orders?.fetch === 'function') {
      const gatewayOrder = await razorpayInstance.orders.fetch(razorpayOrderId);
      if (!gatewayOrder || Number(gatewayOrder.amount) !== Math.round(safeNumber(storedOrder.total, 0) * 100) || gatewayOrder.currency !== 'INR') {
        return res.status(400).json({ message: 'Payment order does not match the stored order total.' });
      }
    }

    const isValid = verifyRazorpayPayment(razorpayPaymentId, razorpayOrderId, razorpaySignature);
    if (!isValid) {
      return res.status(400).json({ message: 'Payment verification failed. Invalid signature.' });
    }

    // Update order with payment confirmation
    const orders = ordersBeforeVerification;
    const orderIndex = orders.findIndex((order) => order.id === orderId);
    if (orderIndex !== -1) {
      orders[orderIndex].paymentMethod = 'Razorpay';
      orders[orderIndex].paymentStatus = 'Confirmed';
      orders[orderIndex].razorpayPaymentId = razorpayPaymentId;
      orders[orderIndex].razorpayOrderId = razorpayOrderId;
      orders[orderIndex].status = 'confirmed';
      orders[orderIndex].updatedAt = new Date().toISOString();
      writeOrders(orders);

      // Award loyalty points immediately for confirmed orders
      const phone = sanitizeString(orders[orderIndex].customer?.phone, '').trim();
      if (phone) {
        const loyaltyData = readLoyaltyPoints();
        const pointsToAward = Math.round(safeNumber(orders[orderIndex].total, 0) / 10);
        if (!loyaltyData[phone]) {
          loyaltyData[phone] = { phone, points: 0, createdAt: new Date().toISOString() };
        }
        loyaltyData[phone].points = (loyaltyData[phone].points || 0) + pointsToAward;
        loyaltyData[phone].lastUpdate = new Date().toISOString();
        writeLoyaltyPoints(loyaltyData);
      }

      // Send confirmation email
      if (orders[orderIndex].customer?.email) {
        void sendEmail(
          orders[orderIndex].customer.email,
          `Payment Confirmed - ${orderId}`,
          buildOrderConfirmationEmail(orders[orderIndex])
        );
      }

      createNotification('payment-confirmed', 'Payment confirmed', `${orderId} · ${razorpayPaymentId}`, 'order', orderId);
    }

    const verifiedOrder = orders[orderIndex];
    const whatsappMessage = buildWhatsAppMessage(verifiedOrder);
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappMessage)}`;
    res.json({ ok: true, message: 'Payment verified successfully.', order: verifiedOrder, whatsappUrl });
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ message: 'Payment verification failed.', error: error.message });
  }
});

app.post('/api/payment/webhook', (req, res) => {
  const signature = sanitizeString(req.headers['x-razorpay-signature'], '');
  if (!verifyRazorpayWebhook(req.rawBody, signature)) return res.status(401).json({ message: 'Invalid webhook signature.' });

  const event = sanitizeString(req.body?.event, '');
  const paymentEntity = req.body?.payload?.payment?.entity || {};
  const refundEntity = req.body?.payload?.refund?.entity || {};
  const orderId = sanitizeString(paymentEntity.notes?.order_id || refundEntity.notes?.order_id || '');
  if (!orderId) return res.json({ ok: true, ignored: true });

  const orders = readOrders();
  const index = orders.findIndex((order) => order.id === orderId);
  if (index < 0) return res.json({ ok: true, ignored: true });
  const order = orders[index];

  if (event === 'payment.captured' || event === 'order.paid') {
    if (order.paymentStatus !== 'Confirmed') {
      order.paymentMethod = 'Razorpay';
      order.paymentStatus = 'Confirmed';
      order.razorpayPaymentId = paymentEntity.id || order.razorpayPaymentId;
      order.razorpayOrderId = paymentEntity.order_id || order.razorpayOrderId;
      order.status = order.status === 'pending' ? 'confirmed' : order.status;
      order.updatedAt = new Date().toISOString();
      writeOrders(orders);
      createNotification('payment-confirmed', 'Payment captured', `${order.id} · ${formatCurrency(order.total)}`, 'order', order.id);
      if (order.customer?.email) void sendEmail(order.customer.email, `Payment confirmed - ${order.id}`, buildOrderConfirmationEmail(order));
    }
  }

  if (event === 'payment.failed') {
    order.paymentStatus = 'Failed';
    order.paymentFailure = { reason: paymentEntity.error_description || 'Payment failed', updatedAt: new Date().toISOString() };
    order.updatedAt = new Date().toISOString();
    writeOrders(orders);
    createNotification('payment-failed', 'Payment failed', `${order.id} · ${order.paymentFailure.reason}`, 'order', order.id);
  }

  if (event === 'refund.processed') {
    order.refund = { status: 'processed', refundId: refundEntity.id || order.refund?.refundId, amount: safeNumber(refundEntity.amount, order.total * 100) / 100, processedAt: new Date().toISOString() };
    order.updatedAt = new Date().toISOString();
    writeOrders(orders);
    createNotification('refund-processed', 'Refund processed', `${order.id} · ${formatCurrency(order.refund.amount)}`, 'order', order.id);
    if (order.customer?.email) void sendEmail(order.customer.email, `Refund processed - ${order.id}`, `<p>Your refund for order <strong>${order.id}</strong> has been processed for ${formatCurrency(order.refund.amount)}.</p><p>Need help? <a href="${getWhatsAppOrderLink(order, 'I have a question about my refund.')}" >Contact support on WhatsApp</a>.</p>`);
  }

  res.json({ ok: true });
});

app.post('/api/orders/:id/cancel', orderRateLimiter, (req, res) => {
  const orders = readOrders();
  const index = orders.findIndex((order) => order.id === req.params.id);
  if (index < 0) return res.status(404).json({ message: 'Order not found.' });
  const order = orders[index];
  const phone = sanitizeString(req.body?.phone, '');
  if (!phone || phone !== sanitizeString(order.customer?.phone, '')) return res.status(403).json({ message: 'Order verification failed.' });
  if (!['pending', 'confirmed', 'processing'].includes(getOrderStatusValue(order.status))) {
    return res.status(409).json({ message: 'This order can no longer be cancelled.' });
  }

  const previousStatus = getOrderStatusValue(order.status);
  order.status = 'cancelled';
  order.cancellation = { reason: sanitizeString(req.body?.reason, 'Customer requested cancellation'), requestedAt: new Date().toISOString(), refundStatus: order.paymentMethod === 'Razorpay' || order.customer?.paymentMethod === 'Razorpay' ? 'requested' : 'not_required' };
  order.statusHistory = Array.isArray(order.statusHistory) ? order.statusHistory : [];
  order.statusHistory.push({ previousStatus, newStatus: 'cancelled', timestamp: new Date().toISOString() });
  order.updatedAt = new Date().toISOString();
  reduceStock(order.items || [], true);
  writeOrders(orders);
  createNotification('order-cancelled', 'Order cancellation requested', `${order.id} · ${order.customer?.name || ''}`, 'order', order.id);
  void sendWhatsAppStatusUpdate(order, 'cancelled');
  if (order.customer?.email) void sendEmail(order.customer.email, `Cancellation received - ${order.id}`, `<p>Your cancellation request for order <strong>${order.id}</strong> has been received.</p><p><a href="${getWhatsAppOrderLink(order, 'I need help with my cancellation.')}" >Contact support on WhatsApp</a>.</p>`);
  res.json({ ok: true, message: order.cancellation.refundStatus === 'requested' ? 'Order cancelled. Refund review requested.' : 'Order cancelled successfully.', order });
});

app.use('/api/admin', requireAdminAuth);

app.get('/api/admin/events', (req, res) => {
  res.set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
  res.flushHeaders();
  res.write(`event: connected\ndata: ${JSON.stringify({ at: new Date().toISOString() })}\n\n`);
  adminEventClients.add(res);
  const heartbeat = setInterval(() => res.write(': heartbeat\n\n'), 25000);
  req.on('close', () => { clearInterval(heartbeat); adminEventClients.delete(res); });
});

app.get('/api/admin/notifications', (_req, res) => {
  const notifications = readNotifications().slice().reverse();
  res.json({ notifications, unread: notifications.filter((notification) => !notification.read).length });
});

app.put('/api/admin/notifications/:id/read', (req, res) => {
  const notifications = readNotifications();
  const notification = notifications.find((entry) => entry.id === req.params.id);
  if (!notification) return res.status(404).json({ message: 'Notification not found.' });
  notification.read = true;
  writeNotifications(notifications);
  res.json({ ok: true, notification });
});

app.put('/api/admin/notifications/read-all', (_req, res) => {
  const notifications = readNotifications().map((notification) => ({ ...notification, read: true }));
  writeNotifications(notifications);
  res.json({ ok: true });
});

app.post('/api/admin/orders/:id/notes', (req, res) => {
  const orders = readOrders();
  const order = orders.find((entry) => entry.id === req.params.id);
  const note = sanitizeString(req.body?.note, '');
  if (!order) return res.status(404).json({ message: 'Order not found.' });
  if (!note || note.length > 2000) return res.status(400).json({ message: 'Note must contain between 1 and 2000 characters.' });
  order.internalNotes = Array.isArray(order.internalNotes) ? order.internalNotes : [];
  const entry = { id: `note-${Date.now()}`, text: note, administrator: req.session.user.username, timestamp: new Date().toISOString() };
  order.internalNotes.push(entry);
  order.updatedAt = entry.timestamp;
  writeOrders(orders);
  logActivity(req, 'order note added', 'order', order.id);
  res.status(201).json({ ok: true, note: entry, order });
});

app.get('/api/admin/me', (req, res) => {
  res.json({ authenticated: true, user: { username: req.session.user.username, role: req.session.user.role } });
});

app.get('/api/admin/dashboard', (req, res) => {
  try {
    const orders = readOrders();
    const stock = readStock();
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const revenue = orders.filter(isRevenueOrder).reduce((sum, order) => sum + safeNumber(order.total || 0, 0), 0);
    const todayOrders = orders.filter((order) => new Date(order.createdAt) >= startOfDay);
    const todayRevenue = todayOrders.filter(isRevenueOrder).reduce((sum, order) => sum + safeNumber(order.total || 0, 0), 0);
    const pending = orders.filter((order) => (order.status || 'pending') === 'pending').length;
    const processing = orders.filter((order) => (order.status || 'pending') === 'processing').length;
    const shipped = orders.filter((order) => (order.status || 'pending') === 'shipped').length;
    const delivered = orders.filter((order) => (order.status || 'pending') === 'completed').length;
    const products = readProducts();
    const lowStockThreshold = safeNumber(readSettings().lowStockThreshold, 5);
    const rangeDays = { today: 1, '7days': 7, '30days': 30, '3months': 90, '6months': 180, '1year': 365 }[sanitizeString(req.query.range, 'today')] || 1;
    const sales = Array.from({ length: rangeDays }, (_value, index) => {
      const date = new Date(startOfDay.getTime() - (rangeDays - index - 1) * 86400000);
      const nextDate = new Date(date.getTime() + 86400000);
      const dayOrders = orders.filter((order) => { const created = new Date(order.createdAt); return isRevenueOrder(order) && created >= date && created < nextDate; });
      return { date: date.toISOString().slice(0, 10), orders: dayOrders.length, revenue: dayOrders.reduce((sum, order) => sum + safeNumber(order.total), 0) };
    });

    const salesMap = new Map();
    orders.forEach((order) => {
      if (!isRevenueOrder(order)) return;
      (order.items || []).forEach((item) => {
        const key = String(item.name || 'Unknown Product');
        const sold = safeNumber(item.quantity || 1, 1);
        const current = salesMap.get(key) || { sold: 0, revenue: 0 };
        current.sold += sold;
        current.revenue += safeNumber(item.price, 0) * sold;
        salesMap.set(key, current);
      });
    });

    const bestSellers = [...salesMap.entries()]
      .map(([name, values]) => ({ name, ...values }))
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 5);

    res.json({
      summary: {
        revenue,
        todayRevenue,
        totalOrders: orders.length,
        pending,
        processing,
        shipped,
        delivered,
        todayOrders: todayOrders.length,
        totalCustomers: readCustomers().length,
        products: products.length,
        lowStockProducts: products.filter((product) => safeNumber(stock[product.id], 0) <= lowStockThreshold).length
      },
      bestSellers,
      sales,
      recentOrders: orders.slice().reverse().slice(0, 5),
      stock
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch admin dashboard', error: error.message });
  }
});

seedProducts();
ensureCustomerRecordsFromOrders();

app.get('/api/admin/orders', requirePermission('orders:read'), (req, res) => {
  try {
    const orders = readOrders();
    const search = sanitizeString(req.query.search).toLowerCase();
    const status = sanitizeString(req.query.status).toLowerCase();

    const filtered = orders.filter((order) => {
      const includesStatus = !status || status === 'all' || (order.status || 'pending') === status;
      if (!includesStatus) return false;

      if (!search) return true;

      const haystack = [
        order.id,
        order.customer?.name,
        order.customer?.phone,
        order.customer?.city,
        order.customer?.address,
        order.customer?.paymentMethod
      ].join(' ').toLowerCase();

      return haystack.includes(search);
    });

    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const pageSize = Math.min(100, Math.max(1, Number.parseInt(req.query.pageSize, 10) || 20));
    const total = filtered.length;
    const start = (page - 1) * pageSize;
    res.json({ orders: filtered.slice(start, start + pageSize), pagination: { page, pageSize, total, pages: Math.ceil(total / pageSize) } });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch admin orders', error: error.message });
  }
});

app.get('/api/admin/orders/:id', (req, res) => {
  const order = readOrders().find((entry) => entry.id === req.params.id);
  if (!order) return res.status(404).json({ message: 'Order not found.' });
  res.json({ order });
});

app.post('/api/admin/orders/:id/refund', requirePermission('orders:write'), async (req, res) => {
  const orders = readOrders();
  const index = orders.findIndex((order) => order.id === req.params.id);
  if (index < 0) return res.status(404).json({ message: 'Order not found.' });
  const order = orders[index];
  if (order.refund?.status === 'processed') return res.json({ ok: true, message: 'Refund was already processed.', order });
  const paymentId = sanitizeString(order.razorpayPaymentId, '');
  if (!paymentId || !razorpayInstance?.payments?.refund) {
    order.refund = { status: 'manual_review', amount: safeNumber(order.total, 0), requestedAt: new Date().toISOString(), reason: sanitizeString(req.body?.reason, 'Admin refund request') };
    order.updatedAt = new Date().toISOString();
    writeOrders(orders);
    logActivity(req, 'refund marked for manual review', 'order', order.id);
    if (order.customer?.email) void sendEmail(order.customer.email, `Refund request received - ${order.id}`, `<p>Your refund request for order <strong>${order.id}</strong> is now under review.</p><p><a href="${getWhatsAppOrderLink(order, 'I need help with my refund request.')}" >Contact support on WhatsApp</a>.</p>`);
    return res.json({ ok: true, message: 'Refund marked for manual review.', order });
  }

  try {
    const refund = await razorpayInstance.payments.refund(paymentId, { amount: Math.round(safeNumber(order.total, 0) * 100), notes: { order_id: order.id } });
    order.refund = { status: 'processed', refundId: refund.id, amount: safeNumber(order.total, 0), processedAt: new Date().toISOString() };
    order.updatedAt = new Date().toISOString();
    writeOrders(orders);
    logActivity(req, 'refund processed', 'order', order.id);
    if (order.customer?.email) void sendEmail(order.customer.email, `Refund processed - ${order.id}`, `<p>Your refund for order <strong>${order.id}</strong> has been processed for ${formatCurrency(order.refund.amount)}.</p>`);
    res.json({ ok: true, message: 'Refund processed successfully.', order });
  } catch (error) {
    res.status(502).json({ message: 'Razorpay refund failed.', error: error.message });
  }
});

app.put('/api/admin/orders/bulk-status', requirePermission('orders:write'), (req, res) => {
  const ids = Array.isArray(req.body?.orderIds) ? req.body.orderIds.map((id) => sanitizeString(id)).filter(Boolean) : [];
  const status = getOrderStatusValue(req.body?.status);
  if (!ids.length) return res.status(400).json({ message: 'Select at least one order.' });
  const orders = readOrders();
  const changed = [];
  const changedOrders = [];
  orders.forEach((order) => {
    if (!ids.includes(order.id) || getOrderStatusValue(order.status) === status) return;
    const previousStatus = getOrderStatusValue(order.status);
    order.status = status;
    order.updatedAt = new Date().toISOString();
    order.statusHistory = Array.isArray(order.statusHistory) ? order.statusHistory : [];
    order.statusHistory.push({ previousStatus, newStatus: status, timestamp: order.updatedAt });
    if (status === 'cancelled' && previousStatus !== 'cancelled') reduceStock(order.items || [], true);
    changed.push(order.id);
    changedOrders.push(order);
  });
  writeOrders(orders);
  if (changed.length) logActivity(req, 'bulk order status changed', 'orders', changed.join(','));
  void Promise.all(changedOrders.map((order) => sendWhatsAppStatusUpdate(order, order.status)));
  res.json({ ok: true, changed });
});

app.get('/api/admin/orders/export', requirePermission('orders:read'), (req, res) => {
  try {
    const orders = readOrders();
    const search = sanitizeString(req.query.search).toLowerCase();
    const status = sanitizeString(req.query.status).toLowerCase();
    const from = req.query.from ? new Date(req.query.from) : null;
    const to = req.query.to ? new Date(req.query.to) : null;

    const filtered = orders.filter((order) => {
      const createdAt = new Date(order.createdAt);
      const inDateRange = (!from || createdAt >= from) && (!to || createdAt <= to);
      const includesStatus = inDateRange && (!status || status === 'all' || (order.status || 'pending') === status);
      if (!includesStatus) return false;

      if (!search) return true;

      const haystack = [
        order.id,
        order.customer?.name,
        order.customer?.phone,
        order.customer?.city,
        order.customer?.address,
        order.customer?.paymentMethod
      ].join(' ').toLowerCase();

      return haystack.includes(search);
    });

    const csv = buildOrdersCsv(filtered);
    const filename = `pixel-perfect-orders-${new Date().toISOString().slice(0, 10)}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ message: 'Failed to export orders', error: error.message });
  }
});

app.post('/api/admin/orders/import', requirePermission('orders:write'), (req, res) => {
  const csv = typeof req.body?.csv === 'string' ? req.body.csv : '';
  const lines = csv.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return res.status(400).json({ message: 'CSV must include an Order ID and Status column.' });
  const headers = parseCsvLine(lines.shift()).map((header) => header.trim().toLowerCase());
  const orderIndex = headers.indexOf('order id');
  const statusIndex = headers.indexOf('status');
  if (orderIndex < 0 || statusIndex < 0) return res.status(400).json({ message: 'CSV must include Order ID and Status columns.' });
  const orders = readOrders(); const changed = [];
  lines.forEach((line) => {
    const values = parseCsvLine(line); const order = orders.find((entry) => entry.id === values[orderIndex]);
    if (!order) return;
    const nextStatus = getOrderStatusValue(values[statusIndex]);
    if (order.status === nextStatus) return;
    const previousStatus = getOrderStatusValue(order.status); order.status = nextStatus; order.updatedAt = new Date().toISOString(); order.statusHistory = Array.isArray(order.statusHistory) ? order.statusHistory : []; order.statusHistory.push({ previousStatus, newStatus: nextStatus, timestamp: order.updatedAt }); changed.push(order.id);
  });
  writeOrders(orders); if (changed.length) logActivity(req, 'orders imported from CSV', 'orders', changed.join(','));
  res.json({ ok: true, changed });
});

app.get('/api/admin/customers', (req, res) => {
  try {
    const customers = readCustomers();
    const search = sanitizeString(req.query.search).toLowerCase();

    const filtered = customers.filter((customer) => {
      if (!search) return true;
      const haystack = [customer.name, customer.phone, customer.email, customer.lastOrderId, customer.city, customer.state, customer.pincode].join(' ').toLowerCase();
      return haystack.includes(search);
    });

    res.json({ customers: filtered });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch customers', error: error.message });
  }
});

app.get('/api/admin/customers/:id', (req, res) => {
  const customer = readCustomers().find((entry) => String(entry.id || entry.phone) === String(req.params.id));
  if (!customer) return res.status(404).json({ message: 'Customer not found.' });
  const orders = readOrders().filter((order) => order.customer?.phone === customer.phone);
  res.json({ customer: { ...customer, orderHistory: orders, averageOrderValue: customer.orders ? safeNumber(customer.totalSpent) / customer.orders : 0 } });
});

app.get('/api/admin/products', (req, res) => {
  try {
    const products = readProducts();
    const stock = readStock();
    const withInventory = products.map((product) => ({
      ...product,
      stock: safeNumber(stock[product.id], 0),
      status: safeNumber(stock[product.id], 0) <= 0 ? 'out-of-stock' : 'in-stock'
    }));
    res.json({ products: withInventory });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch products', error: error.message });
  }
});

app.post('/api/admin/products', requirePermission('products:write'), (req, res) => {
  try {
    const product = req.body || {};
    const name = sanitizeString(product.name, '');
    if (!name) return res.status(400).json({ message: 'Product name is required.' });

    const stock = readStock();
    const products = readProducts();
    const newProduct = {
      id: product.id || `product-${Date.now()}`,
      name,
      price: safeNumber(product.price, 0),
      originalPrice: safeNumber(product.originalPrice, safeNumber(product.price, 0)),
      category: sanitizeString(product.category, 'uncategorized'),
      description: sanitizeString(product.description, ''),
      image: sanitizeString(product.image, '').slice(0, 5000000),
      size: sanitizeString(product.size, 'A4'),
      material: sanitizeString(product.material, 'Poster Paper'),
      sku: sanitizeString(product.sku, name.toLowerCase().replace(/\s+/g, '-')),
      featured: Boolean(product.featured),
      bestSeller: Boolean(product.bestSeller),
      newArrival: Boolean(product.newArrival),
      discount: safeNumber(product.discount, 0),
      stock: safeNumber(product.stock, 10),
      createdAt: new Date().toISOString()
    };

    products.push(newProduct);
    writeProducts(products);
    stock[newProduct.id] = newProduct.stock;
    writeStock(stock);
    logActivity(req, 'product created', 'product', newProduct.id);

    res.status(201).json({ ok: true, product: newProduct });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create product', error: error.message });
  }
});

app.put('/api/admin/products/:id', requirePermission('products:write'), (req, res) => {
  const products = readProducts();
  const index = products.findIndex((product) => product.id === req.params.id);
  if (index < 0) return res.status(404).json({ message: 'Product not found.' });
  const current = products[index];
  const next = { ...current, ...req.body, id: current.id, name: sanitizeString(req.body.name, current.name), price: safeNumber(req.body.price, current.price), updatedAt: new Date().toISOString() };
  products[index] = next;
  writeProducts(products);
  if (Object.prototype.hasOwnProperty.call(req.body, 'stock')) {
    const stock = readStock(); stock[next.id] = Math.max(0, safeNumber(req.body.stock)); writeStock(stock);
  }
  logActivity(req, 'product edited', 'product', next.id);
  res.json({ ok: true, product: next });
});

app.put('/api/admin/products/:id/media', requirePermission('products:write'), (req, res) => {
  const products = readProducts();
  const index = products.findIndex((product) => product.id === req.params.id);
  if (index < 0) return res.status(404).json({ message: 'Product not found.' });
  const image = sanitizeString(req.body?.image, products[index].image || '').slice(0, 5_000_000);
  const gallery = Array.isArray(req.body?.gallery)
    ? req.body.gallery.map((entry) => sanitizeString(entry)).filter(Boolean).slice(0, 24)
    : (Array.isArray(products[index].gallery) ? products[index].gallery : []);
  if (!image && !gallery.length) return res.status(400).json({ message: 'At least one product image is required.' });
  products[index] = { ...products[index], image: image || gallery[0], gallery, imageAlt: sanitizeString(req.body?.imageAlt, products[index].imageAlt || `${products[index].name} product image`), updatedAt: new Date().toISOString() };
  writeProducts(products);
  logActivity(req, 'product media updated', 'product', products[index].id);
  res.json({ ok: true, product: products[index] });
});

app.delete('/api/admin/products/:id', requirePermission('products:write'), (req, res) => {
  const products = readProducts();
  const next = products.filter((product) => product.id !== req.params.id);
  if (next.length === products.length) return res.status(404).json({ message: 'Product not found.' });
  writeProducts(next);
  const stock = readStock(); delete stock[req.params.id]; writeStock(stock);
  logActivity(req, 'product deleted', 'product', req.params.id);
  res.json({ ok: true });
});

app.get('/api/admin/inventory', (req, res) => {
  try {
    const products = readProducts();
    const stock = readStock();
    const inventory = products.map((product) => ({
      id: product.id,
      name: product.name,
      stock: safeNumber(stock[product.id], 0),
      status: safeNumber(stock[product.id], 0) <= 0 ? 'out-of-stock' : safeNumber(stock[product.id], 0) <= 5 ? 'low-stock' : 'in-stock'
    }));
    res.json({ inventory });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch inventory', error: error.message });
  }
});

app.post('/api/admin/inventory/:productId', requirePermission('products:write'), (req, res) => {
  try {
    const productId = sanitizeString(req.params.productId, '');
    const action = sanitizeString(req.body?.action, 'set');
    const amount = safeNumber(req.body?.amount, 0);
    const stock = readStock();

    if (!productId) return res.status(400).json({ message: 'Product ID is required.' });

    const current = safeNumber(stock[productId], 0);
    const nextValue = action === 'add' ? current + amount : amount;
    stock[productId] = Math.max(0, nextValue);
    writeStock(stock);

    res.json({ ok: true, productId, stock: stock[productId] });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update inventory', error: error.message });
  }
});

app.get('/api/admin/search', (req, res) => {
  try {
    const query = sanitizeString(req.query.q, '').toLowerCase();
    if (!query) {
      return res.json({ orders: [], customers: [], products: [] });
    }

    const orders = readOrders();
    const customers = readCustomers();
    const products = readProducts();

    const filteredOrders = orders.filter((order) => {
      const haystack = [order.id, order.customer?.name, order.customer?.phone, order.customer?.city, order.customer?.address].join(' ').toLowerCase();
      return haystack.includes(query);
    });

    const filteredCustomers = customers.filter((customer) => {
      const haystack = [customer.name, customer.phone, customer.email, customer.lastOrderId].join(' ').toLowerCase();
      return haystack.includes(query);
    });

    const filteredProducts = products.filter((product) => {
      const haystack = [product.name, product.category, product.sku, product.material].join(' ').toLowerCase();
      return haystack.includes(query);
    });

    res.json({ orders: filteredOrders, customers: filteredCustomers, products: filteredProducts });
  } catch (error) {
    res.status(500).json({ message: 'Failed to search admin data', error: error.message });
  }
});

app.get('/api/admin/orders/export-today', (req, res) => {
  try {
    const orders = readOrders();
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const filtered = orders.filter((order) => new Date(order.createdAt) >= startOfDay);
    const csv = buildOrdersCsv(filtered);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="pixel-perfect-today-orders-${today.toISOString().slice(0, 10)}.csv"`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ message: 'Failed to export today orders', error: error.message });
  }
});

app.get('/api/admin/orders/export-month', (req, res) => {
  try {
    const orders = readOrders();
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const filtered = orders.filter((order) => new Date(order.createdAt) >= startOfMonth);
    const csv = buildOrdersCsv(filtered);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="pixel-perfect-month-orders-${now.toISOString().slice(0, 10)}.csv"`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ message: 'Failed to export month orders', error: error.message });
  }
});

app.get('/api/admin/export-customers', (req, res) => {
  try {
    const rows = [['Name', 'Phone', 'Email', 'Orders', 'Total Spent', 'Last Order']];
    const customers = readCustomers();
    customers.forEach((customer) => {
      rows.push([customer.name, customer.phone, customer.email, customer.orders || 0, customer.totalSpent || 0, customer.lastOrderId || '']);
    });
    const csv = rows.map((row) => row.map((cell) => escapeCsvValue(cell)).join(',')).join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="pixel-perfect-customers.csv"');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ message: 'Failed to export customers', error: error.message });
  }
});

app.get('/api/admin/export-products', (req, res) => {
  try {
    const products = readProducts();
    const stock = readStock();
    const rows = [['Name', 'Category', 'Price', 'Stock', 'SKU', 'Featured']];
    products.forEach((product) => {
      rows.push([product.name, product.category, safeNumber(product.price, 0), safeNumber(stock[product.id], 0), product.sku, product.featured ? 'Yes' : 'No']);
    });
    const csv = rows.map((row) => row.map((cell) => escapeCsvValue(cell)).join(',')).join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="pixel-perfect-products.csv"');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ message: 'Failed to export products', error: error.message });
  }
});

app.get('/api/admin/export-inventory', (req, res) => {
  try {
    const products = readProducts();
    const stock = readStock();
    const rows = [['Product', 'Stock', 'Status']];
    products.forEach((product) => {
      const qty = safeNumber(stock[product.id], 0);
      rows.push([product.name, qty, qty <= 0 ? 'Out of stock' : qty <= 5 ? 'Low stock' : 'In stock']);
    });
    const csv = rows.map((row) => row.map((cell) => escapeCsvValue(cell)).join(',')).join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="pixel-perfect-inventory.csv"');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ message: 'Failed to export inventory', error: error.message });
  }
});

app.get('/api/admin/revenue', (req, res) => {
  const now = new Date();
  const range = sanitizeString(req.query.range, 'all');
  const ranges = { today: startOfLocalDay(now), yesterday: new Date(startOfLocalDay(now).getTime() - 86400000), '7days': new Date(now.getTime() - 7 * 86400000), '30days': new Date(now.getTime() - 30 * 86400000), month: new Date(now.getFullYear(), now.getMonth(), 1), year: new Date(now.getFullYear(), 0, 1), all: null };
  res.json({ range, ...buildRevenueReport(readOrders(), ranges[range] ?? null) });
});

app.get('/api/admin/revenue/export', requirePermission('reports:read'), (req, res) => {
  const now = new Date();
  const from = req.query.from ? new Date(req.query.from) : null;
  const to = req.query.to ? new Date(req.query.to) : null;
  const orders = readOrders().filter((order) => isRevenueOrder(order) && (!from || new Date(order.createdAt) >= from) && (!to || new Date(order.createdAt) <= to));
  const rows = [['Date', 'Order ID', 'Status', 'Customer', 'Gross Sales', 'Discount', 'Shipping', 'Net Sales']];
  orders.forEach((order) => rows.push([new Date(order.createdAt).toISOString(), order.id, order.status || 'pending', order.customer?.name || '', safeNumber(order.subtotal ?? order.total), safeNumber(order.discount), safeNumber(order.shipping), safeNumber(order.total)]));
  const csv = rows.map((row) => row.map(escapeCsvValue).join(',')).join('\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="pixel-perfect-revenue-${now.toISOString().slice(0, 10)}.csv"`);
  res.send(csv);
});

app.get('/api/admin/analytics', (req, res) => {
  const orders = readOrders();
  const analyticsEvents = readAnalyticsEvents();
  const completed = orders.filter((order) => getOrderStatusValue(order.status) === 'completed');
  const cityMap = new Map();
  orders.forEach((order) => {
    const city = sanitizeString(order.customer?.city, 'Unknown');
    const current = cityMap.get(city) || { city, customers: new Set(), orders: 0, revenue: 0 };
    current.customers.add(order.customer?.phone || order.customer?.name);
    current.orders += 1; current.revenue += isRevenueOrder(order) ? safeNumber(order.total) : 0;
    cityMap.set(city, current);
  });
  res.json({ completedOrders: completed.length, averageOrderValue: completed.length ? completed.reduce((sum, order) => sum + safeNumber(order.total), 0) / completed.length : 0, conversionRate: null, visitors: null, productViews: analyticsEvents.filter((event) => event.type === 'product_view').length, addToCartEvents: analyticsEvents.filter((event) => event.type === 'add_to_cart').length, checkoutStarts: analyticsEvents.filter((event) => event.type === 'checkout_start').length, locations: [...cityMap.values()].map((entry) => ({ ...entry, customers: entry.customers.size })).sort((a, b) => b.revenue - a.revenue) });
});

app.get('/api/admin/reviews', (_req, res) => res.json({ reviews: readReviews() }));
app.get('/api/admin/reviews/pending', requirePermission('products:read'), (_req, res) => {
  res.json({ reviews: readReviews().filter((review) => (review.status || 'pending') === 'pending') });
});
app.put('/api/admin/reviews/:id', (req, res) => {
  const reviews = readReviews(); const index = reviews.findIndex((review) => String(review.id) === req.params.id);
  if (index < 0) return res.status(404).json({ message: 'Review not found.' });
  const status = sanitizeString(req.body?.status, reviews[index].status || 'pending').toLowerCase();
  if (!['pending', 'approved', 'rejected'].includes(status)) return res.status(400).json({ message: 'Invalid review moderation status.' });
  reviews[index] = {
    ...reviews[index],
    status,
    verified: typeof req.body?.verified === 'boolean' ? req.body.verified : Boolean(reviews[index].verified),
    response: sanitizeString(req.body?.response, reviews[index].response || '').slice(0, 2000),
    updatedAt: new Date().toISOString(),
    moderatedBy: req.session?.user?.username || ADMIN_USERNAME
  };
  writeReviews(reviews);
  logActivity(req, `review ${status}`, 'review', req.params.id);
  res.json({ ok: true, review: reviews[index] });
});
app.delete('/api/admin/reviews/:id', (req, res) => {
  const reviews = readReviews(); const next = reviews.filter((review) => String(review.id) !== req.params.id);
  if (next.length === reviews.length) return res.status(404).json({ message: 'Review not found.' }); writeReviews(next); logActivity(req, 'review deleted', 'review', req.params.id); res.json({ ok: true });
});

app.get('/api/admin/refunds', requirePermission('orders:read'), (_req, res) => {
  const refunds = readOrders()
    .filter((order) => order.refund && ['requested', 'manual_review'].includes(order.refund.status))
    .map((order) => ({ orderId: order.id, customer: order.customer, total: order.total, refund: order.refund, status: order.status, updatedAt: order.updatedAt }));
  res.json({ refunds });
});

app.get('/api/admin/coupons', (_req, res) => res.json({ coupons: readCoupons() }));
app.post('/api/admin/coupons', (req, res) => {
  const coupon = { id: `coupon-${Date.now()}`, code: sanitizeString(req.body?.code).toUpperCase(), type: req.body?.type === 'fixed' ? 'fixed' : 'percentage', amount: safeNumber(req.body?.amount), minimumOrder: safeNumber(req.body?.minimumOrder), maximumDiscount: safeNumber(req.body?.maximumDiscount), expiresAt: req.body?.expiresAt || null, usageLimit: safeNumber(req.body?.usageLimit), perCustomerLimit: safeNumber(req.body?.perCustomerLimit), active: req.body?.active !== false, createdAt: new Date().toISOString() };
  if (!coupon.code || coupon.amount <= 0) return res.status(400).json({ message: 'Coupon code and amount are required.' });
  const coupons = readCoupons(); if (coupons.some((entry) => entry.code === coupon.code)) return res.status(409).json({ message: 'Coupon code already exists.' }); coupons.push(coupon); writeCoupons(coupons); logActivity(req, 'coupon created', 'coupon', coupon.id); res.status(201).json({ ok: true, coupon });
});
app.put('/api/admin/coupons/:id', (req, res) => { const coupons = readCoupons(); const index = coupons.findIndex((coupon) => coupon.id === req.params.id); if (index < 0) return res.status(404).json({ message: 'Coupon not found.' }); coupons[index] = { ...coupons[index], ...req.body, updatedAt: new Date().toISOString() }; writeCoupons(coupons); res.json({ ok: true, coupon: coupons[index] }); });
app.delete('/api/admin/coupons/:id', (req, res) => { const coupons = readCoupons(); const next = coupons.filter((coupon) => coupon.id !== req.params.id); if (next.length === coupons.length) return res.status(404).json({ message: 'Coupon not found.' }); writeCoupons(next); logActivity(req, 'coupon deleted', 'coupon', req.params.id); res.json({ ok: true }); });

// Loyalty & Referral System
const LOYALTY_POINTS_FILE = path.join(__dirname, 'data', 'loyalty-points.json');
const readLoyaltyPoints = () => readJsonFile(LOYALTY_POINTS_FILE, {});
const writeLoyaltyPoints = (data) => writeJsonFile(LOYALTY_POINTS_FILE, data);

app.post('/api/referral/generate', (req, res) => {
  const phone = sanitizeString(req.body?.phone, '').trim();
  if (!phone || !/^[6-9]\d{9}$/.test(phone)) {
    return res.status(400).json({ message: 'Valid phone number required.' });
  }

  const referralCode = `PP${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
  const loyaltyData = readLoyaltyPoints();
  
  if (!loyaltyData[phone]) {
    loyaltyData[phone] = { phone, points: 0, referralCode, referralClicks: 0, referralSuccesses: 0, createdAt: new Date().toISOString() };
  } else {
    loyaltyData[phone].referralCode = referralCode;
  }
  
  writeLoyaltyPoints(loyaltyData);
  res.json({ ok: true, referralCode, referralUrl: `${req.protocol}://${req.get('host')}?ref=${referralCode}` });
});

app.get('/api/referral/status/:phone', (req, res) => {
  const phone = sanitizeString(req.params.phone, '').trim();
  if (!phone) return res.status(400).json({ message: 'Phone number required.' });

  const loyaltyData = readLoyaltyPoints();
  const data = loyaltyData[phone] || { phone, points: 0, referralCode: null, referralClicks: 0, referralSuccesses: 0 };
  res.json(data);
});

app.post('/api/referral/track', (req, res) => {
  const referralCode = sanitizeString(req.body?.referralCode, '').trim();
  if (!referralCode) return res.status(400).json({ message: 'Referral code required.' });

  const loyaltyData = readLoyaltyPoints();
  for (const phone in loyaltyData) {
    if (loyaltyData[phone].referralCode === referralCode) {
      loyaltyData[phone].referralClicks = (loyaltyData[phone].referralClicks || 0) + 1;
      writeLoyaltyPoints(loyaltyData);
      return res.json({ ok: true, referrer: loyaltyData[phone] });
    }
  }

  res.status(404).json({ message: 'Referral code not found.' });
});

app.post('/api/loyalty/award-points', (req, res) => {
  const phone = sanitizeString(req.body?.phone, '').trim();
  const points = safeNumber(req.body?.points, 0);
  const reason = sanitizeString(req.body?.reason, 'purchase');
  
  if (!phone || points <= 0) return res.status(400).json({ message: 'Valid phone and points required.' });

  const loyaltyData = readLoyaltyPoints();
  if (!loyaltyData[phone]) {
    loyaltyData[phone] = { phone, points: 0, createdAt: new Date().toISOString() };
  }

  loyaltyData[phone].points = (loyaltyData[phone].points || 0) + points;
  loyaltyData[phone].lastUpdate = new Date().toISOString();
  writeLoyaltyPoints(loyaltyData);

  res.json({ ok: true, phone, totalPoints: loyaltyData[phone].points, reason });
});

app.get('/api/loyalty/info/:phone', (req, res) => {
  const phone = sanitizeString(req.params.phone, '').trim();
  if (!phone) return res.status(400).json({ message: 'Phone required.' });

  const loyaltyData = readLoyaltyPoints();
  const data = loyaltyData[phone] || { phone, points: 0, tier: 'standard', referralCode: null };
  
  // Calculate tier based on points
  const points = data.points || 0;
  let tier = 'standard';
  if (points >= 5000) tier = 'gold';
  else if (points >= 2000) tier = 'silver';
  else if (points >= 500) tier = 'bronze';

  res.json({ ...data, tier, nextTierPoints: tier === 'gold' ? null : tier === 'silver' ? 5000 : tier === 'bronze' ? 2000 : 500 });
});

app.get('/api/admin/loyalty', (_req, res) => {
  const loyaltyData = readLoyaltyPoints();
  const stats = {
    totalMembers: Object.keys(loyaltyData).length,
    totalPoints: Object.values(loyaltyData).reduce((sum, member) => sum + (member.points || 0), 0),
    totalReferrals: Object.values(loyaltyData).reduce((sum, member) => sum + (member.referralSuccesses || 0), 0),
    members: Object.values(loyaltyData).slice(-20)
  };
  res.json(stats);
});

app.get('/api/admin/activity', (_req, res) => res.json({ activity: readActivity().slice().reverse() }));
app.get('/api/admin/security', requirePermission('settings:write'), (_req, res) => res.json({ sessionStore: 'express-session memory store', database: process.env.DATABASE_URL ? 'postgresql configured' : 'json fallback active', webhook: Boolean(process.env.ADMIN_NOTIFICATION_WEBHOOK_URL), recentActivity: readActivity().slice(-50).reverse() }));
app.get('/api/admin/settings', (_req, res) => res.json({ settings: readSettings() }));
app.put('/api/admin/settings', requirePermission('settings:write'), (req, res) => { const settings = { ...readSettings(), ...req.body }; writeSettings(settings); logActivity(req, 'settings updated', 'settings', 'store'); res.json({ ok: true, settings }); });

app.get('/api/admin/users', requirePermission('settings:write'), (_req, res) => {
  res.json({ users: readUsers().map(({ passwordHash, ...user }) => user) });
});

app.post('/api/admin/users', requirePermission('settings:write'), async (req, res) => {
  const username = sanitizeString(req.body?.username, '').toLowerCase();
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  const role = ['admin', 'manager', 'support'].includes(req.body?.role) ? req.body.role : 'support';
  if (!username || password.length < 8) return res.status(400).json({ message: 'Username and a password of at least 8 characters are required.' });
  const users = readUsers();
  if (users.some((user) => String(user.username).toLowerCase() === username)) return res.status(409).json({ message: 'Username already exists.' });
  users.push({ username, passwordHash: await bcrypt.hash(password, 12), role, createdAt: new Date().toISOString() });
  writeUsers(users); logActivity(req, 'admin user created', 'user', username);
  res.status(201).json({ ok: true, user: { username, role } });
});
app.put('/api/admin/users/:username', requirePermission('settings:write'), (req, res) => {
  const users = readUsers(); const user = users.find((entry) => entry.username === req.params.username);
  if (!user) return res.status(404).json({ message: 'Admin user not found.' });
  if (!['admin', 'manager', 'support'].includes(req.body?.role)) return res.status(400).json({ message: 'Invalid role.' });
  user.role = req.body.role; user.updatedAt = new Date().toISOString(); writeUsers(users); logActivity(req, 'admin role changed', 'user', user.username); res.json({ ok: true, user: { username: user.username, role: user.role } });
});
app.delete('/api/admin/users/:username', requirePermission('settings:write'), (req, res) => {
  if (req.params.username === ADMIN_USERNAME) return res.status(400).json({ message: 'The primary admin cannot be deleted.' });
  const users = readUsers(); const next = users.filter((entry) => entry.username !== req.params.username);
  if (next.length === users.length) return res.status(404).json({ message: 'Admin user not found.' }); writeUsers(next); logActivity(req, 'admin user deleted', 'user', req.params.username); res.json({ ok: true });
});

app.put('/api/orders/:id/status', requireAdminAuth, requirePermission('orders:write'), (req, res) => {
  try {
    const orderId = sanitizeString(req.params.id);
    const status = sanitizeString(req.body?.status, 'pending').toLowerCase();
    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'completed', 'cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid order status.' });
    }

    const orders = readOrders();
    const orderIndex = orders.findIndex((order) => order.id === orderId);
    if (orderIndex === -1) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    const previousStatus = getOrderStatusValue(orders[orderIndex].status);
    orders[orderIndex].status = status;
    orders[orderIndex].updatedAt = new Date().toISOString();
    orders[orderIndex].statusHistory = Array.isArray(orders[orderIndex].statusHistory) ? orders[orderIndex].statusHistory : [];
    orders[orderIndex].statusHistory.push({ previousStatus, newStatus: status, timestamp: orders[orderIndex].updatedAt });
    if (status === 'cancelled' && previousStatus !== 'cancelled') reduceStock(orders[orderIndex].items || [], true);
    writeOrders(orders);
    const customers = readCustomers();
    const customer = customers.find((entry) => entry.phone === orders[orderIndex].customer?.phone);
    if (customer) { customer.lastOrderStatus = status; writeCustomers(customers); }
    logActivity(req, 'order status changed', 'order', orderId);
    if (status === 'cancelled' && previousStatus !== 'cancelled') {
      createNotification('cancelled-order', 'Order cancelled', `${orderId} · ${orders[orderIndex].customer?.name || 'Customer'}`, 'order', orderId);
    }

    // Award loyalty points when order is completed
    if (status === 'completed' && previousStatus !== 'completed') {
      const phone = sanitizeString(orders[orderIndex].customer?.phone, '').trim();
      if (phone) {
        const loyaltyData = readLoyaltyPoints();
        const pointsToAward = Math.round(safeNumber(orders[orderIndex].total, 0) / 10); // 1 point per ₹10 spent
        if (!loyaltyData[phone]) {
          loyaltyData[phone] = { phone, points: 0, createdAt: new Date().toISOString() };
        }
        loyaltyData[phone].points = (loyaltyData[phone].points || 0) + pointsToAward;
        loyaltyData[phone].lastUpdate = new Date().toISOString();
        writeLoyaltyPoints(loyaltyData);
        createNotification('loyalty-points', 'Loyalty points awarded', `${orders[orderIndex].customer?.name} earned ${pointsToAward} points`, 'order', orderId);
      }
    }

    // Send status update emails
    const updatedOrder = orders[orderIndex];
    if (updatedOrder.customer?.email) {
      if (status === 'shipped') {
        void sendEmail(
          updatedOrder.customer.email,
          `Your Order is Shipped - ${orderId}`,
          buildShippingNotificationEmail(updatedOrder)
        );
      } else if (status === 'completed' || status === 'delivered') {
        void sendEmail(
          updatedOrder.customer.email,
          `Order Delivered - ${orderId}`,
          buildDeliveryConfirmedEmail(updatedOrder)
        );
      }
    }

    const email = buildAdminEmail(orders[orderIndex]);
    res.json({ ok: true, status, order: orders[orderIndex], email });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update order status', error: error.message });
  }
});

app.post('/api/orders', orderRateLimiter, (req, res) => {
  try {
    const payload = req.body;

    if (!payload || !payload.customer || !Array.isArray(payload.items) || !payload.items.length) {
      return res.status(400).json({ message: 'Invalid order payload.' });
    }

    const validationMessage = validateCustomer(payload.customer);
    if (validationMessage) {
      return res.status(400).json({ message: validationMessage });
    }

    const paymentMethod = sanitizeString(payload.customer.paymentMethod, 'COD').toUpperCase();
    if (!['UPI', 'COD', 'WHATSAPP'].includes(paymentMethod)) {
      return res.status(400).json({ message: 'Unsupported payment method.' });
    }

    const paymentScreenshotBase64 = sanitizeString(payload.customer.paymentScreenshotBase64, '');
    if (paymentMethod === 'UPI' && !paymentScreenshotBase64.startsWith('data:image/')) {
      return res.status(400).json({ message: 'A UPI payment screenshot is required.' });
    }
    if (paymentScreenshotBase64.length > 5 * 1024 * 1024 * 1.4) {
      return res.status(413).json({ message: 'Payment screenshot must be less than 5MB.' });
    }

    const products = readProducts();
    const normalizedItems = [];
    const invalidItems = [];

    payload.items.forEach((item) => {
      const product = products.find((entry) => entry.id === String(item.id || '').trim());
      const sizeLabel = sanitizeString(item.size, 'A5');
      const size = product?.sizes?.find((entry) => entry.label === sizeLabel);
      const quantity = Number(item.quantity || 1);

      if (!product || !size || !Number.isInteger(quantity) || quantity < 1) {
        invalidItems.push({ id: String(item.id || ''), size: sizeLabel });
        return;
      }

      normalizedItems.push({
        id: product.id,
        name: product.name,
        size: size.label,
        price: Number(size.price),
        quantity
      });
    });

    if (invalidItems.length) {
      return res.status(400).json({ message: 'One or more products or sizes are invalid.', invalidItems });
    }

    const insufficientStock = validateStock(normalizedItems);
    if (insufficientStock.length) {
      return res.status(409).json({
        message: 'Selected items are unavailable in the requested quantity.',
        insufficientStock
      });
    }

    const subtotal = normalizedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const checkoutSettings = readSettings();
    const shipping = subtotal >= safeNumber(checkoutSettings.freeShippingThreshold, 200)
      ? 0
      : safeNumber(checkoutSettings.shippingFee, 50);
    const couponCode = sanitizeString(payload.couponCode).toUpperCase();
    const coupon = couponCode ? readCoupons().find((entry) => entry.active !== false && entry.code === couponCode) : null;
    if (couponCode && !coupon) {
      return res.status(400).json({ message: 'Coupon code is invalid or expired.' });
    }
    if (coupon && coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return res.status(400).json({ message: 'This coupon has expired.' });
    }
    if (coupon && subtotal < safeNumber(coupon.minimumOrder)) {
      return res.status(400).json({ message: `Minimum order value is ${formatCurrency(coupon.minimumOrder)}.` });
    }
    let discount = 0;
    if (coupon && subtotal >= safeNumber(coupon.minimumOrder)) {
      discount = coupon.type === 'fixed' ? safeNumber(coupon.amount) : Math.round(subtotal * safeNumber(coupon.amount) / 100);
      if (coupon.maximumDiscount) discount = Math.min(discount, safeNumber(coupon.maximumDiscount));
      discount = Math.min(Math.max(discount, 0), subtotal);
    }
    const order = {
      id: `PP-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
      trackingId: `PPTRK-${crypto.randomBytes(5).toString('hex').toUpperCase()}`,
      createdAt: new Date().toISOString(),
      estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
      statusHistory: [{ previousStatus: null, newStatus: 'pending', timestamp: new Date().toISOString() }],
      customer: {
        name: sanitizeString(payload.customer.name),
        phone: sanitizeString(payload.customer.phone),
        address: sanitizeString(payload.customer.address),
        city: sanitizeString(payload.customer.city),
        pincode: sanitizeString(payload.customer.pincode),
        state: sanitizeString(payload.customer.state),
        note: sanitizeString(payload.customer.note),
        paymentMethod,
        paymentStatus: paymentMethod === 'WHATSAPP' ? 'Awaiting WhatsApp confirmation' : paymentMethod === 'UPI' ? 'Submitted for verification' : 'Pending',
        paymentScreenshot: sanitizeString(payload.customer.paymentScreenshot),
        paymentScreenshotBase64: paymentMethod === 'UPI' ? paymentScreenshotBase64 : ''
      },
      items: normalizedItems,
      subtotal,
      shipping,
      discount,
      couponCode: coupon ? coupon.code : '',
      total: subtotal + shipping - discount
    };

    const orders = readOrders();
    orders.push(order);
    writeOrders(orders);
    syncCustomerRecord(order.customer, order);
    reduceStock(normalizedItems);
    const settings = readSettings();
    createNotification('new-order', 'New order received', `${order.id} · ${order.customer.name} · ${formatCurrency(order.total)}`, 'order', order.id);
    normalizedItems.forEach((item) => {
      const available = safeNumber(readStock()[item.id], 0);
      if (available <= safeNumber(settings.lowStockThreshold, 5)) {
        createNotification('low-stock', 'Low stock alert', `${item.name} · ${available} remaining`, 'product', item.id);
      }
    });
    void sendOrderWebhook(order);

    // Send order confirmation email (non-blocking)
    if (order.customer.email) {
      void sendEmail(
        order.customer.email,
        `Order Confirmed - ${order.id}`,
        buildOrderConfirmationEmail(order)
      );
    }

    const whatsappMessage = buildWhatsAppMessage(order);
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappMessage)}`;

    res.status(201).json({
      ok: true,
      message: 'Order saved successfully.',
      order,
      whatsappUrl
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create order', error: error.message });
  }
});

app.get('/api/stock', (_req, res) => {
  res.json({ stock: readStock() });
});

app.get('/login', (_req, res) => {
  res.sendFile(path.join(__dirname, 'Admin.html'));
});

app.get('/login.html', (_req, res) => {
  res.sendFile(path.join(__dirname, 'Admin.html'));
});

app.get('/Admin.html', (_req, res) => {
  res.sendFile(path.join(__dirname, 'Admin.html'));
});

app.get('/admin', ensureAdminPage, (_req, res) => {
  res.sendFile(path.join(__dirname, 'Dashboard.html'));
});

app.get('/admin.html', ensureAdminPage, (_req, res) => {
  res.sendFile(path.join(__dirname, 'Dashboard.html'));
});

app.get('/Dashboard.html', ensureAdminPage, (_req, res) => {
  res.sendFile(path.join(__dirname, 'Dashboard.html'));
});

app.use(express.static(__dirname));

app.get('*', (req, res) => {
  const isAdminRequest = req.path.startsWith('/admin') || req.path.startsWith('/login') || req.path.startsWith('/api/admin');
  if (isAdminRequest) {
    return res.sendFile(path.join(__dirname, req.path.endsWith('.html') ? req.path.slice(1) : 'index.html'));
  }
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Pixel Perfect backend running on http://localhost:${PORT}`);
});
