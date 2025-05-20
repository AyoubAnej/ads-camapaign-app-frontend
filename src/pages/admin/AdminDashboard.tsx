import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from 'react-i18next';
import { DollarSign, Users, Target, TrendingUp, BarChart3, LineChart, Eye, ArrowUp, ArrowDown, ChartLine, Table as TableIcon } from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  LineChart as RechartsLineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

const userGrowthData = [
  { month: 'Jan', users: 100 },
  { month: 'Feb', users: 120 },
  { month: 'Mar', users: 150 },
  { month: 'Apr', users: 170 },
  { month: 'May', users: 190 },
  { month: 'Jun', users: 220 },
  { month: 'Jul', users: 240 },
];

const campaignPerformanceData = [
  { name: 'Email', value: 400 },
  { name: 'Social Media', value: 300 },
  { name: 'Search', value: 300 },
  { name: 'Display', value: 200 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const revenueData = [
  { name: 'Jan', revenue: 4000, target: 2400 },
  { name: 'Feb', revenue: 3000, target: 2800 },
  { name: 'Mar', revenue: 5000, target: 3000 },
  { name: 'Apr', revenue: 7000, target: 3200 },
  { name: 'May', revenue: 6500, target: 3500 },
  { name: 'Jun', revenue: 8000, target: 3800 },
];

const campaignMetrics = [
  {
    label: "Total Clicks",
    value: 9821,
    change: 8.2,
    trend: "up",
    color: "text-purple-600",
    icon: ChartLine,
  },
  {
    label: "Total Spend",
    value: "$12,340",
    change: 2.3,
    trend: "up",
    color: "text-green-700",
    icon: ChartLine,
  },
  {
    label: "CTR (Click-through Rate)",
    value: "5.1%",
    change: 0.4,
    trend: "up",
    color: "text-blue-700",
    icon: ChartLine,
  },
  {
    label: "CPC (Cost per Click)",
    value: "$1.26",
    change: -1.1,
    trend: "down",
    color: "text-pink-600",
    icon: ChartLine,
  },
];

const campaignPerformanceOverTime = [
  { date: "2024-04-01", clicks: 150, impressions: 3000, spend: 200 },
  { date: "2024-04-02", clicks: 185, impressions: 3450, spend: 270 },
  { date: "2024-04-03", clicks: 170, impressions: 3200, spend: 255 },
  { date: "2024-04-04", clicks: 220, impressions: 4000, spend: 300 },
  { date: "2024-04-05", clicks: 190, impressions: 3700, spend: 265 },
  { date: "2024-04-06", clicks: 205, impressions: 4200, spend: 310 },
  { date: "2024-04-07", clicks: 201, impressions: 4100, spend: 305 },
];

const recentCampaigns = [
  {
    name: "Spring Promo",
    status: "Active",
    clicks: 1235,
    impressions: 40210,
    spend: 1900,
    startDate: "2024-03-25",
    endDate: "2024-04-04",
  },
  {
    name: "Brand Awareness Q2",
    status: "Paused",
    clicks: 834,
    impressions: 29800,
    spend: 1120,
    startDate: "2024-03-21",
    endDate: "2024-04-04",
  },
  {
    name: "Lead Gen Push",
    status: "Active",
    clicks: 1572,
    impressions: 51200,
    spend: 2300,
    startDate: "2024-04-01",
    endDate: "2024-04-10",
  },
  {
    name: "Summer Tease",
    status: "Active",
    clicks: 942,
    impressions: 27000,
    spend: 1100,
    startDate: "2024-04-02",
    endDate: "2024-04-17",
  },
];

const AdminDashboard = () => {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t('common.dashboard')}</h1>
          <p className="text-gray-500 dark:text-gray-400">{t('adminDashboard.welcome')}</p>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('adminDashboard.totalUsers')}</CardTitle>
            <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,234</div>
            <div className="flex items-center text-xs text-green-600">
              <ArrowUp className="h-3 w-3 mr-1" />
              <span>12% {t('common.from')}</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('adminDashboard.activeCampaigns')}</CardTitle>
            <Target className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">324</div>
            <div className="flex items-center text-xs text-green-600">
              <ArrowUp className="h-3 w-3 mr-1" />
              <span>18% {t('common.from')}</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('adminDashboard.totalRevenue')}</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$24,563</div>
            <div className="flex items-center text-xs text-green-600">
              <ArrowUp className="h-3 w-3 mr-1" />
              <span>5% {t('common.from')}</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('adminDashboard.totalImpressions')}</CardTitle>
            <Eye className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1.2M</div>
            <div className="flex items-center text-xs text-red-600">
              <ArrowDown className="h-3 w-3 mr-1" />
              <span>3% {t('common.from')}</span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {campaignMetrics.map((metric) => (
          <Card key={metric.label} className="dark:border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.label}</CardTitle>
              <metric.icon className={`h-4 w-4 ${metric.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <div className={`flex items-center text-xs ${metric.trend === "up" ? "text-green-600" : "text-red-600"}`}>
                {metric.trend === "up" ? (
                  <ArrowUp className="h-3 w-3 mr-1" />
                ) : (
                  <ArrowDown className="h-3 w-3 mr-1" />
                )}
                <span>{Math.abs(metric.change)}% {t('common.from')}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('adminDashboard.userGrowth')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={userGrowthData}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="users" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('adminDashboard.campaignPerformanceByChannel')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={campaignPerformanceData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {campaignPerformanceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('adminDashboard.campaignPerformanceOverTime')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsLineChart
                data={campaignPerformanceOverTime}
                margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="clicks" stroke="#8B5CF6" name="Clicks" />
                <Line type="monotone" dataKey="impressions" stroke="#0EA5E9" name="Impressions" yAxisId={0} />
                <Line type="monotone" dataKey="spend" stroke="#F97316" name="Spend" yAxisId={0} />
              </RechartsLineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('adminDashboard.revenueVsTarget')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsLineChart
                data={revenueData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#8884d8" activeDot={{ r: 8 }} />
                <Line type="monotone" dataKey="target" stroke="#82ca9d" />
              </RechartsLineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TableIcon className="w-5 h-5 text-blue-500" /> {t('adminDashboard.recentCampaigns')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('adminDashboard.campaignName')}</TableHead>
                  <TableHead>{t('adminDashboard.status')}</TableHead>
                  <TableHead>{t('adminDashboard.clicks')}</TableHead>
                  <TableHead>{t('adminDashboard.impressions')}</TableHead>
                  <TableHead>{t('adminDashboard.spend')}</TableHead>
                  <TableHead>{t('adminDashboard.startDate')}</TableHead>
                  <TableHead>{t('adminDashboard.endDate')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentCampaigns.map((campaign, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{campaign.name}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs font-semibold
                        ${campaign.status === t('common.active') 
                          ? "bg-green-200 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                        }
                      `}>
                        {campaign.status}
                      </span>
                    </TableCell>
                    <TableCell>{campaign.clicks}</TableCell>
                    <TableCell>{campaign.impressions.toLocaleString()}</TableCell>
                    <TableCell>${campaign.spend.toLocaleString()}</TableCell>
                    <TableCell>{campaign.startDate}</TableCell>
                    <TableCell>{campaign.endDate}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
