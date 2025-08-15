export const metadata = {
  title: "AI Daily",
  description: "Fresh links to podcasts, newsletters, research, and talks.",
};
import "./../styles/globals.css";
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
