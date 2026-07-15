import { getDb } from './db'
import { facilities, users, patients, clinicalCases, auditLogs } from './schema'
import { hashPassword } from './auth'

const F = {
  HOSPITAL: 'HOSPITAL' as const,
  CLINIC: 'CLINIC' as const,
  LABORATORY: 'LABORATORY' as const,
  PHARMACY: 'PHARMACY' as const,
}

const R = {
  ADMIN: 'ADMIN' as const,
  DOCTOR: 'DOCTOR' as const,
  NURSE: 'NURSE' as const,
  RESEARCHER: 'RESEARCHER' as const,
  VIEWER: 'VIEWER' as const,
}

const PENDING = 'PENDING' as const
const IN_PROGRESS = 'IN_PROGRESS' as const
const SUCCESS = 'SUCCESS' as const
const FAILURE = 'FAILURE' as const

const facilityData = [
  { name: 'Hôpital Général de Kinshasa', code: 'HGK-001', facilityType: F.HOSPITAL, address: 'Avenue de l\'Hôpital, Gombe', city: 'Kinshasa', phone: '+243 81 222 0001', email: 'info@hgr-kinshasa.cd', bedCount: 2000, departmentCount: 40, staffCount: 4500 },
  { name: 'Cliniques Universitaires de Kinshasa', code: 'CUK-002', facilityType: F.HOSPITAL, address: 'Boulevard du 30 Juin, Gombe', city: 'Kinshasa', phone: '+243 81 222 0002', email: 'contact@cukinshasa.cd', bedCount: 1200, departmentCount: 30, staffCount: 3200 },
  { name: 'Clinique Ngaliema', code: 'CLN-003', facilityType: F.CLINIC, address: 'Avenue Mombo, Ngaliema', city: 'Kinshasa', phone: '+243 81 222 0003', email: 'accueil@cliniquengaliema.cd', bedCount: 300, departmentCount: 12, staffCount: 600 },
  { name: 'Hôpital du Cinquantenaire', code: 'HDC-004', facilityType: F.HOSPITAL, address: 'Avenue du Cinquantenaire, Lingwala', city: 'Kinshasa', phone: '+243 81 222 0004', email: 'administration@hopital-cinquantenaire.cd', bedCount: 500, departmentCount: 15, staffCount: 1100 },
  { name: 'Hôpital Saint Joseph', code: 'HSJ-005', facilityType: F.HOSPITAL, address: 'Avenue Sendwe, Kinshasa', city: 'Kinshasa', phone: '+243 81 222 0005', email: 'info@hopital-saintjoseph.cd', bedCount: 400, departmentCount: 14, staffCount: 800 },
  { name: 'Centre Hospitalier Monkole', code: 'CHM-006', facilityType: F.HOSPITAL, address: 'Route de Monkole, Limete', city: 'Kinshasa', phone: '+243 81 222 0006', email: 'contact@ch-monkole.cd', bedCount: 350, departmentCount: 12, staffCount: 700 },
  { name: 'H.J. Hospitals Limete', code: 'HJH-007', facilityType: F.HOSPITAL, address: 'Avenue Kasavubu, Limete', city: 'Kinshasa', phone: '+243 81 222 0007', email: 'info@hjhospitals.cd', bedCount: 250, departmentCount: 10, staffCount: 500 },
  { name: 'CHU Renaissance', code: 'CHR-008', facilityType: F.HOSPITAL, address: 'Avenue Lumumba, Kalamu', city: 'Kinshasa', phone: '+243 81 222 0008', email: 'admin@chu-renaissance.cd', bedCount: 800, departmentCount: 22, staffCount: 2000 },
  { name: 'Hôpital Pédiatrique de Kalembe-Lembe', code: 'HPK-009', facilityType: F.HOSPITAL, address: 'Avenue Kalembe-Lembe, Bandalungwa', city: 'Kinshasa', phone: '+243 81 222 0009', email: 'info@hopital-kalembe.cd', bedCount: 400, departmentCount: 10, staffCount: 900 },
  { name: 'Hôpital Général de Référence de Kintambo', code: 'HGRK-010', facilityType: F.HOSPITAL, address: 'Boulevard Kasa-Vubu, Kintambo', city: 'Kinshasa', phone: '+243 81 222 0010', email: 'contact@hgr-kintambo.cd', bedCount: 350, departmentCount: 12, staffCount: 750 },
]

const userData = [
  { firstname: 'Jean-Pierre', lastname: 'Lukusa', email: 'admin@medinsight.cd', role: R.ADMIN, facilityIndex: 0 },
  { firstname: 'Marie', lastname: 'Mbuyi', email: 'admin2@medinsight.cd', role: R.ADMIN, facilityIndex: 0 },
  { firstname: 'Patrice', lastname: 'Kabongo', email: 'dr.kabongo@medinsight.cd', role: R.DOCTOR, facilityIndex: 0 },
  { firstname: 'Grâce', lastname: 'Tshimanga', email: 'dr.grace@medinsight.cd', role: R.DOCTOR, facilityIndex: 0 },
  { firstname: 'Emmanuel', lastname: 'Kalubi', email: 'dr.kalubi@medinsight.cd', role: R.DOCTOR, facilityIndex: 1 },
  { firstname: 'Solange', lastname: 'Ngoy', email: 'dr.solange@medinsight.cd', role: R.DOCTOR, facilityIndex: 1 },
  { firstname: 'Dieudonné', lastname: 'Mutombo', email: 'dr.mutombo@medinsight.cd', role: R.DOCTOR, facilityIndex: 2 },
  { firstname: 'Béatrice', lastname: 'Kasongo', email: 'dr.beatrice@medinsight.cd', role: R.DOCTOR, facilityIndex: 3 },
  { firstname: 'Olivier', lastname: 'Lualaba', email: 'dr.lualaba@medinsight.cd', role: R.DOCTOR, facilityIndex: 5 },
  { firstname: 'Cécile', lastname: 'Mwamba', email: 'dr.cecile@medinsight.cd', role: R.DOCTOR, facilityIndex: 5 },
  { firstname: 'Gilbert', lastname: 'Ilunga', email: 'dr.ilinga@medinsight.cd', role: R.DOCTOR, facilityIndex: 6 },
  { firstname: 'Monique', lastname: 'Kenge', email: 'dr.kenge@medinsight.cd', role: R.DOCTOR, facilityIndex: 7 },
  { firstname: 'Augustin', lastname: 'Tshilombo', email: 'dr.tshilombo@medinsight.cd', role: R.DOCTOR, facilityIndex: 8 },
  { firstname: 'Consolée', lastname: 'Bakonga', email: 'nurse.consolee@medinsight.cd', role: R.NURSE, facilityIndex: 0 },
  { firstname: 'Pierrette', lastname: 'Nlandu', email: 'nurse.pierrette@medinsight.cd', role: R.NURSE, facilityIndex: 1 },
  { firstname: 'Norbert', lastname: 'Kasongo', email: 'nurse.norbert@medinsight.cd', role: R.NURSE, facilityIndex: 5 },
  { firstname: 'Espérance', lastname: 'Ilunga', email: 'researcher@medinsight.cd', role: R.RESEARCHER, facilityIndex: 0 },
  { firstname: 'Françoise', lastname: 'Kenge', email: 'francoise.research@medinsight.cd', role: R.RESEARCHER, facilityIndex: 4 },
  { firstname: 'Clovis', lastname: 'Lukusa', email: 'clovis.viewer@medinsight.cd', role: R.VIEWER, facilityIndex: 0 },
  { firstname: 'Bernadette', lastname: 'Mbuyi', email: 'bernadette.viewer@medinsight.cd', role: R.VIEWER, facilityIndex: 5 },
]

