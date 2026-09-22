import { CAREERS } from "../../../data/careers";
import CareerDetailClient from "./CareerDetailClient";

export function generateStaticParams() {
  return CAREERS.map((c) => ({ id: c.id }));
}

export default function Page() {
  return <CareerDetailClient />;
}
