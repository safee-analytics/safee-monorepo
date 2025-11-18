"use client";

import React from "react";
import {
  // Exports
  InvoicePDF,
  PDFDownloadButton,
  ExcelPreview,
  exportToExcel,
  generatePDFBlob,
  type InvoiceData,
  type ExcelColumn,

  // Data Grid
  DataGrid,
  type ColDef,

  // Charts
  LineChart,
  BarChart,
  PieChart,
  AreaChart,
  type ChartDataPoint,
  type PieChartData,

  // Calendar
  CalendarScheduler,
  type CalendarEventData,

  // UI Components
  Modal,
  ModalFooter,
  Dropdown,
  AnimatedButton,
  ExpandButton,
  HoverCard,
  HoverCardGrid,
  AnimatedList,
  SimpleListItem,
  type DropdownItem,

  // Premium Components
  PremiumButton,
  FAB,
  PremiumCard,
  GlassCard,
  StatCard,
  Skeleton,
  SkeletonCard,
  SkeletonTable,
  SkeletonList,
  ProgressBar,
  ToastProvider,
  useToast,
  DragDropList,
  type DragDropItem,
} from "@safee/ui";
import { Settings, Users, FileText, LogOut, Edit, Trash2, Plus, ArrowRight, DollarSign, TrendingUp, Activity, Save, Download, Zap, Upload } from "lucide-react";

// Sample data
const invoiceData = [
  { invoiceNumber: "INV-001", client: "Acme Corp", amount: 5000, status: "Paid", date: "2024-11-01" },
  { invoiceNumber: "INV-002", client: "Tech Ltd", amount: 3500, status: "Pending", date: "2024-11-05" },
  { invoiceNumber: "INV-003", client: "Global Inc", amount: 7200, status: "Paid", date: "2024-11-10" },
  { invoiceNumber: "INV-004", client: "Digital Co", amount: 2800, status: "Overdue", date: "2024-10-15" },
  { invoiceNumber: "INV-005", client: "Smart LLC", amount: 4500, status: "Pending", date: "2024-11-12" },
];

const chartData: ChartDataPoint[] = [
  { month: "Jan", revenue: 4000, expenses: 2400, profit: 1600 },
  { month: "Feb", revenue: 3000, expenses: 1398, profit: 1602 },
  { month: "Mar", revenue: 5000, expenses: 2800, profit: 2200 },
  { month: "Apr", revenue: 2780, expenses: 3908, profit: -1128 },
  { month: "May", revenue: 1890, expenses: 4800, profit: -2910 },
  { month: "Jun", revenue: 2390, expenses: 3800, profit: -1410 },
];

const pieData: PieChartData[] = [
  { name: "Hisabiq", value: 40 },
  { name: "Kanz", value: 30 },
  { name: "Nisbah", value: 30 },
];

const calendarEvents: CalendarEventData[] = [
  {
    title: "Team Meeting",
    start: new Date(2024, 10, 20, 10, 0),
    end: new Date(2024, 10, 20, 11, 0),
  },
  {
    title: "Client Call",
    start: new Date(2024, 10, 21, 14, 0),
    end: new Date(2024, 10, 21, 15, 30),
  },
  {
    title: "Project Review",
    start: new Date(2024, 10, 22, 9, 0),
    end: new Date(2024, 10, 22, 10, 30),
  },
];

const excelColumns: ExcelColumn[] = [
  { header: "Invoice #", key: "invoiceNumber", width: 15 },
  { header: "Client", key: "client", width: 25 },
  { header: "Amount", key: "amount", width: 15 },
  { header: "Status", key: "status", width: 12 },
  { header: "Date", key: "date", width: 15 },
];

const gridColumns: ColDef[] = [
  { field: "invoiceNumber", headerName: "Invoice #", sortable: true, filter: true },
  { field: "client", sortable: true, filter: true },
  {
    field: "amount",
    sortable: true,
    filter: "agNumberColumnFilter",
    valueFormatter: (params) => `AED ${params.value?.toLocaleString()}`,
  },
  {
    field: "status",
    sortable: true,
    filter: true,
    cellStyle: (params) => {
      if (params.value === "Paid") return { backgroundColor: "#d1fae5", color: "#065f46" };
      if (params.value === "Overdue") return { backgroundColor: "#fee2e2", color: "#991b1b" };
      return { backgroundColor: "#fef3c7", color: "#92400e" };
    },
  },
  { field: "date", sortable: true, filter: "agDateColumnFilter" },
];

