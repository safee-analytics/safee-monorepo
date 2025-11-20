import React from "react";
import {
  LineChart as RechartsLineChart,
  Line,
  BarChart as RechartsBarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export interface ChartDataPoint {
  [key: string]: string | number;
}

export interface LineChartProps {
  data: ChartDataPoint[];
  lines: Array<{
    dataKey: string;
    name?: string;
    color?: string;
    strokeWidth?: number;
  }>;
  xAxisKey: string;
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  className?: string;
}

export interface BarChartProps {
  data: ChartDataPoint[];
  bars: Array<{
    dataKey: string;
    name?: string;
    color?: string;
  }>;
  xAxisKey: string;
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  className?: string;
}

export interface PieChartData {
  name: string;
  value: number;
  [key: string]: string | number;
}

export interface PieChartProps {
  data: PieChartData[];
  colors?: string[];
  height?: number;
  showLabels?: boolean;
  innerRadius?: number;
  outerRadius?: number;
  className?: string;
}

export interface AreaChartProps {
  data: ChartDataPoint[];
  areas: Array<{
    dataKey: string;
    name?: string;
    color?: string;
  }>;
  xAxisKey: string;
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  className?: string;
}

const DEFAULT_COLORS = [
  "#3b82f6", // blue
  "#10b981", // green
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // purple
  "#ec4899", // pink
];

/**
 * Line Chart Component
 */
export const LineChart: React.FC<LineChartProps> = ({
  data,
  lines,
  xAxisKey,
  height = 300,
  showGrid = true,
  showLegend = true,
  className = "",
}) => {
  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsLineChart data={data}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" />}
          <XAxis dataKey={xAxisKey} />
          <YAxis />
          <Tooltip />
          {showLegend && <Legend />}
          {lines.map((line, index) => (
            <Line
              key={line.dataKey}
              type="monotone"
              dataKey={line.dataKey}
              name={line.name || line.dataKey}
              stroke={line.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
              strokeWidth={line.strokeWidth || 2}
            />
          ))}
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
};

/**
 * Bar Chart Component
 */
export const BarChart: React.FC<BarChartProps> = ({
  data,
  bars,
  xAxisKey,
  height = 300,
  showGrid = true,
  showLegend = true,
  className = "",
}) => {
  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsBarChart data={data}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" />}
          <XAxis dataKey={xAxisKey} />
          <YAxis />
          <Tooltip />
          {showLegend && <Legend />}
          {bars.map((bar, index) => (
            <Bar
              key={bar.dataKey}
              dataKey={bar.dataKey}
              name={bar.name || bar.dataKey}
              fill={bar.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
            />
          ))}
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
};

/**
 * Pie Chart Component
 */
export const PieChart: React.FC<PieChartProps> = ({
  data,
  colors = DEFAULT_COLORS,
  height = 300,
  showLabels = true,
  innerRadius = 0,
  outerRadius = 100,
  className = "",
}) => {
  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsPieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={showLabels}
            label={showLabels}
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            fill="#8884d8"
            dataKey="value"
            nameKey="name"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip />
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  );
};

/**
 * Area Chart Component
 */
export const AreaChart: React.FC<AreaChartProps> = ({
  data,
  areas,
  xAxisKey,
  height = 300,
  showGrid = true,
  showLegend = true,
  className = "",
}) => {
  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsAreaChart data={data}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" />}
          <XAxis dataKey={xAxisKey} />
          <YAxis />
          <Tooltip />
          {showLegend && <Legend />}
          {areas.map((area, index) => (
            <Area
              key={area.dataKey}
              type="monotone"
              dataKey={area.dataKey}
              name={area.name || area.dataKey}
              fill={area.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
              stroke={area.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
            />
          ))}
        </RechartsAreaChart>
      </ResponsiveContainer>
    </div>
  );
};
