# NELMA Water Hub

You are building the complete NELMA Drinking Water Management Dashboard.

This is a serious business operations dashboard that will later be connected to an existing FastAPI backend and database.

IMPORTANT:

DO NOT build a separate customer mobile app.

DO NOT build a Driver mobile app.

DO NOT redesign the existing React Native customer application.

This project is ONLY the WEB DASHBOARD for:

1. SALES_MANAGER

2. SYSTEM_ADMIN

The React Native mobile application already exists separately and supports:

- USER/customer

- DRIVER

The dashboard must be built so it can later be connected cleanly to the existing FastAPI backend by another developer.

For now:

- Use realistic mock data

- Create a proper service/API abstraction

- Do NOT invent a permanent database

- Do NOT lock business logic inside components

- Do NOT build a fake backend that would later need to be removed

- Do NOT use Supabase as the final source of truth unless explicitly instructed later

- Do NOT create backend tables that conflict with the existing FastAPI system

==================================================

1. PRODUCT

==================================================

Product name:

NELMA Drinking Water

NELMA provides 20-liter drinking water.

Current products/services:

FIRST-TIME PURCHASE

Price:

TZS 18,000

Includes:

- Drinking water

- New 20-liter bottle

REFILL

Price:

TZS 4,000

The application has NO Bottle Management subsystem.

IMPORTANT:

"New bottle purchase" is simply a product/service.

DO NOT create:

- bottle inventory

- bottle ownership

- bottle IDs

- customer bottle balances

- bottle exchange tracking

- QR bottle scanning

- RFID

- bottle lifecycle management

- bottle-management pages

==================================================

2. EXISTING NELMA PLATFORM

==================================================

The overall platform consists of:

NELMA PLATFORM

MOBILE APP

├── USER

└── DRIVER

WEB DASHBOARD

├── SALES_MANAGER

└── SYSTEM_ADMIN

This project is ONLY the WEB DASHBOARD.

==================================================

3. DASHBOARD ROLES

==================================================

There are exactly TWO dashboard roles:

SALES_MANAGER

SYSTEM_ADMIN

DO NOT create:

ADMIN

SUPER_ADMIN

OPERATOR

FINANCE

SUPPORT

MANAGER

STAFF

or any other additional dashboard role.

Use exactly:

SALES_MANAGER

SYSTEM_ADMIN

==================================================

4. AUTHORITATIVE ROLE PERMISSIONS

==================================================

The following permissions are authoritative.

--------------------------------------------------

SALES_MANAGER

--------------------------------------------------

Can:

- Place orders on behalf of customers

- View customer/order information needed for sales operations

- View assigned deliveries

- Update deliveries

- Process orders

- Assign drivers

- View sales reports

- Manage drivers

- Manage pricing

Cannot:

- Manage system settings

- Manage dashboard/admin accounts

- View audit logs

Customer receipt confirmation for Sales Manager is UNDECIDED.

Therefore:

DO NOT give Sales Manager a "Confirm Customer Receipt" action yet.

--------------------------------------------------

SYSTEM_ADMIN

--------------------------------------------------

Can:

- View orders

- View assigned deliveries

- Assign drivers

- View sales reports

- Manage drivers

- Manage system settings

- Manage pricing

- Manage dashboard/admin accounts

- View audit logs

Cannot:

- Place orders

- Process orders

- Confirm customer receipt

System Admin delivery-update permission is UNDECIDED.

Therefore:

DO NOT allow System Admin to update delivery status yet.

System Admin may VIEW delivery details and assign drivers.

==================================================

5. IMPORTANT VIEW VS ACTION RULE

==================================================

Some roles can view information without being allowed to operate it.

Example:

System Admin can view an order.

That does NOT mean System Admin can:

- confirm the order

- process the order

- create an order

- mark it delivered

Similarly:

System Admin can view deliveries.

That does NOT mean System Admin can update delivery status.

Every button/action in the dashboard must respect role permissions.

==================================================

6. LOGIN PAGE

==================================================

Build a professional dashboard login page.

Fields:

Email / Phone

Password

Button:

Sign In

Brand:

NELMA

Subtitle:

Management Portal

Do NOT ask:

"Login as Sales Manager or Admin?"

The backend will determine the authenticated role later.

For frontend mock mode, create two demo identities internally:

Sales Manager

System Admin

But do not make role selection part of the production login UI.

==================================================

7. ROLE-AWARE ROUTING

==================================================

After authentication:

SALES_MANAGER

→ Sales Manager dashboard experience

SYSTEM_ADMIN

→ System Admin dashboard experience

Navigation and actions must change based on role.

