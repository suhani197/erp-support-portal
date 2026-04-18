-- =====================================================
-- V2__seed_data.sql
-- Demo seed: 3 users, SLA policies, 10 KB articles, 20 tickets
-- All passwords = "password123" (BCrypt encoded)
-- =====================================================

-- Users
INSERT INTO users (email, password, full_name, role) VALUES
('admin@erp.com',     '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh5y', 'Admin User',       'ADMIN'),
('agent@erp.com',     '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh5y', 'Alice Agent',      'AGENT'),
('requester@erp.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh5y', 'Bob Requester',    'REQUESTER');

-- SLA Policies
INSERT INTO sla_policies (priority, first_response_minutes, resolution_minutes) VALUES
('P1', 60,   240),
('P2', 240,  1440),
('P3', 1440, 4320);

-- Tags
INSERT INTO tags (name) VALUES
('login'), ('invoice'), ('slow'), ('error'), ('config'),
('upgrade'), ('integration'), ('report'), ('access'), ('data');

-- KB Articles
INSERT INTO kb_articles (title, module, symptoms, root_cause, resolution_steps, status, created_by_id) VALUES
('Cannot log in to ERP – password error',
 'TECHNICAL', 'User receives "Invalid credentials" on login screen',
 'Account locked after 5 failed attempts or AD sync delay',
 E'1. Check if account is locked in user management\n2. Reset password via admin panel\n3. If AD-synced, force AD sync from Settings > Integration > LDAP\n4. Clear browser cache and retry',
 'PUBLISHED', 1),

('Invoice posting fails with GL account error',
 'FINANCE', 'Error: "GL account 4001 not found" when posting invoice',
 'Chart of accounts not updated after fiscal year rollover',
 E'1. Navigate to Finance > Chart of Accounts\n2. Verify GL account 4001 exists and is active\n3. If missing, create it under the correct account group\n4. Re-post the invoice',
 'PUBLISHED', 1),

('Inventory count shows negative stock',
 'INVENTORY', 'Stock balance shows negative values in inventory report',
 'Goods issue posted before goods receipt was confirmed',
 E'1. Run stock reconciliation report: Inventory > Reports > Reconciliation\n2. Identify the transaction causing the imbalance\n3. Post a correction goods receipt\n4. Enable the "prevent negative stock" flag in warehouse settings',
 'PUBLISHED', 1),

('Sales order stuck in pending approval',
 'SALES', 'Sales order remains in "Pending Approval" status for >24h',
 'Approval workflow escalation rule not triggered due to missing approver',
 E'1. Open the order and click "Approval History"\n2. Check which approver step is pending\n3. Reassign approver in Workflow > Approval Rules\n4. Manually trigger escalation if >SLA threshold',
 'PUBLISHED', 1),

('ERP runs slow after month-end close',
 'TECHNICAL', 'System response time >10s on all screens after month-end',
 'Statistics not updated on core tables; index bloat',
 E'1. Schedule maintenance window\n2. Run: VACUUM ANALYZE on finance tables\n3. Rebuild indexes: Settings > Database > Rebuild Indexes\n4. Refresh materialized views for reporting schema\n5. Monitor via Settings > Performance Dashboard',
 'PUBLISHED', 1),

('Report export produces empty Excel file',
 'TECHNICAL', 'Clicking "Export to Excel" downloads a file with no data',
 'Report filter returns zero rows due to incorrect date range default',
 E'1. Check the date range filter on the report – default may be "today" with no data\n2. Set explicit date range and re-run\n3. If issue persists, clear report cache: Settings > Reports > Clear Cache\n4. Reinstall Excel plugin if using embedded export',
 'PUBLISHED', 2),

('Purchase order approval not sending email notification',
 'PROCUREMENT', 'Approvers do not receive email when PO is submitted',
 'SMTP relay configuration changed after server migration',
 E'1. Go to Settings > Email > SMTP Configuration\n2. Test SMTP connection using the built-in test button\n3. Check spam/junk folder for test email\n4. Update relay host if server was migrated\n5. Re-save notification templates to flush cache',
 'PUBLISHED', 2),

('User cannot access Finance module after role change',
 'FINANCE', 'User gets "Access Denied" after being moved to Finance team',
 'Role permission cache not refreshed; session token still holds old role',
 E'1. Ask user to log out completely and log back in\n2. Admin: verify the role assignment in User Management\n3. Check module-level permission in Role > Finance > Read/Write flags\n4. If issue persists, clear permission cache: Admin > Security > Flush Cache',
 'PUBLISHED', 1),

