import { neon } from '@neondatabase/serverless'
import bcrypt from 'bcryptjs'

const DATABASE_URL = process.env.DATABASE_URL_UNPOOLED
  || process.env.DATABASE_URL
  || 'postgresql://neondb_owner:npg_2ysp9wjBfVrO@ep-bitter-brook-a4m7nafi.us-east-1.aws.neon.tech/Dhayaro?sslmode=require'

const sql = neon(DATABASE_URL)

function daysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(8 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 60), 0, 0)
  return d
}
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)] }
function randInt(min, max) { return min + Math.floor(Math.random() * (max - min + 1)) }
function uuid() { return crypto.randomUUID() }
function esc(v) {
  if (v === null || v === undefined) return 'NULL'
  if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE'
  if (typeof v === 'number') return String(v)
  if (v instanceof Date) return `'${v.toISOString()}'`
  if (typeof v === 'string') {
    if (v.endsWith('::jsonb')) return v
    return `'${v.replace(/'/g, "''")}'`
  }
  return `'${String(v).replace(/'/g, "''")}'`
}
function j(obj) { return `'${JSON.stringify(obj).replace(/'/g, "''")}'` }

const F = { HOSPITAL: 'HOSPITAL', CLINIC: 'CLINIC', LABORATORY: 'LABORATORY', PHARMACY: 'PHARMACY' }

const facilityData = [
  { name: "Hôpital Général de Référence de Kinshasa", code: 'HGRK-001', facilityType: F.HOSPITAL, address: "Avenue de l'Hôpital, Gombe", city: 'Kinshasa', phone: '+243 81 222 0001', email: 'info@hgrk.cd', bedCount: 2000, departmentCount: 40, staffCount: 4500 },
  { name: 'Cliniques Universitaires de Kinshasa', code: 'CUK-002', facilityType: F.HOSPITAL, address: 'Boulevard du 30 Juin, Gombe', city: 'Kinshasa', phone: '+243 81 222 0002', email: 'contact@cuk.cd', bedCount: 1200, departmentCount: 30, staffCount: 3000 },
  { name: 'Clinique Ngaliema', code: 'CNG-003', facilityType: F.CLINIC, address: 'Avenue Mombo, Ngaliema', city: 'Kinshasa', phone: '+243 81 222 0003', email: 'accueil@cliniquengaliema.cd', bedCount: 250, departmentCount: 12, staffCount: 500 },
  { name: 'Laboratoire Central National de Kinshasa', code: 'LCNK-004', facilityType: F.LABORATORY, address: 'Avenue des Aviateurs, Gombe', city: 'Kinshasa', phone: '+243 81 222 0004', email: 'lab@lcnk.cd', bedCount: 0, departmentCount: 6, staffCount: 200 },
  { name: 'Pharmacie Centrale de Kinshasa', code: 'PCK-005', facilityType: F.PHARMACY, address: 'Avenue Tombalbaye, Limete', city: 'Kinshasa', phone: '+243 81 222 0005', email: 'pharm@pck.cd', bedCount: 0, departmentCount: 3, staffCount: 80 },
]

const userData = [
  { firstname: 'Jean-Pierre', lastname: 'Lukusa', email: 'admin@dhayaro.cd', role: 'ADMIN', fi: 0 },
  { firstname: 'Amira', lastname: 'Tshisekedi', email: 'superadmin@dhayaro.cd', role: 'SUPER_ADMIN', fi: 0 },
  { firstname: 'Patrice', lastname: 'Kabongo', email: 'dr.kabongo@dhayaro.cd', role: 'DOCTOR', fi: 0 },
  { firstname: 'Clovis', lastname: 'Lukusa', email: 'dr.clovis@dhayaro.cd', role: 'DOCTOR', fi: 0 },
  { firstname: 'Espérance', lastname: 'Ilunga', email: 'dr.esperance@dhayaro.cd', role: 'SPECIALIST', fi: 1 },
  { firstname: 'Grâce', lastname: 'Nsenda', email: 'dr.grace@dhayaro.cd', role: 'SPECIALIST', fi: 2 },
  { firstname: 'Joseph', lastname: 'Tshisekedi', email: 'lab.joseph@dhayaro.cd', role: 'LABORATORY', fi: 3 },
  { firstname: 'Béatrice', lastname: 'Ngoy', email: 'pharm.beatrice@dhayaro.cd', role: 'PHARMACIST', fi: 4 },
  { firstname: 'Mohamed', lastname: 'Bensaid', email: 'nurse.mohamed@dhayaro.cd', role: 'NURSE', fi: 0 },
  { firstname: 'Yasmine', lastname: 'Ngoma', email: 'reception@dhayaro.cd', role: 'RECEPTIONIST', fi: 0 },
]

const firstNamesM = ['Pierre','Joseph','Jean','Patrice','Clovis','Augustin','Sylvain','André','David','Marcel','Robert','Georges','Emmanuel','Prosper','Blaise','Félicien','Laurent','Gilbert','Théodore','Hippolyte']
const firstNamesF = ['Grâce','Espérance','Cécile','Monique','Béatrice','Marie','Françoise','Joséphine','Thérèse','Clémentine','Hortense','Suzanne','Adélaïde','Solange','Berthe','Marthe','Jeanne','Colette','Madeleine','Caroline']
const lastNames = ['Tshisekedi','Kabila','Lumumba','Tshombe','Kalonji','Kabongo','Ilunga','Ngoma','Mutombo','Bakonga','Lukusa','Nsenda','Kasai','Mobutu','Diangienda','Ngoy','Bensaid','Mbaya','Simbi','Kashesha','Mugangu','Kamara','Kolongo','Bolongo','Mukalay']
const bloodGroups = ['A+','A-','B+','B-','AB+','AB-','O+','O+','O+','O-']
const communes = ['Gombe','Lingwala','Ngaliema','Barumbu','Limete','Masina','Kalamu','Bandalungwa','Kintambo','Ndjili','Matonge','Kasa-Vubu','Mont-Ngafula','Selembao']
const streets = ['Avenue Kasavubu','Boulevard Lumumba',"Avenue de l'Hôpital",'Boulevard du 30 Juin','Avenue Sendwe','Rue Kasa-Vubu','Avenue Tombalbaye','Avenue des Aviateurs','Avenue Mombo','Boulevard Mangengeng']
const allergiesList = ['Pénicilline','Aspirine','Iode','Latex','AINS','Morphine','Sulfamides','Pollens','Crustacés','Arachides','Null']