Do not simply hide pages visually.

Structure the frontend so route guards can later use backend authentication.

==================================================

8. DESIGN LANGUAGE

==================================================

Use NELMA's existing visual identity.

Main colors:

#6395EE

Primary blue

#90B8D6

Soft blue

#88CFA8

Soft green

#85DECB

Mint / turquoise

Supporting:

- White

- Dark charcoal text

- Soft gray backgrounds

- Light neutral borders

The dashboard should feel:

- Modern

- Clean

- Fresh

- Premium

- Professional

- Water-related

- Operational

- Easy to scan

- Not overly decorative

Avoid making the entire interface blue.

Use the four brand colors intelligently.

==================================================

9. UI FRAMEWORK

==================================================

Use a professional modern web stack supported well by Lovable.

Prefer:

- React

- TypeScript

- Responsive web design

- Tailwind CSS

- shadcn/ui or equivalent high-quality component system

- Lucide icons or equivalent

- Reusable chart components

- Accessible controls

Use clean component architecture.

==================================================

10. DASHBOARD LAYOUT

==================================================

Create:

LEFT SIDEBAR

TOP HEADER

MAIN CONTENT

Responsive behavior

Desktop-first but usable on tablets.

Desktop sidebar should contain role-appropriate modules.

Header can include:

NELMA

Current page

Notifications

Authenticated staff name

Role badge

Profile menu

==================================================

11. SALES MANAGER NAVIGATION

==================================================

Sales Manager sidebar:

Dashboard

Orders

Create Order

Deliveries

Drivers

Sales

Pricing

Notifications

Profile

DO NOT show:

System Settings

Admin Accounts

Audit Logs

to Sales Manager.

==================================================

12. SYSTEM ADMIN NAVIGATION

==================================================

System Admin sidebar:

Overview

Orders

Deliveries

Drivers

Sales Reports

Pricing

Admin Accounts

System Settings

Audit Logs

Notifications

Profile

DO NOT show:

Create Order

because System Admin cannot place orders.

==================================================

13. SALES MANAGER DASHBOARD

==================================================

Build a useful operational homepage.

Show cards such as:

Today's Orders

Pending Orders

Processing

Out for Delivery

Completed Today

Today's Sales

Pending Payments

Active Drivers

Use realistic mock values.

Example:

Today's Orders

48

Processing

12

Out for Delivery

9

Completed

21

Today's Sales

TZS 628,000

Do not overload the page.

==================================================

14. SALES MANAGER DASHBOARD SECTIONS

==================================================

Include:

A. Order activity

Recent incoming orders.

B. Deliveries needing assignment

C. Drivers currently active

D. Today's sales overview

E. Order status breakdown

F. Recent activity

Use charts only where useful.

==================================================

15. SYSTEM ADMIN OVERVIEW

==================================================

System Admin overview should focus on system/business oversight rather than order-processing actions.

Show:

Total orders today

Sales today

Active drivers

Active Sales Managers

Pending deliveries

Payment status overview

System status

Recent administrative activity

System Admin may inspect operations without becoming the Sales Manager.

==================================================

16. ORDERS PAGE

==================================================

Create a powerful Orders page.

Filters:

All

Received

Confirmed

Processing

Out for Delivery

Delivered

Customer Received

Cancelled

Additional filters:

Date

Delivery date

Payment method

Payment status

Product type

Customer search

Search:

Customer name

Phone

IMPORTANT:

Order numbers exist internally in the backend but have intentionally been removed from visible interfaces.

DO NOT display order numbers as primary visible UI.

Use customer/product/date/status to identify orders visually.

==================================================

17. ORDER LIST

==================================================

Each order row/card can show:

Customer

Phone

Product

Quantity

Order time/date

Requested delivery date

Requested delivery time

Payment method

Payment status

Total

Order status

Actions depend on role.

==================================================

18. ORDER STATUS LIFECYCLE

==================================================

Existing NELMA order lifecycle:

Order Received

Confirmed

Processing

Out for Delivery

Delivered

Customer Received

Cancelled is separate.

Use these exact customer-facing labels.

Timeline behavior should conceptually match:

Past:

Completed

Current:

In progress

Future:

Not started

Do not introduce unrelated statuses without reason.

==================================================

19. SALES MANAGER ORDER ACTIONS

==================================================

Sales Manager can process orders.

On order detail:

Order Received

Action:

[ Confirm Order ]

Then:

Confirmed

Action:

[ Start Processing ]

Processing stage can then proceed to driver assignment.

Do not let Sales Manager directly skip arbitrarily through statuses.

Use valid transitions.