('HR payroll integration fails on last day of month',
 'HR', 'Payroll sync job fails with timeout error on 28th-31st each month',
 'Payroll provider API rate limit hit during high-volume period',
 E'1. Check integration log: Settings > Integrations > Payroll > Logs\n2. Reschedule sync job to run at 2am instead of midnight\n3. Split the sync batch size from 500 to 100 records per call\n4. Contact payroll provider to request increased rate limit',
 'PUBLISHED', 2),

('Data import wizard fails on CSV with special characters',
 'TECHNICAL', 'Import fails with "Parse error on row 47" for CSV files containing accented characters',
 'CSV exported with Windows-1252 encoding; importer expects UTF-8',
 E'1. Open the CSV in a text editor\n2. Save As with UTF-8 encoding (no BOM)\n3. Retry the import\n4. Alternatively use the "Encoding" dropdown in the import wizard and select Windows-1252',
 'PUBLISHED', 2);

-- Link tags to articles
INSERT INTO kb_article_tags (article_id, tag_id) VALUES
(1,1),(1,9),(2,2),(2,5),(3,10),(3,4),(4,3),(4,9),(5,3),(5,6),
(6,8),(6,4),(7,5),(7,4),(8,9),(8,5),(9,7),(9,4),(10,10),(10,4);

-- 20 Sample Tickets
INSERT INTO tickets (title, description, status, priority, module, created_by_id, assigned_to_id, first_agent_action_at, resolved_at, created_at) VALUES
('Cannot login after password reset',           'After resetting password via email link, system still rejects credentials',                   'RESOLVED',          'P1', 'TECHNICAL',   3, 2, NOW()-INTERVAL '50 min',  NOW()-INTERVAL '2 hours',  NOW()-INTERVAL '3 hours'),
('Invoice GL posting error for vendor #1042',   'Getting GL account not found error when posting vendor invoice for account 4001',             'IN_PROGRESS',       'P1', 'FINANCE',     3, 2, NOW()-INTERVAL '30 min',  NULL,                      NOW()-INTERVAL '1 hour'),
('Negative stock for SKU-8821 in Warehouse B',  'After last nights goods issue batch, SKU-8821 shows -45 units in Warehouse B',               'ASSIGNED',          'P2', 'INVENTORY',   3, 2, NULL,                      NULL,                      NOW()-INTERVAL '2 hours'),
('Sales order SO-2049 stuck in approval',       'Order has been pending approval for 36 hours with no escalation triggered',                  'WAITING_CUSTOMER',  'P2', 'SALES',       3, 2, NOW()-INTERVAL '3 hours',  NULL,                      NOW()-INTERVAL '4 hours'),
('Month-end close made ERP very slow',          'After closing March books, all screens take 10+ seconds to load',                            'RESOLVED',          'P2', 'TECHNICAL',   3, 2, NOW()-INTERVAL '1 hour',   NOW()-INTERVAL '30 min',   NOW()-INTERVAL '5 hours'),
('Empty Excel when exporting AR aging report',  'Exporting the AR aging report produces an empty Excel file, all other reports work fine',    'NEW',               'P3', 'FINANCE',     3, NULL, NULL,                   NULL,                      NOW()-INTERVAL '30 min'),
('PO approval emails not being received',       'Approvers say they are not getting email when purchase orders are submitted for approval',   'IN_PROGRESS',       'P2', 'PROCUREMENT', 3, 2, NOW()-INTERVAL '2 hours',  NULL,                      NOW()-INTERVAL '6 hours'),
('Finance module access denied for user jsmith','User jsmith was moved to finance team last week but still cannot open Finance module',       'NEW',               'P3', 'FINANCE',     3, NULL, NULL,                   NULL,                      NOW()-INTERVAL '1 hour'),
('Payroll sync failed end of March',            'Payroll integration job failed on March 31st with timeout, employees not paid correctly',   'CLOSED',            'P1', 'HR',          3, 2, NOW()-INTERVAL '20 min',   NOW()-INTERVAL '1 day',    NOW()-INTERVAL '2 days'),
('CSV import error for customer data file',     'Trying to import customer records from CSV exported from old system, fails on row 47',       'ASSIGNED',          'P3', 'TECHNICAL',   3, 2, NULL,                      NULL,                      NOW()-INTERVAL '45 min'),
('Duplicate invoice numbers being generated',   'System is generating duplicate invoice numbers in the Finance module since last upgrade',   'IN_PROGRESS',       'P1', 'FINANCE',     3, 2, NOW()-INTERVAL '15 min',   NULL,                      NOW()-INTERVAL '2 hours'),
('Cannot add new warehouse location',           'When trying to add a new bin location in Warehouse C, form saves but location does not appear', 'NEW',            'P3', 'INVENTORY',   3, NULL, NULL,                   NULL,                      NOW()-INTERVAL '3 hours'),
('Sales commission report shows wrong figures', 'Q1 commission report totals do not match manual calculation, difference is about 12%',      'WAITING_CUSTOMER',  'P2', 'SALES',       3, 2, NOW()-INTERVAL '4 hours',  NULL,                      NOW()-INTERVAL '1 day'),
('HR leave balance not updating after approval','Employee leave requests are approved but leave balance is not being deducted',               'IN_PROGRESS',       'P2', 'HR',          3, 2, NOW()-INTERVAL '1 hour',   NULL,                      NOW()-INTERVAL '3 hours'),
('Procurement budget check bypassed on PO',     'Purchase orders over budget threshold are being approved without budget warning',            'RESOLVED',          'P1', 'PROCUREMENT', 3, 2, NOW()-INTERVAL '25 min',   NOW()-INTERVAL '6 hours',  NOW()-INTERVAL '8 hours'),
('ERP upgrade broke custom SSRS reports',       'After upgrading to v4.2, all custom SSRS reports return no data',                          'NEW',               'P2', 'TECHNICAL',   3, NULL, NULL,                   NULL,                      NOW()-INTERVAL '2 hours'),
('Sales order pricing shows wrong currency',    'Orders created for European customers are showing prices in USD instead of EUR',            'ASSIGNED',          'P2', 'SALES',       3, 2, NULL,                      NULL,                      NOW()-INTERVAL '5 hours'),
('Inventory valuation report mismatch',         'Inventory valuation report total differs from general ledger inventory account by 3,200',   'IN_PROGRESS',       'P3', 'INVENTORY',   3, 2, NOW()-INTERVAL '2 hours',  NULL,                      NOW()-INTERVAL '4 hours'),
('Cannot process credit note for customer',     'When raising a credit note the system shows validation error: credit limit exceeded',       'NEW',               'P3', 'FINANCE',     3, NULL, NULL,                   NULL,                      NOW()-INTERVAL '20 min'),
('API integration with Salesforce failing',     'Salesforce opportunity sync stopped working after Salesforce API version upgrade',         'ASSIGNED',          'P2', 'SALES',       3, 2, NULL,                      NULL,                      NOW()-INTERVAL '6 hours');

