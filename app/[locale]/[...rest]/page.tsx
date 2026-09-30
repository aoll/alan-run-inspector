import { notFound } from "next/navigation";

// Any URL no other route matches (`/nope`, `/fr/nope/zzz`): the proxy gives an unprefixed URL the default
// locale, so it lands here and renders the translated `../not-found.tsx` inside the localized layout.
export default function UnknownPage() {
  notFound();
}
