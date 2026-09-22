/** Official College Board AP course titles (searchable dropdown). */
export const AP_COURSES = [
  "AP 2-D Art and Design",
  "AP 3-D Art and Design",
  "AP African American Studies",
  "AP Art History",
  "AP Biology",
  "AP Calculus AB",
  "AP Calculus BC",
  "AP Chemistry",
  "AP Chinese Language and Culture",
  "AP Comparative Government and Politics",
  "AP Computer Science A",
  "AP Computer Science Principles",
  "AP Drawing",
  "AP English Language and Composition",
  "AP English Literature and Composition",
  "AP Environmental Science",
  "AP European History",
  "AP French Language and Culture",
  "AP German Language and Culture",
  "AP Human Geography",
  "AP Italian Language and Culture",
  "AP Japanese Language and Culture",
  "AP Latin",
  "AP Macroeconomics",
  "AP Microeconomics",
  "AP Music Theory",
  "AP Physics 1: Algebra-Based",
  "AP Physics 2: Algebra-Based",
  "AP Physics C: Electricity and Magnetism",
  "AP Physics C: Mechanics",
  "AP Precalculus",
  "AP Psychology",
  "AP Research",
  "AP Seminar",
  "AP Spanish Language and Culture",
  "AP Spanish Literature and Culture",
  "AP Statistics",
  "AP United States Government and Politics",
  "AP United States History",
  "AP World History: Modern",
] as const;

/** Common IB Diploma Programme subjects (HL/SL chosen separately via level). */
export const IB_COURSES = [
  "IB Biology",
  "IB Business Management",
  "IB Chemistry",
  "IB Classical Languages",
  "IB Computer Science",
  "IB Dance",
  "IB Design Technology",
  "IB Economics",
  "IB English A: Language and Literature",
  "IB English A: Literature",
  "IB Environmental Systems and Societies",
  "IB Film",
  "IB French B",
  "IB Geography",
  "IB Global Politics",
  "IB History",
  "IB Information Technology in a Global Society",
  "IB Literature and Performance",
  "IB Mathematics: Analysis and Approaches",
  "IB Mathematics: Applications and Interpretation",
  "IB Music",
  "IB Philosophy",
  "IB Physics",
  "IB Psychology",
  "IB Spanish B",
  "IB Sports, Exercise and Health Science",
  "IB Theatre",
  "IB Theory of Knowledge",
  "IB Visual Arts",
  "IB World Religions",
] as const;

export function courseCatalogForLevel(level: string): readonly string[] {
  if (level === "AP") return AP_COURSES;
  if (level === "IB") return IB_COURSES;
  return [];
}

export function inferSubjectFromCourseName(name: string): string {
  const n = name.toLowerCase();
  if (/calc|precalc|stat|math|algebra|geometry/.test(n)) return "Math";
  if (/physics|chem|bio|environ|computer science|design tech/.test(n)) return "STEM";
  if (/english|literature|language and composition|tok/.test(n)) return "English";
  if (/history|government|politics|geography|econ|psychology|philosophy/.test(n)) return "Social Studies";
  if (/spanish|french|german|chinese|japanese|italian|latin|language and culture/.test(n)) return "World Language";
  if (/art|music|theatre|film|dance|drawing/.test(n)) return "Arts";
  return "Other";
}
