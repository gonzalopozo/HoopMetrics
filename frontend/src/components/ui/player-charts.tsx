"use client"

import {
  BarChart as RBarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  LineChart as RLineChart, Line,
  PieChart as RPieChart, Pie, Cell, Legend,
  RadarChart as RRadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from "recharts"

export function BarChart({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <RBarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="value" fill="#1746f3" />
      </RBarChart>
    </ResponsiveContainer>
  )
}

export function LineChart({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <RLineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="game" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="points" stroke="#4273ff" />
      </RLineChart>
    </ResponsiveContainer>
  )
}

const PIE_COLORS = ["#4273ff", "#f83c3c", "#ffd600"]
export function PieChart({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <RPieChart>
        <Pie data={data} dataKey="value" nameKey="label" cx="50%" cy="50%" outerRadius={80} label>
          {data.map((_, i) => (
            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </RPieChart>
    </ResponsiveContainer>
  )
}

export function RadarChart({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <RRadarChart data={data}>
        <PolarGrid />
        <PolarAngleAxis dataKey="stat" />
        <PolarRadiusAxis />{
        <Radar name="Skill" dataKey="value" stroke="#f83c3c" fill="#f83c3c" fillOpacity={0.6} />    return (
        <Tooltip />
      </RRadarChart><RRadarChart data={data}>
    </ResponsiveContainer>
  )ey="stat" />
}