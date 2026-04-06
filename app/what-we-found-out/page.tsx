import type { ReactNode } from "react";
import Link from "next/link";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";
import { cn } from "@/lib/utils";

const body =
  "text-[15px] leading-[1.82] text-text-secondary/78 sm:text-[17px] sm:leading-[1.78] tracking-[-0.008em]";

const strong = "font-medium text-text-primary/[0.92]";

/** Same gradient as “when you need it.” in `Hero.tsx`. */
const headlineGradient =
  "bg-gradient-to-r from-emerald-200/[0.92] via-[#e8e4dc]/90 to-violet-200/[0.88] bg-clip-text text-transparent";

/** In-page outline — ids must match Section / blocks below. */
const ON_PAGE: { id: string; label: string }[] = [
  { id: "opening", label: "Opening" },
  { id: "bottleneck-product-knowledge", label: "The real bottleneck: product knowledge" },
  { id: "onboarding-longer", label: "Why onboarding takes longer than expected" },
  { id: "where-things-break", label: "Where things start to break" },
  { id: "hesitation-means", label: "What hesitation really means" },
  { id: "search-cost", label: "The hidden cost of searching for answers" },
  { id: "training-falls-short", label: "Why traditional training falls short" },
  { id: "moves-needle", label: "What actually moves the needle" },
  { id: "leverage-point", label: "The leverage point" },
  { id: "core-idea", label: "The core idea" },
  { id: "right-support", label: "What changes with the right support" },
  { id: "bottom-line", label: "Bottom line" },
  { id: "get-persuaid", label: "Persuaid" },
];

