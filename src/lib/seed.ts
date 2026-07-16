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

function daysAgo(n: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(8 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 60), 0, 0)
  return d
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function pickN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, n)
}

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
  { firstname: 'Joséphine', lastname: 'Mukendi', email: 'dr.josephine@medinsight.cd', role: R.DOCTOR, facilityIndex: 9 },
  { firstname: 'Serge', lastname: 'Bakajika', email: 'dr.serge@medinsight.cd', role: R.DOCTOR, facilityIndex: 4 },
  { firstname: 'Consolée', lastname: 'Bakonga', email: 'nurse.consolee@medinsight.cd', role: R.NURSE, facilityIndex: 0 },
  { firstname: 'Pierrette', lastname: 'Nlandu', email: 'nurse.pierrette@medinsight.cd', role: R.NURSE, facilityIndex: 1 },
  { firstname: 'Norbert', lastname: 'Kasongo', email: 'nurse.norbert@medinsight.cd', role: R.NURSE, facilityIndex: 5 },
  { firstname: 'Espérance', lastname: 'Ilunga', email: 'researcher@medinsight.cd', role: R.RESEARCHER, facilityIndex: 0 },
  { firstname: 'Françoise', lastname: 'Kenge', email: 'francoise.research@medinsight.cd', role: R.RESEARCHER, facilityIndex: 4 },
  { firstname: 'Clovis', lastname: 'Lukusa', email: 'clovis.viewer@medinsight.cd', role: R.VIEWER, facilityIndex: 0 },
  { firstname: 'Bernadette', lastname: 'Mbuyi', email: 'bernadette.viewer@medinsight.cd', role: R.VIEWER, facilityIndex: 5 },
]

const firstNamesM = ['Félix','Aristide','Célestin','Sylvain','Augustin','Norbert','Clovis','Gilbert','Emmanuel','Olivier','Bertin','Dieudonné','Théodore','Vianney','Serge','Blaise','Justin','Modeste','Pascal','Rodrigue','Fabrice','Gaëtan','Hervé','Landry','Marcel','Prosper','Stanis','Thierry','Yves']
const firstNamesF = ['Jeanne','Hélène','Béatrice','Cécile','Monique','Grâce','Espérance','Bernadette','Consolée','Françoise','Pierrette','Solange','Marie','Françoise','Joséphine','Clémentine','Furaha','Gloria','Hortense','Inès','Josiane','Léontine','Mireille','Nadine','Olga','Patricia','Régine','Sylvie','Thérèse','Yvette']
const lastNames = ['Tshisekedi','Lubaya','Kabila','Diangienda','Mobutu','Ngoma','Kasai','Kalonji','Lumumba','Kasa','Tshombe','Nsenda','Kabongo','Luyindula','Batumona','Kilangi','Ngalula','Kanku','Lokwa','Nzemba','Kabinda','Mwanza','Katumbi','Lualaba','Kenge','Mbuyi','Lukusa','Mutombo','Ilunga','Tshimanga','Mukendi','Bakajika',' Kasongo','Bakonga','Tshilombo']
const bloodGroups = ['A+','A-','B+','B-','AB+','AB-','O+','O+','O+','O-']
const streets = ['Avenue de la Paix','Boulevard du 30 Juin','Avenue Sendwe','Boulevard Lumumba','Rue Kasa-Vubu','Avenue Mombo','Avenue Tombalbaye','Boulevard Kasavubu','Rue des Écoles','Avenue Kasa-Vubu','Boulevard Katumbi','Route de Limete','Avenue du Cinquantenaire','Avenue Kasavubu','Boulevard Mangengeng']
const communes = ['Gombe','Lingwala','Ngaliema','Limete','Kalamu','Bandalungwa','Masina','Kintambo','Ngaba','Makala','Barumbu','Ndjili']
const allergies = ['Pénicilline','Aspirine','Iode','Latex','AINS','Morphine','Sulfamides','Pollens','Crustacés','Acariens','Arachides','Null']

