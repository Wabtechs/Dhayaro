import { getDb } from './db'
import { facilities, users, patients, consultations, diagnostics, diseases, treatments, medications, prescriptions, labCategories, labExams, queue, documents, notifications, auditLogs } from './schema'
import { hashPassword } from './auth'

const F = { HOSPITAL: 'HOSPITAL' as const, CLINIC: 'CLINIC' as const, LABORATORY: 'LABORATORY' as const, PHARMACY: 'PHARMACY' as const }
const R = {
  SUPER_ADMIN: 'SUPER_ADMIN' as const, ADMIN: 'ADMIN' as const, RECEPTIONIST: 'RECEPTIONIST' as const,
  DOCTOR: 'DOCTOR' as const, SPECIALIST: 'SPECIALIST' as const, LABORATORY: 'LABORATORY' as const,
  PHARMACIST: 'PHARMACIST' as const, NURSE: 'NURSE' as const, ACCOUNTANT: 'ACCOUNTANT' as const, ARCHIVIST: 'ARCHIVIST' as const,
}

function daysAgo(n: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(8 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 60), 0, 0)
  return d
}
function pick<T>(arr: readonly T[]): T { return arr[Math.floor(Math.random() * arr.length)] }

const facilityData = [
  { name: 'Hôpital Central d\'Alger', code: 'HCA-001', facilityType: F.HOSPITAL, address: 'Rue Didouche Mourad', city: 'Alger', phone: '+213 21 23 00 01', email: 'info@hca.dz', bedCount: 1500, departmentCount: 35, staffCount: 3500 },
  { name: 'CHU Bab-Ezzouar', code: 'CHB-002', facilityType: F.HOSPITAL, address: 'Bab-Ezzouar', city: 'Alger', phone: '+213 21 23 00 02', email: 'contact@chb.dz', bedCount: 800, departmentCount: 20, staffCount: 1800 },
  { name: 'Clinique El djazairia', code: 'CED-003', facilityType: F.CLINIC, address: 'Rue Abane Ramdane', city: 'Alger', phone: '+213 21 23 00 03', email: 'accueil@ced.dz', bedCount: 200, departmentCount: 10, staffCount: 400 },
  { name: 'CHU Mustapha', code: 'CHM-004', facilityType: F.HOSPITAL, address: 'Place du 1er Novembre', city: 'Alger', phone: '+213 21 23 00 04', email: 'admin@chm.dz', bedCount: 2000, departmentCount: 45, staffCount: 5000 },
  { name: 'Hôpital Pierre-Bénite Alger', code: 'HPB-005', facilityType: F.HOSPITAL, address: 'Rue Larbi Ben M\'hidi', city: 'Alger', phone: '+213 21 23 00 05', email: 'info@hpb.dz', bedCount: 600, departmentCount: 18, staffCount: 1200 },
  { name: 'Clinique Saint-Augustin', code: 'CSA-006', facilityType: F.CLINIC, address: 'Rue Ahmed Bey', city: 'Alger', phone: '+213 21 23 00 06', email: 'contact@csa.dz', bedCount: 150, departmentCount: 8, staffCount: 300 },
  { name: 'Laboratoire Central CNRPH', code: 'LCC-007', facilityType: F.LABORATORY, address: 'Rue des Martyrs', city: 'Alger', phone: '+213 21 23 00 07', email: 'lab@lcc.dz', bedCount: 0, departmentCount: 5, staffCount: 200 },
  { name: 'Pharmacie Centrale Hôpital', code: 'PCH-008', facilityType: F.PHARMACY, address: 'Avenue Houari Boumediene', city: 'Alger', phone: '+213 21 23 00 08', email: 'pharm@pch.dz', bedCount: 0, departmentCount: 3, staffCount: 80 },
  { name: 'CHU Tizi-Ouzou', code: 'CHT-009', facilityType: F.HOSPITAL, address: 'Avenue de la République', city: 'Tizi-Ouzou', phone: '+213 36 00 00 01', email: 'info@cht.dz', bedCount: 700, departmentCount: 18, staffCount: 1500 },
  { name: 'Hôpital Annaba', code: 'HAN-010', facilityType: F.HOSPITAL, address: 'Rue de la Liberté', city: 'Annaba', phone: '+213 38 00 00 01', email: 'admin@han.dz', bedCount: 500, departmentCount: 14, staffCount: 1000 },
]

