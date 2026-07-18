$BASE = "https://dhayaro.vercel.app/api/v1"

# Auto-fix: POST returns 201 Created, so we accept both 200 and 201 for POST
$results = @()
$total = 0; $passed = 0; $failed = 0

function Test-API {
    param([string]$Module, [string]$Action, [string]$Method, [string]$Url, $Body, [string]$Token, [int]$ExpectedStatus)
    $script:total++
    $headers = @{}
    if ($Token) { $headers["Authorization"] = "Bearer $Token" }
    try {
        $params = @{
            Uri = $Url
            Method = $Method
            Headers = $headers
            UseBasicParsing = $true
            TimeoutSec = 30
        }
        if ($Body) {
            $params["ContentType"] = "application/json"
            $params["Body"] = $Body | ConvertTo-Json -Depth 10
        }
        $resp = Invoke-WebRequest @params
        $status = $resp.StatusCode
        $data = $resp.Content | ConvertFrom-Json
        if ($status -eq $ExpectedStatus -or ($Method -eq "POST" -and $status -eq 201 -and $ExpectedStatus -eq 200)) {
            $script:passed++
            $script:results += [PSCustomObject]@{ Module=$Module; Action=$Action; Method=$Method; Status="PASS ($status)"; Detail=$Url }
            Write-Host "  [PASS] $Module/$Action ($Method $status)" -ForegroundColor Green
        } else {
            $script:failed++
            $script:results += [PSCustomObject]@{ Module=$Module; Action=$Action; Method=$Method; Status="FAIL (expected $ExpectedStatus, got $status)"; Detail=$Url }
            Write-Host "  [FAIL] $Module/$Action (expected $ExpectedStatus, got $status)" -ForegroundColor Red
        }
        return $data
    } catch {
        $code = if ($_.Exception.Response) { $_.Exception.Response.StatusCode.value__ } else { 0 }
        if ($code -eq $ExpectedStatus -or ($Method -eq "POST" -and $code -eq 201 -and $ExpectedStatus -eq 200)) {
            $script:passed++
            $script:results += [PSCustomObject]@{ Module=$Module; Action=$Action; Method=$Method; Status="PASS ($code)"; Detail=$Url }
            Write-Host "  [PASS] $Module/$Action ($Method $code expected)" -ForegroundColor Green
            return @{ error = $true; status = $code }
        } else {
            $script:failed++
            $script:results += [PSCustomObject]@{ Module=$Module; Action=$Action; Method=$Method; Status="FAIL (expected $ExpectedStatus, got $code)"; Detail=$Url }
            Write-Host "  [FAIL] $Module/$Action (expected $ExpectedStatus, got $code)" -ForegroundColor Red
            return @{ error = $true; status = $code }
        }
    }
}

Write-Host "`n=== DHAYARO FULL API TEST SUITE ===" -ForegroundColor Cyan
Write-Host "Base: $BASE`n"

# ============================================================
# 1. AUTH
# ============================================================
Write-Host "--- 1. AUTH ---" -ForegroundColor Yellow
$loginData = Test-API "auth" "login_admin" "POST" "$BASE/auth/login" @{email="admin@dhayaro.cd";password="admin123"} $null 200
$adminToken = $loginData.access_token
Write-Host "  Admin token: $($adminToken.Substring(0,20))..."

$loginDr = Test-API "auth" "login_doctor" "POST" "$BASE/auth/login" @{email="dr.kabongo@dhayaro.cd";password="doctor123"} $null 200
$doctorToken = $loginDr.access_token

$loginFail = Test-API "auth" "login_wrong_pass" "POST" "$BASE/auth/login" @{email="admin@dhayaro.cd";password="wrongpass"} $null 401

$me = Test-API "auth" "get_me" "GET" "$BASE/auth/me" $null $adminToken 200
Write-Host "  Me: $($me.firstname) $($me.lastname) ($($me.role))"