const patientData = [
  { facilityIndex: 0, patientUuid: 'PAT-001', firstname: 'Félix', lastname: 'Tshisekedi', sex: 'M', age: 52, bloodGroup: 'A+', phone: '+243 81 301 0001', email: 'felix.tshisekedi@email.cd', address: 'Avenue de la Paix, Gombe, Kinshasa', dateOfBirth: '1973-03-15', allergies: ['Pénicilline'] },
  { facilityIndex: 0, patientUuid: 'PAT-002', firstname: 'Jeanne', lastname: 'Lubaya', sex: 'F', age: 34, bloodGroup: 'O+', phone: '+243 81 301 0002', email: 'jeanne.lubaya@email.cd', address: 'Boulevard du 30 Juin, Lingwala, Kinshasa', dateOfBirth: '1991-07-22', allergies: [] },
  { facilityIndex: 0, patientUuid: 'PAT-003', firstname: 'Aristide', lastname: 'Kabila', sex: 'M', age: 61, bloodGroup: 'B-', phone: '+243 81 301 0003', email: 'aristide.kabila@email.cd', address: 'Rue de l\'Évangéli, Barumbu, Kinshasa', dateOfBirth: '1964-11-08', allergies: ['Aspirine', 'Iode'] },
  { facilityIndex: 1, patientUuid: 'PAT-004', firstname: 'Hélène', lastname: 'Diangienda', sex: 'F', age: 43, bloodGroup: 'AB+', phone: '+243 81 301 0004', email: 'helene.diangienda@email.cd', address: 'Avenue Tombalbaye, Kinshasa', dateOfBirth: '1982-01-30', allergies: ['Latex'] },
  { facilityIndex: 1, patientUuid: 'PAT-005', firstname: 'Célestin', lastname: 'Mobutu', sex: 'M', age: 69, bloodGroup: 'O-', phone: '+243 81 301 0005', email: 'celestin.mobutu@email.cd', address: 'Boulevard Lumumba, Limete, Kinshasa', dateOfBirth: '1956-05-12', allergies: [] },
  { facilityIndex: 0, patientUuid: 'PAT-006', firstname: 'Béatrice', lastname: 'Ngoma', sex: 'F', age: 28, bloodGroup: 'A-', phone: '+243 81 301 0006', email: 'beatrice.ngoma@email.cd', address: 'Avenue Sendwe, Ngaliema, Kinshasa', dateOfBirth: '1997-09-03', allergies: ['Pollens'] },
  { facilityIndex: 2, patientUuid: 'PAT-007', firstname: 'Sylvain', lastname: 'Kasai', sex: 'M', age: 55, bloodGroup: 'B+', phone: '+243 81 301 0007', email: 'sylvain.kasai@email.cd', address: 'Rue Kasa-Vubu, Kintambo, Kinshasa', dateOfBirth: '1970-12-18', allergies: ['AINS'] },
  { facilityIndex: 0, patientUuid: 'PAT-008', firstname: 'Cécile', lastname: 'Kalonji', sex: 'F', age: 40, bloodGroup: 'O+', phone: '+243 81 301 0008', email: 'cecile.kalonji@email.cd', address: 'Avenue des Aviateurs, Gombe, Kinshasa', dateOfBirth: '1985-04-25', allergies: [] },
  { facilityIndex: 3, patientUuid: 'PAT-009', firstname: 'Augustin', lastname: 'Lumumba', sex: 'M', age: 74, bloodGroup: 'A+', phone: '+243 81 301 0009', email: 'augustin.lumumba@email.cd', address: 'Boulevard du 30 Juin, Lingwala, Kinshasa', dateOfBirth: '1951-08-07', allergies: ['Morphine'] },
  { facilityIndex: 0, patientUuid: 'PAT-010', firstname: 'Monique', lastname: 'Kasa', sex: 'F', age: 46, bloodGroup: 'AB-', phone: '+243 81 301 0010', email: 'monique.kasa@email.cd', address: 'Avenue Mombo, Ngaliema, Kinshasa', dateOfBirth: '1979-06-14', allergies: [] },
  { facilityIndex: 1, patientUuid: 'PAT-011', firstname: 'Félix', lastname: 'Tshombe', sex: 'M', age: 37, bloodGroup: 'O+', phone: '+243 81 301 0011', email: 'felix.tshombe@email.cd', address: 'Rue de Kinshasa, Bandalungwa', dateOfBirth: '1988-02-20', allergies: ['Crustacés'] },
  { facilityIndex: 0, patientUuid: 'PAT-012', firstname: 'Grâce', lastname: 'Nsenda', sex: 'F', age: 52, bloodGroup: 'B+', phone: '+243 81 301 0012', email: 'grace.nsenda@email.cd', address: 'Avenue Kasa-Vubu, Kalamu, Kinshasa', dateOfBirth: '1973-10-11', allergies: [] },
  { facilityIndex: 2, patientUuid: 'PAT-013', firstname: 'Aristide', lastname: 'Kalonji', sex: 'M', age: 29, bloodGroup: 'A-', phone: '+243 81 301 0013', email: 'aristide.kalonji@email.cd', address: 'Boulevard Mangengeng, Masina, Kinshasa', dateOfBirth: '1996-01-05', allergies: [] },
  { facilityIndex: 0, patientUuid: 'PAT-014', firstname: 'Espérance', lastname: 'Kabongo', sex: 'F', age: 63, bloodGroup: 'O-', phone: '+243 81 301 0014', email: 'esperance.kabongo@email.cd', address: 'Avenue de la République, Gombe, Kinshasa', dateOfBirth: '1962-07-28', allergies: ['Pénicilline', 'Sulfamides'] },
  { facilityIndex: 3, patientUuid: 'PAT-015', firstname: 'Norbert', lastname: 'Luyindula', sex: 'M', age: 50, bloodGroup: 'B-', phone: '+243 81 301 0015', email: 'norbert.luyindula@email.cd', address: 'Rue des Écoles, Ndjili, Kinshasa', dateOfBirth: '1975-03-09', allergies: [] },
  { facilityIndex: 5, patientUuid: 'PAT-016', firstname: 'Françoise', lastname: 'Batumona', sex: 'F', age: 38, bloodGroup: 'A+', phone: '+243 81 301 0016', email: 'francoise.batumona@email.cd', address: 'Avenue de Limete, Limete, Kinshasa', dateOfBirth: '1987-05-17', allergies: [] },
  { facilityIndex: 5, patientUuid: 'PAT-017', firstname: 'Clovis', lastname: 'Kilangi', sex: 'M', age: 57, bloodGroup: 'O+', phone: '+243 81 301 0017', email: 'clovis.kilangi@email.cd', address: 'Boulevard Katumbi, Ngaba, Kinshasa', dateOfBirth: '1968-09-23', allergies: ['Pénicilline'] },
  { facilityIndex: 0, patientUuid: 'PAT-018', firstname: 'Bernadette', lastname: 'Ngalula', sex: 'F', age: 26, bloodGroup: 'B+', phone: '+243 81 301 0018', email: 'bernadette.ngalula@email.cd', address: 'Avenue Tombalbaye, Makala, Kinshasa', dateOfBirth: '1999-12-01', allergies: [] },
  { facilityIndex: 6, patientUuid: 'PAT-019', firstname: 'Gilbert', lastname: 'Kanku', sex: 'M', age: 64, bloodGroup: 'AB+', phone: '+243 81 301 0019', email: 'gilbert.kanku@email.cd', address: 'Route de Limete, Limete, Kinshasa', dateOfBirth: '1961-04-11', allergies: ['Iode', 'Latex'] },
  { facilityIndex: 0, patientUuid: 'PAT-020', firstname: 'Marie', lastname: 'Lokwa', sex: 'F', age: 49, bloodGroup: 'A-', phone: '+243 81 301 0020', email: 'marie.lokwa@email.cd', address: 'Avenue Kasa-Vubu, Kintambo, Kinshasa', dateOfBirth: '1976-08-30', allergies: [] },
  { facilityIndex: 1, patientUuid: 'PAT-021', firstname: 'Emmanuel', lastname: 'Nzemba', sex: 'M', age: 41, bloodGroup: 'O-', phone: '+243 81 301 0021', email: 'emmanuel.nzemba@email.cd', address: 'Boulevard Lumumba, Kalamu, Kinshasa', dateOfBirth: '1984-01-19', allergies: [] },
  { facilityIndex: 7, patientUuid: 'PAT-022', firstname: 'Solange', lastname: 'Kabinda', sex: 'F', age: 59, bloodGroup: 'B-', phone: '+243 81 301 0022', email: 'solange.kabinda@email.cd', address: 'Avenue de la Paix, Gombe, Kinshasa', dateOfBirth: '1966-06-05', allergies: ['Aspirine'] },
  { facilityIndex: 8, patientUuid: 'PAT-023', firstname: 'Dieudonné', lastname: 'Mwanza', sex: 'M', age: 45, bloodGroup: 'A+', phone: '+243 81 301 0023', email: 'dieudonne.mwanza@email.cd', address: 'Rue Kalembe-Lembe, Bandalungwa, Kinshasa', dateOfBirth: '1980-10-14', allergies: [] },
  { facilityIndex: 0, patientUuid: 'PAT-024', firstname: 'Consolée', lastname: 'Ngalula', sex: 'F', age: 33, bloodGroup: 'O+', phone: '+243 81 301 0024', email: 'consolee.ngalula@email.cd', address: 'Avenue Sendwe, Barumbu, Kinshasa', dateOfBirth: '1992-02-28', allergies: ['Pollens', 'Acariens'] },
  { facilityIndex: 5, patientUuid: 'PAT-025', firstname: 'Augustin', lastname: 'Katumbi', sex: 'M', age: 72, bloodGroup: 'AB-', phone: '+243 81 301 0025', email: 'augustin.katumbi@email.cd', address: 'Boulevard Kasavubu, Kinshasa', dateOfBirth: '1953-12-20', allergies: [] },
  { facilityIndex: 0, patientUuid: 'PAT-026', firstname: 'Monique', lastname: 'Luyindula', sex: 'F', age: 54, bloodGroup: 'B+', phone: '+243 81 301 0026', email: 'monique.luyindula@email.cd', address: 'Avenue du Cinquantenaire, Lingwala, Kinshasa', dateOfBirth: '1971-07-09', allergies: [] },
  { facilityIndex: 1, patientUuid: 'PAT-027', firstname: 'Olivier', lastname: 'Tshilombo', sex: 'M', age: 36, bloodGroup: 'A-', phone: '+243 81 301 0027', email: 'olivier.tshilombo@email.cd', address: 'Rue de l\'Étoile, Masina, Kinshasa', dateOfBirth: '1989-11-03', allergies: [] },
  { facilityIndex: 0, patientUuid: 'PAT-028', firstname: 'Pierrette', lastname: 'Kalembe', sex: 'F', age: 28, bloodGroup: 'O+', phone: '+243 81 301 0028', email: 'pierrette.kalembe@email.cd', address: 'Avenue Mombo, Ngaliema, Kinshasa', dateOfBirth: '1997-04-16', allergies: [] },
  { facilityIndex: 6, patientUuid: 'PAT-029', firstname: 'Bertin', lastname: 'Mobutu', sex: 'M', age: 67, bloodGroup: 'A+', phone: '+243 81 301 0029', email: 'bertin.mobutu@email.cd', address: 'Route de Kintambo, Kintambo, Kinshasa', dateOfBirth: '1958-08-22', allergies: ['Morphine', 'AINS'] },
  { facilityIndex: 0, patientUuid: 'PAT-030', firstname: 'Bernadette', lastname: 'Lukusa', sex: 'F', age: 42, bloodGroup: 'B-', phone: '+243 81 301 0030', email: 'bernadette.lukusa@email.cd', address: 'Avenue Kasavubu, Limete, Kinshasa', dateOfBirth: '1983-03-07', allergies: [] },
  { facilityIndex: 5, patientUuid: 'LAT-001', firstname: 'Félix', lastname: 'Kasongo', sex: 'M', age: 30, bloodGroup: 'O+', phone: '+243 81 301 0031', email: 'felix.kasongo@email.cd', address: 'Avenue de la République, Gombe, Kinshasa', dateOfBirth: '1995-07-05', allergies: [] },
  { facilityIndex: 5, patientUuid: 'LAT-002', firstname: 'Jeanne', lastname: 'Mbuyi', sex: 'F', age: 51, bloodGroup: 'A+', phone: '+243 81 301 0032', email: 'jeanne.mbuyi@email.cd', address: 'Boulevard Lumumba, Kalamu, Kinshasa', dateOfBirth: '1974-11-28', allergies: ['Pénicilline'] },
  { facilityIndex: 0, patientUuid: 'PAT-031', firstname: 'Aristide', lastname: 'Nsenda', sex: 'M', age: 35, bloodGroup: 'B+', phone: '+243 81 301 0033', email: 'aristide.nsenda@email.cd', address: 'Avenue Tombalbaye, Makala, Kinshasa', dateOfBirth: '1990-09-12', allergies: [] },
  { facilityIndex: 3, patientUuid: 'PAT-032', firstname: 'Hélène', lastname: 'Kalonji', sex: 'F', age: 58, bloodGroup: 'O-', phone: '+243 81 301 0034', email: 'helene.kalonji@email.cd', address: 'Avenue des Aviateurs, Gombe, Kinshasa', dateOfBirth: '1967-01-25', allergies: ['Iode'] },
  { facilityIndex: 0, patientUuid: 'PAT-033', firstname: 'Gilbert', lastname: 'Lualaba', sex: 'M', age: 44, bloodGroup: 'AB+', phone: '+243 81 301 0035', email: 'gilbert.lualaba@email.cd', address: 'Rue de Kinshasa, Bandalungwa', dateOfBirth: '1981-06-30', allergies: [] },
  { facilityIndex: 1, patientUuid: 'PAT-034', firstname: 'Françoise', lastname: 'Kenge', sex: 'F', age: 39, bloodGroup: 'A-', phone: '+243 81 301 0036', email: 'francoise.kenge@email.cd', address: 'Boulevard Katumbi, Ngaba, Kinshasa', dateOfBirth: '1986-10-08', allergies: [] },
  { facilityIndex: 0, patientUuid: 'PAT-035', firstname: 'Clovis', lastname: 'Tshisekedi', sex: 'M', age: 62, bloodGroup: 'O+', phone: '+243 81 301 0037', email: 'clovis.tshisekedi@email.cd', address: 'Avenue de la Paix, Gombe, Kinshasa', dateOfBirth: '1963-02-14', allergies: ['Sulfamides'] },
]

