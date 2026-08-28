import "./globals.css";

import { GlobalStateProvider } from "../src/context/GlobalStateContext";

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body>
                <GlobalStateProvider>
                    {children}
                </GlobalStateProvider>
            </body>
        </html>
    );
}