# ============================================================
# 2. FACILITIES (ADMIN CRUD)
# ============================================================
Write-Host "`n--- 2. FACILITIES ---" -ForegroundColor Yellow
$facs = Test-API "facilities" "list" "GET" "$BASE/facilities?page=1&size=5" $null $adminToken 200
Write-Host "  Total facilities: $($facs.total)"
$testFacId = $facs.items[0].id

$newFac = Test-API "facilities" "create" "POST" "$BASE/facilities" @{name="Hôpital Test Dhayaro";code="HTD001";facilityType="HOSPITAL";address="123 Rue Test";city="Alger";phone="+213 555 001001";email="test@htd.dz";bedCount=100} $adminToken 200
$createdFacId = $newFac.id
Write-Host "  Created facility: $createdFacId"

$gotFac = Test-API "facilities" "get_by_id" "GET" "$BASE/facilities/$createdFacId" $null $adminToken 200
Write-Host "  Got facility: $($gotFac.name)"

$updFac = Test-API "facilities" "update" "PUT" "$BASE/facilities/$createdFacId" @{name="Hôpital Test Dhayaro V2";bedCount=150} $adminToken 200
Write-Host "  Updated facility name: $($updFac.name)"

$delFac = Test-API "facilities" "soft_delete" "DELETE" "$BASE/facilities/$createdFacId" $null $adminToken 200

# ============================================================
# 3. USERS (ADMIN CRUD)
# ============================================================
Write-Host "`n--- 3. USERS ---" -ForegroundColor Yellow
$users = Test-API "users" "list" "GET" "$BASE/users?page=1&size=5" $null $adminToken 200
Write-Host "  Total users: $($users.total)"
$docUserId = ($users.items | Where-Object { $_.role -eq "DOCTOR" }).id | Select-Object -First 1
$nurseUserId = ($users.items | Where-Object { $_.role -eq "NURSE" }).id | Select-Object -First 1

$newUser = Test-API "users" "create" "POST" "$BASE/users" @{email="test.user@dhayaro.cd";firstname="Test";lastname="Utilisateur";role="RECEPTIONIST";password="test123";phone="+213 555 999000"} $adminToken 200
$createdUserId = $newUser.id
Write-Host "  Created user: $createdUserId ($($newUser.firstname) $($newUser.lastname))"

$gotUser = Test-API "users" "get_by_id" "GET" "$BASE/users/$createdUserId" $null $adminToken 200

$updUser = Test-API "users" "update" "PUT" "$BASE/users/$createdUserId" @{firstname="TestUpdated";role="NURSE"} $adminToken 200
Write-Host "  Updated user: $($updUser.firstname) ($($updUser.role))"

$delUser = Test-API "users" "soft_delete" "DELETE" "$BASE/users/$createdUserId" $null $adminToken 200

# Doctor cannot list users (RBAC)
$docFail = Test-API "users" "rbac_doctor_blocked" "GET" "$BASE/users" $null $doctorToken 403

# ============================================================
# 4. PATIENTS
# ============================================================
Write-Host "`n--- 4. PATIENTS ---" -ForegroundColor Yellow
$pts = Test-API "patients" "list" "GET" "$BASE/patients?page=1&size=5" $null $adminToken 200
Write-Host "  Total patients: $($pts.total)"
$testPatientId = $pts.items[0].id

$newPt = Test-API "patients" "create" "POST" "$BASE/patients" @{
    firstname="Jean";lastname="Testeur";sex="M";dateOfBirth="1990-05-15";age=36
    bloodGroup="A+";phone="+213 555 111222";email="jean.testeur@email.dz"
    address="456 Rue Test";city="Oran"
    emergencyContactName="Marie Testeur";emergencyContactPhone="+213 555 333444";emergencyContactRelation="Epouse"
    insuranceName="CNAS";insuranceNumber="CNAS-TEST-001";insuranceExpiry="2027-12-31"
    allergies=@("Penicilline","Arachides");notes="Patient de test complet"
} $adminToken 200
$createdPtId = $newPt.id
Write-Host "  Created patient: $createdPtId ($($newPt.firstname) $($newPt.lastname))"

