// Sample VM data from the FOCUS CSV
export const sampleVMs = [
  {
    ResourceId: "4200b9e0-eda0-767e-4046-15a4ea5bbc24",
    ResourceName: "cerau023adh00",
    ResourceType: "Vmware Virtual Machine",
    RegionName: "Werribee",
    ServiceCategory: "Compute",
    ServiceName: "Compute",
    OwnerID: "Greg Winfield",
    Tags: { environment: "production", app: "web-server" },
    // VM Specifications (mocked as they're not in the original data)
    CPU: 8,
    MemoryGB: 32,
    StorageGB: 500,
    // Original costs - we'll ignore these and calculate new ones
    OriginalBilledCost: 50,
    BillingCurrency: "AUD"
  },
  {
    ResourceId: "4222dd05-7a7c-07f2-717f-dbc027ed820d",
    ResourceName: "kube-a-01",
    ResourceType: "Vmware Virtual Machine",
    RegionName: "Werribee",
    ServiceCategory: "Compute",
    ServiceName: "Compute",
    OwnerID: "Greg Winfield",
    Tags: { environment: "production", app: "kubernetes", cluster: "primary" },
    CPU: 16,
    MemoryGB: 64,
    StorageGB: 1000,
    OriginalBilledCost: 42,
    BillingCurrency: "AUD"
  },
  {
    ResourceId: "42334056-92ba-c3e0-e40f-0c6c4c85154b",
    ResourceName: "WindazPostXP",
    ResourceType: "Vmware Virtual Machine",
    RegionName: "Werribee",
    ServiceCategory: "Compute",
    ServiceName: "Compute",
    OwnerID: "Greg Winfield",
    Tags: { environment: "development", app: "legacy" },
    CPU: 2,
    MemoryGB: 8,
    StorageGB: 100,
    OriginalBilledCost: 14.25,
    BillingCurrency: "AUD"
  },
  {
    ResourceId: "42027248-95c1-c10e-0b66-1cb973c7fe72",
    ResourceName: "pihole",
    ResourceType: "Vmware Virtual Machine",
    RegionName: "Werribee",
    ServiceCategory: "Compute",
    ServiceName: "Compute",
    OwnerID: "Greg Winfield",
    Tags: { environment: "production", app: "dns-filter" },
    CPU: 2,
    MemoryGB: 4,
    StorageGB: 50,
    OriginalBilledCost: 10.5,
    BillingCurrency: "AUD"
  },
  {
    ResourceId: "420053a5-b5f8-cdea-c59f-dca9c8e17302",
    ResourceName: "Windows10 Eagle",
    ResourceType: "Vmware Virtual Machine",
    RegionName: "Werribee",
    ServiceCategory: "Compute",
    ServiceName: "Compute",
    OwnerID: "Greg Winfield",
    Tags: { environment: "test", app: "windows-desktop" },
    CPU: 4,
    MemoryGB: 16,
    StorageGB: 250,
    OriginalBilledCost: 12.5,
    BillingCurrency: "AUD"
  },
  {
    ResourceId: "42166897-a9f5-a08e-d901-c8b09ca29d83",
    ResourceName: "esxi-vcsa",
    ResourceType: "Vmware Virtual Machine",
    RegionName: "Werribee",
    ServiceCategory: "Compute",
    ServiceName: "Compute",
    OwnerID: "Greg Winfield",
    Tags: { environment: "production", app: "vcenter", type: "infrastructure" },
    CPU: 8,
    MemoryGB: 32,
    StorageGB: 750,
    OriginalBilledCost: 70,
    BillingCurrency: "AUD"
  },
  {
    ResourceId: "4200a12f-75f9-1f60-71f6-f12aa5b27f6f",
    ResourceName: "win2022-exchange",
    ResourceType: "Vmware Virtual Machine",
    RegionName: "Werribee",
    ServiceCategory: "Compute",
    ServiceName: "Compute",
    OwnerID: "Greg Winfield",
    Tags: { environment: "production", app: "email-server", os: "windows" },
    CPU: 12,
    MemoryGB: 48,
    StorageGB: 2000,
    OriginalBilledCost: 100.25,
    BillingCurrency: "AUD"
  },
  {
    ResourceId: "42009c45-9eef-8c4e-17c5-ee3d42c1c79f",
    ResourceName: "gitlab-runner-01",
    ResourceType: "Vmware Virtual Machine",
    RegionName: "Werribee",
    ServiceCategory: "Compute",
    ServiceName: "Compute",
    OwnerID: "Greg Winfield",
    Tags: { environment: "development", app: "ci-cd", type: "runner" },
    CPU: 4,
    MemoryGB: 8,
    StorageGB: 100,
    OriginalBilledCost: 1,
    BillingCurrency: "AUD"
  },
  {
    ResourceId: "4203a1b7-3c5e-f6a2-d8e9-1b7c4f9e2a3d",
    ResourceName: "db-postgres-prod",
    ResourceType: "Vmware Virtual Machine",
    RegionName: "Werribee",
    ServiceCategory: "Compute",
    ServiceName: "Compute",
    OwnerID: "Greg Winfield",
    Tags: { environment: "production", app: "database", db_type: "postgresql" },
    CPU: 16,
    MemoryGB: 128,
    StorageGB: 5000,
    OriginalBilledCost: 0,
    BillingCurrency: "AUD"
  },
  {
    ResourceId: "42015d89-7a3f-b9c1-e4d7-5c8f2e9b1a7e",
    ResourceName: "monitoring-stack",
    ResourceType: "Vmware Virtual Machine",
    RegionName: "Werribee",
    ServiceCategory: "Compute",
    ServiceName: "Compute",
    OwnerID: "Greg Winfield",
    Tags: { environment: "production", app: "monitoring", stack: "prometheus-grafana" },
    CPU: 6,
    MemoryGB: 24,
    StorageGB: 500,
    OriginalBilledCost: 0,
    BillingCurrency: "AUD"
  },
  {
    ResourceId: "42028f6c-9b2e-d7a5-f3c8-6e9d4b8c2f1a",
    ResourceName: "backup-server",
    ResourceType: "Vmware Virtual Machine",
    RegionName: "Werribee",
    ServiceCategory: "Compute",
    ServiceName: "Compute",
    OwnerID: "Greg Winfield",
    Tags: { environment: "production", app: "backup", type: "infrastructure" },
    CPU: 8,
    MemoryGB: 16,
    StorageGB: 10000,
    OriginalBilledCost: 19.5,
    BillingCurrency: "AUD"
  }
];

// Sample cost profile templates
export const costProfileTemplates = [
  {
    name: "Basic Infrastructure",
    description: "Standard infrastructure costs for typical VMs",
    costComponents: [
      { type: "cpu", name: "CPU Cost", value: 10, unit: "per CPU/month" },
      { type: "memory", name: "Memory Cost", value: 5, unit: "per GB/month" },
      { type: "storage", name: "Storage Cost", value: 0.1, unit: "per GB/month" }
    ]
  },
  {
    name: "Production Environment",
    description: "Higher costs for production workloads with HA and backup",
    costComponents: [
      { type: "cpu", name: "CPU Cost", value: 15, unit: "per CPU/month" },
      { type: "memory", name: "Memory Cost", value: 8, unit: "per GB/month" },
      { type: "storage", name: "Storage Cost", value: 0.2, unit: "per GB/month" },
      { type: "fixed", name: "HA & Backup Services", value: 50, unit: "per VM/month" },
      { type: "fixed", name: "Monitoring & Support", value: 25, unit: "per VM/month" }
    ]
  }
];