
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LucideIcon } from 'lucide-react'

interface GameCardProps {
  title: string
  description: string
  icon: LucideIcon
  status: 'coming-soon' | 'available'
  gradient: string
  onClick?: () => void
}

export function GameCard({ title, description, icon: Icon, status, gradient, onClick }: GameCardProps) {
  return (
    <Card 
      className={`group cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl bg-gradient-to-br ${gradient} border-0 text-white overflow-hidden relative`}
      onClick={onClick}
    >
      <div className="absolute inset-0 bg-black/10 group-hover:bg-black/5 transition-colors duration-300" />
      <CardHeader className="relative z-10">
        <div className="flex items-center justify-between">
          <Icon className="w-8 h-8 text-white/90" />
          <Badge 
            variant={status === 'available' ? 'default' : 'secondary'}
            className={status === 'available' ? 'bg-green-500/80' : 'bg-gray-500/80'}
          >
            {status === 'available' ? 'Available' : 'Coming Soon'}
          </Badge>
        </div>
        <CardTitle className="text-xl font-bold text-white group-hover:text-white/90 transition-colors">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="relative z-10">
        <CardDescription className="text-white/80 group-hover:text-white/70 transition-colors">
          {description}
        </CardDescription>
      </CardContent>
      <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-x-8 translate-y-8 group-hover:scale-110 transition-transform duration-500" />
    </Card>
  )
}
