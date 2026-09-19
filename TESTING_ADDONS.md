# Premium Cart Features - Testing Guide

## Quick Start

1. **Open cart.html** in browser
2. Add items to cart from product pages
3. Navigate to cart.html to see all premium features

## Feature Testing

### Test 1: Express Shipping ⚡
**Steps:**
1. Go to cart page
2. Find "Shipping Options" panel
3. Click on "Express Shipping" option
4. **Verify**: ₹299 added to cart total
5. **Storage**: Check localStorage for `cart-express-shipping = true`

### Test 2: Gift Add-ons 🎁
**Steps:**
1. Scroll to "Gift Options" panel
2. Check "Gift Wrapping" (₹99)
3. Check "Gift Box Upgrade" (₹149)
4. **Verify**: Add-ons total shows ₹248
5. **Uncheck one**: Total updates to ₹149
6. **Storage**: Check `cart-gift-options` in localStorage

### Test 3: Payment Methods 💳
**Steps:**
1. Go to "Payment Methods" panel
2. Select different payment options
3. Try "UPI", "Card", "Wallet", "Cash on Delivery"
4. **Verify**: Selection updates
5. **Storage**: Check `cart-payment-method` in localStorage

### Test 4: Discount Showcase 💰
**Steps:**
1. View "Discount Info" panel
2. **Current discount**: Shows bundle discount (if applicable)
3. **Next milestone**: Shows items needed for next tier
4. Add more items until you hit 3, 5, or 10 items
5. **Verify**: Discount tier updates

### Test 5: Product Reviews ⭐
**Steps:**
1. Go to cart page with items
2. Scroll to "Customer Reviews" section
3. **Verify**: Each item shows:
   - ⭐ 4.8/5 rating
   - (2.3k reviews) count
   - Sample review text

### Test 6: Address Validator 📍
**Steps:**
1. During checkout, enter a 6-digit pincode
2. **Valid**: 600001, 400001, 560001
3. **Invalid**: 12345, 1234567, ABC123
4. **Verify**: Validation message and delivery date

### Test 7: Bundle Discounts 📦
**Steps:**
1. Start with empty cart
2. Add 1 item → No discount shown
3. Add 2 more items (3 total) → 5% discount shown
4. Add 2 more items (5 total) → 10% discount shown
5. Add 5 more items (10 total) → 15% discount shown
6. **Verify**: Cart total updated with correct discount

### Test 8: Abandonment Alert ⚠️
**Steps:**
1. Add items to cart
2. **Don't click checkout**
3. Close the tab or navigate away
4. **Verify**: Modal appears before leaving
5. **Options**: "Continue Shopping" or "Proceed to Checkout"

## Console Testing

Open browser developer tools (F12) and check:

```javascript
// Check cart storage
JSON.parse(localStorage.getItem('pixel-perfect-cart'))

// Check express shipping
localStorage.getItem('cart-express-shipping')

// Check gift options
JSON.parse(localStorage.getItem('cart-gift-options'))

// Check payment method
localStorage.getItem('cart-payment-method')

// Test addon module
console.log(cartAddonsModule)

// Get addon total
cartAddonsModule.getAddonsTotal()

// Validate pincode
cartAddonsModule.validatePincode('600001')

// Show abandonment alert manually
cartAddonsModule.showAbandonmentAlert()
```

## Mobile Testing

1. Resize browser to mobile width (375px)
2. **Verify**:
   - Addon panels stack vertically
   - Payment method labels appear under icons
   - Abandonment modal is readable
   - All buttons are touch-friendly

## Cart Summary Verification

Should display:
- Subtotal: Sum of all items
- Bundle saving: -₹X (if applicable)
- Shipping: ₹50 or "Free"
- Express upcharge: +₹299 (if selected)
- Add-ons: +₹X (gift options total)
- Coupon: -₹X (if applied)
- Loyalty: -₹X (if redeemed)
- **Total**: Sum of all above

## Expected Behavior

### Single Item
```
Subtotal: ₹999
Shipping: ₹50
Total: ₹1,049
```

### 3 Items + Express + Gift
```
Subtotal: ₹2,997
Bundle saving: -₹150 (5%)
Shipping: ₹50
Express upcharge: ₹299
Add-ons: ₹248 (gift wrapping + box)
Total: ₹3,444
```

### 10 Items + All Features
```
Subtotal: ₹9,990
Bundle saving: -₹1,499 (15%)
Shipping: Free (≥₹2000)
Express upcharge: ₹299
Add-ons: ₹248
Coupon (20% off): -₹1,698
Loyalty: -₹500
Total: ₹5,840
```

## Troubleshooting

### Features Not Showing
- Clear browser cache
- Check DevTools console for errors
- Verify cart-addons.js is loaded
- Check localStorage for corrupted data

### Cart Total Wrong
- Verify getCartTotals() calculation
- Check localStorage values
- Clear and re-add items

### Abandonment Alert Not Showing
- Must have items in cart
- Must leave page with back/close/navigate
- Check beforeunload event in console

### localStorage Issues
Clear with:
```javascript
localStorage.clear()
// or specific items
localStorage.removeItem('pixel-perfect-cart')
localStorage.removeItem('cart-express-shipping')
localStorage.removeItem('cart-gift-options')
localStorage.removeItem('cart-payment-method')
```

## Performance Check

Each addon module should:
- Render in < 100ms
- Update on cart changes instantly
- Persist data immediately to localStorage
- Not cause page jank or slowness

Monitor in DevTools Performance tab.

## Accessibility

- Tab through all controls
- All inputs have labels
- Color is not the only indicator (e.g., green badges have text)
- Modal can be dismissed with Escape key
- Screen reader can read all content

## Next: Production Checklist

- [ ] Test on Chrome, Firefox, Safari, Edge
- [ ] Test on iOS Safari and Android Chrome
- [ ] Verify analytics tracking
- [ ] Check email notifications
- [ ] Test with slow network (DevTools throttle)
- [ ] Run lighthouse audit
- [ ] Get stakeholder approval
- [ ] Deploy to staging
- [ ] Monitor conversion metrics
- [ ] Gather user feedback
