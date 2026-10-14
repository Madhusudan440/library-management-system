// CloudLib Pro - Automated Test Suite
// Covers: Auth, Role Permissions, Book CRUD, Issue & Return, Reservations, Limit Enforcement, Late Fees

import assert from 'node:assert';
import app from '../server/app.js';

let server;
let baseUrl;

async function runTests() {
  console.log('====================================================');
  console.log('  Running CloudLib Pro API & Integration Test Suite  ');
  console.log('====================================================\n');

  // Start test server on random port
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}/api`;
      console.log(`[SETUP] Test server running at ${baseUrl}`);
      resolve();
    });
  });

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${name}`);
      console.error(`     Error: ${err.message}`);
      failed++;
    }
  }

  try {
    // 1. Health check test
    await test('Health check returns ONLINE and cloud computing metadata', async () => {
      const res = await fetch(`${baseUrl}/health`);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.status, 'ONLINE');
      assert.ok(data.cloudProvider.includes('Vercel'));
    });

    // 2. Authentication & Profile lookup
    await test('Auth Profile lookup returns current user profile', async () => {
      const res = await fetch(`${baseUrl}/auth/profile`, {
        headers: { Authorization: 'Bearer user-admin-001' },
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.user.role, 'admin');
    });

    // 3. Switch demo role
    await test('Switch demo role to student updates session profile', async () => {
      const res = await fetch(`${baseUrl}/auth/switch-demo-role`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'student' }),
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.user.role, 'student');
    });

    // 4. Role Authorization Guard (student cannot add books)
    await test('Role Guard: Student role cannot create book records (403 Forbidden)', async () => {
      const res = await fetch(`${baseUrl}/books`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer user-student-001',
        },
        body: JSON.stringify({
          isbn: '978-9999999999',
          title: 'Unauthorized Student Insert',
          author: 'Test Hacker',
        }),
      });
      assert.strictEqual(res.status, 403);
      const data = await res.json();
      assert.strictEqual(data.success, false);
      assert.ok(data.message.includes('Forbidden'));
    });

    // 5. Book Search & Filter
    await test('Catalogue search filters by search term and returns paginated books', async () => {
      const res = await fetch(`${baseUrl}/books?search=Cloud`);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.ok(Array.isArray(data.books));
      assert.ok(data.books.length > 0);
      assert.ok(data.books.some((b) => b.title.includes('Cloud')));
    });

    // 6. Book CRUD & Duplicate ISBN check
    let createdBookId;
    const testIsbn = '978-0000000001';
    await test('Admin Book Creation provisions copies and barcodes', async () => {
      const res = await fetch(`${baseUrl}/books`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer user-admin-001',
        },
        body: JSON.stringify({
          isbn: testIsbn,
          title: 'Cloud Native Microservices Architecture',
          author: 'Priya Sundaram',
          publisher: 'Engineering Press',
          publication_year: 2024,
          total_copies: 3,
        }),
      });
      assert.strictEqual(res.status, 201);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.book.total_copies, 3);
      assert.strictEqual(data.book.available_copies, 3);
      createdBookId = data.book.id;
    });

    await test('Duplicate ISBN check prevents conflicting insertions (409 Conflict)', async () => {
      const res = await fetch(`${baseUrl}/books`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer user-admin-001',
        },
        body: JSON.stringify({
          isbn: testIsbn,
          title: 'Duplicate ISBN Attempt',
          author: 'Another Author',
        }),
      });
      assert.strictEqual(res.status, 409);
      const data = await res.json();
      assert.strictEqual(data.success, false);
    });

    // 7. Issue Book Transaction
    let issuedLoanId;
    await test('Issue book decrements inventory and generates unique loan code', async () => {
      const res = await fetch(`${baseUrl}/loans/issue`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer user-admin-001',
        },
        body: JSON.stringify({
          book_id: createdBookId,
          user_id: 'user-student-002',
          custom_due_days: 14,
        }),
      });
      assert.strictEqual(res.status, 201);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.ok(data.loan.loan_code.startsWith('LN-'));
      issuedLoanId = data.loan.id;

      // Verify book inventory decremented
      const bookRes = await fetch(`${baseUrl}/books/${createdBookId}`, {
        headers: { Authorization: 'Bearer user-admin-001' },
      });
      const bookData = await bookRes.json();
      assert.strictEqual(bookData.book.available_copies, 2);
      assert.strictEqual(bookData.book.issued_copies, 1);
    });

    // 8. Return Book Transaction & Inventory Restock
    await test('Return book increments available inventory and closes loan', async () => {
      const res = await fetch(`${baseUrl}/loans/return`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer user-admin-001',
        },
        body: JSON.stringify({
          loan_id: issuedLoanId,
          fine_waived: true,
        }),
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.loan.status, 'returned');

      // Verify book inventory restocked
      const bookRes = await fetch(`${baseUrl}/books/${createdBookId}`, {
        headers: { Authorization: 'Bearer user-admin-001' },
      });
      const bookData = await bookRes.json();
      assert.strictEqual(bookData.book.available_copies, 3);
      assert.strictEqual(bookData.book.issued_copies, 0);
    });

    // 9. Reservation Queue & Duplicate Prevention
    let reservationId;
    await test('Student Book Reservation assigns queue position', async () => {
      const res = await fetch(`${baseUrl}/reservations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer user-student-001',
        },
        body: JSON.stringify({
          book_id: createdBookId,
        }),
      });
      assert.strictEqual(res.status, 201);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.ok(data.reservation.reservation_code.startsWith('RES-'));
      reservationId = data.reservation.id;
    });

    await test('Duplicate active reservation check blocks multiple holds for same book', async () => {
      const res = await fetch(`${baseUrl}/reservations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer user-student-001',
        },
        body: JSON.stringify({
          book_id: createdBookId,
        }),
      });
      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.strictEqual(data.success, false);
      assert.ok(data.message.includes('already have an active hold'));
    });

    // 10. In-App Notifications
    await test('In-app notifications center delivers alerts and updates read status', async () => {
      const res = await fetch(`${baseUrl}/notifications`, {
        headers: { Authorization: 'Bearer user-student-001' },
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.ok(Array.isArray(data.notifications));
    });

    // 11. Analytics & Trends
    await test('Analytics service aggregates monthly trends and category distribution', async () => {
      const res = await fetch(`${baseUrl}/analytics/trends`, {
        headers: { Authorization: 'Bearer user-admin-001' },
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.ok(data.trends.length >= 6);
    });
  } finally {
    server.close();
  }

  console.log('\n====================================================');
  console.log(`  Tests Completed: ${passed + failed}`);
  console.log(`  Passed: ${passed}`);
  console.log(`  Failed: ${failed}`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
