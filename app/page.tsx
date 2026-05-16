import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100-vh-4rem)] text-center px-4">
      <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl mb-6 mt-30">
        Note<span className="text-zinc-400">AI</span>
      </h1>
      <p className="text-xl text-zinc-400 max-w-2xl mb-10">
        The intelligent notes app that helps you capture, organize, and summarize your thoughts with the power of artificial intelligence.
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <Button
          size="lg"
          className="bg-white text-black hover:bg-zinc-200 text-lg px-8"
          render={<Link href="/signup" />}
          nativeButton={false}
        >
          Get Started
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="border-zinc-800 text-lg px-8"
          render={<Link href="/login" />}
          nativeButton={false}
        >
          Sign In
        </Button>
      </div>
    </div>
  );
}