const userData = [
  { firstname: 'Jean-Pierre', lastname: 'Lukusa', email: 'admin@dhayaro.cd', role: R.ADMIN, facilityIndex: 0 },
  { firstname: 'Amira', lastname: 'Benali', email: 'superadmin@dhayaro.cd', role: R.SUPER_ADMIN, facilityIndex: 0 },
  { firstname: 'Yasmine', lastname: 'Hadj', email: 'reception@dhayaro.cd', role: R.RECEPTIONIST, facilityIndex: 0 },
  { firstname: 'Patrice', lastname: 'Kabongo', email: 'dr.kabongo@dhayaro.cd', role: R.DOCTOR, facilityIndex: 0 },
  { firstname: 'Karim', lastname: 'Meziane', email: 'dr.karim@dhayaro.cd', role: R.DOCTOR, facilityIndex: 0 },
  { firstname: 'Nadia', lastname: 'Brahimi', email: 'dr.nadia@dhayaro.cd', role: R.SPECIALIST, facilityIndex: 1 },
  { firstname: 'Sofiane', lastname: 'Benmoussa', email: 'dr.sofiane@dhayaro.cd', role: R.DOCTOR, facilityIndex: 1 },
  { firstname: 'Lina', lastname: 'Khelifi', email: 'dr.lina@dhayaro.cd', role: R.SPECIALIST, facilityIndex: 2 },
  { firstname: 'Rachid', lastname: 'Touati', email: 'lab.rachid@dhayaro.cd', role: R.LABORATORY, facilityIndex: 6 },
  { firstname: 'Fatima', lastname: 'Zerhouni', email: 'pharm.fatima@dhayaro.cd', role: R.PHARMACIST, facilityIndex: 7 },
  { firstname: 'Mohamed', lastname: 'Bensaid', email: 'nurse.mohamed@dhayaro.cd', role: R.NURSE, facilityIndex: 0 },
  { firstname: 'Amina', lastname: 'Djelloul', email: 'nurse.amina@dhayaro.cd', role: R.NURSE, facilityIndex: 1 },
  { firstname: 'Youcef', lastname: 'Maâmar', email: 'compta.youcef@dhayaro.cd', role: R.ACCOUNTANT, facilityIndex: 0 },
  { firstname: 'Samira', lastname: 'Aït-Ahmed', email: 'archive.samira@dhayaro.cd', role: R.ARCHIVIST, facilityIndex: 0 },
  { firstname: 'Omar', lastname: 'Saidi', email: 'dr.omar@dhayaro.cd', role: R.DOCTOR, facilityIndex: 3 },
  { firstname: 'Salima', lastname: 'Ferhat', email: 'dr.salima@dhayaro.cd', role: R.DOCTOR, facilityIndex: 4 },
  { firstname: 'Amar', lastname: 'Taleb', email: 'dr.amar@dhayaro.cd', role: R.DOCTOR, facilityIndex: 5 },
  { firstname: 'Naima',lastname: 'Bouzid', email: 'dr.naima@dhayaro.cd', role: R.SPECIALIST, facilityIndex: 8 },
  { firstname: 'Hassan', lastname: 'Charef', email: 'dr.hassan@dhayaro.cd', role: R.DOCTOR, facilityIndex: 9 },
]

const firstNamesM = ['Mohamed','Ahmed','Youssef','Omar','Ali','Karim','Rachid','Sofiane','Amar','Hassan','Youcef','Nabil','Samir','Farid','Tarek','Redouane','Said','Anis','Djamel','Bilal']
const firstNamesF = ['Fatima','Amina','Nadia','Lina','Salima','Naima','Samira','Lydia','Dalila','Zohra','Meriem','Asma','Houda','Radia','Sabrina','Lamia','Nacera','Sara','Aicha','Malika']
const lastNames = ['Benali','Meziane','Brahimi','Hadj','Khelifi','Bensaid','Ferhat','Taleb','Saidi','Charef','Bouzid','Djelloul','Maâmar','Aït-Ahmed','Touati','Benmoussa','Zerhouni','Bouzid','Guerfi','Slimani','Bouchama','Hamidi','Rahal','Mansouri','Benkhaled']
const bloodGroups = ['A+','A-','B+','B-','AB+','AB-','O+','O+','O+','O-'] as const
const communes = ['Alger Centre','Bab Ezzouar','Hussein Dey','El Biar','Bouzareah','Kouba','Draria','Birtouta','Zeralda','Cheraga','Oran','Tizi-Ouzou','Annaba','Constantine']
const streets = ['Rue Didouche Mourad','Boulevard Krim Belkacem','Avenue de la République','Rue Larbi Ben M\'hidi','Avenue Houari Boumediene','Rue Abane Ramdane','Boulevard Che Guevara','Rue des Martyrs','Avenue Ahmed Bey','Place du 1er Novembre']
const allergies = ['Pénicilline','Aspirine','Iode','Latex','AINS','Morphine','Sulfamides','Pollens','Crustacés','Arachides','Null']

