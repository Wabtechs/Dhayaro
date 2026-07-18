const BASE = 'https://dhayaro.vercel.app/api/v1';
let total = 0, passed = 0, failed = 0, bugs = [];

async function req(method, path, body, token, expectStatus) {
  total++;
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  try {
    const opts = { method, headers, signal: AbortSignal.timeout(30000) };
    if (body) opts.body = JSON.stringify(body);
    const r = await fetch(`${BASE}${path}`, opts);
    const text = await r.text();
    let data; try { data = JSON.parse(text); } catch { data = text; }
    if (r.status === expectStatus || (method === 'POST' && r.status === 201 && expectStatus === 200)) {
      passed++;
      return { ok: true, status: r.status, data };
    } else {
      failed++;
      const bug = `${method} ${path} => ${r.status} (expected ${expectStatus}): ${JSON.stringify(data).substring(0,200)}`;
      bugs.push(bug);
      console.log(`  [FAIL] ${method} ${path} => ${r.status} (expected ${expectStatus})`);
      return { ok: false, status: r.status, data };
    }
  } catch (e) {
    failed++;
    const bug = `${method} ${path} => ERROR: ${e.message}`;
    bugs.push(bug);
    console.log(`  [FAIL] ${method} ${path} => ERROR ${e.message}`);
    return { ok: false, status: 0, data: null };
  }
}

function pass(label) {
  passed++; total++;
  console.log(`  [OK] ${label}`);
}

