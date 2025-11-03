'use client'

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
  FileCheck,
  Calculator,
  Users,
  TrendingUp,
  ArrowRight,
  Clock,
  CheckCircle,
  AlertCircle,
  Sparkles,
  CalendarDays,
  ListTodo,
  BarChart3,
  Circle
} from 'lucide-react'
import { useTranslation } from '@/lib/providers/TranslationProvider'

interface AppModule {
  id: string
  name: string
  nameAr: string
  description: string
  descriptionAr: string
  icon: any
  color: string
  gradient: string
  href: string
  stats?: {
    label: string
    labelAr: string
    value: string | number
  }
}

export default function HomePage() {
  const { t, locale } = useTranslation()
  const router = useRouter()

  // Get current time for greeting
  const currentHour = new Date().getHours()
  const getGreeting = () => {
    if (currentHour < 12) {
      return t.dashboard.goodMorning
    } else if (currentHour < 18) {
      return t.dashboard.goodAfternoon
    } else {
      return t.dashboard.goodEvening
    }
  }

  const modules: AppModule[] = [
    {
      id: 'audit',
      name: t.nav.audit,
      nameAr: t.nav.audit,
      description: 'Comprehensive audit management and compliance tracking',
      descriptionAr: 'إدارة التدقيق الشاملة وتتبع الامتثال',
      icon: FileCheck,
      color: 'blue',
      gradient: 'from-blue-500 to-blue-600',
      href: '/audit/dashboard',
      stats: {
        label: t.dashboard.activeCases,
        labelAr: t.dashboard.activeCases,
        value: 12
      }
    },
    {
      id: 'hisabiq',
      name: t.nav.hisabiq,
      nameAr: t.nav.hisabiq,
      description: 'Full-featured accounting and financial management',
      descriptionAr: 'المحاسبة الكاملة والإدارة المالية',
      icon: Calculator,
      color: 'green',
      gradient: 'from-green-500 to-green-600',
      href: '/accounting',
      stats: {
        label: t.dashboard.recentTransactions,
        labelAr: t.dashboard.recentTransactions,
        value: 48
      }
    },
    {
      id: 'kanz',
      name: t.nav.kanz,
      nameAr: t.nav.kanz,
      description: 'HR management, payroll, and employee records',
      descriptionAr: 'إدارة الموارد البشرية والرواتب وسجلات الموظفين',
      icon: Users,
      color: 'purple',
      gradient: 'from-purple-500 to-purple-600',
      href: '/hr',
      stats: {
        label: t.dashboard.activeEmployees,
        labelAr: t.dashboard.activeEmployees,
        value: 156
      }
    },
    {
      id: 'nisbah',
      name: t.nav.nisbah,
      nameAr: t.nav.nisbah,
      description: 'Customer relationship management and sales tracking',
      descriptionAr: 'إدارة علاقات العملاء وتتبع المبيعات',
      icon: TrendingUp,
      color: 'orange',
      gradient: 'from-orange-500 to-orange-600',
      href: '/crm',
      stats: {
        label: t.dashboard.activeDeals,
        labelAr: t.dashboard.activeDeals,
        value: 24
      }
    }
  ]

  const tasks = [
    { id: '1', title: 'Review ICV audit documentation', priority: 'high', due: '2 hours', completed: false },
    { id: '2', title: 'Approve Q4 financial reports', priority: 'high', due: '4 hours', completed: false },
    { id: '3', title: 'Complete employee onboarding', priority: 'medium', due: 'Tomorrow', completed: false },
    { id: '4', title: 'Follow up with client leads', priority: 'medium', due: 'Tomorrow', completed: false },
    { id: '5', title: 'Update audit checklist', priority: 'low', due: 'This week', completed: true },
  ]

  const events = [
    { id: '1', title: 'Team Meeting', time: '10:00 AM', date: 'Today', color: 'blue' },
    { id: '2', title: 'Client Presentation', time: '2:00 PM', date: 'Today', color: 'green' },
    { id: '3', title: 'Audit Review', time: '11:00 AM', date: 'Tomorrow', color: 'purple' },
    { id: '4', title: 'Financial Planning', time: '3:00 PM', date: 'Tomorrow', color: 'orange' },
  ]

  const recentActivity = [
    {
      id: '1',
      type: 'audit',
      title: locale === 'ar' ? 'تم إكمال تدقيق ICV' : 'ICV Audit Completed',
      time: locale === 'ar' ? 'منذ ساعتين' : '2 hours ago',
      status: 'completed'
    },
    {
      id: '2',
      type: 'hisabiq',
      title: locale === 'ar' ? 'تمت إضافة فاتورة جديدة' : 'New Invoice Added',
      time: locale === 'ar' ? 'منذ 4 ساعات' : '4 hours ago',
      status: 'info'
    },
    {
      id: '3',
      type: 'kanz',
      title: locale === 'ar' ? 'تمت معالجة الرواتب' : 'Payroll Processed',
      time: locale === 'ar' ? 'أمس' : 'Yesterday',
      status: 'completed'
    }
  ]

  const overviewStats = [
    { label: t.dashboard.pendingTasks, value: '8', change: '+2', trend: 'up', color: 'blue' },
    { label: t.dashboard.completedToday, value: '12', change: '+4', trend: 'up', color: 'green' },
    { label: t.dashboard.activeCases, value: '15', change: '-1', trend: 'down', color: 'purple' },
    { label: t.dashboard.thisWeek, value: '47', change: '+12', trend: 'up', color: 'orange' },
  ]

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50'
      case 'medium': return 'text-yellow-600 bg-yellow-50'
      case 'low': return 'text-gray-600 bg-gray-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Welcome Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-6 h-6 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              {getGreeting()}, Mahmoud
            </h1>
          </div>
          <p className="text-gray-600 text-lg">
            {t.dashboard.welcomeMessage}
          </p>
        </motion.div>

        {/* Overview Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6"
        >
          {overviewStats.map((stat, index) => (
            <div key={index} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">{stat.label}</span>
                <BarChart3 className={`w-4 h-4 text-${stat.color}-600`} />
              </div>
              <div className="flex items-end justify-between">
                <span className="text-3xl font-bold text-gray-900">{stat.value}</span>
                <span className={`text-sm font-medium ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                  {stat.change}
                </span>
              </div>
            </div>
          ))}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* App Modules - Takes 2 columns */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {modules.map((module, index) => {
                const Icon = module.icon
                return (
                  <motion.div
                    key={module.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                    onClick={() => router.push(module.href)}
                    className="group relative bg-white rounded-2xl border-2 border-gray-200 hover:border-transparent hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${module.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                    <div className="relative p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${module.gradient} flex items-center justify-center group-hover:bg-white/20 transition-all duration-300`}>
                          <Icon className="w-7 h-7 text-white" />
                        </div>
                        <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-white group-hover:translate-x-1 transition-all duration-300" />
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900 group-hover:text-white mb-2 transition-colors duration-300">
                        {locale === 'ar' ? module.nameAr : module.name}
                      </h2>
                      <p className="text-gray-600 group-hover:text-white/90 mb-4 transition-colors duration-300 text-sm">
                        {locale === 'ar' ? module.descriptionAr : module.description}
                      </p>
                      {module.stats && (
                        <div className="flex items-center justify-between pt-4 border-t border-gray-200 group-hover:border-white/20 transition-colors duration-300">
                          <span className="text-sm text-gray-500 group-hover:text-white/70 transition-colors duration-300">
                            {locale === 'ar' ? module.stats.labelAr : module.stats.label}
                          </span>
                          <span className="text-2xl font-bold text-gray-900 group-hover:text-white transition-colors duration-300">
                            {module.stats.value}
                          </span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>

          {/* Tasks & Calendar - Takes 1 column */}
          <div className="space-y-6">
            {/* My Tasks */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl border border-gray-200 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <ListTodo className="w-5 h-5 text-gray-600" />
                  <h3 className="text-lg font-bold text-gray-900">{t.dashboard.myTasks}</h3>
                </div>
                <span className="text-sm text-gray-500">5</span>
              </div>
              <div className="space-y-3">
                {tasks.slice(0, 4).map((task, index) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + index * 0.05 }}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <button className="mt-0.5">
                      {task.completed ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <Circle className="w-5 h-5 text-gray-300" />
                      )}
                    </button>
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${task.completed ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                        {task.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                        <span className="text-xs text-gray-500">{task.due}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
              <button className="w-full mt-4 py-2 text-center text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors">
                {t.dashboard.viewAllTasks}
              </button>
            </motion.div>

            {/* Upcoming Events */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-2xl border border-gray-200 p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <CalendarDays className="w-5 h-5 text-gray-600" />
                <h3 className="text-lg font-bold text-gray-900">{t.dashboard.upcomingEvents}</h3>
              </div>
              <div className="space-y-3">
                {events.map((event, index) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.05 }}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <div className={`w-2 h-2 rounded-full bg-${event.color}-600`}></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{event.title}</p>
                      <p className="text-xs text-gray-500">{event.date} • {event.time}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-2xl border border-gray-200 p-6 mb-6"
        >
          <div className="flex items-center gap-2 mb-6">
            <Clock className="w-5 h-5 text-gray-600" />
            <h3 className="text-xl font-bold text-gray-900">{t.dashboard.recentActivity}</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recentActivity.map((activity, index) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + index * 0.1 }}
                className="flex items-center gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer border border-gray-100"
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  activity.status === 'completed' ? 'bg-green-100' : 'bg-blue-100'
                }`}>
                  {activity.status === 'completed' ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-blue-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">{activity.title}</p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <h3 className="text-lg font-bold text-gray-900 mb-4">{t.dashboard.quickActions}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all text-left group">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-blue-100 group-hover:bg-blue-600 flex items-center justify-center transition-colors">
                  <FileCheck className="w-5 h-5 text-blue-600 group-hover:text-white transition-colors" />
                </div>
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">{t.dashboard.createAuditCase}</h4>
              <p className="text-sm text-gray-600">{t.dashboard.createAuditCaseDesc}</p>
            </button>

            <button className="p-4 bg-white rounded-xl border border-gray-200 hover:border-green-500 hover:shadow-md transition-all text-left group">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-green-100 group-hover:bg-green-600 flex items-center justify-center transition-colors">
                  <Calculator className="w-5 h-5 text-green-600 group-hover:text-white transition-colors" />
                </div>
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">{t.dashboard.createInvoice}</h4>
              <p className="text-sm text-gray-600">{t.dashboard.createInvoiceDesc}</p>
            </button>

            <button className="p-4 bg-white rounded-xl border border-gray-200 hover:border-purple-500 hover:shadow-md transition-all text-left group">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-purple-100 group-hover:bg-purple-600 flex items-center justify-center transition-colors">
                  <Users className="w-5 h-5 text-purple-600 group-hover:text-white transition-colors" />
                </div>
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">{t.dashboard.addEmployee}</h4>
              <p className="text-sm text-gray-600">{t.dashboard.addEmployeeDesc}</p>
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
