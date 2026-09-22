export type Importance =
  | "Very Important"
  | "Important"
  | "Neutral"
  | "Not Important";

export type FactorImportance =
  | "Very Important"
  | "Important"
  | "Considered"
  | "Not Considered"
  | "Unknown";

export type AdmissionOutlook =
  | "Strong Match"
  | "Target"
  | "Reach"
  | "Very Unlikely";

export type AdmissionCategory = "Likely" | "Target" | "Reach" | "High Reach";
export type FitCategory = AdmissionCategory;

export type Region = "Northeast" | "Midwest" | "South" | "West";
export type CampusSetting = "Urban" | "Suburban" | "Rural";
export type SchoolType = "Public" | "Private" | "Community";
export type InstitutionKind =
  | "Research university"
  | "Liberal arts"
  | "Technical university"
  | "Community college"
  | "Regional university";

export type DistancePreset =
  | "25"
  | "50"
  | "100"
  | "250"
  | "500"
  | "state"
  | "us"
  | "world"
  | "custom";

export type DriveTimePreset = "30" | "60" | "120" | "180" | "240" | "360" | "480" | "none";
export type AttendanceScope =
  | "only-state"
  | "primarily-state"
  | "state-neighbors"
  | "us"
  | "world";
export type TestPolicy = "Required" | "Test-optional" | "Test-blind";
export type AwardLevel =
  | "School"
  | "Local"
  | "Regional"
  | "State"
  | "National"
  | "International";

export type CourseLevel =
  | "AP"
  | "IB"
  | "Honors"
  | "Dual Enrollment"
  | "College"
  | "Other";

export type ActivityCategory =
  | "Academic"
  | "Athletics"
  | "Arts"
  | "Business"
  | "Entrepreneurship"
  | "Community Service"
  | "Research"
  | "Employment"
  | "Internship"
  | "Political/Civic"
  | "Student Government"
  | "Clubs"
  | "Technology"
  | "Family Responsibilities"
  | "Other";

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  age: string;
  highSchool: string;
  graduationYear: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  locationPermission: boolean;
  firstGeneration: "" | "Yes" | "No" | "Prefer not to answer";
  internationalStudent: "" | "Yes" | "No";
  citizenship: string;
  residencyStatus: "" | "In-state" | "Out-of-state" | "International";
  backgroundSetting: "" | "Rural" | "Suburban" | "Urban";
  militaryFamily: boolean;
  legacy: string;
  parentEducation: string;
  householdAidNotes: string;
  hispanicLatino: "" | "Yes" | "No" | "Prefer not to answer";
  raceEthnicity: string[];
}

export interface AcademicProfile {
  weightedGpa: string;
  unweightedGpa: string;
  gpaScale: "4.0" | "5.0" | "100" | "Other";
  classRank: string;
  classSize: string;
  percentile: string;
  gpaTrend: "increased" | "decreased" | "consistent" | "";
  gpaTrendExplanation: string;
}

export interface Course {
  id: string;
  name: string;
  subject: string;
  level: CourseLevel;
  grade: string;
  year: string;
}

export interface SatScore {
  total: string;
  readingWriting: string;
  math: string;
  date: string;
}

export interface ActScore {
  composite: string;
  english: string;
  math: string;
  reading: string;
  science: string;
  date: string;
}

export interface SubjectScore {
  id: string;
  subject: string;
  score: string;
}

export interface Testing {
  sat: SatScore | null;
  act: ActScore | null;
  ap: SubjectScore[];
  ib: SubjectScore[];
  testOptional: boolean;
}

export interface Activity {
  id: string;
  name: string;
  organization: string;
  category: ActivityCategory;
  position: string;
  yearsParticipated: string;
  startDate: string;
  endDate: string;
  hoursPerWeek: string;
  weeksPerYear: string;
  hasLeadership: boolean;
  leadershipTitle: string;
  peopleLed: string;
  leadershipResponsibilities: string;
  accomplishments: string;
  createdSomething: boolean;
  grewMembership: boolean;
  raisedMoney: boolean;
  generatedRevenue: boolean;
  wonAward: boolean;
  organizedEvent: boolean;
  helpedPeople: boolean;
  peopleImpacted: string;
  recognition: "" | "None" | "Regional" | "State" | "National";
}

