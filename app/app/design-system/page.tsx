import type { Metadata } from "next"

import { AiDock, AiField, AskPill, ClueGreeting } from "@/components/buddy/ai"
import { AppHeader } from "@/components/buddy/app-header"
import { Clue, cluePoses, type ClueState } from "@/components/buddy/clue"
import { ChoiceCard, MatchCard } from "@/components/buddy/cards"
import {
  BagTopicIcon,
  CalendarIcon,
  CareTopicIcon,
  HeartTopicIcon,
  SearchTopicIcon,
} from "@/components/buddy/icons"
import { TabBar } from "@/components/buddy/tab-bar"
import { TopicTile } from "@/components/buddy/topic-tile"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Toggle } from "@/components/ui/toggle"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

export const metadata: Metadata = { title: "Design system · buddy" }

/* Mirrors Figma "2 · Colours, type, components" (479:561). */

const swatches = [
  { name: "--navy", value: "#10288B", use: "text", className: "bg-navy" },
  { name: "--green", value: "#05A544", use: "logo", className: "bg-green" },
  { name: "--pink", value: "#F37CFF", use: "AI", className: "bg-pink" },
  { name: "--muted", value: "#5A6696", use: "meta", className: "bg-muted-foreground" },
  { name: "--mint", value: "#F5F7FD", use: "page", className: "bg-mint ring-2 ring-line ring-inset" },
  { name: "--periwinkle", value: "#9EA8CC", use: "lines", className: "bg-periwinkle" },
  { name: "--teal", value: "#175A54", use: "match", className: "bg-teal" },
  { name: "--danger", value: "#B02FC0", use: "error", className: "bg-destructive" },
  { name: "--cream", value: "#FFFDF8", use: "match card", className: "bg-cream ring-2 ring-line ring-inset" },
  { name: "--sage", value: "#A9D4C4", use: "photo", className: "bg-sage" },
]

function Section({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4 border-t border-line pt-8">
      <div>
        <h2 className="text-[24px] leading-7 font-extrabold tracking-[-0.4px]">{title}</h2>
        {note && <p className="mt-1 text-sm text-muted-foreground">{note}</p>}
      </div>
      {children}
    </section>
  )
}

