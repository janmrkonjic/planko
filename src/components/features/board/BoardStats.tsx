import { useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import type { BoardDetails, Task } from '@/types'

interface BoardStatsProps {
  board: BoardDetails
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function BoardStats({ board, open, onOpenChange }: BoardStatsProps) {
  // Collect all tasks from all columns
  const allTasks = useMemo(() => {
    return board.columns.flatMap(col => col.tasks)
  }, [board.columns])

  // Calculate metrics
  const metrics = useMemo(() => {
    const total = allTasks.length

    // Status Distribution (based on column titles)
    const statusMap = new Map<string, number>()
    board.columns.forEach(col => {
      statusMap.set(col.title, col.tasks.length)
    })

    const statusData = Array.from(statusMap.entries()).map(([name, value]) => ({
      name,
      value,
    }))

    // Priority Breakdown
    const priorityMap = { high: 0, medium: 0, low: 0 }
    allTasks.forEach(task => {
      priorityMap[task.priority]++
    })

    const priorityData = [
      { name: 'High', value: priorityMap.high, priority: 'high' },
      { name: 'Medium', value: priorityMap.medium, priority: 'medium' },
      { name: 'Low', value: priorityMap.low, priority: 'low' },
    ]

    // Completion Rate (assuming last column is "Done")
    const doneColumn = board.columns[board.columns.length - 1]
    const completedTasks = doneColumn?.tasks.length || 0
    const completionRate = total > 0 ? Math.round((completedTasks / total) * 100) : 0

    return {
      total,
      statusData,
      priorityData,
      completedTasks,
      completionRate,
    }
  }, [allTasks, board.columns])

  // Colors for charts (dark mode compatible using CSS variables)
  const STATUS_COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))']
  
  const PRIORITY_COLORS = {
    high: 'hsl(0 84.2% 60.2%)', // destructive color
    medium: 'hsl(47.9 95.8% 53.1%)', // warning/amber
    low: 'hsl(142.1 76.2% 36.3%)', // success/green
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Board Statistics</DialogTitle>
          <DialogDescription>
            Visual analytics for "{board.title}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Tasks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{metrics.total}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{metrics.completedTasks}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Completion Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{metrics.completionRate}%</div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status Distribution - Donut Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Task Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {metrics.total > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={metrics.statusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {metrics.statusData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--popover))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '6px',
                          color: 'hsl(var(--popover-foreground))'
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    No tasks to display
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Priority Breakdown - Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Priority Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                {metrics.total > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={metrics.priorityData}>
                      <XAxis 
                        dataKey="name" 
                        stroke="hsl(var(--muted-foreground))"
                      />
                      <YAxis 
                        stroke="hsl(var(--muted-foreground))"
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--popover))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '6px',
                          color: 'hsl(var(--popover-foreground))'
                        }}
                      />
                      <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                        {metrics.priorityData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PRIORITY_COLORS[entry.priority as keyof typeof PRIORITY_COLORS]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    No tasks to display
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
