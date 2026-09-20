/**
 * QR Menu Guided Setup & Interactive Tour - Master Tour Steps Configuration
 * Defines all 24 major modules with live target selectors, operational explanations,
 * role permissions, smart state detection, and demonstration hooks.
 */

export const TOUR_MODULES = [
  {
    id: 'overview',
    module: 'Overview',
    tab: 'Overview',
    title: 'Your Restaurant Command Center',
    explanation: "See today's live revenue, order counters, occupied table metrics, and rapid operational actions at a glance.",
    why: 'This is the first screen for understanding what is happening in your restaurant right now without digging through reports.',
    target: '[data-tour="overview-kpis"]',
    fallbackTarget: '[data-tour="nav-Overview"]',
    whatHappens: 'Displays real-time KPIs: Today’s Revenue, Live Orders, Active Tables, and Average Order Value.',
    recommendedAction: 'Monitor high-level flow and use quick actions to jump directly to order taking.',
    roles: ['owner', 'manager', 'receptionist', 'accountant'],
    smartCheck: (ctx) => {
      const count = ctx.stats?.totalOrders || ctx.orders?.length || 0;
      return {
        configured: count > 0,
        customMessage: count > 0 ? `Your cafe already has ${count} orders recorded today.` : 'Live counters update instantly as orders arrive from QR scans or POS.'
      };
    }
  },
  {
    id: 'pos',
    module: 'POS / New Order',
    tab: 'POS',
    title: 'Take Orders Directly at Reception & Counter',
    explanation: 'Rapidly take dine-in, takeaway, and counter orders. Select table, search items, apply modifiers, send KOT, and take payment.',
    why: 'Reception and counter staff can instantly serve walk-in guests who prefer ordering with a cashier rather than scanning QR.',
    target: '[data-tour="pos-order-type"]',
    fallbackTarget: '[data-tour="nav-POS"]',
    whatHappens: 'Toggles between Dine-In table ordering and Quick Takeaway token creation.',
    recommendedAction: 'Choose Dine In or Takeaway, search an item, and click Send KOT.',
    roles: ['owner', 'manager', 'receptionist', 'cashier', 'waiter'],
    demoAction: 'try_pos',
    demonstration: {
      scenario: 'Customer walks to reception and orders two pastas for Table 5.',
      steps: ['Choose Dine In', 'Select Table 5', 'Search Pasta', 'Set quantity 2', 'Send KOT']
    }
  },
  {
    id: 'orders',
    module: 'Orders',
    tab: 'Orders',
    title: 'Manage Every Order Across Your Venue',
    explanation: 'Track every order from QR scan, POS, or waiter. Filter by status, search by customer/KOT, and progress from Preparing to Served.',
    why: 'Real-time order statuses prevent kitchen delays and guarantee that every order is delivered and billed accurately.',
    target: '[data-tour="orders-filter-bar"]',
    fallbackTarget: '[data-tour="nav-Orders"]',
    whatHappens: 'Filters orders across Received, Confirmed, Preparing, Ready, Served, and Completed.',
    recommendedAction: 'Review live incoming tickets and advance their preparation statuses.',
    roles: ['owner', 'manager', 'receptionist', 'cashier', 'waiter', 'kitchen'],
    smartCheck: (ctx) => {
      const pending = ctx.orders?.filter(o => o.status === 'pending').length || 0;
      return {
        configured: ctx.orders?.length > 0,
        customMessage: pending > 0 ? `You currently have ${pending} pending order(s) requiring acceptance.` : 'Orders update in real-time with audio alert chimes.'
      };
    }
  },
  {
    id: 'tables',
    module: 'Tables',
    tab: 'Tables',
    title: 'Manage Your Floor Layout & Active Sessions',
    explanation: 'See table availability, open guest sessions, track running totals, and initiate billing settlement.',
    why: 'Table, session, and order relationships must remain strictly connected so an order for Table 5 cannot accidentally appear on Table 1.',
    target: '[data-tour="tables-grid"]',
    fallbackTarget: '[data-tour="nav-Tables"]',
    whatHappens: 'Displays color-coded floor view (Available, Occupied, Billing, Settled) with live timers.',
    recommendedAction: 'Click an occupied table to inspect its running total or add extra food items.',
    roles: ['owner', 'manager', 'receptionist', 'cashier', 'waiter'],
    demoAction: 'try_table',
    smartCheck: (ctx) => {
      const tableCount = ctx.cafe?.tableCount || 10;
      return {
        configured: tableCount > 0,
        customMessage: `Configured with ${tableCount} active tables. Table sessions auto-free 60s after bill settlement.`
      };
    }
  },
  {
    id: 'qr_tables',
    module: 'QR & Tables',
    tab: 'QR',
    title: 'Turn Every Table Into a Digital Ordering Point',
    explanation: 'Generate, download, and print table-specific QR codes with your cafe branding and direct table URL mapping.',
    why: 'Digital QR ordering empowers diners to browse photos, customize dishes, and order immediately without waiting for a waiter.',
    target: '[data-tour="qr-table-grid"]',
    fallbackTarget: '[data-tour="nav-QR"]',
    whatHappens: 'Renders high-resolution vector QR codes ready for 80mm table tent stands or printouts.',
    recommendedAction: 'Click "Preview Menu" on any table QR to test what customers see on their phones.',
    roles: ['owner', 'manager', 'receptionist'],
    demoAction: 'preview_qr'
  },
  {
    id: 'customer_menu',
    module: 'Customer QR Menu',
    tab: 'QR',
    title: 'See What Your Diners See on Their Mobile Phones',
    explanation: 'Inspect your live mobile digital menu featuring cafe branding, promotional banners, item images, dietary badges, and digital cart.',
    why: 'A visually appetizing digital menu increases average order value by 22% through mouth-watering imagery and easy add-ons.',
    target: '[data-tour="qr-preview-card"]',
    fallbackTarget: '[data-tour="nav-QR"]',
    whatHappens: 'Opens a mobile preview simulator displaying your live customer ordering portal.',
    recommendedAction: 'Test adding items to cart and selecting Dine-In table context.',
    roles: ['owner', 'manager', 'receptionist'],
    demoAction: 'open_customer_preview'
  },
  {
    id: 'menu',
    module: 'Menu Management',
    tab: 'Menu',
    title: 'Build & Organize Your Digital Catalog',
    explanation: 'Create food categories, set prices, upload dish photos, customize veg/non-veg tags, and toggle instant 86 out-of-stock availability.',
    why: 'Your menu is your prime sales instrument. Immediate availability toggles ensure kitchens never receive orders for sold-out ingredients.',
    target: '[data-tour="menu-add-btn"]',
    fallbackTarget: '[data-tour="nav-Menu"]',
    whatHappens: 'Opens the Add Menu Item modal with pricing, preparation time, and image uploader.',
    recommendedAction: 'Add your signature dishes and organize them into intuitive categories.',
    roles: ['owner', 'manager'],
    smartCheck: (ctx) => {
      const items = ctx.menu?.length || 0;
      return {
        configured: items > 0,
        customMessage: items > 0 ? `Your catalog currently contains ${items} active menu items.` : 'Start with your bestsellers and beverage categories.'
      };
    }
  },
  {
    id: 'offers',
    module: 'Offers & Coupons',
    tab: 'Coupons',
    title: 'Create Discounts Diners Can See & Redeem',
    explanation: 'Set up percentage discounts, flat cashbacks, minimum bill requirements, usage limits, and automatic expiry dates.',
    why: 'Active promotions are highlighted directly on customer digital menus to drive sales during non-peak dining hours.',
    target: '[data-tour="coupons-create-btn"]',
    fallbackTarget: '[data-tour="nav-Coupons"]',
    whatHappens: 'Opens coupon creation with automatic code generation and validation rules.',
    recommendedAction: 'Create a welcome discount (e.g. WELCOME10 for 10% off) to entice first-time diners.',
    roles: ['owner', 'manager', 'accountant']
  },
  {
    id: 'kot',
    module: 'KOT / Kitchen Flow',
    tab: 'Orders',
    title: 'Dispatch Kitchen Order Tickets with Delta Tracking',
    explanation: 'Route incoming orders directly to kitchen preparation stations with order timers and thermal 80mm/58mm ticket formatting.',
    why: 'When a customer orders additional items later, the system generates a delta KOT with ONLY new items, eliminating duplicate kitchen preparation.',
    target: '[data-tour="orders-kot-btn"]',
    fallbackTarget: '[data-tour="nav-Orders"]',
    whatHappens: 'Generates a clean kitchen ticket displaying table number, item quantities, guest notes, and timestamp.',
    recommendedAction: 'Inspect KOT layout and verify station tags.',
    roles: ['owner', 'manager', 'receptionist', 'cashier', 'kitchen'],
    demoAction: 'view_sample_kot'
  },
  {
    id: 'kitchen_display',
    module: 'Kitchen Display (KDS)',
    tab: 'Orders',
    title: 'Use Digital Kitchen Screen for Cooks & Chefs',
    explanation: 'View orders sorted by preparation urgency, monitor elapsed timers, mark dishes ready, and eliminate paper wastage.',
    why: 'Digital kitchen screens provide line cooks with clear dish countdowns and notify front-of-house staff the moment an order is plated.',
    target: '[data-tour="orders-status-pipeline"]',
    fallbackTarget: '[data-tour="nav-Orders"]',
    whatHappens: 'Highlights the real-time order lifecycle pipeline from Pending to Ready and Served.',
    recommendedAction: 'Use this view during peak rush hours to prioritize oldest orders first.',
    roles: ['owner', 'manager', 'kitchen']
  },
  {
    id: 'billing',
    module: 'Billing & Settlement',
    tab: 'Tables',
    title: 'Manage Running Table Bills & Issue Invoices',
    explanation: 'Consolidate multiple order rounds into a single table session bill, apply discounts, calculate taxes, and collect payment.',
    why: 'Accurate billing settlement links table release directly with payment confirmation, preventing unpaid walkouts.',
    target: '[data-tour="table-settle-action"]',
    fallbackTarget: '[data-tour="nav-Tables"]',
    whatHappens: 'Slides out the Billing Drawer with item breakdown, tax calculation, discount slider, and settlement methods.',
    recommendedAction: 'Select an occupied table to review its running bill and generate a formal invoice.',
    roles: ['owner', 'manager', 'cashier', 'accountant'],
    demoAction: 'try_billing'
  },
  {
    id: 'gst',
    module: 'GST & Tax Configuration',
    tab: 'Settings',
    title: 'Configure Your Tax Rates & Invoice Compliance',
    explanation: 'Set up GST / VAT percentage, tax labels (GST/VAT/Service Tax), currency symbol, and custom invoice numbering prefix.',
    why: 'Tax rates must match your local commercial registration. Automated tax calculation guarantees clean accounting and audit compliance.',
    target: '[data-tour="settings-tax-section"]',
    fallbackTarget: '[data-tour="nav-Settings"]',
    whatHappens: 'Configures tax rates that automatically apply to subtotal during bill calculation.',
    recommendedAction: 'Confirm your tax rate (e.g. 5% GST for restaurant services) and set invoice prefix (INV-).',
    roles: ['owner', 'manager', 'accountant'],
    smartCheck: (ctx) => {
      const tax = ctx.cafe?.taxPercent || 0;
      return {
        configured: tax > 0,
        customMessage: `Your tax is currently configured at ${tax}% (${ctx.cafe?.taxLabel || 'GST'}).`
      };
    }
  },
  {
    id: 'payments',
    module: 'Payments & Settlement Methods',
    tab: 'Settings',
    title: 'Collect Payments via Cash, UPI QR & Card',
    explanation: 'Enable Cash on Delivery, Dynamic UPI QR code scanning, and Card/POS terminals with split settlement support.',
    why: 'Offering flexible payment options accelerates table turnaround time by letting customers pay via their preferred method.',
    target: '[data-tour="settings-payment-rules"]',
    fallbackTarget: '[data-tour="nav-Settings"]',
    whatHappens: 'Enables diners and cashiers to settle bills via Cash, UPI, Card, or mixed split payment.',
    recommendedAction: 'Ensure UPI and Cash options are enabled for smooth front-desk cashiering.',
    roles: ['owner', 'manager', 'cashier', 'accountant']
  },
  {
    id: 'printers',
    module: 'Thermal Printers',
    tab: 'Settings',
    title: 'Connect Bill & Kitchen Thermal Printers',
    explanation: 'Support for 58mm and 80mm thermal receipt printers via Bluetooth, USB, or Network LAN for instantaneous receipts and KOTs.',
    why: 'Thermal receipts provide customers with official printed tax bills and kitchen staff with hands-free ticket printing.',
    target: '[data-tour="settings-printer-card"]',
    fallbackTarget: '[data-tour="nav-Settings"]',
    whatHappens: 'Triggers a real browser/device thermal test print formatted for standard 80mm/58mm rolls.',
    recommendedAction: 'Click "Test Print" to test your receipt layout before opening for the day.',
    roles: ['owner', 'manager'],
    demoAction: 'test_print'
  },
  {
    id: 'customers',
    module: 'Customer CRM',
    tab: 'CRM',
    title: 'Understand Diners & Build Repeat Loyalty',
    explanation: 'View customer directory with total visits, lifetime spend, favorite dishes, and personal dining preferences/notes.',
    why: 'Recognizing regular diners and catering to their table preferences turns one-time visitors into loyal brand advocates.',
    target: '[data-tour="crm-search-bar"]',
    fallbackTarget: '[data-tour="nav-CRM"]',
    whatHappens: 'Filters customer database and shows VIP tags, visit frequency, and phone contacts.',
    recommendedAction: 'Search customer name or phone number to view historical bills and notes.',
    roles: ['owner', 'manager', 'receptionist']
  },
  {
    id: 'reservations',
    module: 'Reservations',
    tab: 'Reservations',
    title: 'Manage Table Bookings & Seat Arriving Guests',
    explanation: 'Schedule upcoming guest bookings, track guest counts (pax), assign tables in advance, and smoothly transition to live dining sessions.',
    why: 'When a reserved guest arrives, seating them automatically initializes the table session with their details pre-filled.',
    target: '[data-tour="reservations-new-btn"]',
    fallbackTarget: '[data-tour="nav-Reservations"]',
    whatHappens: 'Opens reservation booking form with date, time, guest count, and table assignment.',
    recommendedAction: 'Book a reservation or click "Seat Guest" on confirmed bookings.',
    roles: ['owner', 'manager', 'receptionist']
  },
  {
    id: 'inventory',
    module: 'Inventory & Stock Management',
    tab: 'Inventory',
    title: 'Control Ingredients & Low-Stock Alerts',
    explanation: 'Track raw materials, monitor low-stock warnings, execute bulk restocks, and toggle instant 86 out-of-stock items.',
    why: 'Progressive inventory monitoring prevents stock-outs during busy shifts and ensures ingredient costs stay under control.',
    target: '[data-tour="inventory-summary-cards"]',
    fallbackTarget: '[data-tour="nav-Inventory"]',
    whatHappens: 'Displays total stock items, low-stock alerts, out-of-stock items, and total inventory value.',
    recommendedAction: 'Check low-stock warnings and use Bulk Restock when supplier shipments arrive.',
    roles: ['owner', 'manager', 'kitchen']
  },
  {
    id: 'coupons',
    module: 'Coupons Management',
    tab: 'Coupons',
    title: 'Manage Promotional Campaigns',
    explanation: 'Review active promotional discount codes, track usage metrics, deactivate expired vouchers, and create flash sales.',
    why: 'Controlled discounts protect your profit margins while rewarding frequent diners with targeted promotional codes.',
    target: '[data-tour="coupons-table"]',
    fallbackTarget: '[data-tour="nav-Coupons"]',
    whatHappens: 'Lists all discount codes with minimum order amount, max discount cap, and activation toggle.',
    recommendedAction: 'Toggle active coupons on or off based on your weekly promotional calendar.',
    roles: ['owner', 'manager', 'accountant']
  },
  {
    id: 'expenses',
    module: 'Expenses Tracking',
    tab: 'Analytics',
    title: 'Track Restaurant Overhead & Operating Expenses',
    explanation: 'Log kitchen supplies, dairy, maintenance, utility bills, and staff payouts to maintain an accurate net profitability picture.',
    why: 'Tracking expenses alongside daily gross revenue allows you to monitor true operating margins and food cost percentages.',
    target: '[data-tour="analytics-expenses-btn"]',
    fallbackTarget: '[data-tour="nav-Analytics"]',
    whatHappens: 'Shows expense breakdown by category (Supplies, Utilities, Staff, Maintenance, Logistics).',
    recommendedAction: 'Record daily cash outlays to balance register drawers at closing.',
    roles: ['owner', 'manager', 'accountant']
  },
  {
    id: 'analytics',
    module: 'Analytics & Insights',
    tab: 'Analytics',
    title: 'Understand Sales Trends & High-Margin Items',
    explanation: 'Interactive performance metrics: Revenue, Order Volume, Average Order Value (AOV), and top-selling menu items.',
    why: 'Analytics reveals peak ordering hours, popular dish combinations, and helps optimize kitchen prep schedules.',
    target: '[data-tour="analytics-kpi-grid"]',
    fallbackTarget: '[data-tour="nav-Analytics"]',
    whatHappens: 'Displays charts and metrics filtered by Today, Last 7 Days, or Last 30 Days.',
    recommendedAction: 'Review your bestselling menu items to engineer higher menu profitability.',
    roles: ['owner', 'manager', 'accountant']
  },
  {
    id: 'reports',
    module: 'Reports & Day-Close Export',
    tab: 'Analytics',
    title: 'Generate Business Reports & Shift Summaries',
    explanation: 'Export comprehensive sales, item-wise sales, payment mix, tax collected, and end-of-day Z-reports.',
    why: 'Daily closing reports give cashiers and managers clear shift reconciliation before locking the cash drawer.',
    target: '[data-tour="reports-export-card"]',
    fallbackTarget: '[data-tour="nav-Analytics"]',
    whatHappens: 'Generates structured report exports for accounting, auditing, and tax filing.',
    recommendedAction: 'Run end-of-day summary reports for your daily revenue archive.',
    roles: ['owner', 'manager', 'accountant']
  },
  {
    id: 'staff',
    module: 'Staff & Roles',
    tab: 'Staff',
    title: 'Control Team Access with 4-Digit Security PINs',
    explanation: 'Add team members, assign operational roles (Owner, Manager, Cashier, Waiter, Kitchen, Accountant), and configure fast PIN switching.',
    why: 'Role-based access ensures waiters only take orders, kitchen staff only view tickets, and cashiers handle billing without accessing owner settings.',
    target: '[data-tour="staff-add-member-btn"]',
    fallbackTarget: '[data-tour="nav-Staff"]',
    whatHappens: 'Opens staff creation modal with role assignment and 4-digit PIN setup.',
    recommendedAction: 'Assign PINs to active staff members for rapid station switching on shared counter tablets.',
    roles: ['owner', 'manager']
  },
  {
    id: 'settings',
    module: 'Settings',
    tab: 'Settings',
    title: 'Configure Your Restaurant Profile & Themes',
    explanation: 'Set cafe name, operating hours, table count, receipt footer message, and select luxury customer menu color themes.',
    why: 'Your visual theme and operational hours establish your brand aesthetic when diners browse your QR menu.',
    target: '[data-tour="settings-profile-card"]',
    fallbackTarget: '[data-tour="nav-Settings"]',
    whatHappens: 'Allows live editing of restaurant branding, contact numbers, hours, and receipt footers.',
    recommendedAction: 'Check operating hours and select an inviting theme matching your cafe interior.',
    roles: ['owner', 'manager']
  },
  {
    id: 'security',
    module: 'Security & Tenant Isolation',
    tab: 'Settings',
    title: 'Protect Your Restaurant & Data Isolation',
    explanation: 'Enterprise tenant isolation, staff session authentication, PIN security, and audit protection.',
    why: 'Tenant isolation guarantees that your cafe data, customer contacts, and financials remain strictly private and protected.',
    target: '[data-tour="topbar-staff-btn"]',
    fallbackTarget: '[data-tour="nav-Settings"]',
    whatHappens: 'Opens staff authentication modal to switch between team members securely.',
    recommendedAction: 'Always lock terminal or switch to cashier/waiter PIN before stepping away from the counter.',
    roles: ['owner', 'manager']
  }
];

