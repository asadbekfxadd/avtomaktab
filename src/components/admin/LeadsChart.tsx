"use client";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function LeadsChart({ data, color }: { data: { day: string; leads: number; enrolled: number }[]; color: string }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }} barGap={2}>
          <CartesianGrid vertical={false} stroke="#E1E4E8" />
          <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={11} interval="preserveStartEnd" stroke="#5B6168" />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={11} stroke="#5B6168" />
          <Tooltip cursor={{ fill: "rgba(0,0,0,.04)" }} contentStyle={{ borderRadius: 8, border: "1px solid #E1E4E8", fontSize: 13 }} />
          <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="leads" name="Заявки" fill={color} radius={[3, 3, 0, 0]} />
          <Bar dataKey="enrolled" name="Записались" fill="#178A4E" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