const caseData = [
  { facilityIndex: 0, patientIndex: 0, doctorIndex: 2, title: 'Paludisme sévère à Plasmodium falciparum', description: 'Patient de 52 ans, fièvre élevée depuis 5 jours, parasitémie à 200 000/µL. Hémoglobine 8g/dL.', symptomsJson: { description: 'Fièvre 40°C, frissons, sueurs, anémie, splénomégalie, parasitémie 200 000/µL' }, provisionalDiagnosis: 'Paludisme sévère - P. falciparum - Parasitémie 200 000/µL', treatment: 'Artesunate IV 2.4mg/kg puis Perfloxine per os, transfusion si Hb <7', treatmentDuration: '7 jours', outcomeStatus: IN_PROGRESS, priority: 'critical', tagsJson: { tags: ['infectiologie', 'paludisme', 'urgence'] } },
  { facilityIndex: 0, patientIndex: 1, doctorIndex: 3, title: 'Diabète de type 2 décompensé', description: 'Découverte fortuite glycémie 3.2g/L. HbA1c 10.5%. IMC 32.', symptomsJson: { description: 'Polyurie, polydipsie, fatigue, perte de poids inexpliquée' }, provisionalDiagnosis: 'Diabète type 2 - HbA1c 10.5%', treatment: 'Metformine 1000mg 2x/j + Gliclazide 80mg + régime hygiéno-diététique', treatmentDuration: '6 mois', outcomeStatus: IN_PROGRESS, priority: 'high', tagsJson: { tags: ['endocrinologie', 'chronique', 'dmi'] } },
  { facilityIndex: 0, patientIndex: 2, doctorIndex: 2, title: 'Hypertension artérielle sévère', description: 'HTA sévère PAS 185/115. Débutée depuis 8 mois sans traitement. Risque cardiovasculaire élevé.', symptomsJson: { description: 'Céphalées occipitales, vertiges, épistaxis récurrente, dyspnée d\'effort' }, provisionalDiagnosis: 'HTA sévère - Risque CV élevé', treatment: 'Amlodipine 10mg + Lisinopril 20mg + Indapamide 1.5mg LP', treatmentDuration: 'Indéterminé', outcomeStatus: IN_PROGRESS, priority: 'high', tagsJson: { tags: ['cardiologie', 'chronique', 'risque-cv'] } },
  { facilityIndex: 1, patientIndex: 3, doctorIndex: 4, title: 'Asthme bronchique persistant', description: 'Asthme déclenché par les pollens et la poussière. VEMS 65% pré-bronchodilatateur.', symptomsJson: { description: 'Dyspnée paroxystique, sifflements, toux nocturne, oppression thoracique' }, provisionalDiagnosis: 'Asthme allergique persistant léger - VEMS 65%', treatment: 'Beclométasone 400mcg/j + Formotérol 12mcg + Salbutamol PRN', treatmentDuration: 'Permanente', outcomeStatus: SUCCESS, priority: 'medium', tagsJson: { tags: ['pneumologie', 'allergie', 'pollen'] } },
  { facilityIndex: 0, patientIndex: 4, doctorIndex: 3, title: 'Insuffisance cardiaque aiguë', description: 'ICFE décompensée. FEVG 28%. Patient de 69 ans, antécédent IAM 2018. Hospitalisation en urgence.', symptomsJson: { description: 'Dyspnée de repos, orthopnée 3/4, œdèmes des MI, râles crépitants bilatéraux' }, provisionalDiagnosis: 'ICFE NYHA III - FEVG 28% - Décompensation aiguë', treatment: 'Furosémide IV 80mg + Ramipril 5mg + Carvedilol 12.5mg 2x/j + Spironolactone 25mg', treatmentDuration: 'Longue durée', outcomeStatus: IN_PROGRESS, priority: 'critical', tagsJson: { tags: ['cardiologie', 'urgence', 'hospitalisation'] } },
  { facilityIndex: 2, patientIndex: 5, doctorIndex: 6, title: 'Dermatite atopique sévère', description: 'Eczéma chronique des plis du coude et du genou depuis l\'enfance. SCORAD 55.', symptomsJson: { description: 'Prurit intense nocturne, lichenification, surinfection staphylococcique' }, provisionalDiagnosis: 'Dermatite atopique sévère - SCORAD 55', treatment: 'Crème corticoïde bétaméthasone + émollients quotidiens + Dupilumab 300mg/2sem', treatmentDuration: '6 mois', outcomeStatus: IN_PROGRESS, priority: 'high', tagsJson: { tags: ['dermatologie', 'biologie', 'chronique'] } },
  { facilityIndex: 0, patientIndex: 6, doctorIndex: 2, title: 'Gastrite à Helicobacter pylori', description: 'Douleurs gastriques depuis 3 semaines. Test urea breath test positif. FGDS gastrique avec érosions.', symptomsJson: { description: 'Douleur épigastrique post-prandiale, brûlures, ballonnements, perte d\'appétit' }, provisionalDiagnosis: 'Gastrite antrale - Hp positif', treatment: 'IPP Esoméprazole 40mg + Amoxicilline 1g 2x/j + Clarithromycine 500mg 2x/j (14j)', treatmentDuration: '2 semaines', outcomeStatus: PENDING, priority: 'medium', tagsJson: { tags: ['gastro', 'infection', 'hp'] } },
  { facilityIndex: 1, patientIndex: 7, doctorIndex: 5, title: 'Gonarthrose bilatérale', description: 'Arthrose du genou bilatérale stade 2-3. IMC 29. Sédentaire. Douleurs invalidantes.', symptomsJson: { description: 'Douleur mécanique, raideur matinale 30min, craquements, gonflement récurrent' }, provisionalDiagnosis: 'Gonarthrose bilatérale stade 2-3 - Kellgren 3', treatment: 'Paracétamol 3g/j + AINS topique + Kinésithérapie 3x/semaine + Infiltration hyaluronique', treatmentDuration: '6 mois', outcomeStatus: IN_PROGRESS, priority: 'medium', tagsJson: { tags: ['rhumatologie', 'orthopédie', 'douleur'] } },
  { facilityIndex: 3, patientIndex: 8, doctorIndex: 7, title: 'Polyarthrite rhumatoïde séropositive', description: 'PR séropositive diagnostiquée depuis 4 mois. FR 130 UI/mL, anti-CCP 280. Érosions précoces.', symptomsJson: { description: 'Raideur matinale >2h, douleurs articulaires symétriques MTP, poignets, MCP' }, provisionalDiagnosis: 'PR séropositive - stade précoce erosif', treatment: 'Méthotrexate 15mg/semaine SC + Acide folique 5mg + Prednisone 10mg décroissant', treatmentDuration: 'Longue durée', outcomeStatus: IN_PROGRESS, priority: 'high', tagsJson: { tags: ['rhumatologie', 'auto-immune', 'biologie'] } },
  { facilityIndex: 0, patientIndex: 9, doctorIndex: 3, title: 'Anémie ferriprive sévère', description: 'Hb 6.5g/dL, ferritine 3 ng/mL, sat transferrine 5%. Ménorragies abondantes.', symptomsJson: { description: 'Fatigue extrême, pâleur, dyspnée d\'effort, palpitations, ongles koilonychies' }, provisionalDiagnosis: 'Anémie ferriprive sévère - Hb 6.5g/dL', treatment: 'Venofer 200mg IV x5 + Fer oral Sulfate ferreux 200mg/j après perfusions', treatmentDuration: '3 mois', outcomeStatus: PENDING, priority: 'high', tagsJson: { tags: ['hématologie', 'nutrition', 'urgence'] } },
  { facilityIndex: 0, patientIndex: 0, doctorIndex: 2, title: 'Trouble dépressif majeur', description: 'Épisode dépressif récurrent sévère. PHQ-9 score 20. Idéations suicidaires passives.', symptomsJson: { description: 'Tristesse persistante, anhédonie, insomnie précoce, perte d\'appétit, fatigue, concentration altérée' }, provisionalDiagnosis: 'TDM sévère sans trouble bipolaire - PHQ-9: 20', treatment: 'Sertraline 100mg/j + TCC psychothérapie hebdomadaire', treatmentDuration: '12 mois', outcomeStatus: IN_PROGRESS, priority: 'high', tagsJson: { tags: ['psychiatrie', 'santé-mentale', 'suivi'] } },
  { facilityIndex: 2, patientIndex: 10, doctorIndex: 6, title: 'Colique néphrétique', description: 'Lithiase rénale droite 9mm. Douleur aiguë aux urgences. Hématurie microscopique.', symptomsJson: { description: 'Douleur lombaire droite fulgurante, irradiation fosse iliaque, nausées, hématurie' }, provisionalDiagnosis: 'Lithiase rénale droite 9mm - Colique néphrétique', treatment: 'Métamizole 2g IV + Tamsulosine 0.4mg/j + Hydratation 3L/j + Lithotripsie extracorporelle', treatmentDuration: '1 mois', outcomeStatus: SUCCESS, priority: 'high', tagsJson: { tags: ['urologie', 'urgence', 'lithiase'] } },
  { facilityIndex: 1, patientIndex: 11, doctorIndex: 4, title: 'Hypothyroïdie subclinique', description: 'TSH 9.0 mUI/L, T4L normale. Fatigue chronique, prise de poids 7kg en 3 mois.', symptomsJson: { description: 'Fatigue, prise de poids, intolérance au froid, constipation, peau sèche' }, provisionalDiagnosis: 'Hypothyroïdie subclinique - TSH 9.0', treatment: 'Lévothyroxine 50mcg/j à jeune - Réévaluation TSH dans 6 semaines', treatmentDuration: 'Indéterminé', outcomeStatus: IN_PROGRESS, priority: 'medium', tagsJson: { tags: ['endocrinologie', 'thyroïde'] } },
  { facilityIndex: 0, patientIndex: 12, doctorIndex: 3, title: 'Appendicite aiguë non compliquée', description: 'Appendicite confirmée au scanner. Algie fosse iliaque droite depuis 14h. Pas de péritonite.', symptomsJson: { description: 'Douleur FID aiguë, fièvre 38.8°C, nausées, défense musculaire' }, provisionalDiagnosis: 'Appendicite aiguë non compliquée - Alvarado 9', treatment: 'Appendicoscopie sous coelioscopie - Antibiothérapie peropératoire', treatmentDuration: '1 semaine', outcomeStatus: SUCCESS, priority: 'critical', tagsJson: { tags: ['chirurgie', 'urgence', 'coelioscopie'] } },
  { facilityIndex: 3, patientIndex: 13, doctorIndex: 7, title: 'Cataracte sénile bilatérale', description: 'Baisse de l\'AV depuis 1 an. Cataracte nucléaire bilatérale. AV count digits OD 2/10, OG 3/10.', symptomsJson: { description: 'Baisse progressive acuité visuelle, éblouissement, dédoublement des images' }, provisionalDiagnosis: 'Cataracte sénile bilatérale - stade核成熟', treatment: 'Phacoémulsification + IOL bilatérale sous anesthésie topique', treatmentDuration: '2 semaines', outcomeStatus: PENDING, priority: 'medium', tagsJson: { tags: ['ophtalmologie', 'chirurgie', 'cataracte'] } },
  { facilityIndex: 0, patientIndex: 14, doctorIndex: 2, title: 'Infection urinaire basse', description: 'ITU basse récidivante (5 épisodes/an). Cystite aiguë. ECBU positif E.coli 10^6 UFC/mL.', symptomsJson: { description: 'Dysurie, pollakiurie, brûlures mictionnelles, urine trouble' }, provisionalDiagnosis: 'Cystite aiguë - E.coli sensible', treatment: 'Fosfomycine 3g dose unique + Hydratation abondante', treatmentDuration: '3 jours', outcomeStatus: SUCCESS, priority: 'low', tagsJson: { tags: ['infectiologie', 'urologie'] } },
  { facilityIndex: 0, patientIndex: 1, doctorIndex: 3, title: 'Névralgie du trijumeau', description: 'Douleur faciale paroxystique type V2-V3 depuis 7 mois. Déclenchée par le mastication.', symptomsJson: { description: 'Douleur fulgurante joue et mâchoire, déclenchée par mastication et toucher' }, provisionalDiagnosis: 'Névralgie du trijumeau type classique - V2/V3', treatment: 'Carbamazépine 200mg 2x/j titration progressive + IRM cérébrale', treatmentDuration: '6 mois', outcomeStatus: IN_PROGRESS, priority: 'high', tagsJson: { tags: ['neurologie', 'douleur', 'trijumeau'] } },
  { facilityIndex: 1, patientIndex: 3, doctorIndex: 5, title: 'MPOC GOLD stade II', description: 'Bronchopneumopathie chronique obstructive. VEMS/CVF 52%. Fumeur 35 paquets-années.', symptomsJson: { description: 'Dyspnée d\'effort chronique, toux productive matinale, sifflements' }, provisionalDiagnosis: 'MPOC GOLD stade II - VEMS/CVF 52%', treatment: 'Tiotropium 18mcg/j + Salbutamol 100mcg PRN + Réhabilitation respiratoire', treatmentDuration: 'Longue durée', outcomeStatus: IN_PROGRESS, priority: 'high', tagsJson: { tags: ['pneumologie', 'chronique', 'tabac'] } },
  { facilityIndex: 0, patientIndex: 4, doctorIndex: 2, title: 'Sténose du canal lombaire', description: 'Canal lombaire étroit L4-L5 avec compression racinaire. Claudication marche 180m.', symptomsJson: { description: 'Claudication marche lombaire, douleurs lombaires irradiées aux membres inférieurs' }, provisionalDiagnosis: 'Sténose du canal lombaire L4-L5 - Claudication marche 180m', treatment: 'Kinésithérapie lombaire + Infiltrations épidurales + Pregabaline 75mg 2x/j', treatmentDuration: '3 mois', outcomeStatus: PENDING, priority: 'medium', tagsJson: { tags: ['orthopédie', 'neurochirurgie', 'lombalgie'] } },
  { facilityIndex: 5, patientIndex: 15, doctorIndex: 8, title: 'Syndrome métabolique', description: 'Patient 38 ans, IMC 33, PA 145/95, glycémie 1.20g/L, TG 3.0g/L, HDL 0.32g/L.', symptomsJson: { description: 'Obésité abdominale, fatigue, essoufflement, acrosurie' }, provisionalDiagnosis: 'Syndrome métabolique - ATP III critères', treatment: 'Régime hypocalorique - Activité physique 150min/sem + Metformine 850mg', treatmentDuration: '12 mois', outcomeStatus: IN_PROGRESS, priority: 'high', tagsJson: { tags: ['endocrinologie', 'métabolisme', 'obésité'] } },
  { facilityIndex: 5, patientIndex: 16, doctorIndex: 9, title: 'Cancer du côlon stade II', description: 'Adénocarcinome du côlon ascendant pT3N0M0. Score d\'Amsterdam négatif. Chirurgie programmée.', symptomsJson: { description: 'Rectorragies, troubles du transit, amaigrissement 9kg, anémie' }, provisionalDiagnosis: 'Adénocarcinome côlon ascendant pT3N0M0', treatment: 'Hémicollectomie droite + chimiothérapie adjuvante FOLFOX 12 cycles', treatmentDuration: '6 mois', outcomeStatus: IN_PROGRESS, priority: 'critical', tagsJson: { tags: ['oncologie', 'chirurgie', 'coloscopie'] } },
  { facilityIndex: 0, patientIndex: 17, doctorIndex: 2, title: 'Lupus érythémateux systémique', description: 'PLESS chez femme jeune. Anticorps ANA +, anti-dsDNA +, complément bas. Atteinte rénale + cutanée.', symptomsJson: { description: 'Érythème papulocraâneux en ailes de papillon, arthralgies, protéinurie 1.8g/j' }, provisionalDiagnosis: 'PLESS - Score SLICC 9 - Néphropathie classe IV', treatment: 'Corticoïdes 1mg/kg + Mycophénolate 2g/j + Hydroxychloroquine 400mg/j', treatmentDuration: 'Longue durée', outcomeStatus: IN_PROGRESS, priority: 'critical', tagsJson: { tags: ['rhumatologie', 'auto-immune', 'néphrologie'] } },
  { facilityIndex: 1, patientIndex: 20, doctorIndex: 4, title: 'Hernie discale L5-S1', description: 'Hernie discale postérieure L5-S1 compressive racine S1 gauche. Sciatique fulgurante.', symptomsJson: { description: 'Douleur sciatique gauche, déficit sensitif S1, Lasègue +25°' }, provisionalDiagnosis: 'Hernie discale L5-S1 gauche compressive', treatment: 'Corticoïdes périduraux + Pregabaline + Kinésithérapie - Chirurgie si échec 3 mois', treatmentDuration: '3 mois', outcomeStatus: PENDING, priority: 'high', tagsJson: { tags: ['neurochirurgie', 'douleur', 'rachis'] } },
  { facilityIndex: 0, patientIndex: 19, doctorIndex: 3, title: 'Dépression post-partum', description: 'Trouble dépressif majeur post-partum. Edinburgh score 19. A allaité 4 mois.', symptomsJson: { description: 'Tristesse, anxiété, insomnie, irritabilité, culpabilité, idées noires' }, provisionalDiagnosis: 'Dépression post-partum sévère - Edinburgh 19', treatment: 'Sertraline 50mg (compatible allaitement) + Soutien psychologique', treatmentDuration: '12 mois', outcomeStatus: IN_PROGRESS, priority: 'high', tagsJson: { tags: ['psychiatrie', 'post-partum', 'santé-mentale'] } },
  { facilityIndex: 2, patientIndex: 12, doctorIndex: 6, title: 'Urticaire chronique', description: 'Urticaire spontanée depuis 7 mois. Éruptions quotidiennes. Pas d\'étiologie identifiée.', symptomsJson: { description: 'Plaques urticariennes prurigineuses, papules, angioedème périoculaire' }, provisionalDiagnosis: 'Urticaire chronique spontanée', treatment: 'Antihistaminiques dose double (Cétirizine 20mg/j) + Omalizumab si échec', treatmentDuration: '6 mois', outcomeStatus: IN_PROGRESS, priority: 'medium', tagsJson: { tags: ['dermatologie', 'allergie', 'chronique'] } },
  { facilityIndex: 6, patientIndex: 18, doctorIndex: 10, title: 'Insuffisance rénale chronique', description: 'IRC stade 4 - DFG 20 mL/min/1.73m². Néphropathie diabétique. Anémie chronique.', symptomsJson: { description: 'Fatigue, prurit, œdèmes, nausées, pollakiurie nocturne' }, provisionalDiagnosis: 'IRC stade 4 - Néphropathie diabétique', treatment: 'EPO 4000UI/semaine + Fer IV + Régime hyposodé + IEC + Phosphateurs', treatmentDuration: 'Longue durée', outcomeStatus: IN_PROGRESS, priority: 'critical', tagsJson: { tags: ['néphrologie', 'dialyse', 'chronique'] } },
  { facilityIndex: 0, patientIndex: 23, doctorIndex: 2, title: 'Paludisme récurrent', description: 'Patient sans comorbidité. 4ème épisode de paludisme cette année. P. falciparum confirmé.', symptomsJson: { description: 'Fièvre 39.5°C, frissons, céphalée, myalgies, parasitémie 80 000/µL' }, provisionalDiagnosis: 'Paludisme récidivant - P. falciparum', treatment: 'ACT (Arthéméther-Luméfantrine) 3 jours + prophylaxie recommandée', treatmentDuration: '3 jours', outcomeStatus: SUCCESS, priority: 'high', tagsJson: { tags: ['infectiologie', 'paludisme', 'prévention'] } },
  { facilityIndex: 5, patientIndex: 24, doctorIndex: 8, title: 'BPCO aiguë surinfectée', description: 'Exacerbation aiguë de BPCO avec expectoration purulente. VEMS 32%.', symptomsJson: { description: 'Dyspnée aiguë, expectoration purulente, fièvre 39.5°C, wheezing' }, provisionalDiagnosis: 'Exacerbation aiguë BPCO - Infection - VEMS 32%', treatment: 'Amoxicilline-clavulanique 1g 3x/j + Prednisone 40mg + Nébulisation Salbutamol', treatmentDuration: '10 jours', outcomeStatus: SUCCESS, priority: 'high', tagsJson: { tags: ['pneumologie', 'infection', 'urgence'] } },
  { facilityIndex: 0, patientIndex: 25, doctorIndex: 3, title: 'Céphalées de tension chronique', description: 'Céphalées tensionnelles chroniques quotidiennes depuis 2 ans. Consommation d\'AINS excessive.', symptomsJson: { description: 'Douleur oppressante bilatérale, sensation de casque, raideur cervicale' }, provisionalDiagnosis: 'Céphalées de tension chronique + Médicament overuse', treatment: 'Amitriptyline 25mg NS + Arrêt AINS + Relaxation + Physiothérapie', treatmentDuration: '3 mois', outcomeStatus: PENDING, priority: 'medium', tagsJson: { tags: ['neurologie', 'douleur', 'chronique'] } },
  { facilityIndex: 1, patientIndex: 26, doctorIndex: 5, title: 'Diabète type 1 - Mauvais contrôle', description: 'DT1 chez jeune adulte. HbA1c 11.2%. Pas d\'autosurveillance glycémique. DKA il y a 8 mois.', symptomsJson: { description: 'Polyurie, polydipsie, amaigrissement, cétonurie' }, provisionalDiagnosis: 'DT1 - HbA1c 11.2% - Mauvais contrôle', treatment: 'Pompe à insuline + Formation auto-injection + Éducation thérapeutique', treatmentDuration: 'Indéterminé', outcomeStatus: IN_PROGRESS, priority: 'critical', tagsJson: { tags: ['endocrinologie', 'diabète', 'éducation'] } },
  { facilityIndex: 3, patientIndex: 21, doctorIndex: 7, title: 'Arthrose cervicale', description: 'Spondylarthrose cervicale avec douleurs chroniques. C5-C6 et C6-C7.', symptomsJson: { description: 'Douleurs cervicales chroniques, céphalées postérieures, vertiges positionnels' }, provisionalDiagnosis: 'Spondylarthrose cervicale C5-C7', treatment: 'Kinésithérapie cervicale + Anti-inflammatoires + Collier cervical nocturne', treatmentDuration: '3 mois', outcomeStatus: PENDING, priority: 'medium', tagsJson: { tags: ['orthopédie', 'rachis', 'chronique'] } },
  { facilityIndex: 0, patientIndex: 27, doctorIndex: 2, title: 'Grossesse normale - Suivi', description: 'G2P1 - SA 28 semaines. Grossesse évolutive. TDA 23cm, BCF 145/min. RAI négatif.', symptomsJson: { description: 'Suivi de grossesse normale - Aucun symptôme pathologique' }, provisionalDiagnosis: 'Grossesse unique SA 28 semaines - Normale', treatment: 'Acide folique + Fer + Calcium + Échographie T3 prévue', treatmentDuration: '12 semaines', outcomeStatus: IN_PROGRESS, priority: 'medium', tagsJson: { tags: ['obstétrique', 'grossesse', 'suivi'] } },
  { facilityIndex: 0, patientIndex: 28, doctorIndex: 3, title: 'Gastropathie par AINS', description: 'Ulcération gastrique suite à traitement AINS prolongé pour lombalgie. Hématémèse.', symptomsJson: { description: 'Hématémèse, méléna, douleur épigastrique, pâleur' }, provisionalDiagnosis: 'Ulcère gastrique induit par AINS', treatment: 'Arrêt AINS + Esoméprazole 40mg IV + Transfusion si Hb<7 + Gastroscopie contrôle', treatmentDuration: '2 mois', outcomeStatus: SUCCESS, priority: 'high', tagsJson: { tags: ['gastro', 'urg', 'médecament'] } },
  { facilityIndex: 5, patientIndex: 30, doctorIndex: 9, title: 'Pneumonie communautaire', description: 'Pneumonie lobaire droite. CRP 190, Leucocytes 16000. Scanner typique.', symptomsJson: { description: 'Fièvre 39.8°C, toux productive, douleur thoracique, dyspnée' }, provisionalDiagnosis: 'Pneumonie lobaire droite - CRB-65: 1', treatment: 'Amoxicilline 1g 3x/j + Azithromycine 500mg 1/j + Hospitalisation', treatmentDuration: '10 jours', outcomeStatus: SUCCESS, priority: 'high', tagsJson: { tags: ['pneumologie', 'infection', 'hospitalisation'] } },
  { facilityIndex: 0, patientIndex: 29, doctorIndex: 2, title: 'Fibrillation atriale paroxystique', description: 'FA paroxystique découverte lors d\'ECG de contrôle. CHA2DS2-VASc 2. HAS-BLED 1.', symptomsJson: { description: 'Palpitations, dyspnée d\'effort, fatigue, pouls irrégulier' }, provisionalDiagnosis: 'Fibrillation atriale paroxystique - CHA2DS2-VASc 2', treatment: 'Anticoagulation Apixaban 5mg 2x/j + Bêtabloqueur Bisoprolol 5mg', treatmentDuration: 'Indéterminé', outcomeStatus: IN_PROGRESS, priority: 'high', tagsJson: { tags: ['cardiologie', 'arythmie', 'anticoagulation'] } },
]

