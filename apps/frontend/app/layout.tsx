import "./globals.css";

import { AuthProvider } from "../src/auth/AuthProvider";
import AuthGate from "../src/components/AuthGate";
import { GlobalStateProvider } from "../src/context/GlobalStateContext";

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body>
                <AuthProvider>
                    <AuthGate>
                        <GlobalStateProvider>
                            {children}
                        </GlobalStateProvider>
                    </AuthGate>
                </AuthProvider>
            </body>
        </html>
    );
}