==================================================

20. SYSTEM ADMIN ORDER EXPERIENCE

==================================================

System Admin can VIEW order details.

System Admin cannot process orders.

Therefore do NOT show:

Confirm Order

Start Processing

Create Order

for System Admin.

System Admin may still see:

Customer

Product

Amount

Delivery

Payment

Status

Assigned driver

Timeline

==================================================

21. ORDER DETAIL PAGE

==================================================

Create a polished detailed view.

Sections:

Customer

Name

Phone

Order

Product

Quantity

Unit price

Subtotal

Delivery

Location

Phone

Instructions

Requested date

Requested time window

Payment

Payment method

Payment status

Charges

Product subtotal

Delivery charge

Final total

Delivery assignment

Assigned driver

Delivery status

Timeline

Order Received

Confirmed

Processing

Out for Delivery

Delivered

Customer Received

==================================================

22. EXISTING CUSTOMER ORDER EXPERIENCE

==================================================

The customer mobile app currently uses:

Product selection

→ Quantity

→ Delivery Address

→ Payment

→ Summary

→ Confirmation

Dashboard data must conceptually match that information.

Current customer-side product choices:

New bottle purchase

20L refill

==================================================

23. CREATE ORDER — SALES MANAGER ONLY

==================================================

Sales Manager can place orders for customers.

Create a dedicated:

Create Order

experience.

System Admin MUST NOT have this page/action.

==================================================

24. CREATE ORDER FLOW

==================================================

Sales Manager order creation:

STEP 1

Customer

Search by:

Name

Phone

Select customer.

Optionally allow preparing the UI for future "New Customer" creation, but do not invent a customer-registration backend.

STEP 2

Product

New bottle purchase

TZS 18,000

or

20L Refill

TZS 4,000

STEP 3

Quantity

STEP 4

Delivery location

Use/select customer's saved location if available.

Or manually enter delivery location.

STEP 5

Delivery date

STEP 6

Delivery time

STEP 7

Payment method

Cash

Mobile Money should visually show:

Under construction

unless backend configuration later enables it.

STEP 8

Review

STEP 9

Create Order

==================================================

25. SALES MANAGER-CREATED ORDER

==================================================

The future backend will record:

customer_id

and:

created_by_user_id

separately.

The customer owns the order.

Sales Manager created it.

Prepare the frontend models for:

createdBy

source

Possible source:

USER_MOBILE

SALES_MANAGER_DASHBOARD

Do not invent backend IDs.

==================================================

26. DELIVERY PAGE

==================================================

Create a Deliveries module.

Views:

All

Unassigned

Assigned

Out for Delivery

Delivered

Show:

Customer

Location

Delivery date

Time slot

Product

Quantity

Driver

Delivery status

==================================================

27. DELIVERY ASSIGNMENT

==================================================

Both:

SALES_MANAGER

SYSTEM_ADMIN

can assign drivers.

Provide:

[ Assign Driver ]

Open a drawer/modal.

Show available drivers.

Driver card:

Name

Status

Today's assigned deliveries

Current workload

Allow selection.

Then:

[ Assign ]

Use confirmation dialog.

==================================================

28. DELIVERY UPDATE PERMISSIONS

==================================================

Sales Manager:

Can update delivery.

System Admin:

CANNOT update delivery for now because permission is undecided.

Therefore:

System Admin can:

View

Assign driver

but no delivery status-changing buttons.

==================================================

29. DRIVER MANAGEMENT

==================================================

Both:

SALES_MANAGER

SYSTEM_ADMIN

can manage drivers.

Create Drivers page.

Show:

Name

Phone

Status

Current workload

Today's deliveries

Completed deliveries

Availability

Statuses such as:

Active

Inactive

Do not invent complex GPS driver tracking.

==================================================

30. DRIVER DETAIL

==================================================

Show:

Driver name

Phone

Status

Today's assignments

Active delivery

Completed delivery count

Recent delivery history

Management actions can include:

Activate

Deactivate

Edit details

depending on future backend support.

Use confirmation dialogs.

Avoid destructive delete as primary behavior.

==================================================

31. SALES REPORTS

==================================================

Both dashboard roles can view reports.

Create Sales page.

Filters:

Today

This Week

This Month

Custom Date Range

Metrics:

Total sales

Total orders

Units sold

First-time purchases

Refills

Completed orders

Cancelled orders

Cash payments

Pending payments

Delivery charges

==================================================

32. SALES CHARTS

==================================================

Useful charts:

Sales over time

Order volume over time

Product mix:

First Purchase vs Refill

Order status distribution

Payment status distribution

