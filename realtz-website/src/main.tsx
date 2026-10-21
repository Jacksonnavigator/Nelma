import { StrictMode, Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, Navigate, RouterProvider, useParams } from "react-router-dom";
import "./styles.css";
import { Layout } from "./components/Layout";
import { ContentProvider } from "./content/store";
import Home from "./pages/Home";
import Tanzania from "./pages/Tanzania";
import { DestinationCategory, DestinationDetail, DestinationsOverview } from "./pages/Destinations";
import { BeachSea, Culture, ExperiencesOverview, Safari, Trekking } from "./pages/Experiences";
import { JourneyDetail, JourneysPage } from "./pages/Journeys";
import Community from "./pages/Community";
import About from "./pages/About";
import { ArticlePage, JournalPage } from "./pages/Journal";
import PlanTrip from "./pages/PlanTrip";
import Contact from "./pages/Contact";
import { Imprint, NotFound, Privacy, Terms, TravelInfo } from "./pages/Info";

// Old addresses from the previous site, so existing links and search results keep working.
const OldItinerary = () => <Navigate to={`/journeys/${useParams().slug ?? ""}`} replace />;
const OldBlogPost = () => <Navigate to={`/journal/${useParams().slug ?? ""}`} replace />;
const go = (to: string) => <Navigate to={to} replace />;

const AdminApp = lazy(() => import("./admin/AdminApp"));

const router = createBrowserRouter([
  {
    path: "/admin/*",
    element: (
      <Suspense fallback={<div className="grid min-h-screen place-items-center bg-cream text-earth">Loading dashboard…</div>}>
        <AdminApp />
      </Suspense>
    ),
  },
  {
    element: (
      <ContentProvider>
        <Layout />
      </ContentProvider>
    ),
    children: [
      { path: "/", element: <Home /> },
      { path: "/tanzania", element: <Tanzania /> },
      { path: "/destinations", element: <DestinationsOverview /> },
      { path: "/destinations/:category", element: <DestinationCategory /> },
      { path: "/destinations/:category/:slug", element: <DestinationDetail /> },
      { path: "/experiences", element: <ExperiencesOverview /> },
      { path: "/safari", element: <Safari /> },
      { path: "/trekking", element: <Trekking /> },
      { path: "/culture", element: <Culture /> },
      { path: "/beach-and-sea", element: <BeachSea /> },
      { path: "/journeys", element: <JourneysPage /> },
      { path: "/journeys/:slug", element: <JourneyDetail /> },
      { path: "/community", element: <Community /> },
      { path: "/about-us", element: <About /> },
      { path: "/journal", element: <JournalPage /> },
      { path: "/journal/:slug", element: <ArticlePage /> },
      { path: "/plan-trip", element: <PlanTrip /> },
      { path: "/contact", element: <Contact /> },
      { path: "/travel-info", element: <TravelInfo /> },
      { path: "/terms", element: <Terms /> },
      { path: "/privacy", element: <Privacy /> },
      { path: "/imprint", element: <Imprint /> },

      { path: "/tailor-itinerary", element: go("/plan-trip") },
      { path: "/itinerary", element: go("/journeys/15-days-east-tanzania") },
      { path: "/itinerary/:slug", element: <OldItinerary /> },
      { path: "/blog", element: go("/journal") },
      { path: "/blog/:slug", element: <OldBlogPost /> },
      { path: "/info", element: go("/travel-info") },
      { path: "/info/contact", element: go("/contact") },
      { path: "/info/terms", element: go("/terms") },
      { path: "/info/privacy", element: go("/privacy") },
      { path: "/info/imprint", element: go("/imprint") },

      { path: "*", element: <NotFound /> },
    ],
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
