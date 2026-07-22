import { getDb } from './db'
import { facilities, users, patients, consultations, diagnostics, diseases, treatments, medications, prescriptions, labCategories, labExams, queue, documents, notifications, auditLogs, archives, syncQueue, clinicalCases } from './schema'
import { hashPassword } from './auth'

const F = { HOSPITAL: 'HOSPITAL' as const, CLINIC: 'CLINIC' as const, LABORATORY: 'LABORATORY' as const, PHARMACY: 'PHARMACY' as const }
const R = {
  SUPER_ADMIN: 'SUPER_ADMIN' as const, ADMIN: 'ADMIN' as const, RECEPTIONIST: 'RECEPTIONIST' as const,
  DOCTOR: 'DOCTOR' as const, SPECIALIST: 'SPECIALIST' as const, LABORATORY: 'LABORATORY' as const,
  PHARMACIST: 'PHARMACIST' as const, NURSE: 'NURSE' as const, ACCOUNTANT: 'ACCOUNTANT' as const,
  ARCHIVIST: 'ARCHIVIST' as const, PATIENT: 'PATIENT' as const,
}

function daysAgo(n: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(8 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 60), 0, 0)
  return d
}
function pick<T>(arr: readonly T[]): T { return arr[Math.floor(Math.random() * arr.length)] }
function randInt(min: number, max: number): number { return min + Math.floor(Math.random() * (max - min + 1)) }
function uuid(): string { return crypto.randomUUID() }

const facilityData = [
  { name: 'Hôpital Général de Référence de Kinshasa', code: 'HGRK-001', facilityType: F.HOSPITAL, address: 'Avenue de l\'Hôpital, Gombe', city: 'Kinshasa', phone: '+243 81 222 0001', email: 'info@hgrk.cd', bedCount: 2000, departmentCount: 40, staffCount: 4500 },
  { name: 'Cliniques Universitaires de Kinshasa', code: 'CUK-002', facilityType: F.HOSPITAL, address: 'Boulevard du 30 Juin, Gombe', city: 'Kinshasa', phone: '+243 81 222 0002', email: 'contact@cuk.cd', bedCount: 1200, departmentCount: 30, staffCount: 3000 },
  { name: 'Clinique Ngaliema', code: 'CNG-003', facilityType: F.CLINIC, address: 'Avenue Mombo, Ngaliema', city: 'Kinshasa', phone: '+243 81 222 0003', email: 'accueil@cliniquengaliema.cd', bedCount: 250, departmentCount: 12, staffCount: 500 },
  { name: 'Hôpital du Cinquantenaire', code: 'HDC-004', facilityType: F.HOSPITAL, address: 'Avenue du Cinquantenaire, Lingwala', city: 'Kinshasa', phone: '+243 81 222 0004', email: 'admin@hopitalcinquantenaire.cd', bedCount: 800, departmentCount: 20, staffCount: 1800 },
  { name: 'Hôpital Saint Joseph de Masina', code: 'HSJM-005', facilityType: F.HOSPITAL, address: 'Avenue Sendwe, Masina', city: 'Kinshasa', phone: '+243 81 222 0005', email: 'info@hopitalsaintjoseph.cd', bedCount: 600, departmentCount: 15, staffCount: 1200 },
  { name: 'Clinique la Réconciliation', code: 'CLR-006', facilityType: F.CLINIC, address: 'Avenue Kasa-Vubu, Kalamu', city: 'Kinshasa', phone: '+243 81 222 0006', email: 'contact@clreconciliation.cd', bedCount: 120, departmentCount: 8, staffCount: 250 },
  { name: 'Laboratoire Central National de Kinshasa', code: 'LCNK-007', facilityType: F.LABORATORY, address: 'Avenue des Aviateurs, Gombe', city: 'Kinshasa', phone: '+243 81 222 0007', email: 'lab@lcnk.cd', bedCount: 0, departmentCount: 6, staffCount: 200 },
  { name: 'Pharmacie Centrale de Kinshasa', code: 'PCK-008', facilityType: F.PHARMACY, address: 'Avenue Tombalbaye, Limete', city: 'Kinshasa', phone: '+243 81 222 0008', email: 'pharm@pck.cd', bedCount: 0, departmentCount: 3, staffCount: 80 },
  { name: 'Hôpital Général de Référence de Lubumbashi', code: 'HGRL-009', facilityType: F.HOSPITAL, address: 'Avenue Kasavubu, Lubumbashi', city: 'Lubumbashi', phone: '+243 81 822 0001', email: 'info@hgrl.cd', bedCount: 900, departmentCount: 22, staffCount: 2000 },
  { name: 'Hôpital Général de Référence de Mbuji-Mayi', code: 'HGRM-010', facilityType: F.HOSPITAL, address: 'Boulevard Lumumba, Mbuji-Mayi', city: 'Mbuji-Mayi', phone: '+243 81 522 0001', email: 'admin@hgrm.cd', bedCount: 500, departmentCount: 14, staffCount: 1000 },
]

