import { getDb } from './db'
import { facilities, users, patients, clinicalCases, auditLogs } from './schema'
import { hashPassword } from './auth'

async function seed() {
  console.log('Seeding database...')

  const facilityData = [
    { name: 'CHU Mustapha', code: 'CHU-MSP-001', facilityType: 'HOSPITAL' as const, address: 'Rue Mustapha Bey', city: 'Alger', phone: '021 54 22 00', email: 'contact@chumustapha.dz', bedCount: 2000, departmentCount: 45, staffCount: 5200 },
    { name: 'Hopital Bab El Oued', code: 'HOP-BEO-002', facilityType: 'HOSPITAL' as const, address: 'Rue de la Liberte', city: 'Alger', phone: '021 84 50 00', email: 'info@hopital-bab-el-oued.dz', bedCount: 800, departmentCount: 20, staffCount: 1800 },
    { name: 'Clinique El Fath', code: 'CLN-ELF-003', facilityType: 'CLINIC' as const, address: 'Boulevard Colonel Bougara', city: 'Alger', phone: '021 91 30 00', email: 'accueil@clinique-elfath.dz', bedCount: 150, departmentCount: 8, staffCount: 350 },
    { name: 'Hopital Parnet', code: 'HOP-PRN-004', facilityType: 'HOSPITAL' as const, address: 'Route de Tipaza', city: 'Cheraga', phone: '021 48 20 00', email: 'administration@hopital-parnet.dz', bedCount: 600, departmentCount: 18, staffCount: 1200 },
    { name: 'Centre Medical Hydra', code: 'CTR-HYD-005', facilityType: 'LABORATORY' as const, address: 'Rue des Freres Abbas', city: 'Hydra', phone: '021 60 10 00', email: 'labo@centre-hydra.dz', bedCount: 0, departmentCount: 5, staffCount: 80 },
  ]

  const insertedFacilities = await getDb().insert(facilities).values(facilityData).returning({ id: facilities.id })
  console.log(`Inserted ${insertedFacilities.length} facilities`)

  const passwordHash = await hashPassword('admin123')
  const doctorHash = await hashPassword('doctor123')
  const researcherHash = await hashPassword('researcher123')

  const userData = [
    { firstname: 'Amira', lastname: 'Benali', email: 'admin@medinsight.dz', passwordHash, role: 'ADMIN' as const, facilityId: insertedFacilities[0].id },
    { firstname: 'Youcef', lastname: 'Khelifi', email: 'admin2@medinsight.dz', passwordHash, role: 'ADMIN' as const, facilityId: insertedFacilities[0].id },
    { firstname: 'Karim', lastname: 'Benali', email: 'dr.benali@medinsight.dz', passwordHash: doctorHash, role: 'DOCTOR' as const, facilityId: insertedFacilities[0].id },
    { firstname: 'Fatima', lastname: 'Zahra', email: 'dr.fatima@medinsight.dz', passwordHash: doctorHash, role: 'DOCTOR' as const, facilityId: insertedFacilities[0].id },
    { firstname: 'Omar', lastname: 'Bouzid', email: 'dr.omar@medinsight.dz', passwordHash: doctorHash, role: 'DOCTOR' as const, facilityId: insertedFacilities[1].id },
    { firstname: 'Amina',lastname: 'Mansouri', email: 'dr.amina@medinsight.dz', passwordHash: doctorHash, role: 'DOCTOR' as const, facilityId: insertedFacilities[1].id },
    { firstname: 'Samir', lastname: 'Hadj', email: 'dr.samir@medinsight.dz', passwordHash: doctorHash, role: 'DOCTOR' as const, facilityId: insertedFacilities[2].id },
    { firstname: 'Lina', lastname: 'Cherif', email: 'dr.lina@medinsight.dz', passwordHash: doctorHash, role: 'DOCTOR' as const, facilityId: insertedFacilities[3].id },
    { firstname: 'Yacine', lastname: 'Khelifi', email: 'researcher@medinsight.dz', passwordHash: researcherHash, role: 'RESEARCHER' as const, facilityId: insertedFacilities[0].id },
    { firstname: 'Nadia', lastname: 'Bouazza', email: 'nadia@medinsight.dz', passwordHash: researcherHash, role: 'RESEARCHER' as const, facilityId: insertedFacilities[4].id },
  ]

  const insertedUsers = await getDb().insert(users).values(userData).returning({ id: users.id })
  console.log(`Inserted ${insertedUsers.length} users`)

  const patientData = [
    { facilityId: insertedFacilities[0].id, patientUuid: 'PAT-001', firstname: 'Mohamed', lastname: 'Amrani', sex: 'M', age: 45, bloodGroup: 'A+', phone: '0555 01 02 03', email: 'mohamed.amrani@email.com', address: 'Alger Centre', dateOfBirth: '1980-03-15', allergies: ['Penicilline'] },
    { facilityId: insertedFacilities[0].id, patientUuid: 'PAT-002', firstname: 'Aicha', lastname: 'Boumediene', sex: 'F', age: 32, bloodGroup: 'O+', phone: '0555 04 05 06', address: 'Bab El Oued', dateOfBirth: '1993-07-22', allergies: [] },
    { facilityId: insertedFacilities[0].id, patientUuid: 'PAT-003', firstname: 'Rachid', lastname: 'Taleb', sex: 'M', age: 58, bloodGroup: 'B-', phone: '0555 07 08 09', address: 'Hussein Dey', dateOfBirth: '1967-11-08', allergies: ['Aspirine', 'Iode'] },
    { facilityId: insertedFacilities[1].id, patientUuid: 'PAT-004', firstname: 'Naima', lastname: 'Saadi', sex: 'F', age: 41, bloodGroup: 'AB+', phone: '0555 10 11 12', address: 'Kouba', dateOfBirth: '1984-01-30', allergies: ['Latex'] },
    { facilityId: insertedFacilities[1].id, patientUuid: 'PAT-005', firstname: 'Djamel', lastname: 'Benaissa', sex: 'M', age: 67, bloodGroup: 'O-', phone: '0555 13 14 15', address: 'El Biar', dateOfBirth: '1958-05-12', allergies: [] },
    { facilityId: insertedFacilities[0].id, patientUuid: 'PAT-006', firstname: 'Sabrina', lastname: 'Ouali', sex: 'F', age: 29, bloodGroup: 'A-', phone: '0555 16 17 18', address: 'Birkhadem', dateOfBirth: '1996-09-03', allergies: ['Pollens'] },
    { facilityId: insertedFacilities[2].id, patientUuid: 'PAT-007', firstname: 'Khaled', lastname: 'Meziane', sex: 'M', age: 53, bloodGroup: 'B+', phone: '0555 19 20 21', address: 'Draria', dateOfBirth: '1972-12-18', allergies: ['AINS'] },
    { facilityId: insertedFacilities[0].id, patientUuid: 'PAT-008', firstname: 'Yasmine', lastname: 'Derriche', sex: 'F', age: 38, bloodGroup: 'O+', phone: '0555 22 23 24', address: 'Bouzareah', dateOfBirth: '1987-04-25', allergies: [] },
    { facilityId: insertedFacilities[3].id, patientUuid: 'PAT-009', firstname: 'Abdelkader', lastname: 'Brahimi', sex: 'M', age: 72, bloodGroup: 'A+', phone: '0555 25 26 27', address: 'Cheraga', dateOfBirth: '1953-08-07', allergies: ['Morphine'] },
    { facilityId: insertedFacilities[0].id, patientUuid: 'PAT-010', firstname: 'Malika', lastname: 'Guerfi', sex: 'F', age: 44, bloodGroup: 'AB-', phone: '0555 28 29 30', address: 'Bainem', dateOfBirth: '1981-06-14', allergies: [] },
    { facilityId: insertedFacilities[1].id, patientUuid: 'PAT-011', firstname: 'Farid', lastname: 'Zeroual', sex: 'M', age: 35, bloodGroup: 'O+', phone: '0555 31 32 33', address: 'Reghaia', dateOfBirth: '1990-02-20', allergies: ['Shellfish'] },
    { facilityId: insertedFacilities[0].id, patientUuid: 'PAT-012', firstname: 'Hanane', lastname: 'Boukrouma', sex: 'F', age: 50, bloodGroup: 'B+', phone: '0555 34 35 36', address: 'Dely Ibrahim', dateOfBirth: '1975-10-11', allergies: [] },
    { facilityId: insertedFacilities[2].id, patientUuid: 'PAT-013', firstname: 'Sofiane', lastname: 'Ait Ali', sex: 'M', age: 27, bloodGroup: 'A-', phone: '0555 37 38 39', address: 'Tipaza', dateOfBirth: '1998-01-05', allergies: [] },
    { facilityId: insertedFacilities[0].id, patientUuid: 'PAT-014', firstname: 'Radia', lastname: 'Benchikha', sex: 'F', age: 61, bloodGroup: 'O-', phone: '0555 40 41 42', address: 'Oran', dateOfBirth: '1964-07-28', allergies: ['Penicilline', 'Sulfamides'] },
    { facilityId: insertedFacilities[3].id, patientUuid: 'PAT-015', firstname: 'Tarek', lastname: 'Ferhat', sex: 'M', age: 48, bloodGroup: 'B-', phone: '0555 43 44 45', address: 'Constantine', dateOfBirth: '1977-03-09', allergies: [] },
  ]

  const insertedPatients = await getDb().insert(patients).values(patientData).returning({ id: patients.id })
  console.log(`Inserted ${insertedPatients.length} patients`)

  const caseData = [
    { facilityId: insertedFacilities[0].id, patientId: insertedPatients[0].id, doctorId: insertedUsers[2].id, title: 'Migraine chronique', description: 'Migraine avec aura depuis 3 ans', symptomsJson: { description: 'Cephalee pulsatile, nausées, photosensibilité' }, provisionalDiagnosis: 'Migraine avec aura', treatment: 'Sumatriptan 50mg + prevention par propranolol', treatmentDuration: '3 mois', outcomeStatus: 'SUCCESS' as const, priority: 'medium', tagsJson: { tags: ['neurologie', 'douleur'] } },
    { facilityId: insertedFacilities[0].id, patientId: insertedPatients[1].id, doctorId: insertedUsers[3].id, title: 'Diabète type 2', description: 'Découvert lors d\'un bilan de santé', symptomsJson: { description: 'Polyurie, polydipsie, fatigue' }, provisionalDiagnosis: 'Diabète type 2', treatment: 'Metformine 1000mg/j + régime alimentaire', treatmentDuration: '6 mois', outcomeStatus: 'IN_PROGRESS' as const, priority: 'high', tagsJson: { tags: ['endocrinologie', 'chronique'] } },
    { facilityId: insertedFacilities[0].id, patientId: insertedPatients[2].id, doctorId: insertedUsers[2].id, title: 'Hypertension artérielle', description: 'HTA stade 2 découverte récemment', symptomsJson: { description: 'Maux de tête, vertiges, épistaxis' }, provisionalDiagnosis: 'Hypertension artérielle stade 2', treatment: 'Amlodipine 10mg + Lisinopril 20mg', treatmentDuration: 'Indéterminé', outcomeStatus: 'IN_PROGRESS' as const, priority: 'high', tagsJson: { tags: ['cardiologie', 'chronique'] } },
    { facilityId: insertedFacilities[1].id, patientId: insertedPatients[3].id, doctorId: insertedUsers[4].id, title: 'Asthme allergique', description: 'Asthme déclenché par les pollens', symptomsJson: { description: 'Dyspnée, sifflements, toux nocturne' }, provisionalDiagnosis: 'Asthme allergique persistant léger', treatment: 'Beclométasone 200mcg/j + Salbutamol PRN', treatmentDuration: 'Permanente', outcomeStatus: 'SUCCESS' as const, priority: 'medium', tagsJson: { tags: ['pneumologie', 'allergie'] } },
    { facilityId: insertedFacilities[0].id, patientId: insertedPatients[4].id, doctorId: insertedUsers[3].id, title: 'Insuffisance cardiaque', description: 'ICFE à fraction d\'éjection réduite', symptomsJson: { description: 'Essoufflement, orthopnée, œdèmes des membres inférieurs' }, provisionalDiagnosis: 'Insuffisance cardiaque NYHA III', treatment: 'Furosemide + Ramipril + Carvedilol', treatmentDuration: 'Longue durée', outcomeStatus: 'IN_PROGRESS' as const, priority: 'critical', tagsJson: { tags: ['cardiologie', 'urgence'] } },
    { facilityId: insertedFacilities[2].id, patientId: insertedPatients[5].id, doctorId: insertedUsers[6].id, title: 'Dermatite atopique', description: 'Eczéma chronique des plis', symptomsJson: { description: 'Prurit intense, érythème, desquamation' }, provisionalDiagnosis: 'Dermatite atopique modérée', treatment: 'Crème corticoïde + émollients + antihistaminiques', treatmentDuration: '2 mois', outcomeStatus: 'SUCCESS' as const, priority: 'low', tagsJson: { tags: ['dermatologie', 'allergie'] } },
    { facilityId: insertedFacilities[0].id, patientId: insertedPatients[6].id, doctorId: insertedUsers[2].id, title: 'Gastrite chronique', description: 'Douleurs gastriques récurrentes', symptomsJson: { description: 'Douleur épigastrique, brûlures, ballonnements' }, provisionalDiagnosis: 'Gastrite chronique - test Hp positif', treatment: 'IPP + amoxicilline + clarithromycine (traitement Hp)', treatmentDuration: '2 semaines', outcomeStatus: 'PENDING' as const, priority: 'medium', tagsJson: { tags: ['gastro', 'infection'] } },
    { facilityId: insertedFacilities[1].id, patientId: insertedPatients[7].id, doctorId: insertedUsers[4].id, title: 'Arthrose du genou', description: 'Gonarthrose bilatérale', symptomsJson: { description: 'Douleur mécanique, raideur matinale, craquements' }, provisionalDiagnosis: 'Arthrose bilatérale du genou stade 2', treatment: 'Paracétamol + kinésithérapie + infiltration hyaluronique', treatmentDuration: '6 mois', outcomeStatus: 'IN_PROGRESS' as const, priority: 'medium', tagsJson: { tags: ['rhumatologie', 'orthopédie'] } },
    { facilityId: insertedFacilities[3].id, patientId: insertedPatients[8].id, doctorId: insertedUsers[7].id, title: 'Polyarthrite rhumatoïde', description: 'PR séropositive récente', symptomsJson: { description: 'Raideur matinale >1h, douleurs articulaires symétriques, gonflements' }, provisionalDiagnosis: 'Polyarthrite rhumatoïde séropositive', treatment: 'Méthotrexate 15mg/semaine + acide folique', treatmentDuration: 'Longue durée', outcomeStatus: 'IN_PROGRESS' as const, priority: 'high', tagsJson: { tags: ['rhumatologie', 'auto-immune'] } },
    { facilityId: insertedFacilities[0].id, patientId: insertedPatients[9].id, doctorId: insertedUsers[3].id, title: 'Anémie ferriprive', description: 'Anémie microcytaire par carence en fer', symptomsJson: { description: 'Fatigue, pâleur, dyspnée d\'effort, ongles fragiles' }, provisionalDiagnosis: 'Anémie ferriprive sévère', treatment: 'Fer IV (Venofer) + complément oral', treatmentDuration: '3 mois', outcomeStatus: 'PENDING' as const, priority: 'high', tagsJson: { tags: ['hématologie', 'nutrition'] } },
    { facilityId: insertedFacilities[0].id, patientId: insertedPatients[0].id, doctorId: insertedUsers[2].id, title: 'Dépression modérée', description: 'Trouble dépressif récurrent', symptomsJson: { description: 'Tristesse persistante, anhédié, insomnie, perte d\'appétit' }, provisionalDiagnosis: 'Trouble dépressif majeur modéré', treatment: 'Sertraline 50mg + psychothérapie', treatmentDuration: '12 mois', outcomeStatus: 'PENDING' as const, priority: 'medium', tagsJson: { tags: ['psychiatrie', 'santé mentale'] } },
    { facilityId: insertedFacilities[2].id, patientId: insertedPatients[10].id, doctorId: insertedUsers[6].id, title: 'Calculs rénaux', description: 'Colique néphrétique aiguë', symptomsJson: { description: 'Douleur lombaire aiguë, hématurie, nausées' }, provisionalDiagnosis: 'Lithiase rénale oxalique', treatment: 'Hydratation + AINS + lithotripsie extracorporelle', treatmentDuration: '1 mois', outcomeStatus: 'SUCCESS' as const, priority: 'high', tagsJson: { tags: ['urologie', 'urgence'] } },
    { facilityId: insertedFacilities[1].id, patientId: insertedPatients[11].id, doctorId: insertedUsers[4].id, title: 'Hypothyroïdie', description: 'Hypothyroïdie subclinique', symptomsJson: { description: 'Fatigue, prise de poids, intolérance au froid, constipation' }, provisionalDiagnosis: 'Hypothyroïdie subclinique', treatment: 'Lévothyroxine 50mcg/j', treatmentDuration: 'Indéterminé', outcomeStatus: 'IN_PROGRESS' as const, priority: 'medium', tagsJson: { tags: ['endocrinologie'] } },
    { facilityId: insertedFacilities[0].id, patientId: insertedPatients[12].id, doctorId: insertedUsers[3].id, title: 'Appendicite aiguë', description: 'Appendicite non compliquée', symptomsJson: { description: 'Douleur fosse iliaque droite, fièvre, nausées' }, provisionalDiagnosis: 'Appendicite aiguë non compliquée', treatment: 'Appendicoscopie sous coelioscopie', treatmentDuration: '1 semaine', outcomeStatus: 'SUCCESS' as const, priority: 'critical', tagsJson: { tags: ['chirurgie', 'urgence'] } },
    { facilityId: insertedFacilities[3].id, patientId: insertedPatients[13].id, doctorId: insertedUsers[7].id, title: 'Cataracte sénile', description: 'Cataracte bilatérale', symptomsJson: { description: 'Baisse progressive de l\'acuité visuelle, éblouissement' }, provisionalDiagnosis: 'Cataracte sénile bilatérale', treatment: 'Chirurgie du cristallin + implants', treatmentDuration: '2 semaines', outcomeStatus: 'PENDING' as const, priority: 'medium', tagsJson: { tags: ['ophtalmologie', 'chirurgie'] } },
    { facilityId: insertedFacilities[0].id, patientId: insertedPatients[14].id, doctorId: insertedUsers[2].id, title: 'Infection urinaire', description: 'ITU basse récidivante', symptomsJson: { description: 'Dysurie, pollakiurie, brûlures mictionnelles' }, provisionalDiagnosis: 'Infection urinaire basse', treatment: 'Ciprofloxacine 500mg 3 jours', treatmentDuration: '3 jours', outcomeStatus: 'SUCCESS' as const, priority: 'low', tagsJson: { tags: ['infectiologie', 'urologie'] } },
    { facilityId: insertedFacilities[0].id, patientId: insertedPatients[1].id, doctorId: insertedUsers[3].id, title: 'Névralgie du trijumeau', description: 'Douleur faciale paroxystique', symptomsJson: { description: 'Douleur fulgurante du visage, déclenchée par mastication' }, provisionalDiagnosis: 'Névralgie du trijumeau type 1', treatment: 'Carbamazépine 200mg 2x/j', treatmentDuration: '6 mois', outcomeStatus: 'IN_PROGRESS' as const, priority: 'high', tagsJson: { tags: ['neurologie', 'douleur'] } },
    { facilityId: insertedFacilities[1].id, patientId: insertedPatients[3].id, doctorId: insertedUsers[5].id, title: 'MPOC stade II', description: 'Bronchopneumopathie chronique obstructive', symptomsJson: { description: 'Dyspnée d\'effort chronique, toux productive' }, provisionalDiagnosis: 'MPOC GOLD stade II', treatment: 'Tiotropium + salbutamol PRN + réhabilitation', treatmentDuration: 'Longue durée', outcomeStatus: 'IN_PROGRESS' as const, priority: 'high', tagsJson: { tags: ['pneumologie', 'chronique'] } },
    { facilityId: insertedFacilities[0].id, patientId: insertedPatients[4].id, doctorId: insertedUsers[2].id, title: 'Sténose lombaire', description: 'Canal lombaire étroit L4-L5', symptomsJson: { description: 'Claudication marche, douleurs lombaires irradiées' }, provisionalDiagnosis: 'Sténose du canal lombaire L4-L5', treatment: 'Kinésithérapie + infiltrations épidurales', treatmentDuration: '3 mois', outcomeStatus: 'PENDING' as const, priority: 'medium', tagsJson: { tags: ['orthopédie', 'neurochirurgie'] } },
  ]

  const insertedCases = await getDb().insert(clinicalCases).values(caseData).returning({ id: clinicalCases.id })
  console.log(`Inserted ${insertedCases.length} clinical cases`)

  await getDb().insert(auditLogs).values([
    { userId: insertedUsers[0].id, facilityId: insertedFacilities[0].id, action: 'LOGIN', resource: 'auth', resourceId: insertedUsers[0].id, details: { method: 'password' }, ipAddress: '192.168.1.1' },
    { userId: insertedUsers[2].id, facilityId: insertedFacilities[0].id, action: 'CREATE', resource: 'clinical_case', resourceId: insertedCases[0].id, details: { title: 'Migraine chronique' }, ipAddress: '192.168.1.10' },
    { userId: insertedUsers[3].id, facilityId: insertedFacilities[0].id, action: 'UPDATE', resource: 'clinical_case', resourceId: insertedCases[1].id, details: { field: 'outcome_status', old: 'PENDING', new: 'IN_PROGRESS' }, ipAddress: '192.168.1.15' },
    { userId: insertedUsers[0].id, facilityId: insertedFacilities[0].id, action: 'CREATE', resource: 'user', resourceId: insertedUsers[8].id, details: { name: 'Yacine Khelifi', role: 'RESEARCHER' }, ipAddress: '192.168.1.1' },
    { userId: insertedUsers[2].id, facilityId: insertedFacilities[0].id, action: 'VIEW', resource: 'patient', resourceId: insertedPatients[0].id, details: { name: 'Mohamed Amrani' }, ipAddress: '192.168.1.10' },
  ])
  console.log('Inserted audit logs')

  console.log('Seed completed successfully!')
}

seed().catch((e) => {
  console.error('Seed failed:', e)
  process.exit(1)
})
