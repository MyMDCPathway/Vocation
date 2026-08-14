import { redirect } from "next/navigation";

// /classic is the section, /classic/home is its front page.
//
// This exists so the section root isn't a 404 — every "Classic search" entry
// point can just say /classic and land on the real thing. The original 1.0
// home page lives at /classic/home, restored verbatim from the commit that
// replaced it ("Vocation 2.0: invert the flow to career-first").
export default function ClassicIndex() {
  redirect("/classic/home");
}
