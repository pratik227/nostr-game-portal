
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { User, Gamepad2 } from 'lucide-react'

interface LoginModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onLaunchNostrLogin: () => void
}

export function LoginModal({ open, onOpenChange, onLaunchNostrLogin }: LoginModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white rounded-2xl border-none shadow-2xl p-0">
        <DialogHeader className="text-center items-center pt-8 px-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-steel-blue to-deep-sea rounded-full mb-4 shadow-lg">
                <Gamepad2 size={32} className="text-white" />
            </div>
            <DialogTitle className="text-2xl font-bold text-deep-sea">Login Required</DialogTitle>
            <DialogDescription className="text-steel-blue pt-1">
                Connect with Nostr to play games and save your profile.
            </DialogDescription>
        </DialogHeader>
        <div className="px-8 pb-8 pt-4">
            <Button
              onClick={onLaunchNostrLogin}
              className="w-full h-12 text-base font-medium bg-gold hover:bg-gold/90 text-deep-sea rounded-xl transition-all duration-200 shadow-md hover:shadow-lg focus:ring-2 focus:ring-gold/50 focus:ring-offset-2"
            >
              <User className="mr-2 h-5 w-5" />
              Connect with Nostr
            </Button>
            <p className="text-xs text-steel-blue/80 text-center mt-4">
              Uses a NIP-07 browser extension or remote signer.
            </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