const auditData = [
  { action: 'LOGIN', resource: 'auth', details: { method: 'password', ip: '192.168.1.1' }, ip: '192.168.1.1' },
  { action: 'CREATE', resource: 'clinical_case', details: { title: 'Paludisme sévère à Plasmodium falciparum' }, ip: '192.168.1.10' },
  { action: 'UPDATE', resource: 'clinical_case', details: { field: 'outcome_status', old: 'PENDING', new: 'IN_PROGRESS' }, ip: '192.168.1.15' },
  { action: 'CREATE', resource: 'user', details: { name: 'Espérance Ilunga', role: 'RESEARCHER' }, ip: '192.168.1.1' },
  { action: 'VIEW', resource: 'patient', details: { name: 'Félix Tshisekedi' }, ip: '192.168.1.10' },
  { action: 'LOGIN', resource: 'auth', details: { method: 'password', ip: '192.168.1.20' }, ip: '192.168.1.20' },
  { action: 'CREATE', resource: 'clinical_case', details: { title: 'Diabète de type 2 décompensé' }, ip: '192.168.1.10' },
  { action: 'UPDATE', resource: 'patient', details: { field: 'allergies', added: ['Pénicilline'] }, ip: '192.168.1.10' },
  { action: 'VIEW', resource: 'clinical_case', details: { title: 'Insuffisance cardiaque aiguë' }, ip: '192.168.1.15' },
  { action: 'CREATE', resource: 'clinical_case', details: { title: 'Syndrome métabolique' }, ip: '192.168.1.30' },
  { action: 'UPDATE', resource: 'clinical_case', details: { field: 'treatment', new: 'Protocole FOLFOX modifié' }, ip: '192.168.1.30' },
  { action: 'LOGIN', resource: 'auth', details: { method: 'password', ip: '10.0.0.5' }, ip: '10.0.0.5' },
  { action: 'VIEW', resource: 'patient', details: { name: 'Françoise Batumona' }, ip: '192.168.1.30' },
  { action: 'UPDATE', resource: 'facility', details: { field: 'bed_count', old: 1990, new: 2000 }, ip: '192.168.1.1' },
  { action: 'CREATE', resource: 'clinical_case', details: { title: 'Grossesse normale - Suivi' }, ip: '192.168.1.10' },
  { action: 'DELETE', resource: 'sync_queue', details: { count: 18 }, ip: '192.168.1.1' },
  { action: 'LOGIN', resource: 'auth', details: { method: 'password', ip: '192.168.1.50' }, ip: '192.168.1.50' },
  { action: 'UPDATE', resource: 'clinical_case', details: { field: 'outcome_status', old: 'IN_PROGRESS', new: 'SUCCESS' }, ip: '192.168.1.10' },
  { action: 'VIEW', resource: 'audit', details: { query: 'last_30_days' }, ip: '192.168.1.1' },
  { action: 'CREATE', resource: 'clinical_case', details: { title: 'Pneumonie communautaire' }, ip: '192.168.1.30' },
]

