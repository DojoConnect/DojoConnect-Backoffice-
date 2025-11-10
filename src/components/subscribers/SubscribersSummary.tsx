// components/SubscriberSummary.tsx
export default function SubscriberSummary() {
  const stats = [
    { label: 'Total Subscribers', value: 24 },
    { label: 'Active Subscriptions', value: 2000 },
    { label: 'Cancelled Subscriptions', value: 2000, change: '+0.43%' }
  ]

  return (
    <div className="mt-8 gap-4  rounded-xl">
 
    <div className="grid md:grid-cols-3 grid-cols-1 gap-4 ">

      {stats.map(({ label, value, change }) => (
        <div key={label} className="bg-[#FFFFFF] flex flex-col justify-between rounded-lg p-4 h-[135px] shadow-sm">
          <div style={{border: "1px solid #FCC2C3"}} className="h-8 w-8 rounded-full bg-[#FFE5E5] flex items-center justify-center">
<svg width="14" height="10" viewBox="0 0 14 10" fill="none" xmlns="http://www.w3.org/2000/svg">
<path fillRule="evenodd" clipRule="evenodd" d="M9.00006 0.333252H2.33339C1.22882 0.333252 0.333389 1.22868 0.333389 2.33325V7.66659C0.333389 8.77116 1.22882 9.66659 2.33339 9.66659H9.00006C10.1046 9.66659 11.0001 8.77116 11.0001 7.66659V6.99992L12.6001 8.19992C13.0395 8.52954 13.6667 8.21595 13.6667 7.66659V2.33325C13.6667 1.78389 13.0395 1.4703 12.6001 1.79992L11.0001 2.99992V2.33325C11.0001 1.22868 10.1046 0.333252 9.00006 0.333252ZM2.062 3.42045C2.38272 3.52735 2.63439 3.77902 2.7413 4.09975C2.8501 4.42615 3.31179 4.42615 3.4206 4.09975C3.5275 3.77902 3.77917 3.52735 4.0999 3.42045C4.4263 3.31165 4.4263 2.84995 4.0999 2.74115C3.77917 2.63424 3.5275 2.38257 3.4206 2.06185C3.31179 1.73544 2.8501 1.73544 2.7413 2.06185C2.63439 2.38257 2.38272 2.63424 2.062 2.74115C1.73559 2.84995 1.73559 3.31165 2.062 3.42045Z" fill="#E51B1B"/>
</svg>

</div>
         <div>
           <div className="flex mb-1">
          <div className="text-xl text-[#0F1828] font-semibold">{value}</div>
         
        </div>
         <div className="flex flex-wrap justify-between">
          <div className="text-sm text-gray-600">{label}</div>
          {/* {status && <div className="text-sm text-green-500">{status}</div>}
          {change && <div className="text-sm text-green-500">{change}</div>} */}
         </div>
         </div>
          </div>
      ))}
    </div>
    </div>
  )
}
