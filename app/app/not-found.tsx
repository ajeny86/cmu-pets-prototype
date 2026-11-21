import { ComingSoon } from "@/components/buddy/coming-soon"

/* Any address that doesn't exist: buddy-styled 404 instead of the default white page. */
export default function NotFound() {
  return (
    <ComingSoon
      title="Page not found"
      heading="Nothing here"
      clue="not-found"
      lede="We couldn’t find this page — it may have moved."
      note="Error 404. Head back home and try again from there."
    />
  )
}
