import { COLLEGES } from "../../../data/colleges";
import CollegeProfileClient from "./CollegeProfileClient";

export function generateStaticParams() {
  return COLLEGES.map((c) => ({ id: c.id }));
}

export default function Page() {
  return <CollegeProfileClient />;
}
