import { Globe } from "@/components/ui/globe";
import { StackedCircularFooter } from "@/components/ui/hero-footer";
import HeroNavbar from "@/components/ui/hero-navbar";
import { Typewriter } from "@/components/ui/typewriter";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen w-full">
      <HeroNavbar />
      <main className="flex flex-col flex-1 items-center justify-center gap-16 mt-[68px] px-4">
        <div className="whitespace-pre-wrap text-center">
          <span className="text-5xl font-bold">{"Built for teams that build great"}</span>
          <Typewriter
            text={[
              " products.",
              " events.",
              " ideas.",
              " platforms.",
              " communities.",
            ]}
            speed={70}
            className="text-indigo-500 text-5xl font-bold"
            waitTime={1500}
            deleteSpeed={40}
            cursorChar={"_"}
          />
        </div>

        <div className="w-full max-w-xl mx-auto">
          {/* <Globe className="w-full" /> */}
        </div>
      </main>
      <footer className="w-full">
        <StackedCircularFooter />
      </footer>
    </div>
  );
}