const clinicalTemplates = [
  { motif: 'Fièvre élevée persistante', symptoms: ['Fièvre 39.5°C','Frissons','Sueurs','Céphalées'], diag: 'Infection aiguë - Fièvre d\'origine inconnue', treatment: 'Amoxicilline 1g 3x/j + Paracétamol 1g', notes: 'Prescription paludisme à vérifier' },
  { motif: 'Douleur thoracique', symptoms: ['Douleur rétrosternale','Dyspnée','Palpitations'], diag: 'Syndrome coronarien aigu - Suspicion', treatment: 'Aspirine 250mg + Nitroglycérine SL + ECG urgent', notes: 'URGENCE - ECG et troponines immédiats' },
  { motif: 'Diabète type 2 - Contrôle', symptoms: ['Polyurie','Polydipsie','Fatigue'], diag: 'Diabète type 2 - HbA1c 9.5%', treatment: 'Metformine 1000mg 2x/j + Gliclazide 80mg', notes: 'Contrôle HbA1c dans 3 mois' },
  { motif: 'Hypertension artérielle', symptoms: ['Céphalées occipitales','Vertiges','Épistaxis'], diag: 'HTA sévère - Risque CV élevé', treatment: 'Amlodipine 10mg + Lisinopril 20mg', notes: 'Régime hyposodé prescrit' },
  { motif: 'Asthme bronchique', symptoms: ['Dyspnée paroxystique','Sifflements','Toux nocturne'], diag: 'Asthme allergique persistant', treatment: 'Beclométasone 400mcg/j + Salbutamol PRN', notes: 'Éviction allergènes recommandée' },
  { motif: 'Douleur abdominale aiguë', symptoms: ['Douleur FID','Fièvre 38.5°C','Nausées'], diag: 'Appendicite aiguë - Alvarado 8', treatment: 'Appendicoscopie sous coelioscopie', notes: 'Chirurgie urgente programmée' },
  { motif: 'Infection urinaire', symptoms: ['Dysurie','Pollakiurie','Brûlures mictionnelles'], diag: 'Cystite aiguë - E.coli', treatment: 'Fosfomycine 3g dose unique', notes: 'Uroculture avant traitement' },
  { motif: 'Pneumonie communautaire', symptoms: ['Fièvre 39.8°C','Toux productive','Dyspnée'], diag: 'Pneumonie lobaire droite - CRB-65: 1', treatment: 'Amoxicilline 1g 3x/j + Azithromycine', notes: 'Radiographie thoracique à contrôler' },
  { motif: 'Anémie ferriprive', symptoms: ['Fatigue extrême','Pâleur','Dyspnée d\'effort'], diag: 'Anémie ferriprive sévère - Hb 6.5g/dL', treatment: 'Venofer 200mg IV x5 + Fer oral', notes: 'Recherche cause de saignement' },
  { motif: 'Insuffisance cardiaque', symptoms: ['Dyspnée de repos','Orthopnée','Œdèmes MI'], diag: 'ICFE NYHA III - FEVG 30%', treatment: 'Furosémide IV + Ramipril + Carvedilol', notes: 'Surveillance poids quotidienne' },
  { motif: 'Gastropathie', symptoms: ['Douleur épigastrique','Brûlures','Ballonnements'], diag: 'Gastrite antrale - Hp positif', treatment: 'IPP + Amoxicilline 1g + Clarithromycine 500mg (14j)', notes: 'Test urea breath test contrôle après 4 semaines' },
  { motif: 'Colique néphrétique', symptoms: ['Douleur lombaire fulgurante','Nausées','Hématurie'], diag: 'Lithiase rénale droite 8mm', treatment: 'Métamizole 2g IV + Tamsulosine', notes: 'Scanner abdomen sans injection' },
  { motif: 'Dépression', symptoms: ['Tristesse persistante','Anhédonie','Insomnie'], diag: 'Trouble dépressif sévère - PHQ-9: 18', treatment: 'Sertraline 50mg/j + TCC', notes: 'Suivi psychiatriqueprogrammé' },
  { motif: 'Arthrose du genou', symptoms: ['Douleur mécanique','Raideur matinale'], diag: 'Gonarthrose bilatérale stade 2-3', treatment: 'Paracétamol + AINS topique + Kiné', notes: 'Perte de poids recommandée' },
  { motif: 'Urticaire', symptoms: ['Plaques urticariennes prurigineuses'], diag: 'Urticaire chronique spontanée', treatment: 'Cétirizine 20mg/j + Omalizumab si échec', notes: 'Éviction facteurs déclenchants' },
]