$gotPt = Test-API "patients" "get_by_id" "GET" "$BASE/patients/$createdPtId" $null $adminToken 200
Write-Host "  Got patient: $($gotPt.firstname) $($gotPt.lastname), blood=$($gotPt.bloodGroup), allergies=$($gotPt.allergies)"

$updPt = Test-API "patients" "update" "PUT" "$BASE/patients/$createdPtId" @{firstname="JeanModifie";phone="+213 555 999888";bloodGroup="B+"} $adminToken 200
Write-Host "  Updated patient: $($updPt.firstname), blood=$($updPt.bloodGroup)"

# Search
$searchPt = Test-API "patients" "search_by_name" "GET" "$BASE/patients?search=Jean" $null $adminToken 200
Write-Host "  Search 'Jean': $($searchPt.total) results"

# ============================================================
# 5. CONSULTATIONS
# ============================================================
Write-Host "`n--- 5. CONSULTATIONS ---" -ForegroundColor Yellow
$csts = Test-API "consultations" "list" "GET" "$BASE/consultations?page=1&size=5" $null $adminToken 200
Write-Host "  Total consultations: $($csts.total)"

$newCst = Test-API "consultations" "create" "POST" "$BASE/consultations" @{
    patientId=$createdPtId;doctorId=$docUserId
    motif="Douleur abdominale depuis 3 jours"
    symptoms=@("Douleur abdominale","Nausee","Fievre")
    vitalSigns=@{temperature="38.5";pressure="120/80";heartRate=90}
    notes="Patient alerte, pas de signes de gravite"
    provisionalDiagnosis="Gastro-enterite aigue"
    status="WAITING"
} $adminToken 200
$createdCstId = $newCst.id
Write-Host "  Created consultation: $createdCstId (motif: $($newCst.motif))"

$gotCst = Test-API "consultations" "get_by_id" "GET" "$BASE/consultations/$createdCstId" $null $adminToken 200
Write-Host "  Got consultation: patient=$($gotCst.patientFirstname) $($gotCst.patientLastname), doctor=$($gotCst.doctorFirstname) $($gotCst.doctorLastname)"

$updCst = Test-API "consultations" "update_status" "PUT" "$BASE/consultations/$createdCstId" @{status="IN_PROGRESS";notes="Patient en consultation"} $adminToken 200
Write-Host "  Updated consultation status: $($updCst.status)"

# Filter by status
$filterCst = Test-API "consultations" "filter_by_status" "GET" "$BASE/consultations?status=IN_PROGRESS" $null $adminToken 200
Write-Host "  Filter IN_PROGRESS: $($filterCst.total) results"

# ============================================================
# 6. DISEASES (CIM-10)
# ============================================================
Write-Host "`n--- 6. DISEASES ---" -ForegroundColor Yellow
$diseases = Test-API "diseases" "list" "GET" "$BASE/diseases?page=1&size=5" $null $adminToken 200
Write-Host "  Total diseases: $($diseases.total)"

$newDis = Test-API "diseases" "create" "POST" "$BASE/diseases" @{
    code="T00TEST";name="Maladie de Test";category="Maladies infectieuses"
    description="Maladie generee pour les tests automatiques"
    symptoms=@("Fievre","Toux","Fatigue");complications=@("Pneumonie");treatments=@("Antibiotherapie")
    isContagious=$true;severity="MODERATE"
} $adminToken 200
$createdDisId = $newDis.id
Write-Host "  Created disease: $createdDisId ($($newDis.code) - $($newDis.name))"

$gotDis = Test-API "diseases" "get_by_id" "GET" "$BASE/diseases/$createdDisId" $null $adminToken 200