const clinicalTemplates = [
  { title: 'Paludisme sévère à Plasmodium falciparum', desc: 'Fièvre élevée depuis 5 jours, parasitémie à 200 000/µL. Hb 8g/dL.', symptoms: 'Fièvre 40°C, frissons, sueurs, anémie, splénomégalie', diag: 'Paludisme sévère - P. falciparum', treatment: 'Artesunate IV 2.4mg/kg puis ACT per os', duration: '7 jours', tags: ['infectiologie','paludisme','urgence'], priority: 'critical' },
  { title: 'Diabète de type 2 décompensé', desc: 'Glycémie 3.2g/L. HbA1c 10.5%. IMC 32.', symptoms: 'Polyurie, polydipsie, fatigue, perte de poids', diag: 'Diabète type 2 - HbA1c 10.5%', treatment: 'Metformine 1000mg 2x/j + Gliclazide 80mg', duration: '6 mois', tags: ['endocrinologie','chronique'], priority: 'high' },
  { title: 'Hypertension artérielle sévère', desc: 'HTA sévère PAS 185/115. Risque cardiovasculaire élevé.', symptoms: 'Céphalées occipitales, vertiges, épistaxis', diag: 'HTA sévère - Risque CV élevé', treatment: 'Amlodipine 10mg + Lisinopril 20mg + Indapamide 1.5mg LP', duration: 'Indéterminé', tags: ['cardiologie','chronique'], priority: 'high' },
  { title: 'Asthme bronchique persistant', desc: 'Asthme déclenché par pollens. VEMS 65%.', symptoms: 'Dyspnée paroxystique, sifflements, toux nocturne', diag: 'Asthme allergique persistant - VEMS 65%', treatment: 'Beclométasone 400mcg/j + Formotérol 12mcg', duration: 'Permanente', tags: ['pneumologie','allergie'], priority: 'medium' },
  { title: 'Insuffisance cardiaque aiguë', desc: 'ICFE décompensée. FEVG 28%. Antécédent IAM.', symptoms: 'Dyspnée de repos, orthopnée, œdèmes MI', diag: 'ICFE NYHA III - FEVG 28%', treatment: 'Furosémide IV + Ramipril + Carvedilol + Spironolactone', duration: 'Longue durée', tags: ['cardiologie','urgence'], priority: 'critical' },
  { title: 'Gastrite à Helicobacter pylori', desc: 'Douleurs gastriques depuis 3 semaines. Hp positif.', symptoms: 'Douleur épigastrique, brûlures, ballonnements', diag: 'Gastrite antrale - Hp positif', treatment: 'IPP + Amoxicilline 1g + Clarithromycine 500mg (14j)', duration: '2 semaines', tags: ['gastro','infection'], priority: 'medium' },
  { title: 'Colique néphrétique', desc: 'Lithiase rénale droite 9mm. Douleur aiguë.', symptoms: 'Douleur lombaire fulgurante, nausées, hématurie', diag: 'Lithiase rénale droite 9mm', treatment: 'Métamizole 2g IV + Tamsulosine + Lithotripsie', duration: '1 mois', tags: ['urologie','urgence'], priority: 'high' },
  { title: 'Appendicite aiguë', desc: 'Appendicite confirmée au scanner. Alvarado 9.', symptoms: 'Douleur FID aiguë, fièvre 38.8°C, nausées', diag: 'Appendicite aiguë non compliquée', treatment: 'Appendicoscopie sous coelioscopie', duration: '1 semaine', tags: ['chirurgie','urgence'], priority: 'critical' },
  { title: 'Infection urinaire basse', desc: 'Cystite aiguë. E.coli 10^6 UFC/mL.', symptoms: 'Dysurie, pollakiurie, brûlures mictionnelles', diag: 'Cystite aiguë - E.coli', treatment: 'Fosfomycine 3g dose unique', duration: '3 jours', tags: ['infectiologie','urologie'], priority: 'low' },
  { title: 'Pneumonie communautaire', desc: 'Pneumonie lobaire droite. CRP 190.', symptoms: 'Fièvre 39.8°C, toux productive, dyspnée', diag: 'Pneumonie lobaire - CRB-65: 1', treatment: 'Amoxicilline 1g 3x/j + Azithromycine', duration: '10 jours', tags: ['pneumologie','infection'], priority: 'high' },
  { title: 'Fibrillation atriale paroxystique', desc: 'FA paroxystique. CHA2DS2-VASc 2.', symptoms: 'Palpitations, dyspnée d\'effort, pouls irrégulier', diag: 'FA paroxystique - CHA2DS2-VASc 2', treatment: 'Apixaban 5mg 2x/j + Bisoprolol 5mg', duration: 'Indéterminé', tags: ['cardiologie','arythmie'], priority: 'high' },
  { title: 'Dépression majeure', desc: 'Épisode dépressif sévère. PHQ-9 score 20.', symptoms: 'Tristesse persistante, anhédonie, insomnie', diag: 'TDM sévère - PHQ-9: 20', treatment: 'Sertraline 100mg/j + TCC', duration: '12 mois', tags: ['psychiatrie','santé-mentale'], priority: 'high' },
  { title: 'Syndrome métabolique', desc: 'IMC 33, PA 145/95, glycémie 1.20g/L.', symptoms: 'Obésité abdominale, fatigue, essoufflement', diag: 'Syndrome métabolique - ATP III', treatment: 'Régime hypocalorique + Metformine 850mg', duration: '12 mois', tags: ['endocrinologie','métabolisme'], priority: 'high' },
  { title: 'Hernie discale L5-S1', desc: 'Hernie discale compressive racine S1 gauche.', symptoms: 'Douleur sciatique, déficit sensitif S1', diag: 'Hernie discale L5-S1 gauche', treatment: 'Corticoïdes périduraux + Pregabaline + Kiné', duration: '3 mois', tags: ['neurochirurgie','douleur'], priority: 'high' },
  { title: 'Urticaire chronique', desc: 'Urticaire spontanée depuis 7 mois.', symptoms: 'Plaques urticariennes prurigineuses', diag: 'Urticaire chronique spontanée', treatment: 'Cétirizine 20mg/j + Omalizumab si échec', duration: '6 mois', tags: ['dermatologie','allergie'], priority: 'medium' },
  { title: 'Insuffisance rénale chronique', desc: 'IRC stade 4 - DFG 20. Néphropathie diabétique.', symptoms: 'Fatigue, prurit, œdèmes, nausées', diag: 'IRC stade 4 - Néphropathie diabétique', treatment: 'EPO + Fer IV + Régime hyposodé + IEC', duration: 'Longue durée', tags: ['néphrologie','dialyse'], priority: 'critical' },
  { title: 'Grossesse normale - Suivi', desc: 'G2P1 - SA 28 semaines. Grossesse évolutive.', symptoms: 'Suivi de grossesse normale', diag: 'Grossesse unique SA 28 semaines', treatment: 'Acide folique + Fer + Calcium', duration: '12 semaines', tags: ['obstétrique','grossesse'], priority: 'medium' },
  { title: 'Gonarthrose bilatérale', desc: 'Arthrose genou stade 2-3. IMC 29.', symptoms: 'Douleur mécanique, raideur matinale', diag: 'Gonarthrose stade 2-3', treatment: 'Paracétamol + AINS topique + Kiné', duration: '6 mois', tags: ['rhumatologie','orthopédie'], priority: 'medium' },
  { title: 'Polyarthrite rhumatoïde', desc: 'PR séropositive. FR 130, anti-CCP 280.', symptoms: 'Raideur matinale >2h, douleurs articulaires', diag: 'PR séropositive - stade erosif', treatment: 'Méthotrexate 15mg/semaine SC + Prednisone', duration: 'Longue durée', tags: ['rhumatologie','auto-immune'], priority: 'high' },
  { title: 'Céphalées de tension chronique', desc: 'Céphalées quotidiennes depuis 2 ans.', symptoms: 'Douleur oppressante bilatérale, casque', diag: 'Céphalées tensionnelles + Overuse', treatment: 'Amitriptyline 25mg + Arrêt AINS + Relaxation', duration: '3 mois', tags: ['neurologie','douleur'], priority: 'medium' },
  { title: 'MPOC GOLD stade II', desc: 'VEMS/CVF 52%. Fumeur 35 paquets-années.', symptoms: 'Dyspnée d\'effort, toux productive', diag: 'MPOC GOLD II - VEMS/CVF 52%', treatment: 'Tiotropium 18mcg/j + Salbutamol PRN', duration: 'Longue durée', tags: ['pneumologie','chronique'], priority: 'high' },
  { title: 'Névralgie du trijumeau', desc: 'Douleur faciale paroxystique V2-V3 depuis 7 mois.', symptoms: 'Douleur fulgurante joue et mâchoire', diag: 'Névralgie trijumeau classique V2/V3', treatment: 'Carbamazépine 200mg 2x/j + IRM', duration: '6 mois', tags: ['neurologie','douleur'], priority: 'high' },
  { title: 'Anémie ferriprive sévère', desc: 'Hb 6.5g/dL, ferritine 3 ng/mL.', symptoms: 'Fatigue extrême, pâleur, dyspnée', diag: 'Anémie ferriprive sévère', treatment: 'Venofer 200mg IV x5 + Fer oral', duration: '3 mois', tags: ['hématologie','nutrition'], priority: 'high' },
  { title: 'Cataracte sénile bilatérale', desc: 'Baisse AV depuis 1 an. AV OD 2/10, OG 3/10.', symptoms: 'Baisse acuité visuelle, éblouissement', diag: 'Cataracte sénile bilatérale', treatment: 'Phacoémulsification + IOL', duration: '2 semaines', tags: ['ophtalmologie','chirurgie'], priority: 'medium' },
  { title: 'Lupus érythémateux systémique', desc: 'PLESS. ANA+, anti-dsDNA+. Atteinte rénale.', symptoms: 'Érythème ailes de papillon, arthralgies', diag: 'PLESS - SLICC 9 - Néphropathie IV', treatment: 'Corticoïdes + Mycophénolate + Hydroxychloroquine', duration: 'Longue durée', tags: ['rhumatologie','auto-immune'], priority: 'critical' },
  { title: 'Diabète type 1 - Mauvais contrôle', desc: 'DT1 jeune adulte. HbA1c 11.2%. DKA il y a 8 mois.', symptoms: 'Polyurie, polydipsie, amaigrissement', diag: 'DT1 - HbA1c 11.2%', treatment: 'Pompe à insuline + Éducation thérapeutique', duration: 'Indéterminé', tags: ['endocrinologie','diabète'], priority: 'critical' },
  { title: 'Cancer du côlon stade II', desc: 'Adénocarcinome côlon ascendant pT3N0M0.', symptoms: 'Rectorragies, amaigrissement 9kg, anémie', diag: 'Adénocarcinome côlon pT3N0M0', treatment: 'Hémicollectomie + FOLFOX 12 cycles', duration: '6 mois', tags: ['oncologie','chirurgie'], priority: 'critical' },
  { title: 'BPCO aiguë surinfectée', desc: 'Exacerbation BPCO. VEMS 32%. Expectoration purulente.', symptoms: 'Dyspnée aiguë, fièvre 39.5°C, wheezing', diag: 'Exacerbation BPCO - Infection', treatment: 'Amoxicilline-clavulanique + Prednisone 40mg', duration: '10 jours', tags: ['pneumologie','infection'], priority: 'high' },
  { title: 'Arthrose cervicale', desc: 'Spondylarthrose C5-C7. Douleurs chroniques.', symptoms: 'Douleurs cervicales, céphalées postérieures', diag: 'Spondylarthrose cervicale C5-C7', treatment: 'Kiné cervicale + AINS + Collier nocturne', duration: '3 mois', tags: ['orthopédie','rachis'], priority: 'medium' },
  { title: 'Gastropathie par AINS', desc: 'Ulcération gastrique. Hématémèse.', symptoms: 'Hématémèse, méléna, douleur épigastrique', diag: 'Ulcère gastrique induit par AINS', treatment: 'Arrêt AINS + Esoméprazole 40mg IV', duration: '2 mois', tags: ['gastro','urgence'], priority: 'high' },
  { title: 'Dermatite atopique sévère', desc: 'Eczéma chronique. SCORAD 55.', symptoms: 'Prurit intense nocturne, lichenification', diag: 'Dermatite atopique sévère - SCORAD 55', treatment: 'Corticoïde + Émollients + Dupilumab', duration: '6 mois', tags: ['dermatologie','chronique'], priority: 'high' },
  { title: 'Hypothyroïdie subclinique', desc: 'TSH 9.0 mUI/L. Fatigue chronique.', symptoms: 'Fatigue, prise de poids, intolérance froid', diag: 'Hypothyroïdie subclinique', treatment: 'Lévothyroxine 50mcg/j', duration: 'Indéterminé', tags: ['endocrinologie','thyroïde'], priority: 'medium' },
]

