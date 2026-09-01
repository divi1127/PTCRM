# PTcrm UI/Responsive Cleanup — TODO

## Step 1 — Baseline audit
- [x] Read core layout/navigation components: `Layout.jsx`, `Sidebar.jsx`, `Navbar.jsx`, `BottomNav.jsx`
- [x] Read target lead/table pages: `AdminLeads.jsx`, `EmployeeTargets.jsx`, `EmployeeLeads.jsx`
- [x] Read dashboards: `EmployeeDashboard.jsx`, `AdminDashboard.jsx`
- [x] Read representative admin list pages with tables: `AdminBookings.jsx`, `AdminClients.jsx`, `AdminPayments.jsx`, `AdminAttendance.jsx`, `AdminMeetings.jsx`, `AdminTargets.jsx`

## Step 2 — Implement shared responsive table behavior
- [ ] Add/adjust global CSS in `client/src/index.css` for mobile-friendly table wrapping + padding
- [ ] Ensure `.table-wrapper` / `.data-table` behave consistently across all pages
- [ ] Improve action column spacing (wrap/touch targets)

## Step 3 — Improve sidebar + navbar spacing
- [ ] Reduce reliance on inline padding by introducing CSS utility classes or aligning to existing tokens
- [ ] Ensure sidebar logo/user/nav spacing aligns on desktop + mobile

## Step 4 — Lead generation table UI improvements
- [ ] Update `AdminLeads.jsx` table header/body spacing for mobile
- [ ] Update `AdminLeads.jsx` actions area for better wrapping/tapping on mobile

## Step 5 — Employee targets / dashboards responsiveness
- [ ] Update `EmployeeTargets.jsx` inner table spacing on mobile
- [ ] Update `EmployeeDashboard.jsx` card/section spacing on mobile
- [ ] Update `AdminDashboard.jsx` card/charts spacing on mobile

## Step 6 — Verify across all pages
- [ ] Manually run and verify breakpoints: >1024, <=1024, <=640
- [ ] Run `npm run build` (client) and fix any lint/build errors

