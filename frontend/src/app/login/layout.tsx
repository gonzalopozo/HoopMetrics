import type { ReactNode } from "react";

export default function LoginLayout({ children }: { children: ReactNode }) {
    return (
        <>
            <body>
                {children}
            </body>
        </>
    );
}