function generatePatients(count: number) {
  const pts: Array<{ facilityIndex: number; firstname: string; lastname: string; sex: string; age: number; bloodGroup: string; phone: string; address: string; dateOfBirth: string; allergies: string[] }> = []
  for (let i = 0; i < count; i++) {
    const sex = Math.random() > 0.48 ? 'M' : 'F'
    const age = 2 + Math.floor(Math.random() * 85)
    const birthYear = 2026 - age
    const birthMonth = 1 + Math.floor(Math.random() * 12)
    const birthDay = 1 + Math.floor(Math.random() * 28)
    const allg = pick(allergies)
    pts.push({
      facilityIndex: Math.floor(Math.random() * 10),
      firstname: sex === 'M' ? pick(firstNamesM) : pick(firstNamesF),
      lastname: pick(lastNames).trim(),
      sex,
      age,
      bloodGroup: pick(bloodGroups),
      phone: `+243 81 ${300 + Math.floor(Math.random() * 700)} ${String(1000 + i).padStart(4, '0')}`,
      address: `${pick(streets)}, ${pick(communes)}, Kinshasa`,
      dateOfBirth: `${birthYear}-${String(birthMonth).padStart(2, '0')}-${String(birthDay).padStart(2, '0')}`,
      allergies: allg === 'Null' ? [] : [allg],
    })
  }
  return pts
}

