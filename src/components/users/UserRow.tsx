import Image from 'next/image'

export default function UserRow({ user }: { user: any }) {
  return (
    <div className="grid grid-cols-6 items-center py-3 border-b text-sm text-[#303030]">
      <div className="flex items-center gap-2">
        <Image
          src={user.avatar}
          alt={user.name}
          width={32}
          height={32}
          className="rounded-full"
        />
        {user.name}
      </div>
      <div>{user.email}</div>
      <div>{user.userType}</div>
      <div>{user.joinDate}</div>
      <div>{user.lastActivity}</div>
      <div>{user.status}</div>
    </div>
  )
}