$updDis = Test-API "diseases" "update" "PUT" "$BASE/diseases/$createdDisId" @{name="Maladie de Test V2";severity="SEVERE"} $adminToken 200
Write-Host "  Updated disease: $($updDis.name), severity=$($updDis.severity)"

$delDis = Test-API "diseases" "soft_delete" "DELETE" "$BASE/diseases/$createdDisId" $null $adminToken 200

# ============================================================
# 7. DIAGNOSTICS
# ============================================================
Write-Host "`n--- 7. DIAGNOSTICS ---" -ForegroundColor Yellow
$diags = Test-API "diagnostics" "list" "GET" "$BASE/diagnostics?page=1&size=5" $null $adminToken 200
Write-Host "  Total diagnostics: $($diags.total)"

$newDiag = Test-API "diagnostics" "create" "POST" "$BASE/diagnostics" @{
    patientId=$createdPtId;doctorId=$docUserId;consultationId=$createdCstId
    diagnosticType="PROVISIONAL"
    description="Gastro-enterite aigue d'origine virale"
    notes="Contamination probable par voie oro-fecale"
} $adminToken 200
$createdDiagId = $newDiag.id
Write-Host "  Created diagnostic: $createdDiagId ($($newDiag.diagnosticType))"

$gotDiag = Test-API "diagnostics" "get_by_id" "GET" "$BASE/diagnostics/$createdDiagId" $null $adminToken 200

# Validate diagnostic
$updDiag = Test-API "diagnostics" "validate" "PUT" "$BASE/diagnostics/$createdDiagId" @{isValidated=$true;notes="Diagnostic confirme"} $adminToken 200
Write-Host "  Validated diagnostic: isValidated=$($updDiag.isValidated)"

# ============================================================
# 8. TREATMENTS
# ============================================================
Write-Host "`n--- 8. TREATMENTS ---" -ForegroundColor Yellow
$trts = Test-API "treatments" "list" "GET" "$BASE/treatments?page=1&size=5" $null $adminToken 200
Write-Host "  Total treatments: $($trts.total)"

$newTrt = Test-API "treatments" "create" "POST" "$BASE/treatments" @{
    patientId=$createdPtId;doctorId=$docUserId;consultationId=$createdCstId
    description="Paracetamol 1g x3/jour + Repos alimentaire 48h"
    status="PRESCRIBED";startDate="2026-07-18";endDate="2026-07-25"
    notes="Revoir dans 7 jours si pas d'amelioration"
} $adminToken 200
$createdTrtId = $newTrt.id
Write-Host "  Created treatment: $createdTrtId ($($newTrt.description))"

$gotTrt = Test-API "treatments" "get_by_id" "GET" "$BASE/treatments/$createdTrtId" $null $adminToken 200

$updTrt = Test-API "treatments" "update_status" "PUT" "$BASE/treatments/$createdTrtId" @{status="IN_PROGRESS";notes="Patient sous traitement"} $adminToken 200
Write-Host "  Updated treatment status: $($updTrt.status)"

# ============================================================
# 9. MEDICATIONS (via treatments/prescriptions)
# ============================================================
Write-Host "`n--- 9. PRESCRIPTIONS ---" -ForegroundColor Yellow
$prescs = Test-API "prescriptions" "list" "GET" "$BASE/prescriptions?page=1&size=5" $null $adminToken 200
Write-Host "  Total prescriptions: $($prescs.total)"

# Get first medication from DB (seeded)
# We need a medication_id - let's get from an existing prescription
if ($prescs.items.Count -gt 0) {
    $existingMedId = $prescs.items[0].medicationId
} else {
    # We need to check if there's a medications endpoint
    Write-Host "  No prescriptions found, checking medications..."
    $existingMedId = $null
}

# ============================================================
# 10. LAB EXAMS
# ============================================================
Write-Host "`n--- 10. LAB EXAMS ---" -ForegroundColor Yellow
$labs = Test-API "lab_exams" "list" "GET" "$BASE/lab/exams?page=1&size=5" $null $adminToken 200
Write-Host "  Total lab exams: $($labs.total)"

