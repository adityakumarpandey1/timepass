# Cake Town Bakery — Website

A premium, responsive one-page website for Cake Town Bakery, Lucknow.

## How to run
No build tools needed. Just open `index.html` in any browser — or for the best experience (so the WhatsApp/embedded map links behave exactly as in production):

1. Unzip the folder.
2. Double-click `index.html`, **or** serve it locally:
   ```
   cd cake-town-bakery
   python3 -m http.server 8000
   ```
   then visit `http://localhost:8000`.
3. To publish it live, upload the whole folder to any static host (Netlify, Vercel, GitHub Pages, or your own hosting/cPanel).

## Structure
```
cake-town-bakery/
├── index.html      # all sections + SEO tags + structured data
├── css/style.css   # design tokens, layout, animations, dark/light theme
├── js/script.js    # menu data, search/filter, carousel, forms, theme toggle
└── README.md
```

## What's included
- Sticky glassmorphism navbar with dark/light mode toggle
- Hero with rotating "Freshly Baked Daily" bakery stamp badge
- Highlighted offer banners (5% pre-booking, 1kg+ on order)
- Quick category icon strip + price-tier filters ("Under ₹300/₹600/₹1000", Premium) — inspired by IGP/Brijwasi Bakery
- Searchable + filterable menu (10 categories) with star ratings, review counts, and an "Out of Stock" ribbon for sold-out items
- "+ Add to Order" cart with a slide-out drawer (qty +/-, running list) that checks out as one itemized WhatsApp message — plus a quick single-item WhatsApp order button on every card
- Gallery with click-to-zoom lightbox
- Why Choose Us grid
- Auto-rotating testimonials carousel
- FAQ accordion
- Contact section with embedded Google Map, Call/WhatsApp/Location buttons
- Pre-Book Cake form + Cake Enquiry form — both submit straight to WhatsApp
- Floating cart, WhatsApp & Call buttons, scroll-to-top button
- Scroll-reveal animations, mobile-responsive nav
- SEO: meta description/keywords, Open Graph tags, JSON-LD Bakery schema

## Daily menu editing (for the shop owner)
The menu now lives in `data/menu.json` (and the banner in `data/announcement.json`)
instead of being hardcoded in the JS. Once deployed (see below), the owner
logs in at **yourdomain.com/admin** with an email + password, and can:
- Edit any item's price
- Toggle an item "Available Today" on/off (shows a red "Out of Stock" ribbon instead of removing it)
- Set/edit the star rating and number of reviews shown on a card
- Add a "Today's Banner" message (e.g. "Fresh Black Forest Cake today!")
No code editing required — it's a simple form.

## Full deployment guide (domain + free hosting + editor login)
1. **Put the code on GitHub** — create a free GitHub account, create a new
   repository, and upload this whole `cake-town-bakery` folder to it.
2. **Deploy on Netlify (free)** — sign up at netlify.com, "Add new site" →
   "Import an existing project" → connect the GitHub repo. Netlify will
   give you a temporary URL like `random-name.netlify.app` immediately.
3. **Buy the domain** — buy `caketownbakery.com` (or similar) from a
   registrar like Namecheap or GoDaddy (~₹700-1200/year).
4. **Connect the domain to Netlify** — in Netlify: Site settings → Domain
   management → Add custom domain → enter your domain. Netlify shows DNS
   records; add those in your registrar's DNS settings (or just switch
   the domain's nameservers to Netlify's for the simplest setup). Netlify
   issues a free HTTPS certificate automatically.
5. **Turn on the menu editor.** The admin panel (`/admin`) uses Decap CMS,
   an open-source editor that saves changes straight to your GitHub repo.
   It needs a login service behind it. Netlify's own **Identity + Git
   Gateway** is now flagged as deprecated by Netlify for new setups, so
   we recommend this free alternative instead:
   - **Recommended — DecapBridge (free, built for exactly this):**
     1. Go to **decapbridge.com** and sign up.
     2. Click **Create New Site**, connect it to your GitHub repo, and
        generate an access token when prompted.
     3. DecapBridge gives you an `identity_url` and `gateway_url`. Open
        `admin/config.yml` in your repo and replace the `backend:` block
        with the one DecapBridge shows you (a template is already
        commented inside `admin/config.yml` in this project).
     4. From the DecapBridge dashboard, invite your father's email. He'll
        get a link to set a password, then log in anytime at
        `yourdomain.com/admin` to update the menu — no GitHub account
        needed on his end.