export interface WorkExperience {
  id: string;
  employer: string;
  position: string;
  startDate: string;
  endDate: string;
  hoursPerWeek: string;
  paid: "Paid" | "Unpaid" | "";
  description: string;
  accomplishments: string;
  leadershipResponsibilities: string;
  revenueGenerated: string;
  peopleManaged: string;
  quantifiableResults: string;
}

export interface Award {
  id: string;
  name: string;
  organization: string;
  date: string;
  level: AwardLevel;
  description: string;
}

export interface CareerAssessment {
  completed: boolean;
  skippedKnownCareer: boolean;
  interests: string[];
  workEnvironments: string[];
  workStyles: string[];
  values: Record<string, number>;
  academicInterests: Record<string, number>;
  feedback: Record<string, { status: "interested" | "not" | "more"; reason?: string }>;
  primaryCareerId: string;
}

export interface CareerGoals {
  intendedCareers: string[];
  intendedMajors: string[];
  industries: string[];
  salaryRange: string;
  workEnvironment: string[];
  geographicPreferences: string[];
  workMode: string[];
  companySize: string[];
  graduateSchoolInterest: string;
  professionalSchoolInterest: string;
}

export interface AcademicPreferences {
  majorStrength: Importance;
  classSize: Importance;
  research: Importance;
  professors: Importance;
  internships: Importance;
  careerPlacement: Importance;
  graduatePrep: Importance;
  honorsPrograms: Importance;
  studyAbroad: Importance;
  entrepreneurship: Importance;
  coop: Importance;
  doubleMajors: Importance;
  minors: Importance;
}

export interface CampusSliders {
  schoolSize: number;
  urbanRural: number;
  traditionalModern: number;
  classSize: number;
}

export interface CampusPreferences {
  greekLife: Importance;
  athletics: Importance;
  schoolSpirit: Importance;
  clubs: Importance;
  socialScene: Importance;
  diversityOfActivities: Importance;
  religiousEnvironment: Importance;
  politicalEnvironment: Importance;
  outdoorRecreation: Importance;
}

export interface GeographicPreferences {
  preferredStates: string[];
  considerStates: string[];
  unwillingStates: string[];
  maxDistanceMiles: string;
  climates: string[];
  settings: CampusSetting[];
  airportAccess: Importance;
  publicTransit: Importance;
  distancePreset: DistancePreset;
  customMaxMiles: string;
  maxDriveTime: DriveTimePreset;
  travelMode: "Driving" | "Transit" | "Flight" | "No preference";
  attendanceScope: AttendanceScope;
  inStateTuitionOnly: boolean;
}

export interface LifestylePreferences {
  tags: string[];
}

export interface FinancialPreferences {
  maxAnnualCost: string;
  financialAidImportance: Importance;
  needBasedAid: boolean;
  meritScholarships: boolean;
  willingOutOfState: boolean;
  maxStudentDebt: string;
}

export interface CollegePreference {
  academic: AcademicPreferences;
  campusSliders: CampusSliders;
  campus: CampusPreferences;
  geographic: GeographicPreferences;
  lifestyle: LifestylePreferences;
  financial: FinancialPreferences;
}

export interface AdmissionsData {
  applications?: number;
  acceptanceRate?: number;
  yield?: number;
  earlyAction?: boolean;
  earlyDecision?: boolean;
  regularDeadline?: string;
  testPolicy: TestPolicy;
}

export interface AcademicData {
  gpaAverage?: number;
  sat25?: number;
  sat50?: number;
  sat75?: number;
  act25?: number;
  act50?: number;
  act75?: number;
  classRankInfo?: string;
  courseworkExpectations?: string;
}

export interface CostData {
  tuitionInState?: number;
  tuitionOutOfState?: number;
  fees?: number;
  roomAndBoard?: number;
  estimatedTotalInState?: number;
  estimatedTotalOutOfState?: number;
  averageAid?: number;
}

export interface OutcomesData {
  graduationRate?: number;
  retentionRate?: number;
  employmentNote?: string;
  graduateSchoolNote?: string;
  majorOutcomesNote?: string;
}

export interface CampusCharacteristics {
  greekLife: "Low" | "Moderate" | "High" | "Unknown";
  athletics: "NCAA D1" | "NCAA D2" | "NCAA D3" | "Other" | "Unknown";
  schoolSpirit: "Low" | "Moderate" | "High" | "Unknown";
  socialScene: "Quiet" | "Moderate" | "Active" | "Unknown";
  politicalEnvironment: "Liberal" | "Moderate" | "Conservative" | "Mixed" | "Unknown";
  outdoorRecreation: "Low" | "Moderate" | "High" | "Unknown";
  sizeBand: "Very Small" | "Small" | "Medium" | "Large" | "Very Large";
  climate: "Cold" | "Temperate" | "Warm" | "Hot" | "Variable";
}