async function main() {
  console.log('\n=== DHAYARO FULL API TEST SUITE v2 ===\n');

  // LOGIN
  console.log('--- AUTH ---');
  const adminLogin = await req('POST', '/auth/login', { email: 'admin@dhayaro.cd', password: 'admin123' }, null, 200);
  const adminTK = adminLogin.data.access_token;
  const docLogin = await req('POST', '/auth/login', { email: 'dr.kabongo@dhayaro.cd', password: 'doctor123' }, null, 200);
  const docTK = docLogin.data.access_token;
  const nurseLogin = await req('POST', '/auth/login', { email: 'nurse.mohamed@dhayaro.cd', password: 'nurse123' }, null, 200);
  const nurseTK = nurseLogin.data.access_token;
  await req('POST', '/auth/login', { email: 'admin@dhayaro.cd', password: 'wrong' }, null, 401);
  await req('POST', '/auth/login', { email: '', password: '' }, null, 400);
  await req('GET', '/auth/me', null, adminTK, 200);
  await req('GET', '/auth/me', null, 'badtoken', 401);
  await req('POST', '/auth/refresh', { refresh_token: 'bad' }, null, 401);

  // ===================== STATUS CODES =====================
  console.log('\n--- STATUS CODES: 400, 401, 403, 404 ---');

  // 401 Unauthorized (no token)
  await req('GET', '/patients', null, null, 401);
  await req('GET', '/users', null, null, 401);
  await req('GET', '/consultations', null, null, 401);
  await req('GET', '/diseases', null, null, 401);

  // 403 Forbidden (wrong role)
  await req('GET', '/users', null, docTK, 403);
  await req('GET', '/audit', null, docTK, 403);
  await req('POST', '/users', { email: 'x@x.cd', firstname: 'X', lastname: 'Y', role: 'NURSE', password: 'p' }, docTK, 403);

  // 404 Not Found
  await req('GET', '/patients/00000000-0000-0000-0000-000000000000', null, adminTK, 404);
  await req('GET', '/users/00000000-0000-0000-0000-000000000000', null, adminTK, 404);
  await req('GET', '/consultations/00000000-0000-0000-0000-000000000000', null, adminTK, 404);
  await req('GET', '/diseases/00000000-0000-0000-0000-000000000000', null, adminTK, 404);
  await req('GET', '/treatments/00000000-0000-0000-0000-000000000000', null, adminTK, 404);
  await req('GET', '/lab/exams/00000000-0000-0000-0000-000000000000', null, adminTK, 404);
  await req('GET', '/queue/00000000-0000-0000-0000-000000000000', null, adminTK, 404);
  await req('GET', '/documents/00000000-0000-0000-0000-000000000000', null, adminTK, 404);
  await req('GET', '/clinical-cases/00000000-0000-0000-0000-000000000000', null, adminTK, 404);

  // 400 Bad Request
  await req('POST', '/patients', {}, adminTK, 400);
  await req('POST', '/consultations', {}, adminTK, 400);
  await req('POST', '/treatments', {}, adminTK, 400);
  await req('POST', '/diseases', {}, adminTK, 400);
  await req('POST', '/diagnostics', {}, adminTK, 400);
  await req('POST', '/facilities', {}, adminTK, 400);
  await req('POST', '/users', {}, adminTK, 400);
  await req('POST', '/queue', {}, adminTK, 400);
  await req('POST', '/lab/exams', {}, adminTK, 400);
  await req('POST', '/documents', {}, adminTK, 400);
  await req('POST', '/archives', {}, adminTK, 400);
  await req('POST', '/notifications', {}, adminTK, 400);
  await req('POST', '/clinical-cases', {}, adminTK, 400);

  // ===================== PAGINATION =====================
  console.log('\n--- PAGINATION ---');
  for (const ep of ['/patients', '/users', '/consultations', '/diseases', '/diagnostics', '/treatments', '/lab/exams', '/documents', '/archives', '/audit', '/clinical-cases', '/queue', '/facilities', '/notifications', '/prescriptions']) {
    const r = await req('GET', `${ep}?page=1&size=2`, null, adminTK, 200);
    if (r.ok && r.data.items) {
      if (r.data.items.length <= 2 && r.data.page === 1 && r.data.size === 2) {
        pass(`${ep} pagination (size=2, got ${r.data.items.length})`);
      } else {
        failed++; total++;
        bugs.push(`${ep} pagination unexpected: items=${r.data.items.length} page=${r.data.page} size=${r.data.size}`);
        console.log(`  [FAIL] ${ep} pagination unexpected`);
      }
    }
  }

  // Page 2 should be different from page 1
  const pg1 = await req('GET', '/patients?page=1&size=5', null, adminTK, 200);
  const pg2 = await req('GET', '/patients?page=2&size=5', null, adminTK, 200);
  if (pg1.ok && pg2.ok && pg1.data.items[0]?.id !== pg2.data.items[0]?.id) {
    pass('patients page1 != page2');
  } else { failed++; total++; bugs.push('patients page1 == page2'); console.log('  [FAIL] patients page1 == page2'); }

  // ===================== SEARCH =====================
  console.log('\n--- SEARCH ---');
  await req('GET', '/patients?search=Jean', null, adminTK, 200);
  await req('GET', '/patients?search=ZZZNONEXISTENT', null, adminTK, 200);
  await req('GET', '/users?search=admin', null, adminTK, 200);
  await req('GET', '/consultations?search=douleur', null, adminTK, 200);
  await req('GET', '/diseases?search=grippe', null, adminTK, 200);
  await req('GET', '/diagnostics?search=diagnostic', null, adminTK, 200);
  await req('GET', '/treatments?search=paracetamol', null, adminTK, 200);
  await req('GET', '/clinical-cases?search=cas', null, adminTK, 200);
  await req('GET', '/facilities?search=hopital', null, adminTK, 200);

  // ===================== FILTERS =====================
  console.log('\n--- FILTERS ---');
  await req('GET', '/consultations?status=WAITING', null, adminTK, 200);
  await req('GET', '/consultations?status=IN_PROGRESS', null, adminTK, 200);
  await req('GET', '/consultations?status=COMPLETED', null, adminTK, 200);
  await req('GET', '/diagnostics?diagnosticType=PROVISIONAL', null, adminTK, 200);
  await req('GET', '/diagnostics?isValidated=true', null, adminTK, 200);
  await req('GET', '/treatments?status=PRESCRIBED', null, adminTK, 200);
  await req('GET', '/treatments?status=IN_PROGRESS', null, adminTK, 200);
  await req('GET', '/lab/exams?status=REQUESTED', null, adminTK, 200);
  await req('GET', '/lab/exams?status=COMPLETED', null, adminTK, 200);
  await req('GET', '/queue?status=WAITING', null, adminTK, 200);
  await req('GET', '/documents?documentType=PRESCRIPTION', null, adminTK, 200);
  await req('GET', '/diseases?category=infectious', null, adminTK, 200);
  await req('GET', '/archives?entityType=CONSULTATION', null, adminTK, 200);

  // ===================== FULL CRUD =====================
  console.log('\n--- FULL CRUD ---');
  const TS = Date.now();

  // FACILITIES
  const fac = await req('POST', '/facilities', { name: 'TestFac', code: `F${TS}`, facilityType: 'CLINIC' }, adminTK, 200);
  if (fac.ok) {
    const facId = fac.data.id;
    await req('GET', `/facilities/${facId}`, null, adminTK, 200);
    await req('PUT', `/facilities/${facId}`, { name: 'TestFac Updated' }, adminTK, 200);
    await req('DELETE', `/facilities/${facId}`, null, adminTK, 200);
    pass('facilities CRUD');
  }

  // USERS
  const usr = await req('POST', '/users', { email: `u${TS}@dhayaro.cd`, firstname: 'Test', lastname: 'User', role: 'NURSE', password: 'test123' }, adminTK, 200);
  if (usr.ok) {
    const usrId = usr.data.id;
    await req('GET', `/users/${usrId}`, null, adminTK, 200);
    await req('PUT', `/users/${usrId}`, { firstname: 'Updated' }, adminTK, 200);
    await req('DELETE', `/users/${usrId}`, null, adminTK, 200);
    pass('users CRUD');
  }

  // PATIENTS
  const pt = await req('POST', '/patients', { firstname: 'Test', lastname: `Patient${TS}`, sex: 'M', dateOfBirth: '1990-01-01' }, adminTK, 200);
  let ptId;
  if (pt.ok) {
    ptId = pt.data.id;
    await req('GET', `/patients/${ptId}`, null, adminTK, 200);
    await req('PUT', `/patients/${ptId}`, { firstname: 'Updated' }, adminTK, 200);
    pass('patients read/update');
  }

  // DISEASES
  const dis = await req('POST', '/diseases', { code: `D${TS}`, name: 'TestDisease', category: 'Infectious' }, adminTK, 200);
  if (dis.ok) {
    const disId = dis.data.id;
    await req('GET', `/diseases/${disId}`, null, adminTK, 200);
    await req('PUT', `/diseases/${disId}`, { name: 'UpdatedDisease' }, adminTK, 200);
    await req('DELETE', `/diseases/${disId}`, null, adminTK, 200);
    pass('diseases CRUD');
  }
  // Duplicate code -> 400
  await req('POST', '/diseases', { code: `D${TS}`, name: 'Dup', category: 'X' }, adminTK, 400);

  // CONSULTATIONS (need patient + doctor)
  const patients = await req('GET', '/patients?page=1&size=1', null, adminTK, 200);
  const doctors = await req('GET', '/users?page=1&size=20', null, adminTK, 200);
  const realPtId = ptId || patients.data?.items?.[0]?.id;
  const docUser = doctors.data?.items?.find(u => u.role === 'DOCTOR');
  const docUserId = docUser?.id;

  if (realPtId && docUserId) {
    const cst = await req('POST', '/consultations', { patientId: realPtId, doctorId: docUserId, motif: `Motif${TS}`, symptoms: ['Fievre'], status: 'WAITING' }, adminTK, 200);
    if (cst.ok) {
      const cstId = cst.data.id;
      await req('GET', `/consultations/${cstId}`, null, adminTK, 200);
      await req('PUT', `/consultations/${cstId}`, { status: 'IN_PROGRESS' }, adminTK, 200);
      await req('DELETE', `/consultations/${cstId}`, null, adminTK, 200);
      pass('consultations CRUD');
    }

    // DIAGNOSTICS
    const diag = await req('POST', '/diagnostics', { patientId: realPtId, doctorId: docUserId, consultationId: cst.data?.id || '00000000-0000-0000-0000-000000000000', diagnosticType: 'PROVISIONAL', description: `Diag${TS}` }, adminTK, 200);
    if (diag.ok) {
      const diagId = diag.data.id;
      await req('GET', `/diagnostics/${diagId}`, null, adminTK, 200);
      await req('PUT', `/diagnostics/${diagId}`, { isValidated: true, notes: 'Validated' }, adminTK, 200);
      pass('diagnostics CRUD + validation');
    }

    // TREATMENTS
    const trt = await req('POST', '/treatments', { patientId: realPtId, doctorId: docUserId, description: `Traitement${TS}`, startDate: '2026-07-18' }, adminTK, 200);
    if (trt.ok) {
      const trtId = trt.data.id;
      await req('GET', `/treatments/${trtId}`, null, adminTK, 200);
      await req('PUT', `/treatments/${trtId}`, { status: 'IN_PROGRESS' }, adminTK, 200);
      await req('DELETE', `/treatments/${trtId}`, null, adminTK, 200);
      pass('treatments CRUD');
    }

    // PRESCRIPTIONS (need a treatment)
    const trt2 = await req('POST', '/treatments', { patientId: realPtId, doctorId: docUserId, description: `For Presc${TS}`, startDate: '2026-07-18' }, adminTK, 200);
    const meds = await req('GET', '/prescriptions?page=1&size=1', null, adminTK, 200);
    if (trt2.ok && meds.ok && meds.data?.items?.length > 0) {
      const medId = meds.data.items[0].medicationId;
      await req('POST', '/prescriptions', { treatmentId: trt2.data.id, medicationId: medId, dosage: '1g', frequency: '3x/jour', duration: '7 jours' }, adminTK, 200);
      pass('prescriptions create');
    }

    // LAB EXAMS
    const lab = await req('POST', '/lab/exams', { patientId: realPtId, doctorId: docUserId, examName: `NFS${TS}`, clinicalIndication: 'Test' }, adminTK, 200);
    if (lab.ok) {
      const labId = lab.data.id;
      await req('GET', `/lab/exams/${labId}`, null, adminTK, 200);
      await req('PUT', `/lab/exams/${labId}`, { status: 'COMPLETED', results: { hb: '14' }, resultNotes: 'Normal' }, adminTK, 200);
      pass('lab exams CRUD');
    }

    // QUEUE
    const q = await req('POST', '/queue', { patientId: realPtId, priority: 'HIGH', estimatedWaitMinutes: 10 }, adminTK, 200);
    if (q.ok) {
      const qId = q.data.id;
      await req('GET', `/queue/${qId}`, null, adminTK, 200);
      await req('PUT', `/queue/${qId}`, { status: 'WITH_DOCTOR', assignedDoctorId: docUserId }, adminTK, 200);
      await req('DELETE', `/queue/${qId}`, null, adminTK, 200);
      pass('queue CRUD');
    }

    // DOCUMENTS
    const doc = await req('POST', '/documents', { patientId: realPtId, doctorId: docUserId, documentType: 'PRESCRIPTION', title: `Ordonnance${TS}`, content: { meds: ['X'] } }, adminTK, 200);
    if (doc.ok) {
      const docId = doc.data.id;
      await req('GET', `/documents/${docId}`, null, adminTK, 200);
      await req('PUT', `/documents/${docId}`, { isPrinted: true }, adminTK, 200);
      pass('documents CRUD');
    }

    // ARCHIVES
    await req('POST', '/archives', { entityType: 'CONSULTATION', entityId: cst.data?.id || realPtId, patientId: realPtId, title: `Archive${TS}`, summary: 'Test' }, adminTK, 200);
    pass('archives create');

    // NOTIFICATIONS
    const notif = await req('POST', '/notifications', { userId: docUserId, title: `Notif${TS}`, message: 'Test', type: 'INFO' }, adminTK, 200);
    pass('notifications create');

    // CLINICAL CASES
    const cc = await req('POST', '/clinical-cases', { patientId: realPtId, doctorId: docUserId, title: `Case${TS}`, description: 'Test', priority: 'high' }, adminTK, 200);
    if (cc.ok) {
      const ccId = cc.data.id;
      await req('GET', `/clinical-cases/${ccId}`, null, adminTK, 200);
      await req('PUT', `/clinical-cases/${ccId}`, { outcomeStatus: 'SUCCESS' }, adminTK, 200);
      await req('DELETE', `/clinical-cases/${ccId}`, null, adminTK, 200);
      pass('clinical cases CRUD');
    }
    await req('GET', '/clinical-cases/stats', null, adminTK, 200);
    pass('clinical cases stats');
  }

  // LAB CATEGORIES
  await req('POST', '/lab/categories', { name: `Cat${TS}` }, adminTK, 200);
  pass('lab categories create');
  await req('GET', '/lab/categories', null, adminTK, 200);
  pass('lab categories list');

  // Cleanup patient
  if (ptId) await req('DELETE', `/patients/${ptId}`, null, adminTK, 200);

  // ===================== RBAC =====================
  console.log('\n--- RBAC (Doctor role) ---');
  await req('GET', '/users', null, docTK, 403);
  await req('GET', '/audit', null, docTK, 403);
  await req('POST', '/users', { email: 'x@x.cd', firstname: 'X', lastname: 'Y', role: 'NURSE', password: 'p' }, docTK, 403);
  await req('PUT', '/facilities/00000000-0000-0000-0000-000000000000', { name: 'hack' }, docTK, 403);
  await req('DELETE', '/facilities/00000000-0000-0000-0000-000000000000', null, docTK, 403);
  await req('POST', '/facilities', { name: 'X', code: 'Y', facilityType: 'CLINIC' }, docTK, 403);

  console.log('\n--- RBAC (Doctor CAN access) ---');
  await req('GET', '/patients', null, docTK, 200);
  await req('GET', '/consultations', null, docTK, 200);
  await req('GET', '/diagnostics', null, docTK, 200);
  await req('GET', '/treatments', null, docTK, 200);
  await req('GET', '/diseases', null, docTK, 200);
  await req('GET', '/lab/exams', null, docTK, 200);
  await req('GET', '/queue', null, docTK, 200);
  await req('GET', '/documents', null, docTK, 200);
  await req('GET', '/archives', null, docTK, 200);
  await req('GET', '/notifications', null, docTK, 200);
  await req('GET', '/clinical-cases', null, docTK, 200);
  await req('GET', '/facilities', null, docTK, 200);

  console.log('\n--- RBAC (Nurse role) ---');
  await req('GET', '/users', null, nurseTK, 403);
  await req('GET', '/audit', null, nurseTK, 403);
  await req('GET', '/patients', null, nurseTK, 200);
  await req('GET', '/consultations', null, nurseTK, 200);
  await req('GET', '/queue', null, nurseTK, 200);

  // ===================== SPECIAL ENDPOINTS =====================
  console.log('\n--- SPECIAL ENDPOINTS ---');
  await req('GET', '/sync/pull', null, adminTK, 200);
  await req('GET', '/audit?page=1&size=5', null, adminTK, 200);
  await req('GET', '/clinical-cases/stats', null, adminTK, 200);

  // Notifications read
  const nList = await req('GET', '/notifications?page=1&size=1', null, adminTK, 200);
  if (nList.ok && nList.data?.items?.length > 0) {
    await req('POST', '/notifications/read', { all: true }, adminTK, 200);
    pass('notifications mark all read');
  }

  // ===================== SUMMARY =====================
  console.log('\n========================================');
  console.log(`         RAPPORT DE TESTS API`);
  console.log('========================================');
  console.log(`Total:  ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Rate:   ${((passed/total)*100).toFixed(1)}%`);
  if (bugs.length > 0) {
    console.log(`\nBUGS (${bugs.length}):`);
    bugs.forEach((b, i) => console.log(`  ${i+1}. ${b}`));
  }
  console.log('');
}

main().catch(console.error);
