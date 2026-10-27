import type { Metadata } from "next";
import { LandingPage } from "../components/LandingPage";

export const metadata: Metadata = {
  title: "Aether — Find the future that fits",
  description:
    "Find the future that fits. Then build the way there. Aether helps students figure out their future and achieve it: a direction, colleges they can reach, a path, and a resume.",
};

export default function Page() {
  return <LandingPage />;
}
