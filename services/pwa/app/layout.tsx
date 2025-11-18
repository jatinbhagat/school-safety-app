import './globals.css';

export const metadata = {
  title: 'SafelyNotify.com - Smart, Secure & Instant Safety for Every Institution',
  description: 'Onboard your school, college, university or organization in minutes with complete control and total peace of mind. First 100 institutions get free access.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
