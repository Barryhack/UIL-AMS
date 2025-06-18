export interface Department {
  id: string
  name: string
  code: string
}

export interface Faculty {
  id: string
  name: string
  departments: Department[]
}

export const faculties: Faculty[] = [
  {
    id: "agriculture",
    name: "Faculty of Agriculture",
    departments: [
      { id: "agric-biochem", name: "Agricultural Biochemistry and Nutrition", code: "ABN" },
      { id: "agric-econs", name: "Agricultural Economics and Farm Management", code: "AEM" },
      { id: "agric-extension", name: "Agricultural Extension and Rural Development", code: "AER" },
      { id: "agronomy", name: "Agronomy", code: "AGR" },
      { id: "animal-production", name: "Animal Production", code: "ANP" },
      { id: "crop-protection", name: "Crop Protection", code: "CPT" },
      { id: "food-science", name: "Food Science and Home Economics", code: "FSH" },
    ]
  },
  {
    id: "arts",
    name: "Faculty of Arts",
    departments: [
      { id: "arabic", name: "Arabic", code: "ARA" },
      { id: "christian-studies", name: "Christian Studies", code: "CRS" },
      { id: "english", name: "English", code: "ENG" },
      { id: "french", name: "French", code: "FRN" },
      { id: "history", name: "History and International Studies", code: "HIS" },
      { id: "islamic-studies", name: "Islamic Studies", code: "ISS" },
      { id: "linguistics", name: "Linguistics and Nigerian Languages", code: "LNG" },
      { id: "performing-arts", name: "Performing Arts", code: "PFA" },
    ]
  },
  {
    id: "basic-medical-sciences",
    name: "Faculty of Basic Medical Sciences",
    departments: [
      { id: "anatomy", name: "Anatomy", code: "ANA" },
      { id: "physiology", name: "Physiology", code: "PHS" },
    ]
  },
  {
    id: "clinical-sciences",
    name: "Faculty of Clinical Sciences",
    departments: [
      { id: "medicine-surgery", name: "Medicine and Surgery", code: "MDS" },
      { id: "nursing", name: "Nursing Science", code: "NSC" },
    ]
  },
  {
    id: "communication-info-sciences",
    name: "Faculty of Communication and Information Sciences",
    departments: [
      { id: "computer-science", name: "Computer Science", code: "CSC" },
      { id: "information-science", name: "Information and Communication Science", code: "ICS" },
      { id: "library-science", name: "Library and Information Science", code: "LIS" },
      { id: "mass-comm", name: "Mass Communication", code: "MAC" },
      { id: "telecom-science", name: "Telecommunication Science", code: "TCS" },
    ]
  },
  {
    id: "education",
    name: "Faculty of Education",
    departments: [
      { id: "adult-education", name: "Adult and Primary Education", code: "APE" },
      { id: "arts-education", name: "Arts Education", code: "AED" },
      { id: "counsellor-education", name: "Counsellor Education", code: "CED" },
      { id: "educational-management", name: "Educational Management", code: "EDM" },
      { id: "educational-technology", name: "Educational Technology", code: "EDT" },
      { id: "health-education", name: "Health Education", code: "HED" },
      { id: "science-education", name: "Science Education", code: "SED" },
      { id: "social-sciences-education", name: "Social Sciences Education", code: "SSE" },
    ]
  },
  {
    id: "engineering",
    name: "Faculty of Engineering and Technology",
    departments: [
      { id: "agricultural-engineering", name: "Agricultural and Biosystems Engineering", code: "ABE" },
      { id: "chemical-engineering", name: "Chemical Engineering", code: "CHE" },
      { id: "civil-engineering", name: "Civil Engineering", code: "CVE" },
      { id: "computer-engineering", name: "Computer Engineering", code: "CPE" },
      { id: "electrical-engineering", name: "Electrical Engineering", code: "EEE" },
      { id: "food-engineering", name: "Food Engineering", code: "FDE" },
      { id: "mechanical-engineering", name: "Mechanical Engineering", code: "MEE" },
      { id: "materials-engineering", name: "Materials and Metallurgical Engineering", code: "MME" },
      { id: "water-engineering", name: "Water Resources and Environmental Engineering", code: "WRE" },
    ]
  },
  {
    id: "environmental-sciences",
    name: "Faculty of Environmental Sciences",
    departments: [
      { id: "architecture", name: "Architecture", code: "ARC" },
      { id: "estate-management", name: "Estate Management", code: "EST" },
      { id: "surveying", name: "Surveying and Geoinformatics", code: "SVG" },
      { id: "urban-planning", name: "Urban and Regional Planning", code: "URP" },
    ]
  },
  {
    id: "life-sciences",
    name: "Faculty of Life Sciences",
    departments: [
      { id: "biochemistry", name: "Biochemistry", code: "BCH" },
      { id: "botany", name: "Plant Biology", code: "PLB" },
      { id: "industrial-chemistry", name: "Industrial Chemistry", code: "ICH" },
      { id: "microbiology", name: "Microbiology", code: "MCB" },
      { id: "zoology", name: "Zoology", code: "ZOO" },
    ]
  },
  {
    id: "management-sciences",
    name: "Faculty of Management Sciences",
    departments: [
      { id: "accounting", name: "Accounting", code: "ACC" },
      { id: "business-admin", name: "Business Administration", code: "BUS" },
      { id: "finance", name: "Finance", code: "FIN" },
      { id: "marketing", name: "Marketing", code: "MKT" },
      { id: "public-admin", name: "Public Administration", code: "PAD" },
    ]
  },
  {
    id: "pharmaceutical-sciences",
    name: "Faculty of Pharmaceutical Sciences",
    departments: [
      { id: "clinical-pharmacy", name: "Clinical Pharmacy and Pharmacy Practice", code: "CPP" },
      { id: "pharmaceutics", name: "Pharmaceutics and Industrial Pharmacy", code: "PIP" },
      { id: "pharmaceutical-chemistry", name: "Pharmaceutical Chemistry", code: "PCH" },
      { id: "pharmacology", name: "Pharmacology and Toxicology", code: "PCT" },
    ]
  },
  {
    id: "physical-sciences",
    name: "Faculty of Physical Sciences",
    departments: [
      { id: "chemistry", name: "Chemistry", code: "CHM" },
      { id: "geology", name: "Geology and Mineral Sciences", code: "GNS" },
      { id: "mathematics", name: "Mathematics", code: "MTH" },
      { id: "physics", name: "Physics", code: "PHY" },
      { id: "statistics", name: "Statistics", code: "STA" },
    ]
  },
  {
    id: "social-sciences",
    name: "Faculty of Social Sciences",
    departments: [
      { id: "economics", name: "Economics", code: "ECN" },
      { id: "geography", name: "Geography and Environmental Management", code: "GEM" },
      { id: "political-science", name: "Political Science", code: "POS" },
      { id: "psychology", name: "Psychology", code: "PSY" },
      { id: "sociology", name: "Sociology", code: "SOC" },
    ]
  },
  {
    id: "veterinary-medicine",
    name: "Faculty of Veterinary Medicine",
    departments: [
      { id: "veterinary-medicine", name: "Veterinary Medicine", code: "VET" },
      { id: "veterinary-anatomy", name: "Veterinary Anatomy", code: "VAN" },
      { id: "veterinary-pathology", name: "Veterinary Pathology", code: "VPT" },
      { id: "veterinary-physiology", name: "Veterinary Physiology and Biochemistry", code: "VPB" },
    ]
  }
]

export function getFacultyById(id: string): Faculty | undefined {
  return faculties.find(faculty => faculty.id === id)
}

export function getDepartmentById(facultyId: string, departmentId: string): Department | undefined {
  const faculty = getFacultyById(facultyId)
  return faculty?.departments.find(dept => dept.id === departmentId)
} 