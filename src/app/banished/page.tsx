import { redirect } from "next/navigation";

export default function BanishedRedirect() {
  redirect("/colleges/not-interested");
}