Any change he saves in `/admin` commits to GitHub and Netlify auto-rebuilds
the live site within a minute — no restart or re-upload needed.

## How placing an order actually works (important — please read)
This site is a **static front-end with no backend server or database**,
so "placing an order" doesn't go through a payment gateway or an OTP
system — it works like this:
1. The customer adds items to the cart and taps **"Pay via UPI & Place
   Order."**
2. Their own UPI app (GPay/PhonePe/Paytm/BHIM) opens with your shop's UPI
   ID and the amount already filled in (a standard `upi://pay` deep
   link — the same thing a UPI QR code does). The customer completes the
   payment themselves in their own app.
3. At the same time, the site opens **WhatsApp** with a pre-filled
   message listing everything they ordered, their name, phone, and
   address, so you can see and confirm the order on your shop's WhatsApp.
4. A copy of the order is also saved under **"My Orders"** in that
   customer's own browser (browser local storage), purely so they can
   look back at what they ordered — it is not synced to you or any server.

**There is no OTP anywhere in this flow.** The "Sign Up / Sign In"
feature is a simple local account (name, phone, email, password) stored
only in that visitor's own browser — it's there so returning customers
don't have to retype delivery details, not a real authentication system.
No SMS or email OTP is sent, because there's no backend or SMS provider
wired up to send one. If you'd like real OTP verification (e.g. to
confirm phone numbers before an order is accepted), that needs a backend
plus an SMS/OTP service (e.g. Twilio, MSG91) — a meaningful next step
beyond this static site, so ask if you'd like that added.

## Cancellation & refund policy
Since cakes and bakery items are freshly prepared per order and can't be
reused or resold, **orders cannot be cancelled or refunded once placed.**
This is shown to the customer in two places so it's never a surprise:
- A highlighted warning line in the cart, right above the checkout
  buttons.
- A dedicated question in the FAQ section.

(Online payments via Razorpay were evaluated but intentionally left out
for now — WhatsApp + UPI has no transaction fees and no setup, which is
the better fit until there's a clear need for card/netbanking payments.)

## About the menu photos
All photos in `data/menu.json` are free stock images from Unsplash,
matched by category (e.g. all "cakes" use real cake photos, all
"pastries" use real pastry photos) — the earlier version had photos
copy-pasted across unrelated categories (e.g. a cupcake photo showing
under a cake item), which has been fixed. For very specific items —
"Unicorn Kids Cake," "Princess Theme," "Frozen Theme," "Superhero,"
"Piñata Cake," etc. — no single stock photo can show your father's exact
design, so these currently share a small set of tasteful generic
cake/tiered-cake/unicorn-cake photos as placeholders.
**The best long-term fix:** once your father bakes each design, have him
photograph it and upload the photo through the admin panel's **Media
Library** (Menu → pick the item → Photo → upload) — real photos of your
own cakes will always look better and be more accurate than stock photos
anyway. Also worth knowing: item names like "Frozen Theme" and "Mickey &
Minnie" reference Disney-owned characters — using those exact names/
imagery commercially can carry trademark risk, so you may want to rename
those to generic descriptions (e.g. "Ice Princess Theme Cake") unless
they're only ever custom-made per customer request.

## Customize
- **Phone/WhatsApp number:** update `WA_NUMBER` at the top of `js/script.js` and the `tel:`/`wa.me` links in `index.html`.
- **Menu items/prices:** edit the `menuItems` array in `js/script.js`.
- **Images:** all photos currently load from Unsplash (free stock). Swap any `img`/`background-image` URL for your own bakery photos — just drop your images into an `assets/` folder and update the paths.
- **Colors:** all theme colors are CSS variables at the top of `css/style.css` (`:root { --cream, --cocoa, --pink, --gold ... }`).
- **Map:** the embedded map uses a text search query; for pixel-perfect pin placement, replace the iframe `src` with an embed link generated from Google Maps for your exact location.