Avoid meaningless decorative charts.

==================================================

33. SALES TABLE

==================================================

Provide detailed sales records.

Columns:

Date

Customer

Product

Quantity

Payment method

Payment status

Final total

Order number should remain internal and not visibly emphasized.

==================================================

34. PRICING PAGE

==================================================

Both:

SALES_MANAGER

SYSTEM_ADMIN

can manage pricing.

Create Pricing page.

Current values:

New Bottle Purchase

TZS 18,000

20L Refill

TZS 4,000

Show:

Current price

Last updated

Updated by

Actions:

Edit Price

Use a confirmation modal.

Example:

Change Refill Price

Current:

TZS 4,000

New:

[________]

[ Cancel ]

[ Update Price ]

==================================================

35. PRICING SAFETY

==================================================

Use validation.

Prices must:

be numeric

be greater than zero

use TZS

Frontend must never assume it is authoritative.

Future FastAPI backend will calculate actual order prices.

==================================================

36. DELIVERY FEE

==================================================

The customer app currently shows delivery fees.

DO NOT invent NELMA delivery pricing rules.

Show existing backend/mock delivery fee data.

If configuration is needed, structure UI so it can later receive server-defined rules.

Do NOT hardcode arbitrary location-based fees.

==================================================

37. PAYMENT METHODS

==================================================

Current customer application behavior:

Cash

→ available/default

Mobile Money

→ Under construction

Dashboard should reflect this.

Payment method labels:

Cash

Mobile money

Under construction

Do not invent real M-Pesa or Airtel APIs.

==================================================

38. PAYMENT STATUS

==================================================

Use statuses such as:

Pending

Paid

Failed

Cancelled

Refunded

Cash should not automatically appear as paid simply because an order exists.

Dashboard should make payment status obvious.

==================================================

39. PAYMENT MANAGEMENT

==================================================

Sales Manager should be able to VIEW relevant payment status.

Do not invent payment confirmation actions unless required by the existing backend permission model.

Prepare component structure for future payment actions.

System Admin can view payment information as part of oversight.

==================================================

40. ADMIN ACCOUNTS — SYSTEM ADMIN ONLY

==================================================

Create Admin Accounts page.

Accessible ONLY to:

SYSTEM_ADMIN

Manage:

Sales Manager accounts

System Admin accounts

Show:

Name

Phone/email

Role

Status

Created date

Last login

Actions:

Create Account

Edit

Activate

Deactivate

Do not permanently delete important historical staff accounts by default.

==================================================

41. CREATE ADMIN ACCOUNT

==================================================

System Admin form:

Full Name

Phone

Email

Role

Role options ONLY:

Sales Manager

System Admin

No customer or driver role here.

Password creation/reset behavior should be designed for future backend integration.

Do not store plaintext passwords in frontend state longer than necessary.

==================================================

42. SALES MANAGER RESTRICTION

==================================================

Sales Manager must never see:

Admin Accounts

or related APIs/actions.

Do not expose this page merely by URL navigation in mock routing.

Implement frontend route guards.

==================================================

43. SYSTEM SETTINGS — SYSTEM ADMIN ONLY

==================================================

Create System Settings.

Possible modules:

Business information

Available payment methods

Notification configuration

Delivery configuration placeholders

Application preferences

IMPORTANT:

Do not invent important business rules.

Use safe configuration placeholders.

==================================================

44. BUSINESS INFORMATION

==================================================

Example settings:

Business name

Support phone

Support email

Business address

Operating hours

Do not invent real NELMA contact information.

Use clearly editable mock placeholders.

==================================================

45. PAYMENT METHOD SETTINGS

==================================================

Allow UI representation of:

Cash

Enabled

Mobile Money

Under construction / Disabled

Do not pretend Mobile Money is operational.

==================================================

46. AUDIT LOGS — SYSTEM ADMIN ONLY

==================================================

Create Audit Logs page.

Sales Manager must not access it.

Audit event examples:

Sales Manager changed refill price

Sales Manager assigned a driver

System Admin created a Sales Manager account

Driver account deactivated

System setting changed

Order created by Sales Manager

==================================================

47. AUDIT LOG TABLE

==================================================

Columns:

Date/time

Actor

Role

Action

Entity

Description

Filters:

Date

Actor

Action

Entity type

Use read-only interface.

No editing/deleting audit events.

==================================================

48. NOTIFICATIONS

==================================================

Both dashboard roles should have a notification center.

Examples:

New order received

Delivery requires assignment

Delivery completed

Payment issue

Driver unavailable

Important system event

Make notifications role-specific.

==================================================

49. PROFILE

