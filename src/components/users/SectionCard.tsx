import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface Props {
  title: string
  link: string
}

export default function SectionCard({ title, link }: Props) {
  return (
    <div className="bg-white rounded-lg p-6 shadow flex justify-between items-center">
      <div>
        <h2 className="text-xl font-semibold text-[#0F1828]">{title}</h2>
        <p className="text-sm text-gray-500">Summary info or stats here</p>
      </div>
      <Link href={link}>
        <button className="flex items-center gap-2 text-red-600 font-medium hover:underline">
          View All <ArrowRight size={16} />
        </button>
      </Link>
    </div>
  )
}