export interface CollegeDemographics {
  internationalPct?: number;
  firstGenNote?: string;
  populationNote?: string;
  resources: string[];
}

export interface College {
  id: string;
  name: string;
  shortName: string;
  city: string;
  state: string;
  region: Region;
  type: SchoolType;
  religiousAffiliation: string | null;
  campusSetting: CampusSetting;
  undergraduateEnrollment: number;
  totalEnrollment?: number;
  studentFacultyRatio?: number;
  latitude?: number;
  longitude?: number;
  institutionKind: InstitutionKind;
  demographics: CollegeDemographics;
  domain: string;
  majors: string[];
  academicStrengths: string[];
  careerStrengths: string[];
  lifestyle: string[];
  admissions: AdmissionsData;
  academics: AcademicData;
  cost: CostData;
  outcomes: OutcomesData;
  campus: CampusCharacteristics;
  admissionsFactors: Record<string, FactorImportance>;
  dataUpdated: string;
  dataSources: string[];
}

export interface MatchBreakdown {
  collegeId: string;
  overall: number;
  admissions: number;
  academic: number;
  major: number;
  financial: number;
  lifestyle: number;
  career: number;
  location: number;
  category: AdmissionCategory;
  listBucket: AdmissionCategory;
  why: string[];
  concerns: string[];
  /** True when academics are far below published ranges — not a reasonable primary option. */
  outOfRange: boolean;
  miles: number | null;
  driveMinutes: number | null;
  transitMinutes: number | null;
  inStateForStudent: boolean;
  estimatedLikelihood: number | null;
  admissionOutlook: AdmissionOutlook;
}

export type CareerMatchBreakdown = {
  careerId: string;
  fit: number;
  why: string[];
};

export type ResumeTone =
  | "Professional"
  | "Finance"
  | "Consulting"
  | "Government"
  | "Academic"
  | "Technical"
  | "Entrepreneurial";

export type ResumeLength = "Concise" | "Balanced" | "Detailed";

export interface ResumeBullet {
  id: string;
  text: string;
}

export interface ResumeItem {
  id: string;
  title: string;
  subtitle: string;
  location: string;
  dates: string;
  bullets: ResumeBullet[];
}

export interface ResumeSection {
  id: string;
  type:
    | "education"
    | "experience"
    | "activities"
    | "leadership"
    | "skills"
    | "awards"
    | "custom";
  heading: string;
  items: ResumeItem[];
  skills?: string;
}

export interface ResumeVersion {
  id: string;
  name: string;
  updatedAt: string;
  font: string;
  fontSize: number;
  alignment: "left" | "center";
  margin: number;
  lineSpacing: number;
  bulletStyle: "disc" | "dash" | "none";
  headerName: string;
  headerContact: string;
  sections: ResumeSection[];
}

export interface ResumeScore {
  overall: number;
  formatting: number;
  readability: number;
  actionVerbs: number;
  quantification: number;
  conciseness: number;
  consistency: number;
  impact: number;
  relevantExperience: number;
  recommendations: string[];
  strengths: string[];
}

export interface StrengthCategory {
  key: string;
  label: string;
  score: number;
  explanation: string;
}

export interface ProfileRevision {
  id: string;
  at: string;
  source: "manual" | "transcript" | "resume" | "import";
  summary: string;
}

export interface AppState {
  student: Student;
  academic: AcademicProfile;
  courses: Course[];
  testing: Testing;
  activities: Activity[];
  work: WorkExperience[];
  awards: Award[];
  career: CareerGoals;
  careerAssessment: CareerAssessment;
  savedCareerIds: string[];
  preferences: CollegePreference;
  savedCollegeIds: string[];
  banishedCollegeIds: string[];
  compareIds: string[];
  resumes: ResumeVersion[];
  activeResumeId: string | null;
  onboardingComplete: boolean;
  /** Signed-in account email when using local/cloud account sync. */
  accountEmail: string | null;
  /** Append-only history of profile updates (progressive data entry). */
  profileRevisions: ProfileRevision[];
}