==================================================

Dashboard profile page:

Name

Email

Phone

Role

Options:

Edit Profile

Security

Logout

Do not allow role self-editing.

==================================================

50. SEARCH

==================================================

Provide useful global or module-specific search.

Search can include:

Customer name

Phone

Driver name

Do not rely on visible order numbers.

==================================================

51. RESPONSIVE DESIGN

==================================================

Dashboard is primarily desktop.

Support:

Laptop

Desktop

Tablet

On smaller screens:

Sidebar can collapse.

Tables should remain usable.

Do not optimize this as a phone-first application.

==================================================

52. EMPTY STATES

==================================================

Create good empty states.

Examples:

No pending orders.

No deliveries require assignment.

No sales data for this period.

No active drivers.

No audit events found.

Avoid irrelevant water-bottle artwork in administrative empty states.

==================================================

53. LOADING STATES

==================================================

Every data page should support:

Loading

Loaded

Empty

Error

Create reusable:

Skeleton cards

Table skeletons

Loading indicators

==================================================

54. ERROR STATES

==================================================

Create reusable error components.

Example:

Unable to load orders.

[ Try Again ]

Do not show raw JSON errors.

==================================================

55. CONFIRMATION DIALOGS

==================================================

Use confirmations for important operations:

Change pricing

Assign/reassign driver

Deactivate staff account

Change system setting

Cancel order if later supported

==================================================

56. TOASTS

==================================================

Use clean toast feedback.

Examples:

Driver assigned successfully.

Price updated.

Account deactivated.

Unable to update. Please try again.

==================================================

57. MOCK DATA ARCHITECTURE

==================================================

For now use mock data.

BUT DO NOT put giant hardcoded arrays directly inside pages.

Create:

services/

repositories/

mocks/

types/

Suggested architecture:

UI

↓

Repository

↓

Mock Repository

Later:

UI

↓

Repository

↓

FastAPI Repository

==================================================

58. API ABSTRACTION

==================================================

Prepare:

services/api.ts

and domain services/repositories.

For example:

authService

ordersService

driversService

salesService

pricingService

adminAccountsService

settingsService

auditService

notificationsService

Do NOT have screens directly call fetch everywhere.

==================================================

59. FUTURE FASTAPI INTEGRATION

==================================================

The dashboard will later connect to an existing FastAPI backend.

Prepare for:

VITE_API_URL

or equivalent environment variable.

Do not hardcode localhost.

==================================================

60. EXPECTED FUTURE API CONCEPTS

==================================================

Prepare frontend services conceptually for endpoints such as:

POST /auth/dashboard/login

GET /admin/dashboard

GET /admin/orders

GET /admin/orders/{id}

POST /admin/orders

POST /admin/orders/{id}/confirm

POST /admin/orders/{id}/process

GET /admin/deliveries

POST /admin/deliveries/{id}/assign

GET /admin/drivers

POST /admin/drivers

PATCH /admin/drivers/{id}

GET /admin/reports/sales

GET /admin/pricing

PATCH /admin/pricing/{product}

GET /admin/accounts

POST /admin/accounts

PATCH /admin/accounts/{id}

GET /admin/settings

PATCH /admin/settings

GET /admin/audit-logs

GET /notifications

These are architectural expectations only.

Do not create a conflicting backend.

==================================================

61. TYPE DEFINITIONS

==================================================

Create TypeScript models.

At minimum:

DashboardUser

Role

Customer

Order

OrderItem

OrderStatus

PaymentStatus

PaymentMethod

Delivery

DeliveryStatus

Driver

PriceConfiguration

SalesSummary

Notification

AuditEvent

AdminAccount

SystemSettings

PaginatedResponse

ApiError

==================================================

62. ROLE TYPES

==================================================

Use:

type DashboardRole =

  | "SALES_MANAGER"

  | "SYSTEM_ADMIN";

Do not add more dashboard roles.

==================================================

63. ORDER TYPE

==================================================

Use:

type OrderType =

  | "first_purchase"

  | "refill";

==================================================

64. ORDER STATUS

==================================================

Use business status values compatible with:

pending

confirmed

processing

out_for_delivery

delivered

customer_received

cancelled

Labels:

Order Received

Confirmed

Processing

Out for Delivery

Delivered

Customer Received

Cancelled

==================================================

65. PAYMENT METHOD

==================================================

Prepare:

cash

mobile_money

Mobile Money currently disabled/under construction.

==================================================

66. CURRENCY

==================================================

Use Tanzanian Shillings.

Format:

TZS 18,000

TZS 4,000

TZS 628,000

Create one reusable currency formatter.