$labCats = Test-API "lab_categories" "list" "GET" "$BASE/lab/categories?page=1&size=5" $null $adminToken 200
Write-Host "  Total lab categories: $($labCats.total)"
$catId = if ($labCats.items.Count -gt 0) { $labCats.items[0].id } else { $null }

$newLab = Test-API "lab_exams" "create" "POST" "$BASE/lab/exams" @{
    patientId=$createdPtId;doctorId=$docUserId
    examName="NFS Complete";categoryId=$catId
    clinicalIndication="Bilan infectieux"
    status="REQUESTED"
} $adminToken 200
$createdLabId = $newLab.id
Write-Host "  Created lab exam: $createdLabId ($($newLab.examName))"

$gotLab = Test-API "lab_exams" "get_by_id" "GET" "$BASE/lab/exams/$createdLabId" $null $adminToken 200

# Complete with results
$updLab = Test-API "lab_exams" "complete" "PUT" "$BASE/lab/exams/$createdLabId" @{
    status="COMPLETED"
    results=@{leukocytes="12000";hemoglobin="14.2";platelets="250000";neutrophiles="75"}
    resultNotes="Leucocytose moderee compatible avec infection bacterienne"
} $adminToken 200
Write-Host "  Completed lab exam: status=$($updLab.status)"

# ============================================================
# 11. QUEUE
# ============================================================
Write-Host "`n--- 11. QUEUE ---" -ForegroundColor Yellow
$queue = Test-API "queue" "list" "GET" "$BASE/queue?page=1&size=5" $null $adminToken 200
Write-Host "  Total in queue: $($queue.total)"

$newQ = Test-API "queue" "create" "POST" "$BASE/queue" @{
    patientId=$createdPtId
    priority="HIGH"
    estimatedWaitMinutes=15
    notes="Douleur importante"
} $adminToken 200
$createdQId = $newQ.id
Write-Host "  Created queue ticket: $createdQId (#$($newQ.ticketNumber))"

$gotQ = Test-API "queue" "get_by_id" "GET" "$BASE/queue/$createdQId" $null $adminToken 200

$updQ = Test-API "queue" "assign_doctor" "PUT" "$BASE/queue/$createdQId" @{
    status="WITH_DOCTOR";assignedDoctorId=$docUserId;queuePosition=1
} $adminToken 200
Write-Host "  Updated queue: status=$($updQ.status), doctor assigned"

# ============================================================
# 12. DOCUMENTS
# ============================================================
Write-Host "`n--- 12. DOCUMENTS ---" -ForegroundColor Yellow
$docs = Test-API "documents" "list" "GET" "$BASE/documents?page=1&size=5" $null $adminToken 200
Write-Host "  Total documents: $($docs.total)"

$newDoc = Test-API "documents" "create" "POST" "$BASE/documents" @{
    patientId=$createdPtId;doctorId=$docUserId;consultationId=$createdCstId
    documentType="PRESCRIPTION"
    title="Ordonnance - Jean Testeur"
    content=@{
        medications=@(
            @{name="Paracetamol";dosage="1g";frequency="3x/jour";duration="7 jours"}
        )
        notes="Prendre apres les repas"
    }
} $adminToken 200
$createdDocId = $newDoc.id
Write-Host "  Created document: $createdDocId ($($newDoc.title))"

$gotDoc = Test-API "documents" "get_by_id" "GET" "$BASE/documents/$createdDocId" $null $adminToken 200

$updDoc = Test-API "documents" "update_printed" "PUT" "$BASE/documents/$createdDocId" @{isPrinted=$true} $adminToken 200
Write-Host "  Updated document printed: $($updDoc.isPrinted)"

