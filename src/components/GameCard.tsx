
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
      className={`group cursor-pointer transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl hover:shadow-purple-500/20 bg-gradient-to-br ${gradient} border border-white/10 text-white overflow-hidden relative`}
      onClick={onClick}
    >
      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-300" />
      
      <CardHeader className="relative z-10">
        <div className="flex items-center justify-between">
          <div className="p-3 bg-white/10 rounded-lg">
            <Icon className="w-8 h-8 text-white/90" />
          </div>
          <Badge 
            variant="secondary"
            className={`border-0 text-xs font-bold ${status === 'available' ? 'bg-green-500/90 text-white' : 'bg-gray-700/80 text-gray-300'}`}
          >
            {status === 'available' ? 'PLAY NOW' : 'COMING SOON'}
          </Badge>
        </div>
        <CardTitle className="text-2xl font-bold pt-4 text-white">
          {title}
        </CardTitle>
      </CardHeader>

      <CardContent className="relative z-10">
        <CardDescription className="text-white/70">
          {description}
        </CardDescription>
      </CardContent>

      <div className="absolute -bottom-16 -right-16 w-32 h-32 bg-white/5 rounded-full transition-transform duration-500 group-hover:scale-[2.5]" />
    </Card>
  )
}