Do not display:

$18,000

==================================================

67. DATE/TIME

==================================================

Use readable local date/time displays.

Prepare frontend architecture for Tanzanian local time.

Delivery schedules must clearly show:

Date

and:

Time window

Example:

03 Sep 2026

10:00 – 12:00

==================================================

68. CUSTOMER LOCATION

==================================================

Customer location information may include:

Structured delivery location

Phone

Instructions

Optional coordinates

Dashboard should show readable address first.

If coordinates exist:

provide a future-friendly:

Open Map

action.

Do not implement a complex custom map unless needed.

==================================================

69. SECURITY UI

==================================================

Prepare:

ProtectedRoute

or equivalent.

Unauthorized dashboard role:

redirect appropriately.

Sales Manager cannot navigate to:

/admin-accounts

/system-settings

/audit-logs

even by manually entering URL.

==================================================

70. DO NOT FAKE BACKEND SECURITY

==================================================

Frontend guards are for UX only.

Leave architecture clearly ready for FastAPI backend authorization.

Add comments/documentation that backend is authoritative.

==================================================

71. MOCK LOGIN

==================================================

For development/demo only, implement a clean mock auth mechanism.

Do not show production users a role selector.

Developer/mock identities may be configured internally.

For example:

Sales Manager demo

System Admin demo

Clearly separate mock auth from future API auth.

==================================================

72. COMPONENT SYSTEM

==================================================

Create reusable components.

Examples:

DashboardLayout

Sidebar

TopBar

StatCard

StatusBadge

RoleBadge

OrderTable

OrderCard

OrderTimeline

DriverCard

AssignmentModal

PriceEditModal

ConfirmDialog

SalesChart

EmptyState

ErrorState

LoadingSkeleton

SearchInput

FilterBar

DateRangePicker

NotificationItem

AuditLogTable

==================================================

73. STATUS COLORS

==================================================

Use consistent status colors.

Avoid random per-page styling.

Examples:

Received

soft blue

Confirmed

blue

Processing

mint

Out for Delivery

appropriate stronger accent

Delivered

green

Cancelled

red/neutral danger

Pending payment

warning tone

Paid

success

Do not compromise accessibility.

==================================================

74. TABLES

==================================================

Desktop data tables should support:

Sorting where useful

Filtering

Pagination

Row click

Responsive overflow

Avoid putting ten action buttons in every row.

Use contextual menus.

==================================================

75. PAGINATION

==================================================

Build pagination-friendly repository contracts.

Do not assume all orders/drivers/audit events will load at once.

Support:

page

pageSize

total

==================================================

76. ACCESSIBILITY

==================================================

Use:

Keyboard-accessible controls

Labels

Accessible dialogs

Good contrast

Clear focus states

Large enough click targets

==================================================

77. PERFORMANCE

==================================================

Avoid:

Huge single components

Massive hardcoded datasets

Unnecessary renders

Loading every page's data globally

Use sensible component splitting.

==================================================

78. NO CUSTOMER APP REDESIGN

==================================================

Do NOT create or redesign:

Customer Home

Customer quantity screen

Customer delivery address screen

Customer payment screen

These already exist in React Native.

The web dashboard only needs to interact with data generated by those flows.

==================================================

79. CUSTOMER APP BEHAVIOR TO MATCH

==================================================

Current customer application behavior:

Home shows:

New bottle purchase

20L refill

Product click goes directly to Quantity.

There is NO separate product-type selection page.

Checkout:

Quantity

→ Delivery Address

→ Payment

→ Summary

→ Confirmation

Delivery Address supports:

Saved addresses

Structured location

Phone prefill

Instructions

GPS

Manual map pin

Delivery fee

Delivery date

Delivery time

Save location

Payment:

Cash first/default

Mobile money:

Under construction

Order summary:

Product

Quantity

Subtotal

Delivery

Phone

Instructions

Date

Time

Charges

Payment

Total

Visible order numbers have been removed.

Dashboard design should respect this existing system.

==================================================

80. NO VISIBLE ORDER NUMBER EMPHASIS

==================================================

Backend order IDs/order numbers exist internally.

But visible order numbers were intentionally removed from the current UX.

Do not make order number the primary identifier in tables, cards, summaries, or queues.

==================================================

81. DELIVERY SCHEDULING

==================================================

Dashboard must clearly support the existing:

Requested delivery date

Requested delivery time slot

Sales Manager should be able to see these when planning/assigning deliveries.

==================================================

82. CUSTOMER RECEIPT

==================================================

Current lifecycle includes:

Customer Received

Sales Manager permission to confirm customer receipt is undecided.