-- Sample comments
INSERT INTO ticket_comments (ticket_id, author_id, body, comment_type) VALUES
(1, 2, 'Checked the account — it was locked after 5 failed attempts. Unlocked and asked user to retry.', 'PUBLIC'),
(1, 3, 'Works now, thank you!', 'PUBLIC'),
(2, 2, 'Investigating the GL account configuration. Will update within the hour.', 'PUBLIC'),
(2, 2, 'Internal: looks like the fiscal year rollover script missed account 4001. Fixing now.', 'INTERNAL'),
(4, 2, 'Waiting for the requester to confirm the correct approver for step 3 of the approval chain.', 'PUBLIC'),
(7, 2, 'SMTP config confirmed broken. Updated the relay host. Testing now.', 'INTERNAL'),
(9, 2, 'Payroll sync rescheduled and batch size reduced. Monitoring for end of April.', 'PUBLIC'),
(9, 2, 'Confirmed resolved. Payment reprocessed manually for affected employees.', 'PUBLIC');

-- SLA Metrics for resolved/closed tickets
INSERT INTO sla_metrics (ticket_id, first_response_minutes, resolution_minutes, first_response_breached, resolution_breached) VALUES
(1,  50,  120, FALSE, FALSE),
(5,  60,  270, FALSE, FALSE),
(9,  20,  1420, FALSE, FALSE),
(15, 25,  120,  FALSE, FALSE);

-- KB Links
INSERT INTO ticket_kb_links (ticket_id, article_id, link_type, linked_by) VALUES
(1, 1, 'USED',      2),
(2, 2, 'SUGGESTED', 2),
(5, 5, 'USED',      2),
(9, 9, 'SUGGESTED', 2);