const clinicalTemplates = [
  { motif: 'Fièvre palustre avec frissons', symptoms: ['Fièvre 40°C','Frissons intensifs','Sueurs profondes','Céphalées'], diag: 'Paludisme sévère à Plasmodium falciparum', treatment: 'Artésunate IV 2.4mg/kg + Arteméther-Luméfantrine PO', notes: 'Goutte épaisse positive - Hb 8.2g/dL' },
  { motif: 'Douleur thoracique aiguë', symptoms: ['Douleur rétrosternale','Dyspnée','Palpitations'], diag: 'Syndrome coronarien aigu - Suspicion', treatment: 'Aspirine 250mg + Nitroglycérine SL + ECG urgent', notes: 'URGENCE - ECG et troponines immédiats' },
  { motif: 'Diabète type 2 - Suivi', symptoms: ['Polyurie','Polydipsie','Fatigue'], diag: 'Diabète type 2 - HbA1c 9.5%', treatment: 'Metformine 1000mg 2x/j + Gliclazide 80mg', notes: 'Contrôle HbA1c dans 3 mois' },
  { motif: 'Hypertension artérielle sévère', symptoms: ['Céphalées occipitales','Vertiges','Épistaxis'], diag: 'HTA sévère - Risque CV élevé', treatment: 'Amlodipine 10mg + Lisinopril 20mg', notes: 'Régime hyposodé prescrit' },
  { motif: 'Infection pulmonaire sévère', symptoms: ['Fièvre 39.8°C','Toux productive purulente','Dyspnée'], diag: 'Pneumonie lobaire droite - CRB-65: 2', treatment: 'Ceftriaxone 2g IV + Azithromycine 500mg', notes: 'Radiographie thoracique à contrôler' },
  { motif: 'Douleur abdominale aiguë FID', symptoms: ['Douleur FID','Fièvre 38.5°C','Nausées'], diag: 'Appendicite aiguë - Alvarado 8', treatment: 'Appendicoscopie sous coelioscopie', notes: 'Chirurgie urgente programmée' },
  { motif: 'Infection urinaire haute', symptoms: ['Dysurie','Fièvre 39°C','Douleur lombaire'], diag: 'Pyélonéphrite aiguë - E.coli', treatment: 'Ciprofloxacine 500mg 2x/j x14 jours', notes: 'Uroculture et antibiogramme' },
  { motif: 'Anémie sévère', symptoms: ['Fatigue extrême','Pâleur intense','Dyspnée d\'effort'], diag: 'Anémie ferriprive sévère - Hb 5.8g/dL', treatment: 'Venofer 200mg IV x5 + Fer oral', notes: 'Recherche cause parasitaire' },
  { motif: 'Insuffisance cardiaque décompensée', symptoms: ['Dyspnée de repos','Orthopnée','Œdèmes MI'], diag: 'ICFE NYHA III - FEVG 28%', treatment: 'Furosémide IV + Ramipril + Carvedilol', notes: 'Surveillance poids quotidienne' },
  { motif: 'Gastropathie', symptoms: ['Douleur épigastrique','Brûlures','Ballonnements'], diag: 'Gastrite antrale - Hp positif', treatment: 'IPP + Amoxicilline 1g + Clarithromycine 500mg (14j)', notes: 'Test urea breath test après 4 semaines' },
  { motif: 'Colique néphrétique', symptoms: ['Douleur lombaire fulgurante','Nausées','Hématurie'], diag: 'Lithiase rénale droite 9mm', treatment: 'Métamizole 2g IV + Tamsulosine', notes: 'Scanner abdomen sans injection' },
  { motif: 'Trouble dépressif majeur', symptoms: ['Tristesse persistante','Anhédonie','Insomnie'], diag: 'Trouble dépressif sévère - PHQ-9: 19', treatment: 'Sertraline 50mg/j + TCC', notes: 'Suivi psychiatrique programmé' },
  { motif: 'Malaria chez l\'enfant', symptoms: ['Fièvre 40.5°C','Convulsions','Vomissements'], diag: 'Paludisme cérébral - Enfant 4 ans', treatment: 'Artésunate IV 3.2mg/kg + Dextrose 5%', notes: 'URGENCE - Surveillance neurologique continue' },
  { motif: 'Tuberculose pulmonaire', symptoms: ['Toux chronique >2 semaines','Hémoptysie','Amaigrissement'], diag: 'Tuberculose pulmonaire - BK+ x3', treatment: 'RHZE 2 mois + RH 4 mois', notes: 'Isolement respiratoire - Contact tracing' },
  { motif: 'VIH/SIDA - Mise sous ARV', symptoms: ['Amaigrissement','Diarrhée chronique','Fièvre intermittente'], diag: 'VIH stade 4 - CD4: 85/mm3', treatment: 'TDF/3TC/DTG + Cotrimoxazole prophylaxie', notes: 'Adhérence thérapeutique - Suivi mensuel' },
  { motif: 'Malnutrition sévère enfant', symptoms: ['AMA','Œdèmes','Irritabilité'], diag: 'Malnutrition aiguë sévère - IMC/A < 3', treatment: 'F-75 → F-100 → ROM + Cotrimoxazole', notes: 'Enfant 18 mois - Pesée quotidienne' },
  { motif: 'Céphalées chroniques', symptoms: ['Céphalées bilatérales','Nausées','Photophobie'], diag: 'Migraine sans aura - Crise prolongée', treatment: 'Kétorolac 30mg IV + Métoclopramide', notes: 'Bilan NEURO : scanner cérébral normal' },
  { motif: 'Blessure par balle - Thorax', symptoms: ['Douleur thoracique vive','Hémorragie externe','Dyspnée'], diag: 'Plaie pénétrante thorax - Hémothorax', treatment: 'Drain thoracique + Laparotomie exploratrice', notes: 'URGENCE CHIRURGICALE - Transfusion' },
]

