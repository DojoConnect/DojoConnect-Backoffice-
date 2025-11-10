// components/RevenueChart.tsx
'use client'

export default function RevenueChart() {
  const dojos = [
    { name: 'Dojo A', revenue: 2000 },
    { name: 'Dojo B', revenue: 3500 },
    { name: 'Dojo C', revenue: 5000 },
    { name: 'Dojo D', revenue: 10000 },
    { name: 'Dojo E', revenue: 2500 },
    { name: 'Dojo F', revenue: 6000 },
    { name: 'Dojo G', revenue: 8000 },
    { name: 'Dojo H', revenue: 5500 },
    { name: 'Dojo I', revenue: 4000 },
    { name: 'Dojo J', revenue: 1000 },
    { name: 'Dojo K', revenue: 7000 },
    { name: 'Dojo L', revenue: 12000 },
  ]

  const maxRevenue = Math.max(...dojos.map((d) => d.revenue))

  return (
    <div  className="bg-[#FFFFFF] p-4 gap-4  rounded-xl"  style={{border:'1px solid #ECE4E4'}}>
       <h1 className="text-base font-semibold mb-4 text-[#475367]">Avg. Revenue per Dojos</h1>
      
    </div>
  )
}
