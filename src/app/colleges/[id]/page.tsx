import { COLLEGES } from "../../../data/colleges";
import CollegeProfileClient from "./CollegeProfileClient";

export const dynamicParams = true;

export function generateStaticParams() {
  return COLLEGES.map((c) => ({ id: c.id }));
}

export default function Page() {
  return <CollegeProfileClient />;
}
