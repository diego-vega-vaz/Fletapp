import {
  Home, FileText, Package, CreditCard, MessageSquare, Settings, LogOut, Menu, X,
  ChevronDown, ChevronRight, ChevronLeft, Search, Bell, User, Plus, Edit,
  Download, Upload, Send, Share, Phone, Eye, EyeOff, CheckCircle, Check,
  AlertCircle, XCircle, Clock, TrendingUp, Truck, MapPin, Navigation,
  DollarSign, Mail, Info, Calendar, Paperclip, Lock, ArrowRight, ArrowLeft,
  Filter, RefreshCw, MoreHorizontal, Box, Smile, Building, HelpCircle,
  Zap, Star, Shield, Globe, Flag, MessageCircle, Route, Navigation2,
  FileIcon,
} from 'lucide-react'
import type { LucideProps } from 'lucide-react'

const ICON_MAP: Record<string, React.ComponentType<LucideProps>> = {
  home: Home,
  file: FileIcon,
  fileText: FileText,
  package: Package,
  card: CreditCard,
  chat: MessageSquare,
  settings: Settings,
  logout: LogOut,
  menu: Menu,
  close: X,
  chevronDown: ChevronDown,
  chevronRight: ChevronRight,
  chevronLeft: ChevronLeft,
  search: Search,
  bell: Bell,
  user: User,
  plus: Plus,
  edit: Edit,
  download: Download,
  upload: Upload,
  send: Send,
  share: Share,
  phone: Phone,
  eye: Eye,
  eyeOff: EyeOff,
  checkCircle: CheckCircle,
  check: Check,
  alertCircle: AlertCircle,
  xCircle: XCircle,
  clock: Clock,
  trendingUp: TrendingUp,
  truck: Truck,
  mapPin: MapPin,
  navigation: Navigation,
  navigation2: Navigation2,
  dollar: DollarSign,
  mail: Mail,
  info: Info,
  calendar: Calendar,
  paperclip: Paperclip,
  lock: Lock,
  arrowRight: ArrowRight,
  arrowLeft: ArrowLeft,
  filter: Filter,
  refresh: RefreshCw,
  moreH: MoreHorizontal,
  box: Box,
  smile: Smile,
  building: Building,
  helpCircle: HelpCircle,
  zap: Zap,
  star: Star,
  shield: Shield,
  globe: Globe,
  flag: Flag,
  whatsapp: MessageCircle,
  route: Route,
}

interface IconProps {
  name: string
  size?: number
  className?: string
  style?: React.CSSProperties
}

export function Icon({ name, size = 20, className = '', style }: IconProps) {
  const Comp = ICON_MAP[name]
  if (!Comp) return null
  return <Comp size={size} className={`icon ${className}`} style={{ flexShrink: 0, ...style }} aria-hidden />
}