Therefore:

DO NOT show Sales Manager a "Confirm Customer Receipt" button.

System Admin cannot confirm customer receipt.

Dashboard may DISPLAY whether customer receipt is confirmed.

==================================================

83. SYSTEM ADMIN DELIVERY UPDATE

==================================================

System Admin delivery-update permission is undecided.

Therefore:

System Admin can view delivery.

System Admin can assign driver.

System Admin cannot currently change delivery status.

==================================================

84. NO BOTTLE MANAGEMENT

==================================================

Repeat:

DO NOT create:

Bottle Management

Bottle Inventory

Bottle Ownership

Bottle ID

Bottle Balance

Bottle Scan

QR/RFID

Bottle Exchange

Bottle Tracking

Product description:

New bottle purchase

is allowed.

==================================================

85. SAMPLE MOCK DATA

==================================================

Use realistic Tanzanian names and TZS amounts.

Example customers:

John Mwita

Amina Hassan

Neema Joseph

Baraka Mushi

Example locations:

Sinza

Mikocheni

Mbezi

Kinondoni

University/campus-style delivery location

Do not use offensive or unrealistic placeholder data.

==================================================

86. DASHBOARD DEMO DATA

==================================================

Populate enough mock information to make all screens useful.

Include:

Multiple order statuses

Multiple drivers

Different delivery dates

Cash payments

Pending payments

New purchase orders

Refill orders

Sales history

Audit entries

Notifications

==================================================

87. PRODUCT IMAGERY

==================================================

The mobile app already uses:

Bottle.jpeg

for first-time purchase

and:

refill.jpg

for refill

If these exact assets are not available inside the dashboard project:

do not invent copyrighted product images.

Use tasteful product placeholders or clean icons until actual assets are supplied.

==================================================

88. CHART QUALITY

==================================================

Charts should include:

Axis labels where appropriate

Readable TZS formatting

Tooltips

Date labels

Responsive sizing

Do not use fake 3D charts.

==================================================

89. EXPORT PREPARATION

==================================================

For sales reports, prepare UI for future:

Export CSV

Export PDF

But if export functionality is not actually implemented:

do not show nonfunctional buttons.

If implemented, generate real files.

==================================================

90. ACTIVITY / AUDIT DIFFERENCE

==================================================

Sales Manager may see simple operational:

Recent Activity

on dashboard.

This is NOT the same as full Audit Logs.

Full system Audit Logs are SYSTEM_ADMIN only.

==================================================

91. NOTIFICATIONS VS AUDIT

==================================================

Notifications:

Actionable/current information.

Audit Logs:

Immutable administrative/system history.

Do not mix the concepts.

==================================================

92. DRIVER AVAILABILITY

==================================================

Driver module should support a simple operational representation:

Active

Inactive

and workload counts.

Do not invent live GPS tracking or complex driver shifts unless added later.

==================================================

93. ORDER CANCELLATION

==================================================

If the existing backend supports cancellation:

prepare the UI architecture.

Do not invent unrestricted cancellation.

Use role/business rules.

If unclear:

show cancellation status only and leave destructive action out until API rules are confirmed.

==================================================

94. SYSTEM ADMIN DOES NOT OPERATE SALES

==================================================

Very important design principle:

SYSTEM_ADMIN

is not a more powerful Sales Manager.

System Admin administers and oversees the platform.

Therefore avoid automatically giving System Admin every Sales Manager action.

Respect explicit permissions.

==================================================

95. SALES MANAGER IS OPERATIONAL

==================================================

Sales Manager should feel like the daily command center for NELMA.

Their most important tasks:

Receive orders

Process orders

Create phone/manual orders

Assign drivers

Monitor deliveries

Manage drivers

View sales

Manage pricing

Optimize UI around these tasks.

==================================================

96. SYSTEM ADMIN IS ADMINISTRATIVE

==================================================

System Admin priorities:

System oversight

Driver/admin account control

Pricing

System configuration

Sales visibility

Delivery assignment oversight

Audit logs

Optimize their navigation accordingly.

==================================================

97. FRONTEND STATE

==================================================

Use sensible frontend state management.

Separate:

Auth

Orders

Deliveries

Drivers

Pricing

Reports

Notifications

System settings

Do not create a single giant global store.

==================================================

98. MOCK/API SWITCH

==================================================

Create environment-controlled data mode if appropriate.

Example:

VITE_DATA_MODE=mock

Later:

VITE_DATA_MODE=api

or implement repository injection.

Switching to FastAPI must not require rewriting screens.

==================================================

99. ENVIRONMENT FILE

==================================================

