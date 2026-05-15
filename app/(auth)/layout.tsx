export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white">NoteAI</h1>
          <p className="mt-2 text-zinc-400">Your intelligent second brain</p>
        </div>
        {children}
      </div>
    </div>
  );
}