const userData = [
  { firstname: 'Jean-Pierre', lastname: 'Lukusa', email: 'admin@dhayaro.cd', role: R.ADMIN, facilityIndex: 0 },
  { firstname: 'Amira', lastname: 'Tshisekedi', email: 'superadmin@dhayaro.cd', role: R.SUPER_ADMIN, facilityIndex: 0 },
  { firstname: 'Yasmine', lastname: 'Ngoma', email: 'reception@dhayaro.cd', role: R.RECEPTIONIST, facilityIndex: 0 },
  { firstname: 'Patrice', lastname: 'Kabongo', email: 'dr.kabongo@dhayaro.cd', role: R.DOCTOR, facilityIndex: 0 },
  { firstname: 'Clovis', lastname: 'Lukusa', email: 'dr.clovis@dhayaro.cd', role: R.DOCTOR, facilityIndex: 0 },
  { firstname: 'Espérance', lastname: 'Ilunga', email: 'dr.esperance@dhayaro.cd', role: R.SPECIALIST, facilityIndex: 1 },
  { firstname: 'Sylvain', lastname: 'Kasai', email: 'dr.sylvain@dhayaro.cd', role: R.DOCTOR, facilityIndex: 1 },
  { firstname: 'Grâce', lastname: 'Nsenda', email: 'dr.grace@dhayaro.cd', role: R.SPECIALIST, facilityIndex: 2 },
  { firstname: 'Joseph', lastname: 'Tshisekedi', email: 'lab.joseph@dhayaro.cd', role: R.LABORATORY, facilityIndex: 6 },
  { firstname: 'Béatrice', lastname: 'Ngoy', email: 'pharm.beatrice@dhayaro.cd', role: R.PHARMACIST, facilityIndex: 7 },
  { firstname: 'Mohamed', lastname: 'Bensaid', email: 'nurse.mohamed@dhayaro.cd', role: R.NURSE, facilityIndex: 0 },
  { firstname: 'Cécile', lastname: 'Kalonji', email: 'nurse.cecile@dhayaro.cd', role: R.NURSE, facilityIndex: 1 },
  { firstname: 'Augustin', lastname: 'Bakonga', email: 'compta.augustin@dhayaro.cd', role: R.ACCOUNTANT, facilityIndex: 0 },
  { firstname: 'Monique', lastname: 'Mutombo', email: 'archive.monique@dhayaro.cd', role: R.ARCHIVIST, facilityIndex: 0 },
  { firstname: 'Pierre', lastname: 'Mobutu', email: 'dr.pierre@dhayaro.cd', role: R.DOCTOR, facilityIndex: 3 },
  { firstname: 'Françoise', lastname: 'Diangienda', email: 'dr.francoise@dhayaro.cd', role: R.DOCTOR, facilityIndex: 4 },
  { firstname: 'André', lastname: 'Tshombe', email: 'dr.andre@dhayaro.cd', role: R.DOCTOR, facilityIndex: 5 },
  { firstname: 'Marie', lastname: 'Lubaya', email: 'dr.marie@dhayaro.cd', role: R.SPECIALIST, facilityIndex: 8 },
  { firstname: 'David', lastname: 'Kabila', email: 'dr.david@dhayaro.cd', role: R.DOCTOR, facilityIndex: 9 },
  { firstname: 'Marcel', lastname: 'Tshibola', email: 'patient.marcel@dhayaro.cd', role: R.PATIENT, facilityIndex: 0 },
  { firstname: 'Solange', lastname: 'Mbayo', email: 'patient.solange@dhayaro.cd', role: R.PATIENT, facilityIndex: 1 },
  { firstname: 'Prosper', lastname: 'Kalume', email: 'patient.prosper@dhayaro.cd', role: R.PATIENT, facilityIndex: 2 },
]

const firstNamesM = ['Pierre','Joseph','Jean','Patrice','Clovis','Augustin','Sylvain','André','David','Marcel','Robert','Georges','Emmanuel','Prosper','Blaise','Félicien','Laurent','Gilbert','Théodore','Hippolyte']
const firstNamesF = ['Grâce','Espérance','Cécile','Monique','Béatrice','Marie','Françoise','Joséphine','Thérèse','Clémentine','Hortense','Suzanne','Adélaïde','Solange','Berthe','Marthe','Jeanne','Colette','Madeleine','Caroline']
const lastNames = ['Tshisekedi','Kabila','Lumumba','Tshombe','Kalonji','Kabongo','Ilunga','Ngoma','Mutombo','Bakonga','Lukusa','Nsenda','Kasai','Mobutu','Diangienda','Ngoy','Bensaid','Mbaya','Simbi','Kashesha','Mugangu','Kamara','Kolongo','Bolongo','Mukalay']
const bloodGroups = ['A+','A-','B+','B-','AB+','AB-','O+','O+','O+','O-'] as const
const communes = ['Gombe','Lingwala','Ngaliema','Barumbu','Limete','Masina','Kalamu','Bandalungwa','Kintambo','Ndjili','Matonge','Kasa-Vubu','Mont-Ngafula','Selembao']
const streets = ['Avenue Kasavubu','Boulevard Lumumba','Avenue de l\'Hôpital','Boulevard du 30 Juin','Avenue Sendwe','Rue Kasa-Vubu','Avenue Tombalbaye','Avenue des Aviateurs','Avenue Mombo','Boulevard Mangengeng']
const allergiesList = ['Pénicilline','Aspirine','Iode','Latex','AINS','Morphine','Sulfamides','Pollens','Crustacés','Arachides','Null']