function Spec({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-meta font-semibold text-muted-foreground">{label}</span>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  )
}

export default function DesignSystemPage() {
  return (
    <div className="min-h-svh bg-mint">
      <div className="mx-auto flex max-w-5xl flex-col gap-10 px-4 py-12 sm:px-8">
        <header className="flex flex-col gap-2.5">
          <p className="text-base font-bold tracking-[2px] text-green-dark">Design System</p>
          <h1 className="text-[40px] leading-[1.05] font-extrabold tracking-[-1.5px] sm:text-[52px]">
            One navy, one green, a pink for AI
          </h1>
          <p className="text-lg text-muted-foreground">
            buddy tokens on shadcn/ui. Source: Figma CMU Pets · 479:561 and the hi-fi prototype screens.
          </p>
        </header>

        <Section title="Clue · states" note="One pose per moment. Use <Clue state=… /> — pink stays reserved for Clue.">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {(Object.keys(cluePoses) as ClueState[]).map((state) => (
              <div key={state} className="flex flex-col gap-3 rounded-card bg-white p-4 shadow-soft">
                <div>
                  <span className="inline-flex rounded-full bg-tint px-2.5 py-0.5 text-xs font-semibold">
                    {cluePoses[state].label}
                  </span>
                  <p className="mt-1.5 text-sm text-navy">{cluePoses[state].use}</p>
                  <code className="text-meta text-muted-foreground">state=&quot;{state}&quot;</code>
                </div>
                <Clue state={state} width={140} className="self-center" />
              </div>
            ))}
          </div>
        </Section>

        <Section title="Colour">
          <div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
            {swatches.map((s) => (
              <div key={s.name} className="flex items-center gap-3.5">
                <div className={`size-12 shrink-0 rounded-[16px] ${s.className}`} />
                <div className="text-base leading-tight">
                  <p className="font-bold">{s.name}</p>
                  <p className="text-muted-foreground">
                    {s.value} · {s.use}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Type · Google Sans Flex">
          <div className="flex max-w-md flex-col divide-y divide-line">
            <div className="pb-3">
              <p className="text-h1">Let’s find Luna</p>
              <p className="text-meta text-muted-foreground">text-h1 · 32/35 · 800 · −1 tracking</p>
            </div>
            <div className="py-3">
              <p className="text-section">Pet details</p>
              <p className="text-meta text-muted-foreground">text-section · 20/24 · 800</p>
            </div>
            <div className="py-3">
              <p className="text-body">She is small and grey</p>
              <p className="text-meta text-muted-foreground">text-body · 14/19 · 500</p>
            </div>
            <div className="pt-3">
              <p className="text-meta text-muted-foreground">Meta, labels · text-meta · 11–12 · muted</p>
            </div>
          </div>
        </Section>

        <Section title="Pill button" note="Navy 48 h · white 44 h. Green and pink (AI) for special actions.">
          <Spec label="variant">
            <Button>Yes, it’s Luna</Button>
            <Button variant="outline">No, not my pet</Button>
            <Button variant="green">Search now</Button>
            <Button variant="ai">✧ Ask Clue</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">Link</Button>
            <Button disabled>Disabled</Button>
          </Spec>
          <Spec label="size">
            <Button size="lg">Large</Button>
            <Button>Default</Button>
            <Button size="sm">Small</Button>
            <Button size="icon" aria-label="Add">+</Button>
          </Spec>
        </Section>

        <Section title="Chip" note="36 h · on = navy fill. soft / ai variants are the report-form chips.">
          <Spec label="default (single select)">
            <ToggleGroup defaultValue={["cat"]}>
              <ToggleGroupItem value="cat">Cat</ToggleGroupItem>
              <ToggleGroupItem value="dog">Dog</ToggleGroupItem>
              <ToggleGroupItem value="other">··· Other</ToggleGroupItem>
            </ToggleGroup>
          </Spec>
          <Spec label="size sm (mini)">
            <ToggleGroup size="sm" defaultValue={["morning"]}>
              <ToggleGroupItem value="morning">Morning</ToggleGroupItem>
              <ToggleGroupItem value="afternoon">Afternoon</ToggleGroupItem>
              <ToggleGroupItem value="night">Night</ToggleGroupItem>
            </ToggleGroup>
          </Spec>
          <Spec label="soft · ai">
            <Toggle variant="soft" size="lg">Just now</Toggle>
            <Toggle variant="soft" size="lg" defaultPressed>
              Yesterday
            </Toggle>
            <Toggle variant="ai" size="lg" defaultPressed>
              Today
            </Toggle>
            <Toggle variant="soft" size="lg">
              <CalendarIcon /> Pick a date
            </Toggle>
          </Spec>
        </Section>

        <Section title="Tag">
          <Spec label="badge">
            <Badge variant="lost">Lost</Badge>
            <Badge variant="found">Found</Badge>
            <Badge variant="other">Other</Badge>
            <Badge variant="match">88% match confidence</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="destructive">Missing</Badge>
          </Spec>
        </Section>

        <div className="grid gap-10 lg:grid-cols-2">
          <Section title="Choice card" note="Light or navy · r 22">
            <div className="flex max-w-[353px] flex-col gap-3">
              <ChoiceCard
                dark
                tag={<Badge variant="lost">Lost</Badge>}
                title="I lost my pet"
                description="Report it and we start searching right away."
              />
              <ChoiceCard
                tag={<Badge variant="found">Found</Badge>}
                title="I found a pet"
                description="Add a photo — we check it against lost reports."
              />
            </div>
          </Section>

          <Section title="Match card" note="Cream + teal % tag">
            <MatchCard
              className="max-w-[353px]"
              confidence={88}
              title="Found cat report"
              note="Reported recently by a neighbour · in their care"
              reasons={[
                { ok: true, text: "Looks like your description: “She is small and grey with white paws”" },
                { ok: true, text: "Found ~300 m from The train station" },
                { ok: true, text: "Found after the time Luna went missing" },
                { ok: false, text: "No collar visible — chip not checked yet" },
              ]}
            />
          </Section>

          <Section title="AI field" note="✧ + pink outline: a value Clue filled in">
            <div className="flex max-w-[353px] flex-col gap-3">
              <AiField icon={<CalendarIcon />}>Today · 08:00</AiField>
              <AiField fromAi={false}>The train station</AiField>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="ds-name">Name</Label>
                <Input id="ds-name" placeholder="Pet’s name" />
              </div>
              <Textarea placeholder="Special features" />
            </div>
          </Section>

          <Section title="AI dock" note="Mic, text, send">
            <div className="flex max-w-[353px] flex-col gap-4">
              <AiDock question="Want me to keep searching and tell you when someone finds Luna?" skippable placeholder="Phone or email" />
              <AskPill />
            </div>
          </Section>

          <Section title="Clue · greeting">
            <div className="max-w-[353px]">
              <ClueGreeting />
            </div>
          </Section>

          <Section title="Topic tiles">
            <div className="grid max-w-[353px] grid-cols-2 gap-2.5">
              <TopicTile href="/lost-found" tone="navy" icon={<SearchTopicIcon />} title="Lost & Found" subtitle="Report or find" />
              <TopicTile href="/adoption" tone="pink" icon={<HeartTopicIcon />} title="Adoption" subtitle="Find a friend" />
              <TopicTile href="/services" tone="green" icon={<CareTopicIcon />} title="Services & Care" subtitle="Vets & grooming" />
              <TopicTile href="/shop" tone="lilac" icon={<BagTopicIcon />} title="Shop" subtitle="Pet essentials" />
            </div>
          </Section>

          <Section title="Card">
            <Card className="max-w-[353px]">
              <CardHeader>
                <CardTitle>Pet details</CardTitle>
                <CardDescription>shadcn Card on buddy tokens · r 22, soft shadow</CardDescription>
              </CardHeader>
              <CardContent className="text-body">She is small and grey.</CardContent>
            </Card>
          </Section>

          <Section title="Header · Tab bar" note="5 tabs + pink FAB; members get 4 flat tabs">
            <div className="flex max-w-[393px] flex-col gap-10 overflow-hidden rounded-[24px] bg-(image:--page-grad) pt-2">
              <AppHeader />
              <TabBar inline />
              <TabBar inline member />
            </div>
          </Section>
        </div>
      </div>
    </div>
  )
}
