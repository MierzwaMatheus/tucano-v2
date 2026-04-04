import { createBrowserRouter, Navigate } from "react-router-dom";
import App from "./App";
import { FinancePage } from "./pages/FinancePage";
import { ShoppingPage } from "./pages/ShoppingPage";
import { CardsPage } from "./pages/CardsPage";
import { CategoriesPage } from "./pages/CategoriesPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        index: true,
        element: <Navigate to="/finance" replace />,
      },
      {
        path: "finance",
        element: <FinancePage />,
      },
      {
        path: "shopping",
        element: <ShoppingPage />,
      },
      {
        path: "cards",
        element: <CardsPage />,
      },
      {
        path: "categories",
        element: <CategoriesPage />,
      },
    ],
  },
]);