const clinicalTemplates = [
  { motif: 'Fièvre palustre avec frissons', symptoms: ['Fièvre 40°C','Frissons intensifs','Sueurs profondes','Céphalées'], diag: 'Paludisme sévère à Plasmodium falciparum', treatment: 'Artésunate IV 2.4mg/kg + Arteméther-Luméfantrine PO', notes: 'Goutte épaisse positive - Hb 8.2g/dL' },
  { motif: 'Douleur thoracique aiguë', symptoms: ['Douleur rétrosternale','Dyspnée','Palpitations'], diag: 'Syndrome coronarien aigu - Suspicion', treatment: 'Aspirine 250mg + Nitroglycérine SL + ECG urgent', notes: 'URGENCE - ECG et troponines immédiats' },
  { motif: 'Diabète type 2 - Suivi', symptoms: ['Polyurie','Polydipsie','Fatigue'], diag: 'Diabète type 2 - HbA1c 9.5%', treatment: 'Metformine 1000mg 2x/j + Gliclazide 80mg', notes: 'Contrôle HbA1c dans 3 mois' },
  { motif: 'Hypertension artérielle sévère', symptoms: ['Céphalées occipitales','Vertiges','Épistaxis'], diag: 'HTA sévère - Risque CV élevé', treatment: 'Amlodipine 10mg + Lisinopril 20mg', notes: 'Régime hyposodé prescrit' },
  { motif: 'Infection pulmonaire sévère', symptoms: ['Fièvre 39.8°C','Toux productive purulente','Dyspnée'], diag: 'Pneumonie lobaire droite - CRB-65: 2', treatment: 'Ceftriaxone 2g IV + Azithromycine 500mg', notes: 'Radiographie thoracique à contrôler' },
  { motif: 'Douleur abdominale aiguë FID', symptoms: ['Douleur FID','Fièvre 38.5°C','Nausées'], diag: 'Appendicite aiguë - Alvarado 8', treatment: 'Appendicoscopie sous coelioscopie', notes: 'Chirurgie urgente programmée' },
  { motif: 'Infection urinaire haute', symptoms: ['Dysurie','Fièvre 39°C','Douleur lombaire'], diag: 'Pyélonéphrite aiguë - E.coli', treatment: 'Ciprofloxacine 500mg 2x/j x14 jours', notes: 'Uroculture et antibiogramme' },
  { motif: 'Anémie sévère', symptoms: ['Fatigue extrême','Pâleur intense','Dyspnée d\'effort'], diag: 'Anémie ferriprive sévère - Hb 5.8g/dL', treatment: 'Venofer 200mg IV x5 + Fer口服', notes: 'Recherche cause parasitaire (verrerie, paludisme)' },
  { motif: 'Insuffisance cardiaque décompensée', symptoms: ['Dyspnée de repos','Orthopnée','Œdèmes MI'], diag: 'ICFE NYHA III - FEVG 28%', treatment: 'Furosémide IV + Ramipril + Carvedilol', notes: 'Surveillance poids quotidienne' },
  { motif: 'Gastropathie avec douleurs épigastriques', symptoms: ['Douleur épigastrique','Brûlures','Ballonnements'], diag: 'Gastrite antrale - Hp positif', treatment: 'IPP + Amoxicilline 1g + Clarithromycine 500mg (14j)', notes: 'Test urea breath test contrôle après 4 semaines' },
  { motif: 'Colique néphrétique', symptoms: ['Douleur lombaire fulgurante','Nausées','Hématurie'], diag: 'Lithiase rénale droite 9mm', treatment: 'Métamizole 2g IV + Tamsulosine', notes: 'Scanner abdomen sans injection' },
  { motif: 'Trouble dépressif majeur', symptoms: ['Tristesse persistante','Anhédonie','Insomnie'], diag: 'Trouble dépressif sévère - PHQ-9: 19', treatment: 'Sertraline 50mg/j + TCC', notes: 'Suivi psychiatrique programmé' },
  { motif: 'Arthrose du genou bilatérale', symptoms: ['Douleur mécanique','Raideur matinale'], diag: 'Gonarthrose bilatérale stade 2-3', treatment: 'Paracétamol + AINS topique + Kiné', notes: 'Perte de poids recommandée' },
  { motif: 'Urticaire chronique', symptoms: ['Plaques urticariennes prurigineuses'], diag: 'Urticaire chronique spontanée', treatment: 'Cétirizine 20mg/j + Omalizumab si échec', notes: 'Éviction facteurs déclenchants' },
  { motif: 'Malaria chez l\'enfant', symptoms: ['Fièvre 40.5°C','Convulsions','Vomissements'], diag: 'Paludisme cérébral - Enfant 4 ans', treatment: 'Artésunate IV 3.2mg/kg + Dextrose 5%', notes: 'URGENCE - Surveillance neurologique continue' },
  { motif: 'Tuberculose pulmonaire', symptoms: ['Toux chronique >2 semaines','Hémoptysie','Amaigrissement'], diag: 'Tuberculose pulmonaire - BK+ x3', treatment: 'RHZE 2 mois + RH 4 mois', notes: 'Isolement respiratoire - Contact tracing' },
  { motif: 'VIH/SIDA - Mise sous ARV', symptoms: ['Amaigrissement','Diarrhée chronique','Fièvre intermittente'], diag: 'VIH stade 4 - CD4: 85/mm3', treatment: 'TDF/3TC/DTG + Cotrimoxazole prophylaxie', notes: 'Adhérence thérapeutique - Suivi mensuel' },
  { motif: 'Malnutrition sévère chez l\'enfant', symptoms: ['AMA','Œdèmes','Irritabilité'], diag: 'Malnutrition aiguë sévère - IMC/A < 3', treatment: 'F-75 → F-100 → ROM + Cotrimoxazole', notes: 'Enfant 18 mois - Pesée et mensuration quotidiennes' },
  { motif: 'Céphalées chroniques', symptoms: ['Céphalées bilatérales','Nausées','Photophobie'], diag: 'Migraine sans aura - Crise prolongée', treatment: 'Kétorolac 30mg IV + Métoclopramide', notes: 'Bilan NEURO : scanner cérébral normal' },
  { motif: 'Blessure par balle - Thorax', symptoms: ['Douleur thoracique vive','Hémorragie externe','Dyspnée'], diag: 'Plaie pénétrante thorax - Hémothorax', treatment: 'Drain thoracique + Laparotomie exploratrice', notes: 'URGENCE CHIRURGICALE - Transfusion sang A-' },
]

