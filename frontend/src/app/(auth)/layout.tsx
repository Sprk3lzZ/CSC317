import { GradientMesh } from "@/components/ui/GradientMesh";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center p-4">
      <GradientMesh />
      <div className="relative z-10 w-full max-w-sm">
        {children}
      </div>
    </div>
  );
}