const diseaseData = [
  { code: 'A09', name: 'Gastro-entérite infectieuse', category: 'Maladies infectieuses', symptoms: ['Diarrhée','Vomissements','Fièvre'], complications: ['Déshydratation'], treatments: ['Réhydratation orale','Antispasmodiques'] },
  { code: 'B54', name: 'Paludisme non précisé', category: 'Maladies infectieuses', symptoms: ['Fièvre','Frissons','Sueurs'], complications: ['Paludisme cérébral','Anémie sévère'], treatments: ['Arthéméther-Luméfantrine','Artésunate IV'] },
  { code: 'E11', name: 'Diabète de type 2', category: 'Maladies endocriniennes', symptoms: ['Polyurie','Polydipsie','Amaigrissement'], complications: ['Rétinopathie','Néphropathie','Neuropathie'], treatments: ['Metformine','Insuline'] },
  { code: 'I10', name: 'Hypertension artérielle essentielle', category: 'Maladies cardiovasculaires', symptoms: ['Céphalées','Vertiges'], complications: ['AVC','IDC','Insuffisance rénale'], treatments: ['IEC','ARA-II','Calcio-antagonistes'] },
  { code: 'J18', name: 'Pneumonie', category: 'Maladies respiratoires', symptoms: ['Fièvre','Toux productive','Dyspnée'], complications: ['Empyème','Septicémie'], treatments: ['Antibiothérapie','Oxygénothérapie'] },
  { code: 'J44', name: 'MPOC', category: 'Maladies respiratoires', symptoms: ['Dyspnée','Toux productive'], complications: ['Exacerbation aiguë','Insuffisance respiratoire'], treatments: ['Bronchodilatateurs','Corticoïdes inhalés'] },
  { code: 'K29', name: 'Gastrite', category: 'Maladies digestives', symptoms: ['Douleur épigastrique','Nausées'], complications: ['Ulcère gastrique','Hémorragie digestive'], treatments: ['IPP','Eradication H.pylori'] },
  { code: 'M17', name: 'Gonarthrose', category: 'Maladies ostéo-articulaires', symptoms: ['Douleur mécanique','Raideur'], complications: ['Handicap','Douleur chronique'], treatments: ['Antalgiques','Kinésithérapie','Chirurgie'] },
  { code: 'N39', name: 'Infection urinaire', category: 'Maladies urologiques', symptoms: ['Dysurie','Pollakiurie'], complications: ['Pyélonéphrite','Sepsis'], treatments: ['Antibiothérapie'] },
  { code: 'F32', name: 'Trouble dépressif majeur', category: 'Maladies psychiatriques', symptoms: ['Tristesse','Anhédonie','Insomnie'], complications: ['Suicide','Désociation sociale'], treatments: ['ISRS','Psychothérapie'] },
]

