
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
      className={`group cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-xl bg-gradient-to-br ${gradient} border-0 text-white overflow-hidden relative shadow-lg`}
      onClick={onClick}
    >
      <div className="absolute inset-0 bg-black/10 group-hover:bg-black/5 transition-colors duration-300" />
      
      <CardHeader className="relative z-10 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl shadow-md">
            <Icon className="w-7 h-7 text-white drop-shadow-sm" />
          </div>
          <Badge 
            className={`border-0 text-xs font-semibold px-3 py-1 rounded-full ${
              status === 'available' 
                ? 'bg-green-500 text-white shadow-md' 
                : 'bg-gray-700/80 text-gray-200'
            }`}
          >
            {status === 'available' ? 'PLAY NOW' : 'COMING SOON'}
          </Badge>
        </div>
        <CardTitle className="text-xl font-bold text-white drop-shadow-sm">
          {title}
        </CardTitle>
      </CardHeader>

      <CardContent className="relative z-10 pt-0">
        <CardDescription className="text-white/90 leading-relaxed">
          {description}
        </CardDescription>
      </CardContent>

      <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-white/10 rounded-full transition-transform duration-500 group-hover:scale-150" />
    </Card>
  )
}