function generateCases(
  patientCount: number,
  doctorIndices: number[],
  facilityCount: number,
) {
  const cases: Array<{
    facilityIndex: number
    patientIndex: number
    doctorIndex: number
    template: typeof clinicalTemplates[number]
    daysAgo: number
    status: string
  }> = []

  for (let i = 0; i < 150; i++) {
    const pi = Math.floor(Math.random() * patientCount)
    const di = pick(doctorIndices)
    const template = pick(clinicalTemplates)
    const age = Math.floor(Math.random() * 180)

    let status: string
    if (age > 150) status = 'SUCCESS'
    else if (age > 120) status = Math.random() > 0.3 ? 'SUCCESS' : 'FAILURE'
    else if (age > 60) status = Math.random() > 0.4 ? 'IN_PROGRESS' : 'SUCCESS'
    else if (age > 30) status = Math.random() > 0.5 ? 'IN_PROGRESS' : 'PENDING'
    else status = 'PENDING'

    cases.push({
      facilityIndex: Math.floor(Math.random() * facilityCount),
      patientIndex: pi,
      doctorIndex: di,
      template,
      daysAgo: age,
      status,
    })
  }

  return cases.sort((a, b) => a.daysAgo - b.daysAgo)
}

async function seed() {
  console.log('🌱 Seeding database with 6 months of Kinshasa medical data...')

  const db = getDb()

  await db.delete(auditLogs)
  await db.delete(clinicalCases)
  await db.delete(patients)
  await db.delete(users)
  await db.delete(facilities)
  console.log('  ✓ Cleaned existing data')

  const insertedFacilities = await db.insert(facilities).values(facilityData.map((f) => ({
    ...f,
    id: crypto.randomUUID(),
    isActive: true,
    createdAt: daysAgo(180),
    updatedAt: new Date(),
  }))).returning({ id: facilities.id })
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
    userData.map((u, i) => ({
      id: crypto.randomUUID(),
      firstname: u.firstname,
      lastname: u.lastname,
      email: u.email,
      passwordHash: hashByRole[u.role],
      role: u.role,
      facilityId: insertedFacilities[u.facilityIndex].id,
      isActive: true,
      createdAt: daysAgo(180 - i),
      updatedAt: new Date(),
    }))
  ).returning({ id: users.id })
  console.log(`  ✓ ${insertedUsers.length} users`)

  const patientData = generatePatients(100)

  const insertedPatients = await db.insert(patients).values(
    patientData.map((p, i) => ({
      id: crypto.randomUUID(),
      facilityId: insertedFacilities[p.facilityIndex].id,
      patientUuid: crypto.randomUUID(),
      firstname: p.firstname,
      lastname: p.lastname,
      sex: p.sex,
      age: p.age,
      bloodGroup: p.bloodGroup,
      phone: p.phone,
      email: `${p.firstname.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')}.${p.lastname.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')}@email.cd`,
      address: p.address,
      dateOfBirth: p.dateOfBirth,
      allergies: p.allergies,
      medicalHistoryJson: {},
      isActive: true,
      createdAt: daysAgo(180 - i),
      updatedAt: new Date(),
    }))
  ).returning({ id: patients.id })
  console.log(`  ✓ ${insertedPatients.length} patients`)

  const doctorIndices = [2,3,4,5,6,7,8,9,10,11,12,13,14]
  const caseData = generateCases(insertedPatients.length, doctorIndices, insertedFacilities.length)

  const insertedCases = await db.insert(clinicalCases).values(
    caseData.map((c) => ({
      id: crypto.randomUUID(),
      facilityId: insertedFacilities[c.facilityIndex].id,
      patientId: insertedPatients[c.patientIndex].id,
      doctorId: insertedUsers[c.doctorIndex].id,
      title: c.template.title,
      description: c.template.desc,
      symptomsJson: { description: c.template.symptoms },
      provisionalDiagnosis: c.template.diag,
      treatment: c.template.treatment,
      treatmentDuration: c.template.duration,
      outcomeStatus: c.status as 'PENDING' | 'IN_PROGRESS' | 'SUCCESS' | 'FAILURE',
      outcomeNotes: c.status === 'SUCCESS' ? 'Patient guéri, suivi programmé' : c.status === 'FAILURE' ? 'Échec du traitement, réorientation' : undefined,
      priority: c.template.priority,
      tagsJson: { tags: c.template.tags },
      isSynced: true,
      createdAt: daysAgo(c.daysAgo),
      updatedAt: daysAgo(Math.max(0, c.daysAgo - Math.floor(Math.random() * 15))),
    }))
  ).returning({ id: clinicalCases.id })
  console.log(`  ✓ ${insertedCases.length} clinical cases`)

  const auditActions = ['LOGIN','CREATE','UPDATE','VIEW','DELETE'] as const
  const auditResources = ['auth','clinical_case','patient','facility','user','audit'] as const
  const ips = ['192.168.1.1','192.168.1.10','192.168.1.15','192.168.1.20','192.168.1.30','10.0.0.5','10.0.0.12','172.16.0.8']

  const auditEntries: Array<{
    userId: string
    facilityId: string
    action: string
    resource: string
    resourceId: string
    details: Record<string, unknown>
    ipAddress: string
    timestamp: Date
  }> = []

  for (let i = 0; i < 100; i++) {
    const action = pick([...auditActions])
    const resource = pick([...auditResources])
    const userIndex = Math.floor(Math.random() * insertedUsers.length)
    const patientIndex = Math.floor(Math.random() * insertedPatients.length)
    const caseIndex = Math.floor(Math.random() * insertedCases.length)

    let details: Record<string, unknown> = {}
    if (action === 'CREATE') details = { title: insertedCases[caseIndex]?.title || 'Nouveau cas' }
    else if (action === 'UPDATE') details = { field: 'outcome_status', old: 'PENDING', new: 'IN_PROGRESS' }
    else if (action === 'VIEW') details = { name: `${patientData[patientIndex].firstname} ${patientData[patientIndex].lastname}` }
    else if (action === 'LOGIN') details = { method: 'password' }

    auditEntries.push({
      id: crypto.randomUUID(),
      userId: insertedUsers[userIndex].id,
      facilityId: insertedFacilities[Math.floor(Math.random() * insertedFacilities.length)].id,
      action,
      resource,
      resourceId: resource === 'patient' ? insertedPatients[patientIndex].id : resource === 'clinical_case' ? insertedCases[caseIndex].id : insertedUsers[userIndex].id,
      details,
      ipAddress: pick(ips),
      timestamp: daysAgo(Math.floor(Math.random() * 180)),
    })
  }

  await db.insert(auditLogs).values(auditEntries)
  console.log(`  ✓ ${auditEntries.length} audit logs`)

  const statusCounts = { PENDING: 0, IN_PROGRESS: 0, SUCCESS: 0, FAILURE: 0 }
  caseData.forEach(c => { statusCounts[c.status as keyof typeof statusCounts]++ })

  console.log('\n🎉 Seed completed successfully!')
  console.log(`   Facilities: ${insertedFacilities.length}`)
  console.log(`   Users: ${insertedUsers.length}`)
  console.log(`   Patients: ${insertedPatients.length}`)
  console.log(`   Clinical Cases: ${insertedCases.length}`)
  console.log(`     - PENDING: ${statusCounts.PENDING}`)
  console.log(`     - IN_PROGRESS: ${statusCounts.IN_PROGRESS}`)
  console.log(`     - SUCCESS: ${statusCounts.SUCCESS}`)
  console.log(`     - FAILURE: ${statusCounts.FAILURE}`)
  console.log(`   Audit Logs: ${auditEntries.length}`)
  console.log(`   Data span: 6 months (Jan 2026 - Jul 2026)`)
}

seed().catch((e) => {
  console.error('❌ Seed failed:', e)
  process.exit(1)
})
