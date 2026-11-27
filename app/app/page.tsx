import { AskPill, ClueGreeting } from "@/components/buddy/ai"
import {
  BagTopicIcon,
  CareTopicIcon,
  HeartTopicIcon,
  SearchTopicIcon,
} from "@/components/buddy/icons"
import { Screen } from "@/components/buddy/screen"
import { TopicTile } from "@/components/buddy/topic-tile"

/* 01 · Home (Figma 461:461) */
export default function HomePage() {
  return (
    <Screen>
      <div className="pt-[22px]">
        <h1 className="text-display">
          How can we
          <br />
          help you today?
        </h1>
        <p className="mt-2 max-w-[220px] text-sm leading-[19px] text-muted-foreground">
          Everything for you and your pet, in one place.
        </p>
      </div>

      <div className="mt-[26px] flex flex-col gap-3.5">
        <ClueGreeting />
        <AskPill />
      </div>

      <h2 className="mt-[30px] text-lg font-extrabold tracking-[-0.4px]">Or explore by topic</h2>
      <div className="mt-3 grid grid-cols-2 gap-2.5">
        <TopicTile href="/lost-found" tone="navy" icon={<SearchTopicIcon />} title="Lost & Found" subtitle="Report or find" />
        <TopicTile href="/adoption" tone="pink" icon={<HeartTopicIcon />} title="Adoption" subtitle="Find a friend" />
        <TopicTile href="/services" tone="green" icon={<CareTopicIcon />} title="Services & Care" subtitle="Vets & grooming" />
        <TopicTile href="/shop" tone="lilac" icon={<BagTopicIcon />} title="Shop" subtitle="Pet essentials" />
      </div>
    </Screen>
  )
}
