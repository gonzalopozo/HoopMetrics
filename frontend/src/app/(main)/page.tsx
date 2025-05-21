import CardsWrapper from "@/components/layout/home-cards-wrapper";
import { DashboardSkeleton } from "@/components/loading/dashboard-skeleton";
import { Suspense } from "react";

export default async function HomePage() {
  return (
    <>
      <Suspense fallback={<DashboardSkeleton />}>

        <CardsWrapper />
      </Suspense>

    </>
  )
}
