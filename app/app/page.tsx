import { AskPill, ClueGreeting } from "@/components/buddy/ai"
import { BagTopicIcon, CareTopicIcon, HeartTopicIcon, SearchTopicIcon } from "@/components/buddy/icons"
import { RecentActivity } from "@/components/buddy/recent-activity"
import { Screen } from "@/components/buddy/screen"
import { TopicTile } from "@/components/buddy/topic-tile"

/* 01 · Home (Figma 461:461) */
export default function HomePage() {
  return (
    <Screen width="wide">
      <div className="md:grid md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] md:items-center md:gap-12 md:pt-6">
        <div>
          <div className="pt-[22px] md:pt-0">
            <h1 className="text-display md:text-[52px] md:leading-[54px] md:tracking-[-1.8px]">
              How can we
              <br />
              help you today?
            </h1>
            <p className="mt-2 max-w-[220px] text-sm leading-[19px] text-muted-foreground md:mt-4 md:max-w-none md:text-base">
              Everything for you and your pet, in one place.
            </p>
          </div>

          <div className="mt-[26px] flex flex-col gap-3.5 md:mt-8 md:max-w-[520px]">
            <ClueGreeting />
            <AskPill />
            <p className="hidden text-xs text-muted-foreground md:block">
              Try: “I lost my cat Luna near Central Park this morning” · “I want to adopt a puppy” · “my dog needs vaccines”
            </p>
          </div>
        </div>

        <div>
          <h2 className="mt-[30px] text-lg font-extrabold tracking-[-0.4px] md:mt-0">Or explore by topic</h2>
          <div className="mt-3 grid grid-cols-2 gap-2.5 md:gap-4 md:[&>a]:min-h-[120px] md:[&>a]:p-5">
            <TopicTile href="/lost-found" tone="navy" icon={<SearchTopicIcon />} title="Lost & Found" subtitle="Report or find" />
            <TopicTile href="/adoption" tone="pink" icon={<HeartTopicIcon />} title="Adoption" subtitle="Find a friend" />
            <TopicTile href="/services" tone="green" icon={<CareTopicIcon />} title="Services & Care" subtitle="Vets & grooming" />
            <TopicTile href="/shop" tone="lilac" icon={<BagTopicIcon />} title="Shop" subtitle="Pet essentials" />
          </div>
        </div>
      </div>
      <RecentActivity />
    </Screen>
  )
}
