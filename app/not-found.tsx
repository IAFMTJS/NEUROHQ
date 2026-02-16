import Link from "next/link";
import Image from "next/image";
import GlassCard from "@/components/ui/GlassCard";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <GlassCard className="w-full max-w-sm p-8 text-center">
        <Image src="/app-icon.png" alt="" width={56} height={56} className="mx-auto h-14 w-14 rounded-xl object-contain" />
        <h1 className="mt-4 text-xl font-bold text-white">Pagina niet gevonden</h1>
        <p className="mt-2 text-sm text-white/70">
          De pagina die je zoekt bestaat niet of is verplaatst.
        </p>
        <Link href="/dashboard" className="neon-button mt-6 inline-flex min-h-[48px] items-center justify-center rounded-[18px] px-5 py-2.5 text-sm font-semibold text-white">
          Naar dashboard
        </Link>
      </GlassCard>
    </div>
  );
}
