import { getDb } from './db'
import { facilities, users, patients, consultations, diagnostics, diseases, treatments, medications, prescriptions, labCategories, labExams, queue, documents, notifications, auditLogs, archives, syncQueue, clinicalCases, caseNotes, careEpisodes, bedAssignments, beds, episodeEntities, clinicalKnowledgeBase, diseaseStatistics, therapeuticProtocols, similarCaseSearches, helpImages, auditHistory, careCoverages, partnerCompanies, partnerPatients, patientHistory, notificationPreferences, equipmentCategories, medicalEquipment, equipmentLocations, equipmentAssignments, equipmentDocuments, equipmentMaintenance, maintenanceTasks, equipmentIncidents, equipmentLogs, equipmentWarranties, equipmentBookings, equipmentSuppliers, equipmentAudits, spareParts, sparePartInventory, medicalSupplies, supplyBatches, stockMovements, purchaseOrders, purchaseOrderItems, billingCodes } from './schema'
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
  d.setDate(d.getDate() - Math.max(0, n))
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
  { motif: 'Anémie sévère', symptoms: ['Fatigue extrême','Pâleur intense','Dyspnée d\'effort'], diag: 'Anémie ferriprive sévère - Hb 5.8g/dL', treatment: 'Venofer 200mg IV x5 + Fer oral', notes: 'Recherche cause parasitaire (verrerie, paludisme)' },
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
  await db.delete(caseNotes)
  await db.delete(similarCaseSearches)
  await db.delete(bedAssignments)
  await db.delete(beds)
  await db.delete(episodeEntities)
  await db.delete(careEpisodes)
  await db.delete(clinicalKnowledgeBase)
  await db.delete(diseaseStatistics)
  await db.delete(therapeuticProtocols)
  await db.delete(purchaseOrderItems)
  await db.delete(stockMovements)
  await db.delete(supplyBatches)
  await db.delete(purchaseOrders)
  await db.delete(medicalSupplies)
  await db.delete(sparePartInventory)
  await db.delete(spareParts)
  await db.delete(equipmentAudits)
  await db.delete(equipmentBookings)
  await db.delete(equipmentWarranties)
  await db.delete(equipmentLogs)
  await db.delete(equipmentIncidents)
  await db.delete(maintenanceTasks)
  await db.delete(equipmentMaintenance)
  await db.delete(equipmentDocuments)
  await db.delete(equipmentAssignments)
  await db.delete(medicalEquipment)
  await db.delete(equipmentSuppliers)
  await db.delete(equipmentCategories)
  await db.delete(equipmentLocations)
  await db.delete(partnerPatients)
  await db.delete(partnerCompanies)
  await db.delete(patientHistory)
  await db.delete(careCoverages)
  await db.delete(notificationPreferences)
  await db.delete(notifications)
  await db.delete(auditHistory)
  await db.delete(helpImages)
  await db.delete(patients)
  await db.delete(billingCodes)
  await db.delete(users)
  await db.delete(diseases)
  await db.delete(labCategories)
  await db.delete(facilities)
  console.log('  Cleaned all tables\n')

  const insertedFacilities: { id: string }[] = await db.insert(facilities).values(facilityData.map((f) => ({
    ...f, id: uuid(), isActive: true, createdAt: daysAgo(365), updatedAt: new Date(),
  }))).returning({ id: facilities.id })
  console.log(`Facilities: ${insertedFacilities.length}`)

  const billingCodeData = [
    { code: 'CONS001', label: 'Consultation médicale', serviceType: 'CONSULTATION', price: 5000, currency: 'CDF' },
    { code: 'CONS002', label: 'Consultation spécialisée', serviceType: 'CONSULTATION', price: 8000, currency: 'CDF' },
    { code: 'CONS003', label: 'Triage / évaluation initiale', serviceType: 'CONSULTATION', price: 2000, currency: 'CDF' },
    { code: 'LAB001', label: 'Prise de sang complète', serviceType: 'LABORATORY', price: 7500, currency: 'CDF' },
    { code: 'LAB002', label: 'Examen urinaire', serviceType: 'LABORATORY', price: 3000, currency: 'CDF' },
    { code: 'LAB003', label: 'Radiographie thoracique', serviceType: 'LABORATORY', price: 12000, currency: 'CDF' },
    { code: 'MED001', label: 'Médicament - Paracétamol 500 mg', serviceType: 'PHARMACY', price: 1500, currency: 'CDF' },
    { code: 'MED002', label: 'Médicament - Amoxicilline 500 mg', serviceType: 'PHARMACY', price: 2500, currency: 'CDF' },
    { code: 'MED003', label: 'Médicament - Amlodipine 5 mg', serviceType: 'PHARMACY', price: 3000, currency: 'CDF' },
    { code: 'PROC001', label: 'Pose de perfusion', serviceType: 'PROCEDURE', price: 4000, currency: 'CDF' },
    { code: 'PROC002', label: 'Pansement & surveillance', serviceType: 'PROCEDURE', price: 3000, currency: 'CDF' },
    { code: 'HOSP001', label: 'Hospitalisation (jury)', serviceType: 'HOSPITALIZATION', price: 25000, currency: 'CDF' },
  ]

  const insertedBillingCodes: { id: string }[] = await db.insert(billingCodes).values(
    billingCodeData.map((b) => ({
      id: uuid(),
      facilityId: pick(insertedFacilities).id,
      code: b.code,
      label: b.label,
      serviceType: b.serviceType,
      price: b.price,
      currency: b.currency,
      isActive: true,
      createdAt: daysAgo(365),
      updatedAt: new Date(),
    }))
  ).returning({ id: billingCodes.id })
  console.log(`Billing codes: ${insertedBillingCodes.length}`)

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

  const insertedUsers: { id: string }[] = await db.insert(users).values(
    userData.map((u, i) => ({
      id: uuid(), firstname: u.firstname, lastname: u.lastname, email: u.email,
      passwordHash: hashByRole[u.role], role: u.role, facilityId: insertedFacilities[u.facilityIndex].id,
      isActive: true, createdAt: daysAgo(365 - i), updatedAt: new Date(),
    }))
  ).returning({ id: users.id })
  console.log(`Users: ${insertedUsers.length}`)

  const insertedDiseases: { id: string }[] = await db.insert(diseases).values(
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
        id: uuid(), patientUuid: uuid(), dossierNumber: `DOS-${String(idx + 1).padStart(6, '0')}`,
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
      dossierNumber: `DOS-${String(1001 + pi).padStart(6, '0')}`,
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
  const insertedMeds: { id: string }[] = await db.insert(medications).values(
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
  const insertedLabCats: { id: string }[] = await db.insert(labCategories).values(
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
  const insertedCases: { id: string }[] = await db.insert(clinicalCases).values(
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

  console.log('Generating clinical case notes...')
  const noteTemplates = [
    'Signes vitaux stables, poursuite du traitement actuel.',
    'Patient revu en consultation : amélioration des symptômes.',
    'Surveillance des paramètres biologiques, nouvelle ordonnance établie.',
    'Éducation thérapeutique réalisée, bon suivi du traitement.',
    'Consultation de contrôle programmée dans 2 semaines.',
  ]
  const caseNotesBatch: Array<{ id: string; caseId: string; authorId: string; content: string; createdAt: Date }> = []
  for (const cc of insertedCases) {
    const noteCount = 1 + Math.floor(Math.random() * 3)
    for (let n = 0; n < noteCount; n++) {
      caseNotesBatch.push({
        id: uuid(),
        caseId: cc.id,
        authorId: insertedUsers[pick(doctorIndices)].id,
        content: pick(noteTemplates),
        createdAt: daysAgo(Math.floor(Math.random() * 30)),
      })
    }
  }
  const insertedNotes = await db.insert(caseNotes).values(caseNotesBatch).returning({ id: caseNotes.id })
  console.log(`Clinical Case Notes: ${insertedNotes.length}`)

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

  console.log('Generating 20 care episodes...')
  const episodeStatuses = ['ADMITTED','TRIAGE','CONSULTATION','TREATMENT','HOSPITALIZED','DISCHARGED','TRANSFERRED','ARCHIVED'] as const
  const dischargeOutcomes = ['GUERISON','AMELIORATION','DECES','TRANSFERT','FUITE'] as const
  const insertedEpisodes: Array<{ id: string; patientId: string; facilityId: string | null }> = []
  const episodeBatch: Array<Record<string, unknown>> = []
  for (let i = 0; i < 20; i++) {
    const p = pick(insertedPatients)
    const epId = uuid()
    const status = pick(episodeStatuses)
    const admit = daysAgo(randInt(10, 300))
    const daysToAdd = status === 'DISCHARGED' || status === 'ARCHIVED' ? randInt(1, 30) : 0
    const rawDischarge = new Date(admit.getTime() + daysToAdd * 86400000)
    const discharge = status === 'DISCHARGED' || status === 'ARCHIVED' ? (rawDischarge > new Date() ? new Date() : rawDischarge) : null
    const facilityId = pick(insertedFacilities).id
    episodeBatch.push({
      id: epId,
      facilityId,
      patientId: p.id,
      episodeNumber: `EP-${admit.getFullYear()}-${String(i + 1).padStart(6, '0')}`,
      status,
      admitDate: admit,
      dischargeDate: discharge,
      admitReason: pick(['Fièvre persistante','Douleur abdominale aiguë','Traumatisme','Infection respiratoire','Suivi diabète','Hypertension','Anémie','Paludisme récidivant']),
      dischargeSummary: discharge ? { consultationsCount: randInt(1, 5), diagnosticsCount: randInt(1, 3), treatmentsCount: randInt(1, 4) } : {},
      dischargeOutcome: status === 'DISCHARGED' || status === 'ARCHIVED' ? pick(dischargeOutcomes) : null,
      isArchived: status === 'ARCHIVED',
      metadata: {},
      createdAt: admit,
      updatedAt: discharge || admit,
    })
    insertedEpisodes.push({ id: epId, patientId: p.id, facilityId })
  }
  await db.insert(careEpisodes).values(episodeBatch as any)
  console.log(`Care Episodes: ${episodeBatch.length}`)
  console.log('Generating beds + assignments...')
  const bedTypes = ['WARD', 'PRIVATE', 'SEMI_PRIVATE', 'ICU', 'MATERNITY', 'PEDIATRIC', 'OTHER'] as const
  const bedStatuses = ['AVAILABLE', 'OCCUPIED', 'CLEANING', 'OUT_OF_SERVICE', 'RESERVED'] as const
  const rooms = ['101', '102', '103', '104', '201', '202', '301', '302']
  const floors = ['1', '2', '3']
  const departments = ['Medecine', 'Chirurgie', 'Reanimation', 'Pediatrie', 'Maternite']
  const firstFacility = insertedFacilities[0].id
  const bedBatch: any[] = []
  let bedCounter = 1
  for (const room of rooms) {
    const floor = floors[parseInt(room.charAt(0)) - 1] || '1'
    const dept = pick(departments)
    const count = room === '101' ? 6 : (room === '201' ? 4 : (room === '301' ? 2 : 2))
    for (let b = 0; b < count; b++) {
      const number = `${room}-B${b + 1}`
      const isOccupied = bedCounter === 3
      bedBatch.push({
        id: uuid(),
        facilityId: firstFacility,
        locationId: null,
        bedNumber: number,
        floor,
        room,
        department: dept,
        label: `Lit ${number}`,
        type: pick(bedTypes),
        status: isOccupied ? 'OCCUPIED' : (pick(bedStatuses) as any),
        notes: null,
        isActive: true,
        createdAt: daysAgo(60),
        updatedAt: new Date(),
      })
      bedCounter += 1
    }
  }
  const insertedBeds = await db.insert(beds).values(bedBatch).returning({ id: beds.id })
  console.log(`  Beds: ${insertedBeds.length}`)

  const occupiedBed = bedBatch.find((b) => b.status === 'OCCUPIED')
  if (occupiedBed && insertedPatients.length > 0) {
    const patient = pick(insertedPatients)
    const episode = insertedEpisodes.length > 0 ? pick(insertedEpisodes) : null
    await db.insert(bedAssignments).values({
      id: uuid(),
      facilityId: firstFacility,
      bedId: occupiedBed.id,
      patientId: patient.id,
      episodeId: episode ? episode.id : null,
      assignedById: insertedUsers[3].id,
      assignedAt: daysAgo(2),
      releasedAt: null,
      status: 'ACTIVE',
      notes: null,
      isActive: true,
      createdAt: daysAgo(2),
      updatedAt: new Date(),
    })
    console.log('  Bed Assignments: 1')
  }


  console.log('Generating 50 episode entities...')
  const entityTypes = ['CONSULTATION','DIAGNOSIS','TREATMENT','LAB_EXAM','DOCUMENT'] as const
  await db.insert(episodeEntities).values(
    Array.from({ length: 50 }, () => {
      const ep = pick(insertedEpisodes)
      const type = pick(entityTypes)
      let entityId = uuid()
      if (type === 'CONSULTATION' && insertedConsultations.length > 0) {
        entityId = pick(insertedConsultations).id
      } else if (type === 'DIAGNOSIS' && insertedDiagnostics.length > 0) {
        entityId = pick(insertedDiagnostics).id
      } else if (type === 'TREATMENT' && insertedTreatments.length > 0) {
        entityId = pick(insertedTreatments).id
      }
      return {
        id: uuid(),
        episodeId: ep.id,
        entityType: type,
        entityId,
        createdAt: daysAgo(randInt(10, 300)),
      }
    })
  )
  console.log(`Episode Entities: 50`)

  console.log('Generating 30 clinical knowledge base entries...')
  const sexValues = ['M', 'F'] as const
  const evolutionValues = ['GUERISON', 'AMELIORATION', 'DECES'] as const
  const ageRanges = ['0-4','5-14','15-24','25-34','35-44','45-54','55-64','65-74','75+'] as const
  await db.insert(clinicalKnowledgeBase).values(
    Array.from({ length: 30 }, () => {
      const tmpl = pick(clinicalTemplates)
      const disease = pick(insertedDiseases)
      return {
        id: uuid(),
        sourceEpisodeId: null,
        ageRange: pick(ageRanges),
        sex: pick(sexValues),
        symptoms: tmpl.symptoms,
        diagnostics: [tmpl.diag],
        treatments: [tmpl.treatment],
        examResults: { notes: tmpl.notes },
        evolution: pick(evolutionValues),
        durationDays: randInt(1, 45),
        outcome: pick(evolutionValues),
        diseaseId: disease.id,
        facilityId: pick(insertedFacilities).id,
        isAnonymized: true,
        createdAt: daysAgo(randInt(10, 300)),
      }
    })
  )
  console.log(`Clinical Knowledge Base: 30`)

  console.log('Generating 12 disease statistics...')
  await db.insert(diseaseStatistics).values(
    insertedDiseases.map((d) => ({
      id: uuid(),
      diseaseId: d.id,
      totalCases: randInt(5, 200),
      recoveryRate: randInt(40, 95),
      mortalityRate: randInt(1, 30),
      avgHospitalizationDays: randInt(2, 30),
      commonTreatments: [{ name: pick(clinicalTemplates).treatment.split('+')[0].trim(), count: randInt(5, 50) }],
      commonMedications: [{ name: pick(['Artésunate','Metformine','Amlodipine','Ciprofloxacine','Ceftriaxone','Furosémide','Aspirine','Paracétamol','Amoxicilline','Omeprazole']), count: randInt(5, 50) }],
      commonExams: [{ name: pick(['Goutte épaisse','ECG','Radiographie','Scanner','NFS','Glycémie']), count: randInt(5, 50) }],
      commonComplications: [{ name: pick(['Anémie','Insuffisance rénale','Détresse respiratoire','Sepsis','Décès']), count: randInt(1, 20) }],
      lastCalculated: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }))
  )
  console.log(`Disease Statistics: ${insertedDiseases.length}`)

  console.log('Generating 10 therapeutic protocols...')
  const protocolData = [
    { name: 'Paludisme sévère - Adulte', desc: 'Protocole OMS pour paludisme sévère à P. falciparum', diseaseIdx: 0, steps: [{ order: 1, description: 'Artésunate IV 2.4mg/kg à 0h, 12h, 24h', duration: '24h' }, { order: 2, description: 'Arthémer-Luméfantrine PO après 24h', duration: '3 jours' }] },
    { name: 'Pneumonie communautaire', desc: 'Traitement première ligne pneumonie', diseaseIdx: 4, steps: [{ order: 1, description: 'Ceftriaxone 2g IV/jour', duration: '7-10 jours' }, { order: 2, description: 'Azithromycine 500mg PO', duration: '5 jours' }] },
    { name: 'Diabète type 2 - Initiation', desc: 'Protocole d\'initiation Metformine', diseaseIdx: 2, steps: [{ order: 1, description: 'Metformine 500mg 2x/j', duration: '2 semaines' }, { order: 2, description: 'Metformine 1000mg 2x/j', duration: 'continu' }] },
    { name: 'HTA - Première intention', desc: 'Traitement hypertension artérielle', diseaseIdx: 3, steps: [{ order: 1, description: 'Amlodipine 5-10mg PO/j', duration: 'continu' }] },
    { name: 'Anémie ferriprive', desc: 'Correction anémie par fer', diseaseIdx: 7, steps: [{ order: 1, description: 'Venofer 200mg IV x5', duration: '5 jours' }, { order: 2, description: 'Fer oral 3 mois', duration: '3 mois' }] },
    { name: 'Infection urinaire', desc: 'Traitement pyélonéphrite aiguë', diseaseIdx: 6, steps: [{ order: 1, description: 'Ciprofloxacine 500mg 2x/j PO', duration: '14 jours' }] },
    { name: 'Appendicite aiguë', desc: 'Protocole chirurgical appendicite', diseaseIdx: 5, steps: [{ order: 1, description: 'Appendicoscopie sous coelioscopie', duration: 'Urgence' }] },
    { name: 'ICFE - Stabilisation', desc: 'Insuffisance cardiaque décompensée', diseaseIdx: 8, steps: [{ order: 1, description: 'Furosémide IV', duration: 'Aigu' }, { order: 2, description: 'Ramipril + Carvedilol PO', duration: 'continu' }] },
    { name: 'Gastropathie HP+', desc: 'Éradication Helicobacter pylori', diseaseIdx: 9, steps: [{ order: 1, description: 'IPP + Amoxicilline 1g + Clarithromycine 500mg', duration: '14 jours' }] },
    { name: 'Lithiase rénale', desc: 'Traitement colique néphrétique', diseaseIdx: 10, steps: [{ order: 1, description: 'Métamizole 2g IV + Tamsulosine', duration: 'Aigu' }] },
  ]
  await db.insert(therapeuticProtocols).values(
    protocolData.map((p) => ({
      id: uuid(),
      facilityId: pick(insertedFacilities).id,
      diseaseId: insertedDiseases[Math.min(p.diseaseIdx, insertedDiseases.length - 1)]?.id || null,
      name: p.name,
      description: p.desc,
      steps: p.steps,
      targetPopulation: 'Adultes',
      contraindications: [],
      efficacyRate: randInt(60, 95),
      isActive: true,
      createdBy: pick(insertedUsers).id,
      createdAt: daysAgo(randInt(30, 300)),
      updatedAt: daysAgo(randInt(10, 30)),
    }))
  )
  console.log(`Therapeutic Protocols: ${protocolData.length}`)

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

  console.log('\n=== Modules: Prise en charge & Équipements ===\n')

  const equipStatusValues = ['AVAILABLE', 'IN_USE', 'MAINTENANCE', 'BROKEN', 'RESERVED', 'OUT_OF_SERVICE'] as const
  const equipStateValues = ['NEW', 'GOOD', 'FAIR', 'POOR', 'CRITICAL'] as const
  const maintenanceTypes = ['PREVENTIVE', 'CORRECTIVE', 'INSPECTION', 'CALIBRATION', 'VALIDATION', 'REVISION'] as const
  const incidentStatuses = ['OPEN', 'IN_PROGRESS', 'ON_HOLD', 'RESOLVED', 'CLOSED'] as const
  const incidentPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT', 'CRITICAL'] as const
  const bookingStatuses = ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] as const
  const auditTypes = ['INVENTORY', 'STATUS_CHECK', 'REGULATORY', 'QUALITY', 'SAFETY'] as const
  const assignmentTypes = ['DOCTOR', 'NURSE', 'TECHNICIAN', 'DEPARTMENT', 'SERVICE', 'OTHER'] as const
  const docCategories = ['INVOICE', 'CONTRACT', 'WARRANTY', 'MANUAL', 'REPORT', 'CERTIFICATE', 'PHOTO', 'OTHER'] as const
  const coverageTypes = ['PERSONAL', 'INSURANCE', 'MUTUAL', 'COMPANY', 'NGO', 'GOVERNMENT', 'HEALTH_PROJECT', 'PARTNER', 'FREE', 'OTHER'] as const
  const coverageStatuses = ['ACTIVE', 'EXPIRED', 'SUSPENDED'] as const

  console.log('Generating equipment locations...')
  const buildingNames = ['Bâtiment Central', 'Pavillon Mère-Enfant', 'Bloc Technique', 'Aile Chirurgie']
  const departmentNames = ['Urgences', 'Cardiologie', 'Pédiatrie', 'Maternité', 'Radiologie', 'Laboratoire', 'Chirurgie', 'Réanimation', 'Imagerie Médicale']
  const insertedLocations: any[] = []
  const locRoots = insertedFacilities.map((f, fi) => {
    const id = uuid()
    insertedLocations.push({ id, facilityId: f.id })
    return { id, facilityId: f.id, type: 'FACILITY' as const, name: facilityData[fi].name, code: `LOC-${String(fi + 1).padStart(3, '0')}`, description: 'Emplacement racine de l\'établissement', createdAt: daysAgo(365), updatedAt: new Date() }
  })
  await db.insert(equipmentLocations).values(locRoots)
  const locChildren: any[] = []
  insertedFacilities.forEach((f, fi) => {
    if (fi > 2) return
    buildingNames.forEach((b, bi) => {
      const bId = uuid()
      insertedLocations.push({ id: bId, facilityId: f.id })
      locChildren.push({ id: bId, facilityId: f.id, parentId: locRoots[fi].id, type: 'BUILDING', name: b, building: b, code: `BLD-${fi}-${bi}`, description: null, createdAt: daysAgo(300), updatedAt: new Date() })
      departmentNames.forEach((d, di) => {
        const dId = uuid()
        insertedLocations.push({ id: dId, facilityId: f.id })
        locChildren.push({ id: dId, facilityId: f.id, parentId: bId, type: 'DEPARTMENT', name: d, building: b, department: d, code: `DEP-${fi}-${bi}-${di}`, description: null, createdAt: daysAgo(280), updatedAt: new Date() })
        if (bi === 0 && di === 0) {
          const rId = uuid()
          insertedLocations.push({ id: rId, facilityId: f.id })
          locChildren.push({ id: rId, facilityId: f.id, parentId: dId, type: 'ROOM', name: 'Salle 101', building: b, department: d, room: '101', code: `RM-${fi}-101`, description: null, createdAt: daysAgo(270), updatedAt: new Date() })
        }
      })
    })
  })
  await db.insert(equipmentLocations).values(locChildren)
  console.log(`Equipment Locations: ${insertedLocations.length}`)

  console.log('Generating equipment categories...')
  const categoryRoots = [
    { name: 'Imagerie', icon: 'scanner', color: '#0ea5e9', description: 'Équipements d\'imagerie médicale' },
    { name: 'Cardiologie', icon: 'heart', color: '#ef4444', description: 'Équipements cardiologiques' },
    { name: 'Laboratoire', icon: 'flask', color: '#8b5cf6', description: 'Équipements de laboratoire' },
    { name: 'Mobilier médical', icon: 'bed', color: '#10b981', description: 'Mobilier et literie' },
    { name: 'Informatique', icon: 'monitor', color: '#6366f1', description: 'Matériel informatique' },
    { name: 'Réanimation', icon: 'lungs', color: '#f59e0b', description: 'Équipements de réanimation' },
    { name: 'Chirurgie', icon: 'scissors', color: '#14b8a6', description: 'Équipements de bloc opératoire' },
    { name: 'Biologie', icon: 'microscope', color: '#ec4899', description: 'Instruments de biologie' },
  ]
  const insertedCategories: Array<{ id: string; facilityId: string | null }> = []
  const catRootRows = categoryRoots.map((c) => ({ id: uuid(), facilityId: pick(insertedFacilities).id, ...c, isActive: true, createdAt: daysAgo(365), updatedAt: new Date() }))
  insertedCategories.push(...catRootRows.map((c) => ({ id: c.id, facilityId: c.facilityId })))
  await db.insert(equipmentCategories).values(catRootRows)
  const subCatDefs = [
    ['Échographes', 0], ['Radiographie', 0], ['Scanners', 0], ['IRM', 0],
    ['Électrocardiographes', 1], ['Moniteurs cardiaques', 1], ['Holter', 1],
    ['Centrifuges', 2], ['Analyseurs biochimiques', 2], ['Hématologie', 2],
    ['Lits hospitaliers', 3], ['Fauteuils roulants', 3], ['Chariots', 3],
    ['Ordinateurs', 4], ['Serveurs', 4], ['Imprimantes', 4],
    ['Respirateurs', 5], ['Moniteurs de signes vitaux', 5], ['Pompes à perfusion', 5],
    ['Tables d\'opération', 6], ['Éclairage chirurgical', 6], ['Instrumentation', 6],
    ['Microscopes', 7], ['Centrifuges de paillasse', 7],
  ] as const
  const subCatRows = subCatDefs.map(([name, parentIdx]) => ({
    id: uuid(), facilityId: catRootRows[parentIdx].facilityId, parentId: catRootRows[parentIdx].id,
    name, icon: null, color: null, description: null, isActive: true, createdAt: daysAgo(300), updatedAt: new Date(),
  }))
  insertedCategories.push(...subCatRows.map((c) => ({ id: c.id, facilityId: c.facilityId })))
  await db.insert(equipmentCategories).values(subCatRows)
  console.log(`Equipment Categories: ${insertedCategories.length}`)

  console.log('Generating equipment suppliers...')
  const supplierData = [
    { code: 'SUP-001', name: 'GE Healthcare Afrique Centrale', contactPerson: 'M. Kabamba', phone: '+243 81 700 1001', email: 'contact@gehealth.drc.cd', address: 'Avenue du Commerce, Gombe', city: 'Kinshasa', category: 'Équipements biomédicaux', rating: 4, notes: 'Fabricant agréé' },
    { code: 'SUP-002', name: 'Siemens Healthineers DRC', contactPerson: 'Mme Nzuzi', phone: '+243 81 700 1002', email: 'info@siemens.drc.cd', address: 'Boulevard du 30 Juin, Gombe', city: 'Kinshasa', category: 'Imagerie', rating: 5, notes: null },
    { code: 'SUP-003', name: 'MediSupply Congo', contactPerson: 'M. Ilunga', phone: '+243 81 700 1003', email: 'ventes@medisupply.cd', address: 'Avenue Sendwe, Limete', city: 'Kinshasa', category: 'Consommables', rating: 3, notes: null },
    { code: 'SUP-004', name: 'Pharmacie Centrale Kinshasa', contactPerson: 'Mme Bemba', phone: '+243 81 700 1004', email: 'pharm@pck.cd', address: 'Avenue Tombalbaye, Limete', city: 'Kinshasa', category: 'Réactifs & intrants', rating: 4, notes: null },
    { code: 'SUP-005', name: 'Labo Diagnostic Equipment', contactPerson: 'M. Tshala', phone: '+243 81 700 1005', email: 'sales@labeq.cd', address: 'Avenue des Aviateurs, Gombe', city: 'Kinshasa', category: 'Laboratoire', rating: 4, notes: null },
    { code: 'SUP-006', name: 'Africatel Medical', contactPerson: 'Mme Kanku', phone: '+243 81 700 1006', email: 'contact@africatel.cd', address: 'Avenue Kasa-Vubu, Kalamu', city: 'Kinshasa', category: 'Informatique médicale', rating: 3, notes: null },
    { code: 'SUP-007', name: 'Mobilier Hospitalier SA', contactPerson: 'M. Mbala', phone: '+243 81 700 1007', email: 'info@mobilierhosp.cd', address: 'Boulevard Lumumba, Masina', city: 'Kinshasa', category: 'Mobilier', rating: 3, notes: null },
    { code: 'SUP-008', name: 'Santech DRC', contactPerson: 'M. Mvumbi', phone: '+243 81 700 1008', email: 'sales@santech.cd', address: 'Avenue de la Paix, Ngaliema', city: 'Kinshasa', category: 'Maintenance & pièces', rating: 4, notes: null },
    { code: 'SUP-009', name: 'Philips Medical Congo', contactPerson: 'Mme Yema', phone: '+243 81 700 1009', email: 'contact@philips.cd', address: 'Avenue du Port, Gombe', city: 'Kinshasa', category: 'Équipements', rating: 5, notes: null },
    { code: 'SUP-010', name: 'Groupe Medical du Congo', contactPerson: 'M. Lufwa', phone: '+243 81 700 1010', email: 'info@gmc.cd', address: 'Avenue des Batetela, Limete', city: 'Kinshasa', category: 'Divers', rating: 3, notes: null },
  ]
  const insertedSuppliers: { id: string }[] = await db.insert(equipmentSuppliers).values(
    supplierData.map((s) => ({ id: uuid(), facilityId: pick(insertedFacilities).id, ...s, isActive: true, createdBy: pick(insertedUsers).id, updatedBy: pick(insertedUsers).id, createdAt: daysAgo(365), updatedAt: new Date() }))
  ).returning({ id: equipmentSuppliers.id })
  console.log(`Equipment Suppliers: ${insertedSuppliers.length}`)

  console.log('Generating 120 medical equipment items...')
  const equipNameData = [
    { name: 'Échographe Doppler', type: 'BIOMEDICAL', manufacturer: 'GE', brand: 'GE Healthcare', model: 'Voluson E10' },
    { name: 'Radiographie mobile', type: 'BIOMEDICAL', manufacturer: 'Siemens', brand: 'Siemens', model: 'Mobilett Elara Max' },
    { name: 'Scanner 64 coupes', type: 'BIOMEDICAL', manufacturer: 'Siemens', brand: 'Siemens', model: 'SOMATOM go.Up' },
    { name: 'Électrocardiographe 12 pistes', type: 'BIOMEDICAL', manufacturer: 'Fukuda', brand: 'Fukuda', model: 'FX-8322' },
    { name: 'Centrifugeuse de paillasse', type: 'BIOMEDICAL', manufacturer: 'HERMLE', brand: 'HERMLE', model: 'Z 306' },
    { name: 'Analyseur biochimique', type: 'BIOMEDICAL', manufacturer: 'Mindray', brand: 'Mindray', model: 'BS-240' },
    { name: 'Lit électrique hospitalier', type: 'FURNITURE', manufacturer: 'Malvestio', brand: 'Malvestio', model: 'M5' },
    { name: 'Fauteuil roulant', type: 'FURNITURE', manufacturer: 'Karma', brand: 'Karma', model: 'S-1050' },
    { name: 'Ordinateur de bureau', type: 'IT', manufacturer: 'HP', brand: 'HP', model: 'ProDesk 400' },
    { name: 'Serveur rack', type: 'IT', manufacturer: 'Dell', brand: 'Dell', model: 'PowerEdge R650' },
    { name: 'Respirateur de réanimation', type: 'BIOMEDICAL', manufacturer: 'Hamilton', brand: 'Hamilton', model: 'C6' },
    { name: 'Moniteur de signes vitaux', type: 'BIOMEDICAL', manufacturer: 'Mindray', brand: 'Mindray', model: 'ePM 12M' },
    { name: 'Table d\'opération', type: 'MEDICAL', manufacturer: 'Maquet', brand: 'Maquet', model: 'Magnus' },
    { name: 'Éclairage chirurgical', type: 'MEDICAL', manufacturer: 'Mölnlycke', brand: 'Mölnlycke', model: 'PowerLED' },
    { name: 'Microscope binoculaire', type: 'BIOMEDICAL', manufacturer: 'Leica', brand: 'Leica', model: 'DM500' },
    { name: 'Autoclave', type: 'BIOMEDICAL', manufacturer: 'Tuttnauer', brand: 'Tuttnauer', model: '3870E' },
    { name: 'Pompe à perfusion', type: 'BIOMEDICAL', manufacturer: 'Fresenius', brand: 'Fresenius', model: 'Injectomat Agilia' },
    { name: 'Défibrillateur', type: 'BIOMEDICAL', manufacturer: 'Zoll', brand: 'Zoll', model: 'R Series' },
    { name: 'Pèse-personne médical', type: 'MEDICAL', manufacturer: 'Seca', brand: 'Seca', model: '769' },
    { name: 'Oxygénateur mobile', type: 'BIOMEDICAL', manufacturer: 'Oxy', brand: 'Oxy', model: 'O2-M10' },
  ]
  const equipBatch: any[] = []
  for (let i = 0; i < 120; i++) {
    const e = equipNameData[i % equipNameData.length]
    const fac = pick(insertedFacilities)
    const locPool = insertedLocations.filter((l) => l.facilityId === fac.id)
    const loc = locPool.length ? pick(locPool) : pick(insertedLocations)
    const purchased = daysAgo(randInt(90, 1400))
    const commissioned = new Date(purchased.getTime() + randInt(5, 45) * 86400000).toISOString().split('T')[0]
    equipBatch.push({
      id: uuid(), facilityId: fac.id, code: `EQ-${String(i + 1).padStart(4, '0')}`,
      qrCode: `QR-${i + 1}`, barcode: `BC-${i + 1}`,
      name: e.name, description: `${e.brand} ${e.model}`,
      type: e.type, categoryId: pick(insertedCategories).id,
      subCategoryId: Math.random() > 0.5 ? pick(insertedCategories).id : null,
      manufacturer: e.manufacturer, brand: e.brand, model: e.model,
      serialNumber: `SN-${e.manufacturer.slice(0, 2).toUpperCase()}-${randInt(10000, 99999)}`,
      purchaseDate: purchased.toISOString().split('T')[0], purchasePrice: randInt(50000, 9000000),
      currency: pick(['CDF', 'USD']), warrantyMonths: pick([6, 12, 24, 36, 48, 60]), lifecycleYears: randInt(3, 10),
      state: pick(equipStateValues), status: pick(equipStatusValues),
      responsibleUserId: pick(insertedUsers).id, locationId: loc.id,
      building: loc.type === 'BUILDING' ? loc.name : null,
      department: loc.department ?? null,
      room: loc.room ?? null,
      commissioningDate: commissioned,
      comments: Math.random() > 0.7 ? 'Bon état général' : null,
      createdBy: pick(insertedUsers).id, updatedBy: pick(insertedUsers).id,
      createdAt: purchased, updatedAt: new Date(),
    })
  }
  const insertedEquipment: { id: string }[] = await db.insert(medicalEquipment).values(equipBatch).returning({ id: medicalEquipment.id })
  console.log(`Medical Equipment: ${insertedEquipment.length}`)

  console.log('Generating equipment assignments...')
  const assignmentBatch: any[] = []
  insertedEquipment.forEach((eq, i) => {
    if (i % 3 === 0) return
    const start = daysAgo(randInt(5, 500))
    assignmentBatch.push({
      id: uuid(), facilityId: pick(insertedFacilities).id, equipmentId: eq.id,
      assignedToType: pick(assignmentTypes), assignedToId: uuid(),
      assignedToName: pick(['Dr Kabongo', 'Service Cardiologie', 'Radiologie', 'Laboratoire', 'Bloc opératoire', 'Dr Clovis', 'Urgences']),
      department: pick(departmentNames),
      startedAt: start, endedAt: Math.random() > 0.5 ? new Date(Math.min(start.getTime() + randInt(10, 200) * 86400000, Date.now())) : null,
      notes: Math.random() > 0.6 ? 'Affectation en cours' : null,
      createdBy: pick(insertedUsers).id, updatedBy: pick(insertedUsers).id, createdAt: start, updatedAt: new Date(),
    })
  })
  await db.insert(equipmentAssignments).values(assignmentBatch)
  console.log(`Equipment Assignments: ${assignmentBatch.length}`)

  console.log('Generating equipment documents...')
  const docBatch: any[] = []
  insertedEquipment.forEach((eq, i) => {
    if (i % 4 !== 0) return
    docBatch.push({
      id: uuid(), facilityId: pick(insertedFacilities).id, equipmentId: eq.id,
      title: pick(['Manuel d\'utilisation', 'Facture d\'achat', 'Certificat de garantie', 'Rapport d\'installation', 'Plan de maintenance', 'Photographie d\'inventaire']),
      category: pick(docCategories), filePath: null, fileType: pick(['pdf', 'png', 'jpg']), fileSize: randInt(100000, 8000000),
      version: 1, description: 'Document interne',
      createdBy: pick(insertedUsers).id, updatedBy: pick(insertedUsers).id, createdAt: daysAgo(randInt(30, 600)), updatedAt: new Date(),
    })
  })
  await db.insert(equipmentDocuments).values(docBatch)
  console.log(`Equipment Documents: ${docBatch.length}`)

  console.log('Generating equipment maintenance...')
  const insertedMaintenance: { id: string }[] = []
  const maintBatch: any[] = []
  for (let i = 0; i < 45; i++) {
    const eq = pick(insertedEquipment)
    const mId = uuid()
    const type = pick(maintenanceTypes)
    const completed = Math.random() > 0.35
    const status = completed ? 'COMPLETED' : pick(['SCHEDULED', 'SCHEDULED', 'IN_PROGRESS', 'OVERDUE'])
    const scheduled = daysAgo(randInt(5, 200))
    const started = completed || status === 'IN_PROGRESS' ? new Date(Math.min(scheduled.getTime() + randInt(1, 5) * 86400000, Date.now())) : null
    const finished = completed ? new Date(Math.min((started || scheduled).getTime() + randInt(1, 4) * 86400000, Date.now())) : null
    maintBatch.push({
      id: mId, facilityId: pick(insertedFacilities).id, equipmentId: eq.id,
      maintenanceType: type, status,
      scheduledDate: scheduled.toISOString().split('T')[0], startedAt: started, completedAt: finished,
      technicianUserId: pick(insertedUsers).id, technicianName: pick(['Ing. Mbuyi', 'Technicien Lumbala', 'Ing. Kasongo', 'Technicien Tshala']),
      company: Math.random() > 0.4 ? 'Service technique interne' : pick(supplierData.map((s) => s.name)),
      cost: randInt(20000, 1500000), currency: 'CDF', durationHours: randInt(2, 24),
      priority: pick(incidentPriorities), report: completed ? 'Maintenance effectuée conformément au manuel constructeur' : null,
      photos: [], partsReplaced: Math.random() > 0.6 ? [{ name: pick(['Filtre', 'Joint', 'Électrode', 'Batterie']), quantity: randInt(1, 3), cost: randInt(5000, 50000) }] : [],
      signature: completed ? 'Signé' : null, notes: Math.random() > 0.5 ? 'À renouveler dans 6 mois' : null,
      createdBy: pick(insertedUsers).id, updatedBy: pick(insertedUsers).id, createdAt: scheduled, updatedAt: finished || new Date(),
    })
    insertedMaintenance.push({ id: mId })
  }
  await db.insert(equipmentMaintenance).values(maintBatch)
  console.log(`Equipment Maintenance: ${insertedMaintenance.length}`)

  console.log('Generating maintenance tasks...')
  const taskBatch: any[] = []
  insertedMaintenance.forEach((m, i) => {
    const count = 1 + (i % 3)
    for (let t = 0; t < count; t++) {
      taskBatch.push({
        id: uuid(), facilityId: pick(insertedFacilities).id, maintenanceId: m.id,
        title: pick(['Contrôle visuel', 'Test fonctionnel', 'Nettoyage des filtres', 'Calibrage capteurs', 'Vérification sécurité électrique', 'Remplacement pièces']),
        description: 'Tâche de maintenance', status: pick(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED']),
        completedAt: Math.random() > 0.5 ? daysAgo(randInt(1, 60)) : null,
        completedBy: Math.random() > 0.5 ? pick(insertedUsers).id : null,
        createdBy: pick(insertedUsers).id, updatedBy: pick(insertedUsers).id, createdAt: daysAgo(randInt(10, 150)), updatedAt: new Date(),
      })
    }
  })
  await db.insert(maintenanceTasks).values(taskBatch)
  console.log(`Maintenance Tasks: ${taskBatch.length}`)

  console.log('Generating equipment incidents...')
  const incidentBatch: any[] = []
  for (let i = 0; i < 25; i++) {
    const eq = pick(insertedEquipment)
    const status = pick(incidentStatuses)
    const resolved = status === 'RESOLVED' || status === 'CLOSED'
    incidentBatch.push({
      id: uuid(), facilityId: pick(insertedFacilities).id, equipmentId: eq.id,
      title: pick(['Panne répétée', 'Dysfonctionnement capteur', 'Coupure de courant', 'Surchauffe', 'Écran défaillant', 'Fuite de liquide']),
      description: 'Incident signalé pendant l\'utilisation', priority: pick(incidentPriorities), status,
      reportedByUserId: pick(insertedUsers).id, assignedToUserId: Math.random() > 0.4 ? pick(insertedUsers).id : null,
      resolvedAt: resolved ? daysAgo(randInt(1, 90)) : null,
      resolutionNotes: resolved ? 'Intervention technique réalisée' : null,
      rootCause: Math.random() > 0.5 ? 'Usure normale' : null, cost: resolved ? randInt(10000, 500000) : null,
      createdBy: pick(insertedUsers).id, updatedBy: pick(insertedUsers).id, createdAt: daysAgo(randInt(1, 200)), updatedAt: new Date(),
    })
  }
  await db.insert(equipmentIncidents).values(incidentBatch)
  console.log(`Equipment Incidents: ${incidentBatch.length}`)

  console.log('Generating equipment logs...')
  const logBatch: any[] = []
  const logActions = ['CREATED', 'UPDATED', 'ASSIGNED', 'MAINTENANCE', 'LOCATION_CHANGED', 'STATUS_CHANGED', 'AUDITED']
  insertedEquipment.forEach((eq, i) => {
    if (i % 2 !== 0) return
    const count = randInt(1, 3)
    for (let l = 0; l < count; l++) {
      logBatch.push({
        id: uuid(), facilityId: pick(insertedFacilities).id, equipmentId: eq.id,
        action: pick(logActions), details: { description: pick(['Fiche créée', 'Mise à jour d\'informations', 'Affectation modifiée', 'Maintenance planifiée']) },
        userId: pick(insertedUsers).id, createdBy: pick(insertedUsers).id, updatedBy: pick(insertedUsers).id,
        createdAt: daysAgo(randInt(1, 300)), updatedAt: new Date(),
      })
    }
  })
  await db.insert(equipmentLogs).values(logBatch)
  console.log(`Equipment Logs: ${logBatch.length}`)

  console.log('Generating equipment warranties...')
  const warrantyBatch: any[] = []
  insertedEquipment.forEach((eq, i) => {
    if (i % 3 === 0) return
    const start = daysAgo(randInt(30, 600))
    const end = new Date(start.getTime() + pick([6, 12, 24, 36, 48]) * 30 * 86400000)
    const expired = end < new Date()
    warrantyBatch.push({
      id: uuid(), facilityId: pick(insertedFacilities).id, equipmentId: eq.id,
      supplierId: Math.random() > 0.5 ? pick(insertedSuppliers).id : null,
      startDate: start.toISOString().split('T')[0], endDate: end.toISOString().split('T')[0],
      status: expired ? 'EXPIRED' : pick(['ACTIVE', 'ACTIVE', 'ACTIVE', 'CLAIMED']),
      coverage: 'Pièces et main d\'œuvre', terms: 'Garantie constructeur standard',
      cost: randInt(50000, 2000000), notes: null,
      createdBy: pick(insertedUsers).id, updatedBy: pick(insertedUsers).id, createdAt: start, updatedAt: new Date(),
    })
  })
  await db.insert(equipmentWarranties).values(warrantyBatch)
  console.log(`Equipment Warranties: ${warrantyBatch.length}`)

  console.log('Generating equipment bookings...')
  const bookingBatch: any[] = []
  for (let i = 0; i < 35; i++) {
    const eq = pick(insertedEquipment)
    const start = daysAgo(randInt(-5, 30))
    const end = new Date(start.getTime() + randInt(1, 6) * 3600000)
    bookingBatch.push({
      id: uuid(), facilityId: pick(insertedFacilities).id, equipmentId: eq.id,
      bookedByUserId: pick(insertedUsers).id, assignedToName: pick(['Dr Kabongo', 'Dr Clovis', 'Radiologie', 'Laboratoire']), assignedToId: uuid(),
      purpose: pick(['Examen programmé', 'Intervention chirurgicale', 'Maintenance', 'Formation', 'Test']),
      startTime: start, endTime: end, status: pick(bookingStatuses), notes: Math.random() > 0.6 ? 'Demande interne' : null,
      createdBy: pick(insertedUsers).id, updatedBy: pick(insertedUsers).id, createdAt: daysAgo(randInt(1, 30)), updatedAt: new Date(),
    })
  }
  await db.insert(equipmentBookings).values(bookingBatch)
  console.log(`Equipment Bookings: ${bookingBatch.length}`)

  console.log('Generating equipment audits...')
  const auditBatch: any[] = []
  insertedEquipment.forEach((eq, i) => {
    if (i % 4 !== 0) return
    const auditDate = daysAgo(randInt(5, 300))
    const next = new Date(auditDate.getTime() + randInt(90, 365) * 86400000)
    auditBatch.push({
      id: uuid(), facilityId: pick(insertedFacilities).id, equipmentId: eq.id,
      auditType: pick(auditTypes), auditedByUserId: pick(insertedUsers).id,
      auditDate: auditDate.toISOString().split('T')[0], status: pick(equipStateValues),
      findings: [{ label: 'Conformité', result: pick(['OK', 'OK', 'À surveiller', 'Non conforme']), note: null }],
      nextAuditDate: next.toISOString().split('T')[0], notes: null,
      createdBy: pick(insertedUsers).id, updatedBy: pick(insertedUsers).id, createdAt: auditDate, updatedAt: new Date(),
    })
  })
  await db.insert(equipmentAudits).values(auditBatch)
  console.log(`Equipment Audits: ${auditBatch.length}`)

  console.log('Generating spare parts...')
  const sparePartData = [
    { name: 'Électrodes ECG jetables', sku: 'SP-ECG-001', manufacturer: 'Philips' },
    { name: 'Pile interne défibrillateur', sku: 'SP-ZOLL-001', manufacturer: 'Zoll' },
    { name: 'Filtre expiratoire respirateur', sku: 'SP-HAM-001', manufacturer: 'Hamilton' },
    { name: 'Cartouche analyseur biochimique', sku: 'SP-BS-001', manufacturer: 'Mindray' },
    { name: 'Ampoule éclairage chirurgical', sku: 'SP-LED-001', manufacturer: 'Maquet' },
    { name: 'Roulette lit hospitalier', sku: 'SP-MAL-001', manufacturer: 'Malvestio' },
    { name: 'Clavier et souris médical', sku: 'SP-HP-001', manufacturer: 'HP' },
    { name: 'Transducteur échographie', sku: 'SP-GE-001', manufacturer: 'GE' },
    { name: 'Tuyau oxygène renforcé', sku: 'SP-OXY-001', manufacturer: 'Oxy' },
    { name: 'Capteur SpO2', sku: 'SP-SPO2-001', manufacturer: 'Mindray' },
    { name: 'Disque dur serveur', sku: 'SP-DELL-001', manufacturer: 'Dell' },
    { name: 'Sonotrode endoscopie', sku: 'SP-END-001', manufacturer: 'Olympus' },
  ]
  const insertedSpareParts: { id: string; name: string }[] = await db.insert(spareParts).values(
    sparePartData.map((s, i) => ({
      id: uuid(), facilityId: pick(insertedFacilities).id, code: `SP-${String(i + 1).padStart(3, '0')}`,
      sku: s.sku, name: s.name, categoryId: pick(insertedCategories).id,
      description: 'Pièce de rechange', unit: 'piece', manufacturer: s.manufacturer,
      supplierId: pick(insertedSuppliers).id, isActive: true,
      createdBy: pick(insertedUsers).id, updatedBy: pick(insertedUsers).id, createdAt: daysAgo(365), updatedAt: new Date(),
    }))
  ).returning({ id: spareParts.id, name: spareParts.name })
  console.log(`Spare Parts: ${insertedSpareParts.length}`)

  console.log('Generating spare part inventory...')
  await db.insert(sparePartInventory).values(
    insertedSpareParts.map((p) => ({
      id: uuid(), facilityId: pick(insertedFacilities).id, sparePartId: p.id,
      location: pick(['MAIN', 'MAIN', 'MAINTENANCE', 'MEDICAL']),
      quantity: randInt(0, 60), minThreshold: randInt(2, 10),
      unitCost: randInt(5000, 500000), currency: pick(['CDF', 'USD']),
      createdBy: pick(insertedUsers).id, updatedBy: pick(insertedUsers).id, createdAt: daysAgo(365), updatedAt: new Date(),
    }))
  )
  console.log(`Spare Part Inventory: ${insertedSpareParts.length}`)

  console.log('Generating medical supplies...')
  const supplyData = [
    { name: 'Gants nitrile non stériles T7', code: 'SUPPLY-001', sku: 'SKU-GLO-001', category: 'GLOVES', unit: 'boîte', minStock: 100, criticalStock: 25, price: 12000 },
    { name: 'Seringues 5ml', code: 'SUPPLY-002', sku: 'SKU-SYR-005', category: 'SYRINGES', unit: 'boîte de 100', minStock: 80, criticalStock: 20, price: 15000 },
    { name: 'Seringues 10ml', code: 'SUPPLY-003', sku: 'SKU-SYR-010', category: 'SYRINGES', unit: 'boîte de 100', minStock: 80, criticalStock: 20, price: 18000 },
    { name: 'Compresses stériles 10x10', code: 'SUPPLY-004', sku: 'SKU-COM-001', category: 'COMPRESSES', unit: 'paquet', minStock: 120, criticalStock: 30, price: 4000 },
    { name: 'Masques chirurgicaux', code: 'SUPPLY-005', sku: 'SKU-MAS-001', category: 'MASKS', unit: 'boîte de 50', minStock: 150, criticalStock: 40, price: 9000 },
    { name: 'Réactif NFS', code: 'SUPPLY-006', sku: 'SKU-REA-001', category: 'REAGENTS', unit: 'flacon', minStock: 30, criticalStock: 8, price: 85000 },
    { name: 'Cathéters IV 22G', code: 'SUPPLY-007', sku: 'SKU-CAT-001', category: 'CATHETERS', unit: 'boîte de 50', minStock: 60, criticalStock: 15, price: 22000 },
    { name: 'Poches NaCl 0,9% 500ml', code: 'SUPPLY-008', sku: 'SKU-IVB-001', category: 'IV_BAGS', unit: 'unité', minStock: 200, criticalStock: 50, price: 2500 },
    { name: 'Perfuseurs', code: 'SUPPLY-009', sku: 'SKU-PER-001', category: 'PERFUSION', unit: 'unité', minStock: 150, criticalStock: 40, price: 2000 },
    { name: 'Fils de suture 2/0', code: 'SUPPLY-010', sku: 'SKU-SUT-001', category: 'SUTURES', unit: 'boîte', minStock: 40, criticalStock: 10, price: 60000 },
    { name: 'Bandages élastiques 10cm', code: 'SUPPLY-011', sku: 'SKU-BAN-001', category: 'BANDAGES', unit: 'rouleau', minStock: 100, criticalStock: 25, price: 3500 },
    { name: 'Désinfectant de surface', code: 'SUPPLY-012', sku: 'SKU-DIS-001', category: 'DISINFECTANTS', unit: 'bidon 5L', minStock: 50, criticalStock: 12, price: 45000 },
    { name: 'Gants chirurgicaux stériles', code: 'SUPPLY-013', sku: 'SKU-GLO-002', category: 'GLOVES', unit: 'boîte', minStock: 70, criticalStock: 18, price: 16000 },
    { name: 'Seringues 2ml', code: 'SUPPLY-014', sku: 'SKU-SYR-002', category: 'SYRINGES', unit: 'boîte de 100', minStock: 80, criticalStock: 20, price: 13000 },
    { name: 'Test rapide paludisme', code: 'SUPPLY-015', sku: 'SKU-REA-002', category: 'REAGENTS', unit: 'boîte de 25', minStock: 40, criticalStock: 10, price: 30000 },
    { name: 'Sac de suture auto-absorbable', code: 'SUPPLY-016', sku: 'SKU-SUT-002', category: 'SUTURES', unit: 'boîte', minStock: 35, criticalStock: 8, price: 55000 },
  ]
  const insertedSupplies: { id: string; name: string }[] = await db.insert(medicalSupplies).values(
    supplyData.map((s) => ({ id: uuid(), facilityId: pick(insertedFacilities).id, ...s, description: null, supplierId: pick(insertedSuppliers).id, isActive: true, createdBy: pick(insertedUsers).id, updatedBy: pick(insertedUsers).id, createdAt: daysAgo(365), updatedAt: new Date() })) as any
  ).returning({ id: medicalSupplies.id, name: medicalSupplies.name })
  console.log(`Medical Supplies: ${insertedSupplies.length}`)

  console.log('Generating purchase orders...')
  const insertedOrders: { id: string }[] = []
  const poBatch: any[] = []
  for (let i = 0; i < 20; i++) {
    const oId = uuid()
    const orderDate = daysAgo(randInt(10, 300))
    const received = Math.random() > 0.3
    const expected = new Date(orderDate.getTime() + randInt(10, 45) * 86400000)
    poBatch.push({
      id: oId, facilityId: pick(insertedFacilities).id, orderNumber: `PO-${String(i + 1).padStart(6, '0')}`,
      supplierId: pick(insertedSuppliers).id, orderDate: orderDate.toISOString().split('T')[0],
      expectedDate: expected.toISOString().split('T')[0], receivedDate: received ? expected.toISOString().split('T')[0] : null,
      status: received ? pick(['RECEIVED', 'RECEIVED', 'PARTIAL']) : pick(['DRAFT', 'SUBMITTED', 'ORDERED', 'PARTIAL']),
      totalAmount: 0, currency: 'CDF', notes: Math.random() > 0.5 ? 'Commande réapprovisionnement' : null,
      createdBy: pick(insertedUsers).id, updatedBy: pick(insertedUsers).id, createdAt: orderDate, updatedAt: new Date(),
    })
    insertedOrders.push({ id: oId })
  }
  await db.insert(purchaseOrders).values(poBatch)
  console.log(`Purchase Orders: ${insertedOrders.length}`)

  console.log('Generating purchase order items...')
  const poiBatch: any[] = []
  insertedOrders.forEach((o, i) => {
    const count = 2 + (i % 3)
    for (let k = 0; k < count; k++) {
      const isSupply = Math.random() > 0.5
      const supply = isSupply ? pick(insertedSupplies) : null
      const spare = !isSupply ? pick(insertedSpareParts) : null
      const qty = randInt(10, 500)
      const unitPrice = isSupply ? pick(supplyData).price : randInt(8000, 300000)
      poiBatch.push({
        id: uuid(), facilityId: pick(insertedFacilities).id, orderId: o.id,
        itemType: isSupply ? 'supply' : 'spare_part', supplyId: supply ? supply.id : null, sparePartId: spare ? spare.id : null, equipmentId: null,
        description: supply ? supply.name : spare ? spare.name : 'Article commandé',
        quantity: qty, unitPrice, totalPrice: qty * unitPrice, receivedQuantity: Math.random() > 0.5 ? qty : randInt(0, qty),
        createdBy: pick(insertedUsers).id, updatedBy: pick(insertedUsers).id, createdAt: daysAgo(randInt(10, 300)), updatedAt: new Date(),
      })
    }
  })
  await db.insert(purchaseOrderItems).values(poiBatch)
  console.log(`Purchase Order Items: ${poiBatch.length}`)

  console.log('Generating supply batches...')
  const batchRows: any[] = []
  insertedSupplies.forEach((s, i) => {
    if (i % 2 !== 0) return
    const count = 1 + (i % 3)
    for (let b = 0; b < count; b++) {
      const received = daysAgo(randInt(5, 200))
      const exp = new Date(received.getTime() + randInt(6, 24) * 30 * 86400000)
      batchRows.push({
        id: uuid(), facilityId: pick(insertedFacilities).id, supplyId: s.id,
        batchNumber: `B-${String(i + 1).padStart(3, '0')}-${b + 1}`, lotNumber: `LOT-${String(i + 1).padStart(4, '0')}${b}`,
        manufacturerDate: received.toISOString().split('T')[0], expiryDate: exp.toISOString().split('T')[0],
        quantity: randInt(20, 500), receivedDate: received.toISOString().split('T')[0],
        supplierId: pick(insertedSuppliers).id, purchaseOrderId: Math.random() > 0.4 ? pick(insertedOrders).id : null,
        createdBy: pick(insertedUsers).id, updatedBy: pick(insertedUsers).id, createdAt: received, updatedAt: new Date(),
      })
    }
  })
  await db.insert(supplyBatches).values(batchRows)
  console.log(`Supply Batches: ${batchRows.length}`)

  console.log('Generating stock movements...')
  const stockBatch: any[] = []
  insertedSupplies.forEach((s, i) => {
    const count = 1 + (i % 4)
    for (let m = 0; m < count; m++) {
      const isReceipt = m === 0
      stockBatch.push({
        id: uuid(), facilityId: pick(insertedFacilities).id, supplyId: s.id,
        batchId: Math.random() > 0.5 && batchRows.length ? pick(batchRows).id : null,
        movementType: isReceipt ? 'RECEIPT' : pick(['ISSUE', 'ISSUE', 'ADJUSTMENT', 'RETURN', 'EXPIRED']),
        quantity: isReceipt ? randInt(20, 300) : -randInt(10, 150),
        unitCost: isReceipt ? pick(supplyData).price : null,
        fromLocation: isReceipt ? 'MAIN' : null, toLocation: isReceipt ? 'MAIN' : null,
        reason: isReceipt ? 'Réception commande' : pick(['Consommation service', 'Perte constatée', 'Retour fournisseur', 'Péremption']),
        referenceId: Math.random() > 0.5 ? `PO-${String(randInt(1, 20)).padStart(6, '0')}` : null,
        createdBy: pick(insertedUsers).id, updatedBy: pick(insertedUsers).id, createdAt: daysAgo(randInt(1, 200)), updatedAt: new Date(),
      })
    }
  })
  await db.insert(stockMovements).values(stockBatch)
  console.log(`Stock Movements: ${stockBatch.length}`)

  console.log('Generating partner companies...')
  const partnerData = [
    { code: 'PTN-001', name: 'Ministère de la Santé Publique', sector: 'Gouvernement', city: 'Kinshasa', phone: '+243 81 200 1001', email: 'contact@minisan.cd', contactName: 'M. Kalume', contactFunction: 'Directeur', coverageRate: 100 },
    { code: 'PTN-002', name: 'CNSS', sector: 'Sécurité sociale', city: 'Kinshasa', phone: '+243 81 200 1002', email: 'cnss@cnss.cd', contactName: 'Mme Banza', contactFunction: 'Chef service', coverageRate: 80 },
    { code: 'PTN-003', name: 'INPP', sector: 'Prévoyance', city: 'Kinshasa', phone: '+243 81 200 1003', email: 'info@inpp.cd', contactName: 'M. Tshibanda', contactFunction: 'Directeur adjoint', coverageRate: 75 },
    { code: 'PTN-004', name: 'OMS - RDC', sector: 'Organisation internationale', city: 'Kinshasa', phone: '+243 81 200 1004', email: 'oms@who.int', contactName: 'Dr Ngoma', contactFunction: 'Représentant', coverageRate: 100 },
    { code: 'PTN-005', name: 'MSF Belgique', sector: 'ONG', city: 'Kinshasa', phone: '+243 81 200 1005', email: 'msf@msf.be', contactName: 'M. Van Dijck', contactFunction: 'Coordinateur', coverageRate: 90 },
    { code: 'PTN-006', name: 'Gécamines SA', sector: 'Entreprise minière', city: 'Lubumbashi', phone: '+243 81 200 1006', email: 'sante@gecamines.cd', contactName: 'Mme Kabeya', contactFunction: 'RH Santé', coverageRate: 70 },
    { code: 'PTN-007', name: 'SNEL', sector: 'Énergie', city: 'Kinshasa', phone: '+243 81 200 1007', email: 'social@snel.cd', contactName: 'M. Bakole', contactFunction: 'Responsable social', coverageRate: 65 },
    { code: 'PTN-008', name: 'Bralima', sector: 'Industrie', city: 'Kinshasa', phone: '+243 81 200 1008', email: 'rh@bralima.cd', contactName: 'Mme Ilunga', contactFunction: 'Médecin d\'entreprise', coverageRate: 85 },
    { code: 'PTN-009', name: 'Croix-Rouge RDC', sector: 'ONG', city: 'Kinshasa', phone: '+243 81 200 1009', email: 'info@croixrouge.cd', contactName: 'M. Lushiku', contactFunction: 'Secrétaire général', coverageRate: 50 },
    { code: 'PTN-010', name: 'Fonds Social RDC', sector: 'ONG', city: 'Kinshasa', phone: '+243 81 200 1010', email: 'contact@fondssocial.cd', contactName: 'M. Kamwanya', contactFunction: 'Chargé de projets', coverageRate: 60 },
  ]
  const insertedPartners: { id: string }[] = await db.insert(partnerCompanies).values(
    partnerData.map((p) => ({
      id: uuid(), facilityId: pick(insertedFacilities).id, ...p,
      address: 'Avenue de la Convention', country: 'RD Congo', website: null,
      contactPhone: '+243 81 200 0000', contactEmail: p.email,
      contractNumber: `CT-${p.code.slice(-3)}`, contractStartDate: '2025-01-01', contractEndDate: '2026-12-31',
      contractStatus: 'ACTIVE', annualCeiling: randInt(1000000, 50000000), notes: null, isActive: true,
      createdAt: daysAgo(365), updatedAt: new Date(),
    })) as any
  ).returning({ id: partnerCompanies.id })
  console.log(`Partner Companies: ${insertedPartners.length}`)

  console.log('Generating care coverages...')
  const coverageBatch: any[] = []
  insertedPatients.forEach((p, i) => {
    if (i % 5 !== 0) return
    const type = pick(coverageTypes)
    const status = pick(coverageStatuses)
    const from = daysAgo(randInt(30, 700))
    const until = new Date(from.getTime() + randInt(30, 365) * 86400000)
    const rate = type === 'PERSONAL' || type === 'FREE' ? 0 : randInt(40, 100)
    coverageBatch.push({
      id: uuid(), facilityId: pick(insertedFacilities).id, patientId: p.id,
      coverageType: type,
      organization: type === 'COMPANY' ? pick(partnerData).name : type === 'INSURANCE' ? pick(['CNSS', 'INPP', 'INAM']) : type === 'NGO' ? pick(['MSF', 'Croix-Rouge']) : type === 'GOVERNMENT' ? 'Ministère de la Santé' : null,
      contractNumber: Math.random() > 0.3 ? `CONV-${randInt(10000, 99999)}` : null,
      coverageRate: rate, coverageCeiling: randInt(50000, 5000000), remainingAmount: randInt(0, 3000000),
      validFrom: from.toISOString().split('T')[0], validUntil: status === 'ACTIVE' ? until.toISOString().split('T')[0] : null,
      status, justification: Math.random() > 0.6 ? 'Justificatif disponible' : null, isActive: true,
      createdAt: from, updatedAt: new Date(),
    })
  })
  await db.insert(careCoverages).values(coverageBatch)
  console.log(`Care Coverages: ${coverageBatch.length}`)

  console.log('Generating partner patients...')
  const ppBatch: any[] = []
  insertedPatients.forEach((p, i) => {
    if (i % 12 !== 0) return
    const partner = pick(insertedPartners)
    const from = daysAgo(randInt(30, 500))
    const until = new Date(from.getTime() + randInt(90, 400) * 86400000)
    ppBatch.push({
      id: uuid(), facilityId: pick(insertedFacilities).id, partnerId: partner.id, patientId: p.id,
      contractNumber: `PTN-${randInt(10000, 99999)}`, coverageRate: randInt(50, 100),
      annualCeiling: randInt(500000, 5000000), remainingAmount: randInt(0, 3000000),
      validFrom: from.toISOString().split('T')[0], validUntil: until.toISOString().split('T')[0],
      status: pick(coverageStatuses), notes: null, isActive: true, createdAt: from, updatedAt: new Date(),
    })
  })
  await db.insert(partnerPatients).values(ppBatch)
  console.log(`Partner Patients: ${ppBatch.length}`)

  console.log('Generating patient history...')
  const historyTypes = ['CONSULTATION', 'DIAGNOSIS', 'TREATMENT', 'LAB_EXAM', 'ADMISSION', 'DISCHARGE', 'DOCUMENT', 'PRESCRIPTION', 'COVERAGE', 'PAYMENT']
  const historyTitles = ['Consultation médicale', 'Diagnostic posé', 'Traitement prescrit', 'Examen de laboratoire', 'Admission', 'Sortie du patient', 'Document généré', 'Ordonnance délivrée', 'Prise en charge mise à jour', 'Paiement effectué']
  const historyBatch: any[] = []
  insertedPatients.forEach((p, i) => {
    if (i % 3 !== 0) return
    const count = 1 + (i % 5)
    for (let h = 0; h < count; h++) {
      const type = pick(historyTypes)
      historyBatch.push({
        id: uuid(), facilityId: pick(insertedFacilities).id, patientId: p.id,
        episodeId: Math.random() > 0.6 ? pick(insertedEpisodes).id : null,
        eventType: type, title: pick(historyTitles),
        description: pick(['Événement enregistré dans le dossier du patient', 'Suivi clinique', 'Mise à jour du dossier']),
        performedBy: Math.random() > 0.3 ? pick(insertedUsers).id : null,
        performedByName: pick(['Dr Kabongo', 'Dr Clovis', 'Dr Espérance', 'Infirmier Mohamed', 'Réception Yasmine']),
        metadata: { source: 'seed' }, createdAt: daysAgo(randInt(1, 365)),
      })
    }
  })
  await db.insert(patientHistory).values(historyBatch)
  console.log(`Patient History: ${historyBatch.length}`)

  console.log('Generating notification preferences...')
  await db.insert(notificationPreferences).values(
    insertedUsers.map((u) => ({
      id: uuid(), userId: u.id, soundEnabled: Math.random() > 0.3, volume: randInt(0, 100),
      notificationTypes: ['INFO', 'WARNING', 'SUCCESS', 'ERROR'], services: ['LABORATORY', 'PHARMACY', 'IMAGERY', 'HOSPITALIZATION', 'RECEPTION', 'ADMINISTRATION'],
      isActive: true, createdAt: daysAgo(365), updatedAt: new Date(),
    }))
  )
  console.log(`Notification Preferences: ${insertedUsers.length}`)

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
  console.log(`  Care Episodes:      ${episodeBatch.length}`)
  console.log(`  Episode Entities:   50`)
  console.log(`  Knowledge Base:     30`)
  console.log(`  Disease Statistics: ${insertedDiseases.length}`)
  console.log(`  Therapeutic Protocols: ${protocolData.length}`)
  console.log(`  Equipment Locations:  ${insertedLocations.length}`)
  console.log(`  Equipment Categories: ${insertedCategories.length}`)
  console.log(`  Equipment Suppliers:  ${insertedSuppliers.length}`)
  console.log(`  Medical Equipment:    ${insertedEquipment.length}`)
  console.log(`  Assignments:          ${assignmentBatch.length}`)
  console.log(`  Equipment Docs:       ${docBatch.length}`)
  console.log(`  Maintenance:          ${insertedMaintenance.length}`)
  console.log(`  Maintenance Tasks:    ${taskBatch.length}`)
  console.log(`  Incidents:            ${incidentBatch.length}`)
  console.log(`  Equipment Logs:       ${logBatch.length}`)
  console.log(`  Warranties:           ${warrantyBatch.length}`)
  console.log(`  Bookings:             ${bookingBatch.length}`)
  console.log(`  Audits:               ${auditBatch.length}`)
  console.log(`  Spare Parts:          ${insertedSpareParts.length}`)
  console.log(`  Medical Supplies:     ${insertedSupplies.length}`)
  console.log(`  Supply Batches:       ${batchRows.length}`)
  console.log(`  Stock Movements:      ${stockBatch.length}`)
  console.log(`  Purchase Orders:      ${insertedOrders.length}`)
  console.log(`  PO Items:             ${poiBatch.length}`)
  console.log(`  Care Coverages:       ${coverageBatch.length}`)
  console.log(`  Partner Companies:    ${insertedPartners.length}`)
  console.log(`  Partner Patients:     ${ppBatch.length}`)
  console.log(`  Patient History:      ${historyBatch.length}`)
  console.log(`  Notification Prefs:   ${insertedUsers.length}`)
  console.log(`  TOTAL:              ~${insertedPatients.length + insertedConsultations.length + diagnosticsCount + insertedTreatments.length + prescCount + labCount + insertedCases.length + auditEntries.length + insertedNotifs.length + 420}`)
}

seed().catch((e) => {
  console.error('Seed failed:', e)
  process.exit(1)
})
