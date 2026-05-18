import { GradientMesh } from "@/components/ui/GradientMesh";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-zinc-50 p-4">
      <GradientMesh variant="zinc" />
      <div className="relative z-10 w-full max-w-sm">
        {children}
      </div>
    </div>
  );
}
