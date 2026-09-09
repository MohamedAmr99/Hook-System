$dirs = @(
  "src/app",
  "src/features/auth/components",
  "src/features/auth/pages",
  "src/features/auth/hooks",
  "src/features/auth/services",
  "src/features/auth/schemas",
  "src/features/auth/types",
  "src/features/auth/constants",
  "src/features/dashboard/components",
  "src/features/dashboard/pages",
  "src/features/products/components",
  "src/features/products/pages",
  "src/features/products/hooks",
  "src/features/products/services",
  "src/features/products/schemas",
  "src/features/products/types",
  "src/features/inventory/pages",
  "src/features/orders/pages",
  "src/features/finance/pages",
  "src/features/media/pages",
  "src/features/tasks/pages",
  "src/features/notifications/pages",
  "src/features/content/pages",
  "src/shared/components/ui",
  "src/shared/hooks",
  "src/shared/lib",
  "src/shared/services",
  "src/shared/constants",
  "src/shared/types",
  "src/shared/utils",
  "src/shared/layouts",
  "src/lib/firebase"
)

foreach ($dir in $dirs) {
  New-Item -ItemType Directory -Force -Path $dir
}
