export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-card to-background">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="stars absolute inset-0" />
      </div>
      <div className="relative z-10 w-full max-w-md p-6">
        {children}
      </div>
    </div>
  );
}
