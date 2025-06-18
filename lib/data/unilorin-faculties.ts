export interface Department {
  id: string
  name: string
}

export interface Faculty {
  id: string
  name: string
  departments: Department[]
}

export const unilorinFaculties: Faculty[] = [
  {
    id: "agriculture",
    name: "Agriculture",
    departments: [
      { id: "agric-economics", name: "Agricultural Economics and Farm Management" },
      { id: "agric-extension", name: "Agricultural Extension and Rural Development" },
      { id: "agronomy", name: "Agronomy" },
      { id: "animal-production", name: "Animal Production" },
      { id: "crop-protection", name: "Crop Protection" },
      { id: "food-science", name: "Food Science and Home Economics" },
    ]
  },
  {
    id: "arts",
    name: "Arts",
    departments: [
      { id: "arabic", name: "Arabic" },
      { id: "christian-studies", name: "Christian Studies" },
      { id: "english", name: "English" },
      { id: "french", name: "French" },
      { id: "history", name: "History and International Studies" },
      { id: "islamic-studies", name: "Islamic Studies" },
      { id: "linguistics", name: "Linguistics and Nigerian Languages" },
      { id: "performing-arts", name: "Performing Arts" },
    ]
  },
  {
    id: "basic-medical-sciences",
    name: "Basic Medical Sciences",
    departments: [
      { id: "anatomy", name: "Anatomy" },
      { id: "biochemistry", name: "Biochemistry" },
      { id: "physiology", name: "Physiology" },
    ]
  },
  {
    id: "clinical-sciences",
    name: "Clinical Sciences",
    departments: [
      { id: "anaesthesia", name: "Anaesthesia" },
      { id: "behavioural-sciences", name: "Behavioural Sciences" },
      { id: "medicine", name: "Medicine" },
      { id: "obs-gynae", name: "Obstetrics and Gynaecology" },
      { id: "ophthalmology", name: "Ophthalmology" },
      { id: "paediatrics", name: "Paediatrics and Child Health" },
      { id: "surgery", name: "Surgery" },
    ]
  },
  {
    id: "communication",
    name: "Communication and Information Sciences",
    departments: [
      { id: "computer-science", name: "Computer Science" },
      { id: "information-science", name: "Information and Communication Science" },
      { id: "library-science", name: "Library and Information Science" },
      { id: "mass-comm", name: "Mass Communication" },
      { id: "telecom-science", name: "Telecommunication Science" },
    ]
  },
  {
    id: "education",
    name: "Education",
    departments: [
      { id: "adult-education", name: "Adult and Primary Education" },
      { id: "arts-education", name: "Arts Education" },
      { id: "counsellor-education", name: "Counsellor Education" },
      { id: "educational-management", name: "Educational Management" },
      { id: "educational-technology", name: "Educational Technology" },
      { id: "health-education", name: "Health Education" },
      { id: "science-education", name: "Science Education" },
      { id: "social-sciences-education", name: "Social Sciences Education" },
    ]
  },
  {
    id: "engineering",
    name: "Engineering and Technology",
    departments: [
      { id: "agricultural-engineering", name: "Agricultural and Biosystems Engineering" },
      { id: "chemical-engineering", name: "Chemical Engineering" },
      { id: "civil-engineering", name: "Civil Engineering" },
      { id: "computer-engineering", name: "Computer Engineering" },
      { id: "electrical-engineering", name: "Electrical and Electronics Engineering" },
      { id: "food-engineering", name: "Food and Bioprocess Engineering" },
      { id: "mechanical-engineering", name: "Mechanical Engineering" },
      { id: "materials-engineering", name: "Materials and Metallurgical Engineering" },
      { id: "water-engineering", name: "Water Resources and Environmental Engineering" },
    ]
  },
  {
    id: "environmental-sciences",
    name: "Environmental Sciences",
    departments: [
      { id: "architecture", name: "Architecture" },
      { id: "estate-management", name: "Estate Management" },
      { id: "surveying", name: "Surveying and Geoinformatics" },
      { id: "urban-planning", name: "Urban and Regional Planning" },
    ]
  },
  {
    id: "life-sciences",
    name: "Life Sciences",
    departments: [
      { id: "microbiology", name: "Microbiology" },
      { id: "zoology", name: "Zoology" },
      { id: "plant-biology", name: "Plant Biology" },
      { id: "industrial-chemistry", name: "Industrial Chemistry" },
    ]
  },
  {
    id: "management-sciences",
    name: "Management Sciences",
    departments: [
      { id: "accounting", name: "Accounting" },
      { id: "business-admin", name: "Business Administration" },
      { id: "finance", name: "Finance" },
      { id: "marketing", name: "Marketing" },
      { id: "public-admin", name: "Public Administration" },
    ]
  },
  {
    id: "pharmaceutical-sciences",
    name: "Pharmaceutical Sciences",
    departments: [
      { id: "clinical-pharmacy", name: "Clinical Pharmacy and Pharmacy Practice" },
      { id: "pharmaceutical-chemistry", name: "Pharmaceutical Chemistry" },
      { id: "pharmaceutical-microbiology", name: "Pharmaceutical Microbiology" },
      { id: "pharmaceutics", name: "Pharmaceutics and Industrial Pharmacy" },
      { id: "pharmacognosy", name: "Pharmacognosy and Drug Development" },
      { id: "pharmacology", name: "Pharmacology and Toxicology" },
    ]
  },
  {
    id: "physical-sciences",
    name: "Physical Sciences",
    departments: [
      { id: "chemistry", name: "Chemistry" },
      { id: "geology", name: "Geology and Mineral Sciences" },
      { id: "mathematics", name: "Mathematics" },
      { id: "physics", name: "Physics" },
      { id: "statistics", name: "Statistics" },
    ]
  },
  {
    id: "social-sciences",
    name: "Social Sciences",
    departments: [
      { id: "economics", name: "Economics" },
      { id: "geography", name: "Geography and Environmental Management" },
      { id: "political-science", name: "Political Science" },
      { id: "psychology", name: "Psychology" },
      { id: "sociology", name: "Sociology" },
    ]
  },
  {
    id: "veterinary-medicine",
    name: "Veterinary Medicine",
    departments: [
      { id: "veterinary-anatomy", name: "Veterinary Anatomy" },
      { id: "veterinary-medicine", name: "Veterinary Medicine" },
      { id: "veterinary-microbiology", name: "Veterinary Microbiology" },
      { id: "veterinary-parasitology", name: "Veterinary Parasitology and Entomology" },
      { id: "veterinary-pathology", name: "Veterinary Pathology" },
      { id: "veterinary-physiology", name: "Veterinary Physiology and Biochemistry" },
      { id: "veterinary-public-health", name: "Veterinary Public Health and Preventive Medicine" },
      { id: "veterinary-surgery", name: "Veterinary Surgery and Radiology" },
      { id: "theriogenology", name: "Theriogenology" },
    ]
  }
] 