const diseaseData = [
  { code: 'B54', name: 'Paludisme non précisé', category: 'Maladies infectieuses', symptoms: ['Fièvre','Frissons','Sueurs'], complications: ['Paludisme cérébral','Anémie sévère'], treatments: ['Arthéméther-Luméfantrine','Artésunate IV'] },
  { code: 'A09', name: 'Gastro-entérite infectieuse', category: 'Maladies infectieuses', symptoms: ['Diarrhée','Vomissements','Fièvre'], complications: ['Déshydratation sévère'], treatments: ['Solution de Réhydratation Orale'] },
  { code: 'E11', name: 'Diabète de type 2', category: 'Maladies endocriniennes', symptoms: ['Polyurie','Polydipsie','Amaigrissement'], complications: ['Rétinopathie','Néphropathie'], treatments: ['Metformine','Insuline'] },
  { code: 'I10', name: 'Hypertension artérielle essentielle', category: 'Maladies cardiovasculaires', symptoms: ['Céphalées','Vertiges'], complications: ['AVC','IDC'], treatments: ['IEC','ARA-II','Calcio-antagonistes'] },
  { code: 'J18', name: 'Pneumonie', category: 'Maladies respiratoires', symptoms: ['Fièvre','Toux productive','Dyspnée'], complications: ['Empyème','Septicémie'], treatments: ['Antibiothérapie','Oxygénothérapie'] },
  { code: 'K29', name: 'Gastrite', category: 'Maladies digestives', symptoms: ['Douleur épigastrique','Nausées'], complications: ['Ulcère gastrique'], treatments: ['IPP','Eradication H.pylori'] },
  { code: 'N39', name: 'Infection urinaire', category: 'Maladies urologiques', symptoms: ['Dysurie','Pollakiurie'], complications: ['Pyélonéphrite','Sepsis'], treatments: ['Antibiothérapie'] },
  { code: 'F32', name: 'Trouble dépressif majeur', category: 'Maladies psychiatriques', symptoms: ['Tristesse','Anhédonie','Insomnie'], complications: ['Suicide'], treatments: ['ISRS','Psychothérapie'] },
  { code: 'B20', name: 'VIH/SIDA', category: 'Maladies infectieuses', symptoms: ['Amaigrissement','Diarrhée chronique'], complications: ['Tuberculose','Infections opportunistes'], treatments: ['ARV - TDF/3TC/DTG'] },
  { code: 'A16', name: 'Tuberculose pulmonaire', category: 'Maladies infectieuses', symptoms: ['Toux chronique','Hémoptysie'], complications: ['Pneumothorax'], treatments: ['RHZE 2 mois + RH 4 mois'] },
]

const medData = [
  { name: 'Artésunate', genericName: 'Artésunate', category: 'Antipaludéen', form: 'Injectable', dosage: '60mg' },
  { name: 'Amoxicilline', genericName: 'Amoxicilline', category: 'Antibiotique', form: 'Gélule', dosage: '500mg' },
  { name: 'Paracétamol', genericName: 'Paracétamol', category: 'Antalgique', form: 'Comprimé', dosage: '1000mg' },
  { name: 'Metformine', genericName: 'Metformine', category: 'Antidiabétique', form: 'Comprimé', dosage: '850mg' },
  { name: 'Amlodipine', genericName: 'Amlodipine', category: 'Antihypertenseur', form: 'Comprimé', dosage: '5mg' },
  { name: 'Ibuprofène', genericName: 'Ibuprofène', category: 'AINS', form: 'Comprimé', dosage: '400mg' },
  { name: 'Omeprazole', genericName: 'Omeprazole', category: 'IPP', form: 'Gélule', dosage: '20mg' },
  { name: 'Ciprofloxacine', genericName: 'Ciprofloxacine', category: 'Antibiotique', form: 'Comprimé', dosage: '500mg' },
  { name: 'Cotrimoxazole', genericName: 'Cotrimoxazole', category: 'Antibiotique', form: 'Comprimé', dosage: '480mg' },
  { name: 'Ceftriaxone', genericName: 'Ceftriaxone', category: 'Antibiotique', form: 'Injectable', dosage: '1g' },
  { name: 'Arteméther-Luméfantrine', genericName: 'AL', category: 'Antipaludéen', form: 'Comprimé', dosage: '20/120mg' },
  { name: 'TDF/3TC/DTG', genericName: 'ARV Triple', category: 'Antirétroviral', form: 'Comprimé', dosage: '300/300/50mg' },
  { name: 'Cétirizine', genericName: 'Cétirizine', category: 'Antihistaminique', form: 'Comprimé', dosage: '10mg' },
  { name: 'Furosémide', genericName: 'Furosémide', category: 'Diurétique', form: 'Comprimé', dosage: '40mg' },
  { name: 'Sertraline', genericName: 'Sertraline', category: 'ISRS', form: 'Comprimé', dosage: '50mg' },
  { name: 'Metoclopramide', genericName: 'Metoclopramide', category: 'Antiémétique', form: 'Injectable', dosage: '10mg' },
  { name: 'Kétorolac', genericName: 'Kétorolac', category: 'AINS', form: 'Injectable', dosage: '30mg' },
  { name: 'Salbutamol', genericName: 'Salbutamol', category: 'Bronchodilatateur', form: 'Spray', dosage: '100mcg' },
]