async function seed() {
  console.log('Seeding Dhayaro database...')

  const db = getDb()
  await db.delete(auditLogs)
  await db.delete(notifications)
  await db.delete(documents)
  await db.delete(queue)
  await db.delete(labExams)
  await db.delete(prescriptions)
  await db.delete(medications)
  await db.delete(treatments)
  await db.delete(diagnostics)
  await db.delete(consultations)
  await db.delete(patients)
  await db.delete(users)
  await db.delete(diseases)
  await db.delete(labCategories)
  await db.delete(facilities)
  console.log('  Cleaned existing data')

  const insertedFacilities = await db.insert(facilities).values(facilityData.map((f) => ({
    ...f, id: crypto.randomUUID(), isActive: true, createdAt: daysAgo(180), updatedAt: new Date(),
  }))).returning({ id: facilities.id })
  console.log(`  ${insertedFacilities.length} facilities`)

  const passwordHash = await hashPassword('admin123')
  const doctorHash = await hashPassword('doctor123')
  const nurseHash = await hashPassword('nurse123')
  const otherHash = await hashPassword('dhayaro123')
  const hashByRole: Record<string, string> = { SUPER_ADMIN: passwordHash, ADMIN: passwordHash, RECEPTIONIST: otherHash, DOCTOR: doctorHash, SPECIALIST: doctorHash, LABORATORY: otherHash, PHARMACIST: otherHash, NURSE: nurseHash, ACCOUNTANT: otherHash, ARCHIVIST: otherHash }

  const insertedUsers = await db.insert(users).values(
    userData.map((u, i) => ({
      id: crypto.randomUUID(), firstname: u.firstname, lastname: u.lastname, email: u.email,
      passwordHash: hashByRole[u.role], role: u.role, facilityId: insertedFacilities[u.facilityIndex].id,
      isActive: true, createdAt: daysAgo(180 - i), updatedAt: new Date(),
    }))
  ).returning({ id: users.id })
  console.log(`  ${insertedUsers.length} users`)

  const insertedDiseases = await db.insert(diseases).values(
    diseaseData.map((d) => ({
      id: crypto.randomUUID(), ...d, complications: d.complications, treatments: d.treatments,
      isActive: true, createdAt: daysAgo(180), updatedAt: new Date(),
    }))
  ).returning({ id: diseases.id })
  console.log(`  ${insertedDiseases.length} diseases`)

  const patientData: Array<{ facilityIndex: number; firstname: string; lastname: string; sex: 'M' | 'F'; age: number; bloodGroup: typeof bloodGroups[number]; phone: string; address: string; dateOfBirth: string; allergies: string[] }> = []
  for (let i = 0; i < 80; i++) {
    const sex = Math.random() > 0.48 ? 'M' as const : 'F' as const
    const age = 2 + Math.floor(Math.random() * 85)
    const birthYear = 2026 - age
    const allg = pick(allergies)
    patientData.push({
      facilityIndex: Math.floor(Math.random() * 10),
      firstname: sex === 'M' ? pick(firstNamesM) : pick(firstNamesF),
      lastname: pick(lastNames), sex, age, bloodGroup: pick(bloodGroups),
      phone: `+213 ${550 + Math.floor(Math.random() * 40)} ${String(1000 + i).padStart(4, '0')}`,
      address: `${pick(streets)}, ${pick(communes)}`,
      dateOfBirth: `${birthYear}-${String(1 + Math.floor(Math.random() * 12)).padStart(2, '0')}-${String(1 + Math.floor(Math.random() * 28)).padStart(2, '0')}`,
      allergies: allg === 'Null' ? [] : [allg],
    })
  }

  const insertedPatients = await db.insert(patients).values(
    patientData.map((p, i) => ({
      id: crypto.randomUUID(), patientUuid: crypto.randomUUID(), facilityId: insertedFacilities[p.facilityIndex].id,
      firstname: p.firstname, lastname: p.lastname, sex: p.sex, dateOfBirth: p.dateOfBirth, age: p.age,
      bloodGroup: p.bloodGroup, phone: p.phone, address: p.address,
      email: `${p.firstname.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')}.${p.lastname.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')}@email.dz`,
      allergies: p.allergies, antecedents: [], medicalHistoryJson: {}, isActive: true, isArchived: false,
      createdAt: daysAgo(180 - i), updatedAt: new Date(),
    }))
  ).returning({ id: patients.id })
  console.log(`  ${insertedPatients.length} patients`)

  const doctorIndices = [3, 4, 5, 6, 7, 14, 15, 16, 17, 18]
  const consultationData = Array.from({ length: 120 }, (_, i) => {
    const template = pick(clinicalTemplates)
    const pi = Math.floor(Math.random() * insertedPatients.length)
    const di = pick(doctorIndices)
    return {
      id: crypto.randomUUID(),
      facilityId: pick(insertedFacilities).id,
      patientId: insertedPatients[pi].id,
      doctorId: insertedUsers[di].id,
      consultationNumber: `CONS-${String(i + 1).padStart(4, '0')}`,
      motif: template.motif,
      symptoms: template.symptoms,
      vitalSigns: { temperature: 36.5 + Math.random() * 4, heartRate: 60 + Math.floor(Math.random() * 40), bloodPressure: `${110 + Math.floor(Math.random() * 60)}/${70 + Math.floor(Math.random() * 30)}` },
      notes: template.notes,
      provisionalDiagnosis: template.diag,
      status: pick(['WAITING', 'IN_PROGRESS', 'COMPLETED'] as const),
      createdAt: daysAgo(Math.floor(Math.random() * 120)),
      updatedAt: new Date(),
    }
  })
  const insertedConsultations = await db.insert(consultations).values(consultationData).returning({ id: consultations.id })
  console.log(`  ${insertedConsultations.length} consultations`)

  const diagnosticsData = Array.from({ length: 60 }, () => ({
    id: crypto.randomUUID(),
    consultationId: pick(insertedConsultations).id,
    patientId: pick(insertedPatients).id,
    doctorId: insertedUsers[pick(doctorIndices)].id,
    diseaseId: pick(insertedDiseases).id,
    diagnosticType: pick(['PROVISIONAL', 'FINAL'] as const),
    description: pick(clinicalTemplates).diag,
    isValidated: Math.random() > 0.4,
    createdAt: daysAgo(Math.floor(Math.random() * 120)),
    updatedAt: new Date(),
  }))
  await db.insert(diagnostics).values(diagnosticsData)
  console.log('  60 diagnostics')

  const medData = [
    { name: 'Amoxicilline', genericName: 'Amoxicilline', category: 'Antibiotique', form: 'Gélule', dosage: '500mg' },
    { name: 'Paracétamol', genericName: 'Paracétamol', category: 'Antalgique', form: 'Comprimé', dosage: '1000mg' },
    { name: 'Metformine', genericName: 'Metformine', category: 'Antidiabétique', form: 'Comprimé', dosage: '850mg' },
    { name: 'Amlodipine', genericName: 'Amlodipine', category: 'Antihypertenseur', form: 'Comprimé', dosage: '5mg' },
    { name: 'Ibuprofène', genericName: 'Ibuprofène', category: 'AINS', form: 'Comprimé', dosage: '400mg' },
    { name: 'Omeprazole', genericName: 'Omeprazole', category: 'IPP', form: 'Gélule', dosage: '20mg' },
    { name: 'Salbutamol', genericName: 'Salbutamol', category: 'Bronchodilatateur', form: 'Spray', dosage: '100mcg' },
    { name: 'Sertraline', genericName: 'Sertraline', category: 'ISRS', form: 'Comprimé', dosage: '50mg' },
    { name: 'Furosémide', genericName: 'Furosémide', category: 'Diurétique', form: 'Comprimé', dosage: '40mg' },
    { name: 'Ciprofloxacine', genericName: 'Ciprofloxacine', category: 'Antibiotique', form: 'Comprimé', dosage: '500mg' },
  ]

  const insertedMeds = await db.insert(medications).values(
    medData.map(m => ({ id: crypto.randomUUID(), ...m, sideEffects: [], contraindications: [], isActive: true, createdAt: daysAgo(180) }))
  ).returning({ id: medications.id })
  console.log(`  ${insertedMeds.length} medications`)

  const treatmentsData = Array.from({ length: 50 }, () => ({
    id: crypto.randomUUID(),
    patientId: pick(insertedPatients).id,
    doctorId: insertedUsers[pick(doctorIndices)].id,
    description: pick(clinicalTemplates).treatment,
    status: pick(['PRESCRIBED', 'IN_PROGRESS', 'COMPLETED'] as const),
    startDate: daysAgo(Math.floor(Math.random() * 90)).toISOString().split('T')[0],
    createdAt: daysAgo(Math.floor(Math.random() * 90)),
    updatedAt: new Date(),
  }))
  const insertedTreatments = await db.insert(treatments).values(treatmentsData).returning({ id: treatments.id })
  console.log(`  ${insertedTreatments.length} treatments`)

  const prescriptionsData = insertedTreatments.slice(0, 40).flatMap(t => {
    const med = pick(insertedMeds)
    return [{
      id: crypto.randomUUID(),
      treatmentId: t.id,
      medicationId: med.id,
      dosage: pick(['1 comprim\u00e9 2x/j', '1 comprim\u00e9 3x/j', '2 comprim\u00e9s 1x/j', '1 g\u00e9lule le soir']),
      frequency: pick(['Matin et soir', '3 fois par jour', 'Le matin', 'Selon besoin']),
      duration: pick(['7 jours', '14 jours', '1 mois', '3 mois', '6 mois']),
      quantity: 10 + Math.floor(Math.random() * 50),
      createdAt: daysAgo(Math.floor(Math.random() * 90)),
    }]
  })
  await db.insert(prescriptions).values(prescriptionsData)
  console.log('  40 prescriptions')

  const labCatData = [
    { name: 'Biologie générale', description: 'NFS, glycémie, créatinine, bilan hépatique' },
    { name: 'Radiologie', description: 'Radiographie, scanner' },
    { name: 'Cardiologie', description: 'ECG, échocardiographie' },
    { name: 'Microbiologie', description: 'ECBU, hémoculture, prélèvements' },
    { name: 'Anatomopathologie', description: 'Biopsies, cytologie' },
  ]
  const insertedLabCats = await db.insert(labCategories).values(
    labCatData.map(c => ({ id: crypto.randomUUID(), ...c, isActive: true, createdAt: daysAgo(180) }))
  ).returning({ id: labCategories.id })
  console.log(`  ${insertedLabCats.length} lab categories`)

  const labExamData = Array.from({ length: 40 }, () => ({
    id: crypto.randomUUID(),
    patientId: pick(insertedPatients).id,
    doctorId: insertedUsers[pick(doctorIndices)].id,
    labTechnicianId: insertedUsers[8].id,
    categoryId: pick(insertedLabCats).id,
    examName: pick(['NFS', 'Glycemie a jeun', 'Creatinine', 'Bilan hepatique', 'ECBU', 'Radiographie thoracique', 'ECG', 'Scanner abdominal'] as const),
    clinicalIndication: 'Bilan pre-operatoire',
    status: pick(['REQUESTED', 'IN_PROGRESS', 'COMPLETED'] as const),
    results: Math.random() > 0.5 ? { value: 'Normal', reference: 'Negatif' } : {},
    requestedAt: daysAgo(Math.floor(Math.random() * 90)),
    createdAt: daysAgo(Math.floor(Math.random() * 90)),
    updatedAt: new Date(),
  }))
  await db.insert(labExams).values(labExamData)
  console.log('  40 lab exams')

  const auditActions = ['LOGIN', 'CREATE', 'UPDATE', 'VIEW'] as const
  const auditResources = ['auth', 'consultation', 'patient', 'diagnostic', 'treatment', 'lab_exam'] as const
  const auditEntries: Array<{
    id: string; userId: string; facilityId: string; action: string; resource: string;
    resourceId: string; details: Record<string, unknown>; ipAddress: string; timestamp: Date
  }> = []
  for (let i = 0; i < 80; i++) {
    auditEntries.push({
      id: crypto.randomUUID(), userId: pick(insertedUsers).id,
      facilityId: pick(insertedFacilities).id,
      action: pick([...auditActions]), resource: pick([...auditResources]),
      resourceId: pick(insertedPatients).id, details: {},
      ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
      timestamp: daysAgo(Math.floor(Math.random() * 180)),
    })
  }
  await db.insert(auditLogs).values(auditEntries)
  console.log(`  ${auditEntries.length} audit logs`)

  console.log('\nSeed completed!')
  console.log(`  Facilities: ${insertedFacilities.length}`)
  console.log(`  Users: ${insertedUsers.length}`)
  console.log(`  Patients: ${insertedPatients.length}`)
  console.log(`  Diseases: ${insertedDiseases.length}`)
  console.log(`  Consultations: ${insertedConsultations.length}`)
  console.log(`  Medications: ${insertedMeds.length}`)
  console.log(`  Treatments: ${insertedTreatments.length}`)
  console.log(`  Lab Categories: ${insertedLabCats.length}`)
  console.log(`  Audit Logs: ${auditEntries.length}`)
}

seed().catch((e) => {
  console.error('Seed failed:', e)
  process.exit(1)
})
