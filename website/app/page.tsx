import { redirect } from "next/navigation";

// The proxy bounces unauthenticated users to /login; authenticated users land
// on the dashboard.
const Home = () => {
  redirect("/dashboard");
};

export default Home;