const diseaseData = [
  { code: 'B54', name: 'Paludisme non précisé', category: 'Maladies infectieuses', symptoms: ['Fièvre','Frissons','Sueurs'], complications: ['Paludisme cérébral','Anémie sévère','Insuffisance rénale'], treatments: ['Arthéméther-Luméfantrine','Artésunate IV'] },
  { code: 'A09', name: 'Gastro-entérite infectieuse', category: 'Maladies infectieuses', symptoms: ['Diarrhée','Vomissements','Fièvre'], complications: ['Déshydratation sévère','Déséquilibre hydro-électrolytique'], treatments: ['Réhydratation orale','Solution de Réhydratation Orale'] },
  { code: 'E11', name: 'Diabète de type 2', category: 'Maladies endocriniennes', symptoms: ['Polyurie','Polydipsie','Amaigrissement'], complications: ['Rétinopathie','Néphropathie','Neuropathie','Pied diabétique'], treatments: ['Metformine','Insuline','Gliclazide'] },
  { code: 'I10', name: 'Hypertension artérielle essentielle', category: 'Maladies cardiovasculaires', symptoms: ['Céphalées','Vertiges'], complications: ['AVC','IDC','Insuffisance rénale','Rétinopathie'], treatments: ['IEC','ARA-II','Calcio-antagonistes'] },
  { code: 'J18', name: 'Pneumonie', category: 'Maladies respiratoires', symptoms: ['Fièvre','Toux productive','Dyspnée'], complications: ['Empyème','Septicémie','Détresse respiratoire'], treatments: ['Antibiothérapie','Oxygénothérapie'] },
  { code: 'J44', name: 'MPOC', category: 'Maladies respiratoires', symptoms: ['Dyspnée','Toux productive'], complications: ['Exacerbation aiguë','Insuffisance respiratoire'], treatments: ['Bronchodilatateurs','Corticoïdes inhalés'] },
  { code: 'K29', name: 'Gastrite', category: 'Maladies digestives', symptoms: ['Douleur épigastrique','Nausées'], complications: ['Ulcère gastrique','Hémorragie digestive'], treatments: ['IPP','Eradication H.pylori'] },
  { code: 'M17', name: 'Gonarthrose', category: 'Maladies ostéo-articulaires', symptoms: ['Douleur mécanique','Raideur'], complications: ['Handicap moteur','Douleur chronique'], treatments: ['Antalgiques','Kinésithérapie','Chirurgie'] },
  { code: 'N39', name: 'Infection urinaire', category: 'Maladies urologiques', symptoms: ['Dysurie','Pollakiurie'], complications: ['Pyélonéphrite','Sepsis urinaire'], treatments: ['Antibiothérapie adaptée'] },
  { code: 'F32', name: 'Trouble dépressif majeur', category: 'Maladies psychiatriques', symptoms: ['Tristesse','Anhédonie','Insomnie'], complications: ['Suicide','Désociation sociale'], treatments: ['ISRS','Psychothérapie'] },
  { code: 'B20', name: 'VIH/SIDA', category: 'Maladies infectieuses', symptoms: ['Amaigrissement','Diarrhée chronique','Fièvre'], complications: ['Tuberculose','Infections opportunistes'], treatments: ['ARV - TDF/3TC/DTG','Cotrimoxazole'] },
  { code: 'A16', name: 'Tuberculose pulmonaire', category: 'Maladies infectieuses', symptoms: ['Toux chronique','Hémoptysie','Fièvre vespérale'], complications: ['Pneumothorax','Hémoptysie massive'], treatments: ['RHZE 2 mois + RH 4 mois'] },
]

const medData = [
  { name: 'Artésunate', genericName: 'Artésunate', category: 'Antipaludéen', form: 'Injectable', dosage: '60mg' },
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
  { name: 'Cotrimoxazole', genericName: 'Cotrimoxazole', category: 'Antibiotique', form: 'Comprimé', dosage: '480mg' },
  { name: 'Ceftriaxone', genericName: 'Ceftriaxone', category: 'Antibiotique', form: 'Injectable', dosage: '1g' },
  { name: 'Arteméther-Luméfantrine', genericName: 'AL', category: 'Antipaludéen', form: 'Comprimé', dosage: '20/120mg' },
  { name: 'TDF/3TC/DTG', genericName: 'ARV Triple', category: 'Antirétroviral', form: 'Comprimé', dosage: '300/300/50mg' },
  { name: 'Cétirizine', genericName: 'Cétirizine', category: 'Antihistaminique', form: 'Comprimé', dosage: '10mg' },
  { name: 'Metoclopramide', genericName: 'Metoclopramide', category: 'Antiémétique', form: 'Injectable', dosage: '10mg' },
  { name: 'Kétorolac', genericName: 'Kétorolac', category: 'AINS', form: 'Injectable', dosage: '30mg' },
]

const labExamNames = [
  'NFS complète','Glycémie à jeun','Créatinine','Bilan hépatique','ECBU',
  'Goutte épaisse et thin film','Bilan sanguin complet','Sérologie VIH',
  'CD4','Charge virale VIH','Radiographie thoracique','ECG',
  'Scanner abdominal','Échographie abdominale','Bilan coagulation',
  'Vitesse de sédimentation','CRP','Bilan lipidique','HbA1c',
  'Examen coprologique','Hémoculture','Uroculture',
]

const docTypes = ['PRESCRIPTION','CERTIFICATE','REPORT','LAB_RESULT','REFERRAL','ORDONNANCE'] as const

const auditActions = ['LOGIN','CREATE','UPDATE','VIEW','DELETE'] as const
const auditResources = ['auth','consultation','patient','diagnostic','treatment','lab_exam','clinical_case','document'] as const

const diseaseDescriptions = [
  'Paludisme simple non compliqué chez adulte immunocompétent',
  'Paludisme sévère avec parasitémie >100.000/mm3',
  'Pneumonie communautaire typique sans comorbidité',
  'Pneumonie nosocomiale acquise sous ventilateur',
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
]

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
  'RHZE 2 mois puis RH 4 mois - Directly Observed Therapy',
  'Paracétamol 1g 3x/j + AINS topique + Rééducation',
  'Sertraline 50mg/j croissance progressive',
  'F-75 pendant 6h puis F-100 + RUTF + ROM',
  'Kétorolac 30mg IV + Métoclopramide 10mg IV',
  'Drain thoracique + Surveillance hémodynamique',
]

const syncStatuses = ['synced', 'pending', 'failed'] as const
const syncEntityTypes = ['ClinicalCase', 'Patient', 'AuditEntry', 'User', 'Facility']
const syncActions = ['create', 'update', 'delete'] as const

