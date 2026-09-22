import { redirect } from "next/navigation";

/** Hub is now the Colleges feed. */
export default function CollegesHubPage() {
  redirect("/colleges");
}
