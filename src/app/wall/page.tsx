import { PixelWall } from "@/components/PixelWall";
import { TopNav } from "@/components/TopNav";
import { getSessionProfile } from "@/lib/data";
import { IS_TEST_MODE } from "@/lib/config";

export const dynamic = "force-dynamic";

export default async function WallPage() {
  const { supabase, profile } = await getSessionProfile();
  const { data: pixels } = await (supabase as any).from("pixels").select("*").order("updated_at", { ascending: false }).limit(5000);

  return (
    <>
      <TopNav profile={profile} />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <PixelWall initialPixels={pixels ?? []} profile={profile} testMode={IS_TEST_MODE} />
      </main>
    </>
  );
}