const labExamNames = ['NFS complète','Glycémie à jeun','Créatinine','Bilan hépatique','ECBU','Goutte épaisse et thin film','Sérologie VIH','CD4','Charge virale VIH','Radiographie thoracique','ECG','Scanner abdominal','Échographie abdominale','Bilan coagulation','Vitesse de sédimentation','CRP','Bilan lipidique','HbA1c','Examen coprologique','Hémoculture','Uroculture']

const treatmentDescriptions = [
  'Artésunate IV 2.4mg/kg J0 puis J24 + Arteméther PO J12',
  'Ceftriaxone 2g IV 1x/j + Azithromycine 500mg PO 1x/j x 7j',
  'Metformine 1000mg 2x/j + Gliclazide MR 60mg 1x/j',
  'Amlodipine 5mg 1x/j + Lisinopril 10mg 1x/j',
  'Furosémide 40mg IV 2x/j + Ramipril 5mg 1x/j',
  'IPP 20mg 1x/j à jeun + Triple antibiothérapie x14j',
  'Ciprofloxacine 500mg 2x/j x 7 jours',
  'Venofer 200mg IV x5 séances + Fer fumarate oral',
  'TDF/3TC/DTG 1cp/j + Cotrimoxazole 960mg/j',
  'RHZE 2 mois puis RH 4 mois - DOT',
  'Paracétamol 1g 3x/j + AINS topique + Rééducation',
  'Sertraline 50mg/j croissance progressive',
  'F-75 pendant 6h puis F-100 + RUTF + ROM',
  'Kétorolac 30mg IV + Métoclopramide 10mg IV',
  'Drain thoracique + Surveillance hémodynamique',
]

const diseaseDescriptions = [
  'Paludisme simple non compliqué chez adulte immunocompétent',
  'Paludisme sévère avec parasitémie >100.000/mm3',
  'Pneumonie communautaire typique sans comorbidité',
  'Diabète type 2 déséquilibré avec complications microvasculaires',
  'HTA maligne avec souffle réno-vasculaire',
  'Insuffisance cardiaque décompensée stade NYHA III',
  'Gastropathie ulcéreuse hémorragique',
  'Pyélonéphrite aiguë chez la femme enceinte',
  'Infection urinaire basse à E.coli',
  'Tuberculose pulmonaire bacillifère',
  'Infection VIH stade 4 avec CD4 bas',
  'Malnutrition aiguë sévère chez enfant de 18 mois',
  'Anémie ferriprive sévère post-partum',
  'Arthrose gonarthrose bilatérale stade IV',
  'Migraine sévère sans aura',
]