Create:

.env.example

Example:

VITE_API_URL=http://localhost:8000/api/v1

VITE_DATA_MODE=mock

Do not put real credentials in frontend environment files.

==================================================

100. CODE QUALITY

==================================================

Use:

TypeScript

Reusable hooks

Reusable components

Strong typing

Consistent naming

Avoid:

any

huge files

duplicated business logic

inline mock data everywhere

unused components

==================================================

101. TESTING

==================================================

Add tests where supported.

At minimum test:

Role-based navigation

Sales Manager:

can see Create Order

cannot see Admin Accounts

cannot see Settings

cannot see Audit Logs

System Admin:

cannot create order

can see Admin Accounts

can see Settings

can see Audit Logs

Permission-driven actions

Pricing formatting

Order status labels

TZS currency formatting

==================================================

102. ACCEPTANCE TEST — SALES MANAGER

==================================================

Login as Sales Manager.

Expected navigation:

Dashboard

Orders

Create Order

Deliveries

Drivers

Sales

Pricing

Notifications

Profile

Verify:

Can inspect order.

Can process order.

Can create customer order.

Can assign driver.

Can manage drivers.

Can view reports.

Can edit pricing.

Cannot access:

Admin Accounts

System Settings

Audit Logs

Cannot confirm customer receipt.

==================================================

103. ACCEPTANCE TEST — SYSTEM ADMIN

==================================================

Login as System Admin.

Expected navigation:

Overview

Orders

Deliveries

Drivers

Sales Reports

Pricing

Admin Accounts

System Settings

Audit Logs

Notifications

Profile

Verify:

Can view orders.

Cannot create order.

Cannot process order.

Can view deliveries.

Can assign drivers.

Cannot currently update delivery status.

Can manage drivers.

Can view reports.

Can manage pricing.

Can manage admin accounts.

Can manage system settings.

Can view audit logs.

Cannot confirm customer receipt.

==================================================

104. VISUAL ACCEPTANCE

==================================================

The finished dashboard must look like a real production business application.

Do not create:

Generic template dashboard

Huge empty hero banners

Crypto-style cards

Unnecessary glassmorphism

Excessive gradients

Random marketing landing pages

This is an operations dashboard.

Prioritize:

Information hierarchy

Speed

Readability

Professional appearance

Efficient workflows

==================================================

105. DASHBOARD HOME SHOULD FEEL ALIVE

==================================================

Use realistic data to show:

Orders arriving

Deliveries in progress

Drivers assigned

Sales changing

Recent events

It should immediately communicate:

"What is happening at NELMA right now?"

==================================================

106. FINAL DELIVERABLE

==================================================

Build the COMPLETE WEB DASHBOARD frontend.

Do not stop after making the sidebar and homepage.

Implement:

Login

Role-aware routing

Sales Manager dashboard

System Admin overview

Orders

Order detail

Create Order

Deliveries

Driver assignment

Drivers

Driver detail

Sales reports

Pricing

Notifications

Admin Accounts

System Settings

Audit Logs

Profile

Reusable components

Loading/error/empty states

Mock repositories

API abstraction

Responsive behavior

Role guards

==================================================

107. IMPORTANT FINAL RULES

==================================================

DO NOT build a backend/database that conflicts with FastAPI.

DO NOT redesign the React Native customer app.

DO NOT add extra roles.

DO NOT implement Bottle Management.

DO NOT invent delivery pricing.

DO NOT enable Mobile Money.

DO NOT expose undecided permissions.

DO NOT show Sales Manager admin-only pages.

DO NOT make System Admin behave like Sales Manager.

DO NOT emphasize visible order numbers.

DO build the entire working dashboard frontend using mock data and an API-ready architecture.

==================================================

108. FINAL REPORT

==================================================

When finished, tell me:

1. Pages created

2. Components created

3. Sales Manager navigation

4. System Admin navigation

5. Role guards implemented

6. Order workflows implemented

7. Create Order workflow

8. Delivery assignment workflow

9. Driver management

10. Sales reporting

11. Pricing management

12. Admin Account management

13. System Settings

14. Audit Logs

15. Notification center

16. Mock-data architecture

17. API/repository architecture

18. Environment variables

19. How to run the dashboard

20. Remaining FastAPI integration points

Most importantly:

BUILD THE FULL DASHBOARD EXPERIENCE NOW.

Use mock data temporarily.

Make every implemented screen interactive and polished.

Keep the architecture ready so Codex can later replace the mock repositories with the actual NELMA FastAPI API without rebuilding the frontend.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/87dcfe87-0733-42e7-b581-2157d4200796).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