function PageOutline() {
  return (
    <nav aria-label="On this page" className="border-b border-white/[0.06]">
      <details className="group py-5 sm:py-6">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[13px] font-medium tracking-[-0.01em] text-text-primary/78 outline-none transition-colors hover:text-text-primary/90 [&::-webkit-details-marker]:hidden">
          <span>On this page</span>
          <svg
            className="h-4 w-4 shrink-0 text-white/30 transition-transform duration-200 ease-out group-open:rotate-180"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.75}
            aria-hidden
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </summary>
        <ul className="mt-4 max-h-[min(50vh,22rem)] space-y-0.5 overflow-y-auto border-t border-white/[0.05] pt-4 sm:max-h-[min(55vh,26rem)]" role="list">
          {ON_PAGE.map((item) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className="block rounded-md py-2 pl-1 pr-2 text-[13px] leading-snug text-text-secondary/80 transition-colors hover:bg-white/[0.03] hover:text-text-primary/88 sm:text-[14px] sm:leading-relaxed"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </details>
    </nav>
  );
}

function InsightCard({ children }: { children: ReactNode }) {
  return (
    <div className="my-9 sm:my-10">
      <div className="flex gap-5 sm:gap-6">
        <div className="w-px shrink-0 bg-gradient-to-b from-white/[0.14] via-white/[0.08] to-white/[0.03]" aria-hidden />
        <div className="min-w-0 pt-0.5 text-[16px] leading-[1.62] tracking-[-0.012em] text-text-primary/[0.9] sm:text-[17px] sm:leading-[1.58]">
          {children}
        </div>
      </div>
    </div>
  );
}

function PullQuote({ children }: { children: ReactNode }) {
  return (
    <figure className="my-12 sm:my-16 lg:my-[4.5rem]">
      <blockquote className="border-l border-white/[0.1] pl-6 sm:pl-8 lg:pl-10">
        <p className="text-[1.1875rem] font-light leading-[1.5] tracking-[-0.025em] text-text-primary/[0.88] sm:text-[1.3125rem] sm:leading-[1.48] lg:text-[1.375rem]">
          {children}
        </p>
      </blockquote>
    </figure>
  );
}

function EditorialList({ items }: { items: string[] }) {
  return (
    <ul className="my-7 space-y-3.5 sm:my-8 sm:space-y-4" role="list">
      {items.map((item) => (
        <li key={item} className="flex gap-4 sm:gap-5">
          <span className="mt-[0.55em] h-px w-3 shrink-0 bg-white/20 sm:w-4" aria-hidden />
          <span className={`min-w-0 ${body}`}>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function SectionRule() {
  return <div className="h-px w-full bg-white/[0.06]" aria-hidden />;
}

function Section({
  id,
  title,
  children,
  variant = "default",
}: {
  id: string;
  title: string;
  children: ReactNode;
  variant?: "default" | "soft";
}) {
  const bodyBlock = <div className={cn("mt-7 space-y-6 sm:mt-8 sm:space-y-[1.35rem]", body)}>{children}</div>;

  const heading = (
    <h2
      id={id}
      className="scroll-mt-28 font-sans text-[1.0625rem] font-medium leading-snug tracking-[-0.018em] text-text-primary/[0.88] sm:text-lg lg:text-[1.125rem]"
    >
      {title}
    </h2>
  );

  if (variant === "soft") {
    return (
      <section className="relative scroll-mt-28">
        <div className="rounded-2xl border border-white/[0.045] bg-white/[0.012] px-6 py-9 sm:rounded-[1.375rem] sm:px-8 sm:py-10 lg:px-10 lg:py-11">
          {heading}
          {bodyBlock}
        </div>
      </section>
    );
  }

  return (
    <section className="relative scroll-mt-28 pt-16 sm:pt-[4.25rem] lg:pt-[5rem]">
      {heading}
      {bodyBlock}
    </section>
  );
}

export default function WhatWeFoundOutPage() {
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background-near-black antialiased">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[min(48vh,32rem)] bg-[radial-gradient(ellipse_72%_52%_at_50%_-8%,rgba(26,157,120,0.075),transparent_58%)]"
        aria-hidden
      />

      <Navbar landing />

      <article className="relative z-10 mx-auto max-w-[min(100%,38rem)] px-5 pb-36 pt-4 sm:max-w-[40rem] sm:px-10 sm:pb-40 sm:pt-6 lg:max-w-[41.5rem] lg:px-12 lg:pb-44 lg:pt-8">
        <header className="border-b border-white/[0.06] pb-12 pt-12 sm:pb-14 sm:pt-16 lg:pb-16 lg:pt-20">
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/[0.28] sm:text-[11px] sm:tracking-[0.18em]">
            Field notes
          </p>
          <h1 className="mt-6 max-w-[36ch] font-sans text-[clamp(1.375rem,3.8vw,1.875rem)] font-semibold leading-[1.2] tracking-[-0.03em] text-text-primary/[0.96] sm:mt-7 sm:max-w-none sm:text-[clamp(1.5rem,3.2vw,2rem)] sm:leading-[1.22]">
            We spoke to over <strong className={strong}>1,000</strong> sales coaches, agents, and agency operators
            to understand a simple question:
          </h1>
          <p className="mt-5 max-w-[min(36ch,100%)] text-[1.1875rem] leading-[1.42] sm:mt-6 sm:max-w-none sm:text-[1.3125rem] sm:leading-[1.38]">
            <span className={cn("block font-semibold tracking-[-0.022em]", headlineGradient)}>
              Why do most new agents never even make it to their first real call?
            </span>
          </p>
        </header>

        <PageOutline />

        <div id="opening" className={`scroll-mt-28 border-b border-white/[0.06] py-12 sm:py-14 lg:py-16 ${body}`}>
          <p>Across different teams, industries, and experience levels, the pattern was surprisingly consistent.</p>
          <p>Drop-off doesn&apos;t happen because people can&apos;t sell.</p>
          <p>It happens earlier than that.</p>
          <p>
            It happens because most reps never reach the point where they feel{" "}
            <strong className={strong}>prepared enough to try</strong>.
          </p>
          <p className="pt-2 text-[13px] leading-relaxed text-white/40 sm:text-sm">As one sales manager put it:</p>
          <PullQuote>
            &ldquo;Most reps don&apos;t fail on the phone — they fail before they even pick it up.&rdquo;
          </PullQuote>
        </div>

        <div className="flex flex-col">
          <Section id="bottleneck-product-knowledge" title="The real bottleneck: product knowledge">
            <p>
              In sales, confidence isn&apos;t a personality trait. It&apos;s a <strong className={strong}>byproduct of clarity</strong>.
            </p>
            <p>
              When a rep fully understands what they&apos;re selling — how it works, how it&apos;s priced, how to handle edge cases —
              they move naturally. Conversations feel smooth. Responses feel immediate.
            </p>
            <p>But when that clarity isn&apos;t there, hesitation shows up.</p>
            <p>Reps pause. They second-guess. They search for the right words.</p>
            <p>And buyers can feel it.</p>
            <p>
              Even small delays in response can come across as uncertainty or lack of confidence — not because the rep doesn&apos;t
              care, but because they&apos;re trying to find the right answer in real time.
            </p>
          </Section>

          <div className="py-10 sm:py-12 lg:py-14">
            <SectionRule />
          </div>

          <Section id="onboarding-longer" title="Why onboarding takes longer than expected" variant="soft">
            <p>
              On average, it takes about <strong className={strong}>3.2 months</strong> for a new agent to feel comfortable operating
              independently.
            </p>
            <p>Not because the job is inherently difficult.</p>
            <p>But because product knowledge isn&apos;t something you absorb all at once.</p>
            <p>It requires:</p>
            <EditorialList items={["repetition", "context", "real conversations"]} />
            <p>Not just memorization.</p>
            <p>Most reps don&apos;t struggle with effort — they struggle with applying what they&apos;ve learned when it actually matters.</p>
          </Section>

          <div className="py-10 sm:py-12 lg:py-14">
            <SectionRule />
          </div>

          <Section id="where-things-break" title="Where things start to break">
            <p>Early in onboarding, reps are expected to:</p>
            <EditorialList items={["learn large amounts of information", "recall it instantly", "apply it under pressure"]} />
            <p>
              That gap — between <strong className={strong}>learning</strong> and <strong className={strong}>execution</strong> — is where
              most people get stuck.
            </p>
            <p>Without a strong foundation, reps don&apos;t feel ready.</p>
            <p>So they:</p>
            <EditorialList items={["delay making calls", "avoid difficult conversations", "or quietly disengage altogether"]} />
            <p>This isn&apos;t a motivation problem.</p>
            <p>It&apos;s a preparedness problem.</p>
          </Section>

          <div className="py-10 sm:py-12 lg:py-14">
            <SectionRule />
          </div>

          <Section id="hesitation-means" title="What hesitation really means" variant="soft">
            <p>Hesitation isn&apos;t random.</p>
            <p>It&apos;s a signal.</p>
            <InsightCard>&ldquo;I don&apos;t fully know what to say here.&rdquo;</InsightCard>
            <p>And once that moment hits on a live call, the dynamic changes.</p>
            <p>What should be a smooth conversation turns into:</p>
            <EditorialList items={["pauses", "filler", "uncertainty"]} />
            <p>And that&apos;s where trust starts to drop.</p>
            <p>Not because the rep lacks ability — but because they lack immediate access to clarity.</p>
          </Section>

          <div className="py-10 sm:py-12 lg:py-14">
            <SectionRule />
          </div>

          <Section id="search-cost" title="The hidden cost of searching for answers">
            <p>
              Across knowledge-based work, it&apos;s often estimated that around <strong className={strong}>~20%</strong> of time is spent
              searching for information.
            </p>
            <p>In most roles, that&apos;s an inconvenience.</p>
            <p>In sales, it&apos;s a problem.</p>
            <p>Because that search happens:</p>
            <InsightCard>live, during the conversation</InsightCard>
            <p>It shows up as hesitation.</p>
            <p>It breaks flow.</p>
            <p>It creates doubt.</p>
            <p className="pt-2 text-[13px] leading-relaxed text-white/40 sm:text-sm">As one agency owner told us:</p>
            <PullQuote>
              &ldquo;The answer exists — it&apos;s just never where the rep needs it when the question comes up.&rdquo;
            </PullQuote>
          </Section>

          <div className="py-10 sm:py-12 lg:py-14">
            <SectionRule />
          </div>

          <Section id="training-falls-short" title="Why traditional training falls short" variant="soft">
            <p>Most training is built around:</p>
            <EditorialList items={["memorization", "static scripts", "pre-call preparation"]} />
            <p>And while that helps, it doesn&apos;t solve the real issue.</p>
            <p>Because product knowledge isn&apos;t something you &ldquo;finish learning.&rdquo;</p>
            <p>It&apos;s something you develop through use.</p>
            <p>
              Without that, reps may technically &ldquo;know&rdquo; the material — but still freeze when they need to apply it under
              pressure.
            </p>
          </Section>

          <div className="py-10 sm:py-12 lg:py-14">
            <SectionRule />
          </div>

          <Section id="moves-needle" title="What actually moves the needle">
            <p>What we saw consistently is this:</p>
            <p>When reps have a system that allows them to:</p>
            <EditorialList
              items={[
                "access the right information instantly",
                "understand how to respond in real situations",
                "reinforce knowledge while they're using it",
              ]}
            />
            <p>Everything changes.</p>
            <p>They don&apos;t wait months to feel ready.</p>
            <p>They start building confidence from day one.</p>
          </Section>

          <div className="py-10 sm:py-12 lg:py-14">
            <SectionRule />
          </div>

          <Section id="leverage-point" title="The leverage point" variant="soft">
            <p>If you can reduce the time it takes for a rep to feel:</p>
            <InsightCard>&ldquo;I know what I&apos;m doing&rdquo;</InsightCard>
            <p>You change everything downstream.</p>
            <p>You reduce:</p>
            <EditorialList items={["hesitation", "ramp time", "early drop-off"]} />
            <p>And you increase:</p>
            <EditorialList items={["confidence on calls", "consistency in performance", "long-term retention"]} />
          </Section>

          <div className="py-10 sm:py-12 lg:py-14">
            <SectionRule />
          </div>

          <Section id="core-idea" title="The core idea">
            <div className="border border-white/[0.05] bg-white/[0.015] px-6 py-9 sm:px-8 sm:py-10 lg:px-10">
              <p className="text-[1.0625rem] font-light leading-[1.68] tracking-[-0.02em] text-text-primary/[0.86] sm:text-lg sm:leading-[1.72]">
                Product knowledge builds confidence.
                <br />
                Confidence drives action.
                <br />
                Action creates results.
              </p>
            </div>
          </Section>

          <div className="py-10 sm:py-12 lg:py-14">
            <SectionRule />
          </div>

          <Section id="right-support" title="What changes with the right support" variant="soft">
            <p>
              When reps don&apos;t have to rely entirely on memorization — and instead have support that helps them apply knowledge in
              real time —
            </p>
            <p>they can:</p>
            <EditorialList
              items={[
                "start taking calls earlier",
                "learn faster through real interactions",
                "and ramp significantly faster than the typical 3.2-month cycle",
              ]}
            />
          </Section>

          <div className="py-10 sm:py-12 lg:py-14">
            <SectionRule />
          </div>

          <Section id="bottom-line" title="Bottom line">
            <p>This isn&apos;t about replacing training.</p>
            <p>It&apos;s about removing the gap between:</p>
            <InsightCard>
              <span className="block">knowing</span>
              <span className="my-3 block text-[15px] text-white/30 sm:text-base">and</span>
              <span className="block">being able to use what you know when it matters</span>
            </InsightCard>
          </Section>
        </div>

        <section
          id="get-persuaid"
          className="scroll-mt-28 mt-20 border border-white/[0.06] bg-white/[0.02] px-7 py-10 sm:mt-24 sm:px-9 sm:py-11 lg:mt-28 lg:px-11 lg:py-12"
        >
          <h2 className="font-sans text-lg font-medium tracking-[-0.02em] text-text-primary/[0.9] sm:text-[1.125rem]">Persuaid</h2>
          <p className="mt-5 max-w-md text-[15px] leading-[1.72] text-text-secondary/75 sm:text-base">
            Live listening, your knowledge base, and answers you can say out loud—in the flow of the call.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:mt-11 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
            <Link
              href="/download"
              className="inline-flex min-h-[2.875rem] items-center justify-center rounded-full bg-white px-8 text-[14px] font-medium tracking-[-0.01em] text-background-near-black transition-opacity duration-200 hover:opacity-90 active:opacity-85 sm:min-h-0 sm:py-3"
            >
              Download Persuaid
            </Link>
            <Link
              href="/"
              className="inline-flex min-h-[2.875rem] items-center justify-center rounded-full border border-white/[0.12] bg-transparent px-8 text-[14px] font-normal tracking-[-0.01em] text-text-primary/90 transition-colors duration-200 hover:border-white/[0.18] hover:bg-white/[0.03] sm:min-h-0 sm:py-3"
            >
              Back to home
            </Link>
          </div>
        </section>

        <footer className="mt-14 border-t border-white/[0.05] pt-12 sm:mt-16 sm:pt-14">
          <p className="max-w-lg text-[12px] leading-[1.7] tracking-[0.01em] text-white/38 sm:text-[13px]">
            <strong className="font-medium text-white/48">Note:</strong> Field notes reflect themes from conversations with sales teams
            and operators; they are directional, not a formal study.
          </p>
        </footer>
      </article>

      <Footer />
    </main>
  );
}