# ============================================================
# 13. ARCHIVES
# ============================================================
Write-Host "`n--- 13. ARCHIVES ---" -ForegroundColor Yellow
$archs = Test-API "archives" "list" "GET" "$BASE/archives?page=1&size=5" $null $adminToken 200
Write-Host "  Total archives: $($archs.total)"

$newArch = Test-API "archives" "create" "POST" "$BASE/archives" @{
    entityType="CONSULTATION";entityId=$createdCstId
    patientId=$createdPtId
    title="Archive consultation - Jean Testeur"
    summary="Consultation pour gastro-enterite aigue"
    data=@{motif="Douleur abdominale";diagnostic="Gastro-enterite";traitement="Paracetamol"}
} $adminToken 200
Write-Host "  Created archive: $($newArch.id) ($($newArch.title))"

# ============================================================
# 14. NOTIFICATIONS
# ============================================================
Write-Host "`n--- 14. NOTIFICATIONS ---" -ForegroundColor Yellow
$notifs = Test-API "notifications" "list" "GET" "$BASE/notifications?page=1&size=5" $null $adminToken 200
Write-Host "  Total notifications: $($notifs.total), unread: $($notifs.unreadCount)"

$newNotif = Test-API "notifications" "create" "POST" "$BASE/notifications" @{
    userId=$docUserId;title="Nouveau patient assigne"
    message="Jean Testeur vous est assigne pour consultation"
    type="INFO";link="/patients/$createdPtId"
} $adminToken 200
Write-Host "  Created notification: $($newNotif.id) ($($newNotif.title))"

# ============================================================
# 15. CLINICAL CASES
# ============================================================
Write-Host "`n--- 15. CLINICAL CASES ---" -ForegroundColor Yellow
$cases = Test-API "clinical_cases" "list" "GET" "$BASE/clinical-cases?page=1&size=5" $null $adminToken 200
Write-Host "  Total clinical cases: $($cases.total)"

$stats = Test-API "clinical_cases" "stats" "GET" "$BASE/clinical-cases/stats" $null $adminToken 200
Write-Host "  Stats: total=$($stats.total), pending=$($stats.pending), in_progress=$($stats.in_progress)"

$newCase = Test-API "clinical_cases" "create" "POST" "$BASE/clinical-cases" @{
    patientId=$createdPtId;doctorId=$docUserId
    title="Cas clinique - Gastro-enterite severe"
    description="Homme de 36 ans avec douleur abdominale intense et fievre"
    symptomsJson=@("Douleur abdominale","Nausee","Vomissement","Fievre 38.5C")
    provisionalDiagnosis="Gastro-enterite aigue"
    treatment="Paracetamol + Hydratation"
    treatmentDuration="7 jours"
    priority="high"
    outcomeStatus="IN_PROGRESS"
} $adminToken 200
$createdCaseId = $newCase.id
Write-Host "  Created clinical case: $createdCaseId ($($newCase.title))"

$gotCase = Test-API "clinical_cases" "get_by_id" "GET" "$BASE/clinical-cases/$createdCaseId" $null $adminToken 200

$updCase = Test-API "clinical_cases" "update" "PUT" "$BASE/clinical-cases/$createdCaseId" @{
    outcomeStatus="SUCCESS";outcomeNotes="Patient gueri apres 5 jours de traitement"
} $adminToken 200
Write-Host "  Updated clinical case: outcome=$($updCase.outcomeStatus)"

# ============================================================
# 16. AUDIT (Admin only)
# ============================================================
Write-Host "`n--- 16. AUDIT ---" -ForegroundColor Yellow
$audit = Test-API "audit" "list" "GET" "$BASE/audit?page=1&size=5" $null $adminToken 200
Write-Host "  Total audit logs: $($audit.total)"

# Doctor cannot access audit
$auditDoc = Test-API "audit" "rbac_doctor_blocked" "GET" "$BASE/audit" $null $doctorToken 403

