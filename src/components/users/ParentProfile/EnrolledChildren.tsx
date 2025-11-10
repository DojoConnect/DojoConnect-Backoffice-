import { FaEllipsisV } from 'react-icons/fa';


export default function EnrolledChildren({ childrenData }) {
  const hasChildren = childrenData.length > 0;

  return (
    <div>
      <div className="flex items-center justify-between bg-gray-100 rounded-md px-6 py-4 mb-4">
        <span className="text-black font-semibold text-base">
          Enrolled children ({hasChildren ? childrenData.length : 0})
        </span>
        <button
          className="text-[#E51B1B] font-medium text-sm bg-transparent border-none shadow-none"
          type="button"
        >
          Add new
        </button>
      </div>
      {hasChildren ? (
        <div className="bg-white rounded-md p-4 flex flex-col gap-4">
          {childrenData.map((child, i) => (
            <div key={i} className="flex items-center justify-between bg-gray-100 rounded-md px-4 py-3">
              <div className="flex items-center gap-4">
                <img
                  src={child.img}
                  alt={child.name}
                  className="w-10 h-10 rounded-full object-cover"
                  onError={e => (e.currentTarget.src = '/Avatar.jpg')}
                />
                <div>
                  <div className="text-black font-medium">{child.name}</div>
                  <div className="text-gray-500 text-sm">{child.email}</div>
                </div>
              </div>
              <span className="text-gray-400 text-xl cursor-pointer">
                <FaEllipsisV className="rotate-90" />
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-md p-6 flex flex-col items-center justify-center min-h-[320px]">
          <div className="mb-4">
            {/* eslint-disable-next-line */}
            <span dangerouslySetInnerHTML={{__html: `<svg xmlns="http://www.w3.org/2000/svg" width="121" height="121" fill="none"><path fill="url(#a)" d="M58.338 105.7c25.353 0 45.905-20.326 45.905-45.4 0-25.073-20.552-45.4-45.905-45.4-25.352 0-45.904 20.327-45.904 45.4 0 25.074 20.552 45.4 45.904 45.4Z"/><path fill="#E3E3E3" fillRule="evenodd" d="M97.945 89.24c.419-.147.859-.343 1.198-.627.404-.337.568-.77.678-1.227.141-.587.198-1.212.369-1.8.063-.218.186-.3.238-.338a.587.587 0 0 1 .392-.108c.15.011.355.067.49.315.019.035.044.089.061.163.012.054.02.224.033.294.032.172.059.344.085.517.085.576.134 1.065.402 1.595.363.718.728 1.158 1.222 1.353.478.188 1.05.153 1.78.005a3.21 3.21 0 0 1 .206-.043.595.595 0 0 1 .233 1.166 9.357 9.357 0 0 1-.198.041c-.986.242-2.129 1.104-2.792 1.859-.205.233-.504.883-.81 1.299-.226.306-.479.508-.692.58a.63.63 0 0 1-.362.015.614.614 0 0 1-.356-.235.661.661 0 0 1-.118-.272 2.004 2.004 0 0 1-.012-.26c-.062-.212-.138-.419-.194-.633-.132-.51-.392-.833-.7-1.26-.29-.398-.6-.65-1.054-.85a8.426 8.426 0 0 1-.705-.196.748.748 0 0 1-.406-.347.66.66 0 0 1-.066-.388.631.631 0 0 1 .223-.407.79.79 0 0 1 .359-.168c.123-.026.45-.04.496-.043Zm2.8-.831c.022.049.046.098.071.147.533 1.053 1.128 1.64 1.852 1.925l.025.01a8.025 8.025 0 0 0-1.258 1.134c-.138.157-.321.483-.519.817-.179-.576-.472-.984-.841-1.494a3.54 3.54 0 0 0-.94-.921c.282-.143.55-.31.784-.506.39-.325.647-.702.826-1.112Z" clip-rule="evenodd"/><ellipse cx="6.274" cy="51.453" fill="#E3E3E3" rx="2.174" ry="2.15"/><path fill="#000" stroke="#000" strokeWidth=".4" d="M22.271 26.778a.633.633 0 0 0-.872.189.629.629 0 0 0 .19.872c1.66 1.06 2.742 2.525 3.293 4.403a.632.632 0 0 0 .658.451l.126-.023a.63.63 0 0 0 .43-.782c-.638-2.175-1.9-3.88-3.825-5.11Z"/><path fill="#000" stroke="#000" strokeWidth=".4" d="M52.999 25.759c-3.413-1.55-7.266-.312-9.16 2.842a9.607 9.607 0 0 0-.879-.702c-3.53-2.49-8.687-1.66-12.605 2-.633.59-1.125 1.453-1.505 2.47-.382 1.018-.656 2.205-.844 3.458-.36 2.4-.426 5.064-.406 7.215a39.156 39.156 0 0 0-1.347-2.791c-2.466-4.686-4.893-9.677-8.98-13.286l-.105-.074a.633.633 0 0 0-.787.127.628.628 0 0 0 .053.89c3.94 3.48 6.267 8.31 8.698 12.929.76 1.445 1.443 2.886 1.97 4.422.12.348.24.689.348 1.032l.105.345v.065l-.006.072-.005.088v.002c-.004.151.002.313.035.44h.001a.753.753 0 0 0 .379.488l.001.001c.13.067.29.103.481.07l.002-.002a.613.613 0 0 0 .473-.38.503.503 0 0 0 .027-.1 1.69 1.69 0 0 0 .017-.132c.01-.104.016-.243.012-.415-.039-1.343-.313-5.878.168-9.936.154-1.303.378-2.551.715-3.613.337-1.065.783-1.922 1.365-2.466 3.492-3.26 7.98-4.024 11.008-1.89.383.27.742.571 1.072.901a5.349 5.349 0 0 0-.088 1.046c.006.425.06.876.2 1.242.146.384.385.694.712.856.343.17.773.187 1.277-.068h.001c.434-.22.59-.64.55-1.088-.035-.41-.253-.866-.37-1.074-.241-.422-.52-.82-.83-1.192 1.497-2.822 4.8-3.971 7.722-2.645a.636.636 0 0 0 .839-.31v-.001a.63.63 0 0 0-.314-.836Zm-8.462 5.718c.05.1.106.226.137.35-.004-.006-.012-.01-.018-.02a.856.856 0 0 1-.06-.135 1.616 1.616 0 0 1-.059-.195Z"/><rect width="79.023" height="28.173" x="37.152" y="38.455" fill="#000" rx="9.6"/><rect width="26.647" height="3.695" x="69.772" y="48.153" fill="#CCC6D9" rx="1.847"/><rect width="52.51" height="3.695" x="44.043" y="53.695" fill="#fff" rx="1.847"/><ellipse cx="106.067" cy="52.772" fill="#E1DCEB" rx="4.594" ry="4.619"/><rect width="79.023" height="28.173" x="4.1" y="62.01" fill="#E1DCEB" rx="9.6"/><rect width="26.647" height="3.695" x="23.855" y="71.709" fill="#000" rx="1.847"/><rect width="52.51" height="3.695" x="23.855" y="77.251" fill="#fff" rx="1.847"/><ellipse cx="15.586" cy="76.328" fill="#CCC6D9" rx="4.594" ry="4.619"/><defs><linearGradient id="a" x1="57.984" x2="58.904" y1=".117" y2="159.555" gradientUnits="userSpaceOnUse"><stop stopColor="#F2F2F2"/><stop offset="1" stopColor="#EFEFEF"/></linearGradient></defs></svg>`}} />
          </div>
          <div className="text-black font-semibold mb-1">Nothing here yet ...</div>
          <div className="text-gray-500 text-sm">whoops there's no information available yet</div>
        </div>
      )}
    </div>
  );
}