async function seed() {
  console.log('=== Dhayaro Seed — Données Réalistes RDC/Kinshasa ===\n')
  console.log('Connexion à Neon PostgreSQL...')

  const q = async (text) => {
    for (let a = 1; a <= 3; a++) {
      try { return await sql.query(text) } catch (e) {
        if (a === 3) throw e
        await new Promise(r => setTimeout(r, a * 2000))
      }
    }
  }

  console.log('Cleaning...')
  await q('TRUNCATE sync_queue, archives, audit_logs, documents, queue, lab_exams, prescriptions, treatments, diagnostics, consultations, clinical_cases, patients, notifications, users, diseases, lab_categories, medications, facilities RESTART IDENTITY CASCADE')

  const now = new Date()

  // ── Facilities ──
  const facilityIds = []
  for (const f of facilityData) {
    const id = uuid(); facilityIds.push(id)
    await q(`INSERT INTO facilities (id,name,code,facility_type,address,city,phone,email,bed_count,department_count,staff_count,is_active,created_at,updated_at) VALUES (${esc(id)},${esc(f.name)},${esc(f.code)},${esc(f.facilityType)},${esc(f.address)},${esc(f.city)},${esc(f.phone)},${esc(f.email)},${f.bedCount},${f.departmentCount},${f.staffCount},TRUE,${esc(now)},${esc(now)})`)
  }
  console.log(`Facilities: ${facilityIds.length}`)

  // ── Users ──
  const passwordHash = await bcrypt.hash('admin123', 12)
  const doctorHash = await bcrypt.hash('doctor123', 12)
  const nurseHash = await bcrypt.hash('nurse123', 12)
  const otherHash = await bcrypt.hash('dhayaro123', 12)
  const hashByRole = { SUPER_ADMIN: passwordHash, ADMIN: passwordHash, RECEPTIONIST: otherHash, DOCTOR: doctorHash, SPECIALIST: doctorHash, LABORATORY: otherHash, PHARMACIST: otherHash, NURSE: nurseHash, ACCOUNTANT: otherHash, ARCHIVIST: otherHash }

  const userIds = []
  for (let i = 0; i < userData.length; i++) {
    const u = userData[i]; const id = uuid(); userIds.push(id)
    await q(`INSERT INTO users (id,firstname,lastname,email,password_hash,role,facility_id,is_active,created_at,updated_at) VALUES (${esc(id)},${esc(u.firstname)},${esc(u.lastname)},${esc(u.email)},${esc(hashByRole[u.role])},${esc(u.role)},${esc(facilityIds[u.fi])},TRUE,${esc(daysAgo(365-i))},${esc(now)})`)
  }
  console.log(`Users: ${userIds.length}`)

  // Build user lookup: facility_id → { doctors: [], nurses: [], lab: null }
  const userByFacility = {}
  for (let i = 0; i < userData.length; i++) {
    const fi = facilityIds[userData[i].fi]
    if (!userByFacility[fi]) userByFacility[fi] = { doctors: [], nurses: [], lab: null, pharmacist: null }
    const r = userData[i].role
    if (r === 'DOCTOR' || r === 'SPECIALIST') userByFacility[fi].doctors.push(userIds[i])
    if (r === 'NURSE') userByFacility[fi].nurses.push(userIds[i])
    if (r === 'LABORATORY') userByFacility[fi].lab = userIds[i]
    if (r === 'PHARMACIST') userByFacility[fi].pharmacist = userIds[i]
  }
  const allDoctors = userIds.filter((_, i) => ['DOCTOR','SPECIALIST'].includes(userData[i].role))
  const getDoctorForFi = (fi) => {
    const f = userByFacility[fi]
    return f && f.doctors.length ? pick(f.doctors) : pick(allDoctors)
  }

  // ── Diseases ──
  const diseaseIds = []
  for (const d of diseaseData) {
    const id = uuid(); diseaseIds.push(id)
    await q(`INSERT INTO diseases (id,code,name,category,symptoms,complications,treatments,is_active,created_at,updated_at) VALUES (${esc(id)},${esc(d.code)},${esc(d.name)},${esc(d.category)},${j(d.symptoms)},${j(d.complications)},${j(d.treatments)},TRUE,${esc(daysAgo(365))},${esc(now)})`)
  }
  console.log(`Diseases: ${diseaseIds.length}`)

  // ── Medications ──
  const medIds = []
  for (const m of medData) {
    const id = uuid(); medIds.push(id)
    await q(`INSERT INTO medications (id,name,generic_name,category,form,dosage,side_effects,contraindications,is_active,created_at) VALUES (${esc(id)},${esc(m.name)},${esc(m.genericName)},${esc(m.category)},${esc(m.form)},${esc(m.dosage)},'[]'::jsonb,'[]'::jsonb,TRUE,${esc(daysAgo(365))})`)
  }
  console.log(`Medications: ${medIds.length}`)

  // ── Patients (100) — each linked to a facility ──
  console.log('Generating 100 patients...')
  const patientIds = []
  const patientByFacility = {}
  for (let b = 0; b < 10; b++) {
    const rows = []
    for (let i = 0; i < 10; i++) {
      const idx = b * 10 + i
      const fi = facilityIds[Math.floor(Math.random() * facilityIds.length)]
      const sex = Math.random() > 0.48 ? 'M' : 'F'
      const age = 1 + Math.floor(Math.random() * 90)
      const birthYear = 2026 - age
      const fn = sex === 'M' ? pick(firstNamesM) : pick(firstNamesF)
      const ln = pick(lastNames)
      const id = uuid(); patientIds.push(id)
      if (!patientByFacility[fi]) patientByFacility[fi] = []
      patientByFacility[fi].push(id)
      const dob = `${birthYear}-${String(1+Math.floor(Math.random()*12)).padStart(2,'0')}-${String(1+Math.floor(Math.random()*28)).padStart(2,'0')}`
      const allg = pick(allergiesList)
      const allergies = allg === 'Null' ? '[]' : JSON.stringify([allg])
      const phone = `+243 8${randInt(1,9)} ${String(randInt(100,999)).padStart(3,'0')} ${String(randInt(1000,9999)).padStart(4,'0')}`
      const ecPhone = `+243 8${randInt(1,9)} ${String(randInt(100,999)).padStart(3,'0')} ${String(randInt(1000,9999)).padStart(4,'0')}`
      rows.push(`(${esc(id)},${esc(uuid())},${esc(fi)},${esc(fn)},${esc(ln)},'${sex}',${esc(dob)},${age},${esc(pick(bloodGroups))},${esc(phone)},${esc(`${fn.toLowerCase()}.${ln.toLowerCase()}@email.cd`)},${esc(`${pick(streets)}, ${pick(communes)}`)},${esc(pick(['Kinshasa','Lubumbashi','Mbuji-Mayi','Kisangani','Goma','Bukavu']))},${esc(`${pick(firstNamesM)} ${pick(lastNames)}`)},${esc(ecPhone)},${esc(pick(['Époux','Épouse','Père','Mère','Frère','Sœur','Enfant']))},${esc(pick(['CNSS','INPP','INAM','Privé','Aucune']))},${esc(Math.random()>0.3?`CNSS-${randInt(100000,999999)}`:null)},'${allergies}','[]'::jsonb,'{}'::jsonb,TRUE,FALSE,${esc(daysAgo(365-idx))},${esc(now)})`)
    }
    await q(`INSERT INTO patients (id,patient_uuid,facility_id,firstname,lastname,sex,date_of_birth,age,blood_group,phone,email,address,city,emergency_contact_name,emergency_contact_phone,emergency_contact_relation,insurance_name,insurance_number,allergies,antecedents,medical_history_json,is_active,is_archived,created_at,updated_at) VALUES ${rows.join(',')}`)
    process.stdout.write(`  Patients: ${patientIds.length}/100\r`)
  }
  console.log(`\nPatients: ${patientIds.length}`)

  // ── Consultations (200) — patient + doctor from SAME facility ──
  console.log('Generating 200 consultations...')
  const consultationIds = []
  const consultationData = []
  const fiKeys = Object.keys(patientByFacility)
  for (let b = 0; b < 2; b++) {
    const rows = []
    for (let i = 0; i < 100; i++) {
      const idx = b * 100 + i
      const fi = pick(fiKeys)
      const pid = pick(patientByFacility[fi])
      const did = getDoctorForFi(fi)
      const t = pick(clinicalTemplates)
      const id = uuid(); consultationIds.push(id)
      const temp = +(36 + Math.random() * 5).toFixed(1)
      const hr = 55 + Math.floor(Math.random() * 50)
      const bp = `${100+Math.floor(Math.random()*70)}/${60+Math.floor(Math.random()*40)}`
      const status = pick(['WAITING','IN_PROGRESS','COMPLETED','COMPLETED'])
      const cDate = daysAgo(Math.floor(Math.random() * 300))
      consultationData.push({ id, facilityId: fi, patientId: pid, doctorId: did, template: t })
      rows.push(`(${esc(id)},${esc(fi)},${esc(pid)},${esc(did)},${esc(`CONS-${String(idx+1).padStart(5,'0')}`)},${esc(t.motif)},${j(t.symptoms)},${j({temperature:temp,heartRate:hr,bloodPressure:bp})},${esc(t.notes)},${esc(t.diag)},'${status}',${esc(cDate)},${esc(now)})`)
    }
    await q(`INSERT INTO consultations (id,facility_id,patient_id,doctor_id,consultation_number,motif,symptoms,vital_signs,notes,provisional_diagnosis,status,created_at,updated_at) VALUES ${rows.join(',')}`)
    process.stdout.write(`  Consultations: ${consultationIds.length}/200\r`)
  }
  console.log(`\nConsultations: ${consultationIds.length}`)

  // ── Lab Categories ──
  const labCatIds = []
  for (const lc of [{ name: 'Biologie générale', description: 'NFS, glycémie, créatinine, bilan hépatique' },{ name: 'Microbiologie', description: 'ECBU, hémoculture, BK, CODD' },{ name: 'Radiologie', description: 'Radiographie, scanner, IRM, échographie' },{ name: 'Cardiologie', description: 'ECG, échocardiographie, Holter' },{ name: 'Anatomopathologie', description: 'Biopsies, cytologie' }]) {
    const id = uuid(); labCatIds.push(id)
    await q(`INSERT INTO lab_categories (id,name,description,is_active,created_at) VALUES (${esc(id)},${esc(lc.name)},${esc(lc.description)},TRUE,${esc(daysAgo(365))})`)
  }
  console.log(`Lab Categories: ${labCatIds.length}`)

  // ── Diagnostics (50) — linked to consultation + patient + doctor ──
  console.log('Generating 50 diagnostics...')
  const diagRows = []
  for (let i = 0; i < 50; i++) {
    const c = pick(consultationData)
    const dDate = daysAgo(Math.floor(Math.random()*300))
    diagRows.push(`(${esc(uuid())},${esc(c.id)},${esc(c.patientId)},${esc(c.doctorId)},${esc(diseaseIds[Math.floor(Math.random()*diseaseIds.length)])},'${pick(['PROVISIONAL','FINAL','FINAL'])}',${esc(pick(diseaseDescriptions))},${Math.random()>0.3?'TRUE':'FALSE'},${esc(dDate)},${esc(now)})`)
  }
  await q(`INSERT INTO diagnostics (id,consultation_id,patient_id,doctor_id,disease_id,diagnostic_type,description,is_validated,created_at,updated_at) VALUES ${diagRows.join(',')}`)
  console.log('Diagnostics: 50')

  // ── Treatments (50) — linked to same patient + doctor as their consultation ──
  console.log('Generating 50 treatments...')
  const treatmentIds = []
  const treatmentPatientMap = {}
  for (let b = 0; b < 1; b++) {
    const rows = []
    for (let i = 0; i < 50; i++) {
      const c = pick(consultationData)
      const id = uuid(); treatmentIds.push(id)
      treatmentPatientMap[id] = { patientId: c.patientId, doctorId: c.doctorId }
      const dDate = daysAgo(Math.floor(Math.random()*180))
      rows.push(`(${esc(id)},${esc(c.patientId)},${esc(c.doctorId)},${esc(pick(treatmentDescriptions))},'${pick(['PRESCRIBED','IN_PROGRESS','IN_PROGRESS','COMPLETED'])}',${esc(dDate.toISOString().split('T')[0])},${esc(dDate)},${esc(now)})`)
    }
    await q(`INSERT INTO treatments (id,patient_id,doctor_id,description,status,start_date,created_at,updated_at) VALUES ${rows.join(',')}`)
    process.stdout.write(`  Treatments: ${treatmentIds.length}/50\r`)
  }
  console.log(`\nTreatments: ${treatmentIds.length}`)

  // ── Prescriptions (50) — linked to treatment + medication ──
  console.log('Generating 50 prescriptions...')
  const prescRows = []
  for (let i = 0; i < 50; i++) {
    const tid = pick(treatmentIds)
    const pDate = daysAgo(Math.floor(Math.random()*180))
    prescRows.push(`(${esc(uuid())},${esc(tid)},${esc(medIds[Math.floor(Math.random()*medIds.length)])},${esc(pick(['1 comprimé 2x/j','1 comprimé 3x/j','2 comprimés 1x/j','1 gélule le soir','1 injectable 1x/j']))},${esc(pick(['Matin et soir','3 fois par jour','Le matin','Selon besoin','Toutes les 8h']))},${esc(pick(['5 jours','7 jours','14 jours','1 mois','3 mois','6 mois']))},${esc(pick(['Prendre avec de la nourriture','À jeun 30min avant repas','Pendant les repas','Sans restriction']))},${10+Math.floor(Math.random()*60)},${esc(pDate)})`)
  }
  await q(`INSERT INTO prescriptions (id,treatment_id,medication_id,dosage,frequency,duration,instructions,quantity,created_at) VALUES ${prescRows.join(',')}`)
  console.log('Prescriptions: 50')

  // ── Lab Exams (100) — linked to patient + doctor from consultation, with consultation_id ──
  console.log('Generating 100 lab exams...')
  for (let b = 0; b < 2; b++) {
    const rows = []
    for (let i = 0; i < 50; i++) {
      const c = pick(consultationData)
      const isCompleted = Math.random() > 0.3
      const status = isCompleted ? pick(['COMPLETED','COMPLETED','IN_PROGRESS']) : pick(['REQUESTED','IN_PROGRESS'])
      const results = isCompleted ? JSON.stringify({valeur:pick(['Normal','Élevé','Bas','Positif','Négatif']),unite:pick(['g/dL','mmol/L','UI/L','/mm3'])}) : '{}'
      const resultNotes = isCompleted ? pick(['Dans les normes','Légèrement élevé','À contrôler','Normal']) : null
      const validatedBy = isCompleted ? c.doctorId : null
      const validatedAt = isCompleted ? daysAgo(Math.floor(Math.random()*100)) : null
      const completedAt = isCompleted ? daysAgo(Math.floor(Math.random()*150)) : null
      const catId = labCatIds[Math.floor(Math.random()*labCatIds.length)]
      const labTech = userByFacility[c.facilityId]?.lab || userIds[8]
      rows.push(`(${esc(uuid())},${esc(c.facilityId)},${esc(c.patientId)},${esc(c.doctorId)},${esc(labTech)},${esc(catId)},${esc(c.id)},${esc(pick(labExamNames))},${esc(pick(['Bilan pré-opératoire','Suivi thérapeutique','Urgence diagnostique','Dépistage','Contrôle post-traitement']))},'${status}','${results.replace(/'/g,"''")}',${resultNotes?esc(resultNotes):'NULL'},${validatedBy?esc(validatedBy):'NULL'},${validatedAt?esc(validatedAt):'NULL'},${esc(daysAgo(Math.floor(Math.random()*200)))},${completedAt?esc(completedAt):'NULL'},${esc(daysAgo(Math.floor(Math.random()*200)))},${esc(now)})`)
    }
    await q(`INSERT INTO lab_exams (id,facility_id,patient_id,doctor_id,lab_technician_id,category_id,consultation_id,exam_name,clinical_indication,status,results,result_notes,validated_by,validated_at,requested_at,completed_at,created_at,updated_at) VALUES ${rows.join(',')}`)
    process.stdout.write(`  Lab Exams: ${(b+1)*50}/100\r`)
  }
  console.log('\nLab Exams: 100')

  // ── Clinical Cases (20) — linked to consultation's patient + doctor ──
  console.log('Generating 20 clinical cases...')
  const caseRows = []
  for (let i = 0; i < 20; i++) {
    const c = pick(consultationData)
    const t = c.template
    const tag1 = pick(['paludisme','diabète','HTA','TBC','VIH'])
    const tag2 = pick(['urgent','suivi','contrôle'])
    const tagsJson = `{"tags":["${tag1}","${tag2}"]}`
    caseRows.push(`(${esc(uuid())},${esc(c.facilityId)},${esc(c.patientId)},${esc(c.doctorId)},${esc(t.motif)},${esc(t.diag)},${j({description:t.symptoms.join(', ')})},${esc(t.diag)},${esc(t.treatment)},${esc(pick(['5 jours','7 jours','14 jours','1 mois','3 mois']))},'${pick(['PENDING','IN_PROGRESS','SUCCESS','SUCCESS','FAILURE'])}',${esc(pick(['Évolution favorable','Résolu','Échec thérapeutique','Contre-indication']))},${esc(pick(['low','medium','medium','high','urgent']))},'${tagsJson}',${Math.random()>0.3?'TRUE':'FALSE'},${esc(daysAgo(Math.floor(Math.random()*300)))},${esc(now)})`)
  }
  await q(`INSERT INTO clinical_cases (id,facility_id,patient_id,doctor_id,title,description,symptoms_json,provisional_diagnosis,treatment,treatment_duration,outcome_status,outcome_notes,priority,tags_json,is_synced,created_at,updated_at) VALUES ${caseRows.join(',')}`)
  console.log('Clinical Cases: 20')

  // ── Audit Logs (50) — linked to users + facilities ──
  console.log('Generating 50 audit logs...')
  const auditRows = []
  for (let i = 0; i < 50; i++) {
    const uid = userIds[Math.floor(Math.random()*userIds.length)]
    const fi = facilityIds[Math.floor(Math.random()*facilityIds.length)]
    const desc = pick(['Connexion réussie','Création enregistrée','Modification effectuée','Consultation visualisée'])
    auditRows.push(`(${esc(uuid())},${esc(uid)},${esc(fi)},${esc(pick(['LOGIN','CREATE','UPDATE','VIEW','DELETE']))},${esc(pick(['auth','consultation','patient','diagnostic','treatment','lab_exam','clinical_case','document']))},${esc(patientIds[Math.floor(Math.random()*patientIds.length)])},${j({description:desc})},${esc(`192.168.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}`)},${esc(daysAgo(Math.floor(Math.random()*365)))})`)
  }
  await q(`INSERT INTO audit_logs (id,user_id,facility_id,action,resource,resource_id,details,ip_address,timestamp) VALUES ${auditRows.join(',')}`)
  console.log('Audit Logs: 50')

  // ── Notifications (20) — linked to users + facilities ──
  console.log('Generating 20 notifications...')
  const notifTitles = ['Nouveau patient enregistré','Résultat labo disponible','Consultation assignée','Rappel médicament','Alerte stock','Diagnostic validé','Traitement terminé','Modification dossier','Contrôle urgent','Document à valider']
  const notifMessages = ['Un nouveau patient a été enregistré.','Les résultats de l\'examen sont disponibles.','Une consultation vous a été assignée.','Rappel : prise de médicament prescrite.','Le stock de médicament est bas.','Un diagnostic a été validé.','Le traitement est terminé.','Le dossier patient a été mis à jour.','Contrôle de suivi requis dans 48h.','Un document attend votre validation.']
  const notifTypes = ['INFO','INFO','SUCCESS','WARNING','ERROR','SUCCESS','INFO','WARNING','ERROR','INFO']
  const notifRows = []
  for (let i = 0; i < 20; i++) {
    notifRows.push(`(${esc(uuid())},${esc(userIds[Math.floor(Math.random()*userIds.length)])},${esc(facilityIds[Math.floor(Math.random()*facilityIds.length)])},${esc(notifTitles[i%notifTitles.length])},${esc(notifMessages[i%notifMessages.length])},'${notifTypes[i%notifTypes.length]}',${Math.random()>0.5?'TRUE':'FALSE'},${Math.random()>0.5?esc('/patients'):'NULL'},'{}'::jsonb,${esc(daysAgo(Math.floor(Math.random()*90)))})`)
  }
  await q(`INSERT INTO notifications (id,user_id,facility_id,title,message,type,is_read,link,metadata,created_at) VALUES ${notifRows.join(',')}`)
  console.log('Notifications: 20')

  // ── Queue (20) — linked to facility + patient + consultation + doctor ──
  console.log('Generating 20 queue entries...')
  const queueRows = []
  for (let i = 0; i < 20; i++) {
    const c = pick(consultationData)
    const cDate = daysAgo(Math.floor(Math.random()*30))
    queueRows.push(`(${esc(uuid())},${esc(c.facilityId)},${esc(c.patientId)},${esc(c.id)},${esc(`TK-${String(i+1).padStart(4,'0')}`)},'${pick(['LOW','NORMAL','NORMAL','HIGH','URGENT'])}','${pick(['WAITING','WITH_DOCTOR','WITH_LAB','WITH_PHARMACY','COMPLETED','CANCELLED'])}',${esc(c.doctorId)},${i+1},${randInt(5,120)},${esc(cDate)},${Math.random()>0.5?esc(pick(['Patient attendu','À rappeler','Urgence confirmée'])):'NULL'},${esc(cDate)},${esc(now)})`)
  }
  await q(`INSERT INTO queue (id,facility_id,patient_id,consultation_id,ticket_number,priority,status,assigned_doctor_id,queue_position,estimated_wait_minutes,arrived_at,notes,created_at,updated_at) VALUES ${queueRows.join(',')}`)
  console.log('Queue: 20')

  // ── Documents (20) — linked to facility + patient + consultation + doctor ──
  console.log('Generating 20 documents...')
  const docTypes = ['PRESCRIPTION','CERTIFICATE','REPORT','LAB_RESULT','REFERRAL','ORDONNANCE']
  const docTitles = ['Ordonnance médicale','Certificat médical','Rapport d\'examen','Résultat laboratoire','Lettre de recommandation','Compte-rendu opératoire']
  const docRows = []
  for (let i = 0; i < 20; i++) {
    const c = pick(consultationData)
    const cDate = daysAgo(Math.floor(Math.random()*300))
    docRows.push(`(${esc(uuid())},${esc(c.facilityId)},${esc(c.patientId)},${esc(c.id)},${esc(c.doctorId)},'${pick(docTypes)}',${esc(pick(docTitles))},${j({body:c.template.treatment})},NULL,${Math.random()>0.7?'TRUE':'FALSE'},${esc(cDate)})`)
  }
  await q(`INSERT INTO documents (id,facility_id,patient_id,consultation_id,doctor_id,document_type,title,content,file_path,is_printed,created_at) VALUES ${docRows.join(',')}`)
  console.log('Documents: 20')

  // ── Archives (10) — linked to facility + patient + user ──
  console.log('Generating 10 archives...')
  const archRows = []
  for (let i = 0; i < 10; i++) {
    const c = pick(consultationData)
    archRows.push(`(${esc(uuid())},${esc(c.facilityId)},'${pick(['CONSULTATION','DIAGNOSTIC','TREATMENT','LAB_EXAM','DOCUMENT','PATIENT_FILE'])}',${esc(c.id)},${esc(c.patientId)},${esc(pick(['Consultation archivée','Diagnostic archivé','Traitement archivé','Examen labo archivé','Dossier patient archivé']))},${esc(pick(['Dossier clôturé','Patient guéri','Transféré','Décédé','Contre-indication']))},${esc(c.doctorId)},'{}'::jsonb,${esc(daysAgo(Math.floor(Math.random()*365)))})`)
  }
  await q(`INSERT INTO archives (id,facility_id,entity_type,entity_id,patient_id,title,summary,archived_by,data,created_at) VALUES ${archRows.join(',')}`)
  console.log('Archives: 10')

  // ── Sync Queue (10) — linked to users ──
  console.log('Generating 10 sync queue entries...')
  const syncRows = []
  for (let i = 0; i < 10; i++) {
    const st = pick(['synced','pending','failed'])
    syncRows.push(`(${esc(uuid())},${esc(userIds[Math.floor(Math.random()*userIds.length)])},${esc(pick(['ClinicalCase','Patient','AuditEntry','User','Facility']))},${esc(uuid())},'${pick(['create','update','delete'])}','{}'::jsonb,'${st}',${st==='failed'?esc('Timeout de synchronisation'):'NULL'},${esc(daysAgo(Math.floor(Math.random()*30)))},${Math.random()>0.4?esc(daysAgo(Math.floor(Math.random()*10))):'NULL'})`)
  }
  await q(`INSERT INTO sync_queue (id,user_id,entity_type,entity_id,action,payload,status,error_message,created_at,synced_at) VALUES ${syncRows.join(',')}`)
  console.log('Sync Queue: 10')

  console.log('\n=== Seed terminé avec succès! ===')
  console.log(`  Facilities:       5`)
  console.log(`  Users:            10`)
  console.log(`  Patients:         100`)
  console.log(`  Diseases:         10`)
  console.log(`  Consultations:    200`)
  console.log(`  Diagnostics:      50`)
  console.log(`  Medications:      18`)
  console.log(`  Treatments:       50`)
  console.log(`  Prescriptions:    50`)
  console.log(`  Lab Categories:   5`)
  console.log(`  Lab Exams:        100`)
  console.log(`  Clinical Cases:   20`)
  console.log(`  Audit Logs:       50`)
  console.log(`  Notifications:    20`)
  console.log(`  Queue:            20`)
  console.log(`  Documents:        20`)
  console.log(`  Archives:         10`)
  console.log(`  Sync Queue:       10`)
  console.log(`  TOTAL:            743`)
}

seed().catch((e) => {
  console.error('Seed failed:', e)
  process.exit(1)
})