export const WORKFLOW_DEMO_SCENARIOS = {
  endToEnd: {
    id: 'endToEnd',
    title: "17-Step Full Dine-In Lifecycle: Table 5 QR to Session Release",
    description: "Teaches the exact operational relationship between Customer QR Scans, POS, Kitchen KOT, Delta Orders, Billing Settlement, and Table Release.",
    steps: [
      { step: 1, title: 'QR Scan at Table 5', action: 'Diner sits at Table 5 and scans the physical table QR code with their mobile phone camera.', module: 'QR & Tables', highlight: 'Customer QR Menu initializes with Table 5 binding.' },
      { step: 2, title: 'Customer Digital Menu Loads', action: 'Customer sees your cafe-branded digital menu with photos, veg/non-veg tags, and active offers.', module: 'Customer QR Menu', highlight: 'No app download needed; loads instantly in mobile browser.' },
      { step: 3, title: 'Selects Dine In', action: 'Customer verifies Table 5 and confirms Dine In service type.', module: 'Customer QR Menu', highlight: 'Session is established and bound to Table 5.' },
      { step: 4, title: 'Adds Pasta x2 to Cart', action: 'Customer selects Truffle Pasta (Qty: 2) with extra cheese modifier and clicks Place Order.', module: 'Customer QR Menu', highlight: 'Cart verifies live menu price and availability.' },
      { step: 5, title: 'POS Receives Order Instantly', action: 'Cafe dashboard receives the incoming order with an audio alert chime.', module: 'Orders / POS', highlight: 'Order #ORD-101 created under Table 5 Session.' },
      { step: 6, title: 'KOT Dispatched to Kitchen', action: 'System generates Kitchen Order Ticket (KOT-101) for the Chef station.', module: 'KOT / Kitchen', highlight: 'Shows Table 5, 2x Truffle Pasta, and timestamp.' },
      { step: 7, title: 'Kitchen Marks Preparing', action: 'Chef clicks "Accept & Preparing" on Kitchen Display; prep timer starts counting.', module: 'Kitchen Display', highlight: 'Customer mobile screen updates: "Preparing your delicious food".' },
      { step: 8, title: 'Customer Orders Coffee Later', action: '20 minutes later, the customer browses the menu again and orders 1x Cold Brew Float.', module: 'Customer QR Menu', highlight: 'Repeat ordering is permitted without closing session.' },
      { step: 9, title: 'New Round Attaches to Table 5 Session', action: 'System recognizes the existing active Table 5 session and appends the coffee.', module: 'Tables & Sessions', highlight: 'All orders remain organized under one active bill.' },
      { step: 10, title: 'Delta KOT Generated for Beverage Bar', action: 'System creates KOT-102 containing ONLY the Cold Brew, preventing duplicate pasta preparation.', module: 'KOT / Kitchen', highlight: 'Delta KOT avoids kitchen confusion and duplicate cooking.' },
      { step: 11, title: 'Staff Opens Running Table Bill', action: 'Customer asks for the bill. Waiter or Cashier clicks Table 5 on the floor view.', module: 'Tables & Billing', highlight: 'Billing Drawer slides out with both rounds itemized.' },
      { step: 12, title: 'Staff Confirms Customer Details', action: 'Cashier confirms guest name (Rohit Sharma) and adds customer phone for loyalty CRM.', module: 'Customer CRM', highlight: 'Customer profile links to visit history.' },
      { step: 13, title: 'GST & Tax Automatically Computed', action: 'System computes taxable subtotal, applies configured GST (5%), and calculates Grand Total.', module: 'GST & Tax', highlight: 'Clean, compliant tax calculation shown on receipt.' },
      { step: 14, title: 'Payment Collected (Cash/UPI/Card)', action: 'Customer scans dynamic UPI QR on cashier screen or pays via Cash.', module: 'Payments', highlight: 'Payment status updates to Paid.' },
      { step: 15, title: 'Tax Invoice Printed on 80mm Thermal', action: 'Cashier clicks Print Bill; standard 80mm thermal receipt prints instantly.', module: 'Thermal Printers', highlight: 'Invoice INV-2026-001 issued with receipt footer.' },
      { step: 16, title: 'Table Session Closed', action: 'Session status updates to Settled. 60-second auto-free countdown timer begins.', module: 'Tables & Sessions', highlight: 'Session archived in daily sales report.' },
      { step: 17, title: 'Table Released & Ready for Next Guest', action: 'Table 5 returns to green "Available" status, ready for the next customer scan.', module: 'Tables Floor View', highlight: 'Complete dining loop accomplished without errors.' }
    ]
  },
  walkIn: {
    id: 'walkIn',
    title: 'Walk-In Customer Reception Workflow',
    description: 'When guests walk directly to reception without scanning QR, staff handle the entire ordering and billing sequence swiftly.',
    steps: [
      { step: 1, title: 'Receptionist Clicks New Order', action: 'Navigate to POS Billing and select "Dine In".', module: 'POS' },
      { step: 2, title: 'Selects Table', action: 'Pick Table 3 from the active table dropdown.', module: 'POS' },
      { step: 3, title: 'Enters Guest Name', action: 'Type guest name and pax count.', module: 'POS' },
      { step: 4, title: 'Adds Items', action: 'Search or tap dish cards to add items to cart.', module: 'POS' },
      { step: 5, title: 'Sends KOT', action: 'Click Send KOT to print or dispatch ticket to kitchen.', module: 'KOT' },
      { step: 6, title: 'Additional Rounds Allowed', action: 'Guest can add more food later from POS or by scanning their table QR.', module: 'Tables' },
      { step: 7, title: 'Settle & Close', action: 'Open Billing Drawer, take payment, print receipt, and close session.', module: 'Billing' }
    ]
  },
  takeaway: {
    id: 'takeaway',
    title: 'Quick Takeaway / Counter Token Workflow',
    description: 'Fast-paced counter ordering for parcel and pickup orders with token generation.',
    steps: [
      { step: 1, title: 'Select Takeaway', action: 'Toggle POS order mode to "Takeaway".', module: 'POS' },
      { step: 2, title: 'Enter Customer Name/Phone', action: 'Add phone for SMS token notification where enabled.', module: 'POS' },
      { step: 3, title: 'Add Takeaway Items', action: 'Add items and packaging charges if applicable.', module: 'POS' },
      { step: 4, title: 'Collect Payment Immediately', action: 'Select Cash or UPI and confirm payment upfront.', module: 'POS' },
      { step: 5, title: 'Print Takeaway Token & Receipt', action: 'Ticket prints with prominent Pickup Token # (e.g. T-42).', module: 'Printers' },
      { step: 6, title: 'Kitchen Marks Ready & Handover', action: 'Order moves to Ready; cashier hands parcel to customer.', module: 'Orders' }
    ]
  },
  billingFlow: {
    id: 'billingFlow',
    title: 'Billing & Settlement Master Workflow',
    description: 'Deep dive into discount vouchers, GST calculations, split payments, and thermal invoice printing.',
    steps: [
      { step: 1, title: 'Open Running Bill', action: 'Click any occupied table or pending invoice.', module: 'Billing Drawer' },
      { step: 2, title: 'Apply Coupon / Discount', action: 'Enter discount code or apply flat rupee reduction.', module: 'Coupons & Billing' },
      { step: 3, title: 'Review Tax Breakdown', action: 'Verify CGST/SGST lines and net payable total.', module: 'GST' },
      { step: 4, title: 'Select Payment Mode', action: 'Settle via Cash, UPI QR, Credit Card, or Split balance.', module: 'Payments' },
      { step: 5, title: 'Print 80mm Invoice', action: 'Generate professional thermal receipt with business GSTIN and thank-you note.', module: 'Thermal Printers' }
    ]
  }
};
