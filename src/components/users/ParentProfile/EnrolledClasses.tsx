import { FaCalendarAlt } from 'react-icons/fa';

// Replace this with your real data source
const classesData = []; // Example: [{ id: 1, className: 'Math', classLevel: 'Beginner', classImg: '/class1.jpg', instructor: { name: 'Mr. Smith' }, enrollmentDate: '2024-01-01', status: 'Active' }]

export default function EnrolledClasses() {
  const hasClasses = classesData.length > 0;

  return (
    <div>
      <div className="flex items-center justify-between bg-gray-100 rounded-md px-6 py-4 mb-4">
        <span className="text-black font-semibold text-base">
          Enrolled Classes ({hasClasses ? classesData.length : 0})
        </span>
        <button
          className="text-[#E51B1B] font-medium text-sm bg-transparent border-none shadow-none"
          type="button"
        >
          Enroll now
        </button>
      </div>
      {hasClasses ? (
        <div className="bg-white rounded-md p-4 flex flex-col gap-4">
          {classesData.slice(0, 2).map((cls) => (
            <div key={cls.id} className="bg-white-100 rounded-md p-4 flex flex-col gap-2">
              <div className="flex items-center gap-4">
                <img
                  src={cls.classImg}
                  alt="Class"
                  className="w-14 h-14 rounded-md object-cover"
                />
                <div>
                  <div className="font-bold text-base">
                    {cls.className} - {cls.classLevel} Class
                  </div>
                  <div className="text-gray-500 text-sm">
                    Instructor {cls.instructor.name}
                  </div>
                </div>
              </div>
              <div className="flex gap-8 mt-2 text-xs text-gray-600">
                <div className="flex flex-col items-start">
                  <div className="flex items-center gap-1">
                    <FaCalendarAlt className="w-3 h-3" />
                    <span>Enrolled</span>
                  </div>
                  <span>{cls.enrollmentDate}</span>
                </div>
                <div className="flex flex-col items-start">
                  <div className="flex items-center gap-1">
                    <FaCalendarAlt className="w-3 h-3" />
                    <span>Status</span>
                  </div>
                  <span>{cls.status}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-md p-6 flex flex-col items-center justify-center min-h-[320px]">
          <div className="mb-4">
            {/* eslint-disable-next-line */}
            <span className= "bg-gray-500 rounded-full"  dangerouslySetInnerHTML={{__html: `<svg xmlns="http://www.w3.org/2000/svg" width="121" height="121" fill="none"><g clip-path="url(#a)"><path fill="url(#b)" d="M60.5 108.1c26.51 0 48-21.49 48-48s-21.49-48-48-48-48 21.49-48 48 21.49 48 48 48Z"/><g filter="url(#c)"><rect width="49.815" height="62.011" x="36.1" y="25.923" fill="url(#d)" rx="6.4"/></g><rect width="20" height="3.92" x="40.5" y="33.923" fill="#000" rx="1.96"/><rect width="40" height="3.92" x="40.5" y="45.043" fill="#D5D5D5" rx="1.96"/><rect width="40" height="3.92" x="40.5" y="56.163" fill="#D5D5D5" rx="1.96"/><rect width="40" height="3.92" x="40.5" y="67.283" fill="#D5D5D5" rx="1.96"/><rect width="40" height="3.92" x="40.5" y="78.402" fill="#D5D5D5" rx="1.96"/><g filter="url(#e)"><path fill="#fff" d="M115.759 19.07H91.727c-1.12 0-2.028.955-2.028 2.133v11.888c0 1.178.908 2.134 2.028 2.134h24.032c1.12 0 2.028-.956 2.028-2.134V21.203c0-1.178-.908-2.134-2.028-2.134Z"/></g><path fill="#CCC6D9" d="M95.7 29.7a2.4 2.4 0 1 0 0-4.8 2.4 2.4 0 0 0 0 4.8Z"/><rect width="12.8" height="4.8" x="101.301" y="24.9" fill="#D5D5D5" rx="2.4"/><path fill="#CCC6D9" d="M74.547 40.726c13.807 0 25 11.193 25 25 0 5.39-1.706 10.38-4.608 14.463l15.709 14.998-5.903 6.849-16.281-15.54a24.884 24.884 0 0 1-13.917 4.23c-13.807 0-25-11.194-25-25 0-13.807 11.193-25 25-25Zm.157 3.834c-11.69 0-21.165 9.476-21.165 21.166 0 11.689 9.476 21.165 21.165 21.165 11.69 0 21.165-9.476 21.165-21.165 0-11.69-9.476-21.165-21.165-21.166Z"/><foreignObject width="50" height="49.6" x="49.7" y="40.901"><div xmlns="http://www.w3.org/1999/xhtml" style="backdrop-filter:blur(1.6px);clip-path:url(#f);height:100%;width:100%"/></foreignObject><path fill="#fff" fill-opacity=".3" d="M74.7 87.3c12.04 0 21.8-9.67 21.8-21.6 0-11.929-9.76-21.6-21.8-21.6-12.04 0-21.8 9.671-21.8 21.6 0 11.93 9.76 21.6 21.8 21.6Z" data-figma-bg-blur-radius="3.2"/><path fill="#000" d="m78.471 65.7 5.276-5.255a2.738 2.738 0 0 0-.055-3.83 2.773 2.773 0 0 0-3.853-.054l-5.288 5.255-5.275-5.255a2.765 2.765 0 0 0-1.97-.86 2.78 2.78 0 0 0-1.994.804 2.746 2.746 0 0 0-.81 1.982 2.737 2.737 0 0 0 .866 1.958l5.284 5.255-5.284 5.255a2.748 2.748 0 0 0-.866 1.959 2.733 2.733 0 0 0 .81 1.981 2.766 2.766 0 0 0 1.994.805 2.778 2.778 0 0 0 1.97-.86l5.287-5.256 5.288 5.256a2.774 2.774 0 0 0 3.785-.122 2.74 2.74 0 0 0 .11-3.763L78.472 65.7Z"/><path fill="#E1DCEB" d="m104.742 102.037 5.904-6.85.89.849a4.73 4.73 0 0 1 1.436 3.199 4.771 4.771 0 0 1-1.134 3.33 4.31 4.31 0 0 1-3.04 1.512 4.265 4.265 0 0 1-3.164-1.194l-.89-.848-.002.002Z"/><path fill="#000" fillRule="evenodd" d="M23.027 36.968a7.59 7.59 0 0 0-.223-1.725c-.502-2.032-2.74-3.338-5.124-3.644-2.382-.307-4.86.391-5.814 2.16-.546 1.01-.622 1.882-.399 2.616.223.731.75 1.337 1.465 1.809 1.996 1.315 5.49 1.583 7.084 1.034a17.87 17.87 0 0 0 2.16-.913c-.402 2.298-1.896 4.476-3.89 6.438-4.335 4.264-11.06 7.5-14.723 8.69a.393.393 0 0 0-.245.488.37.37 0 0 0 .467.257c3.735-1.213 10.592-4.519 15.012-8.868 2.283-2.246 3.91-4.775 4.188-7.433 5.162-2.88 9.401-8.107 13.025-12.505a.402.402 0 0 0-.04-.55.363.363 0 0 0-.526.042c-3.476 4.218-7.51 9.236-12.417 12.104Zm-.75.418a6.814 6.814 0 0 0-.196-1.949c-.434-1.76-2.43-2.8-4.492-3.065-1.265-.163-2.565-.029-3.585.447-.641.3-1.17.733-1.488 1.323-.418.774-.508 1.436-.337 1.997.172.566.597 1.02 1.152 1.385 1.818 1.199 5 1.454 6.45.953a17.558 17.558 0 0 0 2.495-1.09Z" clip-rule="evenodd"/><circle cx="114.5" cy="74.1" r="2.4" fill="#E3E3E3"/><path fill="#CCC6D9" fillRule="evenodd" d="M23.854 90.658c.428-.16.88-.374 1.227-.683.413-.367.58-.84.693-1.338.145-.639.203-1.32.378-1.96.065-.238.19-.328.244-.368a.576.576 0 0 1 .402-.118.583.583 0 0 1 .5.343c.02.038.046.097.063.178.013.059.02.243.034.32.033.187.061.375.087.563.087.628.137 1.161.412 1.738.372.783.745 1.261 1.251 1.474.49.205 1.075.166 1.822.005.071-.018.142-.033.211-.046.33-.06.645.167.71.513.065.345-.145.681-.472.757a8.35 8.35 0 0 1-.201.045c-1.01.263-2.18 1.203-2.86 2.025-.21.254-.516.963-.829 1.415-.23.334-.49.554-.708.631a.628.628 0 0 1-.735-.239.746.746 0 0 1-.121-.296 2.315 2.315 0 0 1-.012-.283c-.064-.231-.142-.457-.199-.69-.135-.555-.402-.907-.718-1.372a2.5 2.5 0 0 0-1.078-.926 8.2 8.2 0 0 1-.722-.214.785.785 0 0 1-.416-.379.761.761 0 0 1-.067-.422.702.702 0 0 1 .229-.444.789.789 0 0 1 .367-.183c.126-.028.461-.044.508-.046Zm2.867-.906c.022.053.046.107.072.16.545 1.147 1.155 1.787 1.897 2.098l.025.01c-.496.388-.945.82-1.288 1.236-.142.171-.329.526-.53.89-.185-.628-.485-1.072-.862-1.627a3.744 3.744 0 0 0-.963-1.004c.289-.156.564-.338.803-.55.399-.355.662-.766.846-1.213Z" clip-rule="evenodd"/></g><defs><linearGradient id="b" x1="60.13" x2="61.113" y1="-3.53" y2="165.038" gradientUnits="userSpaceOnUse"><stop stopColor="#F2F2F2"/><stop offset="1" stopColor="#EFEFEF"/></linearGradient><linearGradient id="d" x1="61.007" x2="61.007" y1="25.923" y2="87.934" gradientUnits="userSpaceOnUse"><stop stopColor="#fff"/><stop offset=".719" stopColor="#FAFAFA"/></linearGradient><clipPath id="f" transform="translate(-49.7 -40.9)"><path d="M74.7 87.3c12.04 0 21.8-9.67 21.8-21.6 0-11.929-9.76-21.6-21.8-21.6-12.04 0-21.8 9.671-21.8 21.6 0 11.93 9.76 21.6 21.8 21.6Z"/></clipPath><clipPath id="a"><path fill="#fff" d="M.5.5h120v120H.5z"/></clipPath><filter id="c" width="73.814" height="86.012" x="24.1" y="21.923" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feColorMatrix in="SourceAlpha" result="hardAlpha" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"/><feOffset dy="8"/><feGaussianBlur stdDeviation="6"/><feComposite in2="hardAlpha" operator="out"/><feColorMatrix values="0 0 0 0 0.570833 0 0 0 0 0.570833 0 0 0 0 0.570833 0 0 0 0.19 0"/><feBlend in2="BackgroundImageFix" result="effect1_dropShadow_10845_63786"/><feBlend in="SourceGraphic" in2="effect1_dropShadow_10845_63786" result="shape"/></filter><filter id="e" width="38.488" height="26.555" x="86.899" y="15.469" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feColorMatrix in="SourceAlpha" result="hardAlpha" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"/><feOffset dx="2.4" dy="1.6"/><feGaussianBlur stdDeviation="2.6"/><feComposite in2="hardAlpha" operator="out"/><feColorMatrix values="0 0 0 0 0.104618 0 0 0 0 0.465612 0 0 0 0 0.545833 0 0 0 0.09 0"/><feBlend in2="BackgroundImageFix" result="effect1_dropShadow_10845_63786"/><feBlend in="SourceGraphic" in2="effect1_dropShadow_10845_63786" result="shape"/></filter></defs></svg>`}} />
          </div>
          <div className="text-black font-semibold mb-1">Nothing here yet ...</div>
          <div className="text-gray-500 text-sm">whoops there's no information available yet</div>
        </div>
      )}
    </div>
  );
}