async function seed() {
  console.log('🌱 Seeding database with Kinshasa medical data...')

  const db = getDb()

  const insertedFacilities = await db.insert(facilities).values(facilityData).returning({ id: facilities.id })
  console.log(`  ✓ ${insertedFacilities.length} facilities`)

  const passwordHash = await hashPassword('admin123')
  const doctorHash = await hashPassword('doctor123')
  const nurseHash = await hashPassword('nurse123')
  const researcherHash = await hashPassword('researcher123')
  const viewerHash = await hashPassword('viewer123')

  const hashByRole: Record<string, string> = {
    ADMIN: passwordHash,
    DOCTOR: doctorHash,
    NURSE: nurseHash,
    RESEARCHER: researcherHash,
    VIEWER: viewerHash,
  }

  const insertedUsers = await db.insert(users).values(
    userData.map((u) => ({
      firstname: u.firstname,
      lastname: u.lastname,
      email: u.email,
      passwordHash: hashByRole[u.role],
      role: u.role,
      facilityId: insertedFacilities[u.facilityIndex].id,
    }))
  ).returning({ id: users.id })
  console.log(`  ✓ ${insertedUsers.length} users`)

  const insertedPatients = await db.insert(patients).values(
    patientData.map((p) => ({
      facilityId: insertedFacilities[p.facilityIndex].id,
      patientUuid: p.patientUuid,
      firstname: p.firstname,
      lastname: p.lastname,
      sex: p.sex,
      age: p.age,
      bloodGroup: p.bloodGroup,
      phone: p.phone,
      email: p.email,
      address: p.address,
      dateOfBirth: p.dateOfBirth,
      allergies: p.allergies,
      medicalHistoryJson: {},
      isActive: true,
    }))
  ).returning({ id: patients.id })
  console.log(`  ✓ ${insertedPatients.length} patients`)

  const insertedCases = await db.insert(clinicalCases).values(
    caseData.map((c) => ({
      facilityId: insertedFacilities[c.facilityIndex].id,
      patientId: insertedPatients[c.patientIndex].id,
      doctorId: insertedUsers[c.doctorIndex].id,
      title: c.title,
      description: c.description,
      symptomsJson: c.symptomsJson,
      provisionalDiagnosis: c.provisionalDiagnosis,
      treatment: c.treatment,
      treatmentDuration: c.treatmentDuration,
      outcomeStatus: c.outcomeStatus,
      priority: c.priority,
      tagsJson: c.tagsJson,
      isSynced: true,
    }))
  ).returning({ id: clinicalCases.id })
  console.log(`  ✓ ${insertedCases.length} clinical cases`)

  await db.insert(auditLogs).values(
    auditData.map((a, i) => ({
      userId: insertedUsers[i % insertedUsers.length].id,
      facilityId: insertedFacilities[i % insertedFacilities.length].id,
      action: a.action,
      resource: a.resource,
      resourceId: insertedPatients[i % insertedPatients.length].id,
      details: a.details,
      ipAddress: a.ip,
    }))
  )
  console.log(`  ✓ ${auditData.length} audit logs`)

  console.log('\n🎉 Seed completed successfully!')
  console.log(`   Facilities: ${insertedFacilities.length}`)
  console.log(`   Users: ${insertedUsers.length}`)
  console.log(`   Patients: ${insertedPatients.length}`)
  console.log(`   Clinical Cases: ${insertedCases.length}`)
  console.log(`   Audit Logs: ${auditData.length}`)
}

seed().catch((e) => {
  console.error('❌ Seed failed:', e)
  process.exit(1)
})
