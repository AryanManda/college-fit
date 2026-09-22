import type {
  AcademicData,
  CampusCharacteristics,
  CampusSetting,
  College,
  CostData,
  FactorImportance,
  Region,
  SchoolType,
  TestPolicy,
} from "../lib/types";
import { DATA_YEAR, DEFAULT_SOURCES } from "../lib/constants";

type Seed = {
  id: string;
  name: string;
  short: string;
  city: string;
  state: string;
  region: Region;
  type: SchoolType;
  setting: CampusSetting;
  domain: string;
  ug: number;
  total?: number;
  acc: number;
  yield?: number;
  sat?: [number, number] | [number, number, number];
  act?: [number, number] | [number, number, number];
  gpa?: number;
  inT?: number;
  outT?: number;
  fees?: number;
  room?: number;
  aid?: number;
  grad?: number;
  retain?: number;
  ratio?: number;
  test: TestPolicy;
  ea?: boolean;
  ed?: boolean;
  deadline?: string;
  rel?: string | null;
  majors: string[];
  strengths: string[];
  careers: string[];
  life: string[];
  greek?: CampusCharacteristics["greekLife"];
  ath?: CampusCharacteristics["athletics"];
  spirit?: CampusCharacteristics["schoolSpirit"];
  social?: CampusCharacteristics["socialScene"];
  pol?: CampusCharacteristics["politicalEnvironment"];
  outdoor?: CampusCharacteristics["outdoorRecreation"];
  climate: CampusCharacteristics["climate"];
  rankInfo?: string;
  rigor?: string;
  job?: string;
  gradSchool?: string;
  outcomes?: string;
  factors?: Partial<Record<string, FactorImportance>>;
};

function sizeBand(ug: number): CampusCharacteristics["sizeBand"] {
  if (ug < 1500) return "Very Small";
  if (ug < 3000) return "Small";
  if (ug < 8000) return "Medium";
  if (ug < 20000) return "Large";
  return "Very Large";
}

function cost(s: Seed): CostData {
  const tuitionIn = s.type === "Public" ? s.inT : s.outT ?? s.inT;
  const tuitionOut = s.outT ?? s.inT;
  const fees = s.fees;
  const room = s.room;
  const inTotal =
    tuitionIn && room ? tuitionIn + (fees ?? 0) + room : undefined;
  const outTotal =
    tuitionOut && room ? tuitionOut + (fees ?? 0) + room : undefined;
  return {
    tuitionInState: s.type === "Public" ? s.inT : undefined,
    tuitionOutOfState: tuitionOut,
    fees,
    roomAndBoard: room,
    estimatedTotalInState: s.type === "Public" ? inTotal : outTotal,
    estimatedTotalOutOfState: outTotal,
    averageAid: s.aid,
  };
}

function academics(s: Seed): AcademicData {
  const sat = s.sat;
  const act = s.act;
  return {
    gpaAverage: s.gpa,
    sat25: sat?.[0],
    sat50: sat?.[2],
    sat75: sat?.[1],
    act25: act?.[0],
    act50: act?.[2],
    act75: act?.[1],
    classRankInfo: s.rankInfo,
    courseworkExpectations: s.rigor,
  };
}

function expand(s: Seed): College {
  return {
    id: s.id,
    name: s.name,
    shortName: s.short,
    city: s.city,
    state: s.state,
    region: s.region,
    type: s.type,
    religiousAffiliation: s.rel ?? null,
    campusSetting: s.setting,
    undergraduateEnrollment: s.ug,
    totalEnrollment: s.total,
    studentFacultyRatio: s.ratio,
    domain: s.domain,
    majors: s.majors,
    academicStrengths: s.strengths,
    careerStrengths: s.careers,
    lifestyle: s.life,
    admissions: {
      acceptanceRate: s.acc,
      yield: s.yield,
      earlyAction: s.ea,
      earlyDecision: s.ed,
      regularDeadline: s.deadline ?? "January 1",
      testPolicy: s.test,
    },
    academics: academics(s),
    cost: cost(s),
    outcomes: {
      graduationRate: s.grad,
      retentionRate: s.retain,
      employmentNote: s.job,
      graduateSchoolNote: s.gradSchool,
      majorOutcomesNote: s.outcomes,
    },
    campus: {
      greekLife: s.greek ?? "Unknown",
      athletics: s.ath ?? "Unknown",
      schoolSpirit: s.spirit ?? "Unknown",
      socialScene: s.social ?? "Unknown",
      politicalEnvironment: s.pol ?? "Unknown",
      outdoorRecreation: s.outdoor ?? "Unknown",
      sizeBand: sizeBand(s.ug),
      climate: s.climate,
    },
    admissionsFactors: Object.fromEntries(
      Object.entries({ ...(s.factors ?? {}) }).filter(
        ([, v]) => v && v !== "Unknown",
      ),
    ) as Record<string, FactorImportance>,
    dataUpdated: DATA_YEAR,
    dataSources: DEFAULT_SOURCES,
    institutionKind: "Research university",
    demographics: { resources: [] },
  };
}

const CS = ["Computer Science", "Data Science", "Mathematics"];
const ENG = ["Mechanical Engineering", "Electrical Engineering", "Computer Engineering"];
const BUS = ["Business", "Finance", "Economics", "Accounting"];
const BIO = ["Biology", "Neuroscience", "Biomedical Sciences"];
const PREMED = ["Biology", "Chemistry", "Public Health"];
const HUM = ["English", "History", "Political Science", "Philosophy"];
const ARTS = ["Fine Arts", "Music", "Theater"];

