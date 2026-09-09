import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Toaster } from "sonner"
import { ThemeProvider } from "@/shared/components/ui/theme-provider"
import { AuthInitializer } from "@/features/auth/components/AuthInitializer"

const queryClient = new QueryClient()

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="hooh-theme">
        <AuthInitializer>
          {children}
        </AuthInitializer>
        <Toaster />
      </ThemeProvider>
    </QueryClientProvider>
  )
}
