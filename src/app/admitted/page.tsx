import { redirect } from "next/navigation";

export default function AdmittedRedirect() {
  redirect("/colleges/get-admitted");
}