async function seed() {
  console.log('=== Dhayaro Seed — Données Réalistes RDC/Kinshasa ===\n')

  const db = getDb()

  console.log('Cleaning existing data...')
  await db.delete(syncQueue)
  await db.delete(archives)
  await db.delete(auditLogs)
  await db.delete(documents)
  await db.delete(queue)
  await db.delete(labExams)
  await db.delete(prescriptions)
  await db.delete(medications)
  await db.delete(treatments)
  await db.delete(diagnostics)
  await db.delete(consultations)
  await db.delete(clinicalCases)
  await db.delete(patients)
  await db.delete(users)
  await db.delete(diseases)
  await db.delete(labCategories)
  await db.delete(notifications)
  await db.delete(facilities)
  console.log('  Cleaned all tables\n')

  const insertedFacilities = await db.insert(facilities).values(facilityData.map((f) => ({
    ...f, id: uuid(), isActive: true, createdAt: daysAgo(365), updatedAt: new Date(),
  }))).returning({ id: facilities.id })
  console.log(`Facilities: ${insertedFacilities.length}`)

  const passwordHash = await hashPassword('admin123')
  const doctorHash = await hashPassword('doctor123')
  const nurseHash = await hashPassword('nurse123')
  const otherHash = await hashPassword('dhayaro123')
  const patientHash = await hashPassword('patient123')
  const hashByRole: Record<string, string> = {
    SUPER_ADMIN: passwordHash, ADMIN: passwordHash, RECEPTIONIST: otherHash,
    DOCTOR: doctorHash, SPECIALIST: doctorHash, LABORATORY: otherHash,
    PHARMACIST: otherHash, NURSE: nurseHash, ACCOUNTANT: otherHash, ARCHIVIST: otherHash,
    PATIENT: patientHash,
  }

  const insertedUsers = await db.insert(users).values(
    userData.map((u, i) => ({
      id: uuid(), firstname: u.firstname, lastname: u.lastname, email: u.email,
      passwordHash: hashByRole[u.role], role: u.role, facilityId: insertedFacilities[u.facilityIndex].id,
      isActive: true, createdAt: daysAgo(365 - i), updatedAt: new Date(),
    }))
  ).returning({ id: users.id })
  console.log(`Users: ${insertedUsers.length}`)

  const insertedDiseases = await db.insert(diseases).values(
    diseaseData.map((d) => ({
      id: uuid(), ...d, complications: d.complications, treatments: d.treatments,
      isActive: true, createdAt: daysAgo(365), updatedAt: new Date(),
    }))
  ).returning({ id: diseases.id })
  console.log(`Diseases: ${insertedDiseases.length}`)

  console.log('Generating 1000 patients...')
  const patientBatchSize = 200
  const insertedPatients: { id: string }[] = []
  for (let batch = 0; batch < 5; batch++) {
    const batchData = Array.from({ length: patientBatchSize }, (_, i) => {
      const idx = batch * patientBatchSize + i
      const sex = Math.random() > 0.48 ? 'M' as const : 'F' as const
      const age = 1 + Math.floor(Math.random() * 90)
      const birthYear = 2026 - age
      const allg = pick(allergiesList)
      const fn = sex === 'M' ? pick(firstNamesM) : pick(firstNamesF)
      const ln = pick(lastNames)
      return {
        id: uuid(), patientUuid: uuid(),
        facilityId: pick(insertedFacilities).id,
        firstname: fn, lastname: ln, sex,
        dateOfBirth: `${birthYear}-${String(1 + Math.floor(Math.random() * 12)).padStart(2, '0')}-${String(1 + Math.floor(Math.random() * 28)).padStart(2, '0')}`,
        age, bloodGroup: pick(bloodGroups),
        phone: `+243 8${randInt(1,9)} ${String(randInt(100,999)).padStart(3,'0')} ${String(randInt(1000,9999)).padStart(4,'0')}`,
        email: `${fn.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')}.${ln.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')}@email.cd`,
        address: `${pick(streets)}, ${pick(communes)}`,
        city: pick(['Kinshasa','Lubumbashi','Mbuji-Mayi','Kisangani','Goma','Bukavu']),
        emergencyContactName: `${pick(firstNamesM)} ${pick(lastNames)}`,
        emergencyContactPhone: `+243 8${randInt(1,9)} ${String(randInt(100,999)).padStart(3,'0')} ${String(randInt(1000,9999)).padStart(4,'0')}`,
        emergencyContactRelation: pick(['Époux','Épouse','Père','Mère','Frère','Sœur','Enfant']),
        insuranceName: pick(['CNSS','INPP','INAM','Privé','Aucune']),
        insuranceNumber: Math.random() > 0.3 ? `CNSS-${randInt(100000,999999)}` : null,
        allergies: allg === 'Null' ? [] : [allg],
        antecedents: [],
        medicalHistoryJson: {},
        isActive: true, isArchived: false,
        createdAt: daysAgo(365 - idx), updatedAt: new Date(),
      }
    })
    const result = await db.insert(patients).values(batchData).returning({ id: patients.id })
    insertedPatients.push(...result)
    process.stdout.write(`  Patients: ${insertedPatients.length}/1000\r`)
  }
  console.log(`\nPatients: ${insertedPatients.length}`)

  const patientAccountData = [
    { email: 'patient.marcel@dhayaro.cd', fn: 'Marcel', ln: 'Tshibola', facilityIndex: 0 },
    { email: 'patient.solange@dhayaro.cd', fn: 'Solange', ln: 'Mbayo', facilityIndex: 1 },
    { email: 'patient.prosper@dhayaro.cd', fn: 'Prosper', ln: 'Kalume', facilityIndex: 2 },
  ]
  for (let pi = 0; pi < patientAccountData.length; pi++) {
    const acc = patientAccountData[pi]
    const userIdx = userData.findIndex(u => u.email === acc.email)
    const facilityId = insertedFacilities[acc.facilityIndex].id
    const patientId = uuid()
    await db.insert(patients).values({
      id: patientId,
      facilityId,
      userId: insertedUsers[userIdx].id,
      patientUuid: uuid(),
      firstname: acc.fn,
      lastname: acc.ln,
      sex: pi === 1 ? 'F' as const : 'M' as const,
      dateOfBirth: `1990-01-${String(pi + 10).padStart(2, '0')}`,
      age: 36,
      bloodGroup: pick(bloodGroups),
      phone: `+243 8${randInt(1,9)} ${String(randInt(100,999)).padStart(3,'0')} ${String(randInt(1000,9999)).padStart(4,'0')}`,
      email: acc.email,
      address: `${pick(streets)}, ${pick(communes)}`,
      city: pick(['Kinshasa','Lubumbashi','Mbuji-Mayi']),
      emergencyContactName: `Contact ${acc.fn}`,
      emergencyContactPhone: `+243 8${randInt(1,9)} ${String(randInt(100,999)).padStart(3,'0')} ${String(randInt(1000,9999)).padStart(4,'0')}`,
      emergencyContactRelation: pick(['Époux','Épouse','Père','Mère','Frère','Sœur','Enfant']),
      insuranceName: 'CNSS',
      insuranceNumber: `CNSS-${randInt(100000,999999)}`,
      allergies: [],
      antecedents: [],
      medicalHistoryJson: {},
      isActive: true, isArchived: false,
      createdAt: daysAgo(365), updatedAt: new Date(),
    })
    insertedPatients.push({ id: patientId })
  }
  console.log(`  Patient accounts linked: ${patientAccountData.length}`)

  const doctorIndices = [3, 4, 5, 6, 7, 14, 15, 16, 17, 18]

  console.log('Generating 3000 consultations...')
  const consultationBatchSize = 500
  const insertedConsultations: { id: string; patientId: string; doctorId: string; facilityId: string }[] = []
  for (let batch = 0; batch < 6; batch++) {
    const batchData = Array.from({ length: consultationBatchSize }, (_, i) => {
      const idx = batch * consultationBatchSize + i
      const template = pick(clinicalTemplates)
      const pi = Math.floor(Math.random() * insertedPatients.length)
      const di = pick(doctorIndices)
      return {
        id: uuid(),
        facilityId: pick(insertedFacilities).id,
        patientId: insertedPatients[pi].id,
        doctorId: insertedUsers[di].id,
        consultationNumber: `CONS-${String(idx + 1).padStart(5, '0')}`,
        motif: template.motif,
        symptoms: template.symptoms,
        vitalSigns: { temperature: 36 + Math.random() * 5, heartRate: 55 + Math.floor(Math.random() * 50), bloodPressure: `${100 + Math.floor(Math.random() * 70)}/${60 + Math.floor(Math.random() * 40)}` },
        notes: template.notes,
        provisionalDiagnosis: template.diag,
        status: pick(['WAITING', 'IN_PROGRESS', 'COMPLETED', 'COMPLETED'] as const),
        createdAt: daysAgo(Math.floor(Math.random() * 300)),
        updatedAt: new Date(),
      }
    })
    const result = await db.insert(consultations).values(batchData).returning({
      id: consultations.id, patientId: consultations.patientId, doctorId: consultations.doctorId, facilityId: consultations.facilityId,
    })
    insertedConsultations.push(...result)
    process.stdout.write(`  Consultations: ${insertedConsultations.length}/3000\r`)
  }
  console.log(`\nConsultations: ${insertedConsultations.length}`)

  console.log('Generating 500 diagnostics...')
  const diagnosticsBatchSize = 250
  const insertedDiagnostics: { id: string; consultationId: string }[] = []
  let diagnosticsCount = 0
  for (let batch = 0; batch < 2; batch++) {
    const batchData = Array.from({ length: diagnosticsBatchSize }, () => {
      const c = pick(insertedConsultations)
      const id = uuid()
      insertedDiagnostics.push({ id, consultationId: c.id })
      return {
        id,
        facilityId: c.facilityId,
        consultationId: c.id,
        patientId: c.patientId,
        doctorId: c.doctorId,
        diseaseId: pick(insertedDiseases).id,
        diagnosticType: pick(['PROVISIONAL', 'FINAL', 'FINAL'] as const),
        description: pick(diseaseDescriptions),
        isValidated: Math.random() > 0.3,
        createdAt: daysAgo(Math.floor(Math.random() * 300)),
        updatedAt: new Date(),
      }
    })
    await db.insert(diagnostics).values(batchData)
    diagnosticsCount += batchData.length
    process.stdout.write(`  Diagnostics: ${diagnosticsCount}/500\r`)
  }
  console.log(`\nDiagnostics: ${diagnosticsCount}`)

  console.log('Generating 18 medications...')
  const insertedMeds = await db.insert(medications).values(
    medData.map(m => ({ id: uuid(), ...m, sideEffects: [], contraindications: [], isActive: true, createdAt: daysAgo(365) }))
  ).returning({ id: medications.id })
  console.log(`Medications: ${insertedMeds.length}`)

  console.log('Generating 500 treatments...')
  const treatmentsBatchSize = 250
  const insertedTreatments: { id: string }[] = []
  for (let batch = 0; batch < 2; batch++) {
    const batchData = Array.from({ length: treatmentsBatchSize }, () => {
      const c = pick(insertedConsultations)
      const diagForC = insertedDiagnostics.filter((d) => d.consultationId === c.id)
      const diagnosisId = diagForC.length ? pick(diagForC).id : null
      return {
        id: uuid(),
        facilityId: c.facilityId,
        consultationId: c.id,
        patientId: c.patientId,
        doctorId: c.doctorId,
        diagnosisId,
        description: pick(treatmentDescriptions),
        status: pick(['PRESCRIBED', 'IN_PROGRESS', 'IN_PROGRESS', 'COMPLETED'] as const),
        startDate: daysAgo(Math.floor(Math.random() * 180)).toISOString().split('T')[0],
        createdAt: daysAgo(Math.floor(Math.random() * 180)),
        updatedAt: new Date(),
      }
    })
    const result = await db.insert(treatments).values(batchData).returning({ id: treatments.id })
    insertedTreatments.push(...result)
    process.stdout.write(`  Treatments: ${insertedTreatments.length}/500\r`)
  }
  console.log(`\nTreatments: ${insertedTreatments.length}`)

  console.log('Generating 500 prescriptions...')
  const prescBatchSize = 250
  let prescCount = 0
  for (let batch = 0; batch < 2; batch++) {
    const batchData = Array.from({ length: prescBatchSize }, () => {
      const t = pick(insertedTreatments)
      const med = pick(insertedMeds)
      return {
        id: uuid(),
        treatmentId: t.id,
        medicationId: med.id,
        dosage: pick(['1 comprimé 2x/j', '1 comprimé 3x/j', '2 comprimés 1x/j', '1 gélule le soir', '1 injectable 1x/j']),
        frequency: pick(['Matin et soir', '3 fois par jour', 'Le matin', 'Selon besoin', 'Toutes les 8h']),
        duration: pick(['5 jours', '7 jours', '14 jours', '1 mois', '3 mois', '6 mois']),
        instructions: pick(['Prendre avec de la nourriture', 'À jeun 30min avant repas', 'Pendant les repas', 'Sans restriction']),
        quantity: 10 + Math.floor(Math.random() * 60),
        createdAt: daysAgo(Math.floor(Math.random() * 180)),
      }
    })
    await db.insert(prescriptions).values(batchData)
    prescCount += batchData.length
    process.stdout.write(`  Prescriptions: ${prescCount}/500\r`)
  }
  console.log(`\nPrescriptions: ${prescCount}`)

  console.log('Generating 5 lab categories...')
  const labCatData = [
    { name: 'Biologie générale', description: 'NFS, glycémie, créatinine, bilan hépatique, ionogramme' },
    { name: 'Microbiologie', description: 'ECBU, hémoculture, prélèvements, BK, CODD' },
    { name: 'Radiologie', description: 'Radiographie, scanner, IRM, échographie' },
    { name: 'Cardiologie', description: 'ECG, échocardiographie, Holter, test d\'effort' },
    { name: 'Anatomopathologie', description: 'Biopsies, cytologie, examen extemporané' },
  ]
  const insertedLabCats = await db.insert(labCategories).values(
    labCatData.map(c => ({ id: uuid(), ...c, isActive: true, createdAt: daysAgo(365) }))
  ).returning({ id: labCategories.id })
  console.log(`Lab Categories: ${insertedLabCats.length}`)

  console.log('Generating 800 lab exams...')
  const labBatchSize = 200
  let labCount = 0
  for (let batch = 0; batch < 4; batch++) {
    const batchData = Array.from({ length: labBatchSize }, () => {
      const c = pick(insertedConsultations)
      const examName = pick(labExamNames)
      const isCompleted = Math.random() > 0.3
      return {
        id: uuid(),
        facilityId: c.facilityId,
        patientId: c.patientId,
        doctorId: c.doctorId,
        labTechnicianId: insertedUsers[8].id,
        categoryId: pick(insertedLabCats).id,
        consultationId: c.id,
        examName,
        clinicalIndication: pick(['Bilan pré-opératoire','Suivi thérapeutique','Urgence diagnostique','Dépistage','Contrôle post-traitement']),
        status: pick(isCompleted ? (['COMPLETED','COMPLETED','IN_PROGRESS'] as const) : (['REQUESTED','IN_PROGRESS'] as const)),
        results: isCompleted ? { valeur: pick(['Normal','Élevé','Bas','Positif','Négatif']), unite: pick(['g/dL','mmol/L','UI/L','/mm3']) } : {},
        resultNotes: isCompleted ? pick(['Dans les normes','Légèrement élevé','À contrôler','Normal']) : null,
        validatedBy: isCompleted ? c.doctorId : null,
        validatedAt: isCompleted ? daysAgo(Math.floor(Math.random() * 100)) : null,
        requestedAt: daysAgo(Math.floor(Math.random() * 200)),
        completedAt: isCompleted ? daysAgo(Math.floor(Math.random() * 150)) : null,
        createdAt: daysAgo(Math.floor(Math.random() * 200)),
        updatedAt: new Date(),
      }
    })
    await db.insert(labExams).values(batchData)
    labCount += batchData.length
    process.stdout.write(`  Lab Exams: ${labCount}/800\r`)
  }
  console.log(`\nLab Exams: ${labCount}`)

  console.log('Generating 100 clinical cases...')
  const caseBatchSize = 100
  const insertedCases = await db.insert(clinicalCases).values(
    Array.from({ length: caseBatchSize }, (_, _i) => {
      const template = pick(clinicalTemplates)
      return {
        id: uuid(),
        facilityId: pick(insertedFacilities).id,
        patientId: pick(insertedPatients).id,
        doctorId: insertedUsers[pick(doctorIndices)].id,
        title: template.motif,
        description: template.diag,
        symptomsJson: { description: template.symptoms.join(', ') },
        provisionalDiagnosis: template.diag,
        treatment: template.treatment,
        treatmentDuration: pick(['5 jours','7 jours','14 jours','1 mois','3 mois']),
        outcomeStatus: pick(['PENDING','IN_PROGRESS','SUCCESS','SUCCESS','FAILURE'] as const),
        outcomeNotes: pick(['Évolution favorable','Résolu','Échec thérapeutique','Contre-indication']),
        priority: pick(['low','medium','medium','high','urgent']),
        tagsJson: { tags: [pick(['paludisme','diabète','HTA','TBC','VIH']), pick(['urgent','suivi','contrôle'])] },
        isSynced: Math.random() > 0.3,
        createdAt: daysAgo(Math.floor(Math.random() * 300)),
        updatedAt: new Date(),
      }
    })
  ).returning({ id: clinicalCases.id })
  console.log(`Clinical Cases: ${insertedCases.length}`)

  console.log('Generating 200 audit logs...')
  const auditBatchSize = 200
  const auditEntries: Array<{
    id: string; userId: string; facilityId: string; action: string; resource: string;
    resourceId: string; details: Record<string, unknown>; ipAddress: string; timestamp: Date
  }> = []
  for (let i = 0; i < auditBatchSize; i++) {
    auditEntries.push({
      id: uuid(), userId: pick(insertedUsers).id,
      facilityId: pick(insertedFacilities).id,
      action: pick([...auditActions]), resource: pick([...auditResources]),
      resourceId: pick(insertedPatients).id,
      details: { description: pick(['Connexion réussie','Création enregistrée','Modification effectuée','Consultation visualisée']) },
      ipAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      timestamp: daysAgo(Math.floor(Math.random() * 365)),
    })
  }
  await db.insert(auditLogs).values(auditEntries)
  console.log(`Audit Logs: ${auditEntries.length}`)

  console.log('Generating 150 notifications...')
  const notifTitles = ['Nouveau patient enregistré','Résultat laboratoire disponible','Consultation assignée','Rappel médicament','Alerte stock médicament','Nouveau diagnostic validé','Términé avec succès','Modification dossier patient','Contrôle urgent','Document à valider']
  const notifMessages = ['Un nouveau patient a été enregistré dans le système.','Les résultats de votre examen sont disponibles.','Une nouvelle consultation vous a été assignée.','Rappel : prise de médicament prescrite.','Le stock de ce médicament est en dessous du seuil minimal.','Un diagnostic a été validé par le médecin référent.','Le traitement a été terminé avec succès.','Le dossier du patient a été mis à jour.','Contrôle de suivi requis dans 48h.','Un document médical attend votre validation.']
  const notifTypes = ['INFO','INFO','SUCCESS','WARNING','ERROR','SUCCESS','INFO','WARNING','ERROR','INFO'] as const
  const insertedNotifs: { id: string }[] = []
  const notifBatchSize = 100
  for (let batch = 0; batch < 2; batch++) {
    const batchData = Array.from({ length: Math.min(notifBatchSize, 150 - batch * notifBatchSize) }, (_, i) => {
      const idx = batch * notifBatchSize + i
      return {
        id: uuid(),
        userId: pick(insertedUsers).id,
        facilityId: pick(insertedFacilities).id,
        title: notifTitles[idx % notifTitles.length],
        message: notifMessages[idx % notifMessages.length],
        type: notifTypes[idx % notifTypes.length],
        isRead: Math.random() > 0.5,
        link: Math.random() > 0.5 ? '/patients' : null,
        metadata: {},
        createdAt: daysAgo(Math.floor(Math.random() * 90)),
      }
    })
    const result = await db.insert(notifications).values(batchData).returning({ id: notifications.id })
    insertedNotifs.push(...result)
  }
  console.log(`Notifications: ${insertedNotifs.length}`)

  console.log('Generating 100 queue entries...')
  const queueStatuses = ['WAITING','WITH_DOCTOR','WITH_LAB','WITH_PHARMACY','COMPLETED','CANCELLED'] as const
  const queuePriorities = ['LOW','NORMAL','NORMAL','HIGH','URGENT'] as const
  const queueBatchSize = 100
  await db.insert(queue).values(
    Array.from({ length: queueBatchSize }, (_, i) => {
      const c = pick(insertedConsultations)
      return {
        id: uuid(),
        facilityId: c.facilityId,
        patientId: c.patientId,
        consultationId: c.id,
        ticketNumber: `TK-${String(i + 1).padStart(4, '0')}`,
        priority: pick(queuePriorities),
        status: pick(queueStatuses),
        assignedDoctorId: c.doctorId,
        queuePosition: i + 1,
        estimatedWaitMinutes: randInt(5, 120),
        arrivedAt: daysAgo(Math.floor(Math.random() * 30)),
        notes: Math.random() > 0.5 ? pick(['Patient attendu','À rappeler','Urgence confirmée']) : null,
        createdAt: daysAgo(Math.floor(Math.random() * 30)),
        updatedAt: new Date(),
      }
    })
  )
  console.log(`Queue: ${queueBatchSize}`)

  console.log('Generating 200 documents...')
  const docBatchSize = 200
  await db.insert(documents).values(
    Array.from({ length: docBatchSize }, () => {
      const c = pick(insertedConsultations)
      return {
        id: uuid(),
        facilityId: c.facilityId,
        patientId: c.patientId,
        consultationId: c.id,
        doctorId: c.doctorId,
        documentType: pick(docTypes),
        title: pick(['Ordonnance médicale','Certificat médical','Rapport d\'examen','Résultat laboratoire','Lettre de recommandation','Compte-rendu opératoire']),
        content: { body: pick(clinicalTemplates).treatment },
        filePath: null,
        isPrinted: Math.random() > 0.7,
        createdAt: daysAgo(Math.floor(Math.random() * 300)),
      }
    })
  )
  console.log(`Documents: ${docBatchSize}`)

  console.log('Generating 100 archives...')
  const archiveTypes = ['CONSULTATION','DIAGNOSTIC','TREATMENT','LAB_EXAM','DOCUMENT','PATIENT_FILE'] as const
  await db.insert(archives).values(
    Array.from({ length: 100 }, () => {
      const c = pick(insertedConsultations)
      return {
        id: uuid(),
        facilityId: c.facilityId,
        entityType: 'CONSULTATION' as const,
        entityId: c.id,
        patientId: c.patientId,
        title: pick(['Consultation archivée','Diagnostic archivé','Traitement archivé','Examen labo archivé','Dossier patient archivé']),
        summary: pick(['Dossier clôturé','Patient guéri','Transféré','Décédé','Contre-indication']),
        archivedBy: c.doctorId,
        data: {},
        createdAt: daysAgo(Math.floor(Math.random() * 365)),
      }
    })
  )
  console.log(`Archives: 100`)

  console.log('Generating 50 sync queue entries...')
  await db.insert(syncQueue).values(
    Array.from({ length: 50 }, (_, _i) => ({
      id: uuid(),
      userId: pick(insertedUsers).id,
      entityType: pick(syncEntityTypes),
      entityId: uuid(),
      action: pick(syncActions),
      payload: {},
      status: pick(syncStatuses),
      errorMessage: Math.random() > 0.8 ? 'Timeout de synchronisation' : null,
      createdAt: daysAgo(Math.floor(Math.random() * 30)),
      syncedAt: Math.random() > 0.4 ? daysAgo(Math.floor(Math.random() * 10)) : null,
    }))
  )
  console.log(`Sync Queue: 50`)

  console.log('\n=== Seed terminé avec succès! ===')
  console.log(`  Facilities:         ${insertedFacilities.length}`)
  console.log(`  Users:              ${insertedUsers.length}`)
  console.log(`  Patients:           ${insertedPatients.length}`)
  console.log(`  Diseases:           ${insertedDiseases.length}`)
  console.log(`  Consultations:      ${insertedConsultations.length}`)
  console.log(`  Diagnostics:        ${diagnosticsCount}`)
  console.log(`  Medications:        ${insertedMeds.length}`)
  console.log(`  Treatments:         ${insertedTreatments.length}`)
  console.log(`  Prescriptions:      ${prescCount}`)
  console.log(`  Lab Categories:     ${insertedLabCats.length}`)
  console.log(`  Lab Exams:          ${labCount}`)
  console.log(`  Clinical Cases:     ${insertedCases.length}`)
  console.log(`  Audit Logs:         ${auditEntries.length}`)
  console.log(`  Notifications:      ${insertedNotifs.length}`)
  console.log(`  Queue:              100`)
  console.log(`  Documents:          ${docBatchSize}`)
  console.log(`  Archives:           100`)
  console.log(`  Sync Queue:         50`)
  console.log(`  TOTAL:              ~${insertedPatients.length + insertedConsultations.length + diagnosticsCount + insertedTreatments.length + prescCount + labCount + insertedCases.length + auditEntries.length + insertedNotifs.length + 350}`)
}

seed().catch((e) => {
  console.error('Seed failed:', e)
  process.exit(1)
})
