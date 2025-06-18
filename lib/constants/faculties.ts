export const faculties = [
  {
    id: "arts",
    name: "Faculty of Arts",
    departments: [
      "Arabic and Islamic Studies",
      "English",
      "History and International Studies",
      "Linguistics and Nigerian Languages",
      "Performing Arts",
      "Philosophy",
      "Religious Studies",
    ],
  },
  {
    id: "science",
    name: "Faculty of Science",
    departments: [
      "Biochemistry",
      "Chemistry",
      "Computer Science",
      "Geology",
      "Mathematics",
      "Microbiology",
      "Physics",
      "Statistics",
      "Zoology",
    ],
  },
  {
    id: "engineering",
    name: "Faculty of Engineering and Technology",
    departments: [
      "Agricultural and Biosystems Engineering",
      "Chemical Engineering",
      "Civil Engineering",
      "Computer Engineering",
      "Electrical Engineering",
      "Food Engineering",
      "Mechanical Engineering",
      "Metallurgical and Materials Engineering",
    ],
  },
  // Add more faculties as needed
] as const

export type Faculty = typeof faculties[number]
export type Department = Faculty["departments"][number] 