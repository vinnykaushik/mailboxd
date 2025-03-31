import { AuthProvider } from "./security/AuthContext";

const root = ReactDomClient.createRoot(container);

root.render(
  <AuthProvider>
    <BrowserRouter></BrowserRouter>
  </AuthProvider>
);