# ============================================================
# 17. SYNC
# ============================================================
Write-Host "`n--- 17. SYNC ---" -ForegroundColor Yellow
$sync = Test-API "sync" "pull" "GET" "$BASE/sync/pull" $null $adminToken 200
Write-Host "  Sync items: $(if ($sync.items) { $sync.items.Count } else { 0 })"

# ============================================================
# CLEANUP - Soft delete test data
# ============================================================
Write-Host "`n--- CLEANUP ---" -ForegroundColor Yellow
$delPt = Test-API "patients" "soft_delete_test" "DELETE" "$BASE/patients/$createdPtId" $null $adminToken 200
Write-Host "  Deleted patient: $createdPtId"

# ============================================================
# DELETE TESTS (explicit)
# ============================================================
Write-Host "`n--- DELETE OPERATIONS ---" -ForegroundColor Yellow
# Create and delete a patient
$delPt2 = Test-API "patients" "create_for_delete" "POST" "$BASE/patients" @{firstname="Delete";lastname="Me";sex="M";dateOfBirth="2000-01-01"} $adminToken 200
$delPt2Id = $delPt2.id
$delPt2r = Test-API "patients" "delete_patient" "DELETE" "$BASE/patients/$delPt2Id" $null $adminToken 200
Write-Host "  Soft-deleted patient: $delPt2Id"

# Create and delete a disease
$delDis2 = Test-API "diseases" "create_for_delete" "POST" "$BASE/diseases" @{code="DEL01";name="To Delete";category="Test"} $adminToken 200
$delDis2Id = $delDis2.id
$delDis2r = Test-API "diseases" "delete_disease" "DELETE" "$BASE/diseases/$delDis2Id" $null $adminToken 200
Write-Host "  Soft-deleted disease: $delDis2Id"

# Cancel consultation (soft delete)
$delCst = Test-API "consultations" "cancel" "DELETE" "$BASE/consultations/$createdCstId" $null $adminToken 200
Write-Host "  Cancelled consultation: $createdCstId -> $($delCst.status)"

# Cancel treatment (soft delete)
$delTrt = Test-API "treatments" "cancel" "DELETE" "$BASE/treatments/$createdTrtId" $null $adminToken 200
Write-Host "  Cancelled treatment: $createdTrtId -> $($delTrt.status)"

# Cancel queue (soft delete)
$delQ = Test-API "queue" "cancel" "DELETE" "$BASE/queue/$createdQId" $null $adminToken 200
Write-Host "  Cancelled queue: $createdQId -> $($delQ.status)"

# Delete clinical case (HARD delete)
$delCase = Test-API "clinical_cases" "hard_delete" "DELETE" "$BASE/clinical-cases/$createdCaseId" $null $adminToken 200
Write-Host "  Hard-deleted clinical case: $createdCaseId"

# ============================================================
# SUMMARY
# ============================================================
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "         TEST RESULTS SUMMARY           " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Total:  $total"
Write-Host "Passed: $passed" -ForegroundColor Green
Write-Host "Failed: $failed" -ForegroundColor $(if ($failed -gt 0) { "Red" } else { "Green" })
Write-Host "Rate:   $([math]::Round(($passed/$total)*100, 1))%"
Write-Host ""

if ($failed -gt 0) {
    Write-Host "FAILED TESTS:" -ForegroundColor Red
    $results | Where-Object { $_.Status -like "FAIL*" } | Format-Table Module, Action, Method, Status, Detail -AutoSize
}

Write-Host "`nAll tests by module:" -ForegroundColor Cyan
$grouped = $results | Group-Object Module
foreach ($g in $grouped) {
    $p = ($g.Group | Where-Object { $_.Status -like "PASS*" }).Count
    $f = ($g.Group | Where-Object { $_.Status -like "FAIL*" }).Count
    $color = if ($f -gt 0) { "Red" } else { "Green" }
    Write-Host "  $($g.Name): $p/$($g.Count) passed" -ForegroundColor $color
}
