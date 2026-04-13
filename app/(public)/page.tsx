import { HomeView } from "@/components/sections/home-view";
import { HomePageTracker } from "@/components/analytics/home-page-tracker";

export default function HomePage() {
  return (
    <>
      <HomePageTracker />
      <HomeView />
    </>
  );
}
