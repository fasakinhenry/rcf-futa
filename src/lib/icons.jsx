/**
 * Central icon exports for RCF FUTA.
 * Usage: import { SearchIcon } from '../lib/icons.jsx'
 */
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Search01Icon as _Search,
  Menu01Icon as _Menu,
  Cancel01Icon as _Cancel,
  Notification01Icon as _Notification,
  PlayIcon as _Play,
  PauseIcon as _Pause,
  NextIcon as _Next,
  PreviousIcon as _Previous,
  VolumeHighIcon as _VolumeHigh,
  VolumeMuteIcon as _VolumeMute,
  ArrowUp01Icon as _ArrowUp,
  ArrowDown01Icon as _ArrowDown,
  Delete02Icon as _Delete,
  CheckmarkCircle01Icon as _CheckmarkCircle,
  UserAdd01Icon as _UserAdd,
  LockIcon as _Lock,
  EyeIcon as _Eye,
  EyeOffIcon as _EyeOff,
  Logout01Icon as _Logout,
  Upload04Icon as _Upload,
  MusicNote01Icon as _MusicNote,
  HeadphonesIcon as _Headphones,
  Time04Icon as _Time,
  Calendar03Icon as _Calendar,
  Edit01Icon as _Edit,
  Mail01Icon as _Mail,
  TickDouble01Icon as _TickDouble,
  GoBackward15SecIcon as _Back15,
  GoForward15SecIcon as _Forward15,
  Loading03Icon as _Loading,
  UserGroupIcon as _UserGroup,
  HeartCheckIcon as _HeartCheck,
  BookOpen01Icon as _BookOpen,
  Queue01Icon as _Queue,
  Add01Icon as _Add,
  BarChartIcon as _ChartBar,
  Mic01Icon as _Mic,
  FilterIcon as _Filter,
  SortByDown01Icon as _SortDesc,
} from '@hugeicons/core-free-icons'

function makeIcon(iconData) {
  return function Icon({ size = 20, className = '', ...props }) {
    return (
      <HugeiconsIcon
        icon={iconData}
        size={size}
        className={className}
        strokeWidth={1.5}
        {...props}
      />
    )
  }
}

export const SearchIcon = makeIcon(_Search)
export const MenuIcon = makeIcon(_Menu)
export const CancelIcon = makeIcon(_Cancel)
export const NotificationIcon = makeIcon(_Notification)
export const PlayIcon = makeIcon(_Play)
export const PauseIcon = makeIcon(_Pause)
export const NextIcon = makeIcon(_Next)
export const PreviousIcon = makeIcon(_Previous)
export const VolumeHighIcon = makeIcon(_VolumeHigh)
export const VolumeMuteIcon = makeIcon(_VolumeMute)
export const ArrowUpIcon = makeIcon(_ArrowUp)
export const ArrowDownIcon = makeIcon(_ArrowDown)
export const DeleteIcon = makeIcon(_Delete)
export const CheckCircleIcon = makeIcon(_CheckmarkCircle)
export const UserAddIcon = makeIcon(_UserAdd)
export const LockIcon = makeIcon(_Lock)
export const EyeIcon = makeIcon(_Eye)
export const EyeOffIcon = makeIcon(_EyeOff)
export const LogoutIcon = makeIcon(_Logout)
export const UploadIcon = makeIcon(_Upload)
export const MusicNoteIcon = makeIcon(_MusicNote)
export const HeadphonesIcon = makeIcon(_Headphones)
export const TimeIcon = makeIcon(_Time)
export const CalendarIcon = makeIcon(_Calendar)
export const EditIcon = makeIcon(_Edit)
export const MailIcon = makeIcon(_Mail)
export const TickDoubleIcon = makeIcon(_TickDouble)
export const Back15Icon = makeIcon(_Back15)
export const Forward15Icon = makeIcon(_Forward15)
export const LoadingIcon = makeIcon(_Loading)
export const UsersIcon = makeIcon(_UserGroup)
export const HeartCheckIcon = makeIcon(_HeartCheck)
export const BookOpenIcon = makeIcon(_BookOpen)
export const QueueIcon = makeIcon(_Queue)
export const AddIcon = makeIcon(_Add)
export const ChartBarIcon = makeIcon(_ChartBar)
export const MicIcon = makeIcon(_Mic)
export const FilterIcon = makeIcon(_Filter)
export const SortDescIcon = makeIcon(_SortDesc)
