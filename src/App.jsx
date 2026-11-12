import { BrowserRouter, NavLink, Route, Routes } from "react-router-dom";
import Activity from "./pages/Activity";
import HomePage from "./pages/HomePage";
import ItemDetails from "./pages/ItemDetails";

function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-svh flex-col bg-background text-foreground">
        <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-6 border-b px-4 py-4 sm:px-6 lg:px-8">
          <NavLink
            className="group flex items-center gap-3 text-foreground transition-colors hover:text-primary"
            to="/"
            end
          >
            <span className="text-sm font-semibold tracking-tight">
              tiny desk{" "}
              <span className="text-muted-foreground">randomizer</span>
            </span>
          </NavLink>

          <nav className="flex items-center" aria-label="Main navigation">
            <NavLink
              className={({ isActive }) =>
                `text-xs font-medium uppercase tracking-[0.16em] transition-colors hover:text-primary ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`
              }
              to="/"
              end
            >
              Archive
            </NavLink>
            <NavLink
              className={({ isActive }) =>
                `ml-5 text-xs font-medium uppercase tracking-[0.16em] transition-colors hover:text-primary ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`
              }
              to="/activity"
            >
              Activity
            </NavLink>
          </nav>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/activity" element={<Activity />} />
            <Route path="/:videoId" element={<ItemDetails />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