const seeds: Seed[] = [
  { id: "harvard", name: "Harvard University", short: "Harvard", city: "Cambridge", state: "MA", region: "Northeast", type: "Private", setting: "Urban", domain: "harvard.edu", ug: 7200, acc: 0.032, yield: 0.84, sat: [1480, 1580], act: [34, 36], gpa: 4.2, outT: 59240, room: 21116, aid: 64000, grad: 0.97, retain: 0.98, ratio: 7, test: "Test-optional", ea: false, ed: false, deadline: "January 1", majors: [...CS, ...HUM, "Economics", "Government", "Applied Mathematics"], strengths: ["Undergraduate teaching", "Research", "Interdisciplinary study"], careers: ["Finance", "Consulting", "Research", "Law", "Public service"], life: ["Cultural activities", "Restaurants", "Concerts", "Major sports"], greek: "Low", ath: "NCAA D1", spirit: "High", social: "Moderate", pol: "Liberal", outdoor: "Moderate", climate: "Cold", rigor: "Most demanding available coursework expected", job: "Strong published career outcomes across many fields", factors: { GPA: "Very Important", "Course rigor": "Very Important", "Character/personal qualities": "Very Important", Essay: "Very Important", Recommendations: "Very Important", "Extracurricular activities": "Important", "SAT/ACT": "Considered" } },
  { id: "yale", name: "Yale University", short: "Yale", city: "New Haven", state: "CT", region: "Northeast", type: "Private", setting: "Urban", domain: "yale.edu", ug: 6800, acc: 0.045, sat: [1470, 1560], act: [33, 35], outT: 67250, room: 19840, aid: 66000, grad: 0.97, ratio: 6, test: "Test-optional", majors: [...HUM, "Economics", "Computer Science", "Biology", "Global Affairs"], strengths: ["Humanities", "Residential college system", "Research"], careers: ["Law", "Public service", "Arts", "Finance", "Research"], life: ["Cultural activities", "Concerts", "Restaurants"], greek: "Low", ath: "NCAA D1", spirit: "High", social: "Active", pol: "Liberal", outdoor: "Moderate", climate: "Cold" },
  { id: "princeton", name: "Princeton University", short: "Princeton", city: "Princeton", state: "NJ", region: "Northeast", type: "Private", setting: "Suburban", domain: "princeton.edu", ug: 5600, acc: 0.044, sat: [1490, 1580], act: [34, 35], outT: 62700, room: 19500, aid: 62000, grad: 0.98, ratio: 5, test: "Test-optional", majors: ["Public Policy", "Computer Science", "Engineering", "Economics", "Physics"], strengths: ["Undergraduate focus", "Financial aid", "Independent work"], careers: ["Finance", "Consulting", "Research", "Public policy"], life: ["Cultural activities", "Hiking"], greek: "Low", ath: "NCAA D1", spirit: "High", social: "Moderate", pol: "Mixed", outdoor: "Moderate", climate: "Temperate" },
  { id: "columbia", name: "Columbia University", short: "Columbia", city: "New York", state: "NY", region: "Northeast", type: "Private", setting: "Urban", domain: "columbia.edu", ug: 8900, acc: 0.039, sat: [1480, 1560], act: [34, 35], outT: 68200, room: 17200, aid: 64000, grad: 0.95, ratio: 6, test: "Test-optional", majors: [...CS, "Economics", "Political Science", "Engineering", "English"], strengths: ["Core curriculum", "Research", "New York internships"], careers: ["Finance", "Media", "Consulting", "Research"], life: ["Nightlife", "Restaurants", "Concerts", "Cultural activities"], greek: "Low", ath: "NCAA D1", spirit: "Moderate", social: "Active", pol: "Liberal", outdoor: "Low", climate: "Temperate" },
  { id: "penn", name: "University of Pennsylvania", short: "Penn", city: "Philadelphia", state: "PA", region: "Northeast", type: "Private", setting: "Urban", domain: "upenn.edu", ug: 10500, acc: 0.058, sat: [1480, 1570], act: [34, 35], outT: 68400, room: 19200, aid: 56000, grad: 0.96, ratio: 8, test: "Test-optional", majors: [...BUS, "Computer Science", "Nursing", "Biology", "Philosophy, Politics and Economics"], strengths: ["Undergraduate business", "Interdisciplinary programs", "Research"], careers: ["Finance", "Consulting", "Healthcare", "Entrepreneurship"], life: ["Nightlife", "Restaurants", "Cultural activities", "Major sports"], greek: "High", ath: "NCAA D1", spirit: "High", social: "Active", pol: "Liberal", outdoor: "Low", climate: "Temperate" },
  { id: "brown", name: "Brown University", short: "Brown", city: "Providence", state: "RI", region: "Northeast", type: "Private", setting: "Urban", domain: "brown.edu", ug: 7300, acc: 0.051, sat: [1470, 1570], act: [33, 35], outT: 68400, room: 17600, aid: 58000, grad: 0.96, ratio: 6, test: "Test-optional", majors: ["Computer Science", "Economics", "International Relations", "Biology", "English"], strengths: ["Open curriculum", "Independent study", "Research"], careers: ["Tech", "Research", "Arts", "Consulting"], life: ["Cultural activities", "Restaurants", "Concerts"], greek: "Low", ath: "NCAA D1", spirit: "Moderate", social: "Active", pol: "Liberal", outdoor: "Moderate", climate: "Cold" },
  { id: "dartmouth", name: "Dartmouth College", short: "Dartmouth", city: "Hanover", state: "NH", region: "Northeast", type: "Private", setting: "Rural", domain: "dartmouth.edu", ug: 4500, acc: 0.062, sat: [1480, 1560], act: [33, 35], outT: 66200, room: 18600, aid: 55000, grad: 0.95, ratio: 7, test: "Test-optional", majors: ["Economics", "Computer Science", "Government", "Engineering", "Biology"], strengths: ["Undergraduate focus", "Outdoors", "D-Plan flexibility"], careers: ["Consulting", "Finance", "Tech", "Healthcare"], life: ["Mountains", "Hiking", "Skiing", "Forests", "Lakes"], greek: "High", ath: "NCAA D1", spirit: "High", social: "Active", pol: "Mixed", outdoor: "High", climate: "Cold" },
  { id: "cornell", name: "Cornell University", short: "Cornell", city: "Ithaca", state: "NY", region: "Northeast", type: "Private", setting: "Rural", domain: "cornell.edu", ug: 16000, acc: 0.079, sat: [1470, 1550], act: [33, 35], outT: 68400, room: 18600, aid: 52000, grad: 0.95, ratio: 9, test: "Test-optional", majors: [...ENG, "Computer Science", "Hotel Administration", "Agriculture", "Biology", "Architecture"], strengths: ["Engineering", "Hotel administration", "Research breadth"], careers: ["Engineering", "Tech", "Hospitality", "Research", "Business"], life: ["Lakes", "Hiking", "Forests", "Waterfalls"], greek: "Moderate", ath: "NCAA D1", spirit: "High", social: "Active", pol: "Liberal", outdoor: "High", climate: "Cold" },
  { id: "stanford", name: "Stanford University", short: "Stanford", city: "Stanford", state: "CA", region: "West", type: "Private", setting: "Suburban", domain: "stanford.edu", ug: 7800, acc: 0.037, sat: [1500, 1570], act: [34, 35], outT: 65100, room: 20800, aid: 62000, grad: 0.95, ratio: 5, test: "Test-optional", majors: [...CS, ...ENG, "Economics", "Human Biology", "Symbolic Systems"], strengths: ["Computer science", "Entrepreneurship", "Research"], careers: ["Tech", "Entrepreneurship", "Engineering", "Research"], life: ["Beaches", "Hiking", "Cultural activities", "Major sports"], greek: "Moderate", ath: "NCAA D1", spirit: "High", social: "Active", pol: "Liberal", outdoor: "High", climate: "Temperate" },
  { id: "mit", name: "Massachusetts Institute of Technology", short: "MIT", city: "Cambridge", state: "MA", region: "Northeast", type: "Private", setting: "Urban", domain: "mit.edu", ug: 4600, acc: 0.04, sat: [1520, 1580], act: [35, 36], outT: 62100, room: 19800, aid: 56000, grad: 0.96, ratio: 3, test: "Required", majors: [...CS, ...ENG, "Physics", "Mathematics", "Economics"], strengths: ["Engineering", "Computer science", "Research", "Maker culture"], careers: ["Engineering", "Tech", "Research", "Entrepreneurship"], life: ["Cultural activities", "Restaurants", "Concerts"], greek: "Moderate", ath: "NCAA D3", spirit: "Moderate", social: "Moderate", pol: "Liberal", outdoor: "Low", climate: "Cold" },
  { id: "caltech", name: "California Institute of Technology", short: "Caltech", city: "Pasadena", state: "CA", region: "West", type: "Private", setting: "Suburban", domain: "caltech.edu", ug: 1000, acc: 0.027, sat: [1530, 1580], act: [35, 36], outT: 63200, room: 19400, aid: 52000, grad: 0.94, ratio: 3, test: "Required", majors: ["Physics", "Engineering", "Computer Science", "Chemistry", "Mathematics"], strengths: ["Science", "Engineering", "Research intensity"], careers: ["Research", "Engineering", "Tech"], life: ["Hiking", "Cultural activities"], greek: "Low", ath: "NCAA D3", spirit: "Moderate", social: "Quiet", pol: "Mixed", outdoor: "Moderate", climate: "Warm" },
  { id: "uchicago", name: "University of Chicago", short: "UChicago", city: "Chicago", state: "IL", region: "Midwest", type: "Private", setting: "Urban", domain: "uchicago.edu", ug: 7500, acc: 0.046, sat: [1510, 1560], act: [34, 35], outT: 67400, room: 19600, aid: 54000, grad: 0.96, ratio: 5, test: "Test-optional", majors: ["Economics", "Computer Science", "Political Science", "Mathematics", "Biology"], strengths: ["Core curriculum", "Economics", "Research"], careers: ["Finance", "Consulting", "Research", "Law", "Public policy"], life: ["Cultural activities", "Restaurants", "Concerts", "Major sports"], greek: "Low", ath: "NCAA D3", spirit: "Moderate", social: "Moderate", pol: "Mixed", outdoor: "Low", climate: "Cold" },
  { id: "duke", name: "Duke University", short: "Duke", city: "Durham", state: "NC", region: "South", type: "Private", setting: "Suburban", domain: "duke.edu", ug: 6700, acc: 0.06, sat: [1490, 1570], act: [34, 35], outT: 66100, room: 18600, aid: 54000, grad: 0.96, ratio: 6, test: "Test-optional", ed: true, majors: [...CS, "Public Policy", "Economics", "Biology", "Engineering"], strengths: ["Research", "Public policy", "Pre-med"], careers: ["Finance", "Consulting", "Healthcare", "Tech", "Law"], life: ["Major sports", "Forests", "Restaurants", "Cultural activities"], greek: "High", ath: "NCAA D1", spirit: "High", social: "Active", pol: "Liberal", outdoor: "Moderate", climate: "Temperate" },
  { id: "northwestern", name: "Northwestern University", short: "Northwestern", city: "Evanston", state: "IL", region: "Midwest", type: "Private", setting: "Suburban", domain: "northwestern.edu", ug: 8800, acc: 0.07, sat: [1490, 1560], act: [33, 35], outT: 67200, room: 19800, aid: 54000, grad: 0.95, ratio: 6, test: "Test-optional", ed: true, majors: ["Journalism", "Economics", "Computer Science", "Engineering", "Theater", "Communication"], strengths: ["Journalism", "Performing arts", "Engineering", "Research"], careers: ["Media", "Consulting", "Tech", "Arts", "Finance"], life: ["Lakes", "Cultural activities", "Restaurants", "Concerts"], greek: "High", ath: "NCAA D1", spirit: "High", social: "Active", pol: "Liberal", outdoor: "Moderate", climate: "Cold" },
  { id: "jhu", name: "Johns Hopkins University", short: "Johns Hopkins", city: "Baltimore", state: "MD", region: "South", type: "Private", setting: "Urban", domain: "jhu.edu", ug: 6100, acc: 0.072, sat: [1510, 1560], act: [34, 35], outT: 65400, room: 18600, aid: 50000, grad: 0.94, ratio: 6, test: "Test-optional", majors: [...PREMED, "Biomedical Engineering", "Public Health", "International Studies", "Computer Science"], strengths: ["Research", "Pre-med", "Public health"], careers: ["Healthcare", "Research", "Biotech", "Public policy"], life: ["Cultural activities", "Restaurants"], greek: "Moderate", ath: "NCAA D3", spirit: "Moderate", social: "Moderate", pol: "Liberal", outdoor: "Low", climate: "Temperate" },
  { id: "vanderbilt", name: "Vanderbilt University", short: "Vanderbilt", city: "Nashville", state: "TN", region: "South", type: "Private", setting: "Urban", domain: "vanderbilt.edu", ug: 7100, acc: 0.063, sat: [1480, 1570], act: [33, 35], outT: 65400, room: 20800, aid: 52000, grad: 0.93, ratio: 8, test: "Test-optional", ed: true, majors: ["Human & Organizational Development", ...CS, "Economics", "Medicine, Health and Society", "Engineering"], strengths: ["Undergraduate research", "Peabody education", "Pre-med"], careers: ["Consulting", "Healthcare", "Finance", "Education"], life: ["Concerts", "Nightlife", "Restaurants", "Major sports"], greek: "High", ath: "NCAA D1", spirit: "High", social: "Active", pol: "Mixed", outdoor: "Moderate", climate: "Temperate" },
  { id: "rice", name: "Rice University", short: "Rice", city: "Houston", state: "TX", region: "South", type: "Private", setting: "Urban", domain: "rice.edu", ug: 4500, acc: 0.079, sat: [1490, 1570], act: [34, 35], outT: 58200, room: 16600, aid: 48000, grad: 0.93, ratio: 6, test: "Test-optional", majors: [...ENG, "Computer Science", "Architecture", "Economics", "Music"], strengths: ["Engineering", "Residential colleges", "Research access"], careers: ["Engineering", "Energy", "Tech", "Architecture"], life: ["Restaurants", "Cultural activities", "Major sports"], greek: "Low", ath: "NCAA D1", spirit: "High", social: "Moderate", pol: "Mixed", outdoor: "Low", climate: "Hot" },
  { id: "nd", name: "University of Notre Dame", short: "Notre Dame", city: "Notre Dame", state: "IN", region: "Midwest", type: "Private", setting: "Suburban", domain: "nd.edu", ug: 8900, acc: 0.12, sat: [1440, 1540], act: [32, 35], outT: 65400, room: 17800, aid: 46000, grad: 0.96, ratio: 9, test: "Test-optional", rel: "Catholic", majors: [...BUS, "Engineering", "Political Science", "Computer Science", "Theology"], strengths: ["Undergraduate business", "Alumni network", "Study abroad"], careers: ["Finance", "Consulting", "Engineering", "Public service"], life: ["Major sports", "Cultural activities"], greek: "Low", ath: "NCAA D1", spirit: "High", social: "Active", pol: "Mixed", outdoor: "Moderate", climate: "Cold" },
  { id: "washu", name: "Washington University in St. Louis", short: "WashU", city: "St. Louis", state: "MO", region: "Midwest", type: "Private", setting: "Suburban", domain: "wustl.edu", ug: 8100, acc: 0.12, sat: [1480, 1560], act: [33, 35], outT: 65400, room: 19600, aid: 52000, grad: 0.94, ratio: 7, test: "Test-optional", ed: true, majors: [...BUS, "Biology", "Computer Science", "Engineering", "Political Science"], strengths: ["Pre-med", "Research", "Architecture"], careers: ["Healthcare", "Consulting", "Research", "Business"], life: ["Cultural activities", "Restaurants"], greek: "Moderate", ath: "NCAA D3", spirit: "Moderate", social: "Active", pol: "Liberal", outdoor: "Moderate", climate: "Temperate" },
  { id: "emory", name: "Emory University", short: "Emory", city: "Atlanta", state: "GA", region: "South", type: "Private", setting: "Suburban", domain: "emory.edu", ug: 7100, acc: 0.11, sat: [1430, 1530], act: [32, 34], outT: 62800, room: 18600, aid: 48000, grad: 0.9, ratio: 9, test: "Test-optional", ed: true, majors: [...PREMED, "Business", "Political Science", "Neuroscience", "Economics"], strengths: ["Pre-med", "Business", "Research"], careers: ["Healthcare", "Consulting", "Business", "Public health"], life: ["Restaurants", "Cultural activities", "Concerts"], greek: "Moderate", ath: "NCAA D3", spirit: "Moderate", social: "Active", pol: "Liberal", outdoor: "Moderate", climate: "Warm" },
  { id: "cmu", name: "Carnegie Mellon University", short: "CMU", city: "Pittsburgh", state: "PA", region: "Northeast", type: "Private", setting: "Urban", domain: "cmu.edu", ug: 7600, acc: 0.11, sat: [1480, 1560], act: [33, 35], outT: 64200, room: 17400, aid: 44000, grad: 0.93, ratio: 6, test: "Test-optional", majors: [...CS, "Electrical Engineering", "Drama", "Design", "Business", "Statistics"], strengths: ["Computer science", "Engineering", "Drama", "Design"], careers: ["Tech", "Engineering", "Arts", "Robotics"], life: ["Cultural activities", "Restaurants"], greek: "Low", ath: "NCAA D3", spirit: "Moderate", social: "Moderate", pol: "Liberal", outdoor: "Low", climate: "Cold" },
  { id: "georgetown", name: "Georgetown University", short: "Georgetown", city: "Washington", state: "DC", region: "South", type: "Private", setting: "Urban", domain: "georgetown.edu", ug: 7600, acc: 0.13, sat: [1410, 1540], act: [32, 35], outT: 65400, room: 20600, aid: 46000, grad: 0.95, ratio: 11, test: "Test-optional", rel: "Catholic", ed: true, majors: ["International Politics", "Finance", "Government", "Economics", "Science, Technology and International Affairs"], strengths: ["International affairs", "Undergraduate business", "Washington access"], careers: ["Government", "Consulting", "Finance", "Law", "International affairs"], life: ["Cultural activities", "Restaurants", "Nightlife"], greek: "Low", ath: "NCAA D1", spirit: "High", social: "Active", pol: "Liberal", outdoor: "Low", climate: "Temperate" },
  { id: "nyu", name: "New York University", short: "NYU", city: "New York", state: "NY", region: "Northeast", type: "Private", setting: "Urban", domain: "nyu.edu", ug: 29700, acc: 0.12, sat: [1450, 1550], act: [32, 35], outT: 62400, room: 21600, aid: 40000, grad: 0.87, ratio: 8, test: "Test-optional", majors: [...BUS, "Film", "Computer Science", "Psychology", "Drama"], strengths: ["Undergraduate business", "Arts", "Global campuses"], careers: ["Finance", "Media", "Arts", "Tech"], life: ["Nightlife", "Restaurants", "Concerts", "Cultural activities"], greek: "Low", ath: "NCAA D3", spirit: "Low", social: "Active", pol: "Liberal", outdoor: "Low", climate: "Temperate" },
  { id: "usc", name: "University of Southern California", short: "USC", city: "Los Angeles", state: "CA", region: "West", type: "Private", setting: "Urban", domain: "usc.edu", ug: 21000, acc: 0.1, sat: [1410, 1530], act: [32, 35], outT: 68200, room: 18600, aid: 42000, grad: 0.92, ratio: 9, test: "Test-optional", majors: [...BUS, "Cinematic Arts", "Computer Science", "Engineering", "Communications"], strengths: ["Film", "Business", "Alumni network"], careers: ["Entertainment", "Business", "Tech", "Engineering"], life: ["Beaches", "Nightlife", "Restaurants", "Major sports", "Cultural activities"], greek: "High", ath: "NCAA D1", spirit: "High", social: "Active", pol: "Mixed", outdoor: "Moderate", climate: "Warm" },
  { id: "tufts", name: "Tufts University", short: "Tufts", city: "Medford", state: "MA", region: "Northeast", type: "Private", setting: "Suburban", domain: "tufts.edu", ug: 6800, acc: 0.1, sat: [1450, 1550], act: [33, 35], outT: 67600, room: 18200, aid: 48000, grad: 0.94, ratio: 10, test: "Test-optional", ed: true, majors: ["International Relations", "Computer Science", "Biology", "Economics", "Engineering"], strengths: ["International relations", "Civic engagement", "Research"], careers: ["Public policy", "Healthcare", "Consulting", "Tech"], life: ["Cultural activities", "Restaurants"], greek: "Low", ath: "NCAA D3", spirit: "Moderate", social: "Active", pol: "Liberal", outdoor: "Moderate", climate: "Cold" },
  { id: "bc", name: "Boston College", short: "Boston College", city: "Chestnut Hill", state: "MA", region: "Northeast", type: "Private", setting: "Suburban", domain: "bc.edu", ug: 9500, acc: 0.16, sat: [1430, 1540], act: [33, 34], outT: 67600, room: 17200, aid: 46000, grad: 0.92, ratio: 10, test: "Test-optional", rel: "Catholic", ed: true, majors: [...BUS, "Economics", "Political Science", "Nursing", "Biology"], strengths: ["Undergraduate business", "Liberal arts", "Boston internships"], careers: ["Finance", "Consulting", "Healthcare"], life: ["Major sports", "Cultural activities", "Restaurants"], greek: "Low", ath: "NCAA D1", spirit: "High", social: "Active", pol: "Mixed", outdoor: "Moderate", climate: "Cold" },
  { id: "bu", name: "Boston University", short: "BU", city: "Boston", state: "MA", region: "Northeast", type: "Private", setting: "Urban", domain: "bu.edu", ug: 18400, acc: 0.14, sat: [1370, 1480], act: [31, 34], outT: 66200, room: 18600, aid: 42000, grad: 0.89, ratio: 11, test: "Test-optional", ed: true, majors: ["Business", "Communications", "Computer Science", "Biology", "International Relations"], strengths: ["Communications", "Research", "Boston location"], careers: ["Media", "Healthcare", "Business", "Tech"], life: ["Nightlife", "Restaurants", "Cultural activities", "Concerts"], greek: "Low", ath: "NCAA D1", spirit: "Moderate", social: "Active", pol: "Liberal", outdoor: "Low", climate: "Cold" },
  { id: "northeastern", name: "Northeastern University", short: "Northeastern", city: "Boston", state: "MA", region: "Northeast", type: "Private", setting: "Urban", domain: "northeastern.edu", ug: 21000, acc: 0.06, sat: [1440, 1530], act: [33, 35], outT: 63200, room: 19200, aid: 38000, grad: 0.91, ratio: 15, test: "Test-optional", ea: true, majors: [...CS, "Business", "Engineering", "Health Sciences", "International Affairs"], strengths: ["Co-op program", "Experiential learning", "Career placement"], careers: ["Tech", "Engineering", "Business", "Healthcare"], life: ["Restaurants", "Cultural activities", "Nightlife"], greek: "Low", ath: "NCAA D1", spirit: "Moderate", social: "Active", pol: "Liberal", outdoor: "Low", climate: "Cold" },
  { id: "wake", name: "Wake Forest University", short: "Wake Forest", city: "Winston-Salem", state: "NC", region: "South", type: "Private", setting: "Suburban", domain: "wfu.edu", ug: 5500, acc: 0.21, sat: [1410, 1500], act: [32, 34], outT: 64600, room: 17600, aid: 46000, grad: 0.89, ratio: 10, test: "Test-optional", ed: true, majors: ["Business", "Politics and International Affairs", "Biology", "Psychology", "Economics"], strengths: ["Undergraduate teaching", "Business", "Study abroad"], careers: ["Consulting", "Finance", "Healthcare"], life: ["Major sports", "Forests"], greek: "High", ath: "NCAA D1", spirit: "High", social: "Active", pol: "Mixed", outdoor: "Moderate", climate: "Temperate" },
  { id: "tulane", name: "Tulane University", short: "Tulane", city: "New Orleans", state: "LA", region: "South", type: "Private", setting: "Urban", domain: "tulane.edu", ug: 8800, acc: 0.11, sat: [1400, 1490], act: [31, 33], outT: 65200, room: 18200, aid: 42000, grad: 0.87, ratio: 8, test: "Test-optional", ea: true, ed: true, majors: ["Business", "Public Health", "Political Science", "Neuroscience", "Architecture"], strengths: ["Public service", "Business", "Public health"], careers: ["Business", "Public health", "Law"], life: ["Nightlife", "Restaurants", "Concerts", "Cultural activities"], greek: "High", ath: "NCAA D1", spirit: "High", social: "Active", pol: "Liberal", outdoor: "Low", climate: "Hot" },
  { id: "case", name: "Case Western Reserve University", short: "Case Western", city: "Cleveland", state: "OH", region: "Midwest", type: "Private", setting: "Urban", domain: "case.edu", ug: 6100, acc: 0.27, sat: [1410, 1510], act: [32, 35], outT: 64600, room: 17600, aid: 38000, grad: 0.85, ratio: 9, test: "Test-optional", ea: true, majors: [...ENG, "Nursing", "Computer Science", "Biology", "Business"], strengths: ["Engineering", "Pre-med", "Research"], careers: ["Engineering", "Healthcare", "Research"], life: ["Cultural activities", "Lakes"], greek: "Moderate", ath: "NCAA D3", spirit: "Moderate", social: "Moderate", pol: "Mixed", outdoor: "Moderate", climate: "Cold" },
  { id: "villanova", name: "Villanova University", short: "Villanova", city: "Villanova", state: "PA", region: "Northeast", type: "Private", setting: "Suburban", domain: "villanova.edu", ug: 7000, acc: 0.23, sat: [1400, 1480], act: [32, 34], outT: 65200, room: 16800, aid: 38000, grad: 0.91, ratio: 10, test: "Test-optional", rel: "Catholic", ed: true, majors: [...BUS, "Nursing", "Engineering", "Political Science", "Communications"], strengths: ["Undergraduate business", "Nursing", "Alumni network"], careers: ["Finance", "Consulting", "Healthcare", "Engineering"], life: ["Major sports", "Cultural activities"], greek: "Moderate", ath: "NCAA D1", spirit: "High", social: "Active", pol: "Mixed", outdoor: "Moderate", climate: "Temperate" },
  { id: "lehigh", name: "Lehigh University", short: "Lehigh", city: "Bethlehem", state: "PA", region: "Northeast", type: "Private", setting: "Suburban", domain: "lehigh.edu", ug: 5900, acc: 0.29, sat: [1350, 1480], act: [31, 33], outT: 62400, room: 16800, aid: 40000, grad: 0.89, ratio: 10, test: "Test-optional", ed: true, majors: [...ENG, "Business", "Computer Science", "Finance"], strengths: ["Engineering", "Business", "Interdisciplinary programs"], careers: ["Engineering", "Finance", "Consulting"], life: ["Hiking", "Major sports"], greek: "High", ath: "NCAA D1", spirit: "High", social: "Active", pol: "Mixed", outdoor: "Moderate", climate: "Cold" },
  { id: "rpi", name: "Rensselaer Polytechnic Institute", short: "RPI", city: "Troy", state: "NY", region: "Northeast", type: "Private", setting: "Suburban", domain: "rpi.edu", ug: 5900, acc: 0.53, sat: [1360, 1500], act: [30, 34], outT: 62000, room: 17200, aid: 34000, grad: 0.84, ratio: 13, test: "Test-optional", ea: true, majors: [...ENG, "Computer Science", "Architecture", "Games and Simulation Arts"], strengths: ["Engineering", "Computer science", "Architecture"], careers: ["Engineering", "Tech", "Research"], life: ["Hiking", "Lakes"], greek: "Moderate", ath: "NCAA D3", spirit: "Moderate", social: "Moderate", pol: "Mixed", outdoor: "Moderate", climate: "Cold" },
  { id: "wellesley", name: "Wellesley College", short: "Wellesley", city: "Wellesley", state: "MA", region: "Northeast", type: "Private", setting: "Suburban", domain: "wellesley.edu", ug: 2400, acc: 0.14, sat: [1440, 1540], act: [33, 35], outT: 64600, room: 19600, aid: 56000, grad: 0.92, ratio: 7, test: "Test-optional", ea: true, majors: ["Economics", "Computer Science", "Political Science", "Biology", "English"], strengths: ["Women's college", "Undergraduate teaching", "Alumnae network"], careers: ["Consulting", "Law", "Research", "Public service"], life: ["Lakes", "Cultural activities", "Hiking"], greek: "Low", ath: "NCAA D3", spirit: "Moderate", social: "Moderate", pol: "Liberal", outdoor: "Moderate", climate: "Cold" },
  { id: "williams", name: "Williams College", short: "Williams", city: "Williamstown", state: "MA", region: "Northeast", type: "Private", setting: "Rural", domain: "williams.edu", ug: 2100, acc: 0.08, sat: [1480, 1550], act: [33, 35], outT: 66800, room: 16800, aid: 62000, grad: 0.95, ratio: 6, test: "Test-optional", ea: true, majors: ["Economics", "English", "Computer Science", "Biology", "Art History"], strengths: ["Tutorial-style teaching", "Undergraduate research", "Financial aid"], careers: ["Finance", "Consulting", "Education", "Arts"], life: ["Mountains", "Hiking", "Skiing", "Forests"], greek: "Low", ath: "NCAA D3", spirit: "High", social: "Moderate", pol: "Liberal", outdoor: "High", climate: "Cold" },
  { id: "amherst", name: "Amherst College", short: "Amherst", city: "Amherst", state: "MA", region: "Northeast", type: "Private", setting: "Rural", domain: "amherst.edu", ug: 1900, acc: 0.07, sat: [1450, 1550], act: [32, 35], outT: 67000, room: 17600, aid: 64000, grad: 0.95, ratio: 7, test: "Test-optional", ea: true, majors: ["Economics", "English", "Computer Science", "Political Science", "Mathematics"], strengths: ["Open curriculum", "Five College consortium", "Financial aid"], careers: ["Law", "Education", "Finance", "Public service"], life: ["Hiking", "Forests", "Cultural activities"], greek: "Low", ath: "NCAA D3", spirit: "High", social: "Moderate", pol: "Liberal", outdoor: "High", climate: "Cold" },
  { id: "swarthmore", name: "Swarthmore College", short: "Swarthmore", city: "Swarthmore", state: "PA", region: "Northeast", type: "Private", setting: "Suburban", domain: "swarthmore.edu", ug: 1700, acc: 0.07, sat: [1460, 1560], act: [33, 35], outT: 65400, room: 18600, aid: 56000, grad: 0.94, ratio: 8, test: "Test-optional", ea: true, majors: ["Engineering", "Economics", "Computer Science", "Political Science", "Biology"], strengths: ["Honors program", "Engineering at a liberal arts college", "Undergraduate research"], careers: ["Research", "Engineering", "Law", "Public service"], life: ["Forests", "Cultural activities"], greek: "Low", ath: "NCAA D3", spirit: "Moderate", social: "Quiet", pol: "Liberal", outdoor: "Moderate", climate: "Temperate" },
  { id: "pomona", name: "Pomona College", short: "Pomona", city: "Claremont", state: "CA", region: "West", type: "Private", setting: "Suburban", domain: "pomona.edu", ug: 1700, acc: 0.07, sat: [1480, 1540], act: [33, 35], outT: 65400, room: 19800, aid: 56000, grad: 0.94, ratio: 8, test: "Test-optional", ea: true, ed: true, majors: ["Economics", "Computer Science", "Biology", "International Relations", "Mathematics"], strengths: ["Claremont Colleges consortium", "Undergraduate teaching", "Research"], careers: ["Tech", "Research", "Consulting", "Public service"], life: ["Hiking", "Mountains", "Cultural activities", "Beaches"], greek: "Low", ath: "NCAA D3", spirit: "Moderate", social: "Moderate", pol: "Liberal", outdoor: "High", climate: "Warm" },
  { id: "bowdoin", name: "Bowdoin College", short: "Bowdoin", city: "Brunswick", state: "ME", region: "Northeast", type: "Private", setting: "Rural", domain: "bowdoin.edu", ug: 1900, acc: 0.09, sat: [1440, 1540], act: [32, 34], outT: 67000, room: 17200, aid: 56000, grad: 0.94, ratio: 9, test: "Test-optional", ea: true, majors: ["Government", "Economics", "Biology", "English", "Computer Science"], strengths: ["Undergraduate teaching", "Coastal location", "Financial aid"], careers: ["Education", "Public service", "Research", "Consulting"], life: ["Beaches", "Forests", "Hiking", "Fishing"], greek: "Low", ath: "NCAA D3", spirit: "High", social: "Active", pol: "Liberal", outdoor: "High", climate: "Cold" },
  { id: "middlebury", name: "Middlebury College", short: "Middlebury", city: "Middlebury", state: "VT", region: "Northeast", type: "Private", setting: "Rural", domain: "middlebury.edu", ug: 2800, acc: 0.11, sat: [1410, 1510], act: [32, 34], outT: 67000, room: 18200, aid: 52000, grad: 0.93, ratio: 8, test: "Test-optional", ed: true, majors: ["Economics", "International Studies", "Environmental Studies", "English", "Computer Science"], strengths: ["Languages", "Environmental studies", "Study abroad"], careers: ["International affairs", "Education", "Environment", "Consulting"], life: ["Mountains", "Skiing", "Hiking", "Forests"], greek: "Low", ath: "NCAA D3", spirit: "High", social: "Active", pol: "Liberal", outdoor: "High", climate: "Cold" },
  { id: "carleton", name: "Carleton College", short: "Carleton", city: "Northfield", state: "MN", region: "Midwest", type: "Private", setting: "Rural", domain: "carleton.edu", ug: 2000, acc: 0.17, sat: [1430, 1530], act: [31, 34], outT: 65400, room: 16800, aid: 50000, grad: 0.92, ratio: 8, test: "Test-optional", ea: true, majors: ["Computer Science", "Economics", "Biology", "Political Science", "Physics"], strengths: ["Undergraduate teaching", "Sciences", "Trimester calendar"], careers: ["Research", "Education", "Tech", "Consulting"], life: ["Forests", "Hiking", "Lakes"], greek: "Low", ath: "NCAA D3", spirit: "Moderate", social: "Moderate", pol: "Liberal", outdoor: "High", climate: "Cold" },
  { id: "cmc", name: "Claremont McKenna College", short: "CMC", city: "Claremont", state: "CA", region: "West", type: "Private", setting: "Suburban", domain: "cmc.edu", ug: 1400, acc: 0.1, sat: [1450, 1540], act: [32, 35], outT: 65400, room: 19800, aid: 50000, grad: 0.93, ratio: 8, test: "Test-optional", ea: true, ed: true, majors: ["Economics", "Government", "International Relations", "Psychology", "Philosophy, Politics and Economics"], strengths: ["Government", "Economics", "Leadership programs"], careers: ["Finance", "Consulting", "Government", "Law"], life: ["Hiking", "Mountains", "Cultural activities"], greek: "Low", ath: "NCAA D3", spirit: "High", social: "Active", pol: "Mixed", outdoor: "High", climate: "Warm" },
  { id: "harvey-mudd", name: "Harvey Mudd College", short: "Harvey Mudd", city: "Claremont", state: "CA", region: "West", type: "Private", setting: "Suburban", domain: "hmc.edu", ug: 900, acc: 0.13, sat: [1490, 1570], act: [34, 36], outT: 66200, room: 20600, aid: 46000, grad: 0.92, ratio: 8, test: "Test-optional", ea: true, majors: ["Engineering", "Computer Science", "Physics", "Mathematics", "Chemistry"], strengths: ["STEM", "Clinic program", "Claremont consortium"], careers: ["Engineering", "Tech", "Research"], life: ["Hiking", "Mountains"], greek: "Low", ath: "NCAA D3", spirit: "Moderate", social: "Moderate", pol: "Liberal", outdoor: "High", climate: "Warm" },
  { id: "davidson", name: "Davidson College", short: "Davidson", city: "Davidson", state: "NC", region: "South", type: "Private", setting: "Suburban", domain: "davidson.edu", ug: 1900, acc: 0.17, sat: [1360, 1490], act: [31, 33], outT: 61200, room: 16600, aid: 48000, grad: 0.91, ratio: 9, test: "Test-optional", ea: true, ed: true, majors: ["Political Science", "Economics", "Biology", "English", "Computer Science"], strengths: ["Honor code", "Undergraduate teaching", "Study abroad"], careers: ["Consulting", "Education", "Healthcare", "Finance"], life: ["Lakes", "Major sports"], greek: "Moderate", ath: "NCAA D1", spirit: "High", social: "Active", pol: "Mixed", outdoor: "High", climate: "Temperate" },
  { id: "wlu", name: "Washington and Lee University", short: "W&L", city: "Lexington", state: "VA", region: "South", type: "Private", setting: "Rural", domain: "wlu.edu", ug: 1900, acc: 0.17, sat: [1400, 1510], act: [32, 34], outT: 64600, room: 17600, aid: 50000, grad: 0.93, ratio: 8, test: "Test-optional", ea: true, ed: true, majors: ["Business Administration", "Economics", "Political Science", "Accounting", "History"], strengths: ["Undergraduate business", "Journalism", "Honor system"], careers: ["Finance", "Law", "Consulting"], life: ["Mountains", "Hiking", "Forests"], greek: "High", ath: "NCAA D3", spirit: "High", social: "Active", pol: "Mixed", outdoor: "High", climate: "Temperate" },
  { id: "richmond", name: "University of Richmond", short: "Richmond", city: "Richmond", state: "VA", region: "South", type: "Private", setting: "Suburban", domain: "richmond.edu", ug: 3200, acc: 0.24, sat: [1370, 1460], act: [31, 33], outT: 62800, room: 15600, aid: 44000, grad: 0.88, ratio: 8, test: "Test-optional", ea: true, ed: true, majors: ["Business", "Leadership Studies", "Political Science", "Biology", "Economics"], strengths: ["Undergraduate business", "Leadership studies", "Financial aid"], careers: ["Consulting", "Finance", "Business"], life: ["Forests", "Cultural activities"], greek: "High", ath: "NCAA D1", spirit: "High", social: "Active", pol: "Mixed", outdoor: "Moderate", climate: "Temperate" },
  { id: "colgate", name: "Colgate University", short: "Colgate", city: "Hamilton", state: "NY", region: "Northeast", type: "Private", setting: "Rural", domain: "colgate.edu", ug: 3100, acc: 0.12, sat: [1410, 1500], act: [32, 34], outT: 67000, room: 16800, aid: 54000, grad: 0.91, ratio: 9, test: "Test-optional", ea: true, ed: true, majors: ["Economics", "Political Science", "English", "Computer Science", "Biology"], strengths: ["Liberal arts", "Alumni network", "Outdoors"], careers: ["Finance", "Consulting", "Education"], life: ["Lakes", "Hiking", "Skiing", "Forests"], greek: "High", ath: "NCAA D1", spirit: "High", social: "Active", pol: "Mixed", outdoor: "High", climate: "Cold" },
  { id: "bucknell", name: "Bucknell University", short: "Bucknell", city: "Lewisburg", state: "PA", region: "Northeast", type: "Private", setting: "Rural", domain: "bucknell.edu", ug: 3700, acc: 0.32, sat: [1300, 1450], act: [29, 32], outT: 64600, room: 16200, aid: 40000, grad: 0.88, ratio: 9, test: "Test-optional", ea: true, ed: true, majors: [...ENG, "Management", "Economics", "Biology", "Computer Science"], strengths: ["Engineering and liberal arts", "Undergraduate research"], careers: ["Engineering", "Finance", "Consulting"], life: ["Forests", "Hiking"], greek: "High", ath: "NCAA D1", spirit: "High", social: "Active", pol: "Mixed", outdoor: "High", climate: "Cold" },
  { id: "oberlin", name: "Oberlin College", short: "Oberlin", city: "Oberlin", state: "OH", region: "Midwest", type: "Private", setting: "Rural", domain: "oberlin.edu", ug: 2900, acc: 0.34, sat: [1350, 1480], act: [30, 33], outT: 64600, room: 17600, aid: 42000, grad: 0.82, ratio: 9, test: "Test-optional", ea: true, majors: [...ARTS, "Politics", "Environmental Studies", "Computer Science", "Biology"], strengths: ["Conservatory", "Arts", "Social engagement"], careers: ["Arts", "Education", "Nonprofit"], life: ["Cultural activities", "Concerts", "Forests"], greek: "Low", ath: "NCAA D3", spirit: "Moderate", social: "Active", pol: "Liberal", outdoor: "Moderate", climate: "Cold" },
  { id: "grinnell", name: "Grinnell College", short: "Grinnell", city: "Grinnell", state: "IA", region: "Midwest", type: "Private", setting: "Rural", domain: "grinnell.edu", ug: 1700, acc: 0.11, sat: [1410, 1520], act: [31, 34], outT: 65400, room: 15200, aid: 48000, grad: 0.87, ratio: 9, test: "Test-optional", ea: true, majors: ["Computer Science", "Economics", "Political Science", "Biology", "History"], strengths: ["Independent curriculum", "Social justice", "Undergraduate research"], careers: ["Research", "Education", "Public service", "Tech"], life: ["Forests", "Cultural activities"], greek: "Low", ath: "NCAA D3", spirit: "Moderate", social: "Moderate", pol: "Liberal", outdoor: "Moderate", climate: "Cold" },
  { id: "macalester", name: "Macalester College", short: "Macalester", city: "Saint Paul", state: "MN", region: "Midwest", type: "Private", setting: "Urban", domain: "macalester.edu", ug: 2200, acc: 0.28, sat: [1350, 1490], act: [30, 33], outT: 64600, room: 14600, aid: 44000, grad: 0.88, ratio: 10, test: "Test-optional", ea: true, majors: ["Economics", "International Studies", "Computer Science", "Biology", "Political Science"], strengths: ["Internationalism", "Undergraduate teaching", "Twin Cities internships"], careers: ["Nonprofit", "Public policy", "Consulting"], life: ["Lakes", "Cultural activities", "Restaurants"], greek: "Low", ath: "NCAA D3", spirit: "Moderate", social: "Active", pol: "Liberal", outdoor: "High", climate: "Cold" },
  { id: "reed", name: "Reed College", short: "Reed", city: "Portland", state: "OR", region: "West", type: "Private", setting: "Urban", domain: "reed.edu", ug: 1400, acc: 0.31, sat: [1320, 1480], act: [29, 33], outT: 67000, room: 16600, aid: 46000, grad: 0.76, ratio: 9, test: "Test-optional", ea: true, majors: ["Biology", "Physics", "English", "Psychology", "Computer Science"], strengths: ["Senior thesis", "Intellectual culture", "Sciences"], careers: ["Research", "Graduate school", "Education"], life: ["Forests", "Hiking", "Cultural activities", "Restaurants"], greek: "Low", ath: "NCAA D3", spirit: "Low", social: "Quiet", pol: "Liberal", outdoor: "High", climate: "Temperate" },
  { id: "colorado-college", name: "Colorado College", short: "Colorado College", city: "Colorado Springs", state: "CO", region: "West", type: "Private", setting: "Urban", domain: "coloradocollege.edu", ug: 2200, acc: 0.16, sat: [1290, 1450], act: [29, 33], outT: 67000, room: 15200, aid: 42000, grad: 0.86, ratio: 10, test: "Test-optional", ea: true, ed: true, majors: ["Environmental Studies", "Economics", "Biology", "Political Science", "Computer Science"], strengths: ["Block plan", "Outdoors", "Environmental studies"], careers: ["Environment", "Education", "Nonprofit"], life: ["Mountains", "Hiking", "Skiing", "Camping"], greek: "Low", ath: "NCAA D3", spirit: "High", social: "Active", pol: "Liberal", outdoor: "High", climate: "Variable" },
];

export const COLLEGES: College[] = seeds.map(expand);

export function getCollege(id: string) {
  return COLLEGES.find((c) => c.id === id);
}

export function logoUrl(college: College) {
  return `https://www.google.com/s2/favicons?domain=${college.domain}&sz=128`;
}
