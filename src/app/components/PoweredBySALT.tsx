import Image from "next/image";

export default function PoweredBySALT() {
  return (
    <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-black/10 px-3 py-1 text-xs text-black/80 dark:text-white/80 dark:bg-white/10">
      <Image src="/salt-logo.svg" alt="" width={16} height={16} className="h-4 w-auto" />
      <span>Powered by SALT</span>
    </div>
  );
}