const sampleInvoice: InvoiceData = {
  invoiceNumber: "INV-2024-001",
  date: "2024-11-17",
  dueDate: "2024-12-17",
  companyName: "Safee Analytics",
  companyAddress: "Business Bay, Dubai, UAE",
  companyPhone: "+971 4 123 4567",
  companyEmail: "billing@safee.com",
  clientName: "Acme Corporation",
  clientAddress: "Downtown, Abu Dhabi, UAE",
  items: [
    { description: "Hisabiq Module - Monthly", quantity: 1, unitPrice: 999, total: 999 },
    { description: "Kanz Module - Monthly", quantity: 1, unitPrice: 799, total: 799 },
  ],
  subtotal: 1798,
  taxRate: 5,
  taxAmount: 89.9,
  total: 1887.9,
  currency: "AED",
  notes: "Payment due within 30 days.",
};

function ComponentLibraryContent() {
  const [activeSection, setActiveSection] = React.useState("overview");
  const [pdfUrl, setPdfUrl] = React.useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [selectedItem, setSelectedItem] = React.useState<string>("");

  React.useEffect(() => {
    const generatePDF = async () => {
      try {
        const blob = await generatePDFBlob(<InvoicePDF invoice={sampleInvoice} />);
        const url = URL.createObjectURL(blob);
        setPdfUrl(url);
      } catch (error) {
        console.error("Error generating PDF:", error);
      }
    };
    generatePDF();

    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, []);

  const [fabExtended, setFabExtended] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [dragItems, setDragItems] = React.useState<DragDropItem[]>([
    { id: "1", title: "High Priority Task", priority: 1 },
    { id: "2", title: "Medium Priority Task", priority: 2 },
    { id: "3", title: "Low Priority Task", priority: 3 },
    { id: "4", title: "Backlog Item", priority: 4 },
  ]);
  const toast = useToast();

  // Simulate progress
  React.useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => (prev >= 100 ? 0 : prev + 10));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const sections = [
    { id: "overview", name: "Overview", icon: "🎯", color: "from-blue-500 to-cyan-500" },
    { id: "premium", name: "Premium UI", icon: "✨", color: "from-yellow-500 to-orange-500" },
    { id: "ui", name: "UI Components", icon: "🎨", color: "from-pink-500 to-rose-500" },
    { id: "datagrid", name: "Data Grid", icon: "📋", color: "from-purple-500 to-pink-500" },
    { id: "charts", name: "Charts", icon: "📈", color: "from-green-500 to-emerald-500" },
    { id: "exports", name: "Excel & PDF", icon: "📊", color: "from-orange-500 to-red-500" },
    { id: "calendar", name: "Calendar", icon: "📅", color: "from-indigo-500 to-purple-500" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="mb-6">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Component Library
            </h1>
            <p className="text-gray-600 mt-2">
              Enterprise-grade components • Fully customizable • Production-ready
            </p>
          </div>

          {/* Navigation */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${
                  activeSection === section.id
                    ? `bg-gradient-to-r ${section.color} text-white shadow-lg`
                    : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                }`}
              >
                <span className="mr-2">{section.icon}</span>
                {section.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Overview */}
        {activeSection === "overview" && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sections.slice(1).map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200 hover:shadow-xl transition text-left group"
                >
                  <div className={`text-5xl mb-4 group-hover:scale-110 transition`}>
                    {section.icon}
                  </div>
                  <h3 className="text-2xl font-bold mb-3">{section.name}</h3>
                  <p className="text-gray-600 text-sm">
                    {section.id === "premium" && "Ultra-smooth components better than Monday.com & QuickBooks"}
                    {section.id === "ui" && "Modern UI components with animations and interactions"}
                    {section.id === "datagrid" && "Advanced tables with sorting, filtering, pagination"}
                    {section.id === "charts" && "Beautiful visualizations with Recharts"}
                    {section.id === "exports" && "Excel & PDF generation with full control"}
                    {section.id === "calendar" && "Event scheduling and calendar views"}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Premium UI Section */}
        {activeSection === "premium" && (
          <div className="space-y-8">
            {/* Premium Buttons */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-6 text-white">
                <h2 className="text-3xl font-bold mb-2">✨ Premium Buttons</h2>
                <p className="text-yellow-100">Smooth animations with ripple & glow effects</p>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <h4 className="font-semibold mb-3 text-sm text-gray-600">WITH GLOW & RIPPLE</h4>
                  <div className="flex flex-wrap gap-4">
                    <PremiumButton
                      variant="primary"
                      glow
                      ripple
                      icon={<Save />}
                      onClick={() => toast.success("Saved!", "Changes saved successfully")}
                    >
                      Save Changes
                    </PremiumButton>
                    <PremiumButton
                      variant="success"
                      glow
                      ripple
                      icon={<Download />}
                      onClick={() => toast.info("Downloading...", "Your file will download shortly")}
                    >
                      Download
                    </PremiumButton>
                    <PremiumButton
                      variant="danger"
                      glow
                      ripple
                      icon={<Trash2 />}
                      onClick={() => toast.warning("Are you sure?", "This action cannot be undone")}
                    >
                      Delete
                    </PremiumButton>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3 text-sm text-gray-600">LOADING STATES</h4>
                  <div className="flex gap-4">
                    <PremiumButton variant="primary" loading>
                      Saving...
                    </PremiumButton>
                    <PremiumButton variant="secondary" loading icon={<Upload />}>
                      Uploading...
                    </PremiumButton>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <strong>Pro Tip:</strong> Click any button to see the ripple effect and toast notification! The ripple creates satisfying tactile feedback like Monday.com.
                  </p>
                </div>
              </div>
            </div>

            {/* Stat Cards */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-6 text-white">
                <h2 className="text-3xl font-bold mb-2">📊 Stat Cards</h2>
                <p className="text-emerald-100">Animated statistics with trends</p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <StatCard
                    title="Revenue"
                    value={127500}
                    prefix="$"
                    change={12.5}
                    trend="up"
                    icon={<DollarSign />}
                    gradient="from-green-600 to-emerald-600"
                  />
                  <StatCard
                    title="Active Users"
                    value={1247}
                    change={-3.2}
                    trend="down"
                    icon={<Users />}
                    gradient="from-blue-600 to-cyan-600"
                  />
                  <StatCard
                    title="Growth Rate"
                    value={23.8}
                    suffix="%"
                    change={5.1}
                    trend="up"
                    icon={<TrendingUp />}
                    gradient="from-purple-600 to-pink-600"
                  />
                </div>
              </div>
            </div>

            {/* Premium Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 3D Tilt Card */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-violet-500 to-purple-500 p-6 text-white">
                  <h3 className="text-2xl font-bold mb-2">🎴 3D Tilt Card</h3>
                  <p className="text-violet-100">Move your mouse over the card</p>
                </div>
                <div className="p-6">
                  <PremiumCard tilt glow shine hoverable className="p-8">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl text-white">
                        <Zap size={24} />
                      </div>
                      <div>
                        <h4 className="text-xl font-bold mb-2">Premium Feature</h4>
                        <p className="text-gray-600">
                          This card tilts in 3D based on your mouse position and shows a shine effect. Hover to feel the magic!
                        </p>
                      </div>
                    </div>
                  </PremiumCard>
                </div>
              </div>

              {/* Glass Card */}
              <div className="bg-gradient-to-br from-blue-400 to-purple-500 rounded-2xl shadow-lg p-6">
                <h3 className="text-2xl font-bold mb-4 text-white">🔮 Glassmorphism</h3>
                <GlassCard blur="lg" tint="light" className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-500 text-white rounded-lg">
                      <Activity size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg mb-1">Modern Glass Effect</h4>
                      <p className="text-sm text-gray-600">
                        Blur, transparency, and saturation for a premium iOS-style look
                      </p>
                    </div>
                  </div>
                </GlassCard>
              </div>
            </div>

            {/* Loading States */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Skeleton Loaders */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-gray-700 to-gray-900 p-6 text-white">
                  <h3 className="text-2xl font-bold mb-2">💀 Skeleton Loaders</h3>
                  <p className="text-gray-300">Better than spinners</p>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-600 mb-2">Card Skeleton</h4>
                    <SkeletonCard showImage showAvatar lines={3} />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-600 mb-2">List Skeleton</h4>
                    <SkeletonList items={3} />
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-6 text-white">
                  <h3 className="text-2xl font-bold mb-2">📈 Progress Bar</h3>
                  <p className="text-blue-100">Smooth animated progress</p>
                </div>
                <div className="p-6 space-y-6">
                  <ProgressBar value={progress} showLabel color="blue" size="lg" />
                  <ProgressBar value={75} showLabel color="green" size="md" />
                  <ProgressBar value={45} showLabel color="purple" size="sm" />
                  <p className="text-sm text-gray-500">
                    Progress bars animate smoothly to their target value
                  </p>
                </div>
              </div>
            </div>

            {/* Drag & Drop */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-orange-500 to-red-500 p-6 text-white">
                <h2 className="text-3xl font-bold mb-2">🎯 Drag & Drop Reordering</h2>
                <p className="text-orange-100">Monday.com style sortable lists</p>
              </div>
              <div className="p-6">
                <DragDropList
                  items={dragItems}
                  onReorder={setDragItems}
                  showHandle
                  renderItem={(item: DragDropItem, isDragging) => (
                    <div className={`p-4 ${isDragging ? 'opacity-50' : ''}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{item.title}</h4>
                          <p className="text-sm text-gray-500">Priority: {item.priority}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          item.priority === 1 ? 'bg-red-100 text-red-700' :
                          item.priority === 2 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          P{item.priority}
                        </span>
                      </div>
                    </div>
                  )}
                />
                <div className="mt-4 p-4 bg-orange-50 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <strong>Try it:</strong> Drag the handle to reorder items. Notice the smooth spring animations and visual feedback!
                  </p>
                </div>
              </div>
            </div>

            {/* FAB */}
            <FAB
              icon={<Plus />}
              label="Quick Action"
              position="bottom-right"
              extended={fabExtended}
              onClick={() => toast.info("FAB Clicked!", "Floating Action Button")}
              onMouseEnter={() => setFabExtended(true)}
              onMouseLeave={() => setFabExtended(false)}
            />
          </div>
        )}

        {/* UI Components Section */}
        {activeSection === "ui" && (
          <div className="space-y-8">
            {/* Modals */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-pink-500 to-rose-500 p-6 text-white">
                <h2 className="text-3xl font-bold mb-2">🎭 Modal Component</h2>
                <p className="text-pink-100">Customizable modal dialogs with animations</p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <AnimatedButton variant="primary" onClick={() => setIsModalOpen(true)}>
                    Open Modal
                  </AnimatedButton>
                  <AnimatedButton variant="secondary" onClick={() => setIsModalOpen(true)}>
                    Secondary Style
                  </AnimatedButton>
                  <AnimatedButton variant="ghost" onClick={() => setIsModalOpen(true)}>
                    Ghost Style
                  </AnimatedButton>
                </div>

                <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Example Modal" size="md">
                  <p className="text-gray-700 mb-4">
                    This is a production-ready modal component with full customization options.
                  </p>
                  <ul className="space-y-2 text-sm text-gray-600 mb-4">
                    <li>✓ Multiple size variants</li>
                    <li>✓ Backdrop click control</li>
                    <li>✓ Smooth animations</li>
                    <li>✓ Fully accessible</li>
                  </ul>
                  <ModalFooter>
                    <button
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                      Confirm
                    </button>
                  </ModalFooter>
                </Modal>
              </div>
            </div>

            {/* Buttons & Dropdowns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Animated Buttons */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                <h3 className="text-2xl font-bold mb-4">🎯 Animated Buttons</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Default variants:</p>
                    <div className="flex flex-wrap gap-2">
                      <AnimatedButton variant="default">Default</AnimatedButton>
                      <AnimatedButton variant="primary" icon={<Plus size={16} />}>
                        Primary
                      </AnimatedButton>
                      <AnimatedButton variant="secondary">Secondary</AnimatedButton>
                      <AnimatedButton variant="ghost">Ghost</AnimatedButton>
                      <AnimatedButton variant="danger" icon={<Trash2 size={16} />}>
                        Danger
                      </AnimatedButton>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-2">Expand button:</p>
                    <ExpandButton label="Get Started" />
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-2">Loading state:</p>
                    <AnimatedButton variant="primary" loading>
                      Loading...
                    </AnimatedButton>
                  </div>
                </div>
              </div>

              {/* Dropdown */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                <h3 className="text-2xl font-bold mb-4">📋 Dropdown Menu</h3>
                <p className="text-sm text-gray-600 mb-4">Interactive dropdown with animations</p>
                <Dropdown
                  trigger={
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                      Actions
                    </button>
                  }
                  items={[
                    { label: "Edit", value: "edit", icon: <Edit size={16} /> },
                    { label: "Delete", value: "delete", icon: <Trash2 size={16} /> },
                    { label: "Settings", value: "settings", icon: <Settings size={16} /> },
                    { label: "Disabled", value: "disabled", disabled: true },
                  ]}
                  onSelect={(item) => setSelectedItem(item.label)}
                />
                {selectedItem && (
                  <p className="mt-4 p-3 bg-blue-50 rounded-lg text-sm">
                    Selected: <strong>{selectedItem}</strong>
                  </p>
                )}
              </div>
            </div>

            {/* Hover Cards */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-violet-500 to-purple-500 p-6 text-white">
                <h2 className="text-3xl font-bold mb-2">🎴 Hover Cards</h2>
                <p className="text-violet-100">Interactive cards with gradient animations</p>
              </div>
              <div className="p-6">
                <HoverCardGrid columns={4}>
                  <HoverCard
                    title="Users"
                    subtitle="Manage team members"
                    icon={<Users />}
                    gradient="from-blue-600 to-cyan-600"
                    onClick={() => alert("Users clicked")}
                  />
                  <HoverCard
                    title="Settings"
                    subtitle="Configure your app"
                    icon={<Settings />}
                    gradient="from-purple-600 to-pink-600"
                    onClick={() => alert("Settings clicked")}
                  />
                  <HoverCard
                    title="Documents"
                    subtitle="View all files"
                    icon={<FileText />}
                    gradient="from-green-600 to-emerald-600"
                    onClick={() => alert("Documents clicked")}
                  />
                  <HoverCard
                    title="Sign Out"
                    subtitle="End your session"
                    icon={<LogOut />}
                    gradient="from-red-600 to-orange-600"
                    onClick={() => alert("Sign out clicked")}
                  />
                </HoverCardGrid>
              </div>
            </div>

            {/* Animated List */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-6 text-white">
                <h2 className="text-3xl font-bold mb-2">📋 Animated Lists</h2>
                <p className="text-indigo-100">Staggered entrance animations for list items</p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Vertical List */}
                  <div>
                    <h4 className="font-semibold mb-3">Vertical Layout</h4>
                    <AnimatedList
                      items={[
                        { id: 1, name: "John Doe", role: "Developer" },
                        { id: 2, name: "Jane Smith", role: "Designer" },
                        { id: 3, name: "Bob Johnson", role: "Manager" },
                        { id: 4, name: "Alice Williams", role: "Product Lead" },
                      ]}
                      keyExtractor={(item) => item.id}
                      renderItem={(item) => (
                        <SimpleListItem>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{item.name}</p>
                              <p className="text-sm text-gray-500">{item.role}</p>
                            </div>
                            <button className="text-blue-600 hover:text-blue-700 text-sm">
                              View
                            </button>
                          </div>
                        </SimpleListItem>
                      )}
                      layout="vertical"
                      gap="sm"
                    />
                  </div>

                  {/* Grid Layout */}
                  <div>
                    <h4 className="font-semibold mb-3">Grid Layout</h4>
                    <AnimatedList
                      items={[
                        { id: 1, icon: "📊", label: "Analytics" },
                        { id: 2, icon: "💰", label: "Revenue" },
                        { id: 3, icon: "👥", label: "Users" },
                        { id: 4, icon: "📈", label: "Growth" },
                      ]}
                      keyExtractor={(item) => item.id}
                      renderItem={(item) => (
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 text-center hover:shadow-md transition">
                          <div className="text-3xl mb-2">{item.icon}</div>
                          <p className="font-medium text-gray-700">{item.label}</p>
                        </div>
                      )}
                      layout="grid"
                      columns={2}
                      gap="md"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Data Grid Section */}
        {activeSection === "datagrid" && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 text-white">
                <h2 className="text-3xl font-bold mb-2">📋 AG Grid Community</h2>
                <p className="text-purple-100">Enterprise-grade data tables with advanced features</p>
              </div>
              <div className="p-6">
                <DataGrid
                  data={invoiceData}
                  columns={gridColumns}
                  height={400}
                  className="ag-theme-quartz"
                />
                <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { icon: "🔍", label: "Sorting & Filtering" },
                    { icon: "📄", label: "Pagination" },
                    { icon: "✏️", label: "Cell Editing" },
                    { icon: "📊", label: "CSV Export" },
                  ].map((feature) => (
                    <div key={feature.label} className="p-4 bg-purple-50 rounded-lg text-center">
                      <div className="text-2xl mb-2">{feature.icon}</div>
                      <div className="text-sm font-medium text-gray-700">{feature.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Charts Section */}
        {activeSection === "charts" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                <h3 className="text-xl font-bold mb-4">📈 Line Chart</h3>
                <LineChart
                  data={chartData}
                  lines={[
                    { dataKey: "revenue", name: "Revenue", color: "#10b981" },
                    { dataKey: "expenses", name: "Expenses", color: "#ef4444" },
                  ]}
                  xAxisKey="month"
                  height={300}
                />
              </div>

              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                <h3 className="text-xl font-bold mb-4">📊 Bar Chart</h3>
                <BarChart
                  data={chartData}
                  bars={[
                    { dataKey: "revenue", name: "Revenue", color: "#3b82f6" },
                    { dataKey: "expenses", name: "Expenses", color: "#f59e0b" },
                  ]}
                  xAxisKey="month"
                  height={300}
                />
              </div>

              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                <h3 className="text-xl font-bold mb-4">🥧 Pie Chart</h3>
                <PieChart
                  data={pieData}
                  colors={["#3b82f6", "#10b981", "#f59e0b"]}
                  height={300}
                />
              </div>

              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                <h3 className="text-xl font-bold mb-4">📉 Area Chart</h3>
                <AreaChart
                  data={chartData}
                  areas={[{ dataKey: "profit", name: "Profit", color: "#8b5cf6" }]}
                  xAxisKey="month"
                  height={300}
                />
              </div>
            </div>
          </div>
        )}

        {/* Exports Section */}
        {activeSection === "exports" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-6 text-white">
                <h2 className="text-2xl font-bold">📊 Excel Export</h2>
                <p className="mt-2 text-green-50">ExcelJS - Professional spreadsheets</p>
              </div>
              <div className="p-6">
                <ExcelPreview columns={excelColumns} data={invoiceData} maxRows={4} />
                <button
                  onClick={() =>
                    exportToExcel({
                      filename: "invoices",
                      columns: excelColumns,
                      data: invoiceData,
                      autoFilter: true,
                      freezeHeader: true,
                    })
                  }
                  className="mt-4 w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
                >
                  Download Excel File
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-6 text-white">
                <h2 className="text-2xl font-bold">📄 PDF Generation</h2>
                <p className="mt-2 text-blue-50">React-PDF - Professional documents</p>
              </div>
              <div className="p-6">
                <div className="border-2 border-gray-200 rounded-lg overflow-hidden" style={{ height: "300px" }}>
                  {pdfUrl ? (
                    <iframe
                      src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                      className="w-full h-full"
                      title="PDF Preview"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    </div>
                  )}
                </div>
                <PDFDownloadButton
                  document={<InvoicePDF invoice={sampleInvoice} />}
                  fileName="invoice-sample"
                  className="mt-4 w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  Download PDF
                </PDFDownloadButton>
              </div>
            </div>
          </div>
        )}

        {/* Calendar Section */}
        {activeSection === "calendar" && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-6 text-white">
              <h2 className="text-3xl font-bold mb-2">📅 React Big Calendar</h2>
              <p className="text-indigo-100">Google Calendar-like scheduling interface</p>
            </div>
            <div className="p-6">
              <CalendarScheduler
                events={calendarEvents}
                height={600}
                defaultView="week"
                onSelectEvent={(event) => alert(`Event: ${event.title}`)}
              />
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="p-4 bg-indigo-50 rounded-lg">
                  <h4 className="font-semibold mb-2">Features</h4>
                  <ul className="text-sm space-y-1 text-gray-700">
                    <li>✓ Multiple views (month/week/day)</li>
                    <li>✓ Drag & drop events</li>
                    <li>✓ Recurring events</li>
                    <li>✓ Resource scheduling</li>
                  </ul>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <h4 className="font-semibold mb-2">Use Cases</h4>
                  <ul className="text-sm space-y-1 text-gray-700">
                    <li>• Employee scheduling</li>
                    <li>• Meeting management</li>
                    <li>• Project timelines</li>
                    <li>• Resource booking</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ComponentLibrary() {
  return (
    <ToastProvider>
      <ComponentLibraryContent />
    </ToastProvider>
  